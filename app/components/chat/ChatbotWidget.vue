<template>
  <Teleport to="body">
    <div v-if="config.enabled" class="chatbot-root">
      <transition name="chatbot-fade">
        <section v-if="open" class="chatbot-panel" role="dialog" aria-label="和博主聊聊">
          <header class="chatbot-header">
            <div class="chatbot-heading">
              <img :src="avatar || logoUrl" :alt="displayName" class="chatbot-avatar" />
              <div class="chatbot-heading-copy">
                <span class="chatbot-kicker">来聊两句</span>
                <strong>{{ displayName }}</strong>
              </div>
            </div>
            <button type="button" class="chatbot-close" aria-label="关闭对话" @click="open = false">×</button>
          </header>

          <div ref="messageList" class="chatbot-messages" aria-live="polite">
            <div v-for="(item, index) in messages" :key="`${item.role}-${index}`" class="chatbot-message-row" :class="item.role">
              <div class="chatbot-message">
                <p>{{ item.content }}</p>
                <div v-if="item.sources?.length" class="chatbot-sources">
                  <span>顺手看看</span>
                  <a v-for="source in item.sources" :key="source.slug" :href="source.url">{{ source.title }}</a>
                </div>
              </div>
            </div>
            <div v-if="sending && !messages.some(item => item.streaming)" class="chatbot-message-row assistant">
              <div class="chatbot-message chatbot-typing"><i></i><i></i><i></i></div>
            </div>
          </div>

          <div v-if="!messages.some(item => item.role === 'user') && suggestions.length" class="chatbot-suggestions">
            <button v-for="suggestion in suggestions" :key="suggestion" type="button" @click="send(suggestion)">
              {{ suggestion }}
            </button>
          </div>

          <p v-if="errorMessage" class="chatbot-error">{{ errorMessage }}</p>
          <form class="chatbot-input-row" @submit.prevent="send()">
            <textarea
              v-model="draft"
              rows="1"
              maxlength="1000"
              :disabled="sending"
              placeholder="和我聊聊……"
              aria-label="聊天内容"
              @keydown.enter.exact.prevent="send()"
            />
            <button type="submit" :disabled="sending || !draft.trim()" aria-label="发送">发送</button>
          </form>
        </section>
      </transition>

      <button
        v-if="!open"
        type="button"
        class="chatbot-launcher"
        :aria-label="`打开${displayName}的聊天窗口`"
        @click="open = true"
      >
        <img :src="avatar || logoUrl" :alt="displayName" />
        <b>来聊两句</b>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { getChatbotConfig, streamChatbotMessage } from '~/services/api/chatbot'
import type { ChatbotMessage, PublicChatbotConfig } from '~/services/api/chatbot'
import { proxyImageUrl } from '~/utils/image'
import logoUrl from '~/assets/img/logo-sheep.png'

const STORAGE_KEY = 'blog-chatbot-session-v2'

const route = useRoute()
const open = ref(false)
const sending = ref(false)
const draft = ref('')
const errorMessage = ref('')
const messageList = ref<HTMLElement | null>(null)
const config = reactive<PublicChatbotConfig>({
  enabled: false,
  display_name: '博主',
  avatar: '',
  welcome: '',
  identity_notice: '',
  suggestions: []
})
const messages = ref<ChatbotMessage[]>([])
const sessionId = ref('')

const displayName = computed(() => config.display_name || '博主')
const avatar = computed(() => proxyImageUrl(config.avatar))
const suggestions = computed(() => (config.suggestions || []).filter(Boolean).slice(0, 4))
const articleSlug = computed(() => {
  const slug = route.params.slug
  return route.path.startsWith('/article/') && typeof slug === 'string' ? slug : ''
})

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const saveSession = () => {
  if (!import.meta.client) return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessionId: sessionId.value,
      messages: messages.value.map(({ role, content, sources }) => ({ role, content, sources }))
    }))
  } catch {
    // sessionStorage 不可用时仍允许当前页面内聊天。
  }
}

const loadSession = () => {
  if (!import.meta.client) return
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (typeof saved.sessionId === 'string') sessionId.value = saved.sessionId
    if (Array.isArray(saved.messages)) {
      messages.value = saved.messages.filter((item: unknown): item is ChatbotMessage => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as Record<string, unknown>
        return (candidate.role === 'user' || candidate.role === 'assistant') && typeof candidate.content === 'string'
      })
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

const addWelcomeMessages = () => {
  if (messages.value.length > 0) return
  messages.value.push({ role: 'assistant', content: config.welcome || '嗨，来啦。想聊点什么？' })
  saveSession()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageList.value) messageList.value.scrollTop = messageList.value.scrollHeight
  })
}

const errorText = (error: unknown) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }
  return error instanceof Error ? error.message : '暂时没有连上我，请稍后再试。'
}

const send = async (preset?: string) => {
  const content = (preset || draft.value).trim()
  if (!content || sending.value || content.length > 1000) return
  draft.value = ''
  errorMessage.value = ''
  messages.value.push({ role: 'user', content })
  sending.value = true
  scrollToBottom()

  try {
    const response = await streamChatbotMessage({
      session_id: sessionId.value,
      message: content,
      history: messages.value
        .filter(item => item.role === 'user' || item.role === 'assistant')
        .slice(-9, -1)
        .map(({ role, content: message }) => ({ role, content: message })),
      page_context: {
        path: route.fullPath,
        article_slug: articleSlug.value
      }
    }, (delta) => {
      const lastMessage = messages.value[messages.value.length - 1]
      if (lastMessage?.role === 'assistant' && lastMessage.streaming) {
        lastMessage.content += delta
      } else {
        messages.value.push({ role: 'assistant', content: delta, streaming: true })
      }
      scrollToBottom()
    })
    const lastMessage = messages.value[messages.value.length - 1]
    if (!response.reply) throw new Error('暂时没有收到回复。')
    if (lastMessage?.role === 'assistant' && lastMessage.streaming) {
      lastMessage.streaming = false
      lastMessage.sources = response.sources || []
    } else {
      messages.value.push({ role: 'assistant', content: response.reply, sources: response.sources || [] })
    }
    saveSession()
  } catch (error) {
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.streaming) messages.value.pop()
    errorMessage.value = errorText(error)
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

watch(messages, saveSession, { deep: true })
watch(open, (value) => {
  if (value) {
    addWelcomeMessages()
    scrollToBottom()
  }
})

onMounted(async () => {
  sessionId.value = createSessionId()
  loadSession()
  try {
    const response = await getChatbotConfig()
    if (response.code === 0 && response.data) {
      Object.assign(config, response.data)
      config.avatar = proxyImageUrl(config.avatar)
      if (open.value) addWelcomeMessages()
    }
  } catch {
    config.enabled = false
  }
})
</script>

<style scoped lang="scss">
.chatbot-root {
  position: relative;
  z-index: 120;
}

.chatbot-launcher {
  position: fixed;
  right: 28px;
  bottom: 28px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px 12px 5px 5px;
  border: 1px solid var(--home-border, rgba(129, 131, 255, .24));
  border-radius: 15px;
  color: var(--home-text, var(--text-primary));
  background: var(--home-card-bg, var(--bg-secondary, #fff));
  box-shadow: var(--home-shadow, 0 8px 28px rgba(0, 0, 0, .12));
  cursor: pointer;
  font: inherit;
  transition: transform .25s var(--ease-out-expo, ease), border-color .25s ease, box-shadow .25s ease;

  &:hover,
  &:focus-visible {
    border-color: var(--home-border, rgba(129, 131, 255, .24));
    box-shadow: var(--home-shadow, 0 10px 28px rgba(20, 20, 50, .12));
    transform: translateY(-3px);
  }

  &:focus-visible {
    outline: 2px solid var(--home-text-muted, #999);
    outline-offset: 3px;
  }

  img {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
  }

  b { font-size: 13px; font-weight: 500; }
}

.chatbot-panel {
  position: fixed;
  right: 28px;
  bottom: 28px;
  display: flex;
  flex-direction: column;
  width: min(390px, calc(100vw - 32px));
  height: min(650px, calc(100vh - 56px));
  overflow: hidden;
  border: 1px solid var(--home-border, var(--border-color, rgba(129, 131, 255, .2)));
  border-radius: 15px;
  color: var(--home-text, var(--text-primary));
  background: var(--home-surface, var(--bg-secondary, #fff));
  box-shadow: 0 18px 54px rgba(29, 31, 65, .18);
}

.chatbot-header { display: flex; align-items: center; justify-content: space-between; padding: 15px 16px; border-bottom: 1px solid var(--home-border, var(--border-color, #eee)); color: var(--home-text, var(--text-primary)); background: var(--home-card-bg, var(--bg-secondary, #fff)); }
.chatbot-heading { display: flex; align-items: center; gap: 10px; }
.chatbot-heading-copy { display: flex; flex-direction: column; gap: 2px; }
.chatbot-kicker { color: var(--brand-accent, #8183ff); font-size: 10px; letter-spacing: .14em; line-height: 1.2; }
.chatbot-heading strong { font-size: 16px; font-weight: 600; }
.chatbot-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.chatbot-close { width: 30px; height: 30px; border: 0; border-radius: 50%; color: var(--home-text-muted, #999); background: transparent; font-size: 24px; line-height: 1; cursor: pointer; transition: color .2s ease, background .2s ease; }
.chatbot-close:hover, .chatbot-close:focus-visible { color: var(--brand-accent, #8183ff); background: var(--brand-accent-soft, rgba(129, 131, 255, .1)); }
.chatbot-close:focus-visible { outline: 2px solid var(--brand-accent, #8183ff); outline-offset: 2px; }
.chatbot-messages { flex: 1; overflow-y: auto; padding: 18px 13px; background: var(--home-surface, var(--bg-primary, #f8f8fb)); }
.chatbot-message-row { display: flex; margin-bottom: 11px; }
.chatbot-message-row.user { justify-content: flex-end; }
.chatbot-message { max-width: 85%; padding: 10px 12px; border: 1px solid var(--home-border, var(--border-color, #eee)); border-radius: 14px 14px 14px 4px; color: var(--home-text, var(--text-primary)); background: var(--home-card-bg, var(--bg-secondary, #fff)); box-shadow: var(--home-shadow, 0 2px 8px rgba(20, 20, 50, .05)); }
.chatbot-message-row.user .chatbot-message { border-color: var(--brand-accent, #8183ff); border-radius: 14px 14px 4px 14px; color: #fff; background: var(--brand-accent, #8183ff); }
.chatbot-message p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.7; }
.chatbot-sources { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; padding-top: 7px; border-top: 1px solid var(--home-border, rgba(129, 131, 255, .15)); font-size: 11px; }
.chatbot-sources span { color: var(--home-text-muted, #999); }
.chatbot-sources a { color: var(--brand-accent, #8183ff); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chatbot-sources a:hover { text-decoration: underline; }
.chatbot-typing { display: flex; gap: 4px; padding: 14px; }
.chatbot-typing i { width: 5px; height: 5px; border-radius: 50%; background: var(--brand-accent, #8183ff); animation: chatbot-bounce 1s infinite ease-in-out; }
.chatbot-typing i:nth-child(2) { animation-delay: .15s; }.chatbot-typing i:nth-child(3) { animation-delay: .3s; }
@keyframes chatbot-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .45; } 40% { transform: translateY(-4px); opacity: 1; } }
.chatbot-suggestions { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 13px 10px; background: var(--home-surface, var(--bg-primary, #f8f8fb)); }
.chatbot-suggestions button { max-width: 100%; padding: 7px 9px; overflow: hidden; border: 1px solid var(--home-border, rgba(129, 131, 255, .3)); border-radius: 5px; color: var(--home-text, var(--text-primary)); background: var(--home-card-alt, transparent); cursor: pointer; font: inherit; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; transition: border-color .2s ease, color .2s ease, background .2s ease; }
.chatbot-suggestions button:hover, .chatbot-suggestions button:focus-visible { border-color: var(--brand-accent, #8183ff); color: var(--brand-accent, #8183ff); background: var(--brand-accent-soft, rgba(129, 131, 255, .08)); }
.chatbot-suggestions button:focus-visible { outline: 2px solid var(--brand-accent, #8183ff); outline-offset: 2px; }
.chatbot-input-row { display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--home-border, var(--border-color, #eee)); background: var(--home-card-bg, var(--bg-secondary, #fff)); }
.chatbot-input-row textarea { flex: 1; min-height: 36px; padding: 7px 9px; resize: none; border: 1px solid var(--home-border, var(--border-color, #eee)); border-radius: 8px; outline: 0; color: var(--home-text, var(--text-primary)); background: var(--home-card-alt, transparent); font: inherit; font-size: 13px; line-height: 1.5; }
.chatbot-input-row textarea:focus { border-color: var(--brand-accent, #8183ff); box-shadow: 0 0 0 3px var(--brand-accent-soft, rgba(129, 131, 255, .1)); }
.chatbot-input-row button { align-self: flex-end; padding: 8px 12px; border: 0; border-radius: 8px; color: #fff; background: var(--brand-accent, #8183ff); cursor: pointer; font: inherit; font-size: 12px; transition: background .2s ease, transform .2s ease; }
.chatbot-input-row button:not(:disabled):hover { background: var(--brand-accent-hover, #6b6de6); transform: translateY(-1px); }
.chatbot-input-row button:disabled { cursor: not-allowed; opacity: .45; }
.chatbot-error { margin: 0; padding: 6px 13px 0; color: #d9534f; background: var(--home-card-bg, var(--bg-secondary, #fff)); font-size: 11px; }
.chatbot-fade-enter-active, .chatbot-fade-leave-active { transition: opacity .2s ease, transform .2s ease; }
.chatbot-fade-enter-from, .chatbot-fade-leave-to { opacity: 0; transform: translateY(12px) scale(.98); }

@media (max-width: 768px) {
  .chatbot-launcher { right: 16px; bottom: 16px; }
  .chatbot-panel { right: 0; bottom: 0; width: 100vw; height: min(78vh, 680px); border-radius: 15px 15px 0 0; }
}
</style>

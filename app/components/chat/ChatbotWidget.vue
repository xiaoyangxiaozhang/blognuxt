<template>
  <Teleport to="body">
    <div v-if="config.enabled" class="chatbot-root">
      <transition name="chatbot-fade">
        <section
          v-show="open"
          ref="panel"
          class="chatbot-panel"
          :class="{ 'is-dragging': dragging }"
          :style="{ translate: `${position.x}px ${position.y}px` }"
          role="dialog"
          aria-label="和博主聊聊"
          tabindex="-1"
          @keydown.esc.stop="open = false"
        >
          <header
            class="chatbot-header"
            title="拖动以移动对话框，手机下滑可收起"
            @pointerdown="startDrag"
            @pointermove="moveDrag"
            @pointerup="endDrag"
            @pointercancel="cancelDrag"
            @lostpointercapture="cancelDrag"
          >
            <div class="chatbot-heading">
              <img v-bind="avatar ? optimizedImageAttrs(avatar, [128], '44px') : { src: logoUrl, decoding: 'async' }" :alt="displayName" class="chatbot-avatar" :class="{ 'is-default': !avatar }" />
              <div class="chatbot-heading-copy">
                <span class="chatbot-kicker">{{ isOwner ? '查评论、拟回复，发布由你确认' : '来聊两句' }}</span>
                <strong>{{ displayName }}</strong>
              </div>
            </div>
            <button type="button" class="chatbot-close" aria-label="关闭对话" @click="open = false">
              <Cross1Icon aria-hidden="true" />
            </button>
          </header>

          <div ref="messageList" class="chatbot-messages" aria-live="polite">
            <div v-for="(item, index) in messages" :key="`${item.role}-${index}`" class="chatbot-message-row" :class="item.role">
              <div class="chatbot-message" :class="{ 'has-tool-result': isOwner && (item.comments || item.replyDraft) }">
                <ChatbotReply v-if="item.role === 'assistant' && item.content" :content="item.content" :animate="!!item.streaming" />
                <p v-else-if="item.content">{{ item.content }}</p>
                <div v-if="isOwner && item.comments" class="chatbot-comments">
                  <p class="chatbot-comments-heading">{{ item.comments.items.length ? `找到 ${item.comments.total} 条评论` : '没有找到符合条件的评论' }}</p>
                  <ol v-if="item.comments.items.length">
                    <li v-for="(comment, commentIndex) in item.comments.items" :key="comment.id">
                      <div class="chatbot-comment-meta"><strong>{{ commentIndex + 1 }}. {{ comment.nickname }}</strong><span>{{ comment.target_title }}</span></div>
                      <p>{{ comment.content }}</p>
                      <div class="chatbot-comment-actions">
                        <button type="button" :disabled="interactionBusy" @click="selectComment(comment)">{{ selectedComment?.id === comment.id ? '为这条拟回复' : '选这条拟回复' }}</button>
                        <a v-if="safeChatbotURL(comment.url)" :href="safeChatbotURL(comment.url)" target="_blank" rel="noopener noreferrer">查看所在页面</a>
                      </div>
                    </li>
                  </ol>
                  <button v-if="item.comments.query && item.comments.page * item.comments.page_size < item.comments.total" type="button" class="chatbot-more-comments" :disabled="interactionBusy" @click="send('继续查看下一页评论', item.comments)">继续查看</button>
                </div>
                <ChatbotReplyDraft
                  v-if="isOwner && item.replyDraft"
                  :draft="item.replyDraft"
                  :verified="verifiedDrafts.has(item.replyDraft.id)"
                  :busy="busyDraftId === item.replyDraft.id"
                  :disabled="sending || (!!busyDraftId && busyDraftId !== item.replyDraft.id)"
                  :uncertain="uncertainPublishes.has(item.replyDraft.id)"
                  :error="draftErrors[item.replyDraft.id]"
                  @save="saveReply(item.replyDraft, $event)"
                  @publish="publishReply(item.replyDraft)"
                  @cancel="cancelReply(item.replyDraft)"
                  @recheck="recheckDraft(item.replyDraft.id)"
                  @dirty="setDraftDirty(item.replyDraft.id, $event)"
                />
                <div v-if="item.sources?.length" class="chatbot-sources">
                  <span>顺手看看</span>
                  <a v-for="source in item.sources" :key="source.slug" :href="source.url">{{ source.title }}</a>
                </div>
              </div>
            </div>
            <div v-if="sending && !messages.some(item => item.streaming)" class="chatbot-message-row assistant">
              <div class="chatbot-message chatbot-typing" role="status" :aria-label="agentStatus || '正在回复'"><span v-if="agentStatus">{{ agentStatus }}</span><template v-else><i></i><i></i><i></i></template></div>
            </div>
          </div>

          <div v-if="!messages.some(item => item.role === 'user') && suggestions.length" class="chatbot-suggestions">
            <button v-for="suggestion in suggestions" :key="suggestion" type="button" :disabled="interactionBusy" @click="send(suggestion)">
              {{ suggestion }}
            </button>
          </div>

          <div class="chatbot-notice-slot">
            <transition name="chatbot-notice">
              <p v-if="errorMessage" class="chatbot-error" role="status">{{ errorMessage }}</p>
            </transition>
          </div>
          <form class="chatbot-input-row" @submit.prevent="send()">
            <label for="chatbot-draft" class="chatbot-input-label">{{ isOwner ? '聊聊，或交代一件事' : '聊点什么' }}</label>
            <textarea
              id="chatbot-draft"
              v-model="draft"
              rows="1"
              maxlength="1000"
              :disabled="interactionBusy"
              :placeholder="isOwner ? '查评论、修改草稿，或和我聊聊……' : '和我聊聊……'"
              aria-label="聊天内容"
              aria-describedby="chatbot-input-hint"
              @keydown.enter.exact="handleInputKeydown"
            />
            <button type="submit" :disabled="interactionBusy || !draft.trim()" aria-label="发送">
              <PaperPlaneIcon aria-hidden="true" />
              <span>发送</span>
            </button>
            <div id="chatbot-input-hint" class="chatbot-input-hint">
              <span>Enter 发送 · Shift + Enter 换行</span>
              <span class="chatbot-input-count">{{ draft.length }} / 1000</span>
            </div>
          </form>
        </section>
      </transition>

      <button
        v-if="!open"
        ref="launcher"
        type="button"
        class="chatbot-launcher"
        :aria-label="`打开${displayName}的聊天窗口`"
        @click="open = true"
      >
        <span class="chatbot-launcher-mark" aria-hidden="true" />
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Cross1Icon, PaperPlaneIcon } from '~/utils/siteIcons'
import { cancelReplyDraft, getChatbotConfig, getReplyDraft, publishReplyDraft, safeChatbotURL, streamChatbotMessage, updateReplyDraft } from '~/services/api/chatbot'
import type { AgentComment, AgentCommentPage, AgentCommentQuery, AgentReplyDraft, ChatbotMessage, PublicChatbotConfig } from '~/services/api/chatbot'
import { useCommentAuth } from '~/composables/useCommentAuth'
import { proxyImageUrl, optimizedImageAttrs } from '~/utils/image'
import logoUrl from '~/assets/img/logo-sheep.png'
import ChatbotReply from './ChatbotReply.vue'
import ChatbotReplyDraft from './ChatbotReplyDraft.vue'

const STORAGE_KEY = 'blog-chatbot-session-v3'

const route = useRoute()
const { currentUser, isLoggedIn, authReady, restoreSession } = useCommentAuth()
const ownerId = computed(() => isLoggedIn.value && currentUser.value?.role === 'super_admin' && currentUser.value.id ? String(currentUser.value.id) : '')
const isOwner = computed(() => !!ownerId.value && config.comment_tools_enabled === true)
const identityKey = computed(() => isLoggedIn.value ? `${isOwner.value ? 'owner' : 'user'}:${currentUser.value?.id}` : 'visitor')
const open = ref(false)
const sending = ref(false)
const busyDraftId = ref('')
const interactionBusy = computed(() => sending.value || !!busyDraftId.value || !authReady.value)
const draft = ref('')
const errorMessage = ref('')
const agentStatus = ref('')
const selectedComment = ref<AgentComment | null>(null)
const commentIds = ref<number[]>([])
const commentQuery = ref<AgentCommentQuery | undefined>()
const currentDraftId = ref('')
const verifiedDrafts = reactive(new Set<string>())
const dirtyDrafts = reactive(new Set<string>())
const uncertainPublishes = reactive(new Map<string, number>())
const draftErrors = reactive<Record<string, string>>({})
let identityEpoch = 0
let loadedIdentity = ''
let mounted = false
let chatAbort: AbortController | undefined
const messageList = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const launcher = ref<HTMLButtonElement | null>(null)
const position = reactive({ x: 0, y: 0 })
const dragging = ref(false)
let drag: { id: number; x: number; y: number; startX: number; startY: number; rect: DOMRect; mobile: boolean; time: number } | null = null
let noticeTimer: ReturnType<typeof setTimeout> | undefined
const config = reactive<PublicChatbotConfig>({
  enabled: false,
  comment_tools_enabled: false,
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
const suggestions = computed(() => isOwner.value ? ['看看当前页面的最新评论', ...(config.suggestions || []).filter(Boolean)].slice(0, 4) : (config.suggestions || []).filter(Boolean).slice(0, 4))
const articleSlug = computed(() => {
  const slug = route.params.slug
  return route.path.startsWith('/article/') && typeof slug === 'string' ? slug : ''
})

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const saveSession = () => {
  if (!import.meta.client || !loadedIdentity) return
  try {
    sessionStorage.setItem(`${STORAGE_KEY}:${loadedIdentity}`, JSON.stringify({
      sessionId: sessionId.value,
      messages: messages.value.slice(-60).map(({ role, content, sources, comments, replyDraft }) => ({ role, content, sources, ...(isOwner.value ? { comments, replyDraft } : {}) })),
      ...(isOwner.value ? { commentIds: commentIds.value, commentQuery: commentQuery.value, currentDraftId: currentDraftId.value, uncertainPublishes: [...uncertainPublishes] } : {})
    }))
  } catch {
    // sessionStorage 不可用时仍允许当前页面内聊天。
  }
}

const loadSession = () => {
  if (!import.meta.client) return
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY}:${loadedIdentity}`)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (typeof saved.sessionId === 'string') sessionId.value = saved.sessionId
    if (Array.isArray(saved.messages)) {
      messages.value = saved.messages.filter((item: unknown): item is ChatbotMessage => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as Record<string, unknown>
        return (candidate.role === 'user' || candidate.role === 'assistant') && typeof candidate.content === 'string'
      }).map((item: ChatbotMessage) => ({
        role: item.role, content: item.content, sources: item.sources,
        ...(isOwner.value && item.comments && Array.isArray(item.comments.items) ? { comments: { ...item.comments, items: item.comments.items.filter(isAgentComment), query: isCommentQuery(item.comments.query) ? item.comments.query : undefined } } : {}),
        ...(isOwner.value && isReplyDraft(item.replyDraft) ? { replyDraft: item.replyDraft } : {})
      }))
    }
    if (isOwner.value) {
      commentIds.value = Array.isArray(saved.commentIds) ? saved.commentIds.filter((id: unknown) => typeof id === 'number' && Number.isSafeInteger(id) && id > 0).slice(0, 10) : []
      commentQuery.value = isCommentQuery(saved.commentQuery) ? saved.commentQuery : undefined
      currentDraftId.value = typeof saved.currentDraftId === 'string' ? saved.currentDraftId : ''
      if (Array.isArray(saved.uncertainPublishes)) {
        for (const entry of saved.uncertainPublishes) {
          if (Array.isArray(entry) && typeof entry[0] === 'string' && Number.isSafeInteger(entry[1]) && entry[1] > 0) uncertainPublishes.set(entry[0], entry[1])
        }
      }
    }
  } catch {
    sessionStorage.removeItem(`${STORAGE_KEY}:${loadedIdentity}`)
  }
}

const isAgentComment = (value: unknown): value is AgentComment => {
  if (!value || typeof value !== 'object') return false
  const item = value as AgentComment
  return Number.isSafeInteger(item.id) && item.id > 0 && typeof item.content === 'string' && typeof item.nickname === 'string' && typeof item.target_title === 'string'
}

const isCommentQuery = (value: unknown): value is AgentCommentQuery => {
  if (!value || typeof value !== 'object') return false
  const query = value as AgentCommentQuery
  return Number.isSafeInteger(query.page) && query.page > 0 && query.page <= 1000 && Number.isSafeInteger(query.page_size) && query.page_size > 0 && query.page_size <= 10 && ['', 'article', 'page', 'moment'].includes(query.target_type) && typeof query.target_key === 'string' && query.target_key.length <= 200
}

const isReplyDraft = (value: unknown): value is AgentReplyDraft => {
  if (!value || typeof value !== 'object') return false
  const item = value as AgentReplyDraft
  return typeof item.id === 'string' && Number.isSafeInteger(item.version) && item.version > 0 && typeof item.content === 'string' && typeof item.expires_at === 'string' && isAgentComment(item.comment) && ['pending', 'published', 'cancelled', 'expired', 'stale'].includes(item.status)
}

const applyReplyDraft = (value: AgentReplyDraft) => {
  if (!isReplyDraft(value)) throw new Error('草稿格式异常，请重新查询。')
  const message = messages.value.find(item => item.replyDraft?.id === value.id)
  // An earlier status refresh must not replace a newer edit.
  if (message?.replyDraft && message.replyDraft.version > value.version) return
  if (message?.replyDraft && message.replyDraft.status !== 'pending' && value.status === 'pending' && message.replyDraft.version === value.version) return
  if (message) message.replyDraft = value
  else messages.value.push({ role: 'assistant', content: '', replyDraft: value })
  verifiedDrafts.add(value.id)
  delete draftErrors[value.id]
  if (uncertainPublishes.has(value.id) && uncertainPublishes.get(value.id) !== value.version) uncertainPublishes.delete(value.id)
  if (value.status !== 'pending') {
    uncertainPublishes.delete(value.id)
    dirtyDrafts.delete(value.id)
    if (currentDraftId.value === value.id) currentDraftId.value = ''
  }
  saveSession()
}

const checkedDraft = (response: { code: number; message: string; data: AgentReplyDraft }) => {
  if (response.code !== 0 || !isReplyDraft(response.data)) throw new Error(response.message || '暂时无法读取草稿。')
  return response.data
}

const recheckDraft = async (id: string) => {
  if (!isOwner.value) return
  const epoch = identityEpoch
  verifiedDrafts.delete(id)
  try {
    const value = checkedDraft(await getReplyDraft(id))
    if (epoch !== identityEpoch) return
    applyReplyDraft(value)
  } catch (error) {
    if (epoch !== identityEpoch) return
    verifiedDrafts.delete(id)
    draftErrors[id] = errorText(error)
    if (currentDraftId.value === id) currentDraftId.value = ''
  }
}

const activateIdentity = () => {
  if (!mounted || !authReady.value || loadedIdentity === identityKey.value) return
  const previousIdentity = loadedIdentity
  identityEpoch += 1
  chatAbort?.abort()
  sending.value = false
  busyDraftId.value = ''
  agentStatus.value = ''
  draft.value = ''
  errorMessage.value = ''
  messages.value = []
  selectedComment.value = null
  commentIds.value = []
  commentQuery.value = undefined
  currentDraftId.value = ''
  verifiedDrafts.clear()
  dirtyDrafts.clear()
  uncertainPublishes.clear()
  Object.keys(draftErrors).forEach(id => { delete draftErrors[id] })
  try {
    if (previousIdentity.startsWith('owner:')) sessionStorage.removeItem(`${STORAGE_KEY}:${previousIdentity}`)
  } catch { /* Private browsing can disable storage. */ }
  loadedIdentity = identityKey.value
  sessionId.value = createSessionId()
  loadSession()
  if (open.value) addWelcomeMessages()
  if (isOwner.value) {
    for (const id of new Set(messages.value.flatMap(item => item.replyDraft ? [item.replyDraft.id] : []))) void recheckDraft(id)
  }
}

const setDraftDirty = (id: string, dirty: boolean) => {
  if (dirty) dirtyDrafts.add(id)
  else dirtyDrafts.delete(id)
}

const saveReply = async (value: AgentReplyDraft, content: string) => {
  if (!isOwner.value || interactionBusy.value || !verifiedDrafts.has(value.id) || uncertainPublishes.has(value.id)) return
  const epoch = identityEpoch
  busyDraftId.value = value.id
  try {
    const updated = checkedDraft(await updateReplyDraft(value.id, value.version, content))
    if (epoch !== identityEpoch) return
    applyReplyDraft(updated)
    dirtyDrafts.delete(value.id)
    showNotice('草稿已保存，请确认最终内容后发布。')
  } catch (error) {
    if (epoch !== identityEpoch) return
    draftErrors[value.id] = errorText(error)
    verifiedDrafts.delete(value.id)
  } finally {
    if (epoch === identityEpoch) busyDraftId.value = ''
  }
}

const publishReply = async (value: AgentReplyDraft) => {
  if (!isOwner.value || interactionBusy.value || !verifiedDrafts.has(value.id) || dirtyDrafts.has(value.id) || value.status !== 'pending') return
  const epoch = identityEpoch
  const version = uncertainPublishes.get(value.id) ?? value.version
  if (version !== value.version) {
    draftErrors[value.id] = '草稿版本已有变化，请检查状态后重新确认。'
    verifiedDrafts.delete(value.id)
    return
  }
  busyDraftId.value = value.id
  // Persist before dispatch so a reload retries this exact action and version.
  uncertainPublishes.set(value.id, version)
  saveSession()
  try {
    const published = checkedDraft(await publishReplyDraft(value.id, version))
    if (epoch !== identityEpoch) return
    applyReplyDraft(published)
    if (published.status === 'published') showNotice('回复已发布。')
  } catch (error) {
    if (epoch !== identityEpoch) return
    const message = errorText(error)
    // A failed response may follow a successful commit. Read back by action ID.
    await recheckDraft(value.id)
    if (epoch !== identityEpoch) return
    if (messages.value.some(item => item.replyDraft?.id === value.id && item.replyDraft.status === 'published')) showNotice('已确认回复发布成功。')
    else draftErrors[value.id] = message
  } finally {
    if (epoch === identityEpoch) { busyDraftId.value = ''; saveSession() }
  }
}

const cancelReply = async (value: AgentReplyDraft) => {
  if (!isOwner.value || interactionBusy.value || !verifiedDrafts.has(value.id) || uncertainPublishes.has(value.id)) return
  const epoch = identityEpoch
  busyDraftId.value = value.id
  try {
    const cancelled = checkedDraft(await cancelReplyDraft(value.id, value.version))
    if (epoch !== identityEpoch) return
    applyReplyDraft(cancelled)
    showNotice('草稿已取消。')
  } catch (error) {
    if (epoch !== identityEpoch) return
    draftErrors[value.id] = errorText(error)
    verifiedDrafts.delete(value.id)
  } finally {
    if (epoch === identityEpoch) busyDraftId.value = ''
  }
}

const selectComment = (comment: AgentComment) => {
  if (interactionBusy.value) return
  if (dirtyDrafts.size) { showNotice('请先保存或还原正在修改的草稿。'); return }
  selectedComment.value = comment
  currentDraftId.value = ''
  void send(`请为 ${comment.nickname} 的这条评论拟一份回复，先不要发布。`)
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

const startDrag = (event: PointerEvent) => {
  if (!event.isPrimary || event.button !== 0 || drag || !panel.value) return
  if ((event.target as HTMLElement).closest('button')) return
  const mobile = window.matchMedia('(max-width: 768px)').matches
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: position.x, startY: position.y, rect: panel.value.getBoundingClientRect(), mobile, time: event.timeStamp }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  dragging.value = true
}

const moveDrag = (event: PointerEvent) => {
  if (!drag || drag.id !== event.pointerId) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  position.x = drag.mobile ? 0 : drag.startX + Math.max(8 - drag.rect.left, Math.min(dx, window.innerWidth - drag.rect.right - 8))
  position.y = drag.mobile ? Math.max(0, dy) : drag.startY + Math.max(8 - drag.rect.top, Math.min(dy, window.innerHeight - drag.rect.bottom - 8))
}

const cancelDrag = () => {
  if (drag?.mobile) position.y = 0
  drag = null
  dragging.value = false
}

const endDrag = (event: PointerEvent) => {
  if (!drag || drag.id !== event.pointerId) return
  const distance = event.clientY - drag.y
  const velocity = distance / Math.max(1, event.timeStamp - drag.time)
  if (drag.mobile && (distance > 100 || (distance > 24 && velocity > .5))) open.value = false
  cancelDrag()
}

const resetPosition = () => {
  cancelDrag()
  position.x = 0
  position.y = 0
}

const showNotice = (message: string) => {
  clearTimeout(noticeTimer)
  errorMessage.value = message
  noticeTimer = setTimeout(() => { errorMessage.value = '' }, 2500)
}

const errorText = (error: unknown) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }
  return error instanceof Error ? error.message : '暂时没有连上我，请稍后再试。'
}

const handleInputKeydown = (event: KeyboardEvent) => {
  if (event.isComposing || event.keyCode === 229) return
  event.preventDefault()
  send()
}

const send = async (preset?: string, displayedPage?: AgentCommentPage) => {
  const content = (preset || draft.value).trim()
  if (!content || interactionBusy.value || Array.from(content).length > 1000) return
  if (dirtyDrafts.size) { showNotice('请先保存或还原手动修改，再让助手继续改稿。'); return }
  if (uncertainPublishes.size) { showNotice('请先核对上一条回复的发布结果。'); return }
  if (currentDraftId.value && !verifiedDrafts.has(currentDraftId.value)) { showNotice('请先检查当前草稿状态。'); return }
  const epoch = identityEpoch
  const useAgent = isOwner.value
  let replyIndex: number | undefined
  let hasToolResult = false
  chatAbort = new AbortController()
  draft.value = ''
  clearTimeout(noticeTimer)
  errorMessage.value = ''
  agentStatus.value = ''
  messages.value.push({ role: 'user', content })
  sending.value = true
  scrollToBottom()

  try {
    const response = await streamChatbotMessage({
      session_id: sessionId.value,
      message: content,
      history: messages.value
        .filter(item => item.content && (item.role === 'user' || item.role === 'assistant'))
        .slice(-9, -1)
        .map(({ role, content: message }) => ({ role, content: message })),
      page_context: {
        path: route.fullPath,
        article_slug: articleSlug.value
      },
      ...(useAgent ? {
        selected_comment_id: selectedComment.value?.id,
        comment_ids: displayedPage ? displayedPage.items.map(item => item.id).slice(0, 10) : commentIds.value,
        comment_query: displayedPage?.query ?? commentQuery.value,
        draft_id: currentDraftId.value || undefined
      } : {})
    }, (delta) => {
      if (epoch !== identityEpoch) return
      if (replyIndex === undefined) {
        replyIndex = messages.value.length
        messages.value.push({ role: 'assistant', content: delta, streaming: true })
      } else {
        messages.value[replyIndex]!.content += delta
      }
      agentStatus.value = ''
      scrollToBottom()
    }, chatAbort.signal, {
      agent: useAgent,
      onEvent: (event) => {
        if (epoch !== identityEpoch) return
        if (event.type === 'status') agentStatus.value = event.data.message
        if (event.type === 'comments') {
          const page = { ...event.data, items: event.data.items.filter(isAgentComment), query: isCommentQuery(event.data.query) ? event.data.query : undefined }
          messages.value.push({ role: 'assistant', content: '', comments: page })
          commentIds.value = page.items.map(item => item.id).slice(0, 10)
          commentQuery.value = page.query
          hasToolResult = true
        }
        if (event.type === 'draft') {
          applyReplyDraft(event.data)
          currentDraftId.value = event.data.status === 'pending' ? event.data.id : ''
          selectedComment.value = event.data.comment
          hasToolResult = true
        }
        scrollToBottom()
      }
    })
    if (epoch !== identityEpoch) return
    if (!response.reply && !hasToolResult) throw new Error('暂时没有收到回复。')
    if (replyIndex !== undefined) {
      messages.value[replyIndex]!.streaming = false
      messages.value[replyIndex]!.sources = response.sources || []
    }
    saveSession()
  } catch (error) {
    if (epoch !== identityEpoch) return
    if (replyIndex !== undefined) messages.value.splice(replyIndex, 1)
    if (!hasToolResult) draft.value = content
    showNotice(errorText(error))
  } finally {
    if (epoch === identityEpoch) {
      sending.value = false
      agentStatus.value = ''
      chatAbort = undefined
      scrollToBottom()
    }
  }
}

watch(messages, saveSession, { deep: true })
watch([identityKey, authReady], activateIdentity, { flush: 'sync' })
watch(open, async (value) => {
  if (value) {
    addWelcomeMessages()
    scrollToBottom()
  }
  await nextTick()
  if (value) panel.value?.focus({ preventScroll: true })
  else {
    cancelDrag()
    launcher.value?.focus({ preventScroll: true })
  }
})

onMounted(async () => {
  mounted = true
  window.addEventListener('resize', resetPosition)
  void restoreSession().then(activateIdentity)
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

onBeforeUnmount(() => {
  mounted = false
  identityEpoch += 1
  chatAbort?.abort()
  clearTimeout(noticeTimer)
  window.removeEventListener('resize', resetPosition)
})
</script>

<style scoped lang="scss">
.chatbot-root {
  --chat-ink: color-mix(in srgb, var(--text-primary) 94%, var(--bg-primary));
  --chat-surface: color-mix(in srgb, var(--bg-primary) 99%, var(--text-primary));
  --chat-raised: color-mix(in srgb, var(--chat-surface) 98%, var(--text-primary));
  --chat-inset: color-mix(in srgb, var(--chat-surface) 97%, var(--text-primary));
  --chat-muted: color-mix(in srgb, var(--chat-ink) 68%, var(--chat-surface));
  --chat-weight: 350;
  --chat-heading-weight: 550;
  --chat-ease: cubic-bezier(.23, 1, .32, 1);
  --chat-spring: cubic-bezier(.2, 1.5, .4, 1);
  position: relative;
  /* Above site navigation (300), below modal dialogs (600). */
  z-index: 400;
  font-weight: var(--chat-weight);
  font-variant-numeric: lining-nums tabular-nums;
  -webkit-font-smoothing: antialiased;
}

:global(:is([data-theme='blue-white'], [data-theme='paper']) .chatbot-root) {
  --chat-weight: 400;
  --chat-heading-weight: 600;
}

.chatbot-root button {
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.chatbot-root button:focus-visible,
.chatbot-sources a:focus-visible {
  outline: 2px solid var(--chat-ink);
  outline-offset: 3px;
}

.chatbot-launcher {
  position: fixed;
  right: 28px;
  bottom: 28px;
  display: block;
  width: 100px;
  height: 100px;
  padding: 0;
  border: 0;
  background: transparent;
  transition: transform 220ms var(--chat-spring);
}

.chatbot-launcher-mark {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--chat-ink);
  -webkit-mask: url('../../assets/img/logo-sheep.png') center / contain no-repeat;
  mask: url('../../assets/img/logo-sheep.png') center / contain no-repeat;
}

.chatbot-panel {
  position: fixed;
  right: 28px;
  bottom: 28px;
  display: flex;
  flex-direction: column;
  width: min(410px, calc(100vw - 32px));
  height: min(680px, calc(100dvh - 56px));
  overflow: hidden;
  border: 0;
  border-radius: 16px;
  outline: none;
  color: var(--chat-ink);
  background: var(--chat-surface);
  box-shadow: 0 18px 56px var(--shadow-color);
  transition: translate 180ms var(--chat-ease);

  &.is-dragging { transition: none; }
}

.chatbot-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  background: var(--chat-raised);
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.is-dragging .chatbot-header { cursor: grabbing; }
.chatbot-heading { display: flex; min-width: 0; align-items: center; gap: 12px; }
.chatbot-heading-copy { display: grid; min-width: 0; gap: 4px; }
.chatbot-kicker { color: var(--chat-muted); font-size: 12px; line-height: 1.4; }
.chatbot-heading strong { font-size: 16px; font-weight: var(--chat-heading-weight); line-height: 1.4; text-wrap: balance; overflow-wrap: anywhere; }
.chatbot-avatar { flex: 0 0 44px; width: 44px; height: 44px; border-radius: 50%; object-fit: cover; pointer-events: none; }
.chatbot-avatar.is-default { filter: invert(.94); }
:global(:is([data-theme='blue-white'], [data-theme='paper']) .chatbot-avatar.is-default) { filter: none; }
.chatbot-close { display: grid; flex-shrink: 0; place-items: center; width: 44px; height: 44px; border: 0; border-radius: 10px; background: transparent; transition: transform 200ms var(--chat-spring), background 150ms var(--chat-ease); }
.chatbot-close :deep(svg) { display: block; width: 20px; height: 20px; }
.chatbot-messages { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; padding: 20px 16px 8px; }
.chatbot-message-row { display: flex; margin-bottom: 14px; }
.chatbot-message-row.user { justify-content: flex-end; }
.chatbot-message { min-width: 0; max-width: 88%; padding: 12px 14px; border: 0; border-radius: 14px 14px 14px 4px; background: var(--chat-raised); }
.chatbot-message-row.user .chatbot-message { border-radius: 14px 14px 4px 14px; background: var(--chat-inset); }
.chatbot-message.has-tool-result { width: 100%; max-width: 100%; }
.chatbot-comments { display: grid; gap: 12px; }
.chatbot-comments-heading { font-weight: var(--chat-heading-weight); }
.chatbot-comments ol { display: grid; gap: 20px; margin: 0; padding: 0; list-style: none; }
.chatbot-comments li { display: grid; gap: 8px; min-width: 0; }
.chatbot-comment-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; font-size: 12px; line-height: 1.6; }
.chatbot-comment-meta strong { font-weight: var(--chat-heading-weight); }
.chatbot-comment-meta span { color: var(--chat-muted); }
.chatbot-comment-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; font-size: 12px; }
.chatbot-comment-actions a { display: inline-flex; align-items: center; min-height: 44px; color: var(--chat-ink); text-underline-offset: 3px; }
.chatbot-comment-actions button, .chatbot-more-comments { min-height: 44px; padding: 8px 12px; border: 0; border-radius: 10px; color: var(--chat-ink); background: var(--chat-inset); font-size: 12px; }
.chatbot-more-comments { justify-self: start; }
.chatbot-comments button:disabled, .chatbot-suggestions button:disabled { opacity: .45; cursor: not-allowed; }
.chatbot-comment-actions a:focus-visible { outline: 2px solid var(--chat-ink); outline-offset: 3px; }
.chatbot-typing span { font-size: 13px; line-height: 1.6; }
.chatbot-message p { margin: 0; white-space: pre-wrap; word-break: normal; line-break: strict; overflow-wrap: anywhere; text-wrap: pretty; font-size: 14px; line-height: 1.75; }
.chatbot-sources { display: grid; gap: 8px; margin-top: 12px; font-size: 12px; line-height: 1.5; }
.chatbot-sources span { color: var(--chat-muted); }
.chatbot-sources a { color: var(--chat-ink); overflow-wrap: anywhere; text-wrap: pretty; }
.chatbot-typing { display: flex; align-items: center; gap: 5px; min-height: 44px; }
.chatbot-typing i { width: 5px; height: 5px; border-radius: 50%; background: var(--chat-muted); animation: chatbot-bounce 1s infinite; }
.chatbot-typing i:nth-child(2) { animation-delay: 120ms; }
.chatbot-typing i:nth-child(3) { animation-delay: 240ms; }
@keyframes chatbot-bounce {
  0%, 70%, 100% { transform: translateY(0); opacity: .45; }
  35% { transform: translateY(-3px); opacity: 1; }
}
.chatbot-suggestions { display: grid; flex-shrink: 0; grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr)); gap: 8px; max-height: min(28dvh, 220px); overflow-y: auto; overscroll-behavior: contain; padding: 4px 16px 16px; }
.chatbot-suggestions button { min-width: 0; min-height: 44px; padding: 10px 12px; border: 0; border-radius: 10px; background: var(--chat-raised); text-align: left; font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; text-wrap: pretty; transition: background 150ms var(--chat-ease), transform 220ms var(--chat-spring); }
.chatbot-input-row { display: grid; flex-shrink: 0; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 10px; padding: 14px 16px 16px; background: var(--chat-raised); }
.chatbot-input-label { grid-column: 1 / -1; font-size: 12px; line-height: 1.4; }
.chatbot-input-row textarea {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  max-height: 140px;
  field-sizing: content;
  padding: 11px 12px;
  resize: none;
  border: 0;
  border-radius: 10px;
  outline: none;
  color: var(--chat-ink);
  background: var(--chat-surface);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--chat-ink) 3%, transparent), 0 0 0 1px color-mix(in srgb, var(--chat-ink) 8%, transparent);
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
  transition: box-shadow 150ms var(--chat-ease);
}
.chatbot-input-row textarea::placeholder { color: var(--chat-muted); opacity: 1; }
.chatbot-input-row textarea:focus { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--chat-ink) 20%, transparent), 0 0 0 3px color-mix(in srgb, var(--chat-ink) 16%, transparent); }
.chatbot-input-row textarea:focus-visible { outline: 2px solid var(--chat-ink); outline-offset: 3px; }
.chatbot-input-row textarea:disabled { cursor: wait; }
.chatbot-input-row button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; padding: 0 14px; border: 0; border-radius: 10px; color: var(--chat-surface); background: var(--chat-ink); font-size: 13px; line-height: 1; white-space: nowrap; transition: opacity 150ms var(--chat-ease), transform 220ms var(--chat-spring); }
.chatbot-input-row button :deep(svg) { display: block; flex: 0 0 16px; width: 16px; height: 16px; }
.chatbot-input-row button:disabled { cursor: not-allowed; opacity: .4; }
.chatbot-input-hint { display: flex; grid-column: 1 / -1; align-items: center; justify-content: space-between; gap: 8px; color: var(--chat-muted); font-size: 11px; line-height: 1.5; }
.chatbot-input-count { flex-shrink: 0; width: 11ch; text-align: right; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.chatbot-notice-slot { position: relative; flex-shrink: 0; }
.chatbot-error { position: absolute; right: 16px; bottom: 12px; left: 16px; margin: 0; padding: 12px 14px; border-radius: 10px; color: var(--chat-surface); background: var(--chat-ink); font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; text-wrap: pretty; }
.chatbot-fade-enter-active { transition: opacity 220ms var(--chat-ease), transform 240ms var(--chat-spring); }
.chatbot-fade-leave-active { transition: opacity 140ms var(--chat-ease), transform 140ms var(--chat-ease); }
.chatbot-fade-enter-from, .chatbot-fade-leave-to { opacity: 0; transform: translateY(8px) scale(.98); }
.chatbot-notice-enter-active { transition: opacity 180ms var(--chat-ease), transform 240ms var(--chat-spring); }
.chatbot-notice-leave-active { transition: opacity 120ms var(--chat-ease); }
.chatbot-notice-enter-from { opacity: 0; transform: translateY(6px) scale(.98); }
.chatbot-notice-leave-to { opacity: 0; }

@media (hover: hover) and (pointer: fine) {
  .chatbot-launcher:hover { transform: translateY(-3px) scale(1.03); }
  .chatbot-close:hover, .chatbot-suggestions button:hover { background: var(--chat-inset); }
  .chatbot-suggestions button:hover { transform: translateY(-1px); }
  .chatbot-input-row button:not(:disabled):hover { opacity: .85; }
  .chatbot-comments button:not(:disabled):hover { background: var(--chat-surface); }
  .chatbot-sources a:hover { text-decoration: underline; text-underline-offset: 3px; }
}
.chatbot-root button:not(:disabled):active { transform: scale(.97); }
.chatbot-root button:focus-visible { transition: none; }

@media (max-width: 768px) {
  .chatbot-launcher { right: 16px; bottom: max(16px, env(safe-area-inset-bottom)); }
  .chatbot-panel { right: 0; bottom: 0; width: 100%; height: min(82dvh, 680px); border-radius: 16px 16px 0 0; }
  .chatbot-input-row { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
  .chatbot-input-row textarea { font-size: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .chatbot-root *, .chatbot-root *::before, .chatbot-root *::after { animation: none !important; transition: none !important; }
  .chatbot-launcher:hover, .chatbot-suggestions button:hover, .chatbot-root button:active { transform: none !important; }
  .chatbot-fade-enter-from, .chatbot-fade-leave-to, .chatbot-notice-enter-from { transform: none; }
}
</style>

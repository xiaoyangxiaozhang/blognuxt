<template>
  <section class="reply-draft" :aria-labelledby="`${inputId}-title`" :aria-busy="busy || !verified">
    <header class="reply-draft-heading">
      <strong :id="`${inputId}-title`">{{ heading }}</strong>
      <span>第 {{ draft.version }} 版</span>
    </header>
    <div class="reply-draft-original">
      <span>回复 {{ draft.comment.nickname }} · {{ draft.comment.target_title }}</span>
      <p>{{ draft.comment.content }}</p>
      <a v-if="safeChatbotURL(draft.comment.url)" :href="safeChatbotURL(draft.comment.url)" target="_blank" rel="noopener noreferrer">查看所在页面</a>
    </div>

    <template v-if="draft.status === 'pending' && !expired">
      <label :for="inputId">回复内容</label>
      <textarea
        :id="inputId"
        v-model="edited"
        rows="4"
        :readonly="disabled || busy || !verified || uncertain"
        :aria-describedby="`${inputId}-hint ${inputId}-error`"
        :aria-invalid="characters > 500 || undefined"
        @keydown.enter.stop
      />
      <div :id="`${inputId}-hint`" class="reply-draft-hint">
        <span>{{ dirty ? '先保存修改，再确认发布。' : '确认后将以你的身份公开回复。' }}</span>
        <span class="reply-draft-count">{{ characters }} / 500</span>
      </div>
      <div class="reply-draft-actions">
        <template v-if="dirty">
          <button type="button" class="primary" :disabled="blocked || !valid" @click="$emit('save', edited)">{{ busy ? '保存中…' : '保存修改' }}</button>
          <button type="button" :disabled="blocked" @click="edited = draft.content">还原修改</button>
        </template>
        <button v-else type="button" class="primary" :disabled="blocked || !valid" @click="$emit('publish')">{{ busy ? '处理中…' : uncertain ? '重试发布' : '确认发布' }}</button>
        <button type="button" :disabled="blocked || uncertain" @click="$emit('cancel')">取消草稿</button>
      </div>
    </template>
    <p v-else class="reply-draft-content">{{ draft.content }}</p>

    <p v-if="!verified && !error" class="reply-draft-feedback" role="status">正在核对草稿状态…</p>
    <p v-if="uncertain" class="reply-draft-feedback" role="status">发布结果尚未确认，可检查状态或重试这条回复。</p>
    <p v-if="expired && draft.status === 'pending'" class="reply-draft-feedback">草稿已过期，请让助手重新生成。</p>
    <p v-if="draft.status === 'stale'" class="reply-draft-feedback">原评论已有变化，请重新查询并生成草稿。</p>
    <p :id="`${inputId}-error`" v-if="error" class="reply-draft-feedback" role="alert">{{ error }}</p>
    <button v-if="(error || uncertain) && !busy" type="button" class="reply-draft-recheck" :disabled="disabled" @click="$emit('recheck')">检查状态</button>
    <p v-if="draft.status === 'published' && draft.published_comment_id" class="reply-draft-feedback">回复编号 {{ draft.published_comment_id }}</p>
    <a v-if="draft.status === 'published' && safeChatbotURL(draft.published_url)" class="reply-draft-result" :href="safeChatbotURL(draft.published_url)" target="_blank" rel="noopener noreferrer">查看发布页面</a>
  </section>
</template>

<script setup lang="ts">
import { safeChatbotURL, type AgentReplyDraft } from '~/services/api/chatbot'

const props = defineProps<{
  draft: AgentReplyDraft
  verified: boolean
  busy: boolean
  disabled: boolean
  uncertain: boolean
  error?: string
}>()
const emit = defineEmits<{
  save: [content: string]
  publish: []
  cancel: []
  recheck: []
  dirty: [value: boolean]
}>()
const edited = ref(props.draft.content)
const now = ref(Date.now())
let expiryTimer: ReturnType<typeof setInterval> | undefined
const inputId = computed(() => `reply-draft-${props.draft.id}`)
const dirty = computed(() => edited.value !== props.draft.content)
const characters = computed(() => Array.from(edited.value).length)
const valid = computed(() => !!edited.value.trim() && characters.value <= 500)
const expired = computed(() => !Number.isFinite(Date.parse(props.draft.expires_at)) || Date.parse(props.draft.expires_at) <= now.value)
const blocked = computed(() => props.disabled || props.busy || !props.verified || expired.value)
const heading = computed(() => ({ pending: expired.value ? '草稿已过期' : '待确认的回复', published: '回复已发布', cancelled: '草稿已取消', expired: '草稿已过期', stale: '草稿需要更新' })[props.draft.status])

watch(() => [props.draft.id, props.draft.version, props.draft.content, props.draft.status], () => {
  edited.value = props.draft.content
  now.value = Date.now()
})
watch(dirty, value => emit('dirty', value))
onMounted(() => { expiryTimer = setInterval(() => { now.value = Date.now() }, 5000) })
onBeforeUnmount(() => { clearInterval(expiryTimer); emit('dirty', false) })
</script>

<style scoped lang="scss">
.reply-draft { display: grid; min-width: 0; gap: 12px; font-size: 13px; line-height: 1.6; }
.reply-draft-heading, .reply-draft-hint { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.reply-draft-heading strong { font-size: 15px; font-weight: var(--chat-heading-weight); text-wrap: balance; }
.reply-draft-heading span, .reply-draft-hint, .reply-draft-original > span { color: var(--chat-muted); font-size: 12px; }
.reply-draft-original { display: grid; gap: 6px; }
.reply-draft p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; text-wrap: pretty; }
.reply-draft a { width: fit-content; color: var(--chat-ink); text-underline-offset: 3px; }
.reply-draft label { font-weight: var(--chat-heading-weight); }
.reply-draft textarea { width: 100%; min-width: 0; min-height: 112px; max-height: 260px; resize: vertical; padding: 10px 12px; border: 0; border-radius: 10px; color: var(--chat-ink); background: var(--chat-surface); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--chat-ink) 3%, transparent), 0 0 0 1px color-mix(in srgb, var(--chat-ink) 8%, transparent); font: inherit; line-height: 1.7; }
.reply-draft textarea:read-only { cursor: default; }
.reply-draft-count { flex-shrink: 0; width: 9ch; text-align: right; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-variant-numeric: tabular-nums; }
.reply-draft-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.reply-draft button { min-height: 44px; padding: 9px 12px; border: 0; border-radius: 10px; color: var(--chat-ink); background: var(--chat-inset); font: inherit; cursor: pointer; transition: opacity 150ms var(--chat-ease), transform 180ms var(--chat-spring); }
.reply-draft button.primary { color: var(--chat-surface); background: var(--chat-ink); }
.reply-draft button:disabled { cursor: not-allowed; opacity: .45; }
.reply-draft button:not(:disabled):active { transform: scale(.97); }
.reply-draft button:focus-visible, .reply-draft textarea:focus-visible, .reply-draft a:focus-visible { outline: 2px solid var(--chat-ink); outline-offset: 3px; transition: none; }
.reply-draft-feedback { font-size: 12px; }
.reply-draft-recheck { justify-self: start; }
.reply-draft-result { display: inline-flex; align-items: center; min-height: 44px; }
@media (hover: hover) and (pointer: fine) { .reply-draft button:not(:disabled):hover { opacity: .8; } }
@media (max-width: 768px) { .reply-draft textarea { font-size: 16px; } }
@media (prefers-reduced-motion: reduce) { .reply-draft button { transition: none; } .reply-draft button:active { transform: none; } }
</style>

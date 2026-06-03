<template>
  <section class="unified-comment-panel" :class="`variant-${variant}`">
    <header v-if="showHeader" class="comment-header">
      <div class="header-title">
        <IconTablerMessage />
        <h2>{{ title }}</h2>
        <span>({{ comments.length }})</span>
      </div>
    </header>

    <form class="comment-composer" @submit.prevent="emit('submit')">
      <div class="composer-card">
        <div class="composer-topline">
          <label class="info-field">
            <input
              :value="form.nickname"
              type="text"
              :readonly="isLoggedIn"
              :disabled="isLoggedIn"
              placeholder="昵称*"
              @input="updateField('nickname', ($event.target as HTMLInputElement).value)"
            />
          </label>

          <label class="info-field">
            <input
              :value="form.email"
              type="email"
              :readonly="isLoggedIn"
              :disabled="isLoggedIn"
              placeholder="邮箱*"
              @input="updateField('email', ($event.target as HTMLInputElement).value)"
            />
          </label>

          <label class="info-field">
            <input
              :value="form.website"
              type="url"
              :readonly="isLoggedIn"
              :disabled="isLoggedIn"
              placeholder="网站"
              @input="updateField('website', ($event.target as HTMLInputElement).value)"
            />
          </label>

          <button type="button" class="plain-icon info-button" aria-label="Comment tips">
            <IconTablerInfoCircle />
          </button>
        </div>

        <div v-if="isLoggedIn && currentUser" class="login-banner">
          <div class="login-profile">
            <img v-if="currentUser.avatar" :src="currentUser.avatar" :alt="currentUser.nickname || 'user'" />
            <span v-else>{{ (currentUser.nickname || currentUser.email || 'U').slice(0, 1) }}</span>
            <p>
              Signed in as
              <strong>{{ currentUser.nickname || currentUser.email || 'User' }}</strong>
            </p>
          </div>

          <button type="button" class="logout-link" @click="handleLogout">
            Logout
          </button>
        </div>

        <div class="composer-body">
          <textarea
            ref="textareaRef"
            :value="form.content"
            rows="2"
            placeholder="写下你的留言..."
            @input="updateField('content', ($event.target as HTMLTextAreaElement).value)"
          ></textarea>

          <div v-if="showPreview" class="composer-preview">
            <template v-if="previewBlocks.length > 0">
              <template v-for="(block, index) in previewBlocks" :key="`${block.type}-${index}`">
                <p v-if="block.type === 'text'" class="preview-text">{{ block.content }}</p>
                <div v-else class="preview-image-wrap">
                  <img :src="block.src" alt="Preview image" class="preview-image" />
                </div>
              </template>
            </template>
            <p v-else class="preview-placeholder">预览会显示在这里。</p>
          </div>
        </div>

        <div v-if="attachmentPreviews.length > 0" class="attachment-strip">
          <div v-for="item in attachmentPreviews" :key="item.url" class="attachment-item" :class="{ uploading: item.uploading }">
            <img :src="item.url" :alt="item.name" />
            <button
              v-if="!item.uploading"
              type="button"
              class="remove-attachment"
              aria-label="Remove image"
              @click="removeImage(item.url)"
            >
              ×
            </button>
            <span v-if="item.uploading" class="attachment-status">上传中</span>
          </div>
        </div>

        <footer class="composer-footer">
          <div class="toolbar-group">
            <button type="button" class="plain-icon" aria-label="Insert emoji" @click="toggleEmojiPanel">
              <IconTablerMoodSmile />
            </button>

            <button type="button" class="plain-icon" aria-label="Upload image" @click="triggerImagePicker">
              <IconTablerPhoto />
            </button>

            <button type="button" class="plain-icon" aria-label="Toggle preview" @click="showPreview = !showPreview">
              <IconTablerEye />
            </button>
          </div>

          <div class="action-group">
            <button v-if="!isLoggedIn" type="button" class="login-button" @click="loginDialogVisible = true">
              <IconTablerLogin />
              登录
            </button>

            <button type="submit" class="submit-button" :disabled="submitting || uploadingCount > 0">
              <span v-if="submitting">提交中...</span>
              <span v-else-if="uploadingCount > 0">等待上传...</span>
              <span v-else>发表评论</span>
            </button>
          </div>
        </footer>

        <div v-if="showEmojiPanel" class="emoji-panel">
          <button
            v-for="emoji in emojiList"
            :key="emoji"
            type="button"
            class="emoji-button"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </form>

    <section class="comment-list-section">
      <div v-if="loading" class="loading-box">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="errorText" class="comment-error">
        <el-alert :title="errorText" type="error" show-icon />
      </div>

      <div v-else-if="comments.length === 0" class="comment-empty">
        <p>{{ emptyText }}</p>
      </div>

      <div v-else class="comment-list">
        <template v-if="variant === 'board'">
          <article
            v-for="item in comments"
            :key="item.id"
            class="comment-card board-card"
            :class="{ reply: Boolean(item.replyTo) }"
          >
            <div class="comment-rendered">
              <template v-for="(block, index) in renderCommentBlocks(item.content)" :key="`${item.id}-${block.type}-${index}`">
                <p v-if="block.type === 'text'" class="comment-text">{{ block.content }}</p>
                <div v-else class="comment-image-wrap">
                  <img :src="block.src" alt="Comment image" class="comment-image" />
                </div>
              </template>
            </div>

            <footer class="board-meta">
              <div class="board-author">
                <div class="comment-avatar">
                  <img v-if="item.avatar" :src="item.avatar" :alt="item.author" loading="lazy" />
                  <span v-else>{{ item.author.slice(0, 1) }}</span>
                </div>

                <div class="board-author-copy">
                  <strong>{{ item.author }}</strong>
                  <div class="board-author-side">
                    <a
                      v-if="item.website"
                      :href="item.website"
                      target="_blank"
                      rel="noreferrer"
                      class="meta-link"
                    >
                      个人主页
                    </a>
                    <span v-if="item.replyTo" class="reply-pill">回复 {{ item.replyTo }}</span>
                    <span>{{ formatPublishTime(item.publishTime) }}</span>
                  </div>
                </div>
              </div>
            </footer>
          </article>
        </template>

        <template v-else>
          <article
            v-for="item in comments"
            :key="item.id"
            class="comment-card"
            :class="{ reply: Boolean(item.replyTo) }"
          >
            <div class="comment-avatar">
              <img v-if="item.avatar" :src="item.avatar" :alt="item.author" loading="lazy" />
              <span v-else>{{ item.author.slice(0, 1) }}</span>
            </div>

            <div class="comment-main">
              <div class="comment-meta">
                <div class="meta-line">
                  <strong>{{ item.author }}</strong>
                  <a
                    v-if="item.website"
                    :href="item.website"
                    target="_blank"
                    rel="noreferrer"
                    class="meta-link"
                  >
                    个人主页
                  </a>
                  <span v-if="item.replyTo" class="reply-pill">回复 {{ item.replyTo }}</span>
                  <span class="meta-separator">·</span>
                  <span>{{ formatPublishTime(item.publishTime) }}</span>
                </div>
              </div>

              <div class="comment-rendered">
                <template v-for="(block, index) in renderCommentBlocks(item.content)" :key="`${item.id}-${block.type}-${index}`">
                  <p v-if="block.type === 'text'" class="comment-text">{{ block.content }}</p>
                  <div v-else class="comment-image-wrap">
                    <img :src="block.src" alt="Comment image" class="comment-image" />
                  </div>
                </template>
              </div>
            </div>
          </article>
        </template>
      </div>
    </section>

    <input
      ref="imageInputRef"
      type="file"
      accept="image/*"
      multiple
      class="hidden-input"
      @change="handleImageSelect"
    >

    <LoginDilog v-model="loginDialogVisible" @login-success="handleLoginSuccess" />
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import IconTablerMessage from '~icons/tabler/message'
import IconTablerPhoto from '~icons/tabler/photo'
import IconTablerInfoCircle from '~icons/tabler/info-circle'
import IconTablerLogin from '~icons/tabler/login'
import IconTablerMoodSmile from '~icons/tabler/mood-smile'
import IconTablerEye from '~icons/tabler/eye'
import LoginDilog from '~/components/layouts/LoginDilog.vue'
import { renderCommentContent, extractCommentImageUrls } from '~/composables/commentRenderer'
import { uploadFile } from '~/composables/api/upload'
import { useCommentAuth } from '~/composables/useCommentAuth'

export interface UnifiedCommentForm {
  nickname: string
  email: string
  website: string
  content: string
}

export interface UnifiedCommentItem {
  id: number | string
  author: string
  avatar?: string
  content: string
  publishTime: string
  website?: string
  replyTo?: string
}

interface AttachmentPreviewItem {
  url: string
  name: string
  uploading: boolean
}

const props = withDefaults(defineProps<{
  comments: UnifiedCommentItem[]
  loading?: boolean
  submitting?: boolean
  form: UnifiedCommentForm
  title?: string
  tip?: string
  emptyText?: string
  errorText?: string
  variant?: 'default' | 'board'
  showHeader?: boolean
}>(), {
  loading: false,
  submitting: false,
  title: '评论',
  tip: '支持表情、图片上传与预览，登录后会优先使用你的账号资料。',
  emptyText: '还没有评论，来留下第一条消息吧。',
  errorText: '',
  variant: 'default',
  showHeader: true
})

const emit = defineEmits<{
  (e: 'update:form', value: UnifiedCommentForm): void
  (e: 'submit'): void
}>()

const emojiList = ['😀', '😉', '😊', '😏', '🤝', '🙂', '👏', '🎉', '🔥', '✨', '🙌', '❤️']

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)
const loginDialogVisible = ref(false)
const showEmojiPanel = ref(false)
const showPreview = ref(false)
const localUploads = ref<AttachmentPreviewItem[]>([])

const { currentUser, isLoggedIn, fetchProfile, logoutUser } = useCommentAuth()

const previewBlocks = computed(() => renderCommentContent(props.form.content))
const uploadedImageUrls = computed(() => extractCommentImageUrls(props.form.content))
const attachmentPreviews = computed<AttachmentPreviewItem[]>(() => {
  const uploaded = uploadedImageUrls.value.map((url) => ({
    url,
    name: 'uploaded-image',
    uploading: false
  }))

  const pending = localUploads.value.filter((item) => item.uploading)
  return [...pending, ...uploaded]
})
const uploadingCount = computed(() => localUploads.value.filter((item) => item.uploading).length)

const updateField = (field: keyof UnifiedCommentForm, value: string) => {
  emit('update:form', {
    ...props.form,
    [field]: value
  })
}

const syncUserIntoForm = () => {
  if (!currentUser.value) return

  emit('update:form', {
    ...props.form,
    nickname: currentUser.value.nickname || props.form.nickname,
    email: currentUser.value.email || props.form.email,
    website: currentUser.value.website || props.form.website
  })
}

const insertAtCursor = (value: string) => {
  const textarea = textareaRef.value
  const currentValue = props.form.content

  if (!textarea) {
    updateField('content', `${currentValue}${value}`)
    return
  }

  const start = textarea.selectionStart ?? currentValue.length
  const end = textarea.selectionEnd ?? currentValue.length
  const nextValue = `${currentValue.slice(0, start)}${value}${currentValue.slice(end)}`

  updateField('content', nextValue)

  nextTick(() => {
    const nextPosition = start + value.length
    textarea.focus()
    textarea.setSelectionRange(nextPosition, nextPosition)
  })
}

const insertEmoji = (emoji: string) => {
  insertAtCursor(emoji)
  showEmojiPanel.value = false
}

const toggleEmojiPanel = () => {
  showEmojiPanel.value = !showEmojiPanel.value
}

const triggerImagePicker = () => {
  imageInputRef.value?.click()
}

const removeImage = (url: string) => {
  const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`\\n?!\\[\\]\\(${escapedUrl}\\)\\n?|!\\[\\]\\(${escapedUrl}\\)`, 'g')
  const nextContent = props.form.content.replace(pattern, '\n').replace(/\n{3,}/g, '\n\n').trim()
  updateField('content', nextContent)
}

const handleImageSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])

  if (files.length === 0) {
    return
  }

  for (const file of files) {
    const localUrl = URL.createObjectURL(file)
    localUploads.value.push({
      url: localUrl,
      name: file.name,
      uploading: true
    })

    try {
      const response = await uploadFile(file)
      const imageUrl = response.data?.file_url

      if (!imageUrl) {
        throw new Error(response.message || 'Upload failed.')
      }

      insertAtCursor(`\n![](${imageUrl})\n`)
    } catch (error) {
      console.error(error)
      ElMessage.error(`Failed to upload ${file.name}.`)
    } finally {
      URL.revokeObjectURL(localUrl)
      localUploads.value = localUploads.value.filter((item) => item.url !== localUrl)
    }
  }

  target.value = ''
}

const renderCommentBlocks = (content: string) => renderCommentContent(content)

const handleLoginSuccess = async () => {
  await fetchProfile()
  if (isLoggedIn.value) {
    syncUserIntoForm()
  }
}

const handleLogout = async () => {
  await logoutUser()
  ElMessage.success('Logged out.')
}

const formatPublishTime = (value: string) => {
  if (!value) return '刚刚'
  const date = new Date(value.replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return value
  return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
}

onMounted(async () => {
  await fetchProfile()
  if (isLoggedIn.value) {
    syncUserIntoForm()
  }
})
</script>

<style scoped lang="scss">
.unified-comment-panel {
  display: grid;
  gap: 16px;
  color: var(--home-text);
}

.comment-header {
  display: grid;
  gap: 4px;
}

.header-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--home-text);

  h2 {
    margin: 0;
    font-size: 18px;
    line-height: 1;
    color: var(--home-text);
  }

  span {
    font-size: 13px;
    color: var(--text-muted);
  }

  :deep(svg) {
    width: 20px;
    height: 20px;
  }
}

.composer-card,
.comment-card,
.comment-empty {
  border-radius: 12px;
  background: var(--home-card-bg);
  border: 1px solid var(--home-border);
  box-shadow: var(--home-shadow);
}

.composer-card {
  position: relative;
  padding: 0;
  overflow: hidden;
}

.composer-topline {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) 28px;
  gap: 0;
  padding: 14px 14px 0;
  align-items: start;
}

.info-field {
  display: grid;
  gap: 6px;

  input {
    width: 100%;
    height: 24px;
    border: 0;
    background: transparent;
    color: var(--comment-input-text);
    padding: 0 12px 0 0;
    font-size: 13px;
    transition: color var(--transition-fast);

    &:focus {
      outline: none;
    }

    &:disabled {
      color: var(--text-muted);
      cursor: default;
    }
  }
}

.plain-icon {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--comment-toolbar-btn);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast);

  &:hover {
    color: var(--comment-toolbar-btn-hover);
    background: var(--home-accent-soft);
  }

  :deep(svg) {
    width: 16px;
    height: 16px;
  }
}

.info-button {
  justify-self: end;
}

.login-banner {
  margin: 12px 14px 0;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--comment-login-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.login-profile {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  img,
  span {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: var(--brand-accent-soft);
    color: var(--brand-accent);
    font-size: 11px;
    font-weight: 600;
  }

  img {
    object-fit: cover;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted);
  }

  strong {
    color: var(--comment-input-text);
  }
}

.logout-link {
  border: 0;
  background: transparent;
  color: var(--brand-accent-hover);
  font-size: 12px;
  cursor: pointer;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--brand-accent);
  }
}

.composer-body {
  padding: 10px 14px 0;
}

.composer-body textarea {
  width: 100%;
  border: 0;
  background: transparent;
  resize: vertical;
  color: var(--comment-input-text);
  font-size: 14px;
  line-height: 1.7;

  &::placeholder {
    color: var(--comment-input-placeholder);
  }

  &:focus {
    outline: none;
  }
}

.composer-preview {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--comment-separator);
}

.preview-text,
.comment-text {
  margin: 0 0 10px;
  color: var(--home-text);
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-image-wrap,
.comment-image-wrap {
  margin-bottom: 10px;
}

.preview-image,
.comment-image {
  width: min(100%, 280px);
  border-radius: 10px;
  display: block;
  object-fit: cover;
  border: 1px solid var(--home-border);
}

.preview-placeholder {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

.attachment-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 14px 0;
}

.attachment-item {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);

  &.uploading {
    opacity: 0.8;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.remove-attachment,
.attachment-status {
  position: absolute;
  right: 4px;
  top: 4px;
}

.remove-attachment {
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 999px;
  background: var(--home-accent);
  color: var(--text-on-accent);
  font-size: 12px;
  cursor: pointer;
  transition: transform var(--transition-fast), opacity var(--transition-fast);

  &:hover {
    opacity: 0.85;
  }
}

.attachment-status {
  padding: 2px 5px;
  border-radius: 999px;
  background: var(--home-accent);
  color: var(--text-on-accent);
  font-size: 9px;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
}

.toolbar-group,
.action-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.login-button,
.submit-button {
  height: 36px;
  border: 0;
  border-radius: 10px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--transition-fast), background var(--transition-fast);
}

.login-button {
  background: var(--brand-accent-soft);
  color: var(--home-text);
}

.submit-button {
  min-width: 100px;
  background: var(--brand-accent-hover);
  color: var(--brand-accent-text);

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.emoji-panel {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
  padding: 0 14px 14px;
}

.emoji-button {
  height: 34px;
  border: 0;
  border-radius: 10px;
  background: var(--home-accent-soft);
  font-size: 18px;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast);

  &:hover {
    background: var(--brand-accent-soft);
    transform: scale(1.12);
  }
}

.comment-list-section {
  display: grid;
  gap: 14px;
}

.loading-box,
.comment-error {
  padding: 8px 0;
}

.comment-empty {
  padding: 18px 20px;

  p {
    margin: 0;
    color: var(--text-muted);
    font-size: 13px;
  }
}

.comment-list {
  display: grid;
  gap: 14px;
}

.comment-card {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 14px;
  padding: 18px;

  &.reply {
    margin-left: 70px;
  }
}

.comment-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--brand-accent-soft);
  display: grid;
  place-items: center;
  color: var(--brand-accent);
  font-size: 16px;
  font-weight: 700;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.comment-main {
  min-width: 0;
}

.comment-meta {
  margin-bottom: 8px;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);

  strong {
    color: var(--brand-accent-hover);
    font-size: 14px;
  }
}

.meta-link {
  color: var(--brand-accent-hover);
  text-decoration: none;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--brand-accent);
  }
}

.reply-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(250, 204, 21, 0.14);
  color: #a16207;
  font-size: 11px;
}

.meta-separator {
  opacity: 0.45;
  color: var(--text-muted);
}

.comment-rendered {
  display: grid;
}

.hidden-input {
  display: none;
}

.board-meta {
  margin-top: 12px;
}

.board-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.board-author-copy {
  display: grid;
  gap: 3px;
  min-width: 0;

  strong {
    font-size: 12px;
    line-height: 1.1;
    color: var(--home-text);
    font-weight: 600;
  }
}

.board-author-side {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  line-height: 1.3;
  color: rgba(83, 94, 90, 0.74);
}

.variant-board {
  gap: 24px;
}

.variant-board .comment-composer {
  order: 2;
}

.variant-board .comment-list-section {
  order: 1;
}

.variant-board .composer-card,
.variant-board .comment-card,
.variant-board .comment-empty {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.62);
  box-shadow:
    0 26px 60px rgba(115, 128, 122, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(26px);
}

.variant-board .composer-card {
  border-radius: 18px;
}

.variant-board .composer-topline {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 14px 14px 0;
}

.variant-board .info-field input {
  height: 40px;
  border-radius: 10px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: rgba(255, 255, 255, 0.38);
  font-size: 13px;
  color: #374151;

  &::placeholder {
    color: rgba(75, 85, 99, 0.62);
  }

  &:focus {
    border-color: rgba(148, 163, 184, 0.72);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.24);
  }
}

.variant-board .info-button {
  display: none;
}

.variant-board .login-banner {
  margin: 12px 14px 0;
  background: rgba(255, 255, 255, 0.36);
}

.variant-board .login-profile p,
.variant-board .logout-link {
  color: rgba(55, 65, 81, 0.82);
}

.variant-board .composer-body {
  padding: 10px 14px 0;
}

.variant-board .composer-body textarea {
  min-height: 80px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: rgba(255, 255, 255, 0.4);
  color: #2f3d35;

  &::placeholder {
    color: rgba(75, 85, 99, 0.62);
  }
}

.variant-board .composer-preview {
  margin-top: 12px;
  padding: 14px;
  border-radius: 14px;
  border-top: 0;
  background: rgba(255, 255, 255, 0.24);
}

.variant-board .attachment-strip {
  padding: 12px 14px 0;
}

.variant-board .attachment-item {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.48);
}

.variant-board .composer-footer {
  padding: 14px;
}

.variant-board .plain-icon,
.variant-board .login-button {
  background: rgba(255, 255, 255, 0.38);
  color: rgba(55, 65, 81, 0.76);
}

.variant-board .plain-icon:hover,
.variant-board .login-button:hover {
  background: rgba(255, 255, 255, 0.58);
  color: #1f2937;
}

.variant-board .submit-button {
  background: rgba(79, 98, 90, 0.88);
  color: #f8fafc;
  box-shadow: 0 16px 32px rgba(79, 98, 90, 0.18);
}

.variant-board .emoji-panel {
  padding: 0 14px 14px;
}

.variant-board .emoji-button {
  background: rgba(255, 255, 255, 0.38);
}

.variant-board .comment-empty {
  padding: 22px 24px;
}

.variant-board .comment-empty p,
.variant-board .preview-placeholder {
  color: rgba(75, 85, 99, 0.72);
}

.variant-board .comment-list {
  display: block;
  column-count: 3;
  column-gap: 16px;
}

.variant-board .board-card {
  display: inline-grid;
  width: 100%;
  margin: 0 0 14px;
  padding: 14px 16px;
  border-radius: 16px;
  break-inside: avoid;
  grid-template-columns: 1fr;
  gap: 0;
}

.variant-board .board-card.reply {
  margin-left: 0;
}

.variant-board .comment-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 10px;
  background: rgba(162, 210, 232, 0.5);
  color: #23506a;
}

.variant-board .comment-text {
  margin-bottom: 8px;
  color: rgba(39, 52, 47, 0.88);
  font-size: 13px;
  line-height: 1.8;
}

.variant-board .comment-image {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.72);
}

.variant-board .meta-link {
  color: rgba(55, 65, 81, 0.88);
}

.variant-board .reply-pill {
  background: rgba(166, 206, 220, 0.34);
  color: #2d566d;
}

[data-theme='blue-white'] .variant-board .composer-card,
[data-theme='blue-white'] .variant-board .comment-card,
[data-theme='blue-white'] .variant-board .comment-empty {
  background: rgba(255, 255, 255, 0.48);
}

@media (max-width: 768px) {
  .composer-topline {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .info-button {
    justify-self: start;
  }

  .composer-footer,
  .login-banner {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-group,
  .action-group {
    width: 100%;
    justify-content: space-between;
  }

  .emoji-panel {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .comment-card {
    grid-template-columns: 40px minmax(0, 1fr);
    padding: 14px;

    &.reply {
      margin-left: 16px;
    }
  }

  .comment-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .submit-button {
    min-width: auto;
  }

  .variant-board .comment-list {
    column-count: 2;
    column-gap: 12px;
  }

  .variant-board .board-card {
    margin-bottom: 12px;
    padding: 14px;
  }

  .variant-board .composer-topline {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .variant-board .comment-list {
    column-count: 1;
  }

  .variant-board .composer-footer,
  .variant-board .login-banner {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

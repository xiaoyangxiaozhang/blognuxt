<template>
  <section class="moments-page">
    <div class="moments-shell">
      <header class="moments-header">
        <div class="moments-cover">
          <div class="cover-media">
            <img src="~/assets/img/background.png" alt="Moments cover" class="cover-image" />
            <div class="cover-overlay"></div>
          </div>

          <div class="cover-meta">
            <div class="profile-row">
              <div class="cover-copy">
                <h1>{{ authorName }}</h1>
              </div>

              <div class="profile-avatar">
                <img :src="authorAvatar" :alt="authorName" />
              </div>
            </div>

            <p class="profile-signature">{{ authorDesc }}</p>
          </div>
        </div>
      </header>

      <section class="moments-stream">
        <div v-if="pending" class="loading-state">
          <el-skeleton :rows="8" animated />
        </div>

        <div v-else-if="pageError" class="error-state">
          <el-alert :title="pageError" type="error" show-icon />
        </div>

        <div v-else-if="moments.length === 0" class="empty-state">
          <h2>还没有动态</h2>
          <p>发布后的内容会显示在这里。</p>
        </div>

        <template v-else>
          <article v-for="item in moments" :key="item.id" class="moment-row">
            <div class="row-avatar">
              <img :src="authorAvatar" :alt="authorName" loading="lazy" />
            </div>

            <div class="row-main">
              <header class="row-head">
                <h2 class="row-name">{{ authorName }}</h2>
              </header>

              <p class="row-text">{{ item.text || '今天也记录一点生活。' }}</p>

              <div
                v-if="item.images.length > 0"
                class="row-media"
                :class="{
                  single: item.images.length === 1,
                  compact: item.images.length >= 2 && item.images.length <= 4
                }"
              >
                <div
                  v-for="(image, index) in item.images.slice(0, 9)"
                  :key="`${item.id}-image-${index}`"
                  class="media-item"
                  :class="{ large: item.images.length === 1 }"
                >
                  <img :src="image" :alt="item.text || `moment image ${index + 1}`" loading="lazy" />
                </div>
              </div>

              <footer class="row-footer">
                <div class="footer-main">
                  <div class="footer-meta" :class="{ 'no-badge': !item.location }">
                    <div class="footer-leading">
                      <span v-if="item.location" class="footer-badge">
                        <IconMaterialSymbolsLocationOnRounded />
                        {{ item.location }}
                      </span>
                    </div>

                    <div class="footer-side">
                      <span class="row-time">{{ formatMomentDate(item.publishTime) }}</span>

                      <button
                        type="button"
                        class="action-button mini-action"
                        aria-label="前往评论区"
                        @click="scrollToCommentPanel"
                      >
                        <IconMaterialSymbolsChatBubbleRounded />
                      </button>

                      <button type="button" class="more-button" aria-label="更多操作">
                        <span></span>
                        <span></span>
                        <span></span>
                      </button>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </article>

          <div ref="commentPanelRef" class="page-comment-panel">
            <UnifiedCommentPanel
              :comments="commentList"
              :loading="commentsPending"
              :submitting="commentSubmitting"
              :form="commentForm"
              empty-text="还没有评论，来留下第一条消息吧。"
              @update:form="handleFormUpdate"
              @submit="handleCommentSubmit"
            />
          </div>
        </template>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import IconMaterialSymbolsChatBubbleRounded from '~icons/material-symbols/chat-bubble-rounded'
import IconMaterialSymbolsLocationOnRounded from '~icons/material-symbols/location-on-rounded'
import { createComment, getCommentList, type CommentListItem, type CommentTargetType } from '~/composables/api/comments'
import { getMomentList } from '~/composables/api/moments'
import { getBasicSettings } from '~/composables/api/user'

interface DynamicMomentItem {
  id: number
  publishTime: string
  text: string
  images: string[]
  location: string
}

interface DynamicCommentForm {
  nickname: string
  email: string
  website: string
  content: string
}

interface DynamicCommentCard {
  id: number | string
  author: string
  avatar?: string
  content: string
  publishTime: string
  website?: string
  replyTo?: string
}

const COMMENT_TARGET_TYPE: CommentTargetType = 'page'
const COMMENT_TARGET_KEY = 'moment'
const DEFAULT_AVATAR = 'https://picsum.photos/200/200?random=7'

const { data, pending } = await useAsyncData(
  'dynamic-page',
  async () => {
    try {
      const [momentsResponse, settingsResponse] = await Promise.all([
        getMomentList({ page_size: 20 }),
        getBasicSettings()
      ])

      return {
        moments: (momentsResponse.data.list || [])
          .filter((item) => item.is_publish !== false)
          .map((item) => ({
            id: item.id,
            publishTime: item.publish_time,
            text: item.content?.text || '',
            images: item.content?.images?.filter(Boolean) || [],
            location: item.content?.location || ''
          })),
        settings: settingsResponse.data || {},
        error: ''
      }
    } catch (error) {
      console.error(error)
      return {
        moments: [] as DynamicMomentItem[],
        settings: {} as Record<string, string>,
        error: '动态内容加载失败，请稍后再试。'
      }
    }
  }
)

const {
  data: commentsData,
  pending: commentsPending,
  refresh: refreshComments
} = await useAsyncData(
  'dynamic-page-comments',
  async () => {
    try {
      return await getCommentList({
        target_type: COMMENT_TARGET_TYPE,
        target_key: COMMENT_TARGET_KEY,
        page: 1,
        page_size: 10
      })
    } catch (error) {
      console.error(error)
      return {
        code: 500,
        message: '评论加载失败',
        data: {
          list: [],
          total: 0,
          page: 1,
          page_size: 10
        }
      }
    }
  }
)

const moments = computed<DynamicMomentItem[]>(() => data.value?.moments || [])
const settings = computed<Record<string, string>>(() => data.value?.settings || {})
const pageError = computed(() => data.value?.error || '')

const authorName = computed(() => settings.value['basic.author'] || 'XiaoLin')
const authorDesc = computed(() => settings.value['basic.author_desc'] || '把日常、灵感和风景慢慢记录下来。')
const authorAvatar = computed(() => settings.value['basic.author_avatar'] || DEFAULT_AVATAR)

// Use a shared SSR payload seed so the first client hydration matches the server-rendered relative time.
const nowSeed = useState('dynamic-now-seed', () => Date.now())

const commentSubmitting = ref(false)
const commentPanelRef = ref<HTMLElement | null>(null)
const commentForm = reactive<DynamicCommentForm>({
  nickname: '',
  email: '',
  website: '',
  content: ''
})

const commentList = computed<DynamicCommentCard[]>(() => {
  const list = commentsData.value?.data?.list || []
  return list.map(mapCommentItem)
})

const handleFormUpdate = (nextForm: DynamicCommentForm) => {
  commentForm.nickname = nextForm.nickname
  commentForm.email = nextForm.email
  commentForm.website = nextForm.website
  commentForm.content = nextForm.content
}

const handleCommentSubmit = async () => {
  if (!commentForm.nickname.trim()) {
    ElMessage.warning('请先填写昵称。')
    return
  }

  if (!commentForm.email.trim()) {
    ElMessage.warning('请先填写邮箱。')
    return
  }

  if (!commentForm.content.trim()) {
    ElMessage.warning('请输入评论内容。')
    return
  }

  commentSubmitting.value = true

  try {
    await createComment({
      target_type: COMMENT_TARGET_TYPE,
      target_key: COMMENT_TARGET_KEY,
      content: commentForm.content.trim(),
      nickname: commentForm.nickname.trim(),
      email: commentForm.email.trim(),
      website: commentForm.website.trim() || undefined
    })

    commentForm.content = ''
    await refreshComments()
    ElMessage.success('评论已提交。')
  } catch (error) {
    console.error(error)
    ElMessage.error('评论提交失败，请稍后重试。')
  } finally {
    commentSubmitting.value = false
  }
}

const scrollToCommentPanel = async () => {
  await nextTick()
  commentPanelRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

const mapCommentItem = (item: CommentListItem): DynamicCommentCard => {
  const author = item.nickname || item.user_nickname || item.user?.nickname || '匿名访客'
  const publishTime = item.created_at || item.publish_time || item.createdAt || ''
  const avatar = item.avatar || item.user_avatar || item.user?.avatar || ''
  const replyTo =
    item.reply_to_nickname ||
    item.parent?.nickname ||
    item.parent?.user?.nickname ||
    ''

  return {
    id: item.id,
    author,
    avatar,
    content: item.content || '',
    publishTime,
    website: item.website || '',
    replyTo: replyTo || undefined
  }
}

const formatMomentDate = (value: string) => {
  if (!value) return '刚刚'

  const date = new Date(value.replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return value

  const diff = nowSeed.value - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟前`
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}小时前`
  return `${Math.max(1, Math.floor(diff / day))}天前`
}
</script>

<style scoped lang="scss">
.moments-page {
  padding: 86px 0 80px;
  background: var(--home-surface);
  color: var(--home-text);
  overflow-x: clip;
}

.moments-shell {
  width: min(760px, 100%);
  margin: 0 auto;
  background: var(--home-card-bg);
}

.moments-cover {
  position: relative;
  background: var(--home-card-alt);
}

.cover-media {
  position: relative;
  aspect-ratio: 800 / 550;
  min-height: min(68.75vw, 520px);
  overflow: hidden;
  background: var(--home-card-alt);
}

.cover-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.08) 58%, rgba(0, 0, 0, 0.3) 100%);
}

.cover-meta {
  position: absolute;
  right: 38px;
  bottom: -80px;
  z-index: 2;
  width: min(100% - 38px, 256px);
}

.profile-row {
  display: grid;
  grid-template-columns: 1fr;
}

.profile-row > * {
  grid-area: 1 / 1 / 2 / 2;
}

.cover-copy {
  z-index: 3;
  justify-self: start;
  align-self: start;
  margin: 12px 0 0 12px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  padding: 4px 12px;
  border-radius: 30px;

  h1 {
    margin: 0;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.96);
    text-align: left;
  }
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--home-card-bg);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  justify-self: end;
  align-self: end;
  border: 3px solid rgba(255, 255, 255, 0.92);

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
}

.profile-signature {
  margin: 8px 0 0;
  justify-self: end;
  max-width: 80%;
  font-size: 13px;
  line-height: 1.4;
  color: var(--home-text);
  text-align: right;
  padding: 2px 12px;
  border-radius: 30px;
}

.moments-stream {
  display: grid;
  gap: 0;
  width: 100%;
  margin: 72px auto 0;
  background: var(--home-card-bg);
  padding: 26px 36px 24px;
}

.moment-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 14px;
  padding: 18px 0 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--home-text) 8%, transparent);
}

.row-avatar {
  width: 54px;
  height: 54px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--home-card-alt);

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
}

.row-main {
  min-width: 0;
  padding-top: 4px;
}

.row-head {
  margin-bottom: 8px;
}

.row-name {
  margin: 0;
  font-size: 15px;
  line-height: 1.1;
  font-weight: 600;
  color: var(--home-text);
}

.row-text {
  margin: 0;
  max-width: none;
  font-size: 13px;
  line-height: 1.8;
  font-weight: 400;
  color: var(--home-text);
  white-space: pre-wrap;
  word-break: break-word;
}

.row-media {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: min(100%, 440px);
}

.row-media.compact {
  width: min(100%, 360px);
}

.row-media.single {
  grid-template-columns: 1fr;
  width: min(100%, 260px);
}

.media-item {
  overflow: hidden;
  border-radius: 10px;
  background: var(--home-card-alt);
  aspect-ratio: 1 / 1;

  &.large {
    aspect-ratio: 1 / 1;
  }

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
}

.row-footer {
  margin-top: 14px;
}

.footer-main {
  display: grid;
  gap: 6px;
}

.footer-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.footer-leading {
  flex: 1 1 auto;
  min-width: 0;
}

.footer-meta.no-badge .footer-leading {
  min-height: 20px;
}

.footer-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 20px;
  color: var(--text-muted);
  font-size: 12px;

  :deep(svg) {
    width: 13px;
    height: 13px;
  }
}

.footer-side {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  flex: 0 0 auto;
}

.row-time {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: var(--home-accent-soft);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--home-accent-soft) 72%, var(--home-text) 10%);
    color: var(--home-text);
  }

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--home-text) 22%, transparent);
    outline-offset: 2px;
  }

  :deep(svg) {
    width: 12px;
    height: 12px;
  }
}

.mini-action {
  width: 22px;
  min-width: 22px;
  height: 22px;
  border-radius: 7px;
}

.more-button {
  min-width: 26px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 0;
  border-radius: 7px;
  background: var(--home-accent-soft);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--home-text) 22%, transparent);
    outline-offset: 2px;
  }

  span {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--text-muted);
  }
}

.page-comment-panel {
  margin-top: 28px;
}

.loading-state,
.error-state,
.empty-state {
  padding: 40px 0;
}

.empty-state {
  text-align: center;

  h2 {
    margin: 0 0 10px;
    font-size: 28px;
  }

  p {
    margin: 0;
    color: var(--text-muted);
  }
}

@media (max-width: 920px) {
  .cover-meta {
    right: 24px;
    width: min(100% - 24px, 232px);
    bottom: -69px;
  }

  .profile-avatar {
    width: 104px;
    height: 104px;
  }

  .cover-copy {
    margin: 8px 0 0 8px;

    h1 {
      font-size: 16px;
    }
  }

  .profile-signature {
    margin-top: 6px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .moments-page {
    padding: 80px 0 56px;
  }

  .moments-shell {
    width: 100%;
  }

  .cover-media {
    min-height: min(68.75vw, 380px);
  }

  .cover-meta {
    right: 18px;
    bottom: -61px;
    width: min(100% - 18px, 208px);
  }

  .profile-avatar {
    width: 92px;
    height: 92px;
    border-width: 3px;
  }

  .cover-copy {
    margin: 8px 0 0 8px;

    h1 {
      font-size: 15px;
    }
  }

  .profile-signature {
    font-size: 11px;
  }

  .moments-stream {
    margin-top: 62px;
    padding: 24px 22px 18px;
  }

  .moment-row {
    grid-template-columns: 58px minmax(0, 1fr);
    gap: 12px;
  }

  .row-avatar {
    width: 44px;
    height: 44px;
    border-radius: 9px;
  }

  .row-name {
    font-size: 14px;
  }

  .row-text {
    font-size: 12px;
  }

  .row-media {
    width: 100%;
    gap: 8px;
  }
}

@media (max-width: 560px) {
  .moments-page {
    padding: 74px 0 48px;
  }

  .cover-meta {
    right: 14px;
    bottom: -56px;
    width: min(100% - 14px, 188px);
  }

  .profile-avatar {
    width: 84px;
    height: 84px;
  }

  .cover-copy h1 {
    font-size: 14px;
  }

  .profile-signature {
    font-size: 10px;
  }

  .moments-stream {
    margin-top: 54px;
    padding: 20px 16px 16px;
  }

  .row-media.single {
    width: min(100%, 100%);
  }
}

@media (max-width: 480px) {
  .moments-page {
    padding: 68px 0 42px;
  }

  .cover-media {
    min-height: calc(100vw * 0.6875);
  }

  .cover-meta {
    right: 14px;
    bottom: -55px;
    width: min(100% - 14px, 180px);
  }

  .profile-avatar {
    width: 82px;
    height: 82px;
  }

  .cover-copy h1 {
    font-size: 13px;
  }

  .profile-signature {
    padding: 2px 10px;
  }

  .moments-stream {
    margin-top: 50px;
    padding: 18px 14px 14px;
  }

  .moment-row {
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 12px;
  }

  .row-avatar {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .row-text {
    font-size: 12px;
    line-height: 1.75;
  }

  .row-media {
    width: calc(100% + 50px);
    margin-left: -50px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .row-media.single {
    width: calc(100% + 50px);
    margin-left: -50px;
  }

  .footer-meta {
    align-items: flex-end;
  }

  .footer-side {
    gap: 4px;
  }
}

@media (max-width: 380px) {
  .cover-meta {
    right: 10px;
    width: min(100% - 10px, 166px);
  }

  .profile-avatar {
    width: 74px;
    height: 74px;
  }

  .cover-copy h1 {
    font-size: 12px;
  }

  .profile-signature {
    font-size: 9px;
  }

  .row-media {
    width: calc(100% + 46px);
    margin-left: -46px;
  }

  .row-media.single {
    width: calc(100% + 46px);
    margin-left: -46px;
  }
}
</style>

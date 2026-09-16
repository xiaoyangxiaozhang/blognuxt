<template>
  <NuxtPage v-if="isMinePage" />
  <section v-else class="moments-page">
    <PageCurtain v-model="curtainReady" />
    <div class="moments-shell">
      <header class="moments-header">
        <div class="moments-cover">
          <div class="cover-media">
            <img :src="coverImage" alt="基米斗社区封面" class="cover-image" />
            <div class="cover-overlay"></div>
          </div>

          <div class="cover-meta">
            <div class="profile-row">
              <div class="cover-copy">
                <h1>{{ communityName }}</h1>
              </div>

              <div class="profile-avatar">
                <img :src="communityAvatar" :alt="communityName" />
              </div>
            </div>

            <p class="profile-signature">{{ communitySignature }}</p>
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
          <h2>还没有社区动态</h2>
          <p>欢迎注册并分享一条小猫日常。</p>
        </div>

        <template v-else>
          <article v-for="item in moments" :id="`kimidou-moment-${item.id}`" :key="item.id" class="moment-row">
            <div class="row-avatar">
              <img v-if="item.author?.avatar" :src="proxyImageUrl(item.author.avatar)" :alt="momentAuthor(item)" loading="lazy" />
              <span v-else>{{ momentAuthor(item).slice(0, 1) }}</span>
            </div>

            <div class="row-main">
              <header class="row-head">
                <div class="row-name-wrap">
                  <h2 class="row-name">{{ momentAuthor(item) }}</h2>
                  <el-tag v-if="item.author?.badge" size="small" effect="plain">{{ item.author.badge }}</el-tag>
                </div>
              </header>

              <p class="row-text">{{ item.content.text || '分享了一条图片动态。' }}</p>

              <div
                v-if="item.content.images?.length"
                class="row-media"
                :class="{
                  single: item.content.images.length === 1,
                  compact: item.content.images.length >= 2 && item.content.images.length <= 4
                }"
              >
                <div
                  v-for="(image, index) in item.content.images.slice(0, 9)"
                  :key="`${item.id}-image-${index}`"
                  class="media-item"
                  :class="{ large: item.content.images.length === 1 }"
                >
                  <img :src="proxyImageUrl(image)" :alt="item.content.text || `社区动态图片 ${index + 1}`" loading="lazy" />
                </div>
              </div>

              <footer class="row-footer">
                <div class="footer-meta">
                  <span class="row-time">{{ formatMomentDate(item.publish_time) }}</span>
                  <button type="button" class="more-button" aria-label="更多操作">
                    <DotsHorizontalIcon aria-hidden="true" />
                  </button>
                </div>
              </footer>

              <div :id="`kimidou-comments-${item.id}`" class="moment-comment-panel">
                <div class="moment-like-row">
                  <button
                    type="button"
                    class="moment-like-button"
                    :class="{ liked: isMomentLiked(item.id) }"
                    :aria-pressed="isMomentLiked(item.id)"
                    aria-label="点赞"
                    @click="toggleMomentLike(item.id)"
                  >
                    <HeartFilledIcon v-if="isMomentLiked(item.id)" aria-hidden="true" />
                    <HeartIcon v-else aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="moment-comment-button"
                    :aria-expanded="commentStates[item.id]?.composerExpanded || false"
                    aria-label="评论"
                    @click="toggleMomentComposer(item.id)"
                  >
                    评论
                  </button>
                </div>

                <UnifiedCommentPanel
                  variant="moment"
                  :defer-identity="true"
                  :show-composer="commentStates[item.id]?.composerExpanded || false"
                  :show-header="false"
                  :comments="commentStates[item.id]?.comments || []"
                  :loading="commentStates[item.id]?.loading || false"
                  :submitting="commentStates[item.id]?.submitting || false"
                  :form="commentStates[item.id]?.form || emptyCommentForm"
                  :error-text="commentStates[item.id]?.error || ''"
                  empty-text="还没有评论，来说点什么吧。"
                  @update:form="handleFormUpdate(item.id, $event)"
                  @reply="replyToMomentComment(item.id, $event)"
                  @submit="handleCommentSubmit(item.id, $event)"
                />
              </div>
            </div>
          </article>
        </template>

        <button v-if="hasMore" class="load-more" type="button" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '加载中…' : '加载更多' }}
        </button>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { HeartIcon, HeartFilledIcon, DotsHorizontalIcon } from '@svg-animated-icons/vue'
import UnifiedCommentPanel from '~/components/comments/UnifiedCommentPanel.vue'
import type { UnifiedCommentForm, UnifiedCommentItem, UnifiedCommentSubmitMode } from '~/components/comments/UnifiedCommentPanel.vue'
import { getCommentList, createComment } from '~/services/api/comments'
import { getKimidouMomentList, type KimidouMomentItem } from '~/services/api/kimidou'
import { getBasicSettings, getSettings } from '~/services/api/user'
import { normalizeCommentList } from '~/utils/comments'
import { proxyImageUrl } from '~/utils/image'
import { formatDate } from '~/utils/date'
import { useCommentAuth } from '~/composables/useCommentAuth'
import PageCurtain from '~/components/shell/PageCurtain.vue'
import fallbackCover from '~/assets/img/background.png'

interface CommentState {
  comments: UnifiedCommentItem[]
  form: UnifiedCommentForm
  loading: boolean
  loaded: boolean
  error: string
  submitting: boolean
  composerExpanded: boolean
}

interface KimidouPageData {
  moments: KimidouMomentItem[]
  total: number
  settings: Record<string, string>
  blogSettings: Record<string, string>
  error: string
}

const DEFAULT_AVATAR = 'https://picsum.photos/200/200?random=7'
const { currentUser, isLoggedIn, fetchProfile } = useCommentAuth()
const route = useRoute()
const isMinePage = computed(() => route.path === '/kimidou/mine')

const { data, pending } = await useAsyncData<KimidouPageData>('kimidou-page', async () => {
  try {
    const [momentsResponse, settingsResponse, blogSettingsResponse] = await Promise.all([
      getKimidouMomentList({ page: 1, page_size: 20 }),
      getBasicSettings(),
      getSettings('blog')
    ])

    return {
      moments: momentsResponse.data?.list || [],
      total: momentsResponse.data?.total || 0,
      settings: settingsResponse.data || {},
      blogSettings: blogSettingsResponse.data || {},
      error: ''
    }
  } catch (error) {
    console.error(error)
    return {
      moments: [],
      total: 0,
      settings: {},
      blogSettings: {},
      error: '基米斗社区加载失败。'
    }
  }
})

const moments = computed(() => data.value?.moments || [])
const settings = computed(() => data.value?.settings || {})
const blogSettings = computed(() => data.value?.blogSettings || {})
const pageError = computed(() => data.value?.error || '')
const currentPage = ref(1)
const loadingMore = ref(false)
const hasMore = computed(() => moments.value.length < Number(data.value?.total || 0))
const coverImage = computed(() => proxyImageUrl(blogSettings.value['blog.kimidou_cover']) || fallbackCover)
const communityName = computed(() => currentUser.value?.nickname || '基米斗社区')
const communityAvatar = computed(() => {
  return proxyImageUrl(currentUser.value?.avatar) || proxyImageUrl(settings.value['basic.author_avatar']) || DEFAULT_AVATAR
})
const communitySignature = computed(() => {
  return blogSettings.value['blog.kimidou_description']?.trim() || '前景可待 未来可期'
})

const momentAuthor = (item: KimidouMomentItem) => item.author?.nickname || '匿名用户'
const emptyCommentForm: UnifiedCommentForm = { nickname: '', email: '', website: '', content: '' }
const commentStates = reactive<Record<number, CommentState>>({})
const likedMomentIds = reactive(new Set<number>())
const curtainReady = ref(false)

const ensureCommentState = (momentId: number) => {
  if (!commentStates[momentId]) {
    commentStates[momentId] = {
      comments: [],
      form: { ...emptyCommentForm },
      loading: false,
      loaded: false,
      error: '',
      submitting: false,
      composerExpanded: false
    }
  }
  return commentStates[momentId]
}

const loadMomentComments = async (momentId: number) => {
  const state = ensureCommentState(momentId)
  if (state.loaded || state.loading) return
  state.loading = true
  state.error = ''

  try {
    const response = await getCommentList({ target_type: 'moment', target_key: String(momentId), page: 1, page_size: 10 })
    state.comments = normalizeCommentList(response.data?.list || []) as UnifiedCommentItem[]
    state.loaded = true
  } catch (error) {
    console.error(error)
    state.comments = []
    state.error = '评论加载失败。'
  } finally {
    state.loading = false
  }
}

watch(moments, items => {
  items.forEach(item => ensureCommentState(item.id))
  if (import.meta.client) void Promise.all(items.map(item => loadMomentComments(item.id)))
}, { immediate: true })

const handleFormUpdate = (momentId: number, nextForm: UnifiedCommentForm) => {
  ensureCommentState(momentId).form = nextForm
}

const replyToMomentComment = (momentId: number, item: UnifiedCommentItem) => {
  const state = ensureCommentState(momentId)
  state.form = { ...state.form, content: `@${item.author} `, parentId: Number(item.id) }
  state.composerExpanded = true
}

const toggleMomentComposer = (momentId: number) => {
  const state = ensureCommentState(momentId)
  state.composerExpanded = !state.composerExpanded
}

const isMomentLiked = (momentId: number) => likedMomentIds.has(momentId)

const toggleMomentLike = (momentId: number) => {
  if (likedMomentIds.has(momentId)) likedMomentIds.delete(momentId)
  else likedMomentIds.add(momentId)
}

const handleCommentSubmit = async (momentId: number, mode?: UnifiedCommentSubmitMode) => {
  const state = ensureCommentState(momentId)
  const form = state.form
  if (!form.content.trim()) {
    ElMessage.warning('请先填写评论内容。')
    return
  }
  if (!isLoggedIn.value && mode !== 'anonymous') return

  state.submitting = true
  try {
    await createComment({
      target_type: 'moment',
      target_key: String(momentId),
      content: form.content.trim(),
      nickname: mode === 'anonymous' ? undefined : form.nickname.trim() || undefined,
      email: mode === 'anonymous' ? undefined : form.email.trim() || undefined,
      website: mode === 'anonymous' ? undefined : form.website.trim() || undefined,
      parent_id: form.parentId,
      anonymous: mode === 'anonymous'
    })
    state.form = { ...state.form, content: '', parentId: undefined }
    state.loaded = false
    await loadMomentComments(momentId)
    ElMessage.success('评论发表成功。')
  } catch (error) {
    console.error(error)
    ElMessage.error('评论发表失败，请稍后重试。')
  } finally {
    state.submitting = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const response = await getKimidouMomentList({ page: currentPage.value + 1, page_size: 20 })
    const currentData = data.value
    if (!currentData) return
    currentPage.value += 1
    data.value = {
      ...currentData,
      moments: [...currentData.moments, ...(response.data?.list || [])],
      total: response.data?.total || currentData.total
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('加载更多动态失败。')
  } finally {
    loadingMore.value = false
  }
}

const triggerReveal = () => {
  setTimeout(() => { curtainReady.value = true }, 200)
}

watch(pending, value => {
  if (!value && import.meta.client) triggerReveal()
})

onMounted(() => {
  if (!pending.value) triggerReveal()
  void fetchProfile()
})

const formatMomentDate = formatDate
</script>

<style scoped lang="scss">
.moments-page {
  padding: 0 0 80px;
  background: var(--home-surface);
  color: var(--home-text);
  overflow-x: clip;
}

.moments-shell {
  width: min(760px, 100%);
  margin: 0 auto;
  background: var(--home-card-bg);
}

.moments-cover { position: relative; background: var(--home-card-alt); }

.cover-media {
  position: relative;
  aspect-ratio: 800 / 550;
  min-height: min(68.75vw, 520px);
  overflow: hidden;
  background: var(--home-card-alt);
}

.cover-image { width: 100%; height: 100%; display: block; object-fit: cover; }

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

.profile-row { display: grid; grid-template-columns: 1fr; }
.profile-row > * { grid-area: 1 / 1 / 2 / 2; }

.cover-copy {
  z-index: 3;
  justify-self: start;
  align-self: start;
  margin: 12px 0 0 12px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  padding: 4px 12px;
  border-radius: 15px;

  h1 { margin: 0; font-size: 18px; line-height: 1.3; font-weight: 600; color: rgba(255, 255, 255, 0.96); text-align: left; }
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

  img { width: 100%; height: 100%; display: block; object-fit: cover; }
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
  border-radius: 15px;
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
  display: grid;
  place-items: center;
  color: var(--text-muted);

  img, span { width: 100%; height: 100%; display: grid; place-items: center; object-fit: cover; }
}

.row-main { min-width: 0; padding-top: 4px; }
.row-head { margin-bottom: 8px; }
.row-name-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.row-name { margin: 0; font-size: 15px; line-height: 1.1; font-weight: 600; color: var(--home-text); }

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

.row-media.compact { width: min(100%, 360px); }
.row-media.single { grid-template-columns: 1fr; width: min(100%, 260px); }

.media-item {
  overflow: hidden;
  border-radius: 10px;
  background: var(--home-card-alt);
  aspect-ratio: 1 / 1;

  img { width: 100%; height: 100%; display: block; object-fit: cover; }
}

.row-footer { margin-top: 14px; }

.footer-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.row-time { margin: 0; font-size: 12px; color: var(--text-muted); }

.more-button {
  min-width: 26px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 7px;
  background: var(--home-accent-soft);
  cursor: pointer;

  :deep(svg) { width: 16px; height: 16px; color: var(--text-muted); }
}

.moment-comment-panel { margin-top: 12px; }

.moment-like-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 0;
  border-radius: 4px 4px 0 0;
  background: color-mix(in srgb, var(--home-text) 7%, var(--home-card-bg));
}

.moment-comment-button {
  height: 28px;
  padding: 0 6px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
}

.moment-comment-button:hover,
.moment-comment-button:focus-visible { color: var(--brand-accent); }

.moment-like-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--brand-accent);
  cursor: pointer;

  :deep(svg) { width: 18px; height: 18px; }
}

.moment-like-button:hover,
.moment-like-button:focus-visible,
.moment-like-button.liked { color: var(--brand-accent-hover); }

.loading-state,
.error-state,
.empty-state { padding: 40px 0; }

.empty-state {
  text-align: center;
  h2 { margin: 0 0 10px; font-size: 28px; }
  p { margin: 0; color: var(--text-muted); }
}

.load-more {
  width: fit-content;
  margin: 20px auto 0;
  padding: 10px 22px;
  border: 1px solid color-mix(in srgb, var(--home-text) 14%, transparent);
  border-radius: 999px;
  background: transparent;
  color: var(--home-text);
  cursor: pointer;
}

.load-more:disabled { opacity: .55; cursor: wait; }

@media (max-width: 920px) {
  .cover-meta { right: 24px; width: min(100% - 24px, 232px); bottom: -69px; }
  .profile-avatar { width: 104px; height: 104px; }
  .cover-copy { margin: 8px 0 0 8px; h1 { font-size: 16px; } }
  .profile-signature { margin-top: 6px; font-size: 12px; }
}

@media (max-width: 768px) {
  .moments-page { padding: 80px 0 56px; }
  .moments-shell { width: 100%; }
  .cover-media { min-height: min(68.75vw, 380px); }
  .cover-meta { right: 18px; bottom: -61px; width: min(100% - 18px, 208px); }
  .profile-avatar { width: 92px; height: 92px; border-width: 3px; }
  .cover-copy { margin: 8px 0 0 8px; h1 { font-size: 15px; } }
  .profile-signature { font-size: 11px; }
  .moments-stream { margin-top: 62px; padding: 24px 22px 18px; }
  .moment-row { grid-template-columns: 58px minmax(0, 1fr); gap: 12px; }
  .row-avatar { width: 44px; height: 44px; border-radius: 9px; }
  .row-name { font-size: 14px; }
  .row-text { font-size: 12px; }
  .row-media { width: 100%; gap: 8px; }
}

@media (max-width: 560px) {
  .moments-page { padding: 74px 0 48px; }
  .cover-meta { right: 14px; bottom: -56px; width: min(100% - 14px, 188px); }
  .profile-avatar { width: 84px; height: 84px; }
  .cover-copy h1 { font-size: 14px; }
  .profile-signature { font-size: 10px; }
  .moments-stream { margin-top: 54px; padding: 20px 16px 16px; }
  .row-media.single { width: min(100%, 100%); }
}

@media (max-width: 480px) {
  .moments-page { padding: 68px 0 42px; }
  .cover-media { min-height: calc(100vw * 0.6875); }
  .cover-meta { right: 14px; bottom: -55px; width: min(100% - 14px, 180px); }
  .profile-avatar { width: 82px; height: 82px; }
  .cover-copy h1 { font-size: 13px; }
  .profile-signature { padding: 2px 10px; }
  .moments-stream { margin-top: 50px; padding: 18px 14px 14px; }
  .moment-row { grid-template-columns: 52px minmax(0, 1fr); gap: 12px; }
  .row-avatar { width: 36px; height: 36px; border-radius: 8px; }
  .row-text { font-size: 12px; line-height: 1.75; }
  .row-media { width: calc(100% + 50px); margin-left: -50px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .row-media.single { width: calc(100% + 50px); margin-left: -50px; }
}

@media (max-width: 380px) {
  .cover-meta { right: 10px; width: min(100% - 10px, 166px); }
  .profile-avatar { width: 74px; height: 74px; }
  .cover-copy h1 { font-size: 12px; }
  .profile-signature { font-size: 9px; }
  .row-media { width: calc(100% + 46px); margin-left: -46px; }
  .row-media.single { width: calc(100% + 46px); margin-left: -46px; }
}
</style>

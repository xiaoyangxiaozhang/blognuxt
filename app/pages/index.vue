<template>
  <div class="blog-home" :class="{ 'page-revealed': isRevealed }">
    <!-- 骨架屏幕布 -->
    <PageCurtain v-model="curtainReady" @opened="onCurtainOpened" />

    <section v-if="heroBackgroundUrl" ref="heroVisualRef" class="page-top-visual">

      <div
        class="viewport-background"
        :class="{
          'is-video-ready': heroVideoReady,
          'has-video-error': heroVideoFailed
        }"
      >
        <img
          v-if="heroPosterUrl"
          ref="heroPosterRef"
          class="viewport-bg-poster"
          :src="proxyImageUrl(heroPosterUrl, 1280)"
          :srcset="heroPosterSrcSet"
          sizes="100vw"
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchpriority="high"
          @load="onHeroPosterSettled"
          @error="onHeroPosterSettled"
        />
        <video
          v-if="heroBackgroundIsVideo"
          ref="heroVideoRef"
          class="viewport-bg-video"
          :src="heroVideoCanLoad ? heroBackgroundUrl : undefined"
          loop
          muted
          playsinline
          preload="none"
          aria-hidden="true"
          @playing="onHeroVideoPlaying"
          @error="onHeroVideoError"
        />
      </div>

      <div class="hero-section">
        <div class="hero-content">
          <div v-if="authorName" class="hero-name">{{ authorName }}</div>
          <h1 class="hero-title">
            <span v-for="(char, index) in displayedIntroChars" :key="`${char}-${index}`" class="title-char">
              {{ char }}
            </span>
            <span class="title-cursor blinking"></span>
          </h1>
        </div>
      </div>

      <!-- 动态波浪分隔线：三层白色波浪 -->
      <div class="wave-divider">
        <div class="wave-track wave-track-layer1">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,52 C320,88 640,12 960,48 C1120,68 1280,36 1440,52 L1440,120 L0,120 Z" fill="var(--home-surface)"/>
          </svg>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,52 C320,88 640,12 960,48 C1120,68 1280,36 1440,52 L1440,120 L0,120 Z" fill="var(--home-surface)"/>
          </svg>
        </div>
        <div class="wave-track wave-track-layer2">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,58 C240,20 480,96 720,54 C960,10 1200,80 1440,58 L1440,120 L0,120 Z" fill="var(--home-surface)"/>
          </svg>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,58 C240,20 480,96 720,54 C960,10 1200,80 1440,58 L1440,120 L0,120 Z" fill="var(--home-surface)"/>
          </svg>
        </div>
        <div class="wave-track wave-track-layer3">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,66 C200,28 440,108 680,60 C920,14 1160,84 1440,66 L1440,120 L0,120 Z" fill="var(--home-surface)"/>
          </svg>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,66 C200,28 440,108 680,60 C920,14 1160,84 1440,66 L1440,120 L0,120 Z" fill="var(--home-surface)"/>
          </svg>
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="content-shell">
        <HomeFeaturePanel
          :author-name="authorName"
          :author-desc="authorDesc"
          :author-avatar="authorAvatar"
          :author-github="authorGithub"
          :sidebar-social="sidebarSocialList"
          :announcement-html="announcementHtml"
          :recent-articles="homeData.recentArticles"
          :comments="homeData.comments"
          :comments-error="homeData.commentsError"
          :comments-loading="commentsLoading"
          :moments="homeData.moments"
          :moments-error="homeData.momentsError"
          :moments-loading="momentsLoading"
          :loading="pending"
          @retry="refresh"
        />

        <HomeNewestSection
          :articles="homeData.articles"
          :loading="pending"
          :error-message="homeData.error"
          @retry="refresh"
        />

        <section class="home-moments" aria-labelledby="home-moments-heading">
          <div class="moments-heading">
            <h2 id="home-moments-heading">最近动态</h2>
            <NuxtLink to="/dynamic" class="more-moments">全部动态</NuxtLink>
          </div>
          <FeatureMomentsPanel
            :moments="homeData.moments"
            :limit="3"
            :loading="momentsLoading"
            :error-message="homeData.momentsError"
            @retry="refresh"
          />
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import PageCurtain from '~/components/shell/PageCurtain.vue'
import HomeFeaturePanel from '~/components/home/HomeFeaturePanel.vue'
import HomeNewestSection from '~/components/home/HomeNewestSection.vue'
import FeatureMomentsPanel from '~/components/home/feature-panels/FeatureMomentsPanel.vue'
import { getMomentList, type MomentItem } from '~/services/api/moments'
import { getArticleList } from '~/services/api/article'
import { getCommentList } from '~/services/api/comments'
import type { ArticleListItem } from '~/types/api'
import { normalizeCommentList, type NormalizedCommentItem } from '~/utils/comments'
import { formatDate } from '~/utils/date'
import { proxyImageSrcSet, proxyImageUrl } from '~/utils/image'
import { isVideoUrl, parseBlogJson, useBasicSettings, useBlogSettings } from '~/composables/useBlogSettings'
interface ArticleTag {
  name: string
  url?: string
}

interface ArticleCard {
  id: number
  slug: string
  title: string
  cover: string
  publishDate: string
  categoryName: string
  categoryUrl: string
  summary: string
  isTop: boolean
  dateTime: string
  tags: ArticleTag[]
}

interface FeatureArticleItem {
  id: number
  slug: string
  title: string
  publishDate: string
  categoryName: string
  cover: string
}



interface HomePayload {
  articles: ArticleCard[]
  totalArticles: number
  recentArticles: FeatureArticleItem[]
  comments: NormalizedCommentItem[]
  moments: MomentItem[]
  momentsError: string
  error: string
}

const DEFAULT_AVATAR = 'https://picsum.photos/200/200?random=7'
const EMPTY_HOME_PAYLOAD: HomePayload = {
  articles: [],
  totalArticles: 0,
  recentArticles: [],
  comments: [],
  moments: [],
  momentsError: '',
  error: ''
}

const currentPage = ref(1)
const pageSize = 10
const displayedIntroChars = ref<string[]>([])
const heroVisualRef = ref<HTMLElement | null>(null)
const heroPosterRef = ref<HTMLImageElement | null>(null)
const heroVideoRef = ref<HTMLVideoElement | null>(null)
const heroPosterSettled = ref(false)
const heroVideoCanLoad = ref(false)
const heroVideoReady = ref(false)
const heroVideoFailed = ref(false)
let typingTimer: ReturnType<typeof setInterval> | null = null
let restartTimer: ReturnType<typeof setTimeout> | null = null
let heroVideoObserver: IntersectionObserver | null = null
let reducedMotionQuery: MediaQueryList | null = null
let heroIsVisible = true
let heroPageReady = false
let heroDisposed = false

const resolveArticleSlug = (item: Pick<ArticleListItem, 'id' | 'slug' | 'url'>) => {
  if (item.slug) return item.slug

  if (item.url) {
    const matched = item.url.match(/\/([^/]+)\/?$/)
    if (matched?.[1]) {
      return decodeURIComponent(matched[1])
    }
  }

  return String(item.id)
}

const mapBaseArticle = (item: ArticleListItem) => ({
  id: item.id,
  slug: resolveArticleSlug(item),
  title: item.title,
  cover: proxyImageUrl(item.cover),
  publishDate: formatDate(item.publish_time),
  categoryName: item.category?.name || '未分类'
})

const mapArticleCard = (item: ArticleListItem): ArticleCard => ({
  ...mapBaseArticle(item),
  categoryUrl: item.category?.url || '',
  summary: item.summary?.trim() || item.excerpt?.trim() || '',
  isTop: Boolean(item.is_top),
  dateTime: item.publish_time?.slice(0, 10) || '',
  tags: item.tags?.map((tag) => ({ name: tag.name, url: tag.url })) || []
})

const mapFeatureArticle = (item: ArticleListItem): FeatureArticleItem => mapBaseArticle(item)

const { settings: basicSettings } = useBasicSettings()
const { settings: blogSettings } = useBlogSettings()

const buildHomePayload = async (): Promise<HomePayload> => {
  try {
    const response = await getArticleList({ page: currentPage.value, page_size: pageSize })
    if (response.code !== 0) throw new Error(response.message || 'Article request failed')
    const articleList = response.data.list || []
    return {
      ...EMPTY_HOME_PAYLOAD,
      articles: articleList.map(mapArticleCard),
      totalArticles: response.data.total || 0,
      recentArticles: articleList.slice(0, 6).map(mapFeatureArticle)
    }
  } catch (error) {
    console.error(error)
    return { ...EMPTY_HOME_PAYLOAD, error: '获取首页数据失败，请稍后重试' }
  }
}

const { data, pending, refresh: refreshArticles } = await useAsyncData<HomePayload>('home-page', buildHomePayload, {
  watch: [currentPage]
})
const { data: commentsData, error: commentsError, status: commentsStatus, refresh: refreshComments } = useAsyncData('home-comments', async () => {
  const response = await getCommentList({ target_type: 'page', target_key: 'message', page: 1, page_size: 6 })
  if (response.code !== 0) throw new Error(response.message || 'Comment request failed')
  return normalizeCommentList(response.data?.list || [])
}, { server: false, lazy: true })
const { data: momentsData, error: momentsError, status: momentsStatus, refresh: refreshMoments } = useAsyncData('home-moments', async () => {
  const response = await getMomentList({ page: 1, page_size: 6 })
  if (response.code !== 0) throw new Error(response.message || 'Moment request failed')
  return (response.data.list || []).filter(item => item.is_publish !== false)
}, { server: false, lazy: true })

const commentsLoading = computed(() => ['idle', 'pending'].includes(commentsStatus.value))
const momentsLoading = computed(() => ['idle', 'pending'].includes(momentsStatus.value))
const refresh = () => Promise.all([refreshArticles(), refreshComments(), refreshMoments()])
const homeData = computed(() => ({
  ...(data.value || EMPTY_HOME_PAYLOAD),
  comments: commentsData.value || [],
  commentsError: commentsError.value ? '留言暂时无法加载' : '',
  moments: momentsData.value || [],
  momentsError: momentsError.value ? '动态暂时无法加载' : ''
}))
const heroBackgroundUrl = computed(() => blogSettings.value['blog.background_image']?.trim() || '')
const heroBackgroundIsVideo = computed(() => isVideoUrl(heroBackgroundUrl.value))
const heroPosterUrl = computed(() => {
  const screenshot = blogSettings.value['blog.screenshot']?.trim() || ''
  if (heroBackgroundIsVideo.value && screenshot && !isVideoUrl(screenshot)) {
    return proxyImageUrl(screenshot)
  }

  if (heroBackgroundUrl.value && !heroBackgroundIsVideo.value) {
    return proxyImageUrl(heroBackgroundUrl.value)
  }

  return ''
})
const heroPosterWidths = [480, 768, 1280, 1920]
const heroPosterSrcSet = computed(() => proxyImageSrcSet(heroPosterUrl.value, heroPosterWidths))

useHead(() => ({
  link: heroPosterUrl.value
    ? [{
        rel: 'preload',
        as: 'image',
        href: proxyImageUrl(heroPosterUrl.value, 1280),
        imagesrcset: heroPosterSrcSet.value,
        imagesizes: '100vw',
        fetchpriority: 'high'
      }]
    : []
}))

const isRevealed = ref(false)
const curtainReady = ref(false)

// 数据加载完成后触发动画序列
const triggerReveal = () => {
  setTimeout(() => {
    curtainReady.value = true
  }, 50)
}

const onCurtainOpened = () => {
  isRevealed.value = true
}

watch(pending, (val) => {
  if (!val && import.meta.client) {
    triggerReveal()
  }
})

const authorName = computed(() => basicSettings.value['basic.author'] || '')
const authorDesc = computed(() => basicSettings.value['basic.author_desc'] || '')
const authorAvatar = computed(() => proxyImageUrl(basicSettings.value['basic.author_avatar'], 640) || DEFAULT_AVATAR)
const authorGithub = computed(() => {
  return (
    basicSettings.value['basic.github'] ||
    basicSettings.value['basic.author_github'] ||
    basicSettings.value['basic.social_github'] ||
    ''
  )
})
// 解析 blog 分组的侧边栏社交链接配置
interface SidebarSocialItem {
  name: string
  url: string
  icon: string
}
const sidebarSocialList = computed<SidebarSocialItem[]>(() => {
  try {
    const raw = blogSettings.value['blog.sidebar_social']
    if (!raw) return []
    return JSON.parse(raw) as SidebarSocialItem[]
  } catch {
    return []
  }
})
const typingIntroText = computed(() => {
  const typingTexts = parseBlogJson<string[]>(blogSettings.value['blog.typing_texts'], [])
    .map((item) => item.trim())
    .filter(Boolean)

  return typingTexts[0] || blogSettings.value['blog.slogan'] || blogSettings.value['blog.subtitle'] || authorDesc.value || '欢迎来到这里。'
})
const announcementHtml = computed(() => blogSettings.value['blog.announcement'] || '')

const clearTypingTimers = () => {
  if (typingTimer) {
    clearInterval(typingTimer)
    typingTimer = null
  }

  if (restartTimer) {
    clearTimeout(restartTimer)
    restartTimer = null
  }
}

const shouldAvoidHeroVideo = () => {
  if (!import.meta.client) {
    return true
  }

  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean }
  }).connection

  return Boolean(reducedMotionQuery?.matches || connection?.saveData)
}

const syncHeroVideoPlayback = async () => {
  const video = heroVideoRef.value
  if (!video) {
    return
  }

  if (heroDisposed || !heroPageReady || !heroPosterSettled.value || shouldAvoidHeroVideo() || !heroIsVisible || document.hidden || heroVideoFailed.value) {
    video.pause()
    return
  }

  if (!heroVideoCanLoad.value) {
    // Give the loaded poster a paint before attaching the video source.
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    if (heroDisposed || !heroPosterSettled.value || shouldAvoidHeroVideo() || !heroIsVisible || document.hidden || heroVideoRef.value !== video) return
    heroVideoCanLoad.value = true
    await nextTick()
  }

  try {
    await video.play()
  } catch (error) {
    // 自动播放被浏览器阻止时保留封面，不展示黑屏或错误状态。
    console.warn('Hero background video autoplay was skipped', error)
  }
}

const onHeroPosterSettled = () => {
  heroPosterSettled.value = true
  void syncHeroVideoPlayback()
}

const onHeroPageLoad = async () => {
  await document.fonts.ready
  if (heroDisposed) return
  heroPageReady = true
  void syncHeroVideoPlayback()
}

watch([heroBackgroundUrl, heroPosterUrl], async () => {
  if (!import.meta.client) return
  heroVideoCanLoad.value = false
  heroVideoReady.value = false
  heroVideoFailed.value = false
  await nextTick()
  if (heroDisposed) return
  heroPosterSettled.value = !heroPosterUrl.value || Boolean(heroPosterRef.value?.complete)
  void syncHeroVideoPlayback()
})

const onHeroVideoPlaying = () => {
  if (!shouldAvoidHeroVideo()) {
    heroVideoReady.value = true
  }
}

const onHeroVideoError = () => {
  heroVideoFailed.value = true
  heroVideoReady.value = false
}

const handleMotionPreferenceChange = () => {
  if (shouldAvoidHeroVideo()) {
    heroVideoReady.value = false
  }

  resetTyping()
  void syncHeroVideoPlayback()
}

const handleDocumentVisibilityChange = () => {
  void syncHeroVideoPlayback()
}

const resetTyping = () => {
  clearTypingTimers()

  const characters = Array.from(typingIntroText.value)
  if (reducedMotionQuery?.matches) {
    displayedIntroChars.value = characters
    return
  }

  displayedIntroChars.value = []
  let index = 0

  typingTimer = setInterval(() => {
    if (index >= characters.length) {
      clearTypingTimers()
      restartTimer = setTimeout(() => {
        resetTyping()
      }, 1800)
      return
    }

    displayedIntroChars.value.push(characters[index] || '')
    index += 1
  }, 120)
}

watch(typingIntroText, () => {
  if (import.meta.client) {
    resetTyping()
  }
})

onMounted(() => {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotionQuery.addEventListener('change', handleMotionPreferenceChange)
  resetTyping()
  document.addEventListener('visibilitychange', handleDocumentVisibilityChange)
  heroPosterSettled.value = !heroPosterUrl.value || Boolean(heroPosterRef.value?.complete)
  if (document.readyState === 'complete') {
    void onHeroPageLoad()
  } else {
    window.addEventListener('load', onHeroPageLoad, { once: true })
  }

  if (heroVisualRef.value) {
    heroVideoObserver = new IntersectionObserver(([entry]) => {
      heroIsVisible = Boolean(entry?.isIntersecting)
      void syncHeroVideoPlayback()
    }, {
      threshold: 0.05
    })
    heroVideoObserver.observe(heroVisualRef.value)
  }

  void syncHeroVideoPlayback()

  // SSR 数据已预加载，直接触发入场动画
  if (!pending.value) {
    triggerReveal()
  }
})

onBeforeUnmount(() => {
  heroDisposed = true
  window.removeEventListener('load', onHeroPageLoad)
  clearTypingTimers()
  heroVideoObserver?.disconnect()
  heroVideoObserver = null
  reducedMotionQuery?.removeEventListener('change', handleMotionPreferenceChange)
  reducedMotionQuery = null
  document.removeEventListener('visibilitychange', handleDocumentVisibilityChange)
  heroVideoRef.value?.pause()
})
</script>

<style scoped lang="scss">
.blog-home {
  position: relative;
  min-height: 100vh;
  z-index: 0;
}

/* ========== 骨架屏淡出 ========== */
.page-revealed :deep(.page-curtain) {
  opacity: 0;
  transition: opacity 0.5s ease;
}

/* ========== Hero 内容入场 ========== */
.hero-content {
  width: min(1120px, 100%);
  text-align: center;
  padding: 20px;
  opacity: 0;
  transform: translateY(50px);
  transition:
    opacity 0.8s ease,
    transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}

.page-revealed .hero-content {
  opacity: 1;
  transform: translateY(0);
}

.page-top-visual {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.viewport-background {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  background: var(--hero-gradient-start, #000000);

  /* 顶部渐变叠加层，导航栏保持透明 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 20%;
    min-height: 60px;
    background: linear-gradient(to bottom, var(--hero-gradient-start, #000000), transparent);
    pointer-events: none;
    user-select: none;
    z-index: 3;
    transition: background 0.4s cubic-bezier(0.345, 0.045, 0.345, 1);
  }

  .viewport-bg-poster,
  .viewport-bg-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    animation: bgZoomIn 1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
  }

  .viewport-bg-poster {
    z-index: 1;
    opacity: 1;
    transition: opacity 0.65s ease;
  }

  .viewport-bg-video {
    z-index: 2;
    opacity: 0;
    transition: opacity 0.65s ease;
  }

  &.is-video-ready {
    .viewport-bg-poster {
      opacity: 0;
    }

    .viewport-bg-video {
      opacity: 1;
    }
  }

  &.has-video-error .viewport-bg-video {
    display: none;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}

@keyframes bgZoomIn {
  from {
    transform: scale(1.2);
  }
  to {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .viewport-background {
    .viewport-bg-poster {
      animation: none;
    }

    .viewport-bg-video {
      display: none;
    }
  }
}

.hero-section {
  position: relative;
  z-index: 3;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px 56px;
}

.hero-name {
  margin-bottom: 20px;
  font-size: 92px;
  font-weight: 700;
  line-height: 1.05;
  color: var(--brand-accent);
  letter-spacing: 2px;
  text-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}

.hero-title {
  margin: 0;
  font-size: 32px;
  line-height: 1.6;
  font-weight: 500;
  color: #ffffff;
  letter-spacing: 1px;
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
}

.title-char {
  display: inline-block;
  animation: fadeInUp 0.35s ease-out;
}

.title-cursor {
  display: inline-block;
  width: 2px;
  height: 38px;
  margin-left: 8px;
  vertical-align: middle;
  background-color: var(--home-accent);
}

.title-cursor.blinking {
  animation: blink 1s infinite;
}

.hero-socials {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--sl-color, rgba(255, 255, 255, 0.7));
  background: var(--sl-bg, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--sl-border, rgba(255, 255, 255, 0.12));
  transition:
    color 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    border-radius 0.3s cubic-bezier(0.22, 1, 0.36, 1);

  :deep(svg) {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: var(--sl-hover-color, #ffffff);
    background: var(--sl-hover-bg, var(--brand-accent-soft));
    border-color: var(--sl-hover-color, var(--brand-accent));
    border-radius: 10px;
    transform: scale(1.1) translateY(-2px);
  }
}

.wave-divider {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 120px;
  z-index: 2;
  overflow: hidden;
  pointer-events: none;
}

.wave-track {
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  width: 200%;
  height: 100%;
  animation: wave-flow linear infinite;

  svg {
    width: 50%;
    height: 100%;
    display: block;
  }
}

.wave-track-layer1 {
  opacity: 0.25;
  animation-duration: 22s;
}

.wave-track-layer2 {
  opacity: 0.55;
  animation-duration: 14s;
}

.wave-track-layer3 {
  opacity: 1;
  animation-duration: 9s;
}

@keyframes wave-flow {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

.content-section {
  position: relative;
  z-index: 3;
  background: var(--home-surface);
}

.content-shell {
  width: min(1000px, calc(100% - 60px));
  margin: 0 auto;
  padding: 72px 0 56px;
}

.home-moments {
  width: min(1000px, 100%);
  margin: 56px auto 0;
  color: var(--home-text);
}

.moments-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }
}

.more-moments {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--home-text);
  font-size: 14px;
  text-decoration: none;

  &:hover { color: var(--brand-accent); }
  &:focus-visible { outline: 2px solid var(--home-text); outline-offset: 4px; }
}

@media (max-width: 1200px) {
  .home-moments { width: min(700px, 100%); }
  .content-shell {
    width: min(760px, calc(100% - 60px));
    margin: 0 auto;
  }

  .hero-name {
    font-size: 72px;
  }

  .hero-title {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .home-moments { width: min(368px, 100%); margin-top: 40px; }
  .moments-heading { margin-bottom: 20px; }
  .moments-heading h2 { font-size: 24px; }
  .hero-section {
    padding: 88px 16px 48px;
  }

  .hero-name {
    font-size: 52px;
  }

  .hero-title {
    font-size: 24px;
  }

  .hero-socials {
    gap: 12px;
    margin-top: 24px;
  }

  .social-link {
    width: 38px;
    height: 38px;

    :deep(svg) {
      width: 18px;
      height: 18px;
    }
  }

  .title-cursor {
    height: 24px;
  }

  .content-shell {
    width: min(100%, calc(100% - 60px));
    padding-top: 48px;
  }
}
</style>

<template>
  <div class="blog-home" :class="{ 'page-revealed': isRevealed }">
    <!-- 骨架屏幕布 -->
    <PageCurtain v-model="curtainReady" @opened="onCurtainOpened" />

    <section class="page-top-visual">

      <div class="viewport-background">
        <video class="viewport-bg-video" autoplay loop muted playsinline poster="~/assets/img/background.png">
          <source src="~/assets/img/hero-bg.mp4" type="video/mp4" />
        </video>
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
          :total-articles="homeData.totalArticles"
          :categories="homeData.categories"
          :tags="homeData.tags"
          :recent-articles="homeData.recentArticles"
          :loading="pending"
        />

        <HomeNewestSection
          :articles="homeData.articles"
          :loading="pending"
          :error-message="homeData.error"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import PageCurtain from '~/components/layouts/PageCurtain.vue'
import HomeFeaturePanel from '~/components/home/HomeFeaturePanel.vue'
import HomeNewestSection from '~/components/home/HomeNewestSection.vue'
import { getArticleList } from '~/composables/api/article'
import { getCategoryList } from '~/composables/api/category'
import { getTagList } from '~/composables/api/tag'
import { getBasicSettings, getSettings } from '~/composables/api/user'
import type { ArticleListItem, CategoryItem, TagItem } from '~/composables/useApi'
import IconMaterialSymbolsMailOutlineRounded from '~icons/material-symbols/mail-outline-rounded'
import IconMdiEarth from '~icons/mdi/earth'

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
  categories: CategoryItem[]
  tags: TagItem[]
  recentArticles: FeatureArticleItem[]
  basicSettings: Record<string, string>
  blogSettings: Record<string, string>
  error: string
}

const DEFAULT_COVER = 'https://picsum.photos/600/400?random=31'
const DEFAULT_AVATAR = 'https://picsum.photos/200/200?random=7'
const EMPTY_HOME_PAYLOAD: HomePayload = {
  articles: [],
  totalArticles: 0,
  categories: [],
  tags: [],
  recentArticles: [],
  basicSettings: {},
  blogSettings: {},
  error: ''
}

const currentPage = ref(1)
const pageSize = 10
const displayedIntroChars = ref<string[]>([])
let typingTimer: ReturnType<typeof setInterval> | null = null
let restartTimer: ReturnType<typeof setTimeout> | null = null

const formatDate = (value: string) => {
  if (!value) return ''
  const date = new Date(value.replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN')
}

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
  cover: proxyImageUrl(item.cover) || DEFAULT_COVER,
  publishDate: formatDate(item.publish_time),
  categoryName: item.category?.name || '未分类'
})

const mapArticleCard = (item: ArticleListItem): ArticleCard => ({
  ...mapBaseArticle(item),
  categoryUrl: item.category?.url || '',
  tags: item.tags?.map((tag) => ({ name: tag.name, url: tag.url })) || []
})

const mapFeatureArticle = (item: ArticleListItem): FeatureArticleItem => mapBaseArticle(item)

const buildHomePayload = async (): Promise<HomePayload> => {
  try {
    const [articlesResponse, categoriesResponse, tagsResponse, recentResponse, settingsResponse, blogSettingsResponse] = await Promise.all([
      getArticleList({
        page: currentPage.value,
        page_size: pageSize
      }),
      getCategoryList({ page_size: 10 }),
      getTagList({ page_size: 20 }),
      getArticleList({ page_size: 6 }),
      getBasicSettings(),
      getSettings('blog')
    ])

    return {
      articles: (articlesResponse.data.list || []).map(mapArticleCard),
      totalArticles: articlesResponse.data.total || 0,
      categories: categoriesResponse.data.list || [],
      tags: tagsResponse.data.list || [],
      recentArticles: (recentResponse.data.list || []).map(mapFeatureArticle),
      basicSettings: settingsResponse.data || {},
      blogSettings: blogSettingsResponse.data || {},
      error: ''
    }
  } catch (error) {
    console.error(error)
    return {
      ...EMPTY_HOME_PAYLOAD,
      error: '获取首页数据失败，请稍后重试'
    }
  }
}

const { data, pending } = await useAsyncData<HomePayload>('home-page', buildHomePayload, {
  watch: [currentPage]
})

const homeData = computed(() => data.value || EMPTY_HOME_PAYLOAD)
const basicSettings = computed(() => homeData.value.basicSettings)
const blogSettings = computed(() => homeData.value.blogSettings)

const isRevealed = ref(false)
const curtainReady = ref(false)

// 数据加载完成后触发动画序列
const triggerReveal = () => {
  setTimeout(() => {
    curtainReady.value = true
  }, 200)
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
const authorAvatar = computed(() => proxyImageUrl(basicSettings.value['basic.author_avatar']) || DEFAULT_AVATAR)
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
const typingIntroText = computed(() => authorDesc.value || '欢迎来到这里。')
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

const resetTyping = () => {
  clearTypingTimers()

  displayedIntroChars.value = []
  const text = typingIntroText.value
  let index = 0

  typingTimer = setInterval(() => {
    if (index >= text.length) {
      clearTypingTimers()
      restartTimer = setTimeout(() => {
        resetTyping()
      }, 1800)
      return
    }

    displayedIntroChars.value.push(text[index] || '')
    index += 1
  }, 120)
}

watch(typingIntroText, () => {
  if (import.meta.client) {
    resetTyping()
  }
})

onMounted(() => {
  resetTyping()

  // SSR 数据已预加载，直接触发入场动画
  if (!pending.value) {
    triggerReveal()
  }
})

onBeforeUnmount(() => {
  clearTypingTimers()
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

  /* 顶部渐变叠加层 */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 20%;
    min-height: 60px;
    background: linear-gradient(to bottom, var(--hero-gradient-start, #000000) 0%, transparent 100%);
    pointer-events: none;
    z-index: 3;
    transition: background 0.4s cubic-bezier(0.345, 0.045, 0.345, 1);
  }

  .viewport-bg-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    animation: bgZoomIn 1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
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

@media (max-width: 1200px) {
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

<template>
  <div class="blog-home">
    <section class="page-top-visual">
      <div class="header-gradient"></div>

      <div class="viewport-background">
        <img src="~/assets/img/background.png" alt="背景" class="viewport-bg-image" />
        <div class="viewport-bg-overlay"></div>
      </div>

      <div class="background-animation">
        <div v-for="(star, index) in stars" :key="index" class="star" :style="star"></div>
        <div v-for="(flower, index) in flowers" :key="`flower-${index}`" class="flower" :style="flower"></div>
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
    </section>

    <section class="content-section">
      <div class="content-shell">
        <HomeFeaturePanel
          :author-name="authorName"
          :author-desc="authorDesc"
          :author-avatar="authorAvatar"
          :author-github="authorGithub"
          :announcement-html="announcementHtml"
          :total-articles="totalArticles"
          :categories="categories"
          :tags="tags"
          :recent-articles="recentArticles"
          :loading="pending"
        />

        <section class="newest-section">
          <div class="newest-wrapper">
            <div class="section-heading">
              <h2>Newest</h2>
            </div>

            <div v-if="categoryTabs.length > 1" class="category-nav">
            </div>

            <div class="articles-section">
              <div v-if="pending" class="loading-container">
                <el-skeleton :rows="6" animated />
              </div>

              <div v-else-if="pageError" class="error-container">
                <el-alert :title="pageError" type="error" show-icon />
              </div>

              <div v-else class="articles-grid">
                <article
                  v-for="(article, index) in articles"
                  :key="article.id"
                  class="article-card"
                  :class="{ featured: index === 0 }"
                >
                  <NuxtLink :to="`/article/${article.slug}`" class="article-cover-link">
                    <div class="article-cover">
                      <img :src="article.cover" :alt="article.title" loading="lazy" class="lazy-image" />
                    </div>
                  </NuxtLink>

                  <div class="article-content">
                    <h3 class="article-title">
                      <NuxtLink :to="`/article/${article.slug}`">
                        {{ article.title }}
                      </NuxtLink>
                    </h3>
                    <div class="article-meta">
                      <div class="meta-topline">
                        <span class="category">
                          <IconMaterialSymbolsFolderOpenRounded />
                          {{ article.categoryName }}
                        </span>
                        <span
                          v-for="tag in article.tags.slice(0, 1)"
                          :key="tag.name"
                          class="category"
                        >
                          {{ tag.name }}
                        </span>
                      </div>
                      <span class="date">{{ article.publishDate }}</span>
                    </div>

                    

                    <!-- <div v-if="article.tags.length > 0 && index === 0" class="article-tags">
                      <span v-for="tag in article.tags" :key="tag.name" class="article-tag">#{{ tag.name }}</span>
                    </div> -->
                  </div>
                </article>

                <div v-if="articles.length === 0" class="empty-container">
                  <el-empty description="暂无文章" />
                </div>
              </div>


            </div>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import IconMaterialSymbolsFolderOpenRounded from '~icons/material-symbols/folder-open-rounded'
import HomeFeaturePanel from '~/components/home/HomeFeaturePanel.vue'
import { getArticleList } from '~/composables/api/article'
import { getCategoryList } from '~/composables/api/category'
import { getTagList } from '~/composables/api/tag'
import { getBasicSettings, getSettings } from '~/composables/api/user'
import type { ArticleListItem, CategoryItem, TagItem } from '~/composables/useApi'

interface ArticleCard {
  id: number
  slug: string
  title: string
  cover: string
  publishDate: string
  categoryName: string
  categoryUrl: string
  tags: Array<{
    name: string
    url?: string
  }>
}

interface FeatureArticleItem {
  id: number
  slug: string
  title: string
  publishDate: string
  categoryName: string
  cover: string
}

interface Particle {
  left: string
  top: string
  animationDelay: string
  animationDuration: string
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

const currentPage = ref(1)
const pageSize = 10
const stars = ref<Particle[]>([])
const flowers = ref<Particle[]>([])
const displayedIntroChars = ref<string[]>([])
let typingTimer: ReturnType<typeof setInterval> | null = null
let restartTimer: ReturnType<typeof setTimeout> | null = null

const formatDate = (value: string) => {
  if (!value) return ''
  const date = new Date(value.replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN')
}
// 解析文章slug，有slug则返回slug，没有则返回id
const resolveArticleSlug = (item: Pick<ArticleListItem, 'id' | 'slug' | 'url'>) => {
  if (item.slug) {
    return item.slug
  }

  if (item.url) {
    const matched = item.url.match(/\/([^/]+)\/?$/)
    if (matched?.[1]) {
      return decodeURIComponent(matched[1])
    }
  }

  return String(item.id)
}

const mapArticleCard = (item: ArticleListItem): ArticleCard => ({
  id: item.id,
  slug: resolveArticleSlug(item),
  title: item.title,
  cover: item.cover || DEFAULT_COVER,
  publishDate: formatDate(item.publish_time),
  categoryName: item.category?.name || '未分类',
  categoryUrl: item.category?.url || '',
  tags: item.tags?.map((tag) => ({ name: tag.name, url: tag.url })) || []
})

const { data, pending } = await useAsyncData<HomePayload>(
  'home-page',
  async () => {
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
        recentArticles: (recentResponse.data.list || []).map((item) => ({
          id: item.id,
          slug: resolveArticleSlug(item),
          title: item.title,
          publishDate: formatDate(item.publish_time),
          categoryName: item.category?.name || '未分类',
          cover: item.cover || DEFAULT_COVER
        })),
        basicSettings: settingsResponse.data || {},
        blogSettings: blogSettingsResponse.data || {},
        error: ''
      }
    } catch (error) {
      console.error(error)
      return {
        articles: [],
        totalArticles: 0,
        categories: [],
        tags: [],
        recentArticles: [],
        basicSettings: {},
        blogSettings: {},
        error: '获取首页数据失败，请稍后重试'
      }
    }
  },
  {
    watch: [currentPage]
  }
)

const articles = computed(() => data.value?.articles || [])
const totalArticles = computed(() => data.value?.totalArticles || 0)
const categories = computed(() => data.value?.categories || [])
const tags = computed(() => data.value?.tags || [])
const recentArticles = computed(() => data.value?.recentArticles || [])
const basicSettings = computed(() => data.value?.basicSettings || {})
const blogSettings = computed(() => data.value?.blogSettings || {})
const pageError = computed(() => data.value?.error || '')

const authorName = computed(() => basicSettings.value['basic.author'] || '')
const authorDesc = computed(() => basicSettings.value['basic.author_desc'] || '')
const authorAvatar = computed(() => basicSettings.value['basic.author_avatar'] || DEFAULT_AVATAR)
const authorGithub = computed(() => {
  return (
    basicSettings.value['basic.github'] ||
    basicSettings.value['basic.author_github'] ||
    basicSettings.value['basic.social_github'] ||
    ''
  )
})
const typingIntroText = computed(() => authorDesc.value || '欢迎来到这里。')

const announcementHtml = computed(() => blogSettings.value['blog.announcement'] || '')

const categoryTabs = computed(() => {
  const base = [{ key: 'all', label: '全部文章', active: true }]
  const realTabs = categories.value.map((category) => ({
    key: category.slug,
    label: category.name,
    active: false
  }))
  return [...base, ...realTabs]
})

const generateParticles = () => {
  stars.value = Array.from({ length: 20 }, () => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${Math.random() * 3 + 2}s`
  }))

  flowers.value = Array.from({ length: 10 }, () => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 10}s`,
    animationDuration: `${Math.random() * 5 + 5}s`
  }))
}

const resetTyping = () => {
  if (typingTimer) {
    clearInterval(typingTimer)
    typingTimer = null
  }
  if (restartTimer) {
    clearTimeout(restartTimer)
    restartTimer = null
  }

  displayedIntroChars.value = []
  const text = typingIntroText.value
  let index = 0

  typingTimer = setInterval(() => {
    if (index >= text.length) {
      if (typingTimer) {
        clearInterval(typingTimer)
        typingTimer = null
      }
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
  generateParticles()
  resetTyping()
})

onBeforeUnmount(() => {
  if (typingTimer) {
    clearInterval(typingTimer)
  }
  if (restartTimer) {
    clearTimeout(restartTimer)
  }
})
</script>

<style scoped lang="scss">
.blog-home {
  position: relative;
  min-height: 100vh;
  z-index: 0;
}

.page-top-visual {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.header-gradient {
  position: absolute;
  inset: 0 0 auto;
  height: 60px;
  background: var(--bg-header);
  pointer-events: none;
  z-index: 4;
}

.viewport-background {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;

  .viewport-bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transform: scale(1.04);
  }

  .viewport-bg-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(4, 4, 4, 0.18) 0%, rgba(4, 4, 4, 0.46) 30%, rgba(4, 4, 4, 0.9) 78%, #050505 100%);
  }
}

.background-animation {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background-color: #f0f992;
  border-radius: 50%;
  animation: twinkle 3s infinite ease-in-out;
  box-shadow: 0 0 4px 2px rgba(240, 249, 146, 0.8);
}

.flower {
  position: absolute;
  width: 4px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.65);
  border-radius: 50%;
  animation: float 8s infinite ease-in-out;
  box-shadow: 0 0 6px 3px rgba(255, 255, 255, 0.18);
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }

  50% {
    transform: translateY(-50px) rotate(180deg);
    opacity: 1;
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

.hero-section {
  position: relative;
  z-index: 3;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px 56px;
}

.hero-content {
  width: min(1120px, 100%);
  text-align: center;
  padding: 20px;
}

.hero-name {
  margin-bottom: 20px;
  font-size: 92px;
  font-weight: 700;
  line-height: 1.05;
  color: #84dfff;
  letter-spacing: 2px;
  text-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}

.hero-title {
  margin: 0;
  font-size: 46px;
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
}

@media (max-width: 768px) {
  .content-shell {
    width: min(560px, calc(100% - 40px));
    margin: 0 auto;
  }
}

.newest-section {
  margin-top: 28px;
}

.newest-wrapper {
  color: var(--home-text);
  width: min(1000px, 100%);
  margin: 0 auto;
}

.section-heading {
  margin-bottom: 28px;

  h2 {
    margin: 0;
    display: inline-block;
    font-size: 48px;
    line-height: 1.08;
    color: var(--home-text);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      left: 4px;
      bottom: 2px;
      width: 72%;
      height: 7px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--home-accent), transparent);
    }
  }

  p {
    margin: 14px 0 0;
    color: var(--home-text-muted);
    font-size: 15px;
  }
}

.category-nav {
  margin-bottom: 30px;

  .category-tabs {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding-bottom: 6px;
  }
}

.category-tab {
  padding: 9px 18px;
  border-radius: 999px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  color: var(--home-text-muted);
  font-size: 14px;
  cursor: default;
  transition: all 0.25s ease;
  white-space: nowrap;

  &.active {
    border-color: var(--home-accent);
    background: var(--home-card-hover);
    color: var(--home-text);
    box-shadow: var(--home-shadow);
  }
}

.articles-section {
  .loading-container,
  .error-container,
  .empty-container {
    padding: 40px 0;
    text-align: center;
  }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.article-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 30px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease, background 0.28s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: var(--accent-border);
    background: var(--home-card-hover);
  }
}

.article-card.featured {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.95fr);
  min-height: 360px;
}

.article-cover-link {
  display: block;
  min-width: 0;
}

.article-cover {
  height: 260px;
  overflow: hidden;
  background: var(--home-card-alt);
}

.article-card:not(.featured) .article-cover {
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.article-card.featured .article-cover {
  height: 100%;
  border-radius: 0;
  background: var(--home-card-alt);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
}

.article-card:not(.featured) .article-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}

.article-card:hover .article-cover img {
  transform: scale(1.06);
}

.article-content {
  padding: 22px 24px 24px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.article-card.featured .article-content {
  padding: 34px 36px 28px;
  justify-content: space-between;
}

.article-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
}

.meta-topline {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;

  .category {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--home-accent);
    font-size: 13px;
    font-weight: 600;

    :deep(svg) {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
  }
}

.article-meta .date {
  font-size: 14px;
  color: var(--home-text-muted);
}

.article-title {
  margin: 0 0 14px;
  font-size: 18px;
  line-height: 1.45;
  color: var(--home-text);
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;

  a {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--home-accent);
    }
  }
}

.article-card.featured .article-title {
  font-size: 30px;
  line-height: 1.2;
  -webkit-line-clamp: 3;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.18);
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.article-tag {
  color: var(--home-text-muted);
  font-size: 12px;
}



@media (max-width: 1200px) {
  .newest-wrapper {
    width: min(700px, 100%);
  }

  .hero-name {
    font-size: 72px;
  }

  .hero-title {
    font-size: 36px;
  }

  .section-heading h2 {
    font-size: 44px;
  }

  .article-card.featured {
    grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.95fr);
    min-height: 280px;
  }

  .article-card.featured .article-content {
    padding: 26px 26px 22px;
  }

  .article-card.featured .article-title {
    font-size: 36px;
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

  .title-cursor {
    height: 24px;
  }

  .content-shell {
    width: min(100%, calc(100% - 60px));
    padding-top: 48px;
  }

  .newest-section {
    margin-top: 64px;
  }

  .newest-wrapper {
    width: min(368px, 100%);
  }

  .section-heading h2 {
    font-size: 32px;
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }

  .article-card {
    border-radius: 24px;
  }

  .article-cover {
    height: 220px;
  }

  .article-title {
    font-size: 16px;
  }

  .article-card.featured {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .article-card.featured .article-cover {
    height: 220px;
  }

  .article-content,
  .article-card.featured .article-content {
    padding: 18px 18px 20px;
  }

  .article-card.featured .article-title {
    font-size: 18px;
    line-height: 1.35;
  }
}
</style>

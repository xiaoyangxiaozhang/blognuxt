<template>
  <div class="articles-page">
    <main class="articles-shell">
      <header class="page-heading">
        <div class="heading-copy">
          <h1>全部文章</h1>
        </div>

        <div class="heading-tools">
          <span class="switch-label">浏览方式</span>
          <div class="view-switch" role="group" aria-label="文章浏览模式">
            <button
              type="button"
              :class="{ active: viewMode === 'infinite' }"
              :aria-pressed="viewMode === 'infinite'"
              @click="viewMode = 'infinite'"
            >
              无限滚动
            </button>
            <button
              type="button"
              :class="{ active: viewMode === 'pagination' }"
              :aria-pressed="viewMode === 'pagination'"
              @click="viewMode = 'pagination'"
            >
              分页模式
            </button>
          </div>
        </div>
      </header>

      <section class="filter-panel" aria-label="文章筛选">
        <div class="filter-field">
          <span class="filter-label">关键词</span>
          <label class="search-shell" for="all-articles-search">
            <MagnifyingGlassIcon class="search-icon" aria-hidden="true" />
            <input
              id="all-articles-search"
              v-model.trim="searchKeyword"
              class="search-input"
              type="search"
              aria-label="搜索标题、分类或标签"
              placeholder="搜索标题、分类或标签"
            />
          </label>
        </div>

        <div class="filter-field category-field">
          <span class="filter-label">分类</span>
          <div class="category-filters" role="group" aria-label="按分类筛选">
            <button
              v-for="category in categories"
              :key="category"
              type="button"
              :class="{ active: activeCategory === category }"
              :aria-pressed="activeCategory === category"
              @click="activeCategory = category"
            >
              {{ category }}
            </button>
          </div>
        </div>
      </section>

      <div class="result-summary" role="status" aria-live="polite">
        <span class="result-count">找到 <strong>{{ filteredArticles.length }}</strong> 篇文章</span>
        <span v-if="viewMode === 'infinite' && filteredArticles.length">
          已显示 {{ displayedArticles.length }} 篇
        </span>
        <span v-else-if="viewMode === 'pagination' && filteredArticles.length">
          第 {{ currentPage }} / {{ totalPages }} 页
        </span>
      </div>

      <div v-if="pending" class="state-block">
        <el-skeleton :rows="10" animated />
      </div>

      <div v-else-if="pageError" class="state-block">
        <el-alert :title="pageError" type="error" show-icon />
      </div>

      <section v-else ref="resultsRef" class="article-results" aria-label="文章列表">
        <ArticleMasonryFeed
          :items="displayedArticles"
          :empty-text="emptyText"
        />

        <template v-if="filteredArticles.length">
          <div v-if="viewMode === 'infinite'" class="infinite-state" aria-live="polite">
            <span v-if="hasMore">继续向下滚动加载更多文章</span>
            <span v-else>已展示全部 {{ filteredArticles.length }} 篇文章</span>
            <div v-if="hasMore" ref="sentinelRef" class="feed-sentinel" aria-hidden="true"></div>
          </div>

          <el-pagination
            v-else
            v-model:current-page="currentPage"
            class="article-pagination"
            background
            :page-size="PAGE_SIZE"
            :pager-count="5"
            :total="filteredArticles.length"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </template>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon } from '@svg-animated-icons/vue'
import ArticleMasonryFeed from '~/components/articles/ArticleMasonryFeed.vue'
import { getArticleList } from '~/services/api/article'
import { mapArticleCard, type DisplayArticleCard } from '~/utils/article'

type ViewMode = 'infinite' | 'pagination'

const PAGE_SIZE = 12
const VIEW_MODE_KEY = 'all-articles-view-mode'

const viewMode = ref<ViewMode>('infinite')
const searchKeyword = ref('')
const activeCategory = ref('全部')
const currentPage = ref(1)
const visibleCount = ref(PAGE_SIZE)
const sentinelRef = ref<HTMLElement | null>(null)
const resultsRef = ref<HTMLElement | null>(null)
let loadObserver: IntersectionObserver | null = null

const { data, pending } = await useAsyncData('all-articles-page', async () => {
  try {
    const response = await getArticleList({ page: 0, page_size: 0 })
    if (response.code !== 0) {
      throw new Error(response.message || '获取文章失败')
    }

    return {
      articles: (response.data.list || []).map(mapArticleCard),
      error: ''
    }
  } catch (error) {
    console.error(error)
    return {
      articles: [] as DisplayArticleCard[],
      error: '文章列表加载失败，请稍后重试'
    }
  }
})

const articles = computed(() => data.value?.articles || [])
const pageError = computed(() => data.value?.error || '')
const normalizedKeyword = computed(() => searchKeyword.value.trim().toLocaleLowerCase())

const categories = computed(() => [
  '全部',
  ...Array.from(new Set(articles.value.map((article) => article.categoryName)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
])

const filteredArticles = computed(() => articles.value.filter((article) => {
  if (activeCategory.value !== '全部' && article.categoryName !== activeCategory.value) {
    return false
  }

  if (!normalizedKeyword.value) {
    return true
  }

  return [article.title, article.categoryName, ...article.tags.map((tag) => tag.name)]
    .join(' ')
    .toLocaleLowerCase()
    .includes(normalizedKeyword.value)
}))

const totalPages = computed(() => Math.max(1, Math.ceil(filteredArticles.value.length / PAGE_SIZE)))
const hasMore = computed(() => visibleCount.value < filteredArticles.value.length)
const displayedArticles = computed(() => {
  if (viewMode.value === 'infinite') {
    return filteredArticles.value.slice(0, visibleCount.value)
  }

  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredArticles.value.slice(start, start + PAGE_SIZE)
})
const emptyText = computed(() => searchKeyword.value || activeCategory.value !== '全部'
  ? '没有匹配到相关文章'
  : '暂无文章')

const stopObserver = () => {
  loadObserver?.disconnect()
  loadObserver = null
}

const startObserver = () => {
  stopObserver()
  if (!import.meta.client || viewMode.value !== 'infinite' || !hasMore.value || !sentinelRef.value) {
    return
  }

  loadObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      visibleCount.value += PAGE_SIZE
    }
  }, { rootMargin: '320px 0px' })
  loadObserver.observe(sentinelRef.value)
}

const resetListing = () => {
  currentPage.value = 1
  visibleCount.value = PAGE_SIZE
}

const handlePageChange = async () => {
  await nextTick()
  resultsRef.value?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  })
}

watch([normalizedKeyword, activeCategory], resetListing)

watch(viewMode, async (mode) => {
  resetListing()
  if (import.meta.client) {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  }
  await nextTick()
  startObserver()
})

watch([hasMore, displayedArticles], async () => {
  await nextTick()
  startObserver()
})

onMounted(async () => {
  const savedMode = localStorage.getItem(VIEW_MODE_KEY)
  if (savedMode === 'infinite' || savedMode === 'pagination') {
    viewMode.value = savedMode
  }
  await nextTick()
  startObserver()
})

onBeforeUnmount(stopObserver)

useSeoMeta({
  title: '全部文章',
  description: '浏览小羊嚣张博客发布的全部文章。'
})
</script>

<style scoped lang="scss">
.articles-page {
  min-height: 100dvh;
  background: var(--home-surface);
  color: var(--home-text);
  --articles-muted: color-mix(in srgb, var(--home-text) 62%, var(--home-surface));
}

.articles-shell {
  width: min(1000px, calc(100% - 60px));
  margin: 0 auto;
  padding: 104px 0 80px;
}

.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 36px;
}

.heading-copy {
  max-width: 620px;
}

.switch-label,
.filter-label {
  display: block;
  color: var(--articles-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.4;
  text-transform: uppercase;
}

.heading-copy h1 {
  position: relative;
  display: inline-block;
  margin: 0;
  font-size: clamp(34px, 4vw, 42px);
  letter-spacing: -0.03em;
  line-height: 1.15;
  font-weight: 800;
  text-wrap: balance;

  &::after {
    position: absolute;
    right: 0;
    bottom: -7px;
    left: 0;
    height: 4px;
    border-radius: 999px;
    background: var(--brand-accent);
    content: '';
  }
}

.heading-tools {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.switch-label {
  padding-right: 2px;
  font-size: 10px;
}

.filter-label {
  font-size: 10px;
  letter-spacing: 0.1em;
}

.view-switch {
  display: inline-flex;
  flex-shrink: 0;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--home-border);
  border-radius: 12px;
  background: var(--home-card-bg);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--home-text) 5%, transparent);
}

.view-switch button,
.category-filters button {
  border: 0;
  color: var(--home-text-muted);
  background: transparent;
  cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast), transform 140ms var(--ease-out-expo);

  &:focus-visible {
    outline: 2px solid var(--brand-accent);
    outline-offset: 2px;
  }
}

.view-switch button {
  min-height: 40px;
  padding: 0 15px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;

  &.active {
    color: var(--brand-accent-text);
    background: var(--brand-accent);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--brand-accent) 20%, transparent);
  }

  &:active {
    transform: scale(0.97);
  }
}

.filter-panel {
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  align-items: center;
  gap: 28px;
  margin-bottom: 0;
  padding: 18px 0 20px;
  border-top: 1px solid var(--home-border);
}

.filter-field {
  display: grid;
  gap: 8px;
}

.search-shell {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid var(--home-border);
  border-radius: 11px;
  background: color-mix(in srgb, var(--home-card-bg) 72%, var(--home-surface));
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &:focus-within {
    border-color: var(--brand-accent);
    box-shadow: 0 0 0 3px var(--brand-accent-soft);
  }
}

.search-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--home-text-muted);
}

.search-input {
  width: 100%;
  border: 0;
  outline: 0;
  color: var(--home-text);
  background: transparent;
  font-size: 14px;

  &::placeholder {
    color: var(--articles-muted);
  }
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 8px;
}

.category-filters button {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 13px;

  &:hover {
    color: var(--home-text);
    background: var(--home-card-hover);
  }

  &.active {
    border-color: color-mix(in srgb, var(--brand-accent) 35%, transparent);
    color: var(--brand-accent);
    background: var(--brand-accent-soft);
  }

  &:active {
    transform: scale(0.97);
  }
}

.result-summary {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin: 16px 2px 20px;
  color: var(--articles-muted);
  font-size: 13px;

  strong {
    color: var(--home-text);
    font-weight: 600;
  }
}

.state-block {
  padding: 30px 0;
}

.article-results {
  scroll-margin-top: 90px;
}

.infinite-state {
  position: relative;
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: center;
  color: var(--articles-muted);
  font-size: 13px;
}

.feed-sentinel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
}

.article-pagination {
  justify-content: center;
  margin-top: 28px;

  :deep(.btn-prev),
  :deep(.btn-next),
  :deep(.el-pager li) {
    color: var(--home-text);
    background: var(--home-card-bg);
  }

  :deep(.el-pager li.is-active) {
    color: #fff;
    background: var(--brand-accent);
  }
}

@media (max-width: 1200px) {
  .articles-shell {
    width: min(760px, calc(100% - 60px));
  }
}

@media (max-width: 900px) {
  .filter-panel {
    grid-template-columns: 1fr;
  }

  .category-filters {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .articles-shell {
    width: min(100%, calc(100% - 60px));
    padding: 96px 0 56px;
  }

  .page-heading {
    gap: 20px;
  }

  .heading-copy h1 {
    font-size: 34px;
  }

  .view-switch button {
    padding: 0 11px;
  }

  .filter-panel {
    gap: 18px;
    padding: 18px 0 20px;
  }
}

@media (max-width: 560px) {
  .page-heading {
    flex-direction: column;
  }

  .heading-tools {
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-top: 0;
  }

  .switch-label {
    padding-right: 0;
  }

  .result-summary {
    flex-direction: column;
    gap: 4px;
  }
}
</style>

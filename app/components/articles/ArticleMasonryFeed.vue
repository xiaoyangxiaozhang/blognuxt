<template>
  <section ref="feedRef" class="article-feed" :class="{ 'article-feed-overview': isControlled, 'scroll-reveal-enabled': scrollRevealReady }">
    <div v-if="!isControlled" data-scroll-reveal class="feed-head">
      <div class="feed-copy">
        <h2 v-if="title" class="feed-title">{{ title }}</h2>
        <p v-if="description" class="feed-description">{{ description }}</p>
      </div>

      <label class="search-shell" for="article-feed-search">
        <MagnifyingGlassIcon class="search-icon" aria-hidden="true" />
        <input
          id="article-feed-search"
          v-model.trim="searchKeyword"
          class="search-input"
          type="search"
          :aria-label="searchPlaceholder"
          :placeholder="searchPlaceholder"
        />
      </label>
    </div>

    <div v-if="!isControlled && initialLoading" class="state-block">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="!isControlled && errorMessage" class="state-block">
      <el-alert :title="errorMessage" type="error" show-icon />
    </div>

    <template v-else>
      <div v-if="displayArticles.length" class="articles-grid">
        <article
          v-for="(article, index) in displayArticles"
          :key="article.id"
          :data-article-id="article.id"
          data-scroll-reveal
          class="article-entry"
          :class="{ featured: !isControlled && index === 0 }"
          :style="{ '--reveal-delay': revealDelay(index) }"
        >
          <NuxtLink :to="`/article/${encodeURIComponent(article.slug)}`" :aria-label="article.title" class="article-card" :class="{ featured: !isControlled && index === 0 }">
            <div class="article-cover-link">
              <div class="article-cover">
                <img :src="article.cover" :alt="article.title" loading="lazy" decoding="async" />
                <span v-if="isControlled && article.isTop" class="article-pin">置顶</span>
              </div>
            </div>

            <div class="article-content">
              <div data-reveal-child class="article-meta">
                <span class="category">
                  <ArchiveIcon aria-hidden="true" />
                  {{ article.categoryName }}
                </span>
                <span
                  v-for="tag in article.tags.slice(0, 2)"
                  :key="`${article.id}-${tag.slug || tag.name}`"
                  class="tag"
                >
                  {{ tag.name }}
                </span>
              </div>

              <h3 data-reveal-child class="article-title">
                {{ article.title }}
              </h3>

              <span data-reveal-child class="article-date">{{ article.publishDate }}</span>
            </div>
          </NuxtLink>
        </article>
      </div>

      <div v-else class="empty-state">
        <el-empty :description="searchKeyword ? '没有匹配到相关文章' : emptyText" />
      </div>

      <div v-if="!isControlled && showBottomState && visibleArticles.length" class="load-state">
        <span v-if="loadingMore">正在加载更多文章...</span>
        <span v-else-if="!hasMore && articles.length > 0">已经到底啦</span>
      </div>

      <div v-if="!isControlled" ref="sentinelRef" class="feed-sentinel" aria-hidden="true"></div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import { ArchiveIcon, MagnifyingGlassIcon } from '~/utils/siteIcons'
import { getArticleList } from '~/services/api/article'
import { mapArticleCard, type DisplayArticleCard } from '~/utils/article'
import { getDominantColor } from '~/utils/dominantColor'
import { useScrollReveal } from '~/composables/useScrollReveal'

const props = withDefaults(defineProps<{
  items?: DisplayArticleCard[]
  title?: string
  description?: string
  fetchParams?: Record<string, unknown>
  searchPlaceholder?: string
  emptyText?: string
  pageSize?: number
}>(), {
  title: '',
  description: '',
  fetchParams: () => ({}),
  searchPlaceholder: '搜索当前文章列表',
  emptyText: '暂无文章',
  pageSize: 12
})

const feedRef = ref<HTMLElement | null>(null)
const articles = ref<DisplayArticleCard[]>([])
const searchKeyword = ref('')
const page = ref(1)
const total = ref(0)
const initialLoading = ref(true)
const loadingMore = ref(false)
const errorMessage = ref('')
const sentinelRef = ref<HTMLElement | null>(null)
const isControlled = computed(() => props.items !== undefined)
const coverColors = new Map<string, Promise<string>>()

let observer: IntersectionObserver | null = null

const {
  isReady: scrollRevealReady,
  refresh: refreshScrollReveal
} = useScrollReveal(feedRef)

const normalizedKeyword = computed(() => searchKeyword.value.trim().toLowerCase())
const hasMore = computed(() => articles.value.length < total.value)
const showBottomState = computed(() => !initialLoading.value && !errorMessage.value && articles.value.length > 0)

const revealDelay = (index: number) => `${Math.min(index, 5) * 40}ms`

const visibleArticles = computed(() => {
  if (!normalizedKeyword.value) {
    return articles.value
  }

  return articles.value.filter((article) => {
    const haystack = [
      article.title,
      article.categoryName,
      ...article.tags.map((tag) => tag.name)
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedKeyword.value)
  })
})

// The overview page owns filtering and paging; category/tag pages keep fetching here.
const displayArticles = computed(() => props.items ?? visibleArticles.value)

const buildParams = (nextPage: number) => ({
  ...props.fetchParams,
  page: nextPage,
  page_size: props.pageSize
})

const loadPage = async (nextPage: number) => {
  if (nextPage === 1) {
    initialLoading.value = true
  } else {
    loadingMore.value = true
  }

  errorMessage.value = ''

  try {
    const response = await getArticleList(buildParams(nextPage))
    const list = (response.data.list || []).map(mapArticleCard)

    total.value = response.data.total || 0
    page.value = nextPage
    articles.value = nextPage === 1 ? list : [...articles.value, ...list]
  } catch (error) {
    console.error(error)
    errorMessage.value = '文章加载失败，请稍后重试'
  } finally {
    initialLoading.value = false
    loadingMore.value = false
  }
}

const resetAndReload = async () => {
  searchKeyword.value = ''
  articles.value = []
  total.value = 0
  page.value = 1
  await loadPage(1)
}

const tryLoadMore = async () => {
  if (initialLoading.value || loadingMore.value || errorMessage.value || !hasMore.value) {
    return
  }

  await loadPage(page.value + 1)
}

const stopObserver = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

const startObserver = () => {
  if (!import.meta.client || isControlled.value || !sentinelRef.value) {
    return
  }

  stopObserver()
  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry?.isIntersecting) {
      void tryLoadMore()
    }
  }, {
    rootMargin: '240px 0px'
  })

  observer.observe(sentinelRef.value)
}

watch(
  () => JSON.stringify(props.fetchParams || {}),
  async () => {
    if (!isControlled.value) await resetAndReload()
  }
)

watch(displayArticles, async (items) => {
  if (!import.meta.client) {
    return
  }

  if (!items.length) {
    return
  }

  await nextTick()

  for (const article of items) {
    if (!article.cover) {
      continue
    }

    try {
      if (!coverColors.has(article.cover)) {
        coverColors.set(article.cover, getDominantColor(article.cover))
      }
      const color = await coverColors.get(article.cover)
      if (!color) {
        continue
      }

      const card = feedRef.value?.querySelector<HTMLElement>(`[data-article-id="${article.id}"]`)
      card?.style.setProperty('--card-accent', color)
    } catch (error) {
      console.warn('Failed to extract color for article', article.id, error)
    }
  }
}, { immediate: true })

onMounted(async () => {
  if (!isControlled.value) await resetAndReload()
  startObserver()
  refreshScrollReveal()
})

onUpdated(() => {
  startObserver()
  refreshScrollReveal()
})

onBeforeUnmount(() => {
  stopObserver()
})
</script>

<style scoped lang="scss">
.article-feed {
  display: grid;
  gap: 24px;
}

.scroll-reveal-enabled [data-scroll-reveal] {
  --reveal-distance: 18px;
  opacity: 0;
  transform: translate3d(0, var(--reveal-distance), 0);
  transition:
    opacity 260ms var(--ease-out-expo),
    transform 280ms var(--ease-out-expo);
  transition-delay: var(--reveal-delay, 0ms);
}

[data-scroll-reveal].is-revealed {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.feed-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(250px, 320px);
  gap: 24px;
  align-items: end;
}

.feed-title {
  position: relative;
  display: inline-block;
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--home-text);

  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    height: 3px;
    border-radius: 2px;
    background: var(--brand-accent);
  }
}

.feed-description {
  margin: 16px 0 0;
  color: var(--home-text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.search-shell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 0 16px;
  border: 1px solid var(--home-border);
  border-radius: 12px;
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);

  &:focus-within {
    border-color: var(--brand-accent);
    box-shadow: 0 0 0 3px var(--brand-accent-soft);
  }
}

.search-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--home-text-muted);
}

.search-input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--home-text);
  font-size: 14px;

  &::placeholder {
    color: var(--home-text-muted);
  }
}

.state-block {
  padding: 30px 0;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;
}

.article-entry {
  min-width: 0;

  &.featured { grid-column: 1 / -1; }
}

.article-card {
  height: 100%;
  color: inherit;
  text-decoration: none;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 15px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
  transition: transform 400ms cubic-bezier(0.345, 0.045, 0.345, 1);

  &:focus-visible {
    outline: 2px solid var(--home-text);
    outline-offset: 4px;
  }
}

.scroll-reveal-enabled .article-card [data-reveal-child] {
  opacity: 0;
  transform: translate3d(0, 14px, 0);
  transition:
    opacity 200ms var(--ease-out-expo),
    transform 220ms var(--ease-out-expo);
}

.article-entry.is-revealed .article-meta,
.article-entry.is-revealed .article-title,
.article-entry.is-revealed .article-date {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.article-entry.is-revealed .article-meta {
  transition-delay: calc(var(--reveal-delay, 0ms) + 40ms);
}

.article-entry.is-revealed .article-title {
  transition-delay: calc(var(--reveal-delay, 0ms) + 70ms);
}

.article-entry.is-revealed .article-date {
  transition-delay: calc(var(--reveal-delay, 0ms) + 100ms);
}

.article-card.featured {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 1fr);
  height: 360px;
}

.article-card:not(.featured) {
  min-height: 440px;
}

.article-cover-link {
  display: block;
  min-width: 0;
  height: 100%;
}

.article-cover {
  position: relative;
  isolation: isolate;
  height: 260px;
  overflow: hidden;
  background: var(--home-card-alt);

  &::after {
    position: absolute;
    inset: 0;
    content: '';
    pointer-events: none;
    background: linear-gradient(135deg, color-mix(in srgb, var(--home-text) 10%, transparent), transparent 42%);
    opacity: 0;
    transition: opacity var(--transition-base);
  }
}

.article-pin {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  padding: 5px 10px;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 42%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--home-card-bg) 82%, transparent);
  color: var(--brand-accent);
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.article-card:not(.featured) .article-cover {
  display: flex;
  align-items: center;
  justify-content: center;
}

.article-card.featured .article-cover {
  height: 100%;
}

.article-cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  transform: scale(1.015);
  transform-origin: center;
  transition: transform 400ms cubic-bezier(0.345, 0.045, 0.345, 1);
  filter: saturate(0.94);
}

@media (hover: hover) and (pointer: fine) {
  .article-card:hover { transform: scale(0.97); }
  .article-card:hover .article-cover img { transform: scale(1.08); }
}

.article-content {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  padding: 18px 20px 20px;
}

.article-card.featured .article-content {
  justify-content: space-between;
  padding: 34px 36px 28px;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.category {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--card-accent, var(--home-accent));
  font-size: 13px;
  font-weight: 500;

  :deep(svg) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--card-accent, var(--accent-soft)) 25%, transparent);
  color: var(--card-accent, var(--home-text-muted));
  font-size: 12px;
}

.article-title {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--home-text);
  font-size: 18px;
  letter-spacing: -0.01em;
  line-height: 1.45;
  text-wrap: pretty;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.article-card.featured .article-title {
  font-size: 30px;
  line-height: 1.2;
}

.article-date {
  display: block;
  margin-top: 8px;
  color: var(--articles-muted, var(--home-text-muted));
  font-size: 13px;
}

.empty-state {
  min-height: 260px;
  display: grid;
  place-content: center;
}

.load-state {
  display: flex;
  justify-content: center;
  padding-top: 6px;
  color: var(--home-text-muted);
  font-size: 13px;
}

.feed-sentinel {
  width: 100%;
  height: 2px;
}

.article-feed-overview .articles-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.article-feed-overview .article-card:not(.featured) {
  min-height: 340px;
}

.article-feed-overview .article-card:not(.featured) .article-cover {
  height: auto;
  aspect-ratio: 16 / 10;
}

.article-feed-overview .article-title {
  -webkit-line-clamp: 2;
}

@media (min-width: 901px) and (max-width: 1200px) {
  .article-feed-overview .article-card:not(.featured) {
    min-height: 0;
  }
}

@media (max-width: 900px) {
  .feed-head {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .search-shell {
    width: min(100%, 360px);
  }

  .article-feed-overview .articles-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .article-card.featured {
    grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.95fr);
    height: 270px;
  }

  .article-card:not(.featured) {
    min-height: 340px;
  }

  .article-card:not(.featured) .article-cover {
    height: 180px;
  }

  .article-card.featured .article-content {
    padding: 26px 26px 22px;
  }

  .article-card.featured .article-title {
    font-size: 28px;
  }
}

@media (max-width: 768px) {
  .feed-title {
    font-size: 24px;
  }

  .search-shell {
    width: 100%;
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }

  .article-feed-overview .articles-grid {
    grid-template-columns: 1fr;
  }

  .article-card {
    border-radius: 14px;
  }

  .article-card.featured {
    grid-template-columns: 1fr;
    height: auto;
  }

  .article-cover,
  .article-card.featured .article-cover {
    height: 220px;
  }

  .article-card:not(.featured) .article-cover {
    height: 220px;
  }

  .article-feed-overview .article-card:not(.featured) {
    min-height: 0;
  }

  .article-feed-overview .article-card:not(.featured) .article-cover {
    height: auto;
    aspect-ratio: 16 / 10;
  }

  .article-content,
  .article-card.featured .article-content {
    padding: 18px 18px 20px;
  }

  .article-title,
  .article-card.featured .article-title {
    font-size: 18px;
    line-height: 1.35;
  }

  [data-scroll-reveal] {
    --reveal-distance: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-reveal-enabled [data-scroll-reveal],
  .scroll-reveal-enabled .article-card [data-reveal-child] {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .article-card,
  .article-card:hover,
  .article-card .article-cover img,
  .article-card:hover .article-cover img {
    transform: none;
    transition: none;
  }

  .article-card .article-cover::after { transition: none; }
}
</style>

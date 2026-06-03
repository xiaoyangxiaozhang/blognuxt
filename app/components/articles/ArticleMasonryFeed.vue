<template>
  <section class="article-feed">
    <div class="feed-head">
      <div class="feed-copy">
        <p v-if="title" class="feed-kicker">Article Feed</p>
        <h2 v-if="title" class="feed-title">{{ title }}</h2>
        <p v-if="description" class="feed-description">{{ description }}</p>
      </div>

      <label class="search-shell" for="article-feed-search">
        <IconMaterialSymbolsSearchRounded class="search-icon" />
        <input
          id="article-feed-search"
          v-model.trim="searchKeyword"
          class="search-input"
          type="search"
          :placeholder="searchPlaceholder"
        />
      </label>
    </div>

    <div v-if="initialLoading" class="state-block">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="errorMessage" class="state-block">
      <el-alert :title="errorMessage" type="error" show-icon />
    </div>

    <template v-else>
      <div v-if="visibleArticles.length" class="articles-grid">
        <article
          v-for="article in visibleArticles"
          :key="article.id"
          class="article-card"
        >
          <NuxtLink :to="`/article/${article.slug}`" class="article-cover-link">
            <div class="article-cover">
              <img :src="article.cover" :alt="article.title" loading="lazy" />

              <div v-if="article.isEssence || article.isTop" class="article-flags">
                <span v-if="article.isEssence" class="flag-chip essence">精选</span>
                <span v-if="article.isTop" class="flag-chip top">置顶</span>
              </div>
            </div>
          </NuxtLink>

          <div class="article-body">
            <h3 class="article-title">
              <NuxtLink :to="`/article/${article.slug}`">{{ article.title }}</NuxtLink>
            </h3>

            <div class="article-meta">
              <span class="meta-chip">
                <IconMaterialSymbolsCalendarMonthOutlineRounded />
                {{ article.publishDate }}
              </span>
              <span v-if="article.location" class="meta-chip">
                <IconMaterialSymbolsLocationOnOutlineRounded />
                {{ article.location }}
              </span>
              <span class="meta-chip">
                <IconMaterialSymbolsChatBubbleOutlineRounded />
                {{ article.commentCount }}
              </span>
            </div>

            <div v-if="article.tags.length" class="article-tags">
              <span
                v-for="tag in article.tags"
                :key="`${article.id}-${tag.slug || tag.name}`"
                class="tag-chip"
              >
                #{{ tag.name }}
              </span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <el-empty :description="searchKeyword ? '没有匹配到相关文章' : emptyText" />
      </div>

      <div v-if="showBottomState" class="load-state">
        <span v-if="loadingMore">正在加载更多文章...</span>
        <span v-else-if="!hasMore && articles.length > 0">已经到底啦</span>
      </div>

      <div ref="sentinelRef" class="feed-sentinel" aria-hidden="true"></div>
    </template>
  </section>
</template>

<script setup lang="ts">
import IconMaterialSymbolsCalendarMonthOutlineRounded from '~icons/material-symbols/calendar-month-outline-rounded'
import IconMaterialSymbolsChatBubbleOutlineRounded from '~icons/material-symbols/chat-bubble-outline-rounded'
import IconMaterialSymbolsLocationOnOutlineRounded from '~icons/material-symbols/location-on-outline-rounded'
import IconMaterialSymbolsSearchRounded from '~icons/material-symbols/search-rounded'
import { getArticleList } from '~/composables/api/article'
import { mapArticleCard, type DisplayArticleCard } from '~/composables/articleDisplay'

const props = withDefaults(defineProps<{
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

const articles = ref<DisplayArticleCard[]>([])
const searchKeyword = ref('')
const page = ref(1)
const total = ref(0)
const initialLoading = ref(true)
const loadingMore = ref(false)
const errorMessage = ref('')
const sentinelRef = ref<HTMLElement | null>(null)

let observer: IntersectionObserver | null = null

const normalizedKeyword = computed(() => searchKeyword.value.trim().toLowerCase())
const hasMore = computed(() => articles.value.length < total.value)
const showBottomState = computed(() => !initialLoading.value && !errorMessage.value && articles.value.length > 0)

const visibleArticles = computed(() => {
  if (!normalizedKeyword.value) {
    return articles.value
  }

  return articles.value.filter((article) => {
    const haystack = [
      article.title,
      article.location,
      ...article.tags.map((tag) => tag.name)
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedKeyword.value)
  })
})

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
  if (!import.meta.client || !sentinelRef.value) {
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
    await resetAndReload()
  }
)

onMounted(async () => {
  await resetAndReload()
  startObserver()
})

onUpdated(() => {
  startObserver()
})

onBeforeUnmount(() => {
  stopObserver()
})
</script>

<style scoped lang="scss">
.article-feed {
  display: grid;
  gap: 26px;
}

.feed-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 18px;
  align-items: end;
}

.feed-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--home-text-muted);
}

.feed-title {
  margin: 0;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 1.02;
  color: var(--home-text);
}

.feed-description {
  margin: 12px 0 0;
  max-width: 58ch;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-muted);
}

.search-shell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 0 18px;
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--home-card-bg) 88%, #fff 12%), var(--home-card-bg));
  box-shadow: var(--home-shadow);
}

.search-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--home-accent);
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--home-text);
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: var(--home-text-muted);
}

.state-block {
  padding: 14px 0;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  align-items: start;
}

.article-card {
  overflow: hidden;
  border-radius: 15px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
  transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: var(--accent-border);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.12);
  }
}

.article-cover-link {
  display: block;
}

.article-cover {
  position: relative;
  height: clamp(220px, 28vw, 300px);
  overflow: hidden;
  background: var(--home-card-alt);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.45s ease;
  }
}

.article-card:hover .article-cover img {
  transform: scale(1.03);
}

.article-flags {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.flag-chip {
  padding: 6px 10px;
  border-radius: 999px;
  backdrop-filter: blur(10px);
  font-size: 12px;
  line-height: 1;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.flag-chip.essence {
  background: rgba(233, 174, 68, 0.82);
}

.flag-chip.top {
  background: rgba(96, 147, 255, 0.76);
}

.article-body {
  display: grid;
  gap: 16px;
  padding: 22px 22px 24px;
}

.article-title {
  margin: 0;
  font-size: 21px;
  line-height: 1.35;
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

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--home-card-alt) 84%, transparent);
  color: var(--text-muted);
  font-size: 12px;

  :deep(svg) {
    width: 15px;
    height: 15px;
    color: var(--home-accent);
  }
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--home-accent) 16%, transparent);
  background: color-mix(in srgb, var(--home-accent-soft) 72%, transparent);
  color: var(--home-text);
  font-size: 12px;
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
  color: var(--text-muted);
  font-size: 13px;
}

.feed-sentinel {
  width: 100%;
  height: 2px;
}

@media (max-width: 900px) {
  .feed-head {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .articles-grid {
    grid-template-columns: 1fr;
  }

  .article-card {
    border-radius: 14px;
  }

  .article-body {
    padding: 18px 18px 20px;
  }

  .article-title {
    font-size: 18px;
  }
}
</style>

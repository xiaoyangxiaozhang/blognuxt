<template>
  <div class="blog-archive">
    <!-- 骨架屏幕布 -->
    <PageCurtain v-model="curtainReady" @opened="onCurtainOpened" />
    <div class="archive-content">
      <div class="archive-hero">
        <h1 class="archive-title">All Posts ({{ totalArticles }})</h1>
      </div>

      <div v-if="pending" class="archive-state">
        <el-skeleton :rows="8" animated />
      </div>

      <div v-else-if="pageError" class="archive-state">
        <el-alert :title="pageError" type="error" show-icon />
      </div>

      <div v-else-if="archiveGroups.length === 0" class="archive-state">
        <el-empty description="暂无文章归档" />
      </div>

      <div v-else class="archive-list">
        <section
          v-for="group in archiveGroups"
          :key="group.year"
          class="year-section"
          :class="{ expanded: isYearExpanded(group.year) }"
        >
          <button class="year-heading" type="button" @click="toggleYear(group.year)">
            <span class="year-value">{{ group.year }}年</span>
          </button>

          <div class="year-panel">
            <div class="month-groups">
              <section v-for="monthGroup in group.monthGroups" :key="monthGroup.month" class="month-section">
                <h2 class="month-title">{{ monthGroup.month }}月</h2>

                <div class="article-items">
                  <NuxtLink
                    v-for="article in monthGroup.articles"
                    :key="article.id"
                    :to="`/article/${article.slug}`"
                    class="article-item"
                  >
                    <div class="article-date">
                      <span class="article-day">{{ article.day }}日</span>
                    </div>

                    <div class="article-main">
                      <h3 class="article-title">{{ article.title }}</h3>
                      <div class="article-meta">
                        <span v-if="article.categoryName">{{ article.categoryName }}</span>
                      </div>
                    </div>
                  </NuxtLink>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getArticleList } from '~/composables/api/article'
import type { ArticleListItem } from '~/composables/useApi'
import PageCurtain from '~/components/layouts/PageCurtain.vue'

interface ArchiveArticleItem {
  id: number
  slug: string
  title: string
  categoryName: string
  year: string
  month: string
  day: string
  sortTime: number
}

interface ArchiveMonthGroup {
  month: string
  articles: ArchiveArticleItem[]
}

interface ArchiveYearGroup {
  year: string
  monthGroups: ArchiveMonthGroup[]
}

const expandedYears = ref<string[]>([])
const isRevealed = ref(false)
const curtainReady = ref(false)

const triggerReveal = () => {
  setTimeout(() => {
    curtainReady.value = true
  }, 200)
}

const onCurtainOpened = () => {
  isRevealed.value = true
}

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

const toArchiveItem = (item: ArticleListItem): ArchiveArticleItem => {
  const parsedDate = item.publish_time ? new Date(item.publish_time.replace(/-/g, '/')) : null
  const safeDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null

  return {
    id: item.id,
    slug: resolveArticleSlug(item),
    title: item.title,
    categoryName: item.category?.name || '',
    year: safeDate ? String(safeDate.getFullYear()) : '未分类',
    month: safeDate ? String(safeDate.getMonth() + 1).padStart(2, '0') : '00',
    day: safeDate ? String(safeDate.getDate()).padStart(2, '0') : '--',
    sortTime: safeDate ? safeDate.getTime() : 0
  }
}

const toggleYear = (year: string) => {
  if (expandedYears.value.includes(year)) {
    expandedYears.value = expandedYears.value.filter((item) => item !== year)
    return
  }

  expandedYears.value = [...expandedYears.value, year]
}

const isYearExpanded = (year: string) => expandedYears.value.includes(year)

const { data, pending } = await useAsyncData('archive-page', async () => {
  try {
    const response = await getArticleList({
      page: 1,
      page_size: 500
    })

    return {
      list: (response.data.list || []).map(toArchiveItem),
      total: response.data.total || 0,
      error: ''
    }
  } catch (error) {
    console.error(error)
    return {
      list: [] as ArchiveArticleItem[],
      total: 0,
      error: '获取归档文章失败，请稍后重试'
    }
  }
})

const archiveGroups = computed<ArchiveYearGroup[]>(() => {
  const groupedByYear = new Map<string, ArchiveArticleItem[]>()
  const sortedArticles = [...(data.value?.list || [])].sort((a, b) => b.sortTime - a.sortTime)

  for (const article of sortedArticles) {
    const bucket = groupedByYear.get(article.year) || []
    bucket.push(article)
    groupedByYear.set(article.year, bucket)
  }

  return Array.from(groupedByYear.entries()).map(([year, articles]) => {
    const groupedByMonth = new Map<string, ArchiveArticleItem[]>()

    for (const article of articles) {
      const monthBucket = groupedByMonth.get(article.month) || []
      monthBucket.push(article)
      groupedByMonth.set(article.month, monthBucket)
    }

    return {
      year,
      monthGroups: Array.from(groupedByMonth.entries()).map(([month, monthArticles]) => ({
        month,
        articles: monthArticles
      }))
    }
  })
})

const totalArticles = computed(() => data.value?.total || 0)
const pageError = computed(() => data.value?.error || '')

// 检查数据加载状态触发入场动画
watch(pending, (val) => {
  if (!val && import.meta.client) {
    triggerReveal()
  }
})

onMounted(() => {
  if (!pending.value) {
    triggerReveal()
  }
})
</script>

<style scoped lang="scss">
.blog-archive {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, var(--home-accent-soft) 0%, transparent 36%),
    linear-gradient(180deg, var(--home-surface-elevated) 0%, var(--home-surface) 100%);
  color: var(--home-text);
  padding: 80px 0 72px;
}

.archive-content {
  width: min(1000px, 100%);
  margin: 0 auto;
}

.archive-hero {
  margin-bottom: 28px;
}

.archive-title {
  margin: 0;
  display: inline-block;
  font-size: 48px;
  line-height: 1.08;
  font-weight: 800;
  color: var(--home-text);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 6px;
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: var(--brand-accent-soft);
    z-index: -1;
  }
}

.archive-state {
  padding: 28px;
  border-radius: 15px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
}

.archive-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.year-section {
  border-radius: 15px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
  overflow: hidden;
  transition:
    box-shadow 0.35s ease,
    border-color 0.35s ease,
    background 0.35s ease,
    transform 0.35s ease;
  padding: 0 44px;
}

.year-section:hover {
  border-color: var(--accent-border);
  background: var(--home-card-hover);
}

.year-section.expanded {
  border-color: var(--accent-border);
  background: var(--home-card-hover);
}

.year-heading {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 30px 44px;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.year-value {
  font-size: 38px;
  font-weight: 800;
  color: var(--home-text);
}

.year-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.82s cubic-bezier(0.22, 1, 0.36, 1);
}

.year-section.expanded .year-panel {
  grid-template-rows: 1fr;
}

.month-groups {
  min-height: 0;
  overflow: hidden;
  padding: 0 44px;
  opacity: 0;
  transition:
    padding 0.82s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.55s ease;
}

.year-section.expanded .month-groups {
  padding: 8px 44px 34px;
  opacity: 1;
}

.month-section + .month-section {
  margin-top: 34px;
}

.month-title {
  margin: 0 0 18px;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 800;
  color: var(--home-text);
}

.article-items {
  display: flex;
  flex-direction: column;
}

.article-item {
  display: grid;
  grid-template-columns: 108px minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  min-height: 58px;
  text-decoration: none;
  color: inherit;
}

.article-date {
  position: relative;
  padding-left: 36px;
  color: var(--home-text-muted);
  font-size: 18px;
  line-height: 1.8;

  &::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 50%;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--brand-accent);
    transform: translateY(-50%);
    box-shadow: 0 0 0 4px var(--brand-accent-soft);
  }
}

.article-item + .article-item .article-date::after {
  content: '';
  position: absolute;
  left: 13px;
  top: -23px;
  width: 3px;
  height: 46px;
  border-radius: 999px;
  background: var(--brand-accent);
}

.article-day {
  white-space: nowrap;
}

.article-main {
  min-width: 0;
  padding-top: 1px;
}

.article-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.75;
  font-weight: 500;
  color: var(--home-text);
  transition: color 0.3s ease;
}

.article-item:hover .article-title {
  color: var(--brand-accent-hover);
}

.article-meta {
  display: flex;
  gap: 12px;
  margin-top: 2px;
  color: var(--home-text-muted);
  font-size: 14px;
}

@media (max-width: 1200px) {
  .archive-content {
    width: min(700px, 100%);
  }

  .archive-title {
    font-size: 40px;
  }

  .year-value {
    font-size: 32px;
  }
}

@media (max-width: 768px) {
  .archive-content {
    width: 100%;
  }

  .blog-archive {
    padding-bottom: 48px;
  }

  .archive-title {
    font-size: 32px;
  }

  .year-value {
    font-size: 28px;
  }

  .year-heading {
    padding: 24px 20px;
  }

  .month-groups {
    padding: 0 20px;
  }

  .year-section.expanded .month-groups {
    padding: 0 20px 24px;
  }

  .month-section + .month-section {
    margin-top: 28px;
  }

  .month-title {
    font-size: 20px;
    margin-bottom: 14px;
  }

  .article-item {
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 10px;
  }

  .article-date {
    padding-left: 28px;
    font-size: 16px;
  }

  .article-item + .article-item .article-date::after {
    left: 12px;
  }

  .article-title {
    font-size: 16px;
    line-height: 1.65;
  }
}
</style>

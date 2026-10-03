<template>
  <div class="blog-archive" :aria-busy="pending">
    <PageCurtain v-model="curtainReady" />
    <div class="archive-content">
      <div class="archive-hero">
        <h1 class="archive-title">归档</h1>
        <span class="archive-count">{{ totalArticles }} 篇文章</span>
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
          :aria-labelledby="`archive-year-${group.year}`"
        >
          <h2
            :id="`archive-year-${group.year}`"
            class="year-heading"
            :class="{ 'is-undated': group.year === '未分类' }"
            :aria-label="group.year === '未分类' ? group.year : `${group.year}年`"
          >
            <span class="year-value" aria-hidden="true">{{ group.year }}</span>
          </h2>
          <ul class="article-items">
            <li v-for="article in group.articles" :key="article.id">
              <NuxtLink
                :to="`/article/${article.slug}`"
                class="article-item"
                :class="{ 'is-previewing': coverVisible && hoverArticle?.id === article.id }"
                @pointerenter="showCover(article, $event)"
                @pointermove="moveCover($event)"
                @pointerleave="hideCover"
                @focus="showCover(article, $event)"
                @blur="hideCover"
                @click="hideCover"
                @keydown.esc="hideCover"
              >
                <span class="article-title">{{ article.title }}</span>
                <time v-if="article.dateTime" :datetime="article.dateTime" class="article-date">
                  {{ article.month }}-{{ article.day }}
                </time>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </div>
    <ClientOnly>
      <Teleport to="body">
        <div
          ref="coverRef"
          class="archive-hover-cover"
          :class="{ 'is-visible': coverVisible && coverLoaded, 'is-instant': instantCover }"
          aria-hidden="true"
        >
          <img
            v-if="hoverArticle"
            :key="hoverArticle.id"
            :src="hoverArticle.cover"
            :class="{ 'is-poster': hoverArticle.isPoster }"
            alt=""
            width="240"
            height="300"
            decoding="async"
            @load="coverLoaded = true"
            @error="hideCover"
          />
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { getArticleList } from '~/services/api/article'
import type { ArticleListItem } from '~/types/api'
import PageCurtain from '~/components/shell/PageCurtain.vue'
import { resolveArticleSlug } from '~/utils/article'
import { proxyImageUrl } from '~/utils/image'

interface ArchiveArticleItem {
  id: number
  slug: string
  title: string
  cover: string
  isPoster: boolean
  year: string
  month: string
  day: string
  dateTime: string
  sortTime: number
}

const curtainReady = ref(false)
const coverRef = ref<HTMLElement | null>(null)
const hoverArticle = shallowRef<ArchiveArticleItem | null>(null)
const coverVisible = ref(false)
const coverLoaded = ref(false)
const instantCover = ref(false)
let hoverQuery: MediaQueryList | undefined
let motionQuery: MediaQueryList | undefined
let coverFrame = 0
let activeLink: HTMLElement | null = null
let position = { x: 0, y: 0 }
let target = { x: 0, y: 0 }
let previousTargetX = 0
let rotation = 0

const hideCover = () => {
  coverVisible.value = false
  cancelAnimationFrame(coverFrame)
  coverFrame = 0
}

const paintCover = () => {
  coverFrame = 0
  if (!coverRef.value || !coverVisible.value) return
  const remainingX = target.x - position.x
  const remainingY = target.y - position.y
  const progress = instantCover.value ? 1 : 0.08
  position.x += remainingX * progress
  position.y += remainingY * progress
  const swing = instantCover.value ? 0 : Math.max(-60, Math.min(60, (target.x - previousTargetX) * 0.6))
  previousTargetX = target.x
  rotation += (swing - rotation) * progress
  const moving = Math.abs(remainingX) + Math.abs(remainingY) > 0.2 || Math.abs(rotation) > 0.05
  if (!moving) {
    position = { ...target }
    rotation = 0
  }
  coverRef.value.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) rotate(${rotation}deg)`
  if (moving && !instantCover.value) {
    coverFrame = requestAnimationFrame(paintCover)
  }
}

const setCoverTarget = (x: number, y: number) => {
  if (!coverRef.value || !activeLink) return
  const width = coverRef.value.offsetWidth
  const height = coverRef.value.offsetHeight
  target = {
    x: Math.max(24, Math.min(x - width / 2, window.innerWidth - width - 24)),
    y: Math.max(24, Math.min(y - height / 2, window.innerHeight - height - 24))
  }
}

const showCover = (article: ArchiveArticleItem, event: PointerEvent | FocusEvent) => {
  if (!hoverQuery?.matches || !article.cover) {
    hideCover()
    return
  }
  activeLink = event.currentTarget as HTMLElement
  instantCover.value = event.type === 'focus' || Boolean(motionQuery?.matches)
  if (hoverArticle.value?.id !== article.id) {
    coverLoaded.value = false
    hoverArticle.value = article
  }
  const rect = activeLink.getBoundingClientRect()
  const pointerEvent = event as PointerEvent
  const keyboard = event.type === 'focus'
  setCoverTarget(keyboard ? rect.left + rect.width / 2 : pointerEvent.clientX, keyboard ? rect.top + rect.height / 2 : pointerEvent.clientY)
  position = { ...target }
  previousTargetX = target.x
  rotation = 0
  coverVisible.value = true
  if (!coverFrame) paintCover()
}

const moveCover = (event: PointerEvent) => {
  if (!coverVisible.value || instantCover.value) return
  setCoverTarget(event.clientX, event.clientY)
  if (!coverFrame) coverFrame = requestAnimationFrame(paintCover)
}

const toArchiveItem = (item: ArticleListItem): ArchiveArticleItem => {
  const parsedDate = item.publish_time ? new Date(item.publish_time.replace(/-/g, '/')) : null
  const date = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null
  const year = date ? String(date.getFullYear()) : '未分类'
  const month = date ? String(date.getMonth() + 1).padStart(2, '0') : '00'
  const day = date ? String(date.getDate()).padStart(2, '0') : '--'
  return {
    id: item.id,
    slug: resolveArticleSlug(item),
    title: item.title,
    cover: proxyImageUrl(item.cover),
    isPoster: /\.png(?:\?|$)/i.test(item.cover || ''),
    year,
    month,
    day,
    dateTime: date ? `${year}-${month}-${day}` : '',
    sortTime: date?.getTime() || 0
  }
}

const { data, pending } = await useAsyncData('archive-page', async () => {
  try {
    const response = await getArticleList({ page: 1, page_size: 500 })
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

const archiveGroups = computed(() => {
  const years = new Map<string, ArchiveArticleItem[]>()
  const sortedArticles = [...(data.value?.list || [])].sort((a, b) => b.sortTime - a.sortTime)
  for (const article of sortedArticles) {
    const group = years.get(article.year) || []
    group.push(article)
    years.set(article.year, group)
  }
  return Array.from(years, ([year, articles]) => ({ year, articles }))
})
const totalArticles = computed(() => data.value?.total || 0)
const pageError = computed(() => data.value?.error || '')

watch(pending, (value) => {
  if (!value && import.meta.client) curtainReady.value = true
})
onMounted(() => {
  curtainReady.value = !pending.value
  hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  hoverQuery.addEventListener('change', hideCover)
  motionQuery.addEventListener('change', hideCover)
  window.addEventListener('resize', hideCover)
  document.addEventListener('scroll', hideCover, { passive: true, capture: true })
})
onBeforeUnmount(() => {
  hideCover()
  hoverQuery?.removeEventListener('change', hideCover)
  motionQuery?.removeEventListener('change', hideCover)
  window.removeEventListener('resize', hideCover)
  document.removeEventListener('scroll', hideCover, true)
})
</script>

<style scoped lang="scss">
.blog-archive {
  min-height: calc(100dvh - 86px);
  padding: 144px 0 96px;
  background: var(--bg-primary);
  color: var(--text-primary);
}
.archive-content {
  width: min(760px, calc(100% - 64px));
  margin-inline: auto;
}
.archive-hero {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 78px;
}
.archive-title {
  margin: 0;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
}
.archive-count {
  color: var(--text-secondary);
  font-size: 13px;
}
.archive-state { padding-block: 24px; }
.year-section { position: relative; }
.year-section + .year-section { margin-top: 76px; }
.year-heading {
  position: relative;
  height: 32px;
  margin: 0;
  pointer-events: none;
}
.year-value {
  position: absolute;
  left: -32px;
  top: -46px;
  font-size: clamp(88px, 10vw, 132px);
  line-height: 1;
  font-weight: 700;
  color: color-mix(in srgb, var(--text-primary) 3%, transparent);
  -webkit-text-stroke: 1px color-mix(in srgb, var(--text-primary) 10%, transparent);
}
.is-undated .year-value { font-size: 64px; }
.article-items {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
}
.article-item {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-height: 46px;
  padding-block: 10px;
  color: var(--text-primary);
  text-decoration: none;
}
.article-item.is-previewing { z-index: 61; }
.article-title {
  min-width: 0;
  font-size: 17px;
  line-height: 1.65;
  font-weight: 400;
  text-wrap: pretty;
}
.article-date {
  flex-shrink: 0;
  color: var(--text-secondary);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.article-item:focus-visible {
  outline: 2px solid var(--text-primary);
  outline-offset: 4px;
}
.article-item:focus-visible .article-title {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.article-item:active .article-title { opacity: 0.8; }
.archive-hover-cover {
  position: fixed;
  inset: 0 auto auto 0;
  width: 240px;
  height: min(300px, calc(100dvh - 48px));
  z-index: 60;
  pointer-events: none;
  opacity: 0;
  transform: translate3d(-400px, -400px, 0);
  transition: opacity 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.archive-hover-cover img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
  background: var(--bg-panel-solid);
  transform: scale(0.96);
  transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}
.archive-hover-cover img.is-poster { object-fit: contain; }
.archive-hover-cover.is-visible { opacity: 1; }
.archive-hover-cover.is-visible img { transform: scale(1); }
.archive-hover-cover.is-instant,
.archive-hover-cover.is-instant img { transition: none; }
@media (hover: hover) and (pointer: fine) {
  .article-item:hover .article-title { color: var(--brand-accent); }
}
@media (max-width: 767px) {
  .blog-archive { padding: 124px 0 56px; }
  .archive-content { width: calc(100% - 40px); }
  .archive-title { font-size: 28px; }
  .archive-hero { margin-bottom: 68px; }
  .year-value {
    left: -10px;
    top: -32px;
    font-size: 88px;
  }
  .year-section + .year-section { margin-top: 60px; }
  .article-title { font-size: 16px; }
  .article-date { font-size: 12px; }
}
@media (hover: none), (pointer: coarse) {
  .archive-hover-cover { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .archive-hover-cover,
  .archive-hover-cover img { transition: none; }
}
</style>

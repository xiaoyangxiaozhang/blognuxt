<template>
  <div
    class="articles-page"
    :class="{ 'is-immersive': browseMode === 'immersive', 'is-instant': titleInkInstant }"
    :style="{ '--immersive-switch-duration': COVER_REVEAL_MS + 'ms', '--immersive-switch-easing': COVER_REVEAL_EASING }"
  >
    <div v-if="browseMode === 'immersive'" class="immersive-background" aria-hidden="true">
      <div v-if="previewState.settled" class="immersive-scene-layer" :data-preview-id="previewState.settled.item.id">
        <img v-if="previewState.settled.imageUrl" class="immersive-scene" :src="previewState.settled.imageUrl" alt="" loading="eager" fetchpriority="high" @error="handleSceneError('settled', previewState.settled.item.id)" />
      </div>
      <div v-if="previewState.entering" ref="incomingSceneRef" class="immersive-scene-layer immersive-scene-incoming" :style="{ clipPath: sceneRevealClip }" :data-preview-id="previewState.entering.item.id">
        <img v-if="previewState.entering.imageUrl" class="immersive-scene" :src="previewState.entering.imageUrl" alt="" @error="handleSceneError('entering', previewState.entering.item.id)" />
      </div>
      <div class="immersive-shade"></div>
    </div>

    <button
      class="browse-switch"
      type="button"
      :aria-label="browseMode === 'immersive' ? '切换到列表浏览' : '切换到沉浸浏览'"
      :title="browseMode === 'immersive' ? '切换到列表浏览' : '切换到沉浸浏览'"
      :data-mode="browseMode"
      @click="toggleBrowseMode"
    >
      <MorphIcon
        class="browse-mode-icon"
        :icon="browseMode === 'immersive' ? List : LayoutGrid"
        spring="snappy"
        :reduced-motion="iconSwitchInstant ? 'always' : 'user'"
      />
    </button>

    <main class="articles-shell">
      <header class="page-heading">
        <div v-if="browseMode === 'list'" class="heading-copy">
          <h1>全部文章</h1>
        </div>
        <h1 v-else class="immersive-page-title">全部文章</h1>
      </header>

      <section class="filter-panel" aria-label="文章筛选">
        <div v-if="browseMode === 'list'" class="filter-field">
          <span class="filter-label">搜索文章</span>
          <label class="search-shell" for="all-articles-search">
            <MagnifyingGlassIcon class="search-icon" aria-hidden="true" />
            <input
              ref="searchInputRef"
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
              {{ category }}<span v-if="browseMode === 'immersive'" class="category-count">{{ categoryCounts[category] || 0 }}</span>
            </button>
          </div>
        </div>
      </section>

      <template v-if="browseMode === 'immersive'">
        <div v-if="pending" class="state-block immersive-state">正在加载文章...</div>
        <div v-else-if="pageError" class="state-block immersive-state" role="alert">{{ pageError }}</div>
        <section
          v-else
          ref="immersiveScrollRef"
          class="immersive-scroll"
          aria-label="沉浸浏览文章"
          @scroll.passive="handleImmersiveScroll"
          @pointermove="handleImmersivePointerMove"
          @pointerleave="stopPointerScroll"
          @pointerdown="stopPointerScroll"
          @wheel.passive="stopPointerScroll"
        >
          <div v-if="immersiveArticles.length" class="immersive-list-stage" :class="{ 'has-title-ink': titleInkReady }">
            <TransitionGroup name="immersive-rows" tag="div" class="immersive-list">
              <article
                v-for="article in immersiveArticles"
                :key="article.id"
                :data-article-id="article.id"
                class="immersive-entry"
                :class="{ active: titleActiveId === article.id }"
              >
                <NuxtLink
                  :to="`/article/${encodeURIComponent(article.slug)}`"
                  :aria-current="titleActiveId === article.id ? 'true' : undefined"
                  :aria-label="`阅读文章：${article.title}`"
                  @focus="handleEntryFocus($event, article)"
                  @click="handleEntryClick($event, article)"
                >
                  <span class="immersive-title">{{ article.displayTitle }}</span>
                  <span v-if="titleActiveId === article.id" class="immersive-meta">{{ article.categoryName }}</span>
                </NuxtLink>
              </article>
            </TransitionGroup>
            <div ref="titleInkRef" class="immersive-title-ink" :style="{ clipPath: titleInkClip }" aria-hidden="true">
              <TransitionGroup name="immersive-rows" tag="div" class="immersive-list">
                <div v-for="article in immersiveArticles" :key="article.id" class="immersive-ink-entry">
                  <span class="immersive-ink-link"><span class="immersive-title">{{ article.displayTitle }}</span></span>
                </div>
              </TransitionGroup>
            </div>
          </div>
          <p v-else class="immersive-empty" role="status">{{ emptyText }}</p>
        </section>
      </template>

      <template v-else>
        <div class="result-summary" role="status" aria-live="polite">
          <span class="result-count">找到 <strong>{{ filteredArticles.length }}</strong> 篇文章</span>
          <span v-if="filteredArticles.length">
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

          <el-pagination
            v-if="filteredArticles.length"
            v-model:current-page="currentPage"
            class="article-pagination"
            background
            :page-size="PAGE_SIZE"
            :pager-count="5"
            :prev-icon="ChevronLeftIcon"
            :next-icon="ChevronRightIcon"
            :total="filteredArticles.length"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </section>
      </template>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '~/utils/siteIcons'
import { MorphIcon } from 'morphicons/vue'
import { LayoutGrid, List } from 'lucide'
import { onBeforeRouteLeave } from 'vue-router'
import ArticleMasonryFeed from '~/components/articles/ArticleMasonryFeed.vue'
import { getArticleList } from '~/services/api/article'
import type { ArticleListItem } from '~/types/api'
import { mapArticleCard, type DisplayArticleCard } from '~/utils/article'
import { proxyImageUrl } from '~/utils/image'
import { createImmersivePreview, type PreviewSnapshot } from '~/utils/immersivePreview'

type BrowseMode = 'immersive' | 'list'
type ImmersiveArticle = DisplayArticleCard & {
  displayTitle: string
  immersiveCover: string
  publishedAt: string
}
type SavedArticleBrowse = {
  keyword: string
  category: string
  currentPage: number
  activeId: number | null
  scrollTop: number
  focusId: number | null
}

const PAGE_SIZE = 12
const COVER_REVEAL_MS = 460
const COVER_REVEAL_EASING = 'cubic-bezier(.33, 1, .68, 1)'
const COVER_HURRY_MS = 110
// 两张原封面含大字或放大后模糊，沉浸模式暂用站内视觉图。
const IMMERSIVE_COVER_OVERRIDES: Record<string, string> = {
  'github-actions-aliyun-ecs-cicd': '/immersive/deploy.jpg',
  'hello-xiaoyangxiaozhang-blog': '/immersive/blog-launch.jpg'
}

const restoreState = useState<SavedArticleBrowse | null>('articles-return-state', () => null)
const browseMode = useCookie<BrowseMode>('all-articles-browse-mode', { default: () => 'immersive' })
const iconSwitchInstant = ref(false)
const toggleBrowseMode = (event: MouseEvent) => {
  iconSwitchInstant.value = event.detail === 0
  browseMode.value = browseMode.value === 'immersive' ? 'list' : 'immersive'
}
const searchKeyword = ref(restoreState.value?.keyword || '')
const activeCategory = ref(restoreState.value?.category || '全部')
const currentPage = ref(restoreState.value?.currentPage || 1)
const immersiveScrollRef = ref<HTMLElement | null>(null)
const incomingSceneRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const titleInkRef = ref<HTMLElement | null>(null)
const titleInkClip = ref('inset(0 0 100% 0)')
const titleInkInstant = ref(true)
const titleInkReady = ref(false)
const reducedMotion = ref(false)
const previewState = shallowRef<PreviewSnapshot<ImmersiveArticle>>({ requestedId: null, settled: null, entering: null, phase: 'idle' })
const resultsRef = ref<HTMLElement | null>(null)
let scrollFrame = 0
let sceneAnimation: Animation | null = null
let hurryOnStart = false
let motionQuery: MediaQueryList | null = null
let motionChangeHandler: ((event: MediaQueryListEvent) => void) | null = null
let previewController: ReturnType<typeof createImmersivePreview<ImmersiveArticle>> | null = null
let titleInkObserver: ResizeObserver | null = null
let restoringScroll = false
let pointerScrollFrame = 0
let pointerScrollTarget = 0
let pointerScrollValue = 0
let pointerScrollTime = 0
let pointerPoint: { x: number, y: number } | null = null
let lastKeyboardOpenId: number | null = null
let restoringFocus = false

const mapImmersiveArticle = (item: ArticleListItem): ImmersiveArticle => {
  const card = mapArticleCard(item)
  return {
    ...card,
    displayTitle: item.title.split(/[：:]/, 1)[0]?.trim() || item.title,
    immersiveCover: IMMERSIVE_COVER_OVERRIDES[card.slug] || proxyImageUrl(item.cover) || '/hero-poster.jpg',
    publishedAt: item.publish_time
  }
}

const { data, pending } = await useAsyncData('all-articles-page', async () => {
  try {
    const response = await getArticleList({ page: 0, page_size: 0 })
    if (response.code !== 0) {
      throw new Error(response.message || '获取文章失败')
    }

    return {
      articles: (response.data.list || []).map(mapImmersiveArticle),
      error: ''
    }
  } catch (error) {
    console.error(error)
    return {
      articles: [] as ImmersiveArticle[],
      error: '文章列表加载失败，请稍后重试'
    }
  }
})

const articles = computed(() => data.value?.articles || [])
const pageError = computed(() => data.value?.error || '')
const normalizedKeyword = computed(() => browseMode.value === 'immersive' ? '' : searchKeyword.value.trim().toLocaleLowerCase())

const categories = computed(() => [
  '全部',
  ...Array.from(new Set(articles.value.map((article) => article.categoryName)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
])
const categoryCounts = computed(() => articles.value.reduce<Record<string, number>>((counts, article) => {
  counts[article.categoryName] = (counts[article.categoryName] || 0) + 1
  return counts
}, { 全部: articles.value.length }))

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
const immersiveArticles = computed(() => [...filteredArticles.value].sort((a, b) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
))
const visualPreview = computed(() => previewState.value.entering || previewState.value.settled)
const titleActiveId = computed(() => previewState.value.requestedId ?? visualPreview.value?.item.id)
const sceneRevealClip = computed(() => {
  const from = immersiveArticles.value.findIndex((article) => article.id === previewState.value.settled?.item.id)
  const to = immersiveArticles.value.findIndex((article) => article.id === previewState.value.entering?.item.id)
  // 与标题列表的纵向浏览方向一致：下一篇从下方接入，上一篇从上方接入。
  return from >= 0 && to >= 0 && to < from ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)'
})

const updateTitleInk = (instant = titleInkInstant.value) => {
  const layer = titleInkRef.value
  const entry = immersiveScrollRef.value?.querySelector<HTMLElement>(`[data-article-id="${titleActiveId.value}"]`)
  if (!layer || !entry) return
  const bounds = layer.getBoundingClientRect()
  const row = entry.getBoundingClientRect()
  titleInkInstant.value = instant
  // 整列共用一块纵向移动的颜色窗口，经过行间空隙时自然完成上下交接。
  titleInkClip.value = `inset(${Math.max(row.top - bounds.top, 0)}px 0 ${Math.max(bounds.bottom - row.bottom, 0)}px 0)`
  titleInkReady.value = true
}

watch([titleActiveId, immersiveArticles], async () => {
  await nextTick()
  updateTitleInk()
})

watch(titleInkRef, (layer) => {
  titleInkObserver?.disconnect()
  if (!layer) {
    titleInkReady.value = false
    return
  }
  titleInkObserver = new ResizeObserver(() => updateTitleInk(true))
  titleInkObserver.observe(layer)
  updateTitleInk(true)
}, { flush: 'post' })

const requestImmersivePreview = (article: ImmersiveArticle, instant = false) => {
  if (previewState.value.requestedId !== article.id) titleInkInstant.value = instant
  void previewController?.request(article, instant)
}

watch(immersiveArticles, (list) => {
  if (!previewController && !previewState.value.settled && list[0]) {
    const initial = list.find((article) => article.id === restoreState.value?.activeId) || list[0]
    previewState.value = {
      requestedId: initial.id,
      settled: { item: initial, imageUrl: initial.immersiveCover },
      entering: null,
      phase: 'idle'
    }
  }
}, { immediate: true })

type CoverLoad = { promise: Promise<string | null>, cancel: () => void }
const coverLoads = new Map<string, CoverLoad>()

const prepareCover = (article: ImmersiveArticle): Promise<string | null> => {
  const url = article.immersiveCover
  const cached = coverLoads.get(url)
  if (cached) return cached.promise

  let image: HTMLImageElement | null = null
  let complete: (value: string | null) => void = () => {}
  const promise = new Promise<string | null>((resolve) => {
    image = new Image()
    let done = false
    let decoding = false
    let timeout = 0
    const finish = (value: string | null) => {
      if (done) return
      done = true
      window.clearTimeout(timeout)
      if (image) image.onload = image.onerror = null
      resolve(value)
    }
    complete = finish
    timeout = window.setTimeout(() => finish(null), 8000)
    const settleLoaded = () => {
      if (decoding) return
      decoding = true
      const loaded = image
      if (loaded?.decode) {
        loaded.decode().then(() => finish(url), () => finish(loaded.naturalWidth ? url : null))
      } else {
        finish(url)
      }
    }
    image.onload = settleLoaded
    image.onerror = () => finish(null)
    image.src = url
    if (image.complete && image.naturalWidth) settleLoaded()
  })
  coverLoads.set(url, {
    promise,
    cancel: () => {
      complete(null)
      image?.removeAttribute('src')
      coverLoads.delete(url)
    }
  })
  promise.then((result) => {
    if (result === null && coverLoads.get(url)?.promise === promise) coverLoads.delete(url)
  })
  while (coverLoads.size > 4) {
    const oldest = coverLoads.keys().next().value
    if (!oldest) break
    coverLoads.get(oldest)?.cancel()
  }
  return promise
}

const cancelSceneAnimation = () => {
  sceneAnimation?.cancel()
  sceneAnimation = null
  hurryOnStart = false
}

const hurrySceneAnimation = () => {
  if (!sceneAnimation) {
    hurryOnStart = true
    return
  }
  const remaining = COVER_REVEAL_MS - Number(sceneAnimation.currentTime || 0)
  if (remaining > COVER_HURRY_MS) sceneAnimation.playbackRate = remaining / COVER_HURRY_MS
}

const beginSceneAnimation = async (instant: boolean) => {
  const enteringId = previewState.value.entering?.item.id
  await nextTick()
  if (!enteringId || previewState.value.entering?.item.id !== enteringId) return
  const layer = incomingSceneRef.value
  if (!layer || instant || reducedMotion.value) {
    hurryOnStart = false
    previewController?.complete()
    return
  }
  const animation = layer.animate([
    { clipPath: sceneRevealClip.value },
    { clipPath: 'inset(0 0 0 0)' }
  ], { duration: COVER_REVEAL_MS, easing: COVER_REVEAL_EASING, fill: 'both' })
  sceneAnimation = animation
  if (hurryOnStart) {
    hurryOnStart = false
    hurrySceneAnimation()
  }
  animation.finished.then(() => {
    if (sceneAnimation !== animation) return
    sceneAnimation = null
    previewController?.complete()
  }).catch(() => {})
}

const handleSceneError = (layer: 'settled' | 'entering', id: number) => {
  if (previewController) {
    previewController.markImageFailed(id)
    return
  }
  const current = previewState.value[layer]
  if (current?.item.id === id) previewState.value = { ...previewState.value, [layer]: { ...current, imageUrl: null } }
}

const totalPages = computed(() => Math.max(1, Math.ceil(filteredArticles.value.length / PAGE_SIZE)))
const displayedArticles = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredArticles.value.slice(start, start + PAGE_SIZE)
})
const emptyText = computed(() => searchKeyword.value || activeCategory.value !== '全部'
  ? '没有匹配到相关文章'
  : '暂无文章')

const handlePageChange = async () => {
  await nextTick()
  resultsRef.value?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  })
}

const centerImmersiveEntry = (article: ImmersiveArticle) => {
  const scroller = immersiveScrollRef.value
  const entry = scroller?.querySelector<HTMLElement>(`[data-article-id="${article.id}"]`)
  if (!scroller || !entry) return
  const top = Math.min(
    Math.max(entry.offsetTop + entry.offsetHeight / 2 - scroller.clientHeight / 2, 0),
    scroller.scrollHeight - scroller.clientHeight
  )
  scroller.scrollTo({
    top,
    behavior: 'auto'
  })
}

const stopPointerScroll = () => {
  cancelAnimationFrame(pointerScrollFrame)
  pointerScrollFrame = 0
  pointerPoint = null
}

const handleEntryFocus = (event: FocusEvent, article: ImmersiveArticle) => {
  if (restoringFocus) return
  if (event.target instanceof Element && event.target.matches(':focus-visible')) {
    stopPointerScroll()
    requestImmersivePreview(article, true)
    centerImmersiveEntry(article)
  }
}

const advancePointerScroll = (time: number) => {
  const scroller = immersiveScrollRef.value
  if (!scroller || !pointerPoint) {
    stopPointerScroll()
    return
  }
  const distance = pointerScrollTarget - pointerScrollValue
  const elapsed = Math.min(time - pointerScrollTime, 64)
  pointerScrollTime = time
  // 连续追踪鼠标的位置，不再按文章分段居中；不同刷新率使用相同的跟随速度。
  pointerScrollValue += distance * (1 - Math.exp(-elapsed / 100))
  scroller.scrollTop = pointerScrollValue
  if (Math.abs(distance) > 1) {
    pointerScrollFrame = requestAnimationFrame(advancePointerScroll)
  } else {
    scroller.scrollTop = pointerScrollTarget
    pointerScrollFrame = 0
  }
}

const handleImmersivePointerMove = (event: PointerEvent) => {
  const scroller = immersiveScrollRef.value
  if (event.pointerType !== 'mouse' || event.buttons || !scroller) return
  pointerPoint = { x: event.clientX, y: event.clientY }
  handleImmersiveScroll()
  if (reducedMotion.value) return
  const rect = scroller.getBoundingClientRect()
  const progress = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1)
  pointerScrollTarget = progress * Math.max(scroller.scrollHeight - scroller.clientHeight, 0)
  if (!pointerScrollFrame) {
    pointerScrollValue = scroller.scrollTop
    pointerScrollTime = performance.now()
    pointerScrollFrame = requestAnimationFrame(advancePointerScroll)
  }
}

const handleImmersiveScroll = () => {
  if (scrollFrame || restoringScroll || !immersiveScrollRef.value) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0
    const scroller = immersiveScrollRef.value
    if (!scroller) return
    const rect = scroller.getBoundingClientRect()
    const centerY = rect.top + rect.height / 2
    const point = pointerPoint || { x: rect.left + rect.width / 2, y: centerY }
    let entry = document.elementFromPoint(point.x, point.y)?.closest<HTMLElement>('.immersive-entry')
    if (!entry || !scroller.contains(entry)) {
      let nearestDistance = Infinity
      for (const candidate of scroller.querySelectorAll<HTMLElement>('.immersive-entry')) {
        const candidateRect = candidate.getBoundingClientRect()
        const distance = Math.abs(candidateRect.top + candidateRect.height / 2 - point.y)
        if (distance < nearestDistance) {
          entry = candidate
          nearestDistance = distance
        }
      }
    }
    const article = immersiveArticles.value.find((item) => item.id === Number(entry?.dataset.articleId))
    if (article) requestImmersivePreview(article)
  })
}

const handleEntryClick = (event: MouseEvent, article: ImmersiveArticle) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  lastKeyboardOpenId = event.detail === 0 ? article.id : null
}

watch([normalizedKeyword, activeCategory], async () => {
  currentPage.value = 1
  if (!import.meta.client) return
  stopPointerScroll()
  titleInkInstant.value = true
  const focusedEntry = document.activeElement?.closest<HTMLElement>('.immersive-entry')
  const focusRemoved = focusedEntry && !immersiveArticles.value.some((article) => article.id === Number(focusedEntry.dataset.articleId))
  const preferred = previewController?.reconcile()
  const current = previewState.value.entering?.item || previewState.value.settled?.item
  const target = preferred || current || immersiveArticles.value[0]
  await nextTick()
  if (focusRemoved && browseMode.value === 'list') searchInputRef.value?.focus()
  if (target) {
    requestImmersivePreview(target, true)
    centerImmersiveEntry(target)
  } else {
    immersiveScrollRef.value?.scrollTo({ top: 0, behavior: 'auto' })
  }
})

watch(browseMode, (mode) => {
  stopPointerScroll()
  if (mode === 'list') {
    if (previewState.value.entering) {
      cancelSceneAnimation()
      previewController?.complete()
    }
  }
})

onBeforeRouteLeave((to) => {
  restoreState.value = {
    keyword: searchKeyword.value,
    category: activeCategory.value,
    currentPage: currentPage.value,
    activeId: titleActiveId.value ?? null,
    scrollTop: immersiveScrollRef.value?.scrollTop || 0,
    focusId: to.path.startsWith('/article/') ? lastKeyboardOpenId : null
  }
})

onMounted(async () => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionQuery.matches
  const onMotionChange = (event: MediaQueryListEvent) => {
    reducedMotion.value = event.matches
    if (event.matches) {
      stopPointerScroll()
      sceneAnimation?.finish()
    }
  }
  motionQuery.addEventListener('change', onMotionChange)
  motionChangeHandler = onMotionChange
  previewController = createImmersivePreview(previewState.value.settled, {
    prepare: prepareCover,
    isAllowed: (article) => immersiveArticles.value.some((item) => item.id === article.id),
    onChange: (snapshot) => { previewState.value = snapshot },
    onBegin: beginSceneAnimation,
    onHurry: hurrySceneAnimation,
    onCancel: cancelSceneAnimation
  })
  if (!previewState.value.settled && immersiveArticles.value[0]) requestImmersivePreview(immersiveArticles.value[0], true)
  await nextTick()
  if (restoreState.value && immersiveScrollRef.value) {
    restoringScroll = true
    immersiveScrollRef.value.scrollTop = restoreState.value.scrollTop
    requestAnimationFrame(() => { restoringScroll = false })
    if (restoreState.value.focusId) {
      restoringFocus = true
      immersiveScrollRef.value.querySelector<HTMLElement>(`[data-article-id="${restoreState.value.focusId}"] a`)?.focus({ preventScroll: true })
      restoringFocus = false
    }
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(scrollFrame)
  stopPointerScroll()
  titleInkObserver?.disconnect()
  titleInkObserver = null
  previewController?.dispose()
  previewController = null
  for (const load of [...coverLoads.values()]) load.cancel()
  coverLoads.clear()
  if (motionQuery && motionChangeHandler) motionQuery.removeEventListener('change', motionChangeHandler)
  motionQuery = null
})

useSeoMeta({
  title: '全部文章',
  description: '浏览小羊嚣张博客发布的全部文章。'
})
</script>

<style scoped lang="scss">
.articles-page {
  position: relative;
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
  min-height: 44px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 36px;
}

.heading-copy {
  max-width: min(620px, calc(100% - 64px));
}

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

.filter-label {
  font-size: 10px;
  letter-spacing: 0.1em;
}

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

  .filter-panel {
    gap: 18px;
    padding: 18px 0 20px;
  }
}

@media (max-width: 560px) {
  .result-summary {
    flex-direction: column;
    gap: 4px;
  }
}

.browse-switch {
  position: absolute;
  z-index: 3;
  top: 104px;
  right: clamp(18px, 4vw, 40px);
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;

  &:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
  &:active { transform: scale(0.97); }
}

.browse-mode-icon { display: block; width: 24px; height: 24px; }

@media (max-width: 768px) {
  .browse-switch { top: 96px; }
}

.articles-page.is-immersive {
  min-height: calc(100dvh + 86px);
  overflow: hidden;
  isolation: isolate;
  background: #121113;
  color: #f8f5f8;
  --immersive-accent: #f078ee;
}

.immersive-background,
.immersive-scene,
.immersive-shade {
  position: absolute;
  inset: 0;
}

.immersive-background {
  z-index: -1;
  background: #151316;
  pointer-events: none;
}

.immersive-scene-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #151316;
}

.immersive-scene-incoming { clip-path: inset(100% 0 0 0); }

.immersive-scene {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.immersive-shade { background: rgba(0, 0, 0, .64); }

.is-immersive .articles-shell {
  position: relative;
  width: min(1200px, calc(100% - 80px));
  height: calc(100dvh + 86px);
  min-height: 650px;
  padding: 104px 0 0;
}

.is-immersive .page-heading {
  position: relative;
  z-index: 2;
  align-items: flex-end;
  margin-bottom: 0;
}

.immersive-page-title {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.is-immersive .filter-panel {
  position: absolute;
  z-index: 2;
  top: 246px;
  left: 0;
  width: 140px;
  grid-template-columns: 1fr;
  border: 0;
  padding: 0;
}

.is-immersive .filter-label {
  color: #ddd6dd;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: .1em;
  text-transform: none;
}

.is-immersive .category-filters {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.is-immersive .category-filters button {
  min-height: 28px;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  color: #d5ced5;
  font-size: 11px;
  text-align: left;

  &:hover,
  &.active {
    background: transparent;
    color: var(--immersive-accent);
  }

  &.active { text-decoration: underline; text-underline-offset: 5px; }
}

.category-count { margin-left: 4px; font-size: 10px; }

.immersive-scroll {
  position: absolute;
  z-index: 1;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  overscroll-behavior: contain;
}

.immersive-scroll::-webkit-scrollbar { display: none; }
.immersive-list-stage { position: relative; }
.immersive-list-stage:not(.has-title-ink) .immersive-entry.active .immersive-title { color: var(--immersive-accent); }
.immersive-list { padding-block: calc(50dvh - 50px); }
.immersive-title-ink {
  position: absolute;
  inset: 0;
  color: var(--immersive-accent);
  pointer-events: none;
  transition: clip-path var(--immersive-switch-duration) var(--immersive-switch-easing);
}
.immersive-rows-move { transition: transform 400ms cubic-bezier(.23, 1, .32, 1); }
.immersive-rows-enter-active { transition: opacity 260ms cubic-bezier(.23, 1, .32, 1), transform 400ms cubic-bezier(.23, 1, .32, 1); }
.immersive-rows-enter-from { opacity: 0; transform: translateY(16px); }
.immersive-entry,
.immersive-ink-entry {
  display: flex;
  min-height: 100px;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.immersive-entry a,
.immersive-ink-link {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 88px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  text-decoration: none;
}

.immersive-entry a {
  color: #9a949a;
  cursor: pointer;

  &:focus-visible { outline: 2px solid var(--immersive-accent); outline-offset: -2px; }
  &:active { transform: scale(.98); }
}

.immersive-title {
  position: relative;
  max-width: 100%;
  font-size: clamp(38px, 4.8vw, 62px);
  font-weight: 700;
  line-height: 1.13;
  letter-spacing: -.035em;
  text-wrap: balance;
}

.immersive-meta {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: grid;
  place-items: center;
  color: #f8f5f8;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .08em;
  line-height: 1;
  pointer-events: none;
  text-shadow: 0 1px 2px #121113;
  animation: immersive-meta-enter 220ms 100ms cubic-bezier(.23, 1, .32, 1) backwards;
}

@keyframes immersive-meta-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}

.is-instant .immersive-title-ink,
.is-instant .immersive-rows-move,
.is-instant .immersive-rows-enter-active { transition: none; }

.is-instant .immersive-meta { animation: none; }

.immersive-state,
.immersive-empty {
  position: relative;
  z-index: 2;
  margin-top: 170px;
  color: #f8f5f8;
  text-align: center;
  font-size: 18px;
}

:global(.blog-layout:has(.articles-page.is-immersive) .blog-header) {
  --header-nav-color: #f8f5f8;
  --header-action-color: #f8f5f8;
}

:global(.blog-layout:has(.articles-page.is-immersive) .blog-footer) {
  display: none;
}

:global([data-theme='blue-white'] .blog-layout:has(.articles-page.is-immersive) .blog-header .brand-logo),
:global([data-theme='blue-white'] .blog-layout:has(.articles-page.is-immersive) .blog-header .mini-logo-mark) {
  filter: invert(1);
}

@media (max-width: 900px) {
  .is-immersive .articles-shell { width: calc(100% - 48px); }
}

@media (max-width: 650px) {
  .is-immersive .articles-shell {
    display: flex;
    width: calc(100% - 36px);
    height: calc(100dvh + 86px);
    min-height: 650px;
    flex-direction: column;
    padding: 96px 0 0;
  }

  .is-immersive .page-heading {
    flex: 0 0 auto;
    align-items: flex-end;
  }

  .is-immersive .filter-panel {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    flex: 0 0 auto;
    gap: 0;
    margin-top: 20px;
  }

  .is-immersive .category-field .filter-label { display: none; }
  .is-immersive .category-filters { flex-direction: row; flex-wrap: wrap; column-gap: 14px; row-gap: 2px; }
  .is-immersive .category-filters button { min-height: 44px; font-size: 11px; }
  .immersive-scroll {
    position: relative;
    inset: auto;
    min-height: 340px;
    flex: 1 1 auto;
    margin-top: 12px;
  }

  .immersive-list { padding-block: max(110px, calc(24dvh - 35px)); }
  .immersive-entry, .immersive-ink-entry { min-height: 84px; }
  .immersive-entry a, .immersive-ink-link { min-height: 76px; }
  .immersive-title { font-size: clamp(28px, 7.8vw, 38px); }
  .immersive-meta { font-size: 10px; }
  .immersive-state, .immersive-empty { margin-top: 70px; font-size: 15px; }
}

@media (prefers-reduced-motion: reduce) {
  .immersive-rows-move,
  .immersive-rows-enter-active { transition: none; }
  .immersive-title-ink { transition: none; }
  .immersive-meta { animation: none; }
}
</style>

<template>
  <Teleport to="body">
    <div
      class="article-reader-player"
      :style="playerStyle"
      role="dialog"
      aria-modal="true"
      :aria-label="`沉浸式阅读：${article.title}`"
      @dblclick="handlePlayerDblClick"
    >
      <div ref="backgroundHostRef" class="article-reader-background" aria-hidden="true"></div>
      <div class="article-reader-dim" aria-hidden="true"></div>

      <header class="article-reader-toolbar">
        <div class="reader-toolbar-actions">
          <div ref="settingsWrapRef" class="reader-settings-wrap">
            <button
              type="button"
              class="reader-icon-button"
              :aria-expanded="settingsOpen"
              aria-controls="article-reader-settings"
              aria-label="打开阅读设置"
              @pointerdown.stop
              @click.stop="settingsOpen = !settingsOpen"
            >
              <GearIcon aria-hidden="true" />
            </button>

            <div v-if="settingsOpen" id="article-reader-settings" class="reader-settings-popover" @pointerdown.stop @click.stop>
              <div class="reader-settings-heading">
                <strong>阅读设置</strong>
                <span>实时调整</span>
              </div>

              <label class="reader-setting-row">
                <span>正文字号 <output>{{ settings.fontSize }}px</output></span>
                <input v-model.number="settings.fontSize" name="fontSize" type="range" min="16" max="34" step="1" />
              </label>
              <label class="reader-setting-row">
                <span>行距 <output>{{ settings.lineHeight.toFixed(2) }}</output></span>
                <input v-model.number="settings.lineHeight" name="lineHeight" type="range" min="1.35" max="2.2" step="0.05" />
              </label>
              <label class="reader-setting-row">
                <span>当前段落高亮 <output>{{ Math.round(settings.highlight * 100) }}%</output></span>
                <input v-model.number="settings.highlight" name="highlight" type="range" min="0.45" max="1" step="0.05" />
              </label>
              <label class="reader-setting-row">
                <span>背景流动速度 <output>{{ settings.flowSpeed.toFixed(2) }}</output></span>
                <input v-model.number="settings.flowSpeed" name="flowSpeed" type="range" min="0.2" max="1.4" step="0.05" />
              </label>
              <label class="reader-setting-row">
                <span>色块形变强度 <output>{{ settings.shape.toFixed(2) }}</output></span>
                <input v-model.number="settings.shape" name="shape" type="range" min="0.2" max="1.4" step="0.05" />
              </label>
              <label class="reader-setting-row">
                <span>背景模糊 <output>{{ settings.blur }}px</output></span>
                <input v-model.number="settings.blur" name="blur" type="range" min="0" max="60" step="1" />
              </label>
              <label class="reader-setting-row">
                <span>背景压暗 <output>{{ Math.round(settings.dim * 100) }}%</output></span>
                <input v-model.number="settings.dim" name="dim" type="range" min="0.05" max="0.55" step="0.01" />
              </label>
              <label class="reader-setting-row">
                <span>背景缩放 <output>{{ settings.scale.toFixed(2) }}x</output></span>
                <input v-model.number="settings.scale" name="scale" type="range" min="1" max="1.3" step="0.01" />
              </label>
              <label class="reader-setting-row">
                <span>播放速度 <output>{{ settings.playbackSpeed.toFixed(2) }}x</output></span>
                <input v-model.number="settings.playbackSpeed" name="playbackSpeed" type="range" min="0.5" max="2.5" step="0.05" />
              </label>
            </div>
          </div>
        </div>
      </header>

      <main class="article-reader-main">
        <section class="article-reader-cover-pane" aria-label="文章封面">
          <div class="reader-cover-frame">
            <img :src="article.cover" :alt="article.title" class="reader-cover" />
          </div>

          <div v-if="blocks.length" class="article-reader-progress" aria-label="文章阅读进度">
            <strong>{{ `${displayedProgressIndex + 1} / ${blocks.length}` }}</strong>
            <input
              class="reader-progress-range"
              name="readingProgress"
              type="range"
              min="0"
              :max="Math.max(0, blocks.length - 1)"
              step="1"
              :value="displayedProgressIndex"
              :style="{ '--reader-progress': `${progressPercent}%` }"
              aria-label="跳转到文章段落"
              @input="handleProgressPreview"
              @change="handleProgressInput"
              @pointercancel="progressPreviewIndex = null"
            />
          </div>

          <div
            class="article-reader-track-switcher"
            @mouseenter="showTrackControls = true"
            @mouseleave="showTrackControls = false"
            @focusin="showTrackControls = true"
            @focusout="handleTrackFocusOut"
          >
            <header v-if="!showTrackControls" class="article-reader-article-header">
              <h1>{{ article.title }}</h1>
              <p class="reader-track-meta">
                <span>{{ article.category?.name || '未分类' }}</span>
                <span v-for="tag in article.tags || []" :key="tag.id || tag.slug || tag.name">#{{ tag.name }}</span>
                <span v-if="authorName">{{ authorName }}</span>
                <time v-if="article.publish_time" :datetime="article.publish_time">{{ formatDate(article.publish_time) }}</time>
              </p>
            </header>

            <div v-else class="reader-player-controls" aria-label="文章播放控制">
              <button
                type="button"
                class="reader-control-button"
                :disabled="!previousArticle"
                aria-label="上一篇"
                title="上一篇"
                @click="goToPreviousArticle"
              >
                <TrackPreviousIcon aria-hidden="true" />
              </button>
              <button
                type="button"
                class="reader-control-button reader-control-button--main"
                :aria-label="isPlaying ? '暂停阅读' : '播放文章'"
                :title="isPlaying ? '暂停阅读' : '播放文章'"
                @click="togglePlayback"
              >
                <PauseIcon v-if="isPlaying" aria-hidden="true" />
                <PlayIcon v-else aria-hidden="true" />
              </button>
              <button
                type="button"
                class="reader-control-button"
                :disabled="!nextArticle"
                aria-label="下一篇"
                title="下一篇"
                @click="goToNextArticle"
              >
                <TrackNextIcon aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section ref="contentScrollRef" class="article-reader-content-pane" aria-label="文章正文">
          <div v-if="rendererError" class="article-reader-error" role="alert">
            <strong>WebGL 动态背景初始化失败</strong>
            <span>{{ rendererError }}</span>
          </div>

          <div v-if="!blocks.length" class="reader-empty-content">这篇文章暂时没有可阅读的正文。</div>
          <div v-else class="article-reader-blocks">
            <article
              v-for="(block, index) in blocks"
              :key="block.key"
              :ref="(element) => setBlockRef(block.key, element)"
              class="article-reader-block markdown-content"
              :class="{
                'is-active': index === activeBlockIndex,
                'is-dimmed': index !== activeBlockIndex,
                [`article-reader-block--${block.type}`]: true
              }"
              :data-block-key="block.key"
              :data-block-index="index"
              :aria-current="index === activeBlockIndex ? 'true' : undefined"
              :style="{ '--reader-block-opacity': `${blockOpacity(index)}` }"
              tabindex="0"
              @click="handleBlockClick(block.key, $event)"
              @keydown.enter.prevent="scrollToBlock(block.key)"
            >
              <div v-html="block.html"></div>
            </article>
          </div>
        </section>
      </main>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, type ComponentPublicInstance } from 'vue'
import { GearIcon, PauseIcon, PlayIcon, TrackNextIcon, TrackPreviousIcon } from '@svg-animated-icons/vue'
import type { ArticleListItem } from '~/types/api'
import type { MarkdownBlock } from '~/utils/markdown'
import { formatDate } from '~/utils/date'

interface ReaderArticle {
  id?: number
  slug?: string
  url?: string
  title: string
  cover: string
  publish_time: string
  category?: {
    name: string
  }
  tags?: Array<{
    id?: number
    slug?: string
    name: string
  }>
}

interface ReaderSettings {
  fontSize: number
  lineHeight: number
  highlight: number
  flowSpeed: number
  shape: number
  blur: number
  dim: number
  scale: number
  playbackSpeed: number
}

interface BackgroundController {
  setFlowSpeed: (speed: number) => void
  setRenderScale: (scale: number) => void
  setStaticMode: (enable: boolean) => void
  setFPS: (fps: number) => void
  setHasLyric: (hasLyric: boolean) => void
  setAlbum: (source: HTMLImageElement) => Promise<void>
  getElement: () => HTMLCanvasElement
  dispose: () => void
}

interface MeshControlPoint {
  location: {
    0: number
    1: number
  }
  uRot: number
  vRot: number
  uScale: number
  vScale: number
}

interface MeshRendererController {
  setManualControl: (enable: boolean) => void
  getControlPoint: (x: number, y: number) => MeshControlPoint | undefined
}

interface MeshControlPointSnapshot {
  point: MeshControlPoint
  locationX: number
  locationY: number
  uScale: number
  vScale: number
  uRot: number
  vRot: number
}

const props = withDefaults(defineProps<{
  article: ReaderArticle
  blocks: MarkdownBlock[]
  articleList?: ArticleListItem[]
  authorName?: string
}>(), {
  articleList: () => [],
  authorName: ''
})

const emit = defineEmits<{
  close: []
  next: [slug: string]
  previous: [slug: string]
}>()

const SETTINGS_KEY = 'blognuxt:article-reader-settings'
const defaultSettings: ReaderSettings = {
  fontSize: 24,
  lineHeight: 1.75,
  highlight: 1,
  flowSpeed: 0.65,
  shape: 0.75,
  blur: 26,
  dim: 0.22,
  scale: 1.08,
  playbackSpeed: 1
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const normalizeSettings = (value: Partial<ReaderSettings>): ReaderSettings => ({
  fontSize: clamp(Number(value.fontSize) || defaultSettings.fontSize, 16, 34),
  lineHeight: clamp(Number(value.lineHeight) || defaultSettings.lineHeight, 1.35, 2.2),
  highlight: clamp(Number(value.highlight) || defaultSettings.highlight, 0.45, 1),
  flowSpeed: clamp(Number(value.flowSpeed) || defaultSettings.flowSpeed, 0.2, 1.4),
  shape: clamp(Number(value.shape) || defaultSettings.shape, 0.2, 1.4),
  blur: clamp(Number(value.blur) || 0, 0, 60),
  dim: clamp(Number(value.dim) || defaultSettings.dim, 0.05, 0.55),
  scale: clamp(Number(value.scale) || defaultSettings.scale, 1, 1.3),
  playbackSpeed: clamp(Number(value.playbackSpeed) || defaultSettings.playbackSpeed, 0.5, 2.5)
})

const backgroundHostRef = ref<HTMLElement | null>(null)
const contentScrollRef = ref<HTMLElement | null>(null)
const settingsWrapRef = ref<HTMLElement | null>(null)
const settingsOpen = ref(false)
const rendererError = ref('')
const activeBlockIndex = ref(0)
const progressPreviewIndex = ref<number | null>(null)
const showTrackControls = ref(false)
const isPlaying = ref(false)
const settings = reactive<ReaderSettings>({ ...defaultSettings })

let background: BackgroundController | null = null
let meshRenderer: MeshRendererController | null = null
let meshSnapshots: MeshControlPointSnapshot[] = []
let intersectionObserver: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let readingFrame = 0
let meshAnimationFrame = 0
let playbackFrame = 0
let playbackLastTimestamp = 0
let playbackWasActiveOnBlockClick = false
let playbackClickResetTimer = 0
let previousBodyOverflow = ''

const blockElements = new Map<string, HTMLElement>()

const playerStyle = computed(() => ({
  '--reader-font-size': `${settings.fontSize}px`,
  '--reader-line-height': settings.lineHeight,
  '--reader-highlight': settings.highlight,
  '--reader-background-blur': `${settings.blur}px`,
  '--reader-background-dim': settings.dim,
  '--reader-background-scale': settings.scale
}))

const resolveArticleSlug = (item: Pick<ArticleListItem, 'id' | 'slug' | 'url'>) => {
  if (item.slug) return item.slug
  const matched = item.url?.match(/\/([^/]+)\/?$/)
  return matched?.[1] ? decodeURIComponent(matched[1]) : String(item.id)
}

/** 时间策略：文章按 publishedAt（接口字段 publish_time）从新到旧排列。 */
const getTimeOrderedArticles = (articleList: ArticleListItem[], currentArticle: ReaderArticle) => {
  const list = [...articleList]
  const currentSlug = currentArticle.slug || currentArticle.url?.match(/\/([^/]+)\/?$/)?.[1]
  const hasCurrent = list.some((item) => item.id === currentArticle.id || resolveArticleSlug(item) === currentSlug)

  if (!hasCurrent && currentArticle.id !== undefined) {
    list.push({
      id: currentArticle.id,
      slug: currentArticle.slug,
      url: currentArticle.url,
      title: currentArticle.title,
      cover: currentArticle.cover,
      publish_time: currentArticle.publish_time,
      category: currentArticle.category
    })
  }

  const ordered = list.sort((a, b) => {
    const bTime = Date.parse(b.publish_time) || 0
    const aTime = Date.parse(a.publish_time) || 0
    return bTime - aTime || b.id - a.id
  })
  return ordered
}

const getCurrentArticleIndex = (ordered: ArticleListItem[], currentArticle: ReaderArticle) => {
  const currentSlug = currentArticle.slug || currentArticle.url?.match(/\/([^/]+)\/?$/)?.[1]
  return ordered.findIndex((item) => item.id === currentArticle.id || resolveArticleSlug(item) === currentSlug)
}

const timeStrategy = (articleList: ArticleListItem[], currentArticle: ReaderArticle) => {
  const ordered = getTimeOrderedArticles(articleList, currentArticle)
  const currentIndex = getCurrentArticleIndex(ordered, currentArticle)
  return currentIndex >= 0 ? ordered[currentIndex + 1] || null : null
}

const nextArticle = computed(() => timeStrategy(props.articleList, props.article))
const previousArticle = computed(() => {
  const ordered = getTimeOrderedArticles(props.articleList, props.article)
  const currentIndex = getCurrentArticleIndex(ordered, props.article)
  return currentIndex > 0 ? ordered[currentIndex - 1] : null
})
const displayedProgressIndex = computed(() => progressPreviewIndex.value ?? activeBlockIndex.value)
const progressPercent = computed(() => {
  if (props.blocks.length <= 1) return 0
  return (displayedProgressIndex.value / (props.blocks.length - 1)) * 100
})

const blockOpacity = (index: number) => {
  const distance = Math.abs(index - activeBlockIndex.value)
  if (distance === 0) return settings.highlight
  const fade = Math.min(distance, 4)
  return Math.max(0.12, settings.highlight * (0.84 - fade * 0.17))
}

const setBlockRef = (key: string, element: Element | ComponentPublicInstance | null) => {
  if (element instanceof HTMLElement) {
    blockElements.set(key, element)
  } else {
    blockElements.delete(key)
  }
}

const updateReadingSpacing = () => {
  const container = contentScrollRef.value
  const lastBlock = props.blocks.at(-1)
  const blocks = container?.querySelector<HTMLElement>('.article-reader-blocks')
  const lastElement = lastBlock ? blockElements.get(lastBlock.key) : null
  if (!container || !blocks || !lastElement) return

  const panePaddingBottom = Number.parseFloat(getComputedStyle(container).paddingBottom) || 0
  const bottomSpace = Math.max(0, (container.clientHeight - lastElement.offsetHeight) / 2 - panePaddingBottom)
  blocks.style.setProperty('--reader-block-bottom-space', `${bottomSpace}px`)
}

const updateActiveBlock = () => {
  const container = contentScrollRef.value
  if (!container || !props.blocks.length) return

  const target = container.getBoundingClientRect().top + container.clientHeight * 0.5
  let nextIndex = 0
  props.blocks.forEach((block, index) => {
    const element = blockElements.get(block.key)
    if (element && element.getBoundingClientRect().top <= target) nextIndex = index
  })
  activeBlockIndex.value = nextIndex
}

const scheduleReadingUpdate = () => {
  if (readingFrame) return
  readingFrame = window.requestAnimationFrame(() => {
    readingFrame = 0
    updateActiveBlock()
  })
}

const stopPlayback = () => {
  isPlaying.value = false
  playbackLastTimestamp = 0
  if (playbackFrame) window.cancelAnimationFrame(playbackFrame)
  playbackFrame = 0
}

const advancePlayback = (timestamp: number) => {
  if (!isPlaying.value) return

  const container = contentScrollRef.value
  if (!container) {
    stopPlayback()
    return
  }

  if (!playbackLastTimestamp) playbackLastTimestamp = timestamp
  const elapsed = Math.min(timestamp - playbackLastTimestamp, 80)
  playbackLastTimestamp = timestamp
  const maxScrollTop = container.scrollHeight - container.clientHeight

  if (container.scrollTop >= maxScrollTop - 1) {
    stopPlayback()
    return
  }

  container.scrollBy({ top: elapsed * settings.playbackSpeed * 0.12 })
  playbackFrame = window.requestAnimationFrame(advancePlayback)
}

const startPlayback = () => {
  const container = contentScrollRef.value
  if (!container || !props.blocks.length || container.scrollTop >= container.scrollHeight - container.clientHeight - 1) return
  if (isPlaying.value) return

  isPlaying.value = true
  playbackLastTimestamp = 0
  playbackFrame = window.requestAnimationFrame(advancePlayback)
}

const togglePlayback = () => {
  if (isPlaying.value) {
    stopPlayback()
  } else {
    startPlayback()
  }
}

const scrollToBlock = (key: string) => {
  const element = blockElements.get(key)
  const index = props.blocks.findIndex((block) => block.key === key)
  if (!element || index < 0) return

  stopPlayback()
  activeBlockIndex.value = index
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const handleBlockClick = (key: string, event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('a')) return
  if (event.detail > 1) return
  playbackWasActiveOnBlockClick = isPlaying.value
  if (playbackClickResetTimer) window.clearTimeout(playbackClickResetTimer)
  playbackClickResetTimer = window.setTimeout(() => {
    playbackWasActiveOnBlockClick = false
    playbackClickResetTimer = 0
  }, 400)
  scrollToBlock(key)
}

const handleProgressPreview = (event: Event) => {
  const index = Math.round(Number((event.target as HTMLInputElement).value))
  if (Number.isFinite(index)) progressPreviewIndex.value = index
}

const handleProgressInput = (event: Event) => {
  progressPreviewIndex.value = null
  const index = Math.round(Number((event.target as HTMLInputElement).value))
  const block = props.blocks[index]
  if (block) scrollToBlock(block.key)
}

const goToNextArticle = () => {
  const item = nextArticle.value
  if (item) {
    stopPlayback()
    emit('next', resolveArticleSlug(item))
  }
}

const goToPreviousArticle = () => {
  const item = previousArticle.value
  if (item) {
    stopPlayback()
    emit('previous', resolveArticleSlug(item))
  }
}

const handleTrackFocusOut = (event: FocusEvent) => {
  const container = event.currentTarget as HTMLElement | null
  const nextTarget = event.relatedTarget as Node | null
  if (!container?.contains(nextTarget)) showTrackControls.value = false
}

const handlePlayerDblClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('button, input, a, .reader-settings-popover')) return
  if (playbackWasActiveOnBlockClick) {
    playbackWasActiveOnBlockClick = false
    if (playbackClickResetTimer) window.clearTimeout(playbackClickResetTimer)
    playbackClickResetTimer = 0
    return
  }
  togglePlayback()
}

const setupReadingObservers = async () => {
  await nextTick()
  intersectionObserver?.disconnect()
  resizeObserver?.disconnect()

  const container = contentScrollRef.value
  if (!container || !props.blocks.length) return

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))
      const key = (visible[0]?.target as HTMLElement | undefined)?.dataset.blockKey
      if (key) {
        const index = props.blocks.findIndex((block) => block.key === key)
        if (index >= 0) activeBlockIndex.value = index
      }
    },
    { root: container, rootMargin: '-38% 0px -42% 0px', threshold: [0.15, 0.5, 0.85] }
  )

  props.blocks.forEach((block) => {
    const element = blockElements.get(block.key)
    if (element) intersectionObserver?.observe(element)
  })

  resizeObserver = new ResizeObserver(() => {
    updateReadingSpacing()
    scheduleReadingUpdate()
  })
  resizeObserver.observe(container)
  resizeObserver.observe(container.querySelector('.article-reader-blocks') || container)
  container.addEventListener('scroll', scheduleReadingUpdate, { passive: true })
  updateReadingSpacing()
  updateActiveBlock()
}

const readSettings = () => {
  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY)
    if (stored) Object.assign(settings, normalizeSettings(JSON.parse(stored) as Partial<ReaderSettings>))
  } catch {
    Object.assign(settings, defaultSettings)
  }
}

const saveSettings = () => {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // 隐私模式或受限存储环境不应影响阅读。
  }
}

const captureMeshControlPoints = () => {
  if (!meshRenderer) return
  meshSnapshots = []
  for (let y = 0; y < 8; y += 1) {
    if (!meshRenderer.getControlPoint(0, y)) break
    for (let x = 0; x < 8; x += 1) {
      const point = meshRenderer.getControlPoint(x, y)
      if (!point) break
      meshSnapshots.push({
        point,
        locationX: point.location[0],
        locationY: point.location[1],
        uScale: point.uScale,
        vScale: point.vScale,
        uRot: point.uRot,
        vRot: point.vRot
      })
    }
  }
}

const applyMeshShape = () => {
  const intensity = settings.shape
  meshSnapshots.forEach((snapshot) => {
    snapshot.point.uScale = snapshot.uScale * (0.75 + intensity * 0.35)
    snapshot.point.vScale = snapshot.vScale * (0.75 + intensity * 0.35)
    snapshot.point.uRot = snapshot.uRot * (0.78 + intensity * 0.28)
    snapshot.point.vRot = snapshot.vRot * (0.78 + intensity * 0.28)
  })
}

const animateMesh = (timestamp: number) => {
  if (!meshSnapshots.length) return

  const time = timestamp / 1000
  const intensity = settings.shape
  meshSnapshots.forEach((snapshot, index) => {
    const phase = index * 0.53
    const movement = 0.025 * intensity
    snapshot.point.location[0] = snapshot.locationX + Math.sin(time * 0.42 + phase) * movement
    snapshot.point.location[1] = snapshot.locationY + Math.cos(time * 0.35 + phase * 1.3) * movement
    snapshot.point.uScale = snapshot.uScale * (0.75 + intensity * 0.35) * (1 + Math.sin(time * 0.28 + phase) * 0.08 * intensity)
    snapshot.point.vScale = snapshot.vScale * (0.75 + intensity * 0.35) * (1 + Math.cos(time * 0.31 + phase) * 0.08 * intensity)
    snapshot.point.uRot = snapshot.uRot * (0.78 + intensity * 0.28) + Math.sin(time * 0.24 + phase) * 0.11 * intensity
    snapshot.point.vRot = snapshot.vRot * (0.78 + intensity * 0.28) + Math.cos(time * 0.22 + phase) * 0.11 * intensity
  })

  meshAnimationFrame = window.requestAnimationFrame(animateMesh)
}

const startMeshAnimation = () => {
  if (!meshAnimationFrame && meshSnapshots.length) meshAnimationFrame = window.requestAnimationFrame(animateMesh)
}

const applyBackgroundSettings = () => {
  if (!background) return

  // AMLL 的 flowSpeed 驱动 Mesh Gradient 的连续时间；形变强度同时作用于控制点切线。
  background.setFlowSpeed(settings.flowSpeed * (0.72 + settings.shape * 0.44) * 8)
  background.setRenderScale(0.45 + settings.scale * 0.2)
  applyMeshShape()
}

const loadAlbumImage = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error(`封面加载失败：${source}`))
  image.src = /^https?:\/\//i.test(source)
    ? `/proxy-image?url=${encodeURIComponent(source)}`
    : source
})

const initBackground = async () => {
  const cover = props.article.cover?.trim()
  if (!cover) {
    rendererError.value = '文章没有可用 cover 字段，无法采样背景颜色。'
    return
  }

  try {
    const { BackgroundRender, MeshGradientRenderer } = await import('@applemusic-like-lyrics/core')
    const canvas = document.createElement('canvas')
    const renderer = new MeshGradientRenderer(canvas)
    renderer.setManualControl(true)
    background = new BackgroundRender(renderer, canvas)
    meshRenderer = renderer
    const renderedCanvas = background.getElement()
    renderedCanvas.className = 'article-reader-background-canvas'
    renderedCanvas.dataset.renderer = 'amll-mesh-gradient-webgl'
    backgroundHostRef.value?.appendChild(renderedCanvas)
    await background.setAlbum(await loadAlbumImage(cover))
    background.setStaticMode(false)
    background.setFPS(30)
    background.setHasLyric(true)
    captureMeshControlPoints()
    applyBackgroundSettings()
    startMeshAnimation()
  } catch (error) {
    background?.dispose()
    background = null
    meshRenderer = null
    const message = error instanceof Error ? error.message : String(error)
    rendererError.value = message || '未知 WebGL 初始化错误。'
  }
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  const target = event.target as Node | null
  if (settingsOpen.value && target && !settingsWrapRef.value?.contains(target)) settingsOpen.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (settingsOpen.value) {
    settingsOpen.value = false
    return
  }
  emit('close')
}

watch(settings, () => {
  saveSettings()
  applyBackgroundSettings()
}, { deep: true })

watch(() => props.blocks, () => {
  void setupReadingObservers()
}, { deep: true })

onMounted(async () => {
  readSettings()
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleKeydown)
  await Promise.all([initBackground(), setupReadingObservers()])
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleKeydown)
  contentScrollRef.value?.removeEventListener('scroll', scheduleReadingUpdate)
  intersectionObserver?.disconnect()
  resizeObserver?.disconnect()
  intersectionObserver = null
  resizeObserver = null
  if (readingFrame) window.cancelAnimationFrame(readingFrame)
  readingFrame = 0
  if (meshAnimationFrame) window.cancelAnimationFrame(meshAnimationFrame)
  meshAnimationFrame = 0
  if (playbackFrame) window.cancelAnimationFrame(playbackFrame)
  playbackFrame = 0
  if (playbackClickResetTimer) window.clearTimeout(playbackClickResetTimer)
  playbackClickResetTimer = 0
  background?.dispose()
  background = null
  meshRenderer = null
  blockElements.clear()
  document.body.style.overflow = previousBodyOverflow
})
</script>

<style scoped lang="scss">
.article-reader-player {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  color: #fff;
  background: #17151b;
  isolation: isolate;
}

.article-reader-background,
.article-reader-dim {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.article-reader-background {
  z-index: -3;
  overflow: hidden;
}

.article-reader-background :deep(.article-reader-background-canvas) {
  position: absolute;
  inset: -9%;
  width: 118%;
  height: 118%;
  filter: blur(var(--reader-background-blur)) saturate(1.18);
  transform: scale(var(--reader-background-scale));
  transform-origin: center;
}

.article-reader-dim {
  z-index: -2;
  background: rgb(0 0 0 / var(--reader-background-dim));
}

.article-reader-toolbar,
.reader-toolbar-actions {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 18px;
  pointer-events: auto;
}

.article-reader-toolbar {
  display: flex;
  justify-content: flex-end;
  min-height: 82px;
  padding: 22px clamp(18px, 4vw, 56px);
}

.reader-icon-button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: #fff;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  pointer-events: auto;
  touch-action: manipulation;
  transition: opacity 180ms ease, transform 180ms ease;

  :deep(svg) {
    width: 20px;
    height: 20px;
  }

  &:hover,
  &:focus-visible {
    outline: none;
    opacity: 0.68;
    transform: scale(1.08);
  }
}

.reader-settings-wrap {
  position: relative;
  z-index: 3;
}

.reader-settings-popover {
  position: fixed;
  top: max(64px, calc(env(safe-area-inset-top, 0px) + 56px));
  right: max(16px, calc(env(safe-area-inset-right, 0px) + 16px));
  z-index: 4;
  display: grid;
  width: min(330px, calc(100vw - 32px));
  max-height: calc(100vh - 88px);
  max-height: calc(100dvh - 88px);
  gap: 13px;
  padding: 18px;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 18px;
  background: rgb(24 22 29 / 82%);
  box-shadow: 0 20px 60px rgb(0 0 0 / 32%);
  backdrop-filter: blur(22px);
  overflow-y: auto;
  pointer-events: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.reader-settings-heading,
.reader-setting-row > span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.reader-settings-heading {
  padding-bottom: 5px;
  color: #fff;
  font-size: 14px;

  span {
    color: rgb(255 255 255 / 48%);
    font-size: 11px;
  }
}

.reader-setting-row {
  display: grid;
  gap: 7px;
  color: rgb(255 255 255 / 78%);
  font-size: 12px;

  output {
    color: rgb(255 255 255 / 48%);
    font-variant-numeric: tabular-nums;
  }

  input {
    width: 100%;
    accent-color: #fff;
    cursor: pointer;
  }
}

.article-reader-main {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.2fr);
  gap: clamp(30px, 7vw, 120px);
  min-height: 0;
  padding: 8px clamp(24px, 8vw, 150px) 20px;
}

.article-reader-cover-pane {
  display: grid;
  align-self: center;
  justify-items: center;
  min-width: 0;
}

.reader-cover-frame {
  width: min(35vw, 390px, 100%);
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 7px;
  box-shadow: 0 30px 80px rgb(0 0 0 / 35%), 0 0 0 1px rgb(255 255 255 / 16%);
}

.reader-cover {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-reader-article-header {
  width: 100%;
  max-width: 780px;
  min-width: 0;
  margin: 0;
  text-align: center;

  h1 {
    max-width: 100%;
    margin: 0 0 12px;
    color: #fff;
    font-size: clamp(19px, 7cqw, 30px);
    line-height: 1.18;
    letter-spacing: -0.03em;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
}

.reader-track-meta {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 6px 12px;
  margin: 0;
  color: rgb(255 255 255 / 66%);
  font-size: 13px;
  overflow: hidden;
  overflow-wrap: anywhere;
  white-space: nowrap;
  word-break: break-word;

  span + span::before,
  span + time::before,
  time + span::before {
    margin-right: 12px;
    color: rgb(255 255 255 / 38%);
    content: '·';
  }
}

.article-reader-content-pane {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overflow-x: hidden;
  padding: 5vh 8px 4vh 0;
  scrollbar-width: none;
  mask-image: linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent);

  &::-webkit-scrollbar {
    display: none;
  }
}

.article-reader-blocks {
  display: grid;
  align-content: center;
  gap: clamp(23px, 4vh, 48px);
  min-height: 100%;
  padding: 48vh 0 var(--reader-block-bottom-space, 16vh);
}

.article-reader-block {
  min-width: 0;
  max-width: 780px;
  margin: 0;
  color: rgb(255 255 255 / var(--reader-block-opacity));
  font-size: var(--reader-font-size);
  line-height: var(--reader-line-height);
  overflow-wrap: anywhere;
  word-break: break-word;
  cursor: pointer;
  outline: none;
  font-weight: 400;
  transition: color 260ms ease, opacity 260ms ease, filter 260ms ease, transform 260ms ease, text-shadow 260ms ease;

  &.is-dimmed {
    filter: saturate(0.5);
    transform: scale(0.975);
    text-shadow: none;
  }

  &.is-active {
    color: rgb(255 255 255 / var(--reader-highlight));
    filter: none;
    transform: scale(1);
    font-weight: 500;
    text-shadow: 0 0 18px rgb(255 255 255 / 14%);
  }

  &:focus-visible {
    border-radius: 10px;
    box-shadow: 0 0 0 2px rgb(255 255 255 / 70%);
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin: 0;
    color: inherit;
    font-size: 1.38em;
    line-height: 1.22;
  }

  :deep(p),
  :deep(blockquote),
  :deep(ul),
  :deep(ol),
  :deep(pre),
  :deep(table) {
    margin: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  :deep(blockquote) {
    padding-left: 20px;
    border-left: 3px solid currentColor;
  }

  :deep(a) {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 10px;
  }

  :deep(pre) {
    overflow: hidden;
    padding: 16px;
    border-radius: 10px;
    background: rgb(0 0 0 / 20%);
    font-size: 0.75em;
    white-space: pre-wrap;
  }

  :deep(code) {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  :deep(table) {
    width: 100%;
    table-layout: fixed;
  }

  :deep(th),
  :deep(td) {
    overflow-wrap: anywhere;
    word-break: break-word;
  }
}

.article-reader-error {
  display: grid;
  gap: 7px;
  margin: 20px 0;
  padding: 15px 18px;
  border: 1px solid rgb(255 196 196 / 55%);
  border-radius: 12px;
  color: #ffe3e3;
  background: rgb(83 16 24 / 62%);
  font-size: 13px;

  span {
    color: rgb(255 227 227 / 78%);
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
}

.reader-empty-content {
  align-self: center;
  color: rgb(255 255 255 / 64%);
}

.article-reader-progress {
  display: grid;
  width: min(35vw, 390px, 100%);
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  margin-top: 18px;

  > strong {
    color: rgb(255 255 255 / 76%);
    font-size: 12px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
}

.article-reader-track-switcher {
  width: min(35vw, 390px, 100%);
  height: 152px;
  margin-top: 24px;
  container-type: inline-size;
}

.reader-player-controls {
  display: flex;
  height: 100%;
  min-height: 0;
  align-items: center;
  justify-content: center;
  gap: clamp(22px, 3vw, 38px);
}

.reader-control-button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  padding: 0;
  border: 0;
  color: rgb(255 255 255 / 82%);
  background: transparent;
  cursor: pointer;
  transition: color 180ms ease, opacity 180ms ease, transform 180ms ease;

  :deep(svg) {
    width: 22px;
    height: 22px;
    line-height: 1;
  }

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    color: #fff;
    outline: none;
    transform: scale(1.08);
  }

  &--main :deep(svg) {
    width: 30px;
    height: 30px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.25;
  }
}

.reader-progress-range {
  appearance: none;
  display: block;
  width: 100%;
  height: 14px;
  margin: 0;
  border: 0;
  outline: none;
  background: transparent;
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    height: 2px;
    border: 0;
    border-radius: 0;
    background: linear-gradient(
      to right,
      rgb(255 255 255 / 92%) var(--reader-progress),
      rgb(255 255 255 / 32%) var(--reader-progress)
    );
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 2px;
    height: 10px;
    margin-top: -4px;
    border: 0;
    border-radius: 0;
    background: #fff;
  }

  &::-moz-range-track {
    height: 2px;
    border: 0;
    border-radius: 0;
    background: rgb(255 255 255 / 32%);
  }

  &::-moz-range-progress {
    height: 2px;
    border-radius: 0;
    background: rgb(255 255 255 / 92%);
  }

  &::-moz-range-thumb {
    width: 2px;
    height: 10px;
    border: 0;
    border-radius: 0;
    background: #fff;
  }

  &:focus-visible {
    &::-webkit-slider-runnable-track {
      box-shadow: 0 0 0 1px rgb(255 255 255 / 55%);
    }

    &::-moz-range-track {
      outline: 1px solid rgb(255 255 255 / 55%);
    }
  }
}

.article-reader-next-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.reader-next-button {
  display: grid;
  width: 32px;
  height: 28px;
  place-items: center;
  padding: 0;
  border: 0;
  color: rgb(255 255 255 / 64%);
  background: transparent;
  cursor: pointer;

  span {
    font-size: 24px;
    line-height: 1;
  }

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    color: #fff;
    outline: none;
  }

  &:disabled {
    cursor: default;
    opacity: 0.52;
  }
}

@media (max-width: 820px) {
  .article-reader-main {
    grid-template-columns: 1fr;
    gap: 18px;
    overflow: auto;
    scrollbar-width: none;
    padding: 8px 22px 16px;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .article-reader-cover-pane {
    align-self: start;
    display: grid;
    justify-items: center;
    width: 100%;
  }

  .reader-cover-frame {
    width: min(58vw, 300px);
  }

  .article-reader-article-header {
    width: auto;
    margin-bottom: 0;

    h1 {
      font-size: clamp(19px, 7cqw, 24px);
    }
  }

  .article-reader-track-switcher {
    width: min(66vw, 260px);
    height: 132px;
    text-align: center;
  }

  .reader-player-controls {
    gap: 20px;
  }

  .article-reader-content-pane {
    min-height: 46vh;
    padding: 4vh 2px 3vh 0;
  }

  .article-reader-blocks {
    align-content: start;
    min-height: 100%;
    padding: 34vh 0 var(--reader-block-bottom-space, 16vh);
  }

  .article-reader-progress {
    width: min(66vw, 260px);
    gap: 10px;
  }
}

@media (max-width: 520px) {
  .article-reader-toolbar {
    min-height: 68px;
    padding: 15px 16px;
  }

  .article-reader-main {
    padding-right: 16px;
    padding-left: 16px;
  }

  .reader-cover-frame {
    width: min(66vw, 260px);
  }

  .article-reader-block {
    font-size: var(--reader-font-size);
  }
}
</style>

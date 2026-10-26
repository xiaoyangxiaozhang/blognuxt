<template>
  <Teleport v-if="music.currentTrack" to="body">
    <dialog
      id="site-music-panel"
      ref="dialog"
      class="music-panel"
      :class="{ 'music-instant': music.instant }"
      :style="{ '--music-top': `${music.panelPosition.top}px`, '--music-right': `${music.panelPosition.right}px`, '--music-accent-text': accentText }"
      aria-label="音乐播放器"
      @cancel.prevent="music.closePanel()"
      @close="handleDialogClose"
      @pointerdown="backdropPressed = $event.target === dialog"
      @click="handleBackdrop"
    >
      <button class="music-icon-button music-panel-close" type="button" aria-label="收起音乐面板" @click="music.closePanel()">
        <Cross1Icon aria-hidden="true" />
      </button>

      <img v-if="music.panelOpen && music.currentTrack.cover" class="music-cover-background" :src="proxyImageUrl(music.currentTrack.cover, 384)" alt="" aria-hidden="true">
      <div class="music-current">
        <VinylRecord class="music-current-icon" detailed :cover="music.currentTrack.cover" :playing="music.isPlaying && !music.isLoading" :instant="music.instant" />
        <div class="music-current-info">
          <h3>{{ music.currentTrack.title }}</h3>
          <p>{{ displayArtist }}</p>
        </div>
      </div>

      <div class="music-toolbar" :class="{ 'has-source': music.canMix || music.availableModes.length > 1 }">
        <label v-if="music.canMix" class="music-source-blend music-segmented" :style="{ '--music-blend-value': music.mixBalance }">
          <span class="music-blend-highlight" aria-hidden="true" />
          <span v-for="selected in [false, true]" :key="String(selected)" class="music-blend-labels" :class="{ 'is-selected': selected }" aria-hidden="true">
            <span>伴奏</span><span>混合</span><span>人声</span>
          </span>
          <input type="range" aria-label="伴奏与人声比例" :aria-valuetext="mixDescription" min="0" max="100" step="1" :value="Math.round(music.mixBalance * 100)" @input="music.setMixBalance(Number(($event.target as HTMLInputElement).value) / 100)" @pointerdown.prevent="startBlendDrag" @pointermove="moveBlendDrag" @pointerup="endBlendDrag">
        </label>
        <div v-else-if="music.availableModes.length > 1" class="music-source-modes" role="radiogroup" aria-label="歌曲音源" :aria-busy="music.isSwitching" @keydown="handleModeKey">
          <button v-for="mode in music.availableModes" :key="mode" :id="`music-source-${mode}`" type="button" role="radio" :aria-checked="music.activeMode === mode" :tabindex="music.activeMode === mode ? 0 : -1" @click="music.setMode(mode)">{{ musicModeLabels[mode] }}</button>
        </div>
        <div class="music-view-tabs music-segmented" role="tablist" aria-label="音乐面板视图" @keydown="handleTabKey">
          <button id="music-tab-lyrics" role="tab" type="button" :aria-selected="music.panelView === 'lyrics'" aria-controls="music-view-lyrics" :tabindex="music.panelView === 'lyrics' ? 0 : -1" @click="setPanelView('lyrics', $event)">歌词</button>
          <button id="music-tab-songs" role="tab" type="button" :aria-selected="music.panelView === 'songs'" aria-controls="music-view-songs" :tabindex="music.panelView === 'songs' ? 0 : -1" @click="setPanelView('songs', $event)">选歌</button>
        </div>
      </div>

      <div class="music-content" :class="{ 'music-view-instant': viewInstant }">
        <Transition name="music-view">
          <section v-show="music.panelView === 'lyrics'" id="music-view-lyrics" class="music-view music-lyrics-view" role="tabpanel" aria-labelledby="music-tab-lyrics" :inert="music.panelView !== 'lyrics'" :aria-hidden="music.panelView !== 'lyrics'" :aria-busy="lyricsLoading" tabindex="0">
            <div v-if="lyricsLoading" class="music-content-message" role="status">正在寻找歌词…</div>
            <template v-else-if="lyrics.length">
              <p v-if="!lyricsSynced" class="music-lyrics-note">{{ lyricsPending ? '时间轴准备中' : '内嵌歌词 · 暂无时间轴' }}</p>
              <div ref="lyricsScroller" class="music-lyrics" :class="{ 'is-synced': lyricsSynced }" @wheel.passive="holdLyricsScroll" @touchstart.passive="holdLyricsScroll">
                <template v-for="(line, index) in lyrics" :key="index">
                  <button v-if="line.time !== null" class="music-lyric-line" type="button" :data-line="index" :class="{ 'is-active': index === activeLyricIndex }" :aria-current="index === activeLyricIndex ? 'true' : undefined" :aria-label="`跳转到 ${formatMusicTime(line.time)}，${line.text}`" @click="seekLyric(line.time)">{{ line.text }}</button>
                  <p v-else class="music-lyric-line music-lyric-plain">{{ line.text }}</p>
                </template>
              </div>
            </template>
            <div v-else class="music-content-message" :role="lyricsError ? 'status' : undefined">
              <span>{{ lyricsError || (lyricsPending ? '歌词准备中…' : '暂无歌词') }}</span>
              <button v-if="lyricsError" type="button" @click="loadLyrics(true)">重新加载</button>
            </div>
          </section>
        </Transition>
        <Transition name="music-view">
          <section v-show="music.panelView === 'songs'" id="music-view-songs" class="music-view" role="tabpanel" aria-labelledby="music-tab-songs" :inert="music.panelView !== 'songs'" :aria-hidden="music.panelView !== 'songs'" tabindex="0">
            <ul v-if="music.panelOpen && music.panelView === 'songs'" ref="songsScroller" class="music-playlist" aria-label="歌曲列表" @scroll.passive="rememberSongsScroll">
              <li v-for="(track, index) in music.tracks" :key="track.id">
                <button class="music-track" type="button" :aria-current="track.id === music.currentTrack.id ? 'true' : undefined" :aria-label="`${track.id === music.currentTrack.id ? '当前曲目，' : '播放'}${track.title}，${track.artist}`" @click="music.selectTrack(index)">
                  <span class="music-track-cover">
                    <img v-if="track.cover" :src="proxyImageUrl(track.cover, 128)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).hidden = true">
                    <span v-else class="music-cover-fallback" aria-hidden="true">♪</span>
                    <span v-if="track.id === music.currentTrack.id" class="music-equalizer" :class="{ 'is-playing': music.isPlaying && !music.isLoading }" aria-hidden="true"><i /><i /><i /></span>
                  </span>
                  <span class="music-track-copy"><strong>{{ track.title }}</strong><span>{{ track.artist }}</span></span>
                  <span class="music-track-duration">{{ track.duration ? formatMusicTime(track.duration) : '···' }}</span>
                </button>
              </li>
            </ul>
          </section>
        </Transition>
      </div>

      <div class="music-controls">
        <div class="music-feedback" aria-live="polite">
          <span v-if="music.error" role="alert">{{ music.error }} <button type="button" @click="music.play">重试</button></span>
          <span v-else-if="downloadError" role="alert">{{ downloadError }}</span>
          <span v-else-if="downloadingId">正在准备下载…</span>
          <span v-else-if="music.isSwitching">正在切换音源…</span>
          <span v-else-if="music.isLoading">正在加载音频…</span>
        </div>
        <input class="music-range" type="range" aria-label="播放进度" :aria-valuetext="`${formatMusicTime(displayedTime)} / ${formatMusicTime(music.duration)}`" :max="music.duration" :value="displayedTime" :style="{ '--music-range-value': `${displayedProgress}%` }" min="0" step="0.1" @input="previewProgress" @change="commitProgress" @pointercancel="progressPreviewTime = null" @blur="progressPreviewTime = null">
        <div class="music-time"><span>{{ formatMusicTime(displayedTime) }}</span><span>{{ formatMusicTime(music.duration) }}</span></div>
        <div class="music-transport">
          <button class="music-icon-button music-shuffle" type="button" :aria-label="music.shuffle ? '关闭随机播放' : '开启随机播放'" :title="music.shuffle ? '随机播放已开启' : '顺序播放，点击开启随机播放'" :aria-pressed="music.shuffle" @click="music.toggleShuffle"><ShuffleIcon instant aria-hidden="true" /></button>
          <button class="music-icon-button" type="button" aria-label="上一首" @click="music.previous"><TrackPreviousIcon aria-hidden="true" /></button>
          <button ref="mainPlayButton" class="music-icon-button music-main-play" type="button" :aria-label="music.isPlaying || music.isLoading ? '暂停音乐' : '播放音乐'" @click="music.togglePlayback"><PlayIcon :active="music.isPlaying || music.isLoading" :instant="music.instant" aria-hidden="true" /></button>
          <button class="music-icon-button" type="button" aria-label="下一首" @click="music.next"><TrackNextIcon aria-hidden="true" /></button>
          <button v-if="downloadEnabled && instrumentalSource" class="music-icon-button music-download" type="button" :disabled="!!downloadingId" :aria-label="`下载${music.currentTrack.title}伴奏`" :aria-busy="downloadingId === music.currentTrack.id" @click="downloadTrack(music.currentTrack)"><DownloadIcon instant aria-hidden="true" /></button>
          <span v-else class="music-control-spacer" aria-hidden="true" />
        </div>
        <label class="music-volume">
          <span>音量</span>
          <input class="music-range" type="range" aria-label="音乐音量" min="0" max="100" :value="Math.round(music.volume * 100)" :style="{ '--music-range-value': `${Math.round(music.volume * 100)}%` }" @input="music.setVolume(Number(($event.target as HTMLInputElement).value) / 100)">
          <span>{{ Math.round(music.volume * 100) }}%</span>
        </label>
      </div>
    </dialog>

    <div v-if="music.hasStarted" class="music-mini" role="region" aria-label="音乐迷你播放器">
      <div class="music-mini-progress" aria-hidden="true"><span :style="{ transform: `scaleX(${music.progress / 100})` }" /></div>
      <button class="music-mini-details" type="button" aria-controls="site-music-panel" :aria-expanded="music.panelOpen" :aria-label="`打开音乐面板，${music.currentTrack.title}`" @click="music.openPanel">
        <VinylRecord :cover="music.currentTrack.cover" :playing="music.isPlaying && !music.isLoading" :instant="music.instant" />
        <span><strong>{{ music.currentTrack.title }}</strong><span>{{ music.error ? '播放失败，点此重试' : music.isLoading ? '正在加载…' : music.currentTrack.artist }}</span></span>
      </button>
      <button class="music-icon-button" type="button" :aria-label="music.isPlaying || music.isLoading ? '暂停音乐' : '播放音乐'" @click="music.togglePlayback">
        <PlayIcon :active="music.isPlaying || music.isLoading" :instant="music.instant" aria-hidden="true" />
      </button>
      <button class="music-icon-button" type="button" aria-label="下一首" @click="music.next"><TrackNextIcon aria-hidden="true" /></button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import VinylRecord from './VinylRecord.vue'
import { Cross1Icon, DownloadIcon, PlayIcon, ShuffleIcon, TrackNextIcon, TrackPreviousIcon } from '~/utils/siteIcons'
import { formatMusicTime, musicModeLabels, musicSourceFor, type MusicTrack } from '~/data/music'
import { useMusicPlayerStore } from '~/stores/music'
import { useSiteOverlays } from '~/composables/useSiteOverlays'
import { useBlogSettings } from '~/composables/useBlogSettings'
import { proxyImageUrl } from '~/utils/image'
import { parseMusicLyrics, type MusicLyricLine } from '~/utils/musicLyrics'
import type { ApiResponse } from '~/types/api'

const music = useMusicPlayerStore()
const { settings } = useBlogSettings()
const accentText = computed(() => {
  const color = settings.value['blog.theme_color']?.trim() || ''
  if (!/^#[\da-f]{6}$/i.test(color)) return 'var(--bg-primary)'
  const [r, g, b] = [1, 3, 5].map(offset => {
    const channel = parseInt(color.slice(offset, offset + 2), 16) / 255
    return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
  })
  const luminance = .2126 * r! + .7152 * g! + .0722 * b!
  return luminance > .183 ? '#050505' : '#ffffff'
})
const instrumentalSource = computed(() => musicSourceFor(music.currentTrack, 'instrumental'))
const mixDescription = computed(() => `伴奏 ${Math.round(music.instrumentalLevel * 100)}%，人声 ${Math.round(music.vocalLevel * 100)}%${music.mixBalance === .5 ? '，等量混合' : ''}`)
function startBlendDrag(event: PointerEvent) {
  if (event.button !== 0) return
  const input = event.currentTarget as HTMLInputElement
  input.focus({ preventScroll: true })
  input.setPointerCapture(event.pointerId)
  moveBlendDrag(event)
}
function moveBlendDrag(event: PointerEvent) {
  const input = event.currentTarget as HTMLInputElement
  if (!input.hasPointerCapture(event.pointerId)) return
  const rect = input.parentElement!.querySelector('.music-blend-labels')!.getBoundingClientRect()
  music.setMixBalance(Math.round((event.clientX - rect.left - rect.width / 6) / (rect.width * 2 / 3) * 100) / 100)
}
function endBlendDrag(event: PointerEvent) {
  const input = event.currentTarget as HTMLInputElement
  if (!input.hasPointerCapture(event.pointerId)) return
  moveBlendDrag(event)
  input.releasePointerCapture(event.pointerId)
}
const displayArtist = computed(() => (music.currentTrack?.artist || '').replace(/\s*[·•|]\s*(?:伴奏|人声|原曲)\s*$/, ''))
function handleModeKey(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const modes = music.availableModes
  const index = modes.indexOf(music.activeMode)
  const target = event.key === 'Home' ? 0 : event.key === 'End' ? modes.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + modes.length) % modes.length
  const mode = modes[target]
  if (mode) { music.setMode(mode); document.getElementById(`music-source-${mode}`)?.focus({ preventScroll: true }) }
}
const api = useApi()
const downloadEnabled = computed(() => settings.value['blog.music_download_enabled'] === 'true')
const downloadingId = ref('')
const downloadError = ref('')
const route = useRoute()
const dialog = ref<HTMLDialogElement | null>(null)
const mainPlayButton = ref<HTMLButtonElement | null>(null)
const progressPreviewTime = ref<number | null>(null)
const displayedTime = computed(() => progressPreviewTime.value ?? music.currentTime)
const displayedProgress = computed(() => music.duration > 0 ? Math.min(100, displayedTime.value / music.duration * 100) : 0)
const { feedbackOpen, accountOpen, subscribeOpen } = useSiteOverlays()
let mobileQuery: MediaQueryList
let previousOverflow: string | null = null

const viewInstant = ref(false)
const lyricText = ref('')
const lyricOffset = ref(0)
const lyrics = computed<MusicLyricLine[]>(() => parseMusicLyrics(lyricText.value, lyricOffset.value + (music.currentSource?.offset_ms || 0)))
const lyricsLoading = ref(false)
const lyricsError = ref('')
const lyricsPending = ref(false)
const lyricsScroller = ref<HTMLElement | null>(null)
const songsScroller = ref<HTMLElement | null>(null)
const lyricsSynced = computed(() => lyrics.value.some(line => line.time !== null))
const activeLyricIndex = computed(() => {
  for (let index = lyrics.value.length - 1; index >= 0; index--) {
    const time = lyrics.value[index]!.time
    if (time !== null && time <= music.currentTime) return index
  }
  return -1
})
let lyricsPoll: ReturnType<typeof setTimeout> | undefined
let lyricsRequest = 0
let lyricsController: AbortController | null = null
let songsScrollTop = 0
let lyricsScrollHeldUntil = 0
const backdropPressed = ref(false)

function setPanelView(view: 'lyrics' | 'songs', event: MouseEvent | KeyboardEvent) {
  viewInstant.value = event instanceof KeyboardEvent || event.detail === 0
  music.panelView = view
}
function handleTabKey(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const view = event.key === 'Home' ? 'lyrics' : event.key === 'End' ? 'songs' : music.panelView === 'lyrics' ? 'songs' : 'lyrics'
  setPanelView(view, event)
  document.getElementById(`music-tab-${view}`)?.focus({ preventScroll: true })
}
function rememberSongsScroll() {
  if (music.panelOpen && music.panelView === 'songs') songsScrollTop = songsScroller.value?.scrollTop || 0
}
function holdLyricsScroll() { lyricsScrollHeldUntil = Date.now() + 2500 }
async function centerLyric(force = false) {
  if (!music.panelOpen || music.panelView !== 'lyrics' || (!force && Date.now() < lyricsScrollHeldUntil)) return
  await nextTick()
  const scroller = lyricsScroller.value
  const line = scroller?.querySelector<HTMLElement>(`[data-line="${Math.max(0, activeLyricIndex.value)}"]`)
  if (!scroller || !line) return
  const top = scroller.scrollTop + line.getBoundingClientRect().top - scroller.getBoundingClientRect().top - (scroller.clientHeight - line.offsetHeight) / 2
  scroller.scrollTo({ top: Math.max(0, top), behavior: force || viewInstant.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
function seekLyric(time: number) { lyricsScrollHeldUntil = 0; music.seek(time); void centerLyric() }
async function loadLyrics(_retry = false, background = false) {
  const track = music.currentTrack
  if (!track || !music.panelOpen) return
  const request = ++lyricsRequest
  clearTimeout(lyricsPoll)
  lyricsController?.abort()
  lyricsError.value = ''
  if (!background) { lyricText.value = ''; lyricsPending.value = false }
  const controller = new AbortController()
  lyricsController = controller
  if (!background) lyricsLoading.value = true
  try {
    const result = await api<ApiResponse<{ text: string; offset_ms?: number; status?: string }>>(`/music/${encodeURIComponent(track.id)}/lyrics`, { signal: controller.signal, timeout: 15000, retry: 0 })
    if (result.code !== 0) throw new Error('Lyrics unavailable')
    if (controller.signal.aborted || request !== lyricsRequest) return
    lyricText.value = result.data?.text || ''
    lyricOffset.value = result.data?.offset_ms || 0
    lyricsPending.value = result.data?.status === 'pending' || result.data?.status === 'processing'
    if (lyricsPending.value) lyricsPoll = setTimeout(() => { void loadLyrics(false, true) }, 5000)
    void centerLyric(true)
  } catch {
    if (!controller.signal.aborted && request === lyricsRequest) lyricsError.value = '歌词暂时无法加载'
  } finally { if (request === lyricsRequest) lyricsLoading.value = false }
}
watch(activeLyricIndex, () => { void centerLyric() })
watch(() => music.panelView, async view => {
  await nextTick()
  if (view === 'lyrics') void centerLyric(true)
  else if (songsScroller.value) songsScroller.value.scrollTop = songsScrollTop
})
watch([() => music.currentTrack?.id, () => music.currentTrack?.src, () => music.currentTrack?.title, () => music.currentTrack?.artist, () => music.currentTrack?.duration], () => {
  ++lyricsRequest
  clearTimeout(lyricsPoll)
  lyricsController?.abort()
  lyricText.value = ''
  lyricsPending.value = false
  if (music.panelOpen) void loadLyrics()
})

async function downloadTrack(track: MusicTrack) {
  if (!downloadEnabled.value || !instrumentalSource.value || downloadingId.value) return
  downloadingId.value = track.id
  downloadError.value = ''
  try {
    const source = instrumentalSource.value
    const file = await api<Blob>(`/music/${encodeURIComponent(track.id)}/download`, {
      responseType: 'blob', timeout: 120_000, retry: 0
    })
    if (!file.size || file.type.includes('json')) throw new Error('Invalid audio response')
    const extension = new URL(source.src, window.location.href).pathname.match(/\.(mp3|wav|ogg|aac|flac|m4a|opus|aiff)$/i)?.[0] || '.mp3'
    const link = document.createElement('a')
    const url = URL.createObjectURL(file)
    link.href = url
    link.download = `${track.title.replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '_')}_伴奏${extension}`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (cause: any) {
    downloadError.value = cause?.response?.status === 403
      ? '伴奏下载已关闭，请刷新页面。'
      : '下载失败，请稍后重试。'
  } finally { downloadingId.value = '' }
}

function previewProgress(event: Event) {
  const seconds = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(seconds)) progressPreviewTime.value = Math.max(0, Math.min(seconds, music.duration))
}

function commitProgress(event: Event) {
  progressPreviewTime.value = null
  music.seek(Number((event.target as HTMLInputElement).value))
}

watch([() => music.currentTrack?.id, () => music.currentTrack?.src], () => { progressPreviewTime.value = null })

function releaseScroll() {
  if (previousOverflow !== null) {
    document.documentElement.style.overflow = previousOverflow
    previousOverflow = null
  }
}

async function syncPanel(open: boolean) {
  await nextTick()
  if (open !== music.panelOpen) return
  const panel = dialog.value
  if (!panel) return
  if (!open) {
    ++lyricsRequest
    clearTimeout(lyricsPoll)
    lyricsController?.abort()
    lyricsLoading.value = false
    rememberSongsScroll()
    progressPreviewTime.value = null
    panel.close()
    releaseScroll()
    return
  }
  if (panel.open) return
  if (mobileQuery.matches) {
    previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    panel.showModal()
  } else {
    panel.show()
  }
  void loadLyrics()
  if (music.panelView === 'songs' && songsScroller.value) songsScroller.value.scrollTop = songsScrollTop
  if (music.instant) mainPlayButton.value?.focus({ preventScroll: true })
}
watch(() => music.panelOpen, syncPanel)

watch(() => route.fullPath, () => music.closePanel(false))
watch([feedbackOpen, accountOpen, subscribeOpen], values => {
  if (values.some(Boolean)) music.closePanel(false)
})

function handleBackdrop(event: MouseEvent) {
  if (!backdropPressed.value || event.target !== dialog.value) return
  backdropPressed.value = false
  const rect = dialog.value!.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) music.closePanel()
}

function handleDialogClose() {
  // close 事件可能晚于下一次展开到达，不让旧事件收起已重新打开的面板。
  if (!dialog.value?.open) music.closePanel(false)
}

function handleOutside(event: PointerEvent) {
  const target = event.target as Element
  if (music.panelOpen && !dialog.value?.contains(target) && !target.closest('[aria-controls="site-music-panel"]')) music.closePanel(false)
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && music.panelOpen) {
    event.preventDefault()
    music.closePanel()
  }
}

function handleResize() { music.closePanel(false) }

onMounted(() => {
  music.panelReady = true
  music.initialize()
  mobileQuery = window.matchMedia('(max-width: 768px)')
  document.addEventListener('pointerdown', handleOutside)
  document.addEventListener('keydown', handleEscape)
  window.addEventListener('resize', handleResize)
  if (music.panelOpen) void syncPanel(true)
})

onBeforeUnmount(() => {
  music.panelReady = false
  ++lyricsRequest
  clearTimeout(lyricsPoll)
  lyricsController?.abort()
  music.closePanel(false)
  releaseScroll()
  document.removeEventListener('pointerdown', handleOutside)
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.music-panel, .music-mini {
  --music-tab-accent: var(--brand-accent);
  --music-accent: color-mix(in srgb, var(--brand-accent) 40%, var(--text-primary));
  --music-range-fill: var(--music-accent);
  --music-range-track: color-mix(in srgb, var(--text-primary) 25%, transparent);
  color: var(--text-primary); background: var(--bg-panel-solid); font: inherit;
  button { color: inherit; font: inherit; cursor: pointer; }
  button:focus-visible, input:focus-visible, [role='tabpanel']:focus-visible { outline: 2px solid var(--music-accent); outline-offset: 2px; }
  button:active { opacity: .75; }
}
.music-panel {
  position: fixed; z-index: 500; inset: var(--music-top) var(--music-right) auto auto;
  width: 340px; max-width: calc(100vw - 32px); height: min(620px, calc(100dvh - var(--music-top) - 16px));
  max-height: calc(100dvh - var(--music-top) - 16px); box-sizing: border-box;
  margin: 0; padding: 14px 20px 16px; border: 1px solid var(--border-color); border-radius: 16px;
  background: color-mix(in srgb, var(--bg-panel-solid) 94%, transparent);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 16px 42px var(--shadow-color); overflow: hidden; overscroll-behavior: contain;
  &[open] { display: grid; grid-template-rows: auto auto minmax(0, 1fr) auto; gap: 10px; animation: music-panel-enter 180ms cubic-bezier(.23, 1, .32, 1); }
  &.music-instant { animation: none; }
  &::backdrop { background: var(--overlay-strong); }
}
.music-cover-background { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: blur(32px); opacity: .07; pointer-events: none; }
.music-current, .music-toolbar, .music-view-tabs, .music-content, .music-controls { position: relative; z-index: 1; min-width: 0; }
.music-panel-close { position: absolute; z-index: 2; top: 4px; right: 4px; }
.music-icon-button {
  display: inline-flex; align-items: center; justify-content: center; flex: 0 0 44px;
  width: 44px; height: 44px; border: 0; border-radius: 50%; padding: 0; background: transparent;
  :deep(svg) { width: 19px; height: 19px; }
}
.music-current { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 4px 18px 0; }
.music-current-icon { width: 88px; height: 88px; flex-shrink: 0; }
.music-current-info { width: 100%; min-width: 0; text-align: center; }
.music-current h3 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0; font-size: 21px; font-weight: 600; line-height: 1.4; }
.music-current p { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 3px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
.music-toolbar { display: flex; align-items: center; justify-content: center; gap: 8px;
  &.has-source > :first-child { flex: 3; min-width: 0; }
  &.has-source .music-view-tabs { flex: 2; }
}
.music-segmented { height: 30px; padding: 3px; border: 1px solid var(--border-color); border-radius: 9px; background: color-mix(in srgb, var(--bg-soft) 70%, transparent); box-sizing: border-box; }
.music-source-blend { position: relative; display: block; min-width: 0;
  input { position: absolute; z-index: 2; inset: 0; width: 100%; height: 100%; box-sizing: border-box; padding: 0; border: 0; margin: 0; opacity: 0; cursor: ew-resize; touch-action: none; }
  &:has(input:focus-visible) { outline: 2px solid var(--music-accent); outline-offset: 2px; }
}
.music-blend-highlight { position: absolute; inset: 3px auto 3px 3px; width: calc((100% - 6px) / 3); border-radius: 5px; background: var(--music-tab-accent); transform: translateX(calc(var(--music-blend-value) * 200%)); pointer-events: none; }
.music-blend-labels { position: absolute; inset: 3px; display: grid; grid-template-columns: repeat(3, 1fr); align-items: center; text-align: center; color: var(--text-secondary); font-size: 12px; font-weight: 500; pointer-events: none;
  &.is-selected { color: var(--music-accent-text); clip-path: inset(0 calc((1 - var(--music-blend-value)) * 66.666667%) 0 calc(var(--music-blend-value) * 66.666667%)); }
}
.music-source-modes { display: flex; align-items: center; justify-content: center; gap: 12px; height: 32px;
  button { position: relative; min-width: 48px; min-height: 44px; padding: 0 6px; border: 0; background: transparent; color: var(--text-secondary); font-size: 12px; }
  button[aria-checked='true'] { color: var(--music-accent); font-weight: 600; }
  button[aria-checked='true']::after { content: ''; position: absolute; bottom: 5px; left: calc(50% - 9px); width: 18px; height: 2px; border-radius: 1px; background: currentColor; }
}
@media (hover: hover) and (pointer: fine) { .music-source-modes button:hover { color: var(--music-accent); } }
.music-view-tabs {
  display: flex; justify-content: center; gap: 2px; min-width: 0;
  button { flex: 1; min-width: 0; height: 22px; padding: 0 12px; border: 0; border-radius: 5px; background: transparent; color: var(--text-secondary); font-size: 12px; font-weight: 500; white-space: nowrap; }
  button[aria-selected='true'] { background: var(--music-tab-accent); color: var(--music-accent-text); }
}
.music-content { min-height: 0; overflow: hidden; }
.music-view { position: absolute; inset: 0; min-width: 0; min-height: 0; overflow: hidden; border-radius: 8px; }
.music-view-enter-active, .music-view-leave-active { transition: opacity 180ms cubic-bezier(.23, 1, .32, 1); }
.music-view-enter-from, .music-view-leave-to { opacity: 0; }
.music-view-instant .music-view-enter-active, .music-view-instant .music-view-leave-active { transition: none; }
.music-content-message { display: flex; height: 100%; align-items: center; justify-content: center; flex-direction: column; gap: 4px; color: var(--text-secondary); font-size: 13px; }
.music-content-message button { min-height: 44px; padding: 0 12px; border: 0; background: transparent; color: var(--music-accent); }
.music-lyrics-view { display: flex; flex-direction: column; }
.music-lyrics-note { flex-shrink: 0; margin: 0 0 6px; text-align: center; color: var(--text-secondary); font-size: 11px; line-height: 18px; }
.music-lyrics { position: relative; flex: 1 1 0; min-width: 0; min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; padding: 8px 4px; }
.music-lyrics.is-synced { padding-block: 0; mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent); -webkit-mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent); }
.music-lyrics.is-synced::before, .music-lyrics.is-synced::after { content: ''; display: block; height: max(0px, calc(50% - 22px)); }
.music-lyric-line { display: block; width: 100%; max-width: 100%; min-height: 44px; box-sizing: border-box; padding: 9px 8px; border: 0; border-radius: 6px; background: transparent; text-align: center; white-space: normal; overflow-wrap: anywhere; text-wrap: pretty; font-size: 16px !important; font-weight: 500 !important; line-height: 1.6; color: var(--text-secondary) !important; }
.music-lyric-line.is-active { color: var(--music-accent) !important; font-weight: 700 !important; }
.music-lyric-plain { margin: 0; min-height: 0; padding-block: 6px; font-size: 14px !important; font-weight: 400 !important; }
.music-playlist { height: 100%; overflow-y: auto; overscroll-behavior: contain; list-style: none; padding: 2px 0; margin: 0; }
.music-playlist > li { min-width: 0; }
.music-lyrics, .music-playlist { scrollbar-width: none; &::-webkit-scrollbar { display: none; } }
.music-track {
  display: flex; min-width: 0; align-items: center; gap: 10px; width: 100%; height: 52px; text-align: left;
  padding: 7px 8px; border: 0; border-radius: 8px; background: transparent;
  &[aria-current='true'] { background: color-mix(in srgb, var(--music-tab-accent) 14%, transparent); }
}
.music-track-cover { position: relative; display: grid; place-items: center; flex: 0 0 36px; width: 36px; height: 36px; border-radius: 6px; overflow: hidden; background: var(--bg-soft); }
.music-track-cover img { display: block; width: 100%; height: 100%; object-fit: cover; }
.music-track-cover img[hidden] { display: none; }
.music-cover-fallback { font-size: 20px; color: var(--text-secondary); }
.music-track-copy { display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 2px; }
.music-track-copy strong, .music-track-copy > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.3; }
.music-track-copy strong { font-size: 13px; font-weight: 500; }
.music-track-copy > span { font-size: 11px; color: var(--text-secondary); }
.music-track-duration { flex-shrink: 0; color: var(--text-secondary); font-size: 11px; font-variant-numeric: tabular-nums; }
.music-equalizer { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 3px; background: rgba(15, 17, 25, .62); }
.music-equalizer i { display: block; width: 3px; height: 13px; border-radius: 2px; background: color-mix(in srgb, var(--brand-accent) 40%, #ffffff); transform-origin: center; animation: music-equalize 850ms ease-in-out infinite alternate; animation-play-state: paused; }
.music-equalizer i:nth-child(2) { height: 19px; animation-delay: -400ms; }
.music-equalizer i:nth-child(3) { height: 10px; animation-delay: -600ms; }
.music-equalizer.is-playing i { animation-play-state: running; }
.music-controls { min-width: 0; }
.music-feedback { height: 18px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-align: center; font-size: 11px; line-height: 18px; color: var(--text-secondary); }
.music-feedback button { padding: 0 4px; border: 0; background: transparent; color: var(--music-accent); }
.music-transport { display: grid; grid-template-columns: 44px 44px 52px 44px 44px; align-items: center; justify-content: space-between; margin-top: 2px; }
.music-main-play { width: 52px; height: 52px; flex-basis: 52px; :deep(svg) { width: 28px; height: 28px; } }
.music-shuffle[aria-pressed='true'] { color: var(--music-accent); }
.music-download { color: var(--text-secondary) !important; }
.music-download:disabled { opacity: .4; cursor: wait; }
.music-range {
  appearance: none; display: block; width: 100%; min-width: 0; height: 28px;
  margin: 0; padding: 0; border: 0; background: transparent; cursor: pointer;
  &::-webkit-slider-runnable-track { height: 2px; border: 0; border-radius: 0; background: linear-gradient(to right, var(--music-range-fill) var(--music-range-value), var(--music-range-track) var(--music-range-value)); }
  &::-webkit-slider-thumb { appearance: none; width: 2px; height: 10px; margin-top: -4px; border: 0; border-radius: 0; background: var(--text-primary); }
  &::-moz-range-track { height: 2px; border: 0; border-radius: 0; background: var(--music-range-track); }
  &::-moz-range-progress { height: 2px; border-radius: 0; background: var(--music-range-fill); }
  &::-moz-range-thumb { width: 2px; height: 10px; border: 0; border-radius: 0; background: var(--text-primary); }
}
.music-time { display: flex; justify-content: space-between; font-size: 11px; line-height: 14px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.music-volume { display: flex; align-items: center; gap: 12px; font-size: 11px; color: var(--text-secondary); span { flex-shrink: 0; } span:last-child { min-width: 30px; text-align: right; } }
.music-mini { display: none; }
@keyframes music-equalize { from { transform: scaleY(.45); } to { transform: scaleY(1); } }
@keyframes music-panel-enter { from { opacity: 0; transform: translateY(-5px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@media (hover: hover) and (pointer: fine) {
  .music-icon-button:hover { color: var(--music-accent); }
  .music-track:hover, button.music-lyric-line:hover { background: var(--bg-soft); }
  .music-view-tabs button:not([aria-selected='true']):hover { color: var(--text-primary); }
}
@media (max-width: 768px) {
  .music-panel {
    inset: auto 0 0; width: 100%; max-width: none; height: min(680px, 85dvh); max-height: 85dvh;
    border: 0; border-radius: 16px 16px 0 0; padding: 14px 24px max(20px, env(safe-area-inset-bottom));
    &[open] { animation-name: music-sheet-enter; }
  }
  .music-panel.music-instant { animation: none; }
  .music-range { height: 44px; }
  .music-mini {
    display: flex; align-items: center; gap: 4px; position: fixed; z-index: 350; inset: auto 0 0;
    padding: 10px 16px max(10px, env(safe-area-inset-bottom)); min-height: 70px;
    border-top: 1px solid var(--border-color);
  }
  .music-mini-progress { position: absolute; inset: -1px 0 auto; height: 2px; background: var(--border-color); overflow: hidden; span { display: block; width: 100%; height: 100%; background: var(--music-range-fill); transform-origin: left; } }
  .music-mini-details {
    display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; min-height: 44px; text-align: left;
    border: 0; padding: 0; background: transparent;
    > span { display: grid; min-width: 0; gap: 2px; }
    strong { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    span span { font-size: 11px; color: var(--text-secondary); }
  }
  @keyframes music-sheet-enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
}
@media (max-height: 620px) {
  .music-panel[open] { gap: 6px; }
  .music-current { flex-direction: row; gap: 12px; padding: 0 24px 0 0; }
  .music-current-icon { width: 48px; height: 48px; }
  .music-current-info { text-align: left; }
  .music-source-modes { gap: 2px; height: 30px; }
  .music-source-modes button { min-width: 44px; padding-inline: 4px; }
  .music-current h3 { font-size: 18px; }
  .music-range { height: 24px; }
}
@media (prefers-reduced-motion: reduce) {
  .music-panel[open], .music-equalizer i { animation: none; }
  .music-view-enter-active, .music-view-leave-active { transition: none; }
}
</style>

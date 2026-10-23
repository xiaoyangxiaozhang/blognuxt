<template>
  <Teleport v-if="music.currentTrack" to="body">
    <dialog
      id="site-music-panel"
      ref="dialog"
      class="music-panel"
      :class="{ 'music-instant': music.instant }"
      :style="{ '--music-top': `${music.panelPosition.top}px`, '--music-right': `${music.panelPosition.right}px` }"
      aria-label="音乐播放器"
      @cancel.prevent="music.closePanel()"
      @close="music.closePanel(false)"
      @click="handleBackdrop"
    >
      <button class="music-icon-button music-panel-close" type="button" aria-label="收起音乐面板" @click="music.closePanel()">
        <Cross1Icon aria-hidden="true" />
      </button>

      <div class="music-current">
        <VinylRecord class="music-current-icon" detailed :cover="music.currentTrack.cover" :playing="music.isPlaying && !music.isLoading" :instant="music.instant" />
        <div
          class="music-track-switcher"
          role="group"
          :aria-label="`歌曲与播放控制：${music.currentTrack.title}`"
          tabindex="0"
          @pointerdown.self="($event.currentTarget as HTMLElement).focus({ preventScroll: true })"
        >
          <div class="music-current-info">
            <h3>{{ music.currentTrack.title }}</h3>
            <p>{{ music.currentTrack.artist }}</p>
          </div>
          <div class="music-transport">
            <button class="music-icon-button" type="button" aria-label="上一首" @click="music.previous">
              <TrackPreviousIcon aria-hidden="true" />
            </button>
            <button
              ref="mainPlayButton"
              class="music-icon-button music-main-play"
              type="button"
              :aria-label="music.isPlaying || music.isLoading ? '暂停音乐' : '播放音乐'"
              @click="music.togglePlayback"
            >
              <PlayIcon :active="music.isPlaying || music.isLoading" :instant="music.instant" aria-hidden="true" />
            </button>
            <button class="music-icon-button" type="button" aria-label="下一首" @click="music.next">
              <TrackNextIcon aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <input
        class="music-range"
        type="range"
        aria-label="播放进度"
        :aria-valuetext="`${formatMusicTime(displayedTime)} / ${formatMusicTime(music.duration)}`"
        :max="music.duration"
        :value="displayedTime"
        :style="{ '--music-range-value': `${displayedProgress}%` }"
        min="0"
        step="0.1"
        @input="previewProgress"
        @change="commitProgress"
        @pointercancel="progressPreviewTime = null"
        @blur="progressPreviewTime = null"
      >
      <div class="music-time"><span>{{ formatMusicTime(displayedTime) }}</span><span>{{ formatMusicTime(music.duration) }}</span></div>
      <p v-if="music.isLoading" class="music-status" role="status">正在加载伴奏…</p>

      <div v-if="music.error" class="music-error" role="alert">
        <p>{{ music.error }}</p>
        <button type="button" @click="music.play">重试播放</button>
      </div>

      <label class="music-volume">
        <span>音量</span>
        <input class="music-range" type="range" aria-label="音乐音量" min="0" max="100" :value="Math.round(music.volume * 100)" :style="{ '--music-range-value': `${Math.round(music.volume * 100)}%` }" @input="music.setVolume(Number(($event.target as HTMLInputElement).value) / 100)">
        <span>{{ Math.round(music.volume * 100) }}%</span>
      </label>

      <ul class="music-playlist" aria-label="伴奏歌单">
        <li v-for="(track, index) in music.tracks" :key="track.id">
          <button
            class="music-track"
            type="button"
            :aria-current="index === music.currentIndex ? 'true' : undefined"
            :aria-label="`播放${track.title}`"
            @click="music.selectTrack(index)"
          >
            <span>{{ track.title }}</span>
            <PlayIcon v-if="index === music.currentIndex && music.isPlaying" active instant aria-hidden="true" />
            <span v-if="track.duration" class="music-track-duration">{{ formatMusicTime(track.duration) }}</span>
          </button>
          <button
            v-if="downloadEnabled"
            class="music-icon-button music-download"
            type="button"
            :disabled="!!downloadingId"
            :aria-label="`下载${track.title}伴奏`"
            :aria-busy="downloadingId === track.id"
            :title="downloadingId === track.id ? '正在准备下载' : '下载伴奏'"
            @click="downloadTrack(track)"
          ><DownloadIcon instant aria-hidden="true" /></button>
        </li>
      </ul>
      <p v-if="downloadingId" class="music-download-status" role="status">正在准备下载…</p>
      <p v-if="downloadError" class="music-error" role="alert">{{ downloadError }}</p>
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
import { Cross1Icon, DownloadIcon, PlayIcon, TrackNextIcon, TrackPreviousIcon } from '~/utils/siteIcons'
import { formatMusicTime, type MusicTrack } from '~/data/music'
import { useMusicPlayerStore } from '~/stores/music'
import { useSiteOverlays } from '~/composables/useSiteOverlays'
import { useBlogSettings } from '~/composables/useBlogSettings'

const music = useMusicPlayerStore()
const { settings } = useBlogSettings()
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

async function downloadTrack(track: MusicTrack) {
  if (!downloadEnabled.value || downloadingId.value) return
  downloadingId.value = track.id
  downloadError.value = ''
  try {
    const file = await api<Blob>(`/music/${encodeURIComponent(track.id)}/download`, {
      responseType: 'blob', timeout: 120_000, retry: 0
    })
    if (!file.size || file.type.includes('json')) throw new Error('Invalid audio response')
    const extension = new URL(track.src, window.location.href).pathname.match(/\.(mp3|wav|ogg|aac|flac|m4a|opus|aiff)$/i)?.[0] || '.mp3'
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

watch(() => music.panelOpen, async open => {
  await nextTick()
  const panel = dialog.value
  if (!panel) return
  if (!open) {
    progressPreviewTime.value = null
    panel.close()
    releaseScroll()
    return
  }
  if (mobileQuery.matches) {
    previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    panel.showModal()
  } else {
    panel.show()
  }
  if (music.instant) mainPlayButton.value?.focus({ preventScroll: true })
})

watch(() => route.fullPath, () => music.closePanel(false))
watch([feedbackOpen, accountOpen, subscribeOpen], values => {
  if (values.some(Boolean)) music.closePanel(false)
})

function handleBackdrop(event: MouseEvent) {
  const rect = dialog.value!.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) music.closePanel()
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
  music.initialize()
  mobileQuery = window.matchMedia('(max-width: 768px)')
  document.addEventListener('pointerdown', handleOutside)
  document.addEventListener('keydown', handleEscape)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  music.closePanel(false)
  releaseScroll()
  document.removeEventListener('pointerdown', handleOutside)
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.music-panel, .music-mini {
  --music-accent: color-mix(in srgb, var(--brand-accent) 40%, var(--text-primary));
  --music-range-fill: color-mix(in srgb, var(--text-primary) 92%, transparent);
  --music-range-track: color-mix(in srgb, var(--text-primary) 32%, transparent);
  color: var(--text-primary); background: var(--bg-panel-solid); font: inherit;
  button { color: inherit; font: inherit; cursor: pointer; }
  button:focus-visible, input:focus-visible { outline: 2px solid var(--music-accent); outline-offset: 3px; }
  button:active { opacity: .7; }
}
.music-panel {
  position: fixed; z-index: 500; inset: var(--music-top) var(--music-right) auto auto;
  width: 340px; max-width: calc(100vw - 32px); max-height: calc(100dvh - var(--music-top) - 16px);
  margin: 0; padding: 14px 20px 16px; border: 1px solid var(--border-color); border-radius: 16px;
  box-shadow: 0 16px 42px var(--shadow-color); overflow-y: auto; overscroll-behavior: contain;
  &[open] { animation: music-panel-enter 180ms cubic-bezier(.23, 1, .32, 1); }
  &.music-instant { animation: none; }
  &::backdrop { background: var(--overlay-strong); }
}
.music-panel-close { position: absolute; top: 8px; right: 8px; }
.music-icon-button {
  display: inline-flex; align-items: center; justify-content: center; flex: 0 0 44px;
  width: 44px; height: 44px; border: 0; border-radius: 50%; padding: 0; background: transparent;
  :deep(svg) { width: 20px; height: 20px; }
}
.music-current { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 4px 0; }
.music-current-icon { width: 112px; height: 112px; flex-shrink: 0; }
.music-track-switcher {
  position: relative; width: 100%; height: 80px; flex-shrink: 0;
  &:focus-visible { outline: 2px solid var(--music-accent); outline-offset: 3px; border-radius: 8px; }
  &:focus-within {
    .music-current-info { opacity: 0; transform: translateY(-8px) scale(.985); }
    .music-transport { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
  }
  &:focus-visible, &:has(:focus-visible) {
    .music-current-info, .music-transport { transition: none; }
  }
}
.music-current-info {
  position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center;
  min-width: 0; text-align: center; pointer-events: none; opacity: 1; transform: translateY(0) scale(1);
  transition: opacity 150ms ease-out, transform 220ms cubic-bezier(.23, 1, .32, 1);
}
.music-current h3 { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; margin: 0; font-size: 22px; font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
.music-current p { margin: 4px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
.music-transport {
  position: absolute; inset: 0; display: grid; grid-template-columns: 44px 52px 44px; align-items: center; gap: 20px;
  width: max-content; height: 52px; margin: auto; opacity: 0; transform: translateY(10px) scale(.97); pointer-events: none;
  transition: opacity 180ms ease-out, transform 260ms cubic-bezier(.23, 1, .32, 1);
}
.music-main-play { width: 52px; height: 52px; flex-basis: 52px; :deep(svg) { width: 28px; height: 28px; } }
.music-range {
  appearance: none; display: block; width: 100%; height: 32px;
  margin: 0; padding: 0; border: 0; background: transparent; cursor: pointer;
  &::-webkit-slider-runnable-track {
    height: 2px; border: 0; border-radius: 0;
    background: linear-gradient(to right, var(--music-range-fill) var(--music-range-value), var(--music-range-track) var(--music-range-value));
  }
  &::-webkit-slider-thumb {
    appearance: none; width: 2px; height: 10px; margin-top: -4px;
    border: 0; border-radius: 0; background: var(--text-primary);
  }
  &::-moz-range-track { height: 2px; border: 0; border-radius: 0; background: var(--music-range-track); }
  &::-moz-range-progress { height: 2px; border-radius: 0; background: var(--music-range-fill); }
  &::-moz-range-thumb { width: 2px; height: 10px; border: 0; border-radius: 0; background: var(--text-primary); }
}
.music-time { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.music-status { margin: 8px 0 0; text-align: center; font-size: 12px; color: var(--text-secondary); }
.music-volume { display: flex; align-items: center; gap: 12px; margin-top: 10px; font-size: 12px; color: var(--text-secondary); span { flex-shrink: 0; } span:last-child { min-width: 30px; text-align: right; } }
.music-error { margin-top: 12px; font-size: 13px; p { margin: 0; } button { min-height: 44px; border: 0; background: transparent; color: var(--music-accent); } }
.music-playlist { max-height: 228px; overflow-y: auto; overscroll-behavior: contain; list-style: none; padding: 8px 0 0; margin: 16px 0 0; border-top: 1px solid var(--border-color); }
.music-panel, .music-playlist {
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
.music-playlist > li { display: flex; align-items: center; gap: 2px; }
.music-panel .music-download { color: var(--text-secondary); }
.music-download:disabled { opacity: .4; cursor: wait; }
.music-download-status { margin: 10px 0 0; font-size: 12px; color: var(--text-secondary); }
.music-track {
  display: flex; flex: 1; min-width: 0; align-items: center; gap: 12px; width: 100%; min-height: 44px; text-align: left;
  padding: 0 10px; border: 0; border-radius: 8px; background: transparent; font-size: 14px !important;
  &[aria-current='true'] { color: var(--music-accent); background: var(--bg-soft); }
  > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  :deep(svg) { width: 14px; height: 14px; flex-shrink: 0; margin-left: auto; }
}
.music-track-duration { flex-shrink: 0; margin-left: auto; color: var(--text-secondary); font-size: 11px; font-variant-numeric: tabular-nums; }
.music-track :deep(svg) + .music-track-duration { margin-left: 0; }
.music-mini { display: none; }
@keyframes music-panel-enter { from { opacity: 0; transform: translateY(-5px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@media (hover: hover) and (pointer: fine) {
  .music-track-switcher:hover {
    .music-current-info { opacity: 0; transform: translateY(-8px) scale(.985); }
    .music-transport { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
  }
  .music-icon-button:hover { color: var(--music-accent); }
  .music-track:hover { background: var(--bg-soft); }
}
@media (max-width: 768px) {
  .music-panel {
    inset: auto 0 0; width: 100%; max-width: none; max-height: 85dvh;
    border: 0; border-radius: 16px 16px 0 0; padding: 14px 24px max(20px, env(safe-area-inset-bottom));
    &[open] { animation-name: music-sheet-enter; }
  }
  .music-panel.music-instant { animation: none; }
  .music-current-icon { width: 96px; height: 96px; }
  .music-playlist { max-height: 28dvh; }
  .music-volume { display: none; }
  .music-range { min-height: 44px; }
  .music-mini {
    display: flex; align-items: center; gap: 4px; position: fixed; z-index: 350; inset: auto 0 0;
    padding: 10px 16px max(10px, env(safe-area-inset-bottom)); min-height: 70px;
    border-top: 1px solid var(--border-color);
  }
  .music-mini-progress { position: absolute; inset: -1px 0 auto; height: 2px; background: var(--border-color); overflow: hidden; span { display: block; width: 100%; height: 100%; background: var(--music-range-fill); transform-origin: left; } }
  .music-mini-details {
    display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; min-height: 44px; text-align: left;
    border: 0; padding: 0; background: transparent;
    > svg { width: 24px; height: 24px; flex-shrink: 0; }
    > span { display: grid; min-width: 0; gap: 2px; }
    strong { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    span span { font-size: 11px; color: var(--text-secondary); }
  }
  @keyframes music-sheet-enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
}
@media (prefers-reduced-motion: reduce) {
  .music-panel[open] { animation: none; }
  .music-current-info, .music-transport { transition: none; }
}
</style>

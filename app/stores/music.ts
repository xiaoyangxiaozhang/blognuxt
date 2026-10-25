import { computed, onScopeDispose, ref } from 'vue'
import { defineStore } from 'pinia'
import { musicTracks, type MusicTrack } from '../data/music.ts'

const STORAGE_KEY = 'blog-music-player'

export const useMusicPlayerStore = defineStore('music-player', () => {
  const currentIndex = ref(0)
  const tracks = ref<readonly MusicTrack[]>(musicTracks)
  const currentTrack = computed(() => tracks.value[currentIndex.value])
  const currentTime = ref(0)
  const duration = ref(currentTrack.value?.duration || 0)
  const volume = ref(0.3)
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const hasStarted = ref(false)
  const error = ref('')
  const panelOpen = ref(false)
  const panelView = ref<'lyrics' | 'songs'>('lyrics')
  const shuffle = ref(false)
  const panelPosition = ref({ top: 72, right: 20 })
  const instant = ref(false)
  const progress = computed(() => duration.value > 0 ? Math.min(100, currentTime.value / duration.value * 100) : 0)

  let audio: HTMLAudioElement | null = null
  let loadedTrackId = ''
  let pendingSeek: number | null = null
  let initialized = false
  let wantsToPlay = false
  let playAttempt = 0
  let lastSavedAt = 0
  let trigger: HTMLElement | null = null
  let unplayedTrackIds: string[] = []
  let shuffleHistory: string[] = []
  let shuffleHistoryIndex = 0
  const listeners: [string, EventListener][] = []

  function save() {
    if (!initialized || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        trackId: currentTrack.value?.id, currentTime: currentTime.value, volume: volume.value, shuffle: shuffle.value
      }))
      lastSavedAt = Date.now()
    } catch { /* 播放不依赖浏览器存储权限。 */ }
  }

  function initialize() {
    if (initialized || typeof window === 'undefined') return
    initialized = true
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
      if (!saved || typeof saved !== 'object') return
      const index = tracks.value.findIndex(track => track.id === saved.trackId)
      if (index >= 0) {
        currentIndex.value = index
        duration.value = currentTrack.value?.duration || 0
        if (Number.isFinite(saved.currentTime)) currentTime.value = Math.max(0, duration.value > 0 ? Math.min(saved.currentTime, duration.value - 1) : saved.currentTime)
      }
      if (Number.isFinite(saved.volume)) volume.value = Math.max(0, Math.min(1, saved.volume))
      shuffle.value = saved.shuffle === true
      resetShuffle()
    } catch { /* 无效或不可访问的偏好使用默认值，刷新后始终等待主动播放。 */ }
  }

  function updateMediaSession() {
    if (typeof navigator === 'undefined' || !navigator.mediaSession) return
    try {
      if (typeof MediaMetadata !== 'undefined' && currentTrack.value) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.value.title, artist: currentTrack.value.artist, album: '阅读伴奏',
          artwork: currentTrack.value.cover ? [{ src: currentTrack.value.cover }] : []
        })
      } else if (!currentTrack.value) {
        navigator.mediaSession.metadata = null
      }
      navigator.mediaSession.playbackState = isPlaying.value ? 'playing' : 'paused'
    } catch { /* 未实现媒体会话的浏览器继续使用页面控件。 */ }
  }

  function fail(message: string) {
    wantsToPlay = false
    isPlaying.value = false
    isLoading.value = false
    error.value = message
    updateMediaSession()
  }

  function ensureAudio() {
    if (!currentTrack.value) throw new Error('歌单为空')
    if (!audio) {
      audio = new Audio()
      audio.preload = 'none'
      const on = (type: string, handler: EventListener) => {
        const currentHandler: EventListener = event => {
          const track = currentTrack.value
          if (!track || loadedTrackId !== track.id ||
            audio?.currentSrc !== new URL(track.src, window.location.href).href) return
          handler(event)
        }
        listeners.push([type, currentHandler])
        audio!.addEventListener(type, currentHandler)
      }
      on('loadedmetadata', () => {
        if (Number.isFinite(audio!.duration) && audio!.duration > 0) duration.value = audio!.duration
        if (pendingSeek !== null && pendingSeek > 0) audio!.currentTime = Math.min(pendingSeek, duration.value - 0.1)
        pendingSeek = null
      })
      on('durationchange', () => {
        if (Number.isFinite(audio!.duration) && audio!.duration > 0) duration.value = audio!.duration
      })
      on('timeupdate', () => {
        if (pendingSeek !== null) return
        if (Number.isFinite(audio!.currentTime)) currentTime.value = audio!.currentTime
        if (Date.now() - lastSavedAt > 5000) save()
      })
      on('playing', () => {
        if (!wantsToPlay) return
        isPlaying.value = true
        hasStarted.value = true
        isLoading.value = false
        error.value = ''
        updateMediaSession()
        save()
      })
      on('waiting', () => { if (wantsToPlay) isLoading.value = true })
      on('pause', () => {
        isPlaying.value = false
        if (!wantsToPlay) isLoading.value = false
        updateMediaSession()
        save()
      })
      on('ended', () => { if (wantsToPlay) next() })
      on('error', () => { if (audio?.error) fail('这首伴奏暂时无法播放，请重试或换一首。') })
      if (typeof navigator !== 'undefined' && navigator.mediaSession) {
        for (const [action, handler] of [
          ['play', play], ['pause', pause], ['previoustrack', previous], ['nexttrack', next],
          ['seekto', (details: MediaSessionActionDetails) => { if (details.seekTime !== undefined) seek(details.seekTime) }]
        ] as [MediaSessionAction, MediaSessionActionHandler][]) {
          try { navigator.mediaSession.setActionHandler(action, handler) } catch { /* 按浏览器能力启用。 */ }
        }
      }
    }
    if (loadedTrackId !== currentTrack.value.id || audio.error) {
      loadedTrackId = currentTrack.value.id
      pendingSeek = currentTime.value
      audio.src = currentTrack.value.src
      audio.load()
    }
    audio.volume = volume.value
    return audio
  }

  async function play() {
    if (typeof window === 'undefined' || !currentTrack.value) return
    initialize()
    const attempt = ++playAttempt
    wantsToPlay = true
    isLoading.value = true
    error.value = ''
    try {
      await ensureAudio().play()
      if (attempt === playAttempt && wantsToPlay) {
        isPlaying.value = true
        hasStarted.value = true
        isLoading.value = false
        updateMediaSession()
        save()
      }
    } catch (cause) {
      if (attempt !== playAttempt || !wantsToPlay) return
      fail(cause instanceof Error && cause.name === 'NotAllowedError'
        ? '浏览器暂停了播放，请再点一次播放。'
        : '这首伴奏暂时无法播放，请重试或换一首。')
    }
  }

  function pause() {
    wantsToPlay = false
    ++playAttempt
    audio?.pause()
    isPlaying.value = false
    isLoading.value = false
    save()
    updateMediaSession()
  }

  function togglePlayback(event?: MouseEvent) {
    instant.value = event?.detail === 0
    if (wantsToPlay || isPlaying.value) pause()
    else void play()
  }

  function changeTrack(index: number, restart = false) {
    if (!Number.isInteger(index) || index < 0 || index >= tracks.value.length) return
    initialize()
    if (!restart && currentIndex.value === index && (isPlaying.value || isLoading.value)) return
    if (restart || currentIndex.value !== index) {
      ++playAttempt
      audio?.pause()
      if (restart && currentIndex.value === index && audio && audio.readyState > 0) audio.currentTime = 0
      currentIndex.value = index
      currentTime.value = 0
      duration.value = currentTrack.value?.duration || 0
      isPlaying.value = false
    }
    save()
    void play()
  }

  function resetShuffle() {
    unplayedTrackIds = tracks.value.filter(track => track.id !== currentTrack.value?.id).map(track => track.id)
    shuffleHistory = currentTrack.value ? [currentTrack.value.id] : []
    shuffleHistoryIndex = 0
  }

  function rememberShuffleTrack(id: string) {
    shuffleHistory = shuffleHistory.slice(0, shuffleHistoryIndex + 1)
    shuffleHistory.push(id)
    // 最多保留一百首回退记录，长时间播放不持续累积历史。
    if (shuffleHistory.length > 100) shuffleHistory.shift()
    shuffleHistoryIndex = shuffleHistory.length - 1
    unplayedTrackIds = unplayedTrackIds.filter(trackId => trackId !== id)
  }

  function toggleShuffle() {
    initialize()
    shuffle.value = !shuffle.value
    resetShuffle()
    save()
  }

  function selectTrack(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= tracks.value.length) return
    initialize()
    if (shuffle.value && currentIndex.value !== index) rememberShuffleTrack(tracks.value[index]!.id)
    changeTrack(index)
  }

  function next() {
    initialize()
    const count = tracks.value.length
    if (!count) return
    if (!shuffle.value || count === 1) {
      changeTrack((currentIndex.value + 1) % count, true)
      return
    }
    if (shuffleHistoryIndex < shuffleHistory.length - 1) {
      const id = shuffleHistory[++shuffleHistoryIndex]
      changeTrack(tracks.value.findIndex(track => track.id === id), true)
      return
    }
    if (!unplayedTrackIds.length) unplayedTrackIds = tracks.value.filter(track => track.id !== currentTrack.value?.id).map(track => track.id)
    const id = unplayedTrackIds[Math.floor(Math.random() * unplayedTrackIds.length)]!
    rememberShuffleTrack(id)
    changeTrack(tracks.value.findIndex(track => track.id === id), true)
  }

  function previous() {
    initialize()
    if (!tracks.value.length) return
    if (!shuffle.value) {
      changeTrack((currentIndex.value + tracks.value.length - 1) % tracks.value.length, true)
      return
    }
    if (shuffleHistoryIndex > 0) shuffleHistoryIndex--
    const id = shuffleHistory[shuffleHistoryIndex] || currentTrack.value!.id
    changeTrack(tracks.value.findIndex(track => track.id === id), true)
  }

  function setPlaylist(playlist: readonly MusicTrack[]) {
    const previousTrack = currentTrack.value
    const index = playlist.findIndex(track => track.id === previousTrack?.id && track.src === previousTrack.src)
    if (index < 0) {
      pause()
      loadedTrackId = ''
      pendingSeek = null
      audio?.removeAttribute('src')
      audio?.load()
    }
    tracks.value = playlist
    currentIndex.value = Math.max(0, index)
    resetShuffle()
    if (index < 0) {
      currentTime.value = 0
      duration.value = currentTrack.value?.duration || 0
      error.value = ''
    }
    if (!playlist.length) {
      hasStarted.value = false
      closePanel(false)
    }
    updateMediaSession()
    save()
  }

  function seek(seconds: number) {
    if (!Number.isFinite(seconds)) return
    currentTime.value = Math.max(0, Math.min(seconds, duration.value))
    if (audio && audio.readyState > 0) audio.currentTime = currentTime.value
    else if (audio) pendingSeek = currentTime.value
    save()
  }

  function setVolume(value: number) {
    if (!Number.isFinite(value)) return
    volume.value = Math.max(0, Math.min(1, value))
    if (audio) audio.volume = volume.value
    save()
  }

  function openPanel(event: MouseEvent) {
    initialize()
    instant.value = event.detail === 0
    trigger = event.currentTarget as HTMLElement
    const rect = trigger.getBoundingClientRect()
    panelPosition.value = { top: rect.bottom + 12, right: Math.max(16, Math.min(window.innerWidth - rect.right, window.innerWidth - 356)) }
    panelOpen.value = true
  }

  function closePanel(restoreFocus = true) {
    panelOpen.value = false
    if (restoreFocus) queueMicrotask(() => {
      if (trigger?.isConnected && trigger.getClientRects().length) trigger.focus({ preventScroll: true })
    })
  }

  onScopeDispose(() => {
    save()
    wantsToPlay = false
    ++playAttempt
    if (audio) {
      for (const [type, handler] of listeners) audio.removeEventListener(type, handler)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
  })

  return {
    tracks, currentTrack, currentIndex, currentTime, duration, volume,
    isPlaying, isLoading, hasStarted, error, progress, panelOpen, panelView, shuffle, panelPosition, instant,
    initialize, setPlaylist, play, pause, togglePlayback, toggleShuffle, selectTrack, next, previous, seek, setVolume, openPanel, closePanel
  }
})

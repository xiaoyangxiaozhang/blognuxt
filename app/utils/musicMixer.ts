import type { MusicSource } from '../data/music'

// 两路原文件按需流式播放，避免把整首音频解码到内存；音量变化只调整增益。
export class StreamingMusicMixer {
  private context: AudioContext
  private instrumental = new Audio()
  private vocal = new Audio()
  private instrumentalGain: GainNode
  private vocalGain: GainNode
  private master: GainNode
  private sources: string[] = []
  private generation = 0
  private wanted = false
  private starting = false
  private stalled = false
  private targetTime = 0
  private masterVolume = .3
  private lastCorrection = 0

  constructor(private events: {
    time: (time: number, duration: number) => void
    playing: () => void
    waiting: () => void
    ended: () => void
    error: () => void
  }) {
    const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Context) throw new Error('当前浏览器不支持混音，请选择单独音源。')
    this.context = new Context()
    this.instrumentalGain = this.context.createGain()
    this.vocalGain = this.context.createGain()
    this.master = this.context.createGain()
    this.master.gain.value = 0
    const limiter = this.context.createDynamicsCompressor()
    limiter.threshold.value = -1
    limiter.knee.value = 0
    limiter.ratio.value = 20
    this.master.connect(limiter).connect(this.context.destination)
    for (const [index, element] of [this.instrumental, this.vocal].entries()) {
      element.preload = 'none'
      element.crossOrigin = 'anonymous'
      this.context.createMediaElementSource(element).connect(index === 0 ? this.instrumentalGain : this.vocalGain).connect(this.master)
      const current = () => element.currentSrc === this.sources[index]
      element.addEventListener('loadedmetadata', () => { if (current()) this.position(element, this.targetTime) })
      element.addEventListener('error', () => { if (current() && element.error) this.events.error() })
      element.addEventListener('waiting', () => {
        if (!current() || !this.wanted || this.starting || this.stalled) return
        this.targetTime = this.currentTime
        this.stalled = true
        this.pauseElements()
        this.gain(this.master, 0)
        this.events.waiting()
      })
      element.addEventListener('canplay', () => {
        if (!current() || !this.wanted || !this.stalled || this.instrumental.readyState < 3 || this.vocal.readyState < 3) return
        void this.play(this.targetTime).catch(() => { if (this.wanted) this.events.error() })
      })
    }
    this.instrumental.addEventListener('timeupdate', () => {
      if (!this.wanted || this.starting || this.stalled) return
      const time = this.currentTime
      if (Date.now() - this.lastCorrection > 1000 && Math.abs(this.vocal.currentTime - time) > .045) {
        this.position(this.vocal, time)
        this.lastCorrection = Date.now()
      }
      this.events.time(time, this.instrumental.duration)
    })
    this.instrumental.addEventListener('ended', () => { if (this.wanted) { this.pause(); this.events.ended() } })
  }

  get currentTime() { return this.instrumental.currentTime }

  load(instrumental: MusicSource, vocal: MusicSource) {
    const sources = [instrumental.src, vocal.src].map(src => new URL(src, window.location.href).href)
    if (sources.every((src, index) => src === this.sources[index]) && !this.instrumental.error && !this.vocal.error) return
    this.pause()
    this.sources = sources
    this.targetTime = 0
    for (const [index, element] of [this.instrumental, this.vocal].entries()) {
      element.src = sources[index]!
      element.load()
    }
  }

  async play(time: number) {
    const generation = ++this.generation
    this.wanted = true
    this.starting = true
    this.stalled = false
    this.targetTime = time
    this.gain(this.master, 0)
    this.seek(time)
    // 三个调用均在用户手势内发起，兼容移动浏览器的音频权限。
    await Promise.all([this.context.resume(), this.instrumental.play(), this.vocal.play()])
    if (generation !== this.generation || !this.wanted) return
    this.position(this.vocal, this.currentTime)
    this.starting = false
    this.gain(this.master, this.masterVolume)
    this.events.playing()
  }

  pause() {
    ++this.generation
    this.wanted = false
    this.starting = false
    this.stalled = false
    this.pauseElements()
    this.gain(this.master, 0)
  }

  seek(time: number) {
    this.targetTime = time
    this.position(this.instrumental, time)
    this.position(this.vocal, time)
  }

  setLevels(master: number, instrumental: number, vocal: number) {
    this.masterVolume = master
    this.gain(this.instrumentalGain, instrumental)
    this.gain(this.vocalGain, vocal)
    if (this.wanted && !this.starting && !this.stalled) this.gain(this.master, master)
  }

  clear() {
    this.pause()
    this.sources = []
    for (const element of [this.instrumental, this.vocal]) { element.removeAttribute('src'); element.load() }
    void this.context.suspend().catch(() => {})
  }

  dispose() { this.clear(); void this.context.close().catch(() => {}) }

  private pauseElements() { this.instrumental.pause(); this.vocal.pause() }
  private position(element: HTMLAudioElement, time: number) {
    if (element.readyState && Number.isFinite(element.duration) && Math.abs(element.currentTime - time) > .015) element.currentTime = Math.max(0, Math.min(time, Math.max(0, element.duration - .05)))
  }
  private gain(node: GainNode, value: number) { node.gain.setTargetAtTime(value, this.context.currentTime, .02) }
}

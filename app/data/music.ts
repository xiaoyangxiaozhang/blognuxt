export interface MusicTrack {
  id: string
  title: string
  artist: string
  src: string
  cover?: string
  duration: number
}

// 网页副本来自本地已完成的伴奏，原始音轨保留在音乐目录。
export const musicTracks: readonly MusicTrack[] = [
  { id: 'sunny-day', title: '晴天', artist: '周杰伦 · 伴奏', src: '/music/sunny-day.mp3', cover: '/music/covers/ye-hui-mei.jpg', duration: 269.8 },
  { id: 'seven-mile-fragrance', title: '七里香', artist: '周杰伦 · 伴奏', src: '/music/seven-mile-fragrance.mp3', cover: '/music/covers/qi-li-xiang.jpg', duration: 297.3 },
  { id: 'rice-fragrance', title: '稻香', artist: '周杰伦 · 伴奏', src: '/music/rice-fragrance.mp3', cover: '/music/covers/capricorn.jpg', duration: 223.5 },
  { id: 'simple-love', title: '简单爱', artist: '周杰伦 · 伴奏', src: '/music/simple-love.mp3', cover: '/music/covers/fantasy.jpg', duration: 271.0 },
  { id: 'starry-mood', title: '星晴', artist: '周杰伦 · 伴奏', src: '/music/starry-mood.mp3', cover: '/music/covers/jay.jpg', duration: 259.5 },
  { id: 'silence', title: '安静', artist: '周杰伦 · 伴奏', src: '/music/silence.mp3', cover: '/music/covers/fantasy.jpg', duration: 334.3 },
  { id: 'black-humor', title: '黑色幽默', artist: '周杰伦 · 伴奏', src: '/music/black-humor.mp3', cover: '/music/covers/jay.jpg', duration: 283.2 },
  { id: 'tornado', title: '龙卷风', artist: '周杰伦 · 伴奏', src: '/music/tornado.mp3', cover: '/music/covers/jay.jpg', duration: 250.9 },
  { id: 'red-dust-inn', title: '红尘客栈', artist: '周杰伦 · 伴奏', src: '/music/red-dust-inn.mp3', cover: '/music/covers/opus-12.jpg', duration: 274.1 },
  { id: 'cannot-speak', title: '开不了口', artist: '周杰伦 · 伴奏', src: '/music/cannot-speak.mp3', cover: '/music/covers/fantasy.jpg', duration: 285.0 }
]

export const parseMusicPlaylist = (value: string | undefined): readonly MusicTrack[] => {
  // 旧后端尚无配置项时兼容内置伴奏；显式空数组始终保持关闭。
  if (value === undefined) return musicTracks
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    const ids = new Set<string>()
    return parsed.slice(0, 100).filter((track): track is MusicTrack => {
      if (!track || typeof track !== 'object' || typeof track.id !== 'string' || !track.id.trim() || ids.has(track.id) ||
        typeof track.title !== 'string' || !track.title.trim() || typeof track.artist !== 'string' ||
        typeof track.src !== 'string' || !isMusicSource(track.src)) return false
      ids.add(track.id)
      return true
    }).map(track => ({
      ...track,
      cover: typeof track.cover === 'string' && isMusicSource(track.cover) ? track.cover : undefined,
      duration: Number.isFinite(track.duration) && track.duration > 0 ? track.duration : 0
    }))
  } catch { return [] }
}

const isMusicSource = (src: string) => {
  if (!src || src.trim() !== src || /[\\\u0000-\u001f\u007f]/.test(src)) return false
  if (src.startsWith('/') && !src.startsWith('//')) return true
  try {
    const url = new URL(src)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
  } catch { return false }
}

export const formatMusicTime = (seconds: number) => {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}

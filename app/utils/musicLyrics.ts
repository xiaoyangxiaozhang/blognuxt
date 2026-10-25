import type { MusicTrack } from '../data/music'

export interface MusicLyricLine { time: number | null; text: string }

export function parseMusicLyrics(text: string): MusicLyricLine[] {
  const timed: MusicLyricLine[] = []
  const plain: MusicLyricLine[] = []
  const offset = Number(text.match(/\[offset:\s*(-?\d+)\]/i)?.[1] || 0) / 1000
  for (const source of text.replace(/\r/g, '').split('\n')) {
    const stamps = [...source.matchAll(/\[(\d+):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)]
    const content = source.replace(/\[[^\]]*\]/g, '').trim()
    if (!content) continue
    if (!stamps.length) { plain.push({ time: null, text: content }); continue }
    for (const stamp of stamps) {
      const seconds = Number(stamp[2]!.replace(':', '.'))
      if (seconds < 60) timed.push({ time: Math.max(0, Number(stamp[1]) * 60 + seconds - offset), text: content })
    }
  }
  return timed.length ? timed.sort((a, b) => a.time! - b.time!) : plain
}

// 只用明确的歌曲元信息匹配，不使用模糊搜索结果替代当前曲目。
export async function matchSyncedLyrics(track: MusicTrack, signal: AbortSignal): Promise<MusicLyricLine[]> {
  const artist = track.artist.split(/[·•|]/)[0]!.trim()
  const title = track.title.replace(/(?:[_\s-]*伴奏|[（(]伴奏[）)])$/g, '').trim()
  const query = new URLSearchParams({ artist_name: artist, track_name: title })
  if (track.duration > 0) query.set('duration', String(Math.round(track.duration)))
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal.aborted) return []
  signal.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, 7000)
  try {
    const response = await fetch(`https://lrclib.net/api/get?${query}`, { signal: controller.signal, credentials: 'omit' })
    if (!response.ok) return []
    const result = await response.json()
    if (typeof result.syncedLyrics !== 'string' || result.syncedLyrics.length > 256 * 1024 ||
      (track.duration > 0 && Math.abs(Number(result.duration) - track.duration) > 3)) return []
    const lines = parseMusicLyrics(result.syncedLyrics)
    return lines.some(line => line.time !== null) ? lines : []
  } catch { return [] }
  finally { clearTimeout(timeout); signal.removeEventListener('abort', abort) }
}

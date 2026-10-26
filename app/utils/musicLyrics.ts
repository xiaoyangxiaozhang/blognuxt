export interface MusicLyricLine { time: number | null; text: string }

export function parseMusicLyrics(text: string, offsetMS = 0): MusicLyricLine[] {
  const timed: MusicLyricLine[] = []
  const plain: MusicLyricLine[] = []
  const offset = Number(text.match(/\[offset:\s*(-?\d+)\]/i)?.[1] || 0) / 1000
  const adjustment = Number.isFinite(offsetMS) ? Math.max(-120000, Math.min(120000, offsetMS)) / 1000 : 0
  for (const source of text.replace(/\r/g, '').split('\n')) {
    const stamps = [...source.matchAll(/\[(\d+):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)]
    const content = source.replace(/\[[^\]]*\]/g, '').trim()
    if (!content) continue
    if (!stamps.length) { plain.push({ time: null, text: content }); continue }
    for (const stamp of stamps) {
      const seconds = Number(stamp[2]!.replace(':', '.'))
      if (seconds < 60) timed.push({ time: Math.max(0, Number(stamp[1]) * 60 + seconds - offset + adjustment), text: content })
    }
  }
  return timed.length ? timed.sort((a, b) => a.time! - b.time!) : plain
}

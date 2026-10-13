type ImageResult = { contentType: string; body: Buffer }
type CacheEntry = { image: ImageResult; expiresAt: number }

// ponytail: bounded per-worker memory cache; use shared storage if workers need to share results.
export class ImageProxyCache {
  private entries = new Map<string, CacheEntry>()
  private pending = new Map<string, Promise<ImageResult>>()
  private bytes = 0
  private maxBytes: number
  private maxEntries: number

  constructor(maxBytes = 64 * 1024 * 1024, maxEntries = 256) {
    this.maxBytes = maxBytes
    this.maxEntries = maxEntries
  }

  private remove(key: string) {
    const entry = this.entries.get(key)
    if (entry) this.bytes -= entry.image.body.length
    this.entries.delete(key)
  }

  async get(key: string, load: () => Promise<ImageResult>, maxAge = 3600) {
    const entry = this.entries.get(key)
    if (entry && entry.expiresAt > Date.now()) {
      this.entries.delete(key)
      this.entries.set(key, entry)
      return { image: entry.image, status: 'HIT' }
    }
    this.remove(key)

    const pending = this.pending.get(key)
    if (pending) return { image: await pending, status: 'COALESCED' }

    const promise = load().then(image => {
      if (image.body.length <= this.maxBytes) {
        for (const [expiredKey, value] of this.entries) {
          if (value.expiresAt <= Date.now()) this.remove(expiredKey)
        }
        while (this.entries.size && (this.bytes + image.body.length > this.maxBytes || this.entries.size >= this.maxEntries)) {
          this.remove(this.entries.keys().next().value!)
        }
        this.entries.set(key, { image, expiresAt: Date.now() + maxAge * 1000 })
        this.bytes += image.body.length
      }
      return image
    })
    this.pending.set(key, promise)
    try {
      return { image: await promise, status: 'MISS' }
    } finally {
      this.pending.delete(key)
    }
  }
}

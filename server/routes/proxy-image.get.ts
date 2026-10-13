import { fetchPublicImage, resizePublicImage, validateImageURL } from '../utils/imageProxy'
import { ImageProxyCache } from '../utils/imageCache'

const allowedWidths = new Set([128, 256, 320, 384, 480, 640, 768, 960, 1280, 1920])
const imageCache = new ImageProxyCache()

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const source = validateImageURL(query.url)
  source.hash = ''
  const widthValue = query.width === undefined ? '' : String(query.width)
  const width = widthValue ? Number(widthValue) : 0
  if (widthValue && (!Number.isInteger(width) || !allowedWidths.has(width) || query.format !== 'webp')) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported image variant' })
  }
  const signal = AbortSignal.timeout(10_000)
  const config = useRuntimeConfig(event)

  const resolveUploadFallback = async () => {
    if (!source.pathname.startsWith('/uploads/')) return ''
    const configuredBase = String(config.public.uploadBase || '').trim()
    if (configuredBase) return configuredBase.replace(/\/+$/, '') + source.pathname + source.search

    const apiBase = String(config.public.apiBase || '').replace(/\/+$/, '')
    if (!apiBase) return ''
    // API base comes from server configuration, never the request's Host header.
    const settings = await $fetch<{ data?: Record<string, unknown> }>(apiBase + '/settings/basic', { signal, retry: 0 })
    const avatar = settings.data?.['basic.author_avatar']
    if (typeof avatar !== 'string' || !avatar.trim()) return ''
    const assetOrigin = validateImageURL(avatar).origin
    return assetOrigin === source.origin ? '' : assetOrigin + source.pathname + source.search
  }

  try {
    const uploaded = source.pathname.startsWith('/uploads/')
    const key = JSON.stringify(['webp-v2', source.href, width, config.public.uploadBase, config.public.apiBase])
    const { image: result, status } = await imageCache.get(key, async () => {
      let image
      try {
        image = await fetchPublicImage(source.href, signal)
      } catch (error: any) {
        // Invalid targets and non-image responses must not enter the compatibility fallback.
        if ([400, 403, 413, 415].includes(error.statusCode)) throw error
        const fallback = await resolveUploadFallback()
        if (!fallback) throw error
        image = await fetchPublicImage(fallback, signal)
      }
      return width ? await resizePublicImage(image, width) : image
    }, uploaded ? 86400 : 3600)

    setHeader(event, 'Content-Type', result.contentType)
    setHeader(event, 'X-Image-Cache', status)
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    // SVG remains usable, with active content disabled when opened as a document.
    setHeader(event, 'Content-Security-Policy', "default-src 'none'; sandbox")
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    setHeader(event, 'Cache-Control', uploaded && width
      ? 'public, max-age=31536000, immutable'
      : `public, max-age=${uploaded ? 604800 : 3600}`)
    return result.body
  } catch (error: any) {
    if ([400, 403, 413, 415].includes(error.statusCode)) throw error
    throw createError({
      statusCode: signal.aborted ? 504 : 502,
      statusMessage: signal.aborted ? 'Image request timed out' : 'Image upstream unavailable'
    })
  }
})

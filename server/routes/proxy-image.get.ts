import { fetchPublicImage, validateImageURL } from '../utils/imageProxy'

export default defineEventHandler(async (event) => {
  const source = validateImageURL(getQuery(event).url)
  const signal = AbortSignal.timeout(10_000)

  const resolveUploadFallback = async () => {
    if (!source.pathname.startsWith('/uploads/')) return ''
    const config = useRuntimeConfig(event)
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
    setHeader(event, 'Content-Type', image.contentType)
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    // SVG remains usable, with active content disabled when opened as a document.
    setHeader(event, 'Content-Security-Policy', "default-src 'none'; sandbox")
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    setHeader(event, 'Cache-Control', 'public, max-age=604800, immutable')
    return image.body
  } catch (error: any) {
    if ([400, 403, 413, 415].includes(error.statusCode)) throw error
    throw createError({
      statusCode: signal.aborted ? 504 : 502,
      statusMessage: signal.aborted ? 'Image request timed out' : 'Image upstream unavailable'
    })
  }
})

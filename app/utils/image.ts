const responsiveWidths = new Set([128, 256, 320, 384, 480, 640, 768, 960, 1280, 1920])

const getProxySource = (value: string, allowExternal = false) => {
  if (value.startsWith('/proxy-image?')) {
    try {
      const source = new URL(value, 'https://blog.invalid').searchParams.get('url')
      return source && /^https?:\/\//i.test(source) ? source : ''
    } catch {
      return ''
    }
  }

  try {
    const source = new URL(value)
    const isUploadedFile = source.pathname.startsWith('/uploads/')
    return ['http:', 'https:'].includes(source.protocol) && !source.username && !source.password && (allowExternal || source.protocol === 'http:' || isUploadedFile)
      ? source.href
      : ''
  } catch {
    return ''
  }
}

export const proxyImageUrl = (url?: string | null, width?: number): string => {
  const normalizedUrl = url?.trim() || ''

  if (!normalizedUrl || !/^https?:\/\//i.test(normalizedUrl)) {
    if (!width || !normalizedUrl.startsWith('/proxy-image?')) return normalizedUrl
  }

  const source = getProxySource(normalizedUrl, Boolean(width))
  if (!source) return normalizedUrl

  const params = new URLSearchParams()
  if (width && responsiveWidths.has(width)) {
    params.set('width', String(width))
    params.set('format', 'webp')
    params.set('v', '2')
  }
  // Keep the variant before url: reverse proxies may use the raw query as their cache key.
  params.set('url', source)

  return `/proxy-image?${params.toString()}`
}

export const proxyImageSrcSet = (url: string, widths: number[]) => {
  if (!getProxySource(url, true)) return undefined
  return widths
    .filter(width => responsiveWidths.has(width))
    .map(width => `${proxyImageUrl(url, width)} ${width}w`)
    .join(', ')
}

export const originalImageUrl = (url: string): string => {
  const source = getProxySource(url, true)
  return proxyImageUrl(source || url)
}

export const optimizedImageAttrs = (
  url?: string | null,
  widths: number[] = [320, 640, 960, 1280],
  sizes = '(max-width: 765px) calc(100vw - 48px), 800px'
) => {
  const source = url?.trim() || ''
  const allowed = widths.filter(width => responsiveWidths.has(width))
  const srcset = proxyImageSrcSet(source, allowed)
  return {
    src: proxyImageUrl(source, allowed.at(-1)),
    srcset,
    sizes: srcset ? sizes : undefined,
    decoding: 'async' as const,
    'data-original-src': srcset ? originalImageUrl(source) : undefined
  }
}

/** Used by the capture listener as well as detached image preloads. Retry the source once. */
export const restoreOriginalImage = (image: HTMLImageElement): boolean => {
  const sources = image.parentElement?.tagName === 'PICTURE'
    ? image.parentElement.querySelectorAll('source[srcset]')
    : []
  const original = image.getAttribute('data-original-src') || (sources.length ? image.getAttribute('src') : null)
  if (!original) return false
  image.removeAttribute('data-original-src')
  image.removeAttribute('srcset')
  image.removeAttribute('sizes')
  // A picture source wins over img.src until its candidates are removed.
  for (const source of sources) source.removeAttribute('srcset')
  image.src = original
  return true
}

export const proxyHtmlImages = (html?: string | null): string => {
  return html || ''
}

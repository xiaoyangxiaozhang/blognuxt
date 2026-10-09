const responsiveWidths = new Set([128, 256, 320, 384, 480, 640, 768, 960, 1280, 1920])

const getProxySource = (value: string) => {
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
    return ['http:', 'https:'].includes(source.protocol) && (source.protocol === 'http:' || isUploadedFile)
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

  const source = getProxySource(normalizedUrl)
  if (!source) return normalizedUrl

  const params = new URLSearchParams({ url: source })
  if (width && responsiveWidths.has(width)) {
    params.set('width', String(width))
    params.set('format', 'webp')
  }

  return `/proxy-image?${params.toString()}`
}

export const proxyImageSrcSet = (url: string, widths: number[]) => {
  if (!getProxySource(url)) return undefined
  return widths
    .filter(width => responsiveWidths.has(width))
    .map(width => `${proxyImageUrl(url, width)} ${width}w`)
    .join(', ')
}

export const proxyHtmlImages = (html?: string | null): string => {
  return html || ''
}

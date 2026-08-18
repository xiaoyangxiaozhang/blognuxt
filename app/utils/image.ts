export const proxyImageUrl = (url?: string | null): string => {
  const normalizedUrl = url?.trim() || ''

  if (!normalizedUrl || !/^http:\/\//i.test(normalizedUrl)) {
    return normalizedUrl
  }

  return `/proxy-image?url=${encodeURIComponent(normalizedUrl)}`
}

export const proxyHtmlImages = (html?: string | null): string => {
  return html || ''
}

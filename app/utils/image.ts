export const proxyImageUrl = (url?: string | null): string => {
  const normalizedUrl = url?.trim() || ''

  if (!normalizedUrl || !/^https?:\/\//i.test(normalizedUrl)) {
    return normalizedUrl
  }

  // 本地上传文件可能暂时仍保存为主站域名，统一交给服务端代理兼容旧地址。
  let isUploadedFile = false
  try {
    isUploadedFile = new URL(normalizedUrl).pathname.startsWith('/uploads/')
  } catch {
    return normalizedUrl
  }
  if (!/^http:\/\//i.test(normalizedUrl) && !isUploadedFile) {
    return normalizedUrl
  }

  return `/proxy-image?url=${encodeURIComponent(normalizedUrl)}`
}

export const proxyHtmlImages = (html?: string | null): string => {
  return html || ''
}

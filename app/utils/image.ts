/**
 * 直接返回原 URL，不做任何代理处理
 * 浏览器 <img> 标签可以正常加载跨域图片（仅控制台警告，不影响显示）
 */

export const proxyImageUrl = (url?: string | null): string => {
  return url || ''
}

export const proxyHtmlImages = (html?: string | null): string => {
  return html || ''
}

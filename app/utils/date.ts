/**
 * 统一格式化站内日期，避免浏览器 locale 输出斜杠或短横线格式。
 */
export const formatDate = (value?: string | null) => {
  if (!value) return ''

  const normalized = value.trim().replace('T', ' ').replace(/-/g, '/')
  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) return value

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

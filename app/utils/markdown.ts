import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true
})

/**
 * 将文章 Markdown 转为安全的 HTML。
 * html: false 会把原始 HTML 当作文本处理，避免 v-html 直接执行接口返回的标签。
 */
export const renderMarkdown = (content?: string | null) => {
  if (!content?.trim()) return ''
  return markdown.render(content)
}

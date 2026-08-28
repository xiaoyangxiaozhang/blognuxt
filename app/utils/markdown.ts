import MarkdownIt from 'markdown-it'

export interface MarkdownHeading {
  id: string
  level: number
  text: string
}

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

const headingText = (token: MarkdownIt.Token) => {
  return (token.children || [])
    .filter((child) => ['text', 'code_inline', 'emoji'].includes(child.type))
    .map((child) => child.content)
    .join('')
    .trim()
}

const createHeadingId = (text: string, index: number, usedIds: Set<string>) => {
  const base = text
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, '-')
    .replace(/^-+|-+$/g, '') || `section-${index + 1}`

  let id = base
  let suffix = 2
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }

  usedIds.add(id)
  return id
}

/** 渲染文章并为标题生成目录所需的稳定锚点。 */
export const renderArticleMarkdown = (content?: string | null) => {
  if (!content?.trim()) {
    return { html: '', headings: [] as MarkdownHeading[] }
  }

  const tokens = markdown.parse(content, {})
  const headings: MarkdownHeading[] = []
  const usedIds = new Set<string>()
  let headingIndex = 0

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type !== 'heading_open') {
      continue
    }

    const level = Number(token.tag.slice(1))
    const inlineToken = tokens[index + 1]
    const text = inlineToken?.type === 'inline' ? headingText(inlineToken) : ''
    const id = createHeadingId(text, headingIndex, usedIds)
    token.attrSet('id', id)
    headings.push({ id, level, text: text || `第 ${headingIndex + 1} 节` })
    headingIndex += 1
  }

  return {
    html: markdown.renderer.render(tokens, markdown.options, {}),
    headings
  }
}

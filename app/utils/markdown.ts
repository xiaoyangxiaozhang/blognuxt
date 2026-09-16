import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/common'

export interface MarkdownHeading {
  id: string
  level: number
  text: string
}

export type MarkdownBlockType =
  | 'heading'
  | 'paragraph'
  | 'blockquote'
  | 'list'
  | 'code'
  | 'table'
  | 'image'
  | 'hr'
  | 'other'

export interface MarkdownBlock {
  key: string
  type: MarkdownBlockType
  html: string
  text: string
  headingId?: string
}

const languageAliases: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  vue: 'xml',
  html: 'xml',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml'
}

const normalizeLanguage = (info: string) => {
  const rawLanguage = info.trim().split(/\s+/)[0]?.toLowerCase() || ''
  return languageAliases[rawLanguage] || rawLanguage
}

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true
})

markdown.renderer.rules.fence = (tokens, index) => {
  const token = tokens[index]
  if (!token) return ''

  const rawLanguage = token.info.trim().split(/\s+/)[0] || ''
  const language = normalizeLanguage(token.info)
  const canHighlight = Boolean(language && hljs.getLanguage(language))
  let highlightedCode = markdown.utils.escapeHtml(token.content)

  if (canHighlight) {
    try {
      highlightedCode = hljs.highlight(token.content, {
        language,
        ignoreIllegals: true
      }).value
    } catch {
      // 高亮失败时保留转义后的原始代码。
    }
  }

  const languageClass = language
    ? ` language-${markdown.utils.escapeHtml(language)}`
    : ''
  const displayLanguage = rawLanguage || 'text'

  return `<div class="code-block-container"><div class="code-toolbar"><span class="code-lang">${markdown.utils.escapeHtml(displayLanguage.toUpperCase())}</span></div><pre><code class="hljs${languageClass}">${highlightedCode}</code></pre></div>`
}

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

const getBlockType = (token: MarkdownIt.Token): MarkdownBlockType => {
  if (token.type === 'heading_open') return 'heading'
  if (token.type === 'paragraph_open') return 'paragraph'
  if (token.type === 'blockquote_open') return 'blockquote'
  if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') return 'list'
  if (token.type === 'fence' || token.type === 'code_block') return 'code'
  if (token.type === 'table_open') return 'table'
  if (token.type === 'hr') return 'hr'
  if (token.type === 'image') return 'image'
  return 'other'
}

const getBlockText = (tokens: MarkdownIt.Token[]) =>
  tokens
    .filter((token) => ['inline', 'fence', 'code_block', 'text'].includes(token.type))
    .map((token) => token.content)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

const renderMarkdownBlocks = (tokens: MarkdownIt.Token[]): MarkdownBlock[] => {
  const blocks: MarkdownBlock[] = []
  let currentTokens: MarkdownIt.Token[] = []
  let currentRoot: MarkdownIt.Token | null = null
  let depth = 0
  let blockIndex = 0

  const pushBlock = () => {
    if (!currentRoot || !currentTokens.length) return

    const sourceLine = currentRoot.map?.[0]
    blocks.push({
      key: `block-${sourceLine ?? blockIndex}-${currentRoot.type}`,
      type: getBlockType(currentRoot),
      html: markdown.renderer.render(currentTokens, markdown.options, {}),
      text: getBlockText(currentTokens),
      headingId: currentRoot.type === 'heading_open' ? currentRoot.attrGet('id') || undefined : undefined
    })
    blockIndex += 1
    currentTokens = []
    currentRoot = null
    depth = 0
  }

  for (const token of tokens) {
    const isOpening = token.type.endsWith('_open')
    const isClosing = token.type.endsWith('_close')

    if (!currentRoot && token.level === 0 && (isOpening || token.type === 'hr' || token.type === 'fence' || token.type === 'code_block')) {
      currentRoot = token
      currentTokens = [token]
      depth = isOpening ? 1 : 0
      if (!isOpening) pushBlock()
      continue
    }

    if (!currentRoot) continue

    currentTokens.push(token)
    if (isOpening) depth += 1
    if (isClosing) depth -= 1
    if (depth === 0) pushBlock()
  }

  pushBlock()
  return blocks
}

/** 渲染文章并为标题生成目录所需的稳定锚点。 */
export const renderArticleMarkdown = (content?: string | null) => {
  if (!content?.trim()) {
    return { html: '', headings: [] as MarkdownHeading[], blocks: [] as MarkdownBlock[] }
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
    headings,
    blocks: renderMarkdownBlocks(tokens)
  }
}

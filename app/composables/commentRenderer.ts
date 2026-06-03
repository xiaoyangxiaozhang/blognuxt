export interface CommentRenderBlockText {
  type: 'text'
  content: string
}

export interface CommentRenderBlockImage {
  type: 'image'
  src: string
}

export type CommentRenderBlock = CommentRenderBlockText | CommentRenderBlockImage

const IMAGE_PATTERN = /!\[[^\]]*]\(([^)\s]+)\)/g

export const extractCommentImageUrls = (content: string) => {
  const urls: string[] = []

  for (const match of content.matchAll(IMAGE_PATTERN)) {
    const url = match[1]?.trim()
    if (url) {
      urls.push(url)
    }
  }

  return urls
}

export const renderCommentContent = (content: string) => {
  if (!content.trim()) {
    return []
  }

  const blocks: CommentRenderBlock[] = []
  let cursor = 0

  for (const match of content.matchAll(IMAGE_PATTERN)) {
    const full = match[0]
    const src = match[1]?.trim()
    const start = match.index ?? 0

    if (start > cursor) {
      const text = content.slice(cursor, start).trim()
      if (text) {
        blocks.push({ type: 'text', content: text })
      }
    }

    if (src) {
      blocks.push({ type: 'image', src: proxyImageUrl(src) })
    }

    cursor = start + full.length
  }

  const rest = content.slice(cursor).trim()
  if (rest) {
    blocks.push({ type: 'text', content: rest })
  }

  return blocks
}

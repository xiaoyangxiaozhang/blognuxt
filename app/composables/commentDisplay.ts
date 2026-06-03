import type { CommentListItem, CommentTargetType } from '~/composables/api/comments'

export interface CommentTargetConfig {
  targetType: CommentTargetType
  targetKey: string
}

export interface NormalizedCommentItem {
  id: number | string
  author: string
  avatar?: string
  content: string
  publishTime: string
  website?: string
  replyTo?: string
}

export const COMMENT_TARGETS = {
  dynamicPage: {
    targetType: 'page',
    targetKey: 'moment'
  },
  messagePage: {
    targetType: 'page',
    targetKey: 'message'
  }
} satisfies Record<string, CommentTargetConfig>

const fallbackAuthor = 'Anonymous Visitor'

const mapSingleComment = (item: CommentListItem, replyTo?: string): NormalizedCommentItem => {
  const author =
    item.user?.nickname ||
    item.nickname ||
    item.user_nickname ||
    fallbackAuthor

  const avatar =
    item.user?.avatar ||
    item.avatar ||
    item.user_avatar ||
    ''

  const website =
    item.user?.website ||
    item.website ||
    ''

  const publishTime =
    item.created_at ||
    item.publish_time ||
    item.createdAt ||
    ''

  return {
    id: item.id,
    author,
    avatar: proxyImageUrl(avatar) || undefined,
    content: item.content || '',
    publishTime,
    website: website || undefined,
    replyTo
  }
}

const flattenCommentTree = (items: CommentListItem[], replyTo?: string): NormalizedCommentItem[] => {
  return items.flatMap((item) => {
    const currentReplyTo =
      item.reply_user?.nickname ||
      item.reply_to_nickname ||
      item.parent?.user?.nickname ||
      item.parent?.nickname ||
      replyTo ||
      undefined

    const current = mapSingleComment(item, currentReplyTo)
    const replies = Array.isArray(item.replies)
      ? flattenCommentTree(item.replies, current.author)
      : []

    return [current, ...replies]
  })
}

export const normalizeCommentList = (items?: CommentListItem[] | null) => {
  return flattenCommentTree(items || [])
}

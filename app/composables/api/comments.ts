import { createApi } from '~/composables/api/createApi'
import type { PaginationData } from '~/composables/useApi'

const commentApi = createApi('/comments')

export type CommentTargetType = 'article' | 'page' | 'moment'

export interface CommentUserInfo {
  nickname?: string
  avatar?: string
}

export interface CommentListItem {
  id: number | string
  content: string
  nickname?: string
  email?: string
  website?: string
  avatar?: string
  created_at?: string
  createdAt?: string
  publish_time?: string
  user_nickname?: string
  user_avatar?: string
  reply_to_nickname?: string
  user?: CommentUserInfo
  parent?: {
    nickname?: string
    user?: CommentUserInfo
  }
}

export interface GetCommentListParams {
  target_type: CommentTargetType
  target_key: string
  page?: number
  page_size?: number
}

export interface CreateCommentPayload {
  target_type: CommentTargetType
  target_key: string
  content: string
  nickname?: string
  email?: string
  website?: string
  parent_id?: number
}

export const getCommentList = (params: GetCommentListParams) => {
  return commentApi.list<PaginationData<CommentListItem>>(params)
}

export const createComment = (body: CreateCommentPayload) => {
  return commentApi.create<CommentListItem>(body as Record<string, unknown>)
}

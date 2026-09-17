import { createApi } from '~/services/api/createApi'
import { apiDelete, apiPost } from '~/composables/useApi'
import type { PaginationData } from '~/types/api'
const momentApi = createApi('/moments')
export interface MomentContent {
  text: string
  images?: string[]
  location?: string
  tags?: string
}

export interface MomentLikeUser {
  id: number
  nickname: string
}

// 动态列表项
export interface MomentItem {
  id: number
  publish_time: string
  content: MomentContent
  is_publish: boolean
  like_count: number
  liked: boolean
  like_users: MomentLikeUser[]
}

export const getMomentList = (params?: Record<string, unknown>) => {
  return momentApi.list<PaginationData<MomentItem>>(params)
}

export interface MomentLikeResponse {
  like_count: number
  liked: boolean
  like_users: MomentLikeUser[]
}

export const setMomentLike = (momentId: number, liked: boolean) =>
  liked
    ? apiPost<MomentLikeResponse>(`/moments/${momentId}/like`)
    : apiDelete<MomentLikeResponse>(`/moments/${momentId}/like`)

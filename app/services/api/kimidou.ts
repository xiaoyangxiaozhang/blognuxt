import { apiDelete, apiGet, apiPost, apiPut } from '~/composables/useApi'
import type { PaginationData } from '~/types/api'
import type { MomentLikeUser } from '~/services/api/moments'

export interface KimidouMomentContent {
  text?: string
  images?: string[]
  location?: string
}

export interface KimidouMomentAuthor {
  id: number
  nickname: string
  avatar?: string
  badge?: string
}

export interface KimidouMomentItem {
  id: number
  content: KimidouMomentContent
  is_publish: boolean
  publish_time?: string
  author?: KimidouMomentAuthor
  like_count: number
  liked: boolean
  like_users: MomentLikeUser[]
}

export interface KimidouManagedMomentItem extends KimidouMomentItem {
  channel: 'site' | 'kimidou'
  user_id?: number
  deleted_at?: string
}

export interface KimidouMomentPayload {
  content: KimidouMomentContent
  is_publish: boolean
  publish_time?: string
}

export const getKimidouMomentList = (params?: Record<string, unknown>) =>
  apiGet<PaginationData<KimidouMomentItem>>('/kimidou/moments', { params })

export const getMyKimidouMoments = (params?: Record<string, unknown>) =>
  apiGet<PaginationData<KimidouManagedMomentItem>>('/admin/kimidou/moments', { params })

export const createKimidouMoment = (body: KimidouMomentPayload) =>
  apiPost<KimidouManagedMomentItem>('/admin/kimidou/moments', body)

export const updateKimidouMoment = (id: number, body: KimidouMomentPayload) =>
  apiPut<KimidouManagedMomentItem>(`/admin/kimidou/moments/${id}`, body)

export const deleteKimidouMoment = (id: number) =>
  apiDelete<null>(`/admin/kimidou/moments/${id}`)

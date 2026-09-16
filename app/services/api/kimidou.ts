import { apiGet } from '~/composables/useApi'
import type { PaginationData } from '~/types/api'

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
}

export const getKimidouMomentList = (params?: Record<string, unknown>) =>
  apiGet<PaginationData<KimidouMomentItem>>('/kimidou/moments', { params })

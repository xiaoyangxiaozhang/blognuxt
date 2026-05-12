import type { CategoryItem, TagItem } from '~/composables/useApi'
import { apiGet } from '~/composables/useApi'

export interface BasicSettingMap {
  [key: string]: string
}

export interface HomeUserProfile {
  basicSettings: BasicSettingMap
  authorName: string
  authorDesc: string
  authorAvatar: string
  totalArticles: number
  categories: CategoryItem[]
  tags: TagItem[]
}

export const getSettings = (group: string) => {
  return apiGet<BasicSettingMap>(`/settings/${group}`)
}

export const getBasicSettings = () => {
  return getSettings('basic')
}

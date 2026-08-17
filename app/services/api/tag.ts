import type { PaginationData, TagItem } from '~/types/api'
import { createApi } from './createApi'

const tagApi = createApi('/tags')

export const getTagList = (params?: Record<string, unknown>) => {
  return tagApi.list<PaginationData<TagItem>>(params)
}

import type { CategoryItem, PaginationData } from '~/types/api'
import { createApi } from './createApi'

const categoryApi = createApi('/categories')

export const getCategoryList = (params?: Record<string, unknown>) => {
  return categoryApi.list<PaginationData<CategoryItem>>(params)
}

import type { ArticleListItem, PaginationData } from '~/types/api'
import { createApi } from './createApi'

const articleApi = createApi('/articles')

export const getArticleList = (params?: Record<string, unknown>) => {
  return articleApi.list<PaginationData<ArticleListItem>>(params)
}

export const getArticleDetail = (slug: string, params?: Record<string, unknown>) => {
  return articleApi.detail<ArticleListItem>(slug, params)
}

// API 响应数据
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
// 分页数据
export interface PaginationData<T> {
  list: T[]
  total: number
  page: number
  page_size: number
}
// 文章列表项
export interface ArticleListItem {
  id: number
  slug?: string
  url?: string
  title: string
  cover: string
  publish_time: string
  category?: {
    name: string
    url?: string
  }
  tags?: Array<{
    name: string
    url?: string
  }>
}
// 分类项
export interface CategoryItem {
  id: number
  name: string
  slug: string
  count: number
  url?: string
}
// 标签项
export interface TagItem {
  id: number
  name: string
  slug: string
  count: number
  url?: string
}
// fetch 封装函数
export const useApi = () => {
  const config = useRuntimeConfig()

  return $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      // 非客户端环境，直接返回
      if (!import.meta.client) {
        return
      }

      const accessToken = localStorage.getItem('access_token')
      if (!accessToken) {
        return
      }

      const headers = new Headers(options.headers || {})
      headers.set('Authorization', `Bearer ${accessToken}`)
      options.headers = headers
    }
  })
}

export const apiGet = async <T>(url: string, options?: { params?: Record<string, unknown> }) => {
  const api = useApi()
  return api<ApiResponse<T>>(url, {
    method: 'GET',
    query: options?.params
  })
}

export const apiPost = async <T>(url: string, body?: Record<string, unknown>) => {
  const api = useApi()
  return api<ApiResponse<T>>(url, {
    method: 'POST',
    body
  })
}

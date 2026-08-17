import type { ApiResponse } from '~/types/api'
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

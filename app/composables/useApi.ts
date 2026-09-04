import type { ApiResponse } from '~/types/api'

const ACCESS_TOKEN_STATE = 'comment-auth-access-token'

let refreshPromise: Promise<string | null> | null = null

export const useAccessToken = () => useState<string | null>(ACCESS_TOKEN_STATE, () => null)

export const clearLegacyAuthStorage = () => {
  if (!import.meta.client) return

  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

const getApiBase = () => String(useRuntimeConfig().public.apiBase || '').replace(/\/+$/, '')

export const refreshAccessToken = async (): Promise<string | null> => {
  if (!import.meta.client) return null
  if (refreshPromise) return refreshPromise

  const accessToken = useAccessToken()
  const apiBase = getApiBase()

  refreshPromise = (async () => {
    clearLegacyAuthStorage()
    const response = await $fetch<ApiResponse<{ access_token?: string }>>(`${apiBase}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    })
    const token = response.data?.access_token
    if (!token) throw new Error('登录状态已失效。')
    accessToken.value = token
    return token
  })()
    .catch(() => {
      accessToken.value = null
      clearLegacyAuthStorage()
      return null
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

const getResponseStatus = (error: any) => error?.response?.status ?? error?.status

const isRefreshRequest = (url: string) => url.endsWith('/auth/refresh')

// fetch 封装函数
export const useApi = () => {
  const accessToken = useAccessToken()
  const fetcher = $fetch.create({
    baseURL: getApiBase(),
    credentials: 'include',
    onRequest({ options }) {
      if (!accessToken.value) return

      const headers = new Headers(options.headers || {})
      headers.set('Authorization', `Bearer ${accessToken.value}`)
      options.headers = headers
    }
  })

  return async <T>(url: string, options: Record<string, any> = {}): Promise<T> => {
    try {
      return await fetcher<T>(url, options)
    } catch (error) {
      if (getResponseStatus(error) !== 401 || options._authRetry || isRefreshRequest(url)) {
        throw error
      }

      const token = await refreshAccessToken()
      if (!token) throw error

      const headers = new Headers(options.headers || {})
      headers.set('Authorization', `Bearer ${token}`)
      return fetcher<T>(url, { ...options, _authRetry: true, headers })
    }
  }
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

export const apiPatch = async <T>(url: string, body?: Record<string, unknown>) => {
  const api = useApi()
  return api<ApiResponse<T>>(url, {
    method: 'PATCH',
    body
  })
}

export const apiPut = async <T>(url: string, body?: Record<string, unknown>) => {
  const api = useApi()
  return api<ApiResponse<T>>(url, {
    method: 'PUT',
    body
  })
}

export const apiDelete = async <T>(url: string, body?: Record<string, unknown>) => {
  const api = useApi()
  return api<ApiResponse<T>>(url, {
    method: 'DELETE',
    body
  })
}

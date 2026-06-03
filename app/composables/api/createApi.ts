import { apiGet, apiPost } from '~/composables/useApi'

export const createApi = (basePath: string) => {
  const get = <T>(path = '', params?: Record<string, unknown>) => {
    const normalizedPath = path || basePath
    return apiGet<T>(normalizedPath, { params })
  }

  const list = <T>(params?: Record<string, unknown>) => {
    return apiGet<T>(basePath, { params })
  }

  const detail = <T>(idOrSlug: string | number, params?: Record<string, unknown>) => {
    return apiGet<T>(`${basePath}/${idOrSlug}`, { params })
  }

  const create = <T>(body?: Record<string, unknown>) => {
    return apiPost<T>(basePath, body)
  }

  return {
    get,
    list,
    detail,
    create
  }
}

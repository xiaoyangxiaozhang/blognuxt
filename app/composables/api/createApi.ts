import { apiGet, apiPost } from '~/composables/useApi'

export const createApi = (basePath: string) => {
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
    list,
    detail,
    create
  }
}

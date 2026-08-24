import { getSettings } from '~/services/api/user'

export type BlogSettingMap = Record<string, string>

export const parseBlogJson = <T>(value: string | undefined, fallback: T): T => {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export const isVideoUrl = (value: string | undefined) => {
  const url = value?.trim() || ''
  return /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i.test(url)
}

export const useBlogSettings = () => {
  const { data, pending, error, refresh } = useAsyncData<BlogSettingMap>('site-blog-settings', async () => {
    const response = await getSettings('blog')
    return response.data || {}
  })

  const settings = computed(() => data.value || {})

  return {
    settings,
    pending,
    error,
    refresh
  }
}

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

const usePublicSettings = (group: 'blog' | 'basic') => {
  const { data, pending, error, refresh } = useAsyncData<BlogSettingMap>(`site-${group}-settings`, async () => {
    const response = await getSettings(group)
    return response.data || {}
  }, {
    dedupe: 'defer',
    getCachedData: (key, nuxtApp, context) => context.cause === 'initial'
      ? nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
      : undefined
  })

  const settings = computed(() => data.value || {})

  return {
    settings,
    pending,
    error,
    refresh
  }
}

export const useBlogSettings = () => usePublicSettings('blog')
export const useBasicSettings = () => usePublicSettings('basic')

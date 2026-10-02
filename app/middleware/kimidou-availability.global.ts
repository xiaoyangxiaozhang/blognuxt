import { getSettings } from '~/services/api/user'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path !== '/kimidou' && !to.path.startsWith('/kimidou/')) return

  try {
    const response = await getSettings('blog')
    if (response.data?.['blog.kimidou_enabled'] === 'true') return
  } catch {
    return abortNavigation(createError({ statusCode: 503, statusMessage: '社区状态暂时无法确认' }))
  }

  return abortNavigation(createError({ statusCode: 404, statusMessage: '页面不存在' }))
})

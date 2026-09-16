export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const imageUrl = query.url as string

  if (!imageUrl) {
    throw createError({ statusCode: 400, statusMessage: 'Missing url parameter' })
  }

  // 安全检查：只允许代理 http/https 图片
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid url' })
  }

  const fetchImage = (url: string) => $fetch.raw(url, {
    responseType: 'stream',
    headers: {
      // 模拟浏览器请求，避免部分服务器拒绝
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
    }
  })

  const resolveUploadFallback = async () => {
    const source = new URL(imageUrl)
    if (!source.pathname.startsWith('/uploads/')) {
      return ''
    }

    const config = useRuntimeConfig(event)
    const configuredBase = String(config.public.uploadBase || '').trim()
    if (configuredBase) {
      return `${configuredBase.replace(/\/+$/, '')}${source.pathname}${source.search}`
    }

    const apiBase = String(config.public.apiBase || '').trim()
    if (!apiBase) {
      return ''
    }

    const apiURL = new URL(`${apiBase.replace(/\/+$/, '')}/settings/basic`, getRequestURL(event)).toString()
    const settings = await $fetch<{ data?: Record<string, unknown> }>(apiURL)
    const authorAvatar = settings.data?.['basic.author_avatar']
    if (typeof authorAvatar !== 'string' || !authorAvatar.trim()) {
      return ''
    }

    const assetOrigin = new URL(authorAvatar).origin
    if (assetOrigin === source.origin) {
      return ''
    }
    return `${assetOrigin}${source.pathname}${source.search}`
  }

  let response
  let resolvedImageUrl = imageUrl
  try {
    response = await fetchImage(imageUrl)
  } catch (originalError: any) {
    try {
      const fallbackUrl = await resolveUploadFallback()
      if (!fallbackUrl) {
        throw originalError
      }
      resolvedImageUrl = fallbackUrl
      response = await fetchImage(fallbackUrl)
    } catch (fallbackError: any) {
      console.error(`[proxy-image] Failed to fetch: ${imageUrl}`, fallbackError.message)
      throw createError({ statusCode: 502, statusMessage: `Failed to fetch image: ${fallbackError.message}` })
    }
  }

  try {
    // 透传 Content-Type
    const contentType = response.headers.get('content-type')
    if (contentType) {
      setHeader(event, 'Content-Type', contentType)
    } else {
      setHeader(event, 'Content-Type', 'image/png')
    }

    // 设置 CORS 头（方便其他场景使用）
    setHeader(event, 'Access-Control-Allow-Origin', '*')

    // 强缓存 7 天
    setHeader(event, 'Cache-Control', 'public, max-age=604800, immutable')

    // 设置响应状态码
    setResponseStatus(event, response.status)

    return response.body
  } catch (err: any) {
    console.error(`[proxy-image] Failed to return: ${resolvedImageUrl}`, err.message)
    throw createError({ statusCode: 502, statusMessage: `Failed to fetch image: ${err.message}` })
  }
})

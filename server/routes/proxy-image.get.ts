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

  try {
    const response = await $fetch.raw(imageUrl, {
      responseType: 'stream',
      headers: {
        // 模拟浏览器请求，避免部分服务器拒绝
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
      }
    })

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
    console.error(`[proxy-image] Failed to fetch: ${imageUrl}`, err.message)
    throw createError({ statusCode: 502, statusMessage: `Failed to fetch image: ${err.message}` })
  }
})

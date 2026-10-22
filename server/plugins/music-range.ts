// Nitro 的生产静态响应未处理 Range，浏览器因此无法定位本地音频。
// 只裁切静态处理器已经读取的音频字节，不新增文件路径解析或读取。
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event, response) => {
    const body = response.body
    if (!['GET', 'HEAD'].includes(event.method) || !event.path.startsWith('/music/') ||
      getResponseStatus(event) !== 200 || !(body instanceof Uint8Array) ||
      !String(getResponseHeader(event, 'content-type')).startsWith('audio/') ||
      getResponseHeader(event, 'content-encoding')) return

    setResponseHeader(event, 'Accept-Ranges', 'bytes')
    if (event.method !== 'GET') return
    const range = /^bytes=(\d*)-(\d*)$/i.exec(getRequestHeader(event, 'range')?.trim() || '')
    // 无效或多段范围保持完整响应，不伪装成单段或 multipart 响应。
    if (!range || (!range[1] && !range[2])) return

    const ifRange = getRequestHeader(event, 'if-range')
    if (ifRange) {
      const modified = Date.parse(String(getResponseHeader(event, 'last-modified')))
      const validatorDate = Date.parse(ifRange)
      const dateMatches = !/^(?:W\/)?"/.test(ifRange) && Number.isFinite(validatorDate) && modified <= validatorDate
      if (ifRange !== getResponseHeader(event, 'etag') && !dateMatches) return
    }

    const size = body.byteLength
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]))
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) {
      setResponseStatus(event, 416)
      setResponseHeaders(event, { 'Content-Range': `bytes */${size}`, 'Content-Length': '0' })
      response.body = new Uint8Array()
      return
    }

    setResponseStatus(event, 206)
    setResponseHeaders(event, {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1)
    })
    response.body = body.subarray(start, end + 1)
  })
})

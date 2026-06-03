/**
 * 从图片 URL 提取主色调
 * 使用 Canvas API 采样像素，取平均色
 * 跨域图片通过 Nitro 代理路由中转（获取 CORS 头）以允许 canvas 读取像素
 */
export const getDominantColor = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!import.meta.client) {
      resolve('')
      return
    }

    // 对外部图片使用代理，确保 canvas 能读取像素
    const proxyUrl = imageUrl.startsWith('http')
      ? `/proxy-image?url=${encodeURIComponent(imageUrl)}`
      : imageUrl

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = proxyUrl

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 50
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve('')
          return
        }

        ctx.drawImage(img, 0, 0, size, size)
        const imageData = ctx.getImageData(0, 0, size, size)
        const data = imageData.data

        let r = 0; let g = 0; let b = 0
        const pixelCount = data.length / 4

        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
        }

        r = Math.round(r / pixelCount)
        g = Math.round(g / pixelCount)
        b = Math.round(b / pixelCount)

        resolve(`rgb(${r}, ${g}, ${b})`)
      } catch {
        resolve('')
      }
    }

    img.onerror = () => resolve('')
  })
}

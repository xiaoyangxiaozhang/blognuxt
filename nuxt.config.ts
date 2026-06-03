import Icons from 'unplugin-icons/vite'
import AutoImport from 'unplugin-auto-import/vite'

// 开发环境下代理图片请求（绕过 CORS）
// 服务端渲染/生产构建使用 Nitro server route: server/routes/proxy-image.get.ts
const devProxyPlugin = {
  name: 'dev-image-proxy',
  configureServer(server: any) {
    server.middlewares.use('/proxy-image', async (req: any, res: any, next: any) => {
      try {
        const searchParams = new URL(req.url, 'http://localhost:3000').searchParams
        const imageUrl = searchParams.get('url')
        if (!imageUrl) {
          res.statusCode = 400
          res.end('Missing url parameter')
          return
        }
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
          res.statusCode = 400
          res.end('Invalid url')
          return
        }

        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
          }
        })

        const contentType = response.headers.get('content-type') || 'image/png'
        res.setHeader('Content-Type', contentType)
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable')

        // Stream the response to avoid memory issues with large images
        const reader = response.body?.getReader()
        if (reader) {
          res.statusCode = response.status
          // stream polyfill — write chunks as they arrive
          const pump = async () => {
            while (true) {
              const { done, value } = await reader.read()
              if (done) { res.end(); break }
              res.write(new Uint8Array(value))
            }
          }
          pump().catch((err) => {
            console.error('[proxy-image] stream error:', err)
            if (!res.writableEnded) res.end()
          })
        } else {
          // Fallback for older Node.js
          res.statusCode = response.status
          res.end(new Uint8Array(await response.arrayBuffer()))
        }
      } catch (err: any) {
        console.error('[proxy-image] Failed:', err?.message || err)
        res.statusCode = 502
        res.end('Proxy failed')
      }
    })
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@element-plus/nuxt'],
  css: ['~/assets/css/main.scss'],
  runtimeConfig: {
    public: {
      apiBase: ''
    }
  },
vite: {
    plugins: [
      Icons({ compiler: 'vue3', autoInstall: true }),
      AutoImport({ imports: ['vue', 'vue-router', '@vueuse/core'] }),
      devProxyPlugin
    ]
  },
  app:{
    head:{
      title:'小羊嚣张'
    }
  }

})

import Icons from 'unplugin-icons/vite'

const apiProxyTarget = process.env.NUXT_API_PROXY_TARGET?.replace(/\/+$/, '')

// Nitro 的图片代理在开发和生产环境共用地址及响应校验。
const animatedIconsStylePlugin = {
  name: 'animated-icons-style-side-effects',
  transform(code: string, id: string) {
    // The package injects its animation CSS here but declares sideEffects: false.
    if (id.replace(/\\/g, '/').includes('/@svg-animated-icons/vue/dist/index.mjs')) {
      return { code, moduleSideEffects: true }
    }
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@element-plus/nuxt'],
  css: ['~/assets/css/main.scss'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080/api/v1',
      uploadBase: process.env.NUXT_PUBLIC_UPLOAD_BASE || '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://xiaoyangxiaozhang.xyz',
      analyticsEnabled: process.env.NUXT_PUBLIC_ANALYTICS_ENABLED
        ? process.env.NUXT_PUBLIC_ANALYTICS_ENABLED === 'true'
        : process.env.NODE_ENV !== 'development'
    }
  },
  routeRules: {
    '/_nuxt/**': {
      headers: { 'cache-control': 'public, max-age=31536000, immutable' }
    },
    ...(apiProxyTarget
      ? {
        '/api/v1/**': {
          proxy: {
            to: `${apiProxyTarget}/api/v1/**`,
            headers: { Origin: apiProxyTarget }
          }
        }
      }
      : {})
  },
vite: {
    plugins: [
      Icons({ compiler: 'vue3', autoInstall: true }),
      animatedIconsStylePlugin
    ]
  },
  app:{
    head:{
      title:'小羊嚣张'
    }
  }

})

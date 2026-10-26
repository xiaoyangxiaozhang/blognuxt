import Icons from 'unplugin-icons/vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const apiProxyTarget = process.env.NUXT_API_PROXY_TARGET?.replace(/\/+$/, '')
const browserTargets = ['safari13', 'ios13', 'chrome80', 'edge80', 'firefox78']

// Run before Nuxt's payload reviver and router, including their dependencies.
const browserCompatPlugin = {
  name: 'blog-browser-compat',
  enforce: 'pre' as const,
  applyToEnvironment: (environment: { name: string }) => environment.name === 'client',
  resolveId(source: string, importer?: string) {
    // Nuxt 4.5 hashes cache keys with BigInt, which Safari 13 cannot parse.
    if (source === 'fnv1a-64' && /\/nuxt\/dist\/app\/utils\/hash\.js$/.test(importer || '')) {
      return fileURLToPath(new URL('./app/compat/hash.js', import.meta.url))
    }
  },
  transform(code: string, id: string) {
    if (/\/nuxt\/dist\/app\/entry(?:\.async)?\.js$/.test(id.replace(/\\/g, '/'))) {
      return { code: `import '~/compat/browser';\n${code}`, map: null }
    }
  }
}

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
  // 音乐面板由用户首次展开时加载，避免SSR为动态组件生成提前下载提示。
  hooks: {
    'build:manifest': (manifest) => {
      for (const [id, asset] of Object.entries(manifest)) {
        if (id.replace(/\\/g, '/').includes('components/music/MusicPlayer.client.vue') || /(?:^|\/)MusicPlayer\.[^/]+\.css$/.test(asset.file || '')) {
          asset.prefetch = false
          asset.preload = false
          for (const css of asset.css || []) {
            if (manifest[css]) { manifest[css].prefetch = false; manifest[css].preload = false }
          }
        }
      }
    }
  },
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
    build: { target: browserTargets, cssTarget: browserTargets },
    plugins: [
      browserCompatPlugin,
      Icons({ compiler: 'vue3', autoInstall: true }),
      animatedIconsStylePlugin
    ]
  },
  app:{
    head:{
      title:'小羊嚣张',
      script: [{
        key: 'blog-startup-fallback',
        tagPriority: 'critical',
        innerHTML: readFileSync(new URL('./app/compat/startup-fallback.js', import.meta.url), 'utf8')
      }]
    }
  }

})

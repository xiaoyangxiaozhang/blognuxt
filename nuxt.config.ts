import Icons from 'unplugin-icons/vite'
import AutoImport from 'unplugin-auto-import/vite'
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
      AutoImport({ imports: ['vue', 'vue-router', '@vueuse/core'] })
    ]
  },
  app:{
    head:{
      title:'小羊嚣张'
    }
  }

})

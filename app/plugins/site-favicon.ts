import { useBlogSettings } from '~/composables/useBlogSettings'

export default defineNuxtPlugin(() => {
  const { settings } = useBlogSettings()

  useHead(() => ({
    link: [
      {
        rel: 'icon',
        type: /\.svg(?:$|[?#])/i.test(settings.value['blog.favicon'] || '') ? 'image/svg+xml' : 'image/png',
        href: settings.value['blog.favicon'] || '/favicon.png'
      }
    ]
  }))
})

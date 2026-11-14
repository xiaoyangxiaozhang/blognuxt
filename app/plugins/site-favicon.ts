import { resolveSiteLogo, useBlogSettings } from '~/composables/useBlogSettings'

export default defineNuxtPlugin(() => {
  const { settings } = useBlogSettings()

  useHead(() => ({
    link: [
      {
        rel: 'icon',
        type: /\.svg(?:$|[?#])/i.test(resolveSiteLogo(settings.value)) ? 'image/svg+xml' : undefined,
        href: resolveSiteLogo(settings.value)
      }
    ]
  }))
})

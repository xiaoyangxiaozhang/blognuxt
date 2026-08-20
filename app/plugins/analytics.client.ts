import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { collectPageView, type PageViewPayload } from '~/services/api/analytics'

type PrivacyNavigator = Navigator & {
  globalPrivacyControl?: boolean
}

const normalizePageUrl = (route: RouteLocationNormalizedLoaded) => {
  const [url = '/'] = route.fullPath.split('#')
  return url || '/'
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  if (String(config.public.analyticsEnabled).toLowerCase() !== 'true') {
    return
  }

  const privacyNavigator = navigator as PrivacyNavigator
  if (privacyNavigator.doNotTrack === '1' || privacyNavigator.globalPrivacyControl === true) {
    return
  }

  const router = useRouter()
  let lastTrackedUrl = ''

  const reportPageView = (route: RouteLocationNormalizedLoaded) => {
    const url = normalizePageUrl(route)
    if (url === lastTrackedUrl) {
      return
    }

    const previousUrl = lastTrackedUrl
    lastTrackedUrl = url

    requestAnimationFrame(() => {
      const payload: PageViewPayload = {
        url,
        hostname: window.location.hostname,
        referrer: previousUrl
          ? new URL(previousUrl, window.location.origin).href
          : document.referrer,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        title: document.title,
        timestamp: Math.floor(Date.now() / 1000),
        type: 'pageview'
      }

      void collectPageView(payload).catch((error) => {
        if (import.meta.dev) {
          console.warn('[analytics] pageview report failed', error)
        }
      })
    })
  }

  const removeAfterEach = router.afterEach((to, _from, failure) => {
    if (!failure) {
      reportPageView(to)
    }
  })

  nuxtApp.hook('app:mounted', () => {
    reportPageView(router.currentRoute.value)
  })

  nuxtApp.hook('app:beforeUnmount', () => {
    removeAfterEach()
  })
})

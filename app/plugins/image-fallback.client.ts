import { restoreOriginalImage } from '~/utils/image'

export default defineNuxtPlugin(nuxtApp => {
  // Image errors do not bubble. Capture covers both Vue templates and Markdown v-html.
  const onError = (event: Event) => {
    if (event.target instanceof HTMLImageElement && restoreOriginalImage(event.target)) {
      event.stopImmediatePropagation()
    }
  }
  document.addEventListener('error', onError, true)
  const restoreEarlyFailures = () => {
    document.querySelectorAll<HTMLImageElement>('img[data-original-src], picture img').forEach(image => {
      if (image.complete && !image.naturalWidth) restoreOriginalImage(image)
    })
  }
  nuxtApp.hook('app:mounted', restoreEarlyFailures)
  nuxtApp.hook('page:finish', restoreEarlyFailures)
  import.meta.hot?.dispose(() => document.removeEventListener('error', onError, true))
})

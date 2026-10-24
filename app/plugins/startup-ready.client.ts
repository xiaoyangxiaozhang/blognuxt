export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    // A failed initialization can still reach app:mounted with an empty root.
    if (!nuxtApp.payload.error) window.dispatchEvent(new Event('blog:ready'))
  })
})

export default defineNuxtPlugin(() => {
  useHead({
    link: [
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicon.png'
      }
    ]
  })
})

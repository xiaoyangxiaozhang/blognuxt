import { useCommentAuth } from '~/composables/useCommentAuth'

export default defineNuxtPlugin(async () => {
  await useCommentAuth().restoreSession()
})

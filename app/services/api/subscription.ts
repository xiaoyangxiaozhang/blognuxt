import { apiPost } from '~/composables/useApi'

export interface SubscribePayload {
  email: string
}

export const subscribeToUpdates = (body: SubscribePayload) => {
  return apiPost<null>('/subscribe', { ...body })
}

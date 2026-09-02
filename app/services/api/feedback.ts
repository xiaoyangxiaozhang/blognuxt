import { apiGet, apiPost } from '~/composables/useApi'

export type ReportType = 'copyright' | 'inappropriate' | 'summary' | 'suggestion'
export type FeedbackStatus = 'pending' | 'resolved' | 'closed'

export interface SubmitFeedbackPayload {
  reportUrl: string
  reportType: ReportType
  email?: string
  description: string
  reason?: string
  attachmentFiles?: string[]
}

export interface FeedbackContent {
  description: string
  reason?: string
  attachmentFiles?: string[]
}

export interface FeedbackResponse {
  id: number
  ticket_no: string
  report_url: string
  report_type: ReportType
  form_content: FeedbackContent
  email: string
  status: FeedbackStatus
  admin_reply: string
  reply_time?: string
  feedback_time: string
}

export const submitFeedback = (body: SubmitFeedbackPayload) => {
  return apiPost<FeedbackResponse>('/feedback', body)
}

export const getFeedbackByTicket = (ticketNo: string) => {
  return apiGet<FeedbackResponse>(`/feedback/ticket/${encodeURIComponent(ticketNo)}`)
}

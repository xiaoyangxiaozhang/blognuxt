import { apiGet, apiPatch, apiPost, refreshAccessToken, useAccessToken } from '~/composables/useApi'

export interface PublicChatbotConfig {
  enabled: boolean
  comment_tools_enabled: boolean
  display_name: string
  avatar: string
  welcome: string
  identity_notice: string
  suggestions: string[]
}

export interface ChatbotMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: ChatbotSource[]
  streaming?: boolean
  comments?: AgentCommentPage
  replyDraft?: AgentReplyDraft
}

export interface AgentComment {
  id: number
  content: string
  nickname: string
  created_at: string
  target_type: string
  target_key: string
  target_title: string
  url: string
}

export interface AgentCommentQuery {
  page: number
  page_size: number
  target_type: string
  target_key: string
}

export interface AgentCommentPage {
  items: AgentComment[]
  total: number
  page: number
  page_size: number
  query?: AgentCommentQuery
}

export interface AgentReplyDraft {
  id: string
  version: number
  status: 'pending' | 'published' | 'cancelled' | 'expired' | 'stale'
  content: string
  comment: AgentComment
  expires_at: string
  published_comment_id?: number
  published_url?: string
}

export type ChatbotAgentEvent =
  | { type: 'status'; data: { message: string } }
  | { type: 'comments'; data: AgentCommentPage }
  | { type: 'draft'; data: AgentReplyDraft }

export interface ChatbotSource {
  title: string
  slug: string
  url: string
}

export interface ChatbotResponse {
  reply: string
  sources: ChatbotSource[]
}

export interface ChatbotChatRequest {
  session_id: string
  message: string
  history: Array<Pick<ChatbotMessage, 'role' | 'content'>>
  page_context: {
    path: string
    article_slug: string
  }
  selected_comment_id?: number
  comment_ids?: number[]
  comment_query?: AgentCommentQuery
  draft_id?: string
}

export const getChatbotConfig = () => apiGet<PublicChatbotConfig>('/chatbot/config')

export const sendChatbotMessage = (body: ChatbotChatRequest) =>
  apiPost<ChatbotResponse>('/chatbot/chat', body as unknown as Record<string, unknown>)

const replyDraftPath = (id: string) => `/admin/chatbot/reply-drafts/${encodeURIComponent(id)}`
export const getReplyDraft = (id: string) => apiGet<AgentReplyDraft>(replyDraftPath(id))
export const updateReplyDraft = (id: string, version: number, content: string) =>
  apiPatch<AgentReplyDraft>(replyDraftPath(id), { version, content })
export const publishReplyDraft = (id: string, version: number) =>
  apiPost<AgentReplyDraft>(`${replyDraftPath(id)}/publish`, { version })
export const cancelReplyDraft = (id: string, version: number) =>
  apiPost<AgentReplyDraft>(`${replyDraftPath(id)}/cancel`, { version })

export const safeChatbotURL = (url?: string) => {
  if (typeof url !== 'string' || !url) return undefined
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return url
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href
  } catch { /* Invalid links are displayed as plain text. */ }
  return undefined
}

const getStreamErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json() as { message?: string }
    return payload.message || `聊天请求失败（${response.status}）`
  } catch {
    return `聊天请求失败（${response.status}）`
  }
}

const parseChatbotEvent = (rawEvent: string) => {
  let eventName = 'message'
  const dataLines: string[] = []

  for (const line of rawEvent.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart())
    }
  }

  const data = dataLines.join('\n')
  if (!data || data === '[DONE]') return { eventName: data === '[DONE]' ? 'done' : eventName, payload: null }

  try {
    return { eventName, payload: JSON.parse(data) as Record<string, unknown> }
  } catch {
    throw new Error('聊天回复格式异常，请稍后再试。')
  }
}

// 流式接口单独使用原生 fetch，避免 $fetch 等待整个响应体结束后才返回。
export const streamChatbotMessage = async (
  body: ChatbotChatRequest,
  onDelta: (content: string) => void,
  signal?: AbortSignal,
  options: { agent?: boolean; onEvent?: (event: ChatbotAgentEvent) => void } = {}
) => {
  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBase || '').replace(/\/+$/, '')
  const accessToken = useAccessToken()
  const sendRequest = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken.value) headers.Authorization = `Bearer ${accessToken.value}`

    return fetch(`${apiBase}${options.agent ? '/admin/chatbot/agent/stream' : '/chatbot/chat/stream'}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(body),
      signal
    })
  }

  let response = await sendRequest()
  if (response.status === 401 && await refreshAccessToken()) {
    response = await sendRequest()
  }
  if (!response.ok) throw new Error(await getStreamErrorMessage(response))
  if (!response.body) throw new Error('当前浏览器不支持流式回复。')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let reply = ''
  let sources: ChatbotSource[] = []
  let finished = false

  const handleEvent = (rawEvent: string) => {
    const { eventName, payload } = parseChatbotEvent(rawEvent)
    if (eventName === 'done') {
      finished = true
      if (payload && Array.isArray(payload.sources)) sources = payload.sources as ChatbotSource[]
      return
    }
    if (!payload) return
    if (options.agent && eventName === 'status' && typeof payload.message === 'string') {
      options.onEvent?.({ type: 'status', data: { message: payload.message } })
      return
    }
    if (options.agent && eventName === 'comments' && Array.isArray(payload.items)) {
      options.onEvent?.({ type: 'comments', data: payload as unknown as AgentCommentPage })
      return
    }
    if (options.agent && eventName === 'draft' && typeof payload.id === 'string') {
      options.onEvent?.({ type: 'draft', data: payload as unknown as AgentReplyDraft })
      return
    }
    if (eventName === 'delta') {
      const content = typeof payload.content === 'string' ? payload.content : ''
      if (content) {
        reply += content
        onDelta(content)
      }
      return
    }
    if (eventName === 'error') {
      throw new Error(typeof payload.message === 'string' ? payload.message : '暂时没有收到回复，请稍后再试。')
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      buffer = buffer.replace(/\r\n/g, '\n')
      let separatorIndex = buffer.indexOf('\n\n')
      while (separatorIndex >= 0) {
        const rawEvent = buffer.slice(0, separatorIndex)
        buffer = buffer.slice(separatorIndex + 2)
        handleEvent(rawEvent)
        separatorIndex = buffer.indexOf('\n\n')
      }
      if (done) break
    }
    if (buffer.trim()) handleEvent(buffer)
    if (!finished) throw new Error('回复连接意外中断，请稍后再试。')
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
  return { reply, sources }
}

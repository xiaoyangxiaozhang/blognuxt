import { apiGet, apiPost, refreshAccessToken, useAccessToken } from '~/composables/useApi'

export interface PublicChatbotConfig {
  enabled: boolean
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
}

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
}

export const getChatbotConfig = () => apiGet<PublicChatbotConfig>('/chatbot/config')

export const sendChatbotMessage = (body: ChatbotChatRequest) =>
  apiPost<ChatbotResponse>('/chatbot/chat', body as unknown as Record<string, unknown>)

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
  signal?: AbortSignal
) => {
  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBase || '').replace(/\/+$/, '')
  const accessToken = useAccessToken()
  const sendRequest = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken.value) headers.Authorization = `Bearer ${accessToken.value}`

    return fetch(`${apiBase}/chatbot/chat/stream`, {
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
  return { reply, sources }
}

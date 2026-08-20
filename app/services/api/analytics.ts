export interface PageViewPayload {
  url: string
  hostname: string
  referrer: string
  language: string
  screen: string
  title: string
  timestamp: number
  type: 'pageview'
  duration?: number
  article_id?: number | string
}

/**
 * 上报失败不能阻断页面导航，因此调用方负责静默处理异常。
 * 关闭自动重试，避免网络抖动时把同一次访问记录成多个 PV。
 */
export const collectPageView = async (payload: PageViewPayload) => {
  const api = useApi()

  await api<void>('/collect', {
    method: 'POST',
    body: payload,
    retry: 0
  })
}

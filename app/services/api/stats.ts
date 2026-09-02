import { apiGet } from '~/composables/useApi'

export interface SiteStats {
  total_words: string
  total_visitors: number
  total_page_views: number
  online_users: number
  today_visitors: number
  today_pageviews: number
  yesterday_visitors: number
  yesterday_pageviews: number
  month_pageviews: number
  total_articles: number
  total_comments: number
  total_friends: number
  total_moments: number
  total_categories: number
  total_tags: number
}

export const getSiteStats = () => apiGet<SiteStats>('/stats/site')

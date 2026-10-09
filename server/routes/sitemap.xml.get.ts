import type { ApiResponse, ArticleListItem, PaginationData } from '~/types/api'
import { resolveArticleSlug } from '~/utils/article'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = String(config.public.siteUrl).replace(/\/+$/, '')
  const apiBase = String(config.public.apiBase).replace(/\/+$/, '')

  let response: ApiResponse<PaginationData<ArticleListItem>>
  try {
    // The public endpoint filters drafts; zero disables pagination, as on /articles.
    response = await $fetch(`${apiBase}/articles`, {
      query: { page: 0, page_size: 0 }, timeout: 15_000, retry: 0
    })
    if (response.code !== 0 || !response.data ||
        (!Array.isArray(response.data.list) && !(response.data.list == null && response.data.total === 0))) {
      throw new Error('Invalid article list')
    }
  } catch {
    // Let crawlers retry instead of serving a successful but incomplete sitemap.
    throw createError({ statusCode: 503, statusMessage: 'Sitemap upstream unavailable' })
  }

  const paths = new Set(['/', '/articles', '/archive', '/categories', '/tags', '/friends', '/dynamic', '/message'])
  for (const article of response.data.list || []) {
    paths.add(`/article/${encodeURIComponent(resolveArticleSlug(article))}`)
    for (const path of [article.category?.url, ...(article.tags || []).map(tag => tag.url)]) {
      if (path && /^\/(category|tag)\/[^/?#]+$/.test(path)) paths.add(path)
    }
  }

  const escapeXml = (value: string) => value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[char]!)
  const urls = [...paths].map(path => `<url><loc>${escapeXml(new URL(siteUrl + path).href)}</loc></url>`)
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
})

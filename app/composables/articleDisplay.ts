import type { ArticleListItem } from '~/composables/useApi'

export interface DisplayArticleTag {
  id?: number
  slug?: string
  name: string
  url?: string
}

export interface DisplayArticleCard {
  id: number
  slug: string
  title: string
  cover: string
  publishDate: string
  location: string
  commentCount: number
  isTop: boolean
  isEssence: boolean
  tags: DisplayArticleTag[]
}

const DEFAULT_COVER = 'https://picsum.photos/600/400?random=31'

export const formatArticleDate = (value: string) => {
  if (!value) return ''
  const date = new Date(value.replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN')
}

export const resolveArticleSlug = (item: Pick<ArticleListItem, 'id' | 'slug' | 'url'>) => {
  if (item.slug) {
    return item.slug
  }

  if (item.url) {
    const matched = item.url.match(/\/([^/]+)\/?$/)
    if (matched?.[1]) {
      return decodeURIComponent(matched[1])
    }
  }

  return String(item.id)
}

export const mapArticleCard = (item: ArticleListItem): DisplayArticleCard => ({
  id: item.id,
  slug: resolveArticleSlug(item),
  title: item.title,
  cover: proxyImageUrl(item.cover) || DEFAULT_COVER,
  publishDate: formatArticleDate(item.publish_time),
  location: item.location || '',
  commentCount: item.comment_count ?? 0,
  isTop: Boolean(item.is_top),
  isEssence: Boolean(item.is_essence),
  tags: item.tags?.map((tag) => ({
    id: tag.id,
    slug: tag.slug,
    name: tag.name,
    url: tag.url
  })) || []
})

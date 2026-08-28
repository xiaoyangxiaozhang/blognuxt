export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PaginationData<T> {
  list: T[]
  total: number
  page: number
  page_size: number
}

export interface ArticleListItem {
  id: number
  slug?: string
  url?: string
  title: string
  summary?: string
  excerpt?: string
  cover: string
  location?: string
  comment_count?: number
  is_top?: boolean
  is_essence?: boolean
  publish_time: string
  category?: {
    id?: number
    name: string
    url?: string
  }
  tags?: Array<{
    id?: number
    slug?: string
    name: string
    url?: string
  }>
}

export interface CategoryItem {
  id: number
  name: string
  slug: string
  count: number
  url?: string
}

export interface TagItem {
  id: number
  name: string
  slug: string
  count: number
  url?: string
}

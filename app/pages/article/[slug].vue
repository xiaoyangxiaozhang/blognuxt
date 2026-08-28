<template>
  <div class="article-detail">
    <div class="article-container">
      <div v-if="pending" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <div v-else-if="pageError" class="error-container">
        <el-alert :title="pageError" type="error" show-icon />
      </div>

      <template v-else-if="article">
        <div class="reading-progress" :style="{ width: `${readingProgress}%` }" aria-hidden="true"></div>

        <div class="article-reading-layout">
          <article class="article-card">
            <div v-if="article.cover" class="article-cover">
              <img :src="article.cover" :alt="article.title" />
            </div>

            <header class="article-header">
              <h1 class="article-title">{{ article.title }}</h1>
              <div class="article-meta">
                <span v-if="article.publish_time">{{ formatDate(article.publish_time) }}</span>
                <span v-if="article.category?.name">{{ article.category.name }}</span>
              </div>
              <div v-if="article.tags.length" class="article-tags">
                <span v-for="tag in article.tags" :key="tag.name" class="article-tag">#{{ tag.name }}</span>
              </div>
            </header>

            <div
              ref="articleContentRef"
              class="article-content markdown-content"
              v-html="articleContentHtml"
            ></div>
          </article>

          <aside v-if="tocHeadings.length" class="article-toc" aria-label="文章目录">
            <div class="article-toc-title">目录</div>
            <nav>
              <a
                v-for="heading in tocHeadings"
                :key="heading.id"
                :href="`#${heading.id}`"
                class="article-toc-link"
                :class="{ active: activeHeadingId === heading.id }"
                :style="{ '--toc-level': heading.level }"
                @click.prevent="scrollToHeading(heading.id)"
              >
                {{ heading.text }}
              </a>
            </nav>
          </aside>
        </div>

        <section v-if="relatedArticles.length" class="related-articles" aria-labelledby="related-title">
          <div class="related-heading">
            <h2 id="related-title">相关文章</h2>
          </div>
          <div class="related-grid">
            <NuxtLink
              v-for="item in relatedArticles"
              :key="item.id"
              :to="relatedHref(item)"
              class="related-card"
            >
              <div class="related-meta">
                <span v-if="item.category?.name">{{ item.category.name }}</span>
                <span v-if="item.publish_time">{{ formatDate(item.publish_time) }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p v-if="item.summary">{{ item.summary }}</p>
            </NuxtLink>
          </div>
        </section>

        <section class="article-comments">
          <UnifiedCommentPanel
            :comments="commentList"
            :loading="commentsPending"
            :submitting="commentSubmitting"
            :form="commentForm"
            :error-text="commentError"
            description="提交后，你的评论和回复会显示在这里。"
            empty-text="还没有评论，来留下第一条评论吧。"
            @update:form="handleFormUpdate"
            @submit="handleCommentSubmit"
          />
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import UnifiedCommentPanel from '~/components/comments/UnifiedCommentPanel.vue'
import { normalizeCommentList } from '~/utils/comments'
import { createComment, getCommentList } from '~/services/api/comments'
import { useCommentAuth } from '~/composables/useCommentAuth'
import { proxyImageUrl } from '~/utils/image'
import { formatDate } from '~/utils/date'
import { renderArticleMarkdown, type MarkdownHeading } from '~/utils/markdown'
import { getArticleList } from '~/services/api/article'
import type { ArticleListItem } from '~/types/api'
import defaultShareImage from '~/assets/img/hero-poster.jpg'

interface ArticleDetailData {
  title: string
  slug: string
  url?: string
  content: string
  summary?: string
  ai_summary?: string
  cover: string
  publish_time: string
  category?: {
    name: string
    url?: string
  }
  tags: Array<{
    name: string
    url?: string
  }>
}

interface ArticleCommentForm {
  nickname: string
  email: string
  website: string
  content: string
}

const route = useRoute()
const { isLoggedIn, fetchProfile } = useCommentAuth()

const articleSlug = computed(() => String(route.params.slug || ''))

const commentForm = reactive<ArticleCommentForm>({
  nickname: '',
  email: '',
  website: '',
  content: ''
})
const commentSubmitting = ref(false)

const { data, pending } = await useAsyncData(
  () => `article-${articleSlug.value}`,
  async () => {
    const slug = articleSlug.value
    if (!slug) {
      return {
        article: null,
        error: 'Article not found.'
      }
    }

    try {
      const response = await apiGet<ArticleDetailData>(`/articles/${slug}`)
      if (response.code !== 0 || !response.data) {
        return {
          article: null,
          error: response.message || 'Failed to load article details.'
        }
      }

      return {
        article: {
          ...response.data,
          cover: proxyImageUrl(response.data.cover),
          tags: response.data.tags || []
        },
        error: ''
      }
    } catch (error) {
      console.error(error)
      return {
        article: null,
        error: 'Failed to load article details.'
      }
    }
  }
)

const {
  data: commentsPayload,
  pending: commentsPending,
  refresh: refreshComments
} = await useAsyncData(
  () => `article-comments-${articleSlug.value}`,
  async () => {
    const slug = articleSlug.value
    if (!slug) {
      return {
        response: null,
        error: ''
      }
    }

    try {
      const response = await getCommentList({
        target_type: 'article',
        target_key: slug,
        page: 1,
        page_size: 20
      })

      return {
        response,
        error: ''
      }
    } catch (error) {
      console.error(error)
      return {
        response: null,
        error: 'Failed to load comments. Please try again later.'
      }
    }
  },
  {
    watch: [articleSlug]
  }
)

const article = computed(() => data.value?.article ?? null)
const pageError = computed(() => data.value?.error ?? '')
const commentError = computed(() => commentsPayload.value?.error || '')
const articleDocument = computed(() => renderArticleMarkdown(article.value?.content))
const articleContentHtml = computed(() => articleDocument.value.html)
const tocHeadings = computed<MarkdownHeading[]>(() =>
  articleDocument.value.headings.filter((heading) => heading.level >= 2 && heading.level <= 4)
)
const commentList = computed(() => normalizeCommentList(commentsPayload.value?.response?.data?.list))

const resolveArticleSlug = (item: Pick<ArticleListItem, 'id' | 'slug' | 'url'>) => {
  if (item.slug) {
    return item.slug
  }

  const matched = item.url?.match(/\/([^/]+)\/?$/)
  return matched?.[1] ? decodeURIComponent(matched[1]) : String(item.id)
}

const { data: relatedPayload } = await useAsyncData('article-related-list', async () => {
  try {
    const response = await getArticleList({ page: 1, page_size: 50 })
    if (response.code !== 0) {
      throw new Error(response.message || '获取相关文章失败')
    }

    return { list: response.data?.list || [], error: '' }
  } catch (error) {
    console.error(error)
    return { list: [] as ArticleListItem[], error: '获取相关文章失败' }
  }
})

const relatedArticles = computed(() => {
  const current = article.value
  if (!current) {
    return [] as ArticleListItem[]
  }

  const currentSlug = articleSlug.value
  const currentCategory = current.category?.name?.toLocaleLowerCase() || ''
  const currentTags = new Set((current.tags || []).map((tag) => tag.name.toLocaleLowerCase()))
  const candidates = (relatedPayload.value?.list || [])
    .filter((item) => resolveArticleSlug(item) !== currentSlug)
    .map((item) => {
      const sharedTags = (item.tags || []).filter((tag) => currentTags.has(tag.name.toLocaleLowerCase())).length
      const sameCategory = Boolean(currentCategory && item.category?.name?.toLocaleLowerCase() === currentCategory)
      const publishTime = item.publish_time ? Date.parse(item.publish_time) : 0
      return {
        item,
        score: sharedTags * 2 + (sameCategory ? 3 : 0),
        publishTime
      }
    })
    .sort((a, b) => b.score - a.score || b.publishTime - a.publishTime)

  const matched = candidates.filter((candidate) => candidate.score > 0)
  const source = matched.length ? matched : candidates
  return source.slice(0, 4).map((candidate) => candidate.item)
})

const relatedHref = (item: ArticleListItem) => `/article/${encodeURIComponent(resolveArticleSlug(item))}`

const readingProgress = ref(0)
const activeHeadingId = ref('')
const articleContentRef = ref<HTMLElement | null>(null)

const updateReadingProgress = () => {
  if (!import.meta.client) {
    return
  }

  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
  readingProgress.value = scrollableHeight > 0
    ? Math.min(100, Math.max(0, (window.scrollY / scrollableHeight) * 100))
    : 0
}

const updateActiveHeading = () => {
  if (!import.meta.client || !articleContentRef.value) {
    return
  }

  const headings = Array.from(articleContentRef.value.querySelectorAll<HTMLElement>('h2[id], h3[id], h4[id]'))
  const current = headings.reduce<string>((active, heading) => {
    return heading.getBoundingClientRect().top <= 132 ? heading.id : active
  }, '')

  activeHeadingId.value = current || headings[0]?.id || ''
}

const scrollToHeading = (id: string) => {
  if (!import.meta.client) {
    return
  }

  const heading = document.getElementById(id)
  if (!heading) {
    return
  }

  window.scrollTo({
    top: heading.getBoundingClientRect().top + window.scrollY - 96,
    behavior: 'smooth'
  })
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`)
  activeHeadingId.value = id
}

const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl || '').replace(/\/$/, '')

const toAbsoluteShareUrl = (value?: string | null) => {
  const fallback = new URL(defaultShareImage, `${siteUrl}/`).href
  const normalized = value?.trim() || ''

  if (!normalized) {
    return fallback
  }

  if (normalized.startsWith('/')) {
    return `${siteUrl}${normalized}`
  }

  // Let the public same-origin image proxy expose external covers over HTTPS.
  if (/^https?:\/\//i.test(normalized)) {
    return `${siteUrl}/proxy-image?url=${encodeURIComponent(normalized)}`
  }

  try {
    return new URL(normalized, `${siteUrl}/`).href
  } catch {
    return fallback
  }
}

const articleUrl = computed(() =>
  `${siteUrl}/article/${encodeURIComponent(articleSlug.value)}`
)

const articleDescription = computed(() => {
  const source =
    article.value?.summary ||
    article.value?.ai_summary ||
    article.value?.content ||
    ''

  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
})

const articleShareImage = computed(() => toAbsoluteShareUrl(article.value?.cover))

useSeoMeta({
  title: () => article.value ? `${article.value.title}｜小羊嚣张` : '小羊嚣张',
  description: () => articleDescription.value,
  ogTitle: () => article.value?.title || '小羊嚣张',
  ogDescription: () => articleDescription.value,
  ogType: 'article',
  ogUrl: () => articleUrl.value,
  ogImage: () => articleShareImage.value,
  ogImageAlt: () => article.value?.title || '文章封面',
  twitterCard: 'summary_large_image',
  twitterTitle: () => article.value?.title || '小羊嚣张',
  twitterDescription: () => articleDescription.value,
  twitterImage: () => articleShareImage.value
})

useHead(() => ({
  link: [{ rel: 'canonical', href: articleUrl.value }],
  meta: [
    { property: 'og:image:secure_url', content: articleShareImage.value },
    ...(article.value?.publish_time
      ? [{ property: 'article:published_time', content: article.value.publish_time }]
      : []),
    ...(article.value?.category?.name
      ? [{ property: 'article:section', content: article.value.category.name }]
      : [])
  ]
}))

const handleFormUpdate = (nextForm: ArticleCommentForm) => {
  commentForm.nickname = nextForm.nickname
  commentForm.email = nextForm.email
  commentForm.website = nextForm.website
  commentForm.content = nextForm.content
}

const handleCommentSubmit = async () => {
  if (!articleSlug.value) {
    return
  }

  if (!isLoggedIn.value && !commentForm.nickname.trim()) {
    ElMessage.warning('Please enter a nickname.')
    return
  }

  if (!isLoggedIn.value && !commentForm.email.trim()) {
    ElMessage.warning('Please enter an email.')
    return
  }

  if (!commentForm.content.trim()) {
    ElMessage.warning('Please enter your comment.')
    return
  }

  commentSubmitting.value = true

  try {
    await createComment({
      target_type: 'article',
      target_key: articleSlug.value,
      content: commentForm.content.trim(),
      nickname: isLoggedIn.value ? undefined : commentForm.nickname.trim(),
      email: isLoggedIn.value ? undefined : commentForm.email.trim(),
      website: commentForm.website.trim() || undefined
    })

    commentForm.content = ''
    await refreshComments()
    ElMessage.success('Comment submitted successfully.')
  } catch (error) {
    console.error(error)
    ElMessage.error('Failed to submit comment. Please try again later.')
  } finally {
    commentSubmitting.value = false
  }
}

onMounted(() => {
  fetchProfile()
  nextTick(() => {
    updateReadingProgress()
    updateActiveHeading()
  })
  window.addEventListener('scroll', updateReadingProgress, { passive: true })
  window.addEventListener('scroll', updateActiveHeading, { passive: true })
})

watch(articleContentHtml, () => {
  nextTick(() => {
    updateActiveHeading()
    updateReadingProgress()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateReadingProgress)
  window.removeEventListener('scroll', updateActiveHeading)
})
</script>

<style scoped lang="scss">
.article-detail {
  min-height: 100vh;
  padding: 60px 0 60px;
  background: var(--home-surface);
}

.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 350;
  height: 2px;
  background: var(--brand-accent);
  pointer-events: none;
}

.article-container {
  width: min(860px, calc(100% - 40px));
  margin: 0 auto;
}

.loading-container,
.error-container {
  padding: 40px 0;
}

.article-card {
  background: var(--home-card-bg);
  border-radius: 15px;
  overflow: hidden;
  border: 1px solid var(--home-border);
  box-shadow: var(--home-shadow);
}

.article-reading-layout {
  display: block;
}

.article-toc {
  margin-top: 24px;
  padding: 18px 32px;
  border: 1px solid var(--home-border);
  border-radius: 15px;
  background: var(--home-card-bg);
}

.article-toc-title {
  margin-bottom: 12px;
  color: var(--home-text);
  font-size: 13px;
  font-weight: 700;
}

.article-toc nav {
  display: grid;
  gap: 3px;
}

.article-toc-link {
  display: block;
  overflow: hidden;
  padding: 5px 0 5px calc((var(--toc-level) - 2) * 10px);
  color: var(--home-text-muted);
  font-size: 12px;
  line-height: 1.45;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-fast);
}

.article-toc-link:hover,
.article-toc-link.active {
  color: var(--brand-accent);
}

.related-articles {
  margin-top: 34px;
  padding: 24px 0 0;
  border-top: 1px solid var(--home-border);
}

.related-heading {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}

.related-heading h2 {
  margin: 0;
  color: var(--home-text);
  font-size: 22px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.related-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--home-border);
  border-radius: 10px;
  background: var(--home-card-bg);
  color: inherit;
  text-decoration: none;
  transition: border-color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast);
}

.related-card:hover,
.related-card:focus-visible {
  border-color: var(--brand-accent);
  background: var(--home-card-hover);
  transform: translateY(-2px);
}

.related-card:focus-visible {
  outline: 2px solid var(--brand-accent);
  outline-offset: 3px;
}

.related-meta {
  display: flex;
  gap: 10px;
  color: var(--home-text-muted);
  font-size: 12px;
}

.related-card h3 {
  margin: 8px 0 0;
  color: var(--home-text);
  font-size: 16px;
  line-height: 1.5;
}

.related-card p {
  display: -webkit-box;
  overflow: hidden;
  margin: 6px 0 0;
  color: var(--home-text-muted);
  font-size: 13px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.article-cover {
  width: 100%;
  max-height: 420px;
  overflow: hidden;
  border-radius: 15px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.article-header {
  padding: 32px 32px 16px;
}

.article-title {
  margin: 0 0 6px;
  font-size: 34px;
  line-height: 1.3;
  color: var(--home-text);
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--text-muted);
  font-size: 14px;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.article-tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--home-accent-soft);
  color: var(--home-accent);
  font-size: 12px;
}

.article-content {
  padding: 0 32px 32px;
  line-height: 1.9;
  word-break: break-word;
  /* markdown-content class from _prose.scss handles typography */
}

.article-comments {
  margin-top: 24px;
}

@media (max-width: 768px) {
  .article-detail {
    padding-top: 24px;
  }

  .article-container {
    width: min(100%, calc(100% - 24px));
  }

  .article-toc {
    margin-top: 18px;
    padding: 14px 18px;
  }

  .article-toc nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2px 14px;
  }

  .article-header {
    padding: 22px 18px 12px;
  }

  .article-content {
    padding: 0 18px 22px;
  }

  .article-title {
    font-size: 26px;
  }

  .article-comments {
    margin-top: 18px;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>

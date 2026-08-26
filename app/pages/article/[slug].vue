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

          <div class="article-content markdown-content" v-html="articleContentHtml">
          </div>
        </article>

        <section class="article-comments">
          <UnifiedCommentPanel
            :comments="commentList"
            :loading="commentsPending"
            :submitting="commentSubmitting"
            :form="commentForm"
            :error-text="commentError"
            description="Article comments and replies will be shown below after submission."
            empty-text="No comments on this article yet. Start the conversation below."
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
import { renderMarkdown } from '~/utils/markdown'
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
const articleContentHtml = computed(() => renderMarkdown(article.value?.content))
const commentList = computed(() => normalizeCommentList(commentsPayload.value?.response?.data?.list))

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
})
</script>

<style scoped lang="scss">
.article-detail {
  min-height: 100vh;
  padding: 60px 0 60px;
  background: var(--home-surface);
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
}
</style>

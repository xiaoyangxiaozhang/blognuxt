<template>
  <div class="article-detail">
    <div class="article-container">
      <div v-if="pending" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <div v-else-if="pageError" class="error-container">
        <el-alert :title="pageError" type="error" show-icon />
      </div>

      <article v-else-if="article" class="article-card">
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

        <div class="article-content">
          {{ article.content }}
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ArticleDetailData {
  title: string
  slug: string
  url?: string
  content: string
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

const route = useRoute()

const formatDate = (value: string) => {
  if (!value) return ''
  const date = new Date(value.replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN')
}

const { data, pending } = await useAsyncData(
  () => `article-${String(route.params.slug || '')}`,
  async () => {
    const slug = String(route.params.slug || '')
    if (!slug) {
      return {
        article: null,
        error: '文章不存在'
      }
    }

    try {
      const response = await apiGet<ArticleDetailData>(`/articles/${slug}`)
      if (response.code !== 0 || !response.data) {
        return {
          article: null,
          error: response.message || '获取文章详情失败'
        }
      }

      return {
        article: {
          ...response.data,
          tags: response.data.tags || []
        },
        error: ''
      }
    } catch (error) {
      console.error(error)
      return {
        article: null,
        error: '获取文章详情失败'
      }
    }
  }
)

const article = computed(() => data.value?.article ?? null)
const pageError = computed(() => data.value?.error ?? '')
</script>

<style scoped lang="scss">
.article-detail {
  min-height: 100vh;
  padding: 60px 0 60px;
}

.article-container {
  max-width: 860px;
  margin: 0 auto;
}

.loading-container,
.error-container {
  padding: 40px 0;
}

.article-card {
  background: var(--bg-panel);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 30px var(--shadow-color);
}

.article-cover {
  width: 100%;
  max-height: 420px;
  overflow: hidden;

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
  margin: 0 0 12px;
  font-size: 34px;
  line-height: 1.3;
  color: var(--text-primary);
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--text-secondary);
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
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 12px;
}

.article-content {
  padding: 0 32px 32px;
  color: var(--text-secondary);
  line-height: 1.9;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .article-detail {
    padding-top: 20px;
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
}
</style>

<template>
  <div class="comments-panel">
    <div v-if="loading" class="loading-box">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="commentCards.length === 0" class="empty-text">暂无评论内容</div>

    <div v-else class="comment-grid">
      <article v-for="item in commentCards" :key="item.id" class="comment-card">
        <p class="comment-date">发布于：{{ item.publishDate }}</p>
        <div class="comment-divider"></div>
        <p class="comment-text">{{ item.text }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
interface RecentArticleItem {
  id: number
  slug: string
  title: string
  publishDate: string
  categoryName: string
  cover: string
}

interface TagItem {
  id: number
  name: string
  slug: string
  count: number
}

const props = defineProps<{
  recentArticles: RecentArticleItem[]
  tags: TagItem[]
  loading: boolean
}>()

const commentCards = computed(() => {
  const fromArticles = props.recentArticles.slice(0, 6).map((article) => ({
    id: `comment-${article.id}`,
    publishDate: article.publishDate,
    text: `${article.categoryName} · ${article.title}`
  }))

  return [...fromArticles]
})
</script>

<style scoped lang="scss">
.loading-box {
  max-width: 420px;
}

.comment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.comment-card {
  padding: 24px;
  border-radius: 15px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
}

.comment-date {
  margin: 0;
  color: var(--home-text-muted);
  font-size: 14px;
}

.comment-divider {
  margin: 18px 0;
  height: 1px;
  background: var(--home-border);
}

.comment-text {
  margin: 0;
  color: var(--home-text);
  font-size: 15px;
  line-height: 1.9;
  min-height: 88px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.empty-text {
  color: var(--home-text-muted);
  font-size: 14px;
}

@media (max-width: 1200px) {
  .comment-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .comment-grid {
    grid-template-columns: 1fr;
  }
}
</style>

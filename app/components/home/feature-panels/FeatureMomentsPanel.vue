<template>
  <div class="moments-panel">
    <div v-if="loading" class="loading-box">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="momentCards.length === 0" class="empty-text">暂无动态内容</div>

    <div v-else class="moment-grid">
      <article v-for="item in momentCards" :key="item.id" class="moment-card">
        <p class="moment-date">发布于：{{ item.publishDate }}</p>
        <div class="moment-divider"></div>
        <p class="moment-text">{{ item.text }}</p>
        <div v-if="item.cover" class="moment-cover">
          <img :src="item.cover" :alt="item.text" loading="lazy" />
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getMomentList } from '~/composables/api/moments'

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

interface MomentCardItem {
  id: string | number
  publishDate: string
  text: string
  cover?: string
}

const props = defineProps<{
  recentArticles: RecentArticleItem[]
  tags: TagItem[]
  loading: boolean
}>()

const { data: momentsData } = await useAsyncData('home-moments', () => getMomentList())

const momentCards = computed<MomentCardItem[]>(() => {
  if (momentsData.value?.data?.list && momentsData.value.data.list.length > 0) {
    return momentsData.value.data.list.map((item) => ({
      id: `moment-${item.id}`,
      publishDate: item.publish_time,
      text: item.content?.text || '',
      cover: item.content?.images?.[0]
    }))
  }

  const fromArticles = props.recentArticles.slice(0, 6).map((article) => ({
    id: `article-${article.id}`,
    publishDate: article.publishDate,
    text: article.title,
    cover: article.cover
  }))

  return [...fromArticles]
})
</script>

<style scoped lang="scss">
.loading-box {
  max-width: 420px;
}

.moment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.moment-card {
  padding: 24px;
  border-radius: 24px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
}

.moment-date {
  margin: 0;
  color: var(--home-text-muted);
  font-size: 14px;
}

.moment-divider {
  margin: 8px 0;
  height: 1px;
  background: var(--home-border);
}

.moment-text {
  margin: 0;
  color: var(--home-text);
  font-size: 15px;
  line-height: 1.9;
}

.moment-cover {
  margin-top: 18px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--home-card-alt);

  img {
    width: 100%;
    height: 140px;
    object-fit: cover;
    display: block;
  }
}

.empty-text {
  color: var(--home-text-muted);
  font-size: 14px;
}

@media (max-width: 1200px) {
  .moment-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .moment-grid {
    grid-template-columns: 1fr;
  }
}
</style>

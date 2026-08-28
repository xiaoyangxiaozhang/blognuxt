<template>
  <div class="articles-panel">
    <div v-if="loading" class="loading-box">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="articleCards.length === 0" class="empty-text">还没有文章数据</div>

    <div v-else class="article-grid">
      <NuxtLink v-for="article in articleCards" :key="article.id" :to="`/article/${article.slug}`" class="article-card">
        <div class="thumb">
          <img :src="article.cover" :alt="article.title" loading="lazy" />
        </div>
        <div class="card-body">
          <span class="category-label">{{ article.categoryName }}</span>
          <h3 class="article-title">{{ article.title }}</h3>
          <p class="article-date">{{ article.publishDate }}</p>
        </div>
      </NuxtLink>
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

const props = defineProps<{
  recentArticles: RecentArticleItem[]
  loading: boolean
}>()

const articleCards = computed(() => props.recentArticles.slice(0, 6))
</script>

<style scoped lang="scss">
.loading-box {
  max-width: 420px;
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  width: 100%;
}

.article-card {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  min-width: 0;
  padding: 18px;
  border-radius: 15px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
  text-decoration: none;
  transition:
    transform var(--transition-base),
    background var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);

  &:hover {
    transform: scale(0.97);
    background: var(--home-card-hover);
    border-color: color-mix(in srgb, var(--home-text) 22%, var(--home-border));
    box-shadow: 0 18px 36px -24px var(--shadow-color), var(--home-shadow);
  }

  &:focus-visible {
    transform: scale(0.97);
    outline: 2px solid var(--home-text);
    outline-offset: 4px;
    border-color: color-mix(in srgb, var(--home-text) 30%, var(--home-border));
  }
}

.thumb {
  position: relative;
  isolation: isolate;
  width: 96px;
  height: 96px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--home-card-alt);

  &::after {
    position: absolute;
    inset: 0;
    content: '';
    pointer-events: none;
    background: linear-gradient(135deg, color-mix(in srgb, var(--home-text) 10%, transparent), transparent 55%);
    opacity: 0;
    transition: opacity var(--transition-base);
  }

  img {
    transform: scale(1.015);
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.72s cubic-bezier(0.22, 1, 0.36, 1), filter var(--transition-base);
    filter: saturate(0.94);
  }
}

.article-card:hover .thumb img,
.article-card:focus-visible .thumb img {
  transform: scale(1.1);
  filter: saturate(1.04);
}

.article-card:hover .thumb::after,
.article-card:focus-visible .thumb::after {
  opacity: 1;
}

.card-body {
  min-width: 0;
}

.category-label {
  display: inline-flex;
  margin-bottom: 10px;
  color: var(--home-accent);
  font-size: 13px;
  font-weight: 600;
}

.article-title {
  margin: 0 0 10px;
  color: var(--home-text);
  font-size: 16px;
  line-height: 1.6;
  font-weight: 500;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-date {
  margin: 0;
  color: var(--home-text-muted);
  font-size: 13px;
}

.empty-text {
  color: var(--home-text-muted);
  font-size: 14px;
}

@media (max-width: 1200px) {
  .article-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .article-grid {
    grid-template-columns: 1fr;
  }

  .article-card {
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 14px;
    padding: 14px;
  }

  .thumb {
    width: 84px;
    height: 84px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .article-card,
  .thumb img,
  .thumb::after {
    transition: none;
  }

  .article-card:hover {
    transform: none;
  }

  .thumb img {
    transform: none;
  }
}
</style>

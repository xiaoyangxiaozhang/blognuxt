<template>
  <section class="newest-section">
    <div class="newest-wrapper">
      <div class="section-heading">
        <h2>Newest</h2>
      </div>

      <div class="articles-section">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="6" animated />
        </div>

        <div v-else-if="errorMessage" class="error-container">
          <el-alert :title="errorMessage" type="error" show-icon />
        </div>

        <div v-else class="articles-grid">
          <article
            v-for="(article, index) in articles"
            :key="article.id"
            :data-article-id="article.id"
            class="article-card"
            :class="{ featured: index === 0 }"
          >
            <NuxtLink :to="`/article/${article.slug}`" class="article-cover-link">
              <div class="article-cover">
                <img :src="article.cover" :alt="article.title" loading="lazy" class="lazy-image" />
              </div>
            </NuxtLink>

            <div class="article-content">
              <div class="article-meta">
                <span class="category">
                  <IconMaterialSymbolsFolderOpenRounded />
                  {{ article.categoryName }}
                </span>
                <span
                  v-for="tag in article.tags.slice(0, 2)"
                  :key="tag.name"
                  class="tag"
                >
                  {{ tag.name }}
                </span>
              </div>
              <h3 class="article-title">
                <NuxtLink :to="`/article/${article.slug}`">
                  {{ article.title }}
                </NuxtLink>
              </h3>
              <span class="article-date">{{ article.publishDate }}</span>
            </div>
          </article>

          <div v-if="articles.length === 0" class="empty-container">
            <el-empty description="暂无文章" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import IconMaterialSymbolsFolderOpenRounded from '~icons/material-symbols/folder-open-rounded'
import { getDominantColor } from '~/composables/useDominantColor'

interface ArticleTag {
  name: string
  url?: string
}

interface ArticleCard {
  id: number
  slug: string
  title: string
  cover: string
  publishDate: string
  categoryName: string
  categoryUrl: string
  tags: ArticleTag[]
}

const props = defineProps<{
  articles: ArticleCard[]
  loading: boolean
  errorMessage: string
}>()

// 文章加载后提取封面主色调并应用到标签
watch(() => props.articles, async (articles) => {
  if (!articles.length) return
  await nextTick()

  for (const article of articles) {
    if (!article.cover) continue

    try {
      const color = await getDominantColor(article.cover)
      if (!color) continue

      const el = document.querySelector(`[data-article-id="${article.id}"]`) as HTMLElement | null
      if (el) {
        el.style.setProperty('--card-accent', color)
      }
    } catch (e) {
      console.warn('Failed to extract color for article', article.id, e)
    }
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.newest-section {
  margin-top: 28px;
}

.newest-wrapper {
  width: min(1000px, 100%);
  margin: 0 auto;
  color: var(--home-text);
}

.section-heading {
  margin-bottom: 24px;

  h2 {
    position: relative;
    display: inline-block;
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--home-text);

    &::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 3px;
      border-radius: 2px;
      background: var(--brand-accent);
    }
  }
}

.articles-section {
  .loading-container,
  .error-container,
  .empty-container {
    padding: 40px 0;
    text-align: center;
  }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;
}

.article-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 15px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
  transition:
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow var(--transition-base);

  &:hover {
    transform: scale(0.97);
  }
}

.article-card.featured {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 1fr);
  min-height: 360px;
}

.article-cover-link {
  display: block;
  min-width: 0;
  height: 100%;
}

.article-cover {
  height: 260px;
  overflow: hidden;
  background: var(--home-card-alt);
}

.article-card:not(.featured) .article-cover {
  display: flex;
  align-items: center;
  justify-content: center;
}

.article-card.featured .article-cover {
  height: 100%;
  background: var(--home-card-alt);
}

.article-card.featured .article-cover img,
.article-card:not(.featured) .article-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform var(--transition-slow), filter 0.4s ease;
    filter: blur(3px);
}

.article-card:hover .article-cover img {
  filter: blur(0);
}

.article-content {
  padding: 22px 24px 24px;
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.article-card.featured .article-content {
  padding: 34px 36px 28px;
  justify-content: space-between;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;

  .category {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--card-accent, var(--home-accent));
    font-size: 13px;
    font-weight: 500;

    :deep(svg) {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
  }

  .tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--card-accent, var(--accent-soft)) 25%, transparent);
    color: var(--card-accent, var(--home-text-muted));
    font-size: 12px;
    font-weight: 400;
  }
}

.article-date {
  display: block;
  font-size: 13px;
  color: var(--home-text-muted);
  margin-top: 10px;
}

.article-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.45;
  color: var(--home-text);
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;

  a {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--home-accent);
    }
  }
}

.article-card.featured .article-title {
  font-size: 30px;
  line-height: 1.2;
  -webkit-line-clamp: 3;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.18);
}

@media (max-width: 1200px) {
  .newest-wrapper {
    width: min(700px, 100%);
  }

  .section-heading {
    margin-bottom: 20px;

    h2 {
      font-size: 24px;
    }
  }

  .article-card.featured {
    grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.95fr);
    min-height: 280px;
  }

  .article-card.featured .article-content {
    padding: 26px 26px 22px;
  }

  .article-card.featured .article-title {
    font-size: 28px;
  }
}

@media (max-width: 768px) {
  .newest-section {
    margin-top: 64px;
  }

  .newest-wrapper {
    width: 380px;
  }

  .section-heading {
    margin-bottom: 18px;

    h2 {
      font-size: 22px;
    }
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }

  .article-card {
    border-radius: 14px;
  }

  .article-cover {
    height: 220px;
  }

  .article-title {
    font-size: 16px;
  }

  .article-card.featured {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .article-card.featured .article-cover {
    height: 220px;
  }

  .article-content,
  .article-card.featured .article-content {
    padding: 18px 18px 20px;
  }

  .article-card.featured .article-title {
    font-size: 18px;
    line-height: 1.35;
  }
}
</style>

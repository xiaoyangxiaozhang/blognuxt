<template>
  <section
    ref="newestSectionRef"
    class="newest-section"
    :class="{ 'scroll-reveal-enabled': scrollRevealReady }"
  >
    <div class="newest-wrapper">
      <div data-scroll-reveal class="section-heading">
        <h2>Newest</h2>
      </div>

      <div class="articles-section">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="6" animated />
        </div>

        <div v-else-if="errorMessage" class="error-container">
          <el-alert :title="errorMessage" type="error" show-icon />
          <button type="button" class="retry-button" @click="$emit('retry')">重新加载</button>
        </div>

        <div v-else class="articles-grid">
          <article
            v-for="(article, index) in articles"
            :key="article.id"
            :data-article-id="article.id"
            data-scroll-reveal
            class="article-entry"
            :class="{ featured: index === 0, compact: index >= 3 }"
            :style="{ '--reveal-delay': revealDelay(index) }"
          >
            <NuxtLink :to="`/article/${article.slug}`" :aria-label="article.title" class="article-card" :class="{ featured: index === 0, compact: index >= 3 }">
              <div class="article-cover-link">
                <div class="article-cover">
                  <img v-if="article.cover" :src="article.cover" :alt="article.title" loading="lazy" class="lazy-image" />
                </div>
              </div>

              <div class="article-content">
                <div data-reveal-child class="article-meta">
                  <span v-if="article.isTop" class="pinned-label">置顶</span>
                  <span class="category">
                    <ArchiveIcon aria-hidden="true" />
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
                <h3 data-reveal-child class="article-title">
                  {{ article.title }}
                </h3>
                <p v-if="index < 3 && article.summary" class="article-summary">{{ article.summary }}</p>
                <time data-reveal-child class="article-date" :datetime="article.dateTime">{{ article.publishDate }}</time>
              </div>
            </NuxtLink>
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
import { ArchiveIcon } from '~/utils/siteIcons'
import { getDominantColor } from '~/utils/dominantColor'
import { useScrollReveal } from '~/composables/useScrollReveal'

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
  summary?: string
  isTop?: boolean
  dateTime?: string
  tags: ArticleTag[]
}

const props = defineProps<{
  articles: ArticleCard[]
  loading: boolean
  errorMessage: string
}>()

defineEmits<{ retry: [] }>()

const newestSectionRef = ref<HTMLElement | null>(null)
const {
  isReady: scrollRevealReady,
  refresh: refreshScrollReveal
} = useScrollReveal(newestSectionRef)

const revealDelay = (index: number) => `${Math.min(index, 5) * 50}ms`

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

onUpdated(refreshScrollReveal)
</script>

<style scoped lang="scss">
.newest-section {
  margin-top: 28px;
}

.scroll-reveal-enabled [data-scroll-reveal] {
  --reveal-distance: 18px;
  opacity: 0;
  transform: translate3d(0, var(--reveal-distance), 0);
  transition:
    opacity 260ms var(--ease-out-expo),
    transform 280ms var(--ease-out-expo);
  transition-delay: var(--reveal-delay, 0ms);
}

[data-scroll-reveal].is-revealed {
  opacity: 1;
  transform: translate3d(0, 0, 0);
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

.retry-button {
  margin-top: 12px;
  padding: 8px 16px;
  min-height: 44px;
  border: 1px solid var(--home-border);
  border-radius: 8px;
  background: var(--home-card-bg);
  color: var(--home-text);
  font: inherit;
  cursor: pointer;

  &:hover { color: var(--brand-accent); }
  &:focus-visible { outline: 2px solid var(--home-text); outline-offset: 4px; }
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
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;
}

.article-entry {
  min-width: 0;
  grid-column: span 3;

  &.featured { grid-column: 1 / -1; }
  &.compact { grid-column: span 2; }
}

.article-card {
  height: 100%;
  color: inherit;
  text-decoration: none;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 15px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
  transition: transform 400ms cubic-bezier(0.345, 0.045, 0.345, 1);

  &:focus-visible {
    outline: 2px solid var(--home-text);
    outline-offset: 4px;
  }
}

.scroll-reveal-enabled .article-card [data-reveal-child] {
  opacity: 0;
  transform: translate3d(0, 14px, 0);
  transition:
    opacity 200ms var(--ease-out-expo),
    transform 220ms var(--ease-out-expo);
}

.article-entry.is-revealed .article-meta,
.article-entry.is-revealed .article-title,
.article-entry.is-revealed .article-date {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.article-entry.is-revealed .article-meta {
  transition-delay: calc(var(--reveal-delay, 0ms) + 40ms);
}

.article-entry.is-revealed .article-title {
  transition-delay: calc(var(--reveal-delay, 0ms) + 70ms);
}

.article-entry.is-revealed .article-date {
  transition-delay: calc(var(--reveal-delay, 0ms) + 100ms);
}

.article-card.featured {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 1fr);
  height: 360px;
}

.article-card:not(.featured) {
  min-height: 440px;
}

.article-cover-link {
  display: block;
  min-width: 0;
  height: 100%;
}

.article-card:not(.featured) .article-cover-link {
  height: auto;
  flex-shrink: 0;
}

.article-cover {
  position: relative;
  isolation: isolate;
  height: 260px;
  overflow: hidden;
  background: var(--home-card-alt);

  &::after {
    position: absolute;
    inset: 0;
    content: '';
    pointer-events: none;
    background: linear-gradient(135deg, color-mix(in srgb, var(--home-text) 10%, transparent), transparent 42%);
    opacity: 0;
    transition: opacity var(--transition-base);
  }
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
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  transform: scale(1.015);
  transform-origin: center;
  transition: transform 400ms cubic-bezier(0.345, 0.045, 0.345, 1);
  filter: saturate(0.94);
}

@media (hover: hover) and (pointer: fine) {
  .article-card:hover { transform: scale(0.97); }
  .article-card:hover .article-cover img { transform: scale(1.08); }
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
  justify-content: center;
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
    color: var(--text-secondary);
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
    color: var(--text-secondary);
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

.pinned-label {
  color: var(--home-text);
  font-size: 13px;
  font-weight: 600;
}

.article-summary {
  display: -webkit-box;
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.75;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-card.featured .article-summary {
  -webkit-line-clamp: 3;
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
}

.article-card.featured .article-title {
  font-size: 30px;
  line-height: 1.2;
  -webkit-line-clamp: 3;
}

.article-card.compact {
  min-height: 340px;

  .article-cover { height: 180px; }
  .article-content { padding: 18px 20px 20px; }
  .article-meta { gap: 6px; }
  .article-title { -webkit-line-clamp: 2; }
  .article-date {
    margin-top: auto;
    padding-top: 10px;
  }
}

@media (max-width: 1200px) {
  .newest-wrapper {
    width: min(700px, 100%);
  }

  .section-heading {
    margin-bottom: 20px;

    h2 {
      font-size: 44px;
    }
  }

  .article-card.featured {
    grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.95fr);
    height: 270px;
  }

  .article-card:not(.featured) {
    min-height: 340px;
  }

  .article-card:not(.featured) .article-cover {
    height: 180px;
  }

  .article-card.featured .article-content {
    padding: 26px 26px 22px;
  }

  .article-card.featured .article-title {
    font-size: 28px;
  }
}

@media (max-width: 1024px) {
  .article-entry.compact { grid-column: span 3; }
}

@media (max-width: 768px) {
  .newest-section {
    margin-top: 64px;
  }

  .newest-wrapper {
    width: min(368px, 100%);
  }

  .section-heading {
    margin-bottom: 20px;

    h2 {
      font-size: 24px;
    }
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }

  .article-entry,
  .article-entry.compact { grid-column: 1 / -1; }

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
    height: auto;
  }

  .article-card.featured .article-cover {
    height: 220px;
  }

  .article-card:not(.featured) .article-cover {
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

  [data-scroll-reveal] {
    --reveal-distance: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-reveal-enabled [data-scroll-reveal],
  .scroll-reveal-enabled .article-card [data-reveal-child] {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .article-card,
  .article-card:hover,
  .article-card .article-cover img,
  .article-card:hover .article-cover img {
    transform: none;
    transition: none;
  }

  .article-card .article-cover::after { transition: none; }
}
</style>

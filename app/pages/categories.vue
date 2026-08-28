<template>
  <div class="categories-page">
    <PageCurtain v-model="curtainReady" @opened="onCurtainOpened" />
    <section class="content-section">
      <div class="content-shell">
        <div v-if="pending" class="loading-container">
          <el-skeleton :rows="8" animated />
        </div>

        <div v-else-if="pageError" class="error-container">
          <el-alert :title="pageError" type="error" show-icon />
        </div>

        <template v-else>
          <div class="category-header">
            <h2 class="category-header-title">
              文章分类
              <span class="category-header-underline"></span>
            </h2>
          </div>

          <div v-if="sortedCategories.length === 0" class="empty-state">
            <h3>还没有分类</h3>
            <p>等文章接入更多分类后，这里会自动丰富起来。</p>
          </div>

          <div v-else class="category-grid">
            <NuxtLink
              v-for="category in sortedCategories"
              :key="category.id"
              :to="{
                path: category.url || `/category/${category.slug}`,
                query: { name: category.name }
              }"
              class="category-card"
            >
              <div class="category-card-inner">
                <span class="category-total">共 {{ category.displayCount }} 篇文章</span>
                <h3 class="category-name">{{ category.name }}</h3>
                <span class="category-mark" aria-hidden="true">
                  <IconMaterialSymbolsFolderOpenOutlineRounded />
                </span>
              </div>
            </NuxtLink>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import IconMaterialSymbolsFolderOpenOutlineRounded from '~icons/material-symbols/folder-open-outline-rounded'
import { getCategoryList } from '~/services/api/category'
import PageCurtain from '~/components/shell/PageCurtain.vue'
import type { CategoryItem } from '~/types/api'

interface CategoryCardItem extends CategoryItem {
  displayCount: number
}

const { data, pending } = await useAsyncData(
  'categories-page',
  async () => {
    try {
      const response = await getCategoryList({ page_size: 50 })
      const list = response.data.list || []
      const items: CategoryCardItem[] = list
        .map((item) => ({
          ...item,
          displayCount: item.count || 0
        }))
        .sort((a, b) => b.displayCount - a.displayCount)

      return {
        categories: items,
        error: ''
      }
    } catch (error) {
      console.error(error)
      return {
        categories: [] as CategoryCardItem[],
        error: '分类页加载失败，请稍后重试'
      }
    }
  }
)

const sortedCategories = computed(() => data.value?.categories || [])
const pageError = computed(() => data.value?.error || '')

const isRevealed = ref(false)
const curtainReady = ref(false)

const triggerReveal = () => {
  setTimeout(() => {
    curtainReady.value = true
  }, 200)
}

const onCurtainOpened = () => {
  isRevealed.value = true
}

watch(pending, (value) => {
  if (!value && import.meta.client) {
    triggerReveal()
  }
})

onMounted(() => {
  if (!pending.value) {
    triggerReveal()
  }
})
</script>

<style scoped lang="scss">
.categories-page {
  min-height: 100vh;
  background: var(--home-surface);
  color: var(--home-text);
}

.content-section {
  min-height: 100vh;
  background: var(--home-surface);
}

.content-shell {
  width: min(1000px, calc(100% - 60px));
  margin: 0 auto;
  padding: 104px 0 56px;
}

.category-header {
  margin-bottom: 32px;
}

.category-header-title {
  position: relative;
  display: inline-block;
  margin: 0;
  color: var(--home-text);
  font-size: 32px;
  font-weight: 700;
}

.category-header-underline {
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--brand-accent);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.category-card {
  display: block;
  overflow: hidden;
  border: 1px solid var(--home-border);
  border-radius: 12px;
  background: var(--home-card-bg);
  cursor: pointer;
  text-decoration: none;
  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.35s ease,
    box-shadow 0.35s ease,
    border-radius 0.35s cubic-bezier(0.22, 1, 0.36, 1);

  &:hover {
    transform: scale(1.04);
    border-color: var(--brand-accent);
    border-radius: 6px;
    box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.24);
  }

  &:focus-visible {
    outline: 2px solid var(--brand-accent);
    outline-offset: 3px;
  }
}

.category-card-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 126px;
  padding: 24px 24px 28px;
  overflow: hidden;
}

.category-total {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
}

.category-name {
  z-index: 1;
  margin: 0;
  color: var(--home-text);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.category-mark {
  position: absolute;
  right: 10px;
  bottom: -10px;
  color: var(--home-text);
  opacity: 0.07;
  pointer-events: none;

  :deep(svg) {
    width: 72px;
    height: 72px;
  }
}

.loading-container,
.error-container {
  padding: 20px 0;
}

.empty-state {
  display: grid;
  min-height: 240px;
  place-content: center;
  gap: 10px;
  color: var(--text-muted);
  text-align: center;

  h3,
  p {
    margin: 0;
  }

  h3 {
    color: var(--home-text);
    font-size: 24px;
  }
}

@media (max-width: 1200px) {
  .content-shell {
    width: min(760px, calc(100% - 60px));
  }

  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 820px) {
  .content-shell {
    width: min(760px, calc(100% - 40px));
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .category-name {
    font-size: 22px;
  }
}

@media (max-width: 768px) {
  .content-shell {
    width: min(100%, calc(100% - 28px));
    padding: 96px 0 56px;
  }
}

@media (max-width: 520px) {
  .category-grid {
    gap: 12px;
  }

  .category-card-inner {
    min-height: 112px;
    padding: 18px 18px 22px;
    gap: 8px;
  }

  .category-name {
    font-size: 20px;
  }

  .category-total {
    font-size: 12px;
  }

  .category-mark :deep(svg) {
    width: 56px;
    height: 56px;
  }
}

@media (max-width: 380px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>

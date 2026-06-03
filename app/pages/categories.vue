<template>
  <section class="categories-page">
    <!-- 骨架屏幕布 -->
    <PageCurtain v-model="curtainReady" @opened="onCurtainOpened" />
    <div class="categories-wrapper">
      <div class="page-head">
        <h1 class="page-title">分类</h1>
        <p class="page-subtitle">按主题浏览所有文章</p>
      </div>

      <div v-if="categories.length" class="categories-grid">
        <NuxtLink
          v-for="item in categories"
          :key="item.id"
          :to="`/tags?category=${item.id}`"
          class="category-card"
        >
          <div class="category-icon-label">
            <span class="category-icon">
              <IconMaterialSymbolsFolderOpenOutlineRounded />
            </span>
            <span class="category-name">{{ item.name }}</span>
          </div>
          <span class="category-count">{{ item.count }} 篇</span>
        </NuxtLink>
      </div>

      <div v-else class="empty-state">
        <el-empty description="暂无分类数据" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import IconMaterialSymbolsFolderOpenOutlineRounded from '~icons/material-symbols/folder-open-outline-rounded'
import { getCategoryList } from '~/composables/api/category'
import PageCurtain from '~/components/layouts/PageCurtain.vue'

type Category = {
  id: number
  name: string
  count: number
}

const { data, pending } = await useAsyncData('categories-page', async () => {
  const res = await getCategoryList({ page_size: 10 })
  return res.data.list || []
})

const categories = computed(() => data.value || [])

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

// 检查数据加载状态触发入场动画
watch(pending, (val) => {
  if (!val && import.meta.client) {
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
  padding: 72px 0 80px;
}

.categories-wrapper {
  width: min(1000px, calc(100% - 60px));
  margin: 0 auto;
}

.page-head {
  margin-bottom: 40px;
}

.page-title {
  margin: 0 0 10px;
  font-size: 46px;
  line-height: 1.02;
  color: var(--home-text);
  position: relative;
  display: inline-block;

  &::after {
    content: '';
    position: absolute;
    left: 4px;
    bottom: 2px;
    width: 72%;
    height: 7px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--brand-accent), transparent);
  }
}

.page-subtitle {
  margin: 16px 0 0;
  font-size: 15px;
  color: var(--text-muted);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.category-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 22px 24px;
  border-radius: 14px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
  text-decoration: none;
  transition:
    transform var(--transition-base),
    border-color var(--transition-base),
    background var(--transition-base);

  &:hover {
    transform: translateY(-3px);
    border-color: var(--brand-accent);
    background: var(--home-card-hover);
  }
}

.category-icon-label {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.category-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--brand-accent-soft);
  color: var(--brand-accent);
  display: grid;
  place-items: center;
  flex-shrink: 0;

  :deep(svg) {
    width: 22px;
    height: 22px;
  }
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--home-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--home-accent-soft);
  flex-shrink: 0;
}

.empty-state {
  min-height: 260px;
  display: grid;
  place-content: center;
}

@media (max-width: 768px) {
  .categories-page {
    padding: 48px 0 56px;
  }

  .page-title {
    font-size: 36px;
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>

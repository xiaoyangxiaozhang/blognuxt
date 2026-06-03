<template>
  <div class="tags-page">
    <!-- 骨架屏幕布 -->
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
          <div class="tag-header">
            <h2 class="tag-header-title">
              Post Tag
              <span class="tag-header-underline"></span>
            </h2>
          </div>

          <div v-if="sortedTags.length === 0" class="empty-state">
            <h3>还没有标签</h3>
            <p>等文章接入更多标签后，这里会自动丰富起来。</p>
          </div>

          <div v-else class="tag-grid">
            <div
              v-for="tag in sortedTags"
              :key="tag.id"
              class="tag-card"
            >
              <div class="tag-card-inner">
                <span class="tag-total">Total: {{ tag.count }} {{ tag.count === 1 ? 'Post' : 'Posts' }}</span>
                <h3 class="tag-name">{{ tag.name }}</h3>
                <span class="tag-hash">#</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getTagList } from '~/composables/api/tag'
import PageCurtain from '~/components/layouts/PageCurtain.vue'
import type { TagItem } from '~/composables/useApi'

interface TagCardItem extends TagItem {
  displayCount: number
}

const { data, pending } = await useAsyncData(
  'tags-page',
  async () => {
    try {
      const response = await getTagList({ page_size: 50 })
      const list = response.data.list || []

      const items: TagCardItem[] = list
        .map((item) => ({
          ...item,
          displayCount: item.count || 0
        }))
        .sort((a, b) => b.displayCount - a.displayCount)

      return {
        tags: items,
        error: ''
      }
    } catch (error) {
      console.error(error)
      return {
        tags: [] as TagCardItem[],
        error: '标签页加载失败，请稍后重试'
      }
    }
  }
)

const sortedTags = computed(() => data.value?.tags || [])
const pageError = computed(() => data.value?.error || '')

const tagStats = computed(() => {
  const items = sortedTags.value
  return {
    totalTags: items.length,
    totalArticles: items.reduce((sum, item) => sum + (item.displayCount || 0), 0)
  }
})

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
.tags-page {
  min-height: 100vh;
  background: var(--home-surface);
  color: var(--home-text);
}

.content-section {
  position: relative;
  background: var(--home-surface);
  min-height: 100vh;
}

.content-shell {
  width: min(1000px, calc(100% - 60px));
  margin: 0 auto;
  padding: 72px 0 56px;
}

.tag-header {
  margin-bottom: 32px;
}

.tag-header-title {
  position: relative;
  display: inline-block;
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: var(--home-text);
}

.tag-header-underline {
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--brand-accent);
}

// Grid
.tag-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.tag-card {
  border-radius: 12px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.35s ease,
    box-shadow 0.35s ease,
    border-radius 0.35s cubic-bezier(0.22, 1, 0.36, 1);

  &:hover {
    transform: scale(1.04);
    border-color: var(--brand-accent);
    border-radius: 6px;
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--brand-accent) 30%, transparent),
      0 12px 28px -8px rgba(0, 0, 0, 0.24);
  }
}

.tag-card-inner {
  position: relative;
  padding: 24px 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.tag-total {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.tag-name {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--home-text);
  line-height: 1.2;
  z-index: 1;
}

.tag-hash {
  position: absolute;
  right: 8px;
  bottom: -8px;
  font-size: 72px;
  font-weight: 700;
  color: var(--home-text);
  opacity: 0.06;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}

// 空态 / 加载 / 错误
.loading-container,
.error-container {
  padding: 20px 0;
}

.empty-state {
  min-height: 240px;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 10px;
  color: var(--text-muted);

  h3,
  p {
    margin: 0;
  }

  h3 {
    font-size: 24px;
    color: var(--home-text);
  }
}

// 响应式
@media (max-width: 1200px) {
  .tag-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .content-shell {
    width: min(760px, calc(100% - 60px));
  }
}

@media (max-width: 820px) {
  .content-shell {
    width: min(760px, calc(100% - 40px));
  }

  .tag-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .tag-name {
    font-size: 24px;
  }

  .tag-hash {
    font-size: 60px;
  }
}

@media (max-width: 768px) {
  .content-shell {
    width: min(100%, calc(100% - 28px));
    padding: 40px 0 56px;
  }
}

@media (max-width: 520px) {
  .tag-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .tag-card-inner {
    padding: 18px 18px 22px;
    gap: 8px;
  }

  .tag-name {
    font-size: 20px;
  }

  .tag-total {
    font-size: 12px;
  }

  .tag-hash {
    font-size: 48px;
    right: 6px;
    bottom: -4px;
  }
}

@media (max-width: 380px) {
  .tag-grid {
    grid-template-columns: 1fr;
  }
}
</style>

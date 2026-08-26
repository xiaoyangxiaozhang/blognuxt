<template>
  <div class="filtered-page">
    <div class="filtered-shell">
      <NuxtLink to="/tags" class="back-link">
        <span aria-hidden="true">←</span>
        返回标签
      </NuxtLink>

      <ArticleMasonryFeed
        :title="`标签 · ${displayName}`"
        :fetch-params="{ tag: tagSlug }"
        search-placeholder="搜索当前标签文章"
        empty-text="该标签下暂无文章"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ArticleMasonryFeed from '~/components/articles/ArticleMasonryFeed.vue'

const route = useRoute()

const tagSlug = computed(() => String(route.params.slug || ''))
const displayName = computed(() => {
  const queryName = Array.isArray(route.query.name) ? route.query.name[0] : route.query.name
  return String(queryName || tagSlug.value)
})

useHead({
  title: computed(() => `标签：${displayName.value}`)
})
</script>

<style scoped lang="scss">
.filtered-page {
  min-height: 100vh;
  background: var(--home-surface);
  color: var(--home-text);
}

.filtered-shell {
  width: min(1000px, calc(100% - 60px));
  margin: 0 auto;
  padding: 104px 0 80px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 28px;
  color: var(--text-muted);
  font-size: 14px;
  text-decoration: none;
  transition: color var(--transition-fast), transform var(--transition-fast);

  &:hover {
    color: var(--brand-accent);
    transform: translateX(-2px);
  }

  &:focus-visible {
    outline: 2px solid var(--brand-accent);
    outline-offset: 4px;
    border-radius: 4px;
  }
}

@media (max-width: 1200px) {
  .filtered-shell {
    width: min(760px, calc(100% - 60px));
  }
}

@media (max-width: 768px) {
  .filtered-shell {
    width: min(100%, calc(100% - 60px));
    padding: 96px 0 56px;
  }
}
</style>

<template>
  <div class="notice-panel">
    <div class="notice-card">
      <span class="notice-badge">网站公告</span>
      <div class="notice-content" v-html="announcementHtml || fallbackAnnouncement"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  authorName: string
  authorDesc: string
  announcementHtml?: string
  totalArticles: number
  categories: Array<unknown>
  tags: Array<unknown>
}>()

const fallbackAnnouncement = computed(() => {
  return props.authorDesc || '内容会持续更新，欢迎常来看看。'
})
</script>

<style scoped lang="scss">
.notice-panel {
  width: 100%;
}

.notice-card {
  width: 100%;
  padding: 28px;
  border-radius: 15px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
}

.notice-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--home-accent-soft);
  color: var(--home-accent);
  font-size: 13px;
  margin-bottom: 16px;
}

.notice-content {
  color: var(--home-text-muted);
  line-height: 1.9;
  font-size: 15px;

  :deep(strong) {
    color: var(--home-text);
    font-weight: 700;
  }

  :deep(a) {
    color: var(--home-accent);
    text-decoration: none;
  }

  :deep(a:hover) {
    text-decoration: underline;
  }
}

@media (max-width: 768px) {
  .notice-card {
    padding: 22px;
  }
}
</style>

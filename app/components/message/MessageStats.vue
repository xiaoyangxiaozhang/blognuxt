<script setup lang="ts">
interface MessageStatsValue {
  totalArticles: string
  totalComments: string
  runningDays: string
  totalWords: string
}

defineProps<{
  stats: MessageStatsValue
  loading?: boolean
  errorText?: string
}>()
</script>

<template>
  <div class="stats-wrap">
    <article class="stats-card" :aria-busy="loading">
      <div class="stats-grid">
        <div class="stat-item">
          <strong>{{ stats.totalArticles }}</strong>
          <span>篇文章</span>
        </div>
        <div class="stat-item">
          <strong>{{ stats.totalComments }}</strong>
          <span>条公开留言</span>
        </div>
        <div class="stat-item">
          <strong>{{ stats.runningDays }}</strong>
          <span>稳定运行天数</span>
        </div>
        <div class="stat-item">
          <strong>{{ stats.totalWords }}</strong>
          <span>累计字数</span>
        </div>
      </div>
      <p v-if="loading" class="stats-loading" role="status">统计加载中…</p>
      <p v-if="errorText" class="stats-error" role="status">{{ errorText }}</p>
    </article>
  </div>
</template>

<style scoped lang="scss">
.stats-card {
  padding: 32px;
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background: var(--home-card-bg);
  color: var(--home-text);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}

.stat-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
}

.stat-item strong {
  color: var(--brand-accent);
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
  overflow-wrap: anywhere;
}

.stat-item span {
  color: var(--home-text);
  font-size: 13px;
  line-height: 1.5;
}

.stats-error {
  margin: 22px 0 0;
  color: var(--home-text);
  font-size: 14px;
}

.stats-loading {
  margin: 22px 0 0;
  color: var(--home-text);
  font-size: 14px;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .stats-card {
    padding: 24px 20px;
  }

  .stats-grid {
    gap: 22px 16px;
  }

  .stat-item strong {
    font-size: 28px;
  }
}
</style>

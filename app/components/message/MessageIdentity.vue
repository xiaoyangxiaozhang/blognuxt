<script setup lang="ts">
defineProps<{
  personality: string
  motto: string
  mottoSub?: string
}>()
</script>

<template>
  <div class="identity-grid">
    <article class="identity-card">
      <span class="card-eyebrow">性格</span>
      <strong class="identity-value">{{ personality || '待填写' }}</strong>
    </article>

    <article class="identity-card">
      <span class="card-eyebrow">座右铭</span>
      <p class="motto-text">{{ motto ? `「${motto}」` : '暂未填写座右铭' }}</p>
      <span v-if="mottoSub" class="card-caption">{{ mottoSub }}</span>
    </article>
  </div>
</template>

<style scoped lang="scss">
.identity-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 1fr);
  gap: 14px;
}

.identity-card {
  display: flex;
  min-height: 230px;
  flex-direction: column;
  padding: 30px;
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background: var(--home-card-bg);
  color: var(--home-text);
}

.card-eyebrow {
  display: block;
  margin-bottom: 18px;
  color: var(--home-text);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.identity-value {
  color: var(--home-text);
  font-size: 36px;
  font-weight: 600;
  line-height: 1.2;
}

.card-caption {
  display: block;
  margin-top: auto;
  padding-top: 24px;
  color: var(--home-text);
  font-size: 14px;
  line-height: 1.7;
}

.motto-text {
  margin: 0;
  color: var(--home-text);
  font-size: 23px;
  font-weight: 600;
  line-height: 1.55;
}

@media (max-width: 560px) {
  .identity-grid {
    grid-template-columns: 1fr;
  }

  .identity-card {
    min-height: 190px;
    padding: 24px 20px;
  }

  .identity-value {
    font-size: 32px;
  }

  .motto-text {
    font-size: 21px;
  }
}
</style>

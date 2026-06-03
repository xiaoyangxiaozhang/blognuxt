<template>
  <section class="placeholder-page">
    <div class="placeholder-card">
      <div class="placeholder-icon">
        <IconMaterialSymbolsGroupOutlineRounded />
      </div>
      <h1 class="placeholder-title">友链</h1>
      <p class="placeholder-desc">友情链接正在整理中，好朋友们即将上线。</p>
      <div class="placeholder-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import IconMaterialSymbolsGroupOutlineRounded from '~icons/material-symbols/group-outline-rounded'
</script>

<style scoped lang="scss">
.placeholder-page {
  min-height: 60vh;
  display: grid;
  place-content: center;
  padding: 40px 0;
}

.placeholder-card {
  display: grid;
  place-items: center;
  gap: 20px;
  padding: 56px 48px;
  border-radius: 14px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
  text-align: center;
  min-width: 360px;
}

.placeholder-icon {
  width: 88px;
  height: 88px;
  border-radius: 15px;
  background: var(--brand-accent-soft);
  color: var(--brand-accent);
  display: grid;
  place-items: center;

  :deep(svg) {
    width: 44px;
    height: 44px;
  }
}

.placeholder-title {
  margin: 0;
  font-size: 32px;
  line-height: 1;
  font-weight: 600;
  color: var(--home-text);
}

.placeholder-desc {
  margin: 0;
  max-width: 36ch;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-muted);
}

.placeholder-dots {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-accent);
  animation: dotPulse 1.6s var(--ease-out-expo) infinite;

  &:nth-child(2) {
    animation-delay: 0.18s;
  }

  &:nth-child(3) {
    animation-delay: 0.36s;
  }
}

@keyframes dotPulse {
  0%, 60%, 100% {
    opacity: 0.28;
    transform: scale(0.7);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot {
    animation: none;
    opacity: 0.5;
  }
}

@media (max-width: 768px) {
  .placeholder-card {
    min-width: auto;
    padding: 44px 32px;
  }

  .placeholder-icon {
    width: 72px;
    height: 72px;
    border-radius: 14px;

    :deep(svg) {
      width: 36px;
      height: 36px;
    }
  }

  .placeholder-title {
    font-size: 28px;
  }
}
</style>

<script setup lang="ts">
import AboutModel from '~/components/about/AboutModel.vue'

withDefaults(defineProps<{
  authorName?: string
  description?: string
  tips?: string
  modelEnabled?: boolean
  modelUrl?: string
  modelCredit?: string
  modelRotate?: boolean
  modelControl?: boolean
  modelZoom?: boolean
  fallbackImageUrl?: string
}>(), {
  authorName: '博客作者',
  description: '',
  tips: '',
  modelEnabled: true,
  modelUrl: '',
  modelCredit: '',
  modelRotate: true,
  modelControl: true,
  modelZoom: false,
  fallbackImageUrl: ''
})
</script>

<template>
  <section class="message-hero" aria-labelledby="message-hero-title">
    <div class="hero-copy">
      <p class="hero-greeting">你好！</p>
      <h1 id="message-hero-title" class="hero-title">
        我是 <span>{{ authorName }}</span>
      </h1>
      <p v-if="description" class="hero-description">{{ description }}</p>
      <p v-if="tips" class="hero-tips">{{ tips }}</p>

      <nav class="hero-actions" aria-label="页面区块导航">
        <a href="#profile-section" class="hero-action hero-action-primary">了解博主</a>
        <a href="#message-board-section" class="hero-action">直接留言</a>
      </nav>
    </div>

    <div class="model-stage" :title="modelCredit || undefined">
      <ClientOnly>
        <AboutModel
          v-if="modelEnabled && modelUrl"
          :model-url="modelUrl"
          :fallback-image-url="fallbackImageUrl"
          :fallback-alt="authorName"
          :auto-rotate="modelRotate"
          :enable-controls="modelControl"
          :enable-zoom="modelZoom"
          model-alt="博客作者的 3D 角色"
        />
        <img v-else-if="fallbackImageUrl" :src="fallbackImageUrl" :alt="authorName" />
        <span v-else class="model-unavailable">暂未配置 3D 模型</span>
        <template #fallback>
          <span class="model-loading-fallback" role="status">正在加载 3D 模型…</span>
        </template>
      </ClientOnly>

      <div class="model-stage-footer">
        <span>可替换模型</span>
        <span v-if="modelCredit">{{ modelCredit }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.message-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
  align-items: center;
  gap: 64px;
  min-height: 560px;
  padding: 72px 0 88px;
}

.hero-copy {
  max-width: 680px;
}

.hero-greeting {
  margin: 0 0 8px;
  color: var(--home-text);
  font-size: 24px;
  line-height: 1.35;
}

.hero-title {
  margin: 0;
  color: var(--home-text);
  font-size: clamp(42px, 5.2vw, 72px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.04em;

  span {
    color: var(--brand-accent);
  }
}

.hero-description {
  max-width: 620px;
  margin: 32px 0 0;
  color: var(--home-text);
  font-size: 18px;
  line-height: 1.85;
}

.hero-tips {
  margin: 16px 0 0;
  color: var(--home-text);
  font-size: 14px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 36px;
}

.hero-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0 18px;
  border: 1px solid var(--home-border);
  border-radius: 999px;
  color: var(--home-text);
  background: var(--home-card-bg);
  font-size: 14px;
  line-height: 1;
  text-decoration: none;
  transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);

  &:hover,
  &:focus-visible {
    border-color: var(--brand-accent);
    background: var(--brand-accent-soft);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--brand-accent);
    outline-offset: 3px;
  }
}

.hero-action-primary {
  border-color: var(--brand-accent);
  color: var(--text-on-accent);
  background: var(--brand-accent);
}

.hero-action:not(.hero-action-primary) {
  padding-right: 2px;
  padding-left: 2px;
  border-color: transparent;
  color: var(--home-text);
  background: transparent;

  &::after {
    margin-left: 8px;
    color: var(--brand-accent);
    content: '↗';
    font-size: 16px;
  }

  &:hover,
  &:focus-visible {
    border-color: transparent;
    color: var(--home-text);
    background: transparent;
    transform: translateX(2px);
  }
}

.model-stage {
  position: relative;
  display: flex;
  min-height: 400px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--home-border);
  border-radius: 16px;
  background: var(--home-card-bg);

  :deep(.about-model) {
    min-height: 400px;
  }

  > img {
    width: 100%;
    height: 100%;
    min-height: 400px;
    object-fit: cover;
  }
}

.model-stage-footer {
  position: absolute;
  right: 24px;
  bottom: 18px;
  left: 24px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  overflow: hidden;
  color: var(--home-text);
  font-size: 13px;
  line-height: 1.4;
  pointer-events: none;

  span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.model-loading-fallback,
.model-unavailable {
  color: var(--home-text);
  font-size: 14px;
}

@media (max-width: 900px) {
  .message-hero {
    grid-template-columns: 1fr;
    gap: 36px;
    min-height: 0;
    padding: 48px 0 64px;
  }

  .model-stage {
    width: min(100%, 420px);
    min-height: 360px;
  }

  .model-stage :deep(.about-model),
  .model-stage > img {
    min-height: 360px;
  }
}

@media (max-width: 560px) {
  .message-hero {
    padding: 36px 0 48px;
  }

  .hero-greeting {
    font-size: 22px;
  }

  .hero-description {
    margin-top: 24px;
    font-size: 16px;
  }

  .hero-actions {
    margin-top: 28px;
  }

  .model-stage {
    min-height: 300px;
  }

  .model-stage :deep(.about-model),
  .model-stage > img {
    min-height: 300px;
  }

  .model-stage-footer {
    right: 16px;
    bottom: 14px;
    left: 16px;
  }
}
</style>

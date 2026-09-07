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
  authorName: '小羊嚣张',
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

const defaultDescription = `我写前端，也折腾这个博客。
偶尔记录一些技术，
偶尔只是觉得某件事情值得留下来。

这个博客大概从 2023 年开始存在。
中间改过很多次版，删过一些东西，
也留下了一些现在回头看觉得挺奇怪的文章。

不过没关系，能一直写下去就挺好的。`
</script>

<template>
  <section class="message-hero" aria-labelledby="message-hero-title">
    <div class="hero-copy">
      <p class="page-label">关于</p>
      <h1 id="message-hero-title" class="hero-title">
        你好，<br />
        我是 <span>{{ authorName }}</span>。
      </h1>

      <div class="hero-description">
        <p>{{ description || defaultDescription }}</p>
        <p v-if="tips">{{ tips }}</p>
      </div>
    </div>

    <figure class="hero-visual">
      <div class="model-stage">
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
          <span v-else class="model-unavailable">暂未配置个人图片</span>
          <template #fallback>
            <span class="model-loading-fallback" role="status">正在加载…</span>
          </template>
        </ClientOnly>
      </div>

      <figcaption v-if="modelCredit" class="model-credit">{{ modelCredit }}</figcaption>
    </figure>
  </section>
</template>

<style scoped lang="scss">
.message-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.8fr);
  align-items: start;
  gap: 88px;
  padding: 44px 0 80px;
}

.hero-copy,
.hero-visual {
  animation: message-rise 400ms both;
}

.hero-visual {
  animation-delay: 80ms;
}

.page-label {
  margin: 0 0 36px;
  color: var(--home-text-muted);
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
}

.hero-title {
  margin: 0;
  color: var(--home-text);
  font-family: 'Songti SC', STSong, 'Noto Serif CJK SC', serif;
  font-size: clamp(48px, 5vw, 64px);
  font-weight: 500;
  line-height: 1.24;
  letter-spacing: -0.04em;
}

.hero-title span {
  color: var(--brand-accent);
}

.hero-description {
  max-width: 620px;
  margin-top: 34px;
  color: var(--home-text);
  font-size: 16px;
  line-height: 2;
  white-space: pre-line;
}

.hero-description p {
  margin: 0 0 24px;
}

.hero-description p:last-child {
  margin-bottom: 0;
}

.hero-visual {
  width: min(100%, 410px);
  justify-self: end;
  margin: 28px 0 0;
}

.model-stage {
  position: relative;
  display: flex;
  width: 100%;
  aspect-ratio: 4 / 5;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--home-border);
  border-radius: 4px;
  background: var(--home-card-alt);
}

.model-stage :deep(.about-model) {
  min-height: 0;
}

.model-stage > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-loading-fallback,
.model-unavailable {
  color: var(--home-text-muted);
  font-size: 13px;
}

.model-credit {
  margin: 10px 0 0;
  color: var(--home-text-muted);
  font-size: 11px;
  line-height: 1.5;
}

@keyframes message-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1199px) {
  .message-hero {
    grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
    gap: 56px;
  }
}

@media (max-width: 767px) {
  .message-hero {
    grid-template-columns: 1fr;
    gap: 44px;
    padding: 28px 0 72px;
  }

  .page-label {
    margin-bottom: 28px;
    font-size: 26px;
  }

  .hero-title {
    font-size: 46px;
  }

  .hero-description {
    margin-top: 28px;
    font-size: 15px;
  }

  .hero-visual {
    width: min(100%, 410px);
    justify-self: start;
    margin-top: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-copy,
  .hero-visual {
    animation: none;
  }
}
</style>

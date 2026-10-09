<script setup lang="ts">
const AboutModel = defineAsyncComponent(() => import('~/components/about/AboutModel.vue'))

withDefaults(defineProps<{
  authorName?: string
  description?: string
  modelEnabled?: boolean
  modelUrl?: string
  modelRotate?: boolean
  modelControl?: boolean
  modelZoom?: boolean
  fallbackImageUrl?: string
}>(), {
  authorName: '小羊嚣张',
  description: '',
  modelEnabled: true,
  modelUrl: '',
  modelRotate: true,
  modelControl: true,
  modelZoom: false,
  fallbackImageUrl: ''
})

const defaultDescription = '这里记录技术、生活，以及一些仍在思考的问题。'
const titleRevealState = ref<'idle' | 'active' | 'leaving'>('idle')
const titleRevealPosition = ref({ x: '50%', y: '50%' })

const titleRevealStyle = computed(() => ({
  '--title-reveal-x': titleRevealPosition.value.x,
  '--title-reveal-y': titleRevealPosition.value.y
}))

function onTitlePointerMove(event: PointerEvent) {
  if (event.pointerType === 'touch') return

  const title = event.currentTarget as HTMLElement
  const bounds = title.getBoundingClientRect()
  const pointerX = event.clientX - bounds.left
  const pointerY = event.clientY - bounds.top

  titleRevealPosition.value = {
    x: `${pointerX}px`,
    y: `${pointerY}px`
  }
  titleRevealState.value = 'active'
}

function onTitlePointerLeave(event: PointerEvent) {
  if (event.pointerType === 'touch') return

  const title = event.currentTarget as HTMLElement
  const bounds = title.getBoundingClientRect()
  const radius = Number.parseFloat(getComputedStyle(title, '::before').width) / 2
  const pointerX = event.clientX - bounds.left
  const pointerY = event.clientY - bounds.top
  let exitX = Math.min(bounds.width - radius, Math.max(radius, pointerX))
  let exitY = Math.min(bounds.height - radius, Math.max(radius, pointerY))

  if (pointerX < 0) exitX = -radius
  else if (pointerX > bounds.width) exitX = bounds.width + radius
  else if (pointerY < 0) exitY = -radius
  else if (pointerY > bounds.height) exitY = bounds.height + radius

  titleRevealPosition.value = { x: `${exitX}px`, y: `${exitY}px` }
  titleRevealState.value = 'leaving'
}
</script>

<template>
  <section class="message-hero" aria-labelledby="message-hero-title">
    <div class="hero-copy">
      <div
        class="hero-title-wrap"
        :class="{
          'has-reveal': titleRevealState !== 'idle',
          'is-revealing': titleRevealState === 'active',
          'is-leaving': titleRevealState === 'leaving'
        }"
        :style="titleRevealStyle"
        @pointermove="onTitlePointerMove"
        @pointerleave="onTitlePointerLeave"
      >
        <p class="page-label">关于</p>
        <h1 id="message-hero-title" class="hero-title">
          你好，<br />
          我是 <span>{{ authorName }}</span>。
        </h1>
        <div class="hero-title-reveal" aria-hidden="true">
          <p class="page-label">关于</p>
          <div class="hero-title">
            你好，<br />
            我是 <span>{{ authorName }}</span>。
          </div>
        </div>
      </div>

      <div class="hero-description">
        <p>{{ description || defaultDescription }}</p>
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

.hero-copy {
  text-align: center;
}

.hero-visual {
  animation-delay: 80ms;
}

.page-label {
  margin: 0 0 18px;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.hero-title {
  position: relative;
  z-index: 0;
  margin: 0;
  color: var(--home-text);
  font-family: var(--blog-font-family, 'Songti SC'), STSong, 'Noto Serif CJK SC', serif;
  font-size: clamp(48px, 5vw, 64px);
  font-weight: 500;
  line-height: 1.24;
  letter-spacing: -0.04em;
}

.hero-title-wrap {
  --title-reveal-radius: clamp(56px, 5vw, 72px);
  --title-reveal-size: clamp(112px, 10vw, 144px);

  position: relative;
  width: 100vw;
  max-width: 100vw;
  overflow: hidden;
  padding-block: 8px;
  margin-block: -8px;
  margin-left: calc(50% - 50vw);
}

.hero-title-wrap::before {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  box-sizing: border-box;
  width: var(--title-reveal-size);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--home-text);
  content: '';
  opacity: 0;
  pointer-events: none;
  transform: translate3d(var(--title-reveal-x, 50%), var(--title-reveal-y, 50%), 0) translate(-50%, -50%);
  transition:
    transform 110ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 280ms linear;
}

.hero-title-wrap.has-reveal::before {
  opacity: 1;
  transition-property: transform;
}

.hero-title-wrap.is-leaving::before {
  opacity: 0;
  transition-property: transform, opacity;
  transition-duration: 200ms, 280ms;
  transition-timing-function: cubic-bezier(0.77, 0, 0.175, 1), linear;
}

.hero-title-reveal {
  position: absolute;
  z-index: 2;
  inset: 0;
  padding-block: 8px;
  text-align: center;
  clip-path: circle(var(--title-reveal-radius) at var(--title-reveal-x, 50%) var(--title-reveal-y, 50%));
  opacity: 0;
  pointer-events: none;
  transition:
    clip-path 110ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 280ms linear;
}

.hero-title-wrap.has-reveal .hero-title-reveal {
  opacity: 1;
  transition-property: clip-path;
}

.hero-title-wrap.is-leaving .hero-title-reveal {
  opacity: 0;
  transition-property: clip-path, opacity;
  transition-duration: 200ms, 280ms;
  transition-timing-function: cubic-bezier(0.77, 0, 0.175, 1), linear;
}

.hero-title span {
  color: var(--message-name-accent, var(--brand-accent));
}

.hero-title-reveal .page-label,
.hero-title-reveal .hero-title,
.hero-title-reveal .hero-title span {
  color: var(--home-surface);
}

:global([data-theme='blue-white']) .message-hero {
  --message-name-accent: color-mix(in srgb, var(--brand-accent) 54%, #000000);
}

.hero-description {
  max-width: 620px;
  margin: 34px auto 0;
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
  aspect-ratio: 1 / 1;
  align-items: center;
  justify-content: center;
  overflow: hidden;
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
  color: var(--text-secondary);
  font-size: 13px;
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
    margin-bottom: 18px;
    font-size: 15px;
  }

  .hero-title {
    font-size: 46px;
  }

  .hero-title-wrap {
    --title-reveal-radius: clamp(48px, 8vw, 56px);
    --title-reveal-size: clamp(96px, 16vw, 112px);
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

  .hero-title-reveal {
    display: none;
  }

  .hero-title-wrap::before {
    display: none;
  }

}
</style>

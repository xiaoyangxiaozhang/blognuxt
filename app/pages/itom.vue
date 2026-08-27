<template>
  <div
    ref="pageRoot"
    class="itom-lite-page"
    @mousemove="handlePointerMove"
    @mouseleave="resetPointer"
  >
    <section class="itom-hero" aria-labelledby="itom-hero-title">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-ring hero-ring-one" aria-hidden="true"></div>
      <div class="hero-ring hero-ring-two" aria-hidden="true"></div>

      <div class="hero-copy">
        <p class="eyebrow">ITOM / LITE EXPERIENCE</p>
        <h1 id="itom-hero-title" class="hero-title">
          Build things
          <span>people remember.</span>
        </h1>
        <p class="hero-description">
          一个放进博客里的小型创意实验室：用滚动、纸张质感和轻量交互，记录我正在做的东西。
        </p>
        <button class="hero-cta" type="button" @click="scrollToRooms">
          <span>Walk into the sketchbook</span>
          <span class="cta-arrow" aria-hidden="true">↓</span>
        </button>
      </div>

      <div class="hero-side-note" aria-hidden="true">
        <span>SCROLL TO EXPLORE</span>
        <i></i>
      </div>

      <div class="hero-stamp" aria-hidden="true">
        <span>MADE</span>
        <strong>BY<br />CODE</strong>
        <span>2026</span>
      </div>
    </section>

    <section ref="roomsRef" class="itom-corridor" aria-labelledby="itom-rooms-title">
      <div class="section-heading" data-scroll-reveal>
        <div>
          <p class="eyebrow">THE SKETCHBOOK</p>
          <h2 id="itom-rooms-title">Choose a room.</h2>
        </div>
        <p class="section-caption">
          不复制原项目的重型 3D 场景，只保留“走进不同房间”的叙事方式。
        </p>
      </div>

      <div class="room-grid">
        <NuxtLink
          v-for="(room, index) in rooms"
          :key="room.label"
          :to="room.to"
          class="room-card"
          data-scroll-reveal
          :style="{ '--room-index': index }"
        >
          <div class="room-card-top">
            <span class="room-number">0{{ index + 1 }}</span>
            <span class="room-arrow" aria-hidden="true">↗</span>
          </div>
          <div class="room-glyph" aria-hidden="true">{{ room.glyph }}</div>
          <div class="room-card-content">
            <p class="room-kicker">{{ room.kicker }}</p>
            <h3>{{ room.label }}</h3>
            <p>{{ room.description }}</p>
          </div>
          <span class="room-entry">Enter room</span>
        </NuxtLink>
      </div>
    </section>

    <section class="itom-note" data-scroll-reveal aria-label="轻量化说明">
      <div class="note-mark" aria-hidden="true">✳</div>
      <div>
        <p class="eyebrow">A SMALL NOTE</p>
        <p class="note-copy">
          这个页面只在访问时加载，使用现有博客布局、主题变量和路由，不会把 3D 资源拖进首页。
        </p>
      </div>
      <span class="note-line" aria-hidden="true"></span>
    </section>

    <section class="itom-final" data-scroll-reveal aria-labelledby="itom-final-title">
      <p class="eyebrow">KEEP EXPLORING</p>
      <h2 id="itom-final-title">The best projects<br /><em>stay in motion.</em></h2>
      <NuxtLink class="final-link" to="/">
        <span>Back to the blog</span>
        <span aria-hidden="true">↗</span>
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useScrollReveal } from '~/composables/useScrollReveal'

useSeoMeta({
  title: 'ITom Lite — 小羊嚣张',
  description: '小羊嚣张博客里的 ITom 轻量化创意实验室。'
})

const pageRoot = ref<HTMLElement | null>(null)
const roomsRef = ref<HTMLElement | null>(null)

const rooms = [
  {
    label: 'Gallery',
    kicker: 'Selected work',
    glyph: '▧',
    description: '从博客文章和实践里，整理值得再次打开的作品。',
    to: '/archive'
  },
  {
    label: 'Studio',
    kicker: 'In progress',
    glyph: '✦',
    description: '记录正在试验的界面、动效和一些还没完成的想法。',
    to: '/dynamic'
  },
  {
    label: 'About',
    kicker: 'The person behind',
    glyph: '◌',
    description: '通过文章和动态，了解我在学习和构建什么。',
    to: '/friends'
  },
  {
    label: 'Contact',
    kicker: 'Say hello',
    glyph: '↗',
    description: '如果你有想法、反馈，或者只是想打个招呼，欢迎留言。',
    to: '/message'
  }
]

const { refresh } = useScrollReveal(pageRoot, {
  rootMargin: '0px 0px -10% 0px',
  threshold: 0.14
})

const setPointer = (x: number, y: number) => {
  pageRoot.value?.style.setProperty('--itom-pointer-x', `${x}%`)
  pageRoot.value?.style.setProperty('--itom-pointer-y', `${y}%`)
}

const handlePointerMove = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const bounds = target.getBoundingClientRect()
  setPointer(
    ((event.clientX - bounds.left) / bounds.width) * 100,
    ((event.clientY - bounds.top) / bounds.height) * 100
  )
}

const resetPointer = () => setPointer(50, 35)

const scrollToRooms = () => {
  roomsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  resetPointer()
  refresh()
})

onBeforeUnmount(() => {
  pageRoot.value?.style.removeProperty('--itom-pointer-x')
  pageRoot.value?.style.removeProperty('--itom-pointer-y')
})
</script>

<style scoped lang="scss">
.itom-lite-page {
  --itom-pointer-x: 50%;
  --itom-pointer-y: 35%;
  --itom-ink: var(--text-primary);
  --itom-muted: var(--text-muted);
  --itom-line: var(--border-color);
  --itom-accent: var(--brand-accent);
  --itom-paper: var(--bg-secondary);
  position: relative;
  overflow: hidden;
  padding-top: 86px;
  background:
    radial-gradient(circle at var(--itom-pointer-x) var(--itom-pointer-y), var(--brand-accent-soft), transparent 26rem),
    var(--bg-primary);
  color: var(--itom-ink);
}

.itom-lite-page::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.22;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.16'/%3E%3C/svg%3E");
  content: '';
}

.itom-hero,
.itom-corridor,
.itom-note,
.itom-final {
  position: relative;
  z-index: 1;
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
}

.itom-hero {
  min-height: min(780px, calc(100svh - 86px));
  display: flex;
  align-items: center;
  padding: 96px 0 140px;
}

.hero-copy {
  position: relative;
  z-index: 2;
  max-width: 780px;
}

.eyebrow {
  margin: 0 0 20px;
  color: var(--itom-accent);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.22em;
  line-height: 1.4;
  text-transform: uppercase;
}

.hero-title {
  max-width: 780px;
  margin: 0;
  font-size: clamp(58px, 9vw, 130px);
  font-weight: 800;
  letter-spacing: -0.075em;
  line-height: 0.88;
}

.hero-title span {
  display: block;
  margin-left: clamp(28px, 8vw, 116px);
  color: transparent;
  -webkit-text-stroke: 1px var(--itom-ink);
}

.hero-description {
  max-width: 470px;
  margin: 38px 0 30px;
  color: var(--itom-muted);
  font-size: 16px;
  line-height: 1.8;
}

.hero-cta,
.final-link {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  border: 1px solid var(--itom-ink);
  padding: 13px 16px 13px 19px;
  color: var(--itom-ink);
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-decoration: none;
  cursor: pointer;
  transition: color 220ms ease, background-color 220ms ease, transform 220ms ease;
}

.hero-cta:hover,
.final-link:hover {
  color: var(--bg-primary);
  background: var(--itom-ink);
  transform: translateY(-3px);
}

.cta-arrow {
  font-size: 18px;
  line-height: 0.7;
}

.hero-grid {
  position: absolute;
  top: 8%;
  right: -10%;
  width: min(58vw, 700px);
  height: 76%;
  opacity: 0.55;
  background-image: linear-gradient(var(--itom-line) 1px, transparent 1px), linear-gradient(90deg, var(--itom-line) 1px, transparent 1px);
  background-size: 38px 38px;
  mask-image: linear-gradient(90deg, transparent, black 30%, black 80%, transparent);
  transform: rotate(-8deg) translate3d(calc((var(--itom-pointer-x) - 50%) * -0.12), calc((var(--itom-pointer-y) - 50%) * -0.12), 0);
  transition: transform 180ms ease-out;
}

.hero-ring {
  position: absolute;
  right: 7%;
  width: min(30vw, 360px);
  aspect-ratio: 1;
  border: 1px solid var(--itom-ink);
  border-radius: 50%;
  opacity: 0.16;
  transform: translate3d(calc((var(--itom-pointer-x) - 50%) * 0.2), calc((var(--itom-pointer-y) - 50%) * 0.2), 0);
  transition: transform 220ms ease-out;
}

.hero-ring::after {
  position: absolute;
  inset: 10%;
  border: 1px dashed var(--itom-ink);
  border-radius: inherit;
  content: '';
}

.hero-ring-one {
  top: 16%;
}

.hero-ring-two {
  top: 24%;
  right: 13%;
  width: min(19vw, 230px);
  opacity: 0.11;
}

.hero-side-note {
  position: absolute;
  right: 0;
  bottom: 82px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--itom-muted);
  font-size: 10px;
  letter-spacing: 0.2em;
  writing-mode: vertical-rl;
}

.hero-side-note i {
  width: 1px;
  height: 70px;
  background: var(--itom-ink);
}

.hero-stamp {
  position: absolute;
  right: 21%;
  bottom: 100px;
  display: grid;
  gap: 2px;
  width: 94px;
  height: 94px;
  align-content: center;
  border: 1px solid var(--itom-ink);
  border-radius: 50%;
  color: var(--itom-ink);
  font-size: 9px;
  letter-spacing: 0.16em;
  line-height: 1.2;
  text-align: center;
  transform: rotate(12deg);
}

.hero-stamp strong {
  font-size: 15px;
  letter-spacing: 0.05em;
}

.itom-corridor {
  padding: 40px 0 130px;
  scroll-margin-top: 84px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 48px;
  margin-bottom: 42px;
}

.section-heading h2,
.itom-final h2 {
  margin: 0;
  font-size: clamp(42px, 6vw, 78px);
  font-weight: 750;
  letter-spacing: -0.06em;
  line-height: 0.95;
}

.section-caption {
  max-width: 290px;
  margin: 0 0 4px;
  color: var(--itom-muted);
  font-size: 13px;
  line-height: 1.7;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.room-card {
  position: relative;
  min-height: 390px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--itom-line);
  padding: 18px;
  color: var(--itom-ink);
  background: color-mix(in srgb, var(--itom-paper) 78%, transparent);
  text-decoration: none;
  transform: translateY(24px) rotate(calc((var(--room-index) - 1.5) * 0.45deg));
  transition: border-color 260ms ease, background-color 260ms ease, transform 260ms ease, box-shadow 260ms ease;
}

.room-card.is-revealed {
  transform: translateY(0) rotate(calc((var(--room-index) - 1.5) * 0.45deg));
  transition-delay: calc(var(--room-index) * 70ms);
}

.room-card:hover {
  z-index: 2;
  border-color: var(--itom-accent);
  background: color-mix(in srgb, var(--itom-paper) 94%, var(--itom-accent));
  box-shadow: 0 20px 40px color-mix(in srgb, var(--shadow-color) 80%, transparent);
  transform: translateY(-10px) rotate(0deg);
}

.room-card-top,
.room-card-content,
.room-entry {
  position: relative;
  z-index: 1;
}

.room-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--itom-muted);
  font-size: 11px;
  letter-spacing: 0.12em;
}

.room-arrow {
  color: var(--itom-accent);
  font-size: 24px;
  font-weight: 300;
}

.room-glyph {
  position: absolute;
  top: 78px;
  right: 14px;
  color: var(--itom-accent);
  font-size: 100px;
  font-weight: 200;
  line-height: 1;
  opacity: 0.18;
  transform: rotate(-12deg);
  transition: opacity 260ms ease, transform 260ms ease;
}

.room-card:hover .room-glyph {
  opacity: 0.38;
  transform: rotate(4deg) scale(1.1);
}

.room-card-content {
  margin-top: auto;
}

.room-kicker {
  margin: 0 0 10px;
  color: var(--itom-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

.room-card h3 {
  margin: 0 0 12px;
  font-size: 30px;
  letter-spacing: -0.05em;
}

.room-card-content > p:last-child {
  max-width: 210px;
  margin: 0;
  color: var(--itom-muted);
  font-size: 13px;
  line-height: 1.7;
}

.room-entry {
  margin-top: 28px;
  padding-top: 12px;
  border-top: 1px solid var(--itom-line);
  color: var(--itom-muted);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.itom-note {
  display: flex;
  align-items: center;
  gap: 24px;
  border-top: 1px solid var(--itom-line);
  border-bottom: 1px solid var(--itom-line);
  padding: 26px 0;
}

.note-mark {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--itom-accent);
  border-radius: 50%;
  color: var(--itom-accent);
  font-size: 22px;
}

.note-copy {
  max-width: 560px;
  margin: 0;
  color: var(--itom-muted);
  font-size: 14px;
  line-height: 1.7;
}

.note-line {
  width: 72px;
  height: 1px;
  margin-left: auto;
  background: var(--itom-accent);
}

.itom-final {
  padding: 150px 0 180px;
}

.itom-final h2 {
  max-width: 740px;
}

.itom-final h2 em {
  color: var(--itom-accent);
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 400;
}

.final-link {
  margin-top: 40px;
}

[data-scroll-reveal] {
  opacity: 0;
  transition: opacity 650ms ease, transform 650ms cubic-bezier(0.22, 1, 0.36, 1);
}

[data-scroll-reveal].is-revealed {
  opacity: 1;
  transform: translateY(0);
}

.section-heading[data-scroll-reveal] {
  transform: translateY(18px);
}

.itom-note[data-scroll-reveal],
.itom-final[data-scroll-reveal] {
  transform: translateY(22px);
}

@media (max-width: 900px) {
  .itom-lite-page {
    padding-top: 72px;
  }

  .itom-hero {
    min-height: calc(100svh - 72px);
    padding: 76px 0 120px;
  }

  .hero-stamp {
    right: 12%;
    bottom: 76px;
  }

  .room-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .itom-hero,
  .itom-corridor,
  .itom-note,
  .itom-final {
    width: min(100% - 32px, 480px);
  }

  .itom-hero {
    min-height: calc(100svh - 72px);
    align-items: start;
    padding-top: 86px;
  }

  .hero-title {
    font-size: clamp(52px, 16vw, 80px);
  }

  .hero-title span {
    margin-left: 22px;
  }

  .hero-description {
    max-width: 330px;
    font-size: 14px;
  }

  .hero-grid {
    top: 34%;
    right: -38%;
    width: 130vw;
    height: 46%;
  }

  .hero-ring {
    top: 42%;
    right: -8%;
    width: 62vw;
  }

  .hero-ring-two,
  .hero-side-note {
    display: none;
  }

  .hero-stamp {
    right: 4%;
    bottom: 54px;
    width: 78px;
    height: 78px;
  }

  .hero-stamp strong {
    font-size: 12px;
  }

  .section-heading {
    display: block;
  }

  .section-caption {
    margin-top: 20px;
  }

  .room-grid {
    grid-template-columns: 1fr;
  }

  .room-card {
    min-height: 300px;
    transform: translateY(24px) !important;
  }

  .room-card.is-revealed {
    transform: translateY(0) !important;
  }

  .itom-note {
    align-items: start;
  }

  .note-line {
    display: none;
  }

  .itom-final {
    padding: 110px 0 130px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-grid,
  .hero-ring,
  .room-card,
  .room-card.is-revealed,
  .room-card:hover,
  [data-scroll-reveal],
  [data-scroll-reveal].is-revealed {
    transform: none !important;
    transition: none !important;
  }
}
</style>

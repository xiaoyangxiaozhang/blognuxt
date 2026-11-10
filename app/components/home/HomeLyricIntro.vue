<template>
  <div
    ref="stage"
    class="lyric-intro"
    :class="{ 'is-started': ready, 'is-paused': !inView || !pageVisible }"
    :style="{ '--line-duration': `${lineDuration}ms` }"
  >
    <h1 class="lyric-accessible">{{ lines.join('，') }}</h1>
    <div class="lyric-heading" aria-hidden="true">
      <span class="lyric-static">
        <span v-for="(line, index) in lines" :key="index">{{ line }}</span>
      </span>
      <span class="lyric-motion">
        <span class="lyric-center">
          <!-- Reserve the tallest sentence so changing lines never moves the page. -->
          <span v-for="(line, index) in lines" :key="index" class="lyric-size">{{ line }}</span>
          <span :key="cycle" class="lyric-line" @animationend.self="advanceLine">
            <span
              v-for="(character, index) in characters"
              :key="index"
              class="lyric-character"
              :class="{ 'is-space': /\s/.test(character) }"
              :data-character="character"
              :style="{ '--character-delay': `${index * 180}ms` }"
            >{{ character }}</span>
          </span>
        </span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ lines: string[]; ready: boolean }>()
const stage = ref<HTMLElement | null>(null)
const cycle = ref(0)
const inView = ref(true)
const pageVisible = ref(true)
const lineIndex = computed(() => cycle.value % Math.max(1, props.lines.length))
const characters = computed(() => Array.from(props.lines[lineIndex.value] || ''))
const lineDuration = computed(() => Math.max(5200, characters.value.length * 180 + 2800))
let observer: IntersectionObserver | null = null

function advanceLine(event: AnimationEvent) {
  if (event.animationName.includes('lyric-sentence')) cycle.value++
}

function syncPageVisibility() {
  pageVisible.value = !document.hidden
}

watch(() => props.lines, () => { cycle.value = 0 })

onMounted(() => {
  syncPageVisibility()
  document.addEventListener('visibilitychange', syncPageVisibility)
  observer = new IntersectionObserver(([entry]) => {
    inView.value = Boolean(entry?.isIntersecting)
  }, { threshold: 0.1 })
  if (stage.value) observer.observe(stage.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', syncPageVisibility)
})
</script>

<style scoped>
.lyric-intro {
  --lyric-play-state: running;
  width: 100%;
  color: #fff;
  text-shadow: 0 2px 12px rgb(0 0 0 / 65%);
}

.is-paused { --lyric-play-state: paused; }

.lyric-heading {
  margin: 0;
  font-size: clamp(24px, 2.7vw, 38px);
  font-weight: 600;
  line-height: 1.55;
  letter-spacing: 0.04em;
}

.lyric-accessible {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.lyric-static { display: none; }
.lyric-motion { display: block; }

.lyric-center { display: grid; align-items: center; }
.lyric-size, .lyric-line { grid-area: 1 / 1; min-width: 0; overflow-wrap: anywhere; }
.lyric-size { visibility: hidden; white-space: pre-wrap; }
.lyric-character { position: relative; display: inline-block; white-space: pre; }
.lyric-character.is-space { width: 0.45em; }

.lyric-character::after {
  content: attr(data-character);
  position: absolute;
  inset: 0;
  color: var(--brand-accent);
  text-shadow: 0 0 8px var(--brand-accent), 0 0 20px var(--brand-accent);
  opacity: 0;
  pointer-events: none;
}

.is-started .lyric-line {
  animation: lyric-sentence var(--line-duration) linear both;
  animation-play-state: var(--lyric-play-state);
}

.is-started .lyric-character {
  animation: lyric-character-reveal 1200ms cubic-bezier(0.16, 1, 0.3, 1) var(--character-delay) both;
  animation-play-state: var(--lyric-play-state);
}

.is-started .lyric-character::after {
  animation: lyric-character-glow 1400ms ease-out var(--character-delay) both;
  animation-play-state: var(--lyric-play-state);
}

@keyframes lyric-character-reveal {
  0% { opacity: 0; filter: blur(5px); transform: translateY(0.42em) scale(0.85); }
  48% { opacity: 1; filter: blur(0); transform: translateY(-0.04em) scale(1.06); }
  100% { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }
}

@keyframes lyric-character-glow {
  0% { opacity: 0; }
  30% { opacity: 0.55; }
  100% { opacity: 0; }
}

@keyframes lyric-sentence {
  0%, 86% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-0.25em); }
}

@media (max-width: 768px) {
  .lyric-heading { font-size: clamp(20px, 5.5vw, 27px); letter-spacing: 0.02em; }
}

@media (prefers-reduced-motion: reduce) {
  .lyric-motion { display: none; }
  .lyric-static { display: grid; gap: 0.6em; font-size: 0.75em; }
  .is-started .lyric-line, .is-started .lyric-character, .is-started .lyric-character::after { animation: none; }
}
</style>

<template>
  <p :aria-label="pieces.length ? content : undefined">
    <span v-if="settled" :aria-hidden="pieces.length ? true : undefined">{{ settled }}</span><template v-for="piece in pieces" :key="piece.id">
      <span v-if="piece.text.trim()" class="chatbot-word" aria-hidden="true" :style="{ animationDelay: `${piece.delay}ms` }">{{ piece.text }}</span><template v-else>{{ piece.text }}</template>
    </template>
  </p>
</template>

<script setup lang="ts">
const props = defineProps<{ content: string; animate: boolean }>()
const settled = ref('')
const pieces = ref<Array<{ id: number; text: string; delay: number }>>([])
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh', { granularity: 'word' }) : null
let nextId = 0
let settleTimer: ReturnType<typeof setTimeout> | undefined

watch(() => props.content, (content, previous = '') => {
  clearTimeout(settleTimer)
  if (!props.animate || !content.startsWith(previous)) {
    settled.value = content
    pieces.value = []
    return
  }

  const text = content.slice(previous.length)
  const words = segmenter ? Array.from(segmenter.segment(text), item => item.segment) : Array.from(text)
  // Keep closing punctuation with its word instead of starting a new line.
  const tokens: string[] = []
  for (const word of words) {
    if (/^[，。！？、；：,.!?;:）】》」』]+$/u.test(word) && tokens.length && tokens[tokens.length - 1]!.trim()) tokens[tokens.length - 1] += word
    else tokens.push(word)
  }
  pieces.value.push(...tokens.map((word, index) => ({ id: nextId++, text: word, delay: Math.min(index * 18, 108) })))
  // Return settled replies to plain text, preserving normal wrapping and selection.
  settleTimer = setTimeout(() => {
    settled.value = props.content
    pieces.value = []
  }, 300)
}, { immediate: true })

onBeforeUnmount(() => clearTimeout(settleTimer))
</script>

<style scoped>
.chatbot-word {
  display: inline-block;
  max-width: 100%;
  vertical-align: baseline;
  animation: chatbot-reveal 180ms cubic-bezier(.23, 1, .32, 1) both;
}

@keyframes chatbot-reveal {
  from { opacity: 0; filter: blur(3px); transform: translateY(2px); }
  to { opacity: 1; filter: blur(0); transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .chatbot-word { animation: none; }
}
</style>

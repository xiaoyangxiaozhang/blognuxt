<template>
  <div class="page-curtain" :class="{ 'curtain-open': isOpen }">
    <div class="curtain-panel curtain-left"></div>
    <div class="curtain-panel curtain-right"></div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: boolean
}>(), {
  modelValue: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'opened'): void
}>()

const isOpen = ref(false)
let openedTimer: ReturnType<typeof setTimeout> | null = null
let reducedMotionQuery: MediaQueryList | null = null

const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
  if (!event.matches || !openedTimer) return
  clearTimeout(openedTimer)
  openedTimer = null
  emit('opened')
}

const openCurtain = () => {
  if (isOpen.value) return
  isOpen.value = true

  if (reducedMotionQuery?.matches ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    emit('opened')
    return
  }

  openedTimer = setTimeout(() => {
    openedTimer = null
    emit('opened')
  }, 360)
}

watch(() => props.modelValue, (val) => {
  if (import.meta.client && val) openCurtain()
})

// 如果初始化时就为 true，直接打开
onMounted(() => {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotionQuery.addEventListener('change', handleMotionPreferenceChange)
  if (props.modelValue) openCurtain()
})

onBeforeUnmount(() => {
  if (openedTimer) clearTimeout(openedTimer)
  reducedMotionQuery?.removeEventListener('change', handleMotionPreferenceChange)
  reducedMotionQuery = null
})
</script>

<style scoped lang="scss">
.page-curtain {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  pointer-events: none;

  .curtain-panel {
    width: 50%;
    height: 100%;
    background: var(--home-surface);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .curtain-left {
    transform-origin: left center;
  }

  .curtain-right {
    transform-origin: right center;
  }

  &.curtain-open {
    .curtain-left {
      transform: translateX(-100%);
    }

    .curtain-right {
      transform: translateX(100%);
    }
  }
}
</style>

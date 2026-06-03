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

watch(() => props.modelValue, (val) => {
  if (val && !isOpen.value) {
    isOpen.value = true
    setTimeout(() => {
      emit('opened')
    }, 900)
  }
})

// 如果初始化时就为 true，直接打开
onMounted(() => {
  if (props.modelValue) {
    isOpen.value = true
    setTimeout(() => {
      emit('opened')
    }, 900)
  }
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
    transition: transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
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

<template>
  <div class="image-upload-options">
    <label class="original-option">
      <input v-model="keepOriginalImages" type="checkbox" :disabled="disabled" />
      <span>保留原图</span>
    </label>
    <p>适用于本次会话的图片上传。PNG、WebP 和动图默认保留原文件；JPEG 文字截图建议勾选。</p>
  </div>
</template>

<script setup lang="ts">
import { useImageUploadPreference } from '~/composables/useImageUploadPreference'
const keepOriginalImages = useImageUploadPreference()
withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })
</script>

<style scoped>
.image-upload-options { margin: 8px 0; font-size: 12px; line-height: 1.5; color: var(--text-primary); }
.original-option { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.original-option input { width: 16px; height: 16px; margin: 0; accent-color: var(--accent); }
.original-option input:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.original-option:has(input:disabled) { cursor: default; opacity: 0.6; }
.image-upload-options p { margin: 4px 0 0; color: var(--text-secondary); }
</style>

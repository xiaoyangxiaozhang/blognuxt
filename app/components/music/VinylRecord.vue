<template>
  <span class="vinyl" :class="{ playing, instant, detailed }" aria-hidden="true">
    <svg :viewBox="detailed ? '-5 2 64 64' : '0 0 64 64'" fill="none">
      <defs>
        <clipPath :id="coverClipId"><circle cx="27" cy="34" r="23" /></clipPath>
      </defs>
      <g class="vinyl-disc">
        <circle cx="27" cy="34" r="23" fill="#191b20" />
        <g class="vinyl-grooves" stroke="#9699a2" stroke-width=".45">
          <circle cx="27" cy="34" r="19.5" />
          <circle cx="27" cy="34" r="17" />
          <circle v-if="detailed" cx="27" cy="34" r="14.5" />
          <circle v-if="detailed" cx="27" cy="34" r="12" />
        </g>
        <path class="vinyl-reflection" d="M12 28a16 16 0 0 1 10-9M32 49a16 16 0 0 0 10-9" stroke="#e1e3e8" stroke-width="1" stroke-linecap="round" />
        <circle cx="27" cy="34" r="6.5" fill="#bfc1c7" />
        <image
          v-if="showCover"
          :key="cover"
          :href="proxyImageUrl(cover)"
          x="4" y="11" width="46" height="46"
          preserveAspectRatio="xMidYMid slice"
          :clip-path="`url(#${coverClipId})`"
          @error="coverFailed = true"
        />
        <path v-else d="M22 34h10" stroke="#858892" stroke-width=".5" />
        <circle cx="27" cy="34" r="23" stroke="#72757e" stroke-width=".7" />
        <circle cx="27" cy="34" r="2" fill="#191b20" />
      </g>
      <g class="vinyl-arm" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <path d="M54 10v21c0 3-1 5-3 8l-2 3" stroke-width="1.6" />
        <path v-if="detailed" d="M55.8 12v18" stroke-width=".5" opacity=".4" />
        <rect x="47.3" y="39" width="4" height="7" rx=".8" transform="rotate(30 49.3 42.5)" fill="currentColor" stroke="none" />
      </g>
      <circle cx="54" cy="9" r="3" fill="#191b20" stroke="currentColor" stroke-width=".9" />
      <circle cx="54" cy="9" r=".8" fill="currentColor" />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { proxyImageUrl } from '~/utils/image'

const props = defineProps<{ playing?: boolean; instant?: boolean; detailed?: boolean; cover?: string }>()
const coverClipId = `vinyl-cover-${useId()}`
const coverFailed = ref(false)
const showCover = computed(() => Boolean(props.cover) && !coverFailed.value)
watch(() => props.cover, () => { coverFailed.value = false })
</script>

<style scoped>
.vinyl { display: inline-block; width: 36px; height: 36px; flex-shrink: 0; }
.vinyl svg { display: block; width: 100%; height: 100%; overflow: visible; }
.vinyl-disc { transform-origin: 27px 34px; animation: vinyl-turn 8s linear infinite; animation-play-state: paused; }
.vinyl-grooves { opacity: .25; }
.vinyl-reflection { opacity: .23; }
.vinyl-arm { transform-origin: 54px 9px; transform: rotate(0deg); transition: transform 240ms cubic-bezier(.23, 1, .32, 1); }
.playing .vinyl-disc { animation-play-state: running; }
.playing .vinyl-arm { transform: rotate(24deg); }
.instant .vinyl-arm { transition: none; }
@keyframes vinyl-turn { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .vinyl-disc { animation: none; }
  .vinyl-arm { transition: none; }
}
</style>

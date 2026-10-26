<template>
  <div v-if="music.currentTrack" class="music-trigger" :class="{ compact }">
    <button
      class="music-record-toggle"
      type="button"
      :aria-label="music.panelOpen ? '收起音乐面板' : '打开音乐面板'"
      :title="music.panelOpen ? '收起音乐面板' : '打开音乐面板'"
      :aria-expanded="music.panelOpen"
      :aria-busy="music.panelOpen && !music.panelReady"
      aria-controls="site-music-panel"
      @click="music.panelOpen ? music.closePanel() : music.openPanel($event)"
    >
      <VinylRecord :cover="music.currentTrack.cover" :playing="music.isPlaying && !music.isLoading" :instant="music.instant" />
    </button>
  </div>
</template>

<script setup lang="ts">
import VinylRecord from './VinylRecord.vue'
import { useMusicPlayerStore } from '~/stores/music'

defineProps<{ compact?: boolean }>()
const music = useMusicPlayerStore()
</script>

<style scoped lang="scss">
.music-trigger { --music-accent: color-mix(in srgb, var(--brand-accent) 40%, var(--text-primary)); display: flex; align-items: center; flex: 0 0 auto; color: var(--header-action-color); }
.music-record-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 44px; min-height: 44px; padding: 0; border: 0; border-radius: 8px;
  color: inherit; background: transparent; cursor: pointer;
  &:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
  &:active { opacity: .7; }
  &[aria-busy='true'] { opacity: .6; cursor: progress; }
}
@media (hover: hover) and (pointer: fine) { .music-record-toggle:hover { color: var(--music-accent); } }
</style>

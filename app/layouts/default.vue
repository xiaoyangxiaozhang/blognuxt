<template>
  <div class="blog-layout" :class="{ 'music-active': music.hasStarted }">
    <Header />

    <main class="blog-main" :class="{ 'blog-main-article': route.path.startsWith('/article/') }">
      <div class="container">
        <div class="hero-wrapper">
          <slot />
        </div>
      </div>
    </main>

    <Footer />

    <ChatbotWidget />
    <ClientOnly><MusicPlayer /></ClientOnly>

  </div>
</template>

<script setup lang="ts">
import Header from '~/components/shell/Header.vue'
import Footer from '~/components/shell/Footer.vue'
import ChatbotWidget from '~/components/chat/ChatbotWidget.vue'
import MusicPlayer from '~/components/music/MusicPlayer.client.vue'
import { useMusicPlayerStore } from '~/stores/music'
import { useBlogSettings } from '~/composables/useBlogSettings'
import { parseMusicPlaylist } from '~/data/music'

const route = useRoute()
const music = useMusicPlayerStore()
const { settings } = useBlogSettings()
watch(() => settings.value['blog.music_playlist'], value => music.setPlaylist(parseMusicPlaylist(value)), { immediate: true })
useHead(() => ({ htmlAttrs: { 'data-music-active': music.hasStarted ? 'true' : null } }))
</script>

<style scoped lang="scss">
.blog-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.blog-main {
  flex: 1;
  padding: 0;
  margin-top: -86px;

  // 首页需要让视觉首屏延伸到透明导航下方，文章详情则必须避开固定导航。
  &.blog-main-article {
    margin-top: 0;
  }

  .container {
    margin: 0;
  }
}

@media (max-width: 768px) {
  .music-active {
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }

  :global(html[data-music-active='true'] .chatbot-launcher) {
    bottom: calc(88px + env(safe-area-inset-bottom));
  }

  .blog-main {
    padding:  0;
    margin-top: -72px;

    &.blog-main-article {
      margin-top: 0;
    }
  }

}

@media (max-width: 480px) {
  .blog-main {
    margin-top: -86px;

    &.blog-main-article {
      margin-top: 0;
    }

    .container {
      padding: 0;
    }
  }
}
</style>

<template>
  <div class="blog-layout">
    <Header />

    <main class="blog-main" :class="{ 'blog-main-article': route.path.startsWith('/article/') }">
      <div class="container">
        <div class="hero-wrapper">
          <transition name="fade" mode="out-in">
            <slot />
          </transition>
        </div>
      </div>
    </main>

    <Footer />

    <ChatbotWidget />

  </div>
</template>

<script setup lang="ts">
import Header from '~/components/shell/Header.vue'
import Footer from '~/components/shell/Footer.vue'
import ChatbotWidget from '~/components/chat/ChatbotWidget.vue'

const route = useRoute()
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
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

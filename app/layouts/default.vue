<template>
  <div class="blog-layout">
    <Header />

    <main class="blog-main">
      <div class="container">
        <div class="hero-wrapper">
          <transition name="fade" mode="out-in">
            <slot />
          </transition>
        </div>
      </div>
    </main>

    <Footer />

    <button
      v-show="showBackToTop"
      class="back-to-top"
      type="button"
      aria-label="Back to top"
      @click="scrollToTop"
    >
      <IconMaterialSymbolsKeyboardArrowUpRounded />
    </button>
  </div>
</template>

<script setup lang="ts">
import IconMaterialSymbolsKeyboardArrowUpRounded from '~icons/material-symbols/keyboard-arrow-up-rounded'
import Header from '~/components/layouts/Header.vue'
import Footer from '~/components/layouts/Footer.vue'

const route = useRoute()
const showBackToTop = ref(false)

const scrollToTop = () => {
  if (!import.meta.client) {
    return
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const handleScroll = () => {
  if (!import.meta.client) {
    return
  }

  showBackToTop.value = window.scrollY > 300
}

watch(
  () => route.path,
  () => {
    showBackToTop.value = false
  }
)

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
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

  .container {
    margin: 0;
  }
}

.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background-color: var(--accent);
  color: var(--text-on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
  transition:
    transform var(--transition-base),
    opacity var(--transition-fast),
    background var(--transition-fast);
  z-index: 99;

  :deep(svg) {
    width: 22px;
    height: 22px;
  }

  &:hover {
    background-color: var(--accent-strong);
    transform: translateY(-3px);
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
  }

  .back-to-top {
    bottom: 20px;
    right: 20px;
  }
}

@media (max-width: 480px) {
  .blog-main {
    margin-top: -86px;

    .container {
      padding: 0;
    }
  }
}
</style>

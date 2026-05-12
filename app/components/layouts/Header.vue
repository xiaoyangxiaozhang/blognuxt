<template>
  <header class="blog-header" :class="[`state-${headerState}`]">
    <div class="header-stage">
      <div
        class="header-layer header-layer-full"
        :class="{ active: headerState === 'full' }"
      >
        <div class="container full-shell">
          <div class="header-content">
            <div class="author-info">
              <NuxtLink to="/" class="author-link">
                <span class="author-mark">羊</span>
                <span class="author-name">小羊嚣张</span>
              </NuxtLink>
            </div>

            <nav class="nav-menu">
              <div class="nav-dropdown">
                <button class="nav-dropdown-toggle" type="button">文章</button>
                <div class="nav-dropdown-menu">
                  <NuxtLink to="/archive" class="nav-dropdown-item">归档</NuxtLink>
                  <NuxtLink to="/categories" class="nav-dropdown-item">分类</NuxtLink>
                  <NuxtLink to="/tags" class="nav-dropdown-item">标签</NuxtLink>
                </div>
              </div>
              <NuxtLink to="/friends" class="nav-item">友链</NuxtLink>
              <NuxtLink to="/dynamic" class="nav-item">动态</NuxtLink>
              <NuxtLink to="/message" class="nav-item">留言</NuxtLink>
              <NuxtLink to="/about" class="nav-item">关于</NuxtLink>
            </nav>

            <div class="header-actions">
              <button class="action-btn action-theme" :title="themeButtonTitle" type="button" @click="toggleTheme">
                <IconMaterialSymbolsDarkModeRounded v-if="theme === 'midnight-blue'"/>
                <IconMaterialSymbolsWbSunnyRounded v-else />
              </button>
              <button class="action-btn" type="button" title="RSS" aria-label="RSS">
                <IconMaterialSymbolsRssFeed />
              </button>
              <button class="action-btn" type="button" title="通知" aria-label="通知">
                 <IconMaterialSymbolsNotifications />
              </button>
              <button class="action-btn" type="button" title="收藏" aria-label="收藏">
                <IconMaterialSymbolsStarOutline />
              </button>
              <button class="action-btn" type="button" title="搜索" aria-label="搜索">
                <IconMaterialSymbolsSearch />
              </button>
              <button class="action-btn" type="button" title="菜单" aria-label="菜单">
                <IconMaterialSymbolsMenu />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="header-layer header-layer-logo"
        :class="{ active: headerState === 'logo' }"
      >
        <div class="floating-center">
          <button class="mini-logo" type="button" aria-label="返回顶部" @click="scrollToTop">
            <span class="mini-logo-mark">羊</span>
          </button>
        </div>
      </div>

      <div
        class="header-layer header-layer-island"
        :class="{ active: headerState === 'island' }"
      >
        <div class="floating-center">
          <div class="island-shell">
            <button class="mini-logo mini-logo-inline" type="button" aria-label="返回顶部" @click="scrollToTop">
              <span class="mini-logo-mark">羊</span>
            </button>

            <nav class="island-nav">
              <NuxtLink to="/archive" class="island-link">归档</NuxtLink>
              <NuxtLink to="/categories" class="island-link">分类</NuxtLink>
              <NuxtLink to="/tags" class="island-link">标签</NuxtLink>
              <NuxtLink to="/about" class="island-link">关于</NuxtLink>
            </nav>

            <div class="island-actions">
              <button class="action-btn action-theme" :title="themeButtonTitle" type="button" @click="toggleTheme">
                <IconMaterialSymbolsDarkModeRounded v-if="theme === 'midnight-blue'"  /> 
                <IconMaterialSymbolsWbSunnyRounded  v-else/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import IconMaterialSymbolsDarkModeRounded from '~icons/material-symbols/dark-mode-rounded'
import IconMaterialSymbolsMenu from '~icons/material-symbols/menu'
import IconMaterialSymbolsNotifications from '~icons/material-symbols/notifications'
import IconMaterialSymbolsRssFeed from '~icons/material-symbols/rss-feed'
import IconMaterialSymbolsSearch from '~icons/material-symbols/search'
import IconMaterialSymbolsStarOutline from '~icons/material-symbols/star-outline'
import IconMaterialSymbolsWbSunnyRounded from '~icons/material-symbols/wb-sunny-rounded'

type ThemeMode = 'midnight-blue' | 'blue-white'
type HeaderState = 'full' | 'logo' | 'island'

const theme = ref<ThemeMode>('midnight-blue')
const headerState = ref<HeaderState>('full')
const lastScrollY = ref(0)
const lastDirection = ref<'up' | 'down' | null>(null)

const NAV_SWITCH_OFFSET = 48
const DIRECTION_THRESHOLD = 4

const applyTheme = (nextTheme: ThemeMode) => {
  theme.value = nextTheme

  if (!import.meta.client) {
    return
  }

  document.documentElement.setAttribute('data-theme', nextTheme)
  localStorage.setItem('blog-color-theme', nextTheme)
}

const themeButtonTitle = computed(() =>
  theme.value === 'midnight-blue' ? '切换到蓝白主题' : '切换到纯黑主题'
)

const toggleTheme = () => {
  applyTheme(theme.value === 'midnight-blue' ? 'blue-white' : 'midnight-blue')
}

const scrollToTop = () => {
  if (!import.meta.client) {
    return
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
// 滚动处理函数，控制 headerState 的切换
const handleScroll = () => {
  if (!import.meta.client) {
    return
  }

  const currentY = Math.max(window.scrollY, 0)
  const delta = currentY - lastScrollY.value

  if (currentY <= 8) {
    headerState.value = 'full'
    lastDirection.value = null
    lastScrollY.value = currentY
    return
  }

  if (Math.abs(delta) < DIRECTION_THRESHOLD) {
    lastScrollY.value = currentY
    return
  }

  const nextDirection = delta > 0 ? 'down' : 'up'

  if (currentY > NAV_SWITCH_OFFSET) {
    if (nextDirection !== lastDirection.value) {
      headerState.value = nextDirection === 'down' ? 'logo' : 'island'
      lastDirection.value = nextDirection
    } else if (headerState.value === 'full') {
      headerState.value = nextDirection === 'down' ? 'logo' : 'island'
    }
  }

  lastScrollY.value = currentY
}

onMounted(() => {
  const savedTheme = localStorage.getItem('blog-color-theme') as ThemeMode | null
  applyTheme(savedTheme || 'midnight-blue')
  lastScrollY.value = window.scrollY
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.blog-header {
  position: sticky;
  top: 0;
  z-index: 300;
  width: 100%;
  pointer-events: none;
  overflow-x: clip;
  --header-nav-color: var(--text-secondary);
  --header-action-color: var(--text-secondary);
}

:global([data-theme='blue-white']) .blog-header {
  --header-nav-color: #ffffff;
  --header-action-color: #ffffff;
}

.header-stage {
  position: relative;
  min-height: 86px;
  overflow-x: clip;
}

.header-layer {
  position: absolute;
  inset: 0 0 auto 0;
  width: 100%;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px) scale(0.94);
  transform-origin: top center;
  overflow-x: clip;
  transition:
    opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0.2s step-end;
}

.header-layer.active {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
  transition:
    opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s step-start;
}

.header-layer-logo,
.header-layer-island {
  .floating-center {
    transform-origin: top center;
    transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
}

.state-logo .header-layer-logo {
  z-index: 3;
}

.state-logo .header-layer-island {
  z-index: 2;
  opacity: 0;
  visibility: visible;
  transform: translateY(0) scale(0.78);
}

.state-island .header-layer-island {
  z-index: 3;
}

.state-island .header-layer-logo {
  z-index: 2;
  opacity: 0;
  visibility: visible;
  transform: translateY(0) scale(1.14);
}

.container {
  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;
}

.full-shell {
  padding-top: 0;
}

.header-content {
  height: 60px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
  padding: 0 2px;
  pointer-events: auto;
  transform-origin: top center;
  transition:
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.author-link,
.nav-item,
.nav-dropdown-toggle,
.nav-dropdown-item,
.island-link {
  text-decoration: none;
}

.author-info {
  min-width: 0;
}

.author-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  transition: color 0.2s ease, transform 0.2s ease;
}

.author-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--text-on-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.mini-logo-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #84dfff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-shadow:
    0 0 10px rgba(132, 223, 255, 0.24),
    0 0 22px rgba(132, 223, 255, 0.14);
}

.author-name,
.mini-logo-name {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.nav-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
}

.nav-item,
.nav-dropdown-toggle,
.island-link {
  color: var(--header-nav-color);
  font-size: 15px;
  transition: color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;

  &:hover,
  &.router-link-active {
    color: var(--accent);
  }
}

.nav-dropdown {
  position: relative;
}

.nav-dropdown-toggle {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.nav-dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  box-shadow: 0 14px 30px var(--shadow-color);
  backdrop-filter: blur(12px);
  opacity: 0;
  visibility: hidden;
  transform: translate(-50%, 10px);
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
}

.nav-dropdown-item {
  display: block;
  padding: 8px 12px;
  border-radius: 10px;
  color: var(--header-nav-color);
  font-size: 14px;
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: var(--accent-soft);
    color: var(--accent);
  }
}

.nav-dropdown:hover .nav-dropdown-menu,
.nav-dropdown:focus-within .nav-dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0);
}

.header-actions,
.island-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--header-action-color);
  font-size: 16px;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.28s ease,
    color 0.28s ease,
    border-color 0.28s ease,
    transform 0.2s ease;

  &:hover {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent-border);
  }
}

.action-theme {
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--accent-soft);
  border-color: var(--accent-border);
}

.action-btn :deep(svg) {
  width: 18px;
  height: 18px;
}

.floating-center {
  display: flex;
  justify-content: center;
  padding-top: 10px;
  width: 100%;
  overflow-x: clip;
}

.mini-logo,
.island-shell {
  pointer-events: auto;
}

.mini-logo {
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 10px 16px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #84dfff;
  backdrop-filter: none;
  box-shadow: none;
  cursor: pointer;
  position: relative;
  isolation: isolate;
  transition:
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.2s ease,
    opacity 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 4px -2px;
    border-radius: 999px;
    background: rgba(132, 223, 255, 0.18);
    box-shadow:
      0 0 20px rgba(132, 223, 255, 0.22),
      0 10px 28px rgba(6, 16, 28, 0.22);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    z-index: -1;
  }

  &:hover {
    transform: translateY(-1px) scale(1.05);
    filter: brightness(1.06);
  }
}

.mini-logo-inline {
  padding: 8px 10px;
  background: transparent;

  &::before {
    inset: 2px 0;
    background: rgba(132, 223, 255, 0.1);
    box-shadow:
      0 0 16px rgba(132, 223, 255, 0.14),
      0 6px 18px rgba(6, 16, 28, 0.16);
  }

  &:hover {
    background: transparent;
  }
}

.island-shell {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 58px;
  padding: 8px 10px 8px 12px;
  border-radius: 999px;
  background: var(--bg-header-scrolled);
  border: 1px solid var(--border-color);
  box-shadow: 0 18px 46px var(--shadow-color);
  backdrop-filter: blur(14px);
  transform-origin: top center;
  transition:
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.island-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
}

.island-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  white-space: nowrap;

  &:hover,
  &.router-link-active {
    background: var(--accent-soft);
  }
}

.state-full .container {
  width: min(1200px, calc(100% - 40px));
}

.state-full .header-content {
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
}

.state-logo .mini-logo {
  transform: scale(1);
}

.state-island .island-shell {
  transform: scale(1);
}

@media (max-width: 960px) {
  .container {
    width: min(100%, calc(100% - 28px));
  }

  .header-content {
    grid-template-columns: auto 1fr auto;
    padding: 0 16px;
    gap: 16px;
  }

  .state-full .header-content {
    padding: 0;
  }

  .nav-menu {
    gap: 18px;
  }

  .header-actions .action-btn:not(.action-theme) {
    display: none;
  }

  .island-nav {
    gap: 2px;
  }

  .island-link {
    padding: 0 10px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .blog-header {
    top: 0;
  }

  .header-stage {
    min-height: 72px;
  }

  .full-shell {
    padding-top: 0;
  }

  .header-content {
    grid-template-columns: auto auto;
    justify-content: space-between;
    height: 54px;
  }

  .state-full .header-content {
    padding: 0;
  }

  .nav-menu {
    display: none;
  }

  .header-actions {
    gap: 8px;
  }

  .island-shell {
    gap: 8px;
    min-height: 52px;
    padding: 7px 8px 7px 9px;
  }

  .island-nav {
    display: none;
  }

  .floating-center {
    padding-top: 10px;
  }
}

@media (max-width: 480px) {
  .header-stage {
    min-height: 68px;
  }

  .container {
    width: calc(100% - 16px);
  }

  .header-content {
    padding: 0 12px;
  }

  .author-name {
    font-size: 14px;
  }

  .author-mark,
  .mini-logo-mark {
    min-width: auto;
    height: auto;
    padding: 0;
    color: #84dfff;
    font-size: 11px;
  }

}
</style>

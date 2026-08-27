<template>
  <header class="blog-header" :class="[`state-${headerState}`]">
    <div class="header-stage">
      <div
        class="header-layer header-layer-full"
        :class="{ active: headerState === 'full' }"
      >
        <div class="container full-shell">
          <div class="header-content">
            <div
              class="brand-menu-wrap"
              :class="{ 'is-open': brandMenuOpen }"
              @focusin="openBrandMenu"
              @focusout="handleBrandMenuFocusOut"
              @mouseleave="scheduleBrandMenuClose"
            >
              <button
                class="blog-brand"
                type="button"
                :aria-expanded="brandMenuOpen"
                aria-controls="brand-route-menu"
                @mouseenter="openBrandMenu"
                @click="openBrandMenu"
              >
                <img class="brand-logo" :src="logoUrl" alt="" aria-hidden="true" />
                <span>{{ siteTitle }}</span>
                <span class="brand-menu-arrow" :class="{ open: brandMenuOpen }">▾</span>
              </button>
              <Transition name="brand-menu">
                <nav
                  v-if="brandMenuOpen"
                  id="brand-route-menu"
                  class="brand-route-menu"
                  aria-label="站点导航"
                >
                  <NuxtLink
                    v-for="(item, index) in brandRoutes"
                    :key="item.to"
                    :to="item.to"
                    class="brand-route-item"
                    :style="{ '--menu-index': index }"
                    @click.stop
                  >
                    {{ item.label }}
                  </NuxtLink>
                </nav>
              </Transition>
            </div>

            <nav class="nav-menu">
              <NuxtLink to="/" class="nav-item">首页</NuxtLink>
              <div class="nav-dropdown">
                <button class="nav-dropdown-toggle" type="button">
                  文章 <span class="dropdown-arrow">▾</span>
                </button>
                <div class="nav-dropdown-menu">
                  <NuxtLink to="/archive" class="nav-dropdown-item">归档</NuxtLink>
                  <NuxtLink to="/categories" class="nav-dropdown-item">分类</NuxtLink>
                  <NuxtLink to="/tags" class="nav-dropdown-item">标签</NuxtLink>
                </div>
              </div>
              <NuxtLink to="/friends" class="nav-item">友链</NuxtLink>
              <NuxtLink to="/dynamic" class="nav-item">动态</NuxtLink>
              <NuxtLink to="/message" class="nav-item">留言</NuxtLink>
            </nav>

            <div class="header-actions">
              <button class="action-btn action-theme island-theme-btn" :title="themeButtonTitle" type="button" @click="toggleTheme">
                <IconMaterialSymbolsDarkModeRounded v-if="theme === 'midnight-blue'"/>
                <IconMaterialSymbolsWbSunnyRounded v-else />
              </button>
              <button class="action-btn" type="button" title="RSS" aria-label="RSS">
                <IconMaterialSymbolsRssFeed />
              </button>
              <button
                class="action-btn action-subscribe"
                type="button"
                title="订阅更新"
                aria-label="订阅更新"
                @click="subscribeDialogOpen = true"
              >
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
            <img class="mini-logo-mark" :src="logoUrl" alt="" aria-hidden="true" />
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
              <img class="mini-logo-mark" :src="logoUrl" alt="" aria-hidden="true" />
            </button>

            <nav class="island-nav">
              <NuxtLink to="/" class="island-link">首页</NuxtLink>
              <NuxtLink to="/archive" class="island-link">归档</NuxtLink>
              <NuxtLink to="/categories" class="island-link">分类</NuxtLink>
              <NuxtLink to="/tags" class="island-link">标签</NuxtLink>
              <NuxtLink to="/message" class="island-link">留言</NuxtLink>
            </nav>

            <div class="island-actions">
              <button
                class="action-btn action-subscribe"
                type="button"
                title="订阅更新"
                aria-label="订阅更新"
                @click="subscribeDialogOpen = true"
              >
                <IconMaterialSymbolsNotifications />
              </button>
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

  <SubscribeDialog v-model="subscribeDialogOpen" />
</template>

<script setup lang="ts">
import IconMaterialSymbolsDarkModeRounded from '~icons/material-symbols/dark-mode-rounded'
import IconMaterialSymbolsMenu from '~icons/material-symbols/menu'
import IconMaterialSymbolsNotifications from '~icons/material-symbols/notifications'
import IconMaterialSymbolsRssFeed from '~icons/material-symbols/rss-feed'
import IconMaterialSymbolsSearch from '~icons/material-symbols/search'
import IconMaterialSymbolsStarOutline from '~icons/material-symbols/star-outline'
import IconMaterialSymbolsWbSunnyRounded from '~icons/material-symbols/wb-sunny-rounded'
import SubscribeDialog from '~/components/shell/SubscribeDialog.vue'
import logoUrl from '~/assets/img/logo-sheep.png'
import { useBlogSettings } from '~/composables/useBlogSettings'

type ThemeMode = 'midnight-blue' | 'blue-white'
type HeaderState = 'full' | 'logo' | 'island'

const theme = ref<ThemeMode>('midnight-blue')
const { settings: blogSettings } = useBlogSettings()
const siteTitle = computed(() => blogSettings.value['blog.title'] || '小羊嚣张')
const headerState = ref<HeaderState>('full')
const brandMenuOpen = ref(false)
const subscribeDialogOpen = ref(false)
let brandMenuCloseTimer: ReturnType<typeof setTimeout> | null = null
const lastScrollY = ref(0)
const lastDirection = ref<'up' | 'down' | null>(null)

const brandRoutes = [
  { label: '首页', to: '/' },
  { label: '归档', to: '/archive' },
  { label: '分类', to: '/categories' },
  { label: '标签', to: '/tags' },
  { label: '友链', to: '/friends' },
  { label: '动态', to: '/dynamic' },
  { label: '留言', to: '/message' },
  { label: 'ITom Lab', to: '/itom' }
]

const NAV_SWITCH_OFFSET = 48
const DIRECTION_THRESHOLD = 4

const applyTheme = (nextTheme: ThemeMode) => {
  theme.value = nextTheme

  if (!import.meta.client) {
    return
  }

  const update = () => {
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem('blog-color-theme', nextTheme)
  }

  // View Transitions API - 主题切换丝滑动效
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }
  if (doc.startViewTransition) {
    doc.startViewTransition(() => update())
  } else {
    update()
  }
}

const themeButtonTitle = computed(() =>
  theme.value === 'midnight-blue' ? '切换到蓝白主题' : '切换到纯黑主题'
)

const toggleTheme = () => {
  applyTheme(theme.value === 'midnight-blue' ? 'blue-white' : 'midnight-blue')
}

const openBrandMenu = () => {
  cancelBrandMenuClose()
  brandMenuOpen.value = true
}

const cancelBrandMenuClose = () => {
  if (brandMenuCloseTimer) {
    clearTimeout(brandMenuCloseTimer)
    brandMenuCloseTimer = null
  }
}

const scheduleBrandMenuClose = () => {
  cancelBrandMenuClose()
  brandMenuCloseTimer = setTimeout(closeBrandMenu, 80)
}

const closeBrandMenu = () => {
  cancelBrandMenuClose()
  brandMenuOpen.value = false
}

const handleBrandMenuFocusOut = (event: FocusEvent) => {
  const currentTarget = event.currentTarget as HTMLElement
  const nextTarget = event.relatedTarget as Node | null
  if (!nextTarget || !currentTarget.contains(nextTarget)) scheduleBrandMenuClose()
}

const route = useRoute()
watch(() => route.fullPath, () => {
  closeBrandMenu()
})

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
  cancelBrandMenuClose()
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
  overflow: visible;
  isolation: isolate;
  /* --header-nav-color 和 --header-action-color 在 main.scss 中全局定义 */
  animation: navSlideDown 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes navSlideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.header-stage {
  position: relative;
  min-height: 86px;
  overflow: visible;
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
  overflow: visible;
  transition:
    opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0.2s step-end;
}

.header-layer.active {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  z-index: 10;
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

.header-layer-full {
  transition:
    background-color 0.4s cubic-bezier(0.345, 0.045, 0.345, 1),
    backdrop-filter 0.4s cubic-bezier(0.345, 0.045, 0.345, 1);
}

.state-logo .header-layer-full.active,
.state-island .header-layer-full.active {
  background: var(--bg-header);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
}

.state-full .header-layer-full.active {
  background: transparent;
  border-bottom: none;
  backdrop-filter: none;
}

.full-shell {
  padding-top: 0;
}

.header-content {
  height: 60px;
  display: flex;
  position: relative;
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
.blog-brand,
.nav-item,
.nav-dropdown-toggle,
.nav-dropdown-item,
.island-link {
  text-decoration: none;
}

.blog-brand {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  color: var(--header-nav-color);
  white-space: nowrap;
  letter-spacing: 0.02em;
  transition: color 0.2s ease;

  &:hover {
    color: var(--brand-accent);
  }
}

.brand-logo,
.mini-logo-mark {
  display: block;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  object-fit: contain;
  filter: invert(1);
  transition: filter 0.4s ease;
}

:global([data-theme='blue-white']) .brand-logo,
:global([data-theme='blue-white']) .mini-logo-mark {
  filter: none;
}

.brand-menu-wrap {
  position: relative;
  flex: 0 0 auto;
  z-index: 100;

  // 连接按钮与下拉内容，鼠标可从按钮平滑移动到菜单。
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 0;
    width: 140px;
    height: 13px;
    pointer-events: none;
  }

  &.is-open::after {
    pointer-events: auto;
  }
}

.brand-menu-arrow {
  font-size: 11px;
  line-height: 1;
  transition: transform 0.2s ease;

  &.open {
    transform: rotate(180deg);
  }
}

.brand-route-menu {
  position: absolute;
  top: calc(100% + 13px);
  left: 0;
  display: grid;
  gap: 4px;
  min-width: 128px;
  max-height: 420px;
  padding: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-elevated);
  box-shadow: 0 12px 28px rgba(6, 16, 28, 0.14);
  backdrop-filter: blur(12px);
  pointer-events: auto;
  z-index: 20;
  opacity: 1;
  transform: translateY(0) scaleY(1);
  transform-origin: top center;
}

.brand-menu-enter-active,
.brand-menu-leave-active {
  overflow: hidden;
  transform-origin: top center;
  transition:
    max-height 480ms cubic-bezier(0.22, 1, 0.36, 1),
    padding 480ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease,
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.brand-menu-enter-from,
.brand-menu-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
  transform: translateY(-8px) scaleY(0.94);
  pointer-events: none;
}

.brand-route-item {
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--header-nav-color);
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  pointer-events: auto;
  transition: color 0.2s ease, background-color 0.2s ease;

  &:hover,
  &:focus-visible,
  &.router-link-active {
    color: #8183ff;
    background: transparent;
  }

  &:focus-visible {
    outline: 2px solid #8183ff;
    outline-offset: -2px;
  }
}

.brand-menu-enter-active .brand-route-item {
  animation: brandRouteEnter 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--menu-index) * 42ms);
}

.brand-menu-leave-active .brand-route-item {
  animation: brandRouteExit 220ms cubic-bezier(0.55, 0, 0.78, 0.22) both;
  animation-delay: calc((7 - var(--menu-index)) * 34ms);
}

@keyframes brandRouteEnter {
  from {
    opacity: 0;
    transform: translateY(-12px) scaleY(0.72);
    transform-origin: top center;
  }
  to {
    opacity: 1;
    transform: translateY(0) scaleY(1);
    transform-origin: top center;
  }
}

@keyframes brandRouteExit {
  from {
    opacity: 1;
    transform: translateY(0) scaleY(1);
    transform-origin: top center;
  }
  to {
    opacity: 0;
    transform: translateY(-8px) scaleY(0.72);
    transform-origin: top center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-menu-enter-active,
  .brand-menu-leave-active {
    transition-duration: 1ms;
  }

  .brand-menu-enter-active .brand-route-item,
  .brand-menu-leave-active .brand-route-item {
    animation: none;
  }
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 28px;
}

.mini-logo-mark {
  width: 38px;
  height: 38px;
}

.nav-menu {
  position: absolute;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 28px;
  margin: 0;
  transform: translateX(-50%);
  white-space: nowrap;
}

.nav-item,
.nav-dropdown-toggle,
.island-link {
  color: var(--header-nav-color);
  font-size: 15px;
  transition: color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;

  &:hover,
  &.router-link-active {
    color: var(--brand-accent);
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dropdown-arrow {
  display: inline-block;
  font-size: 10px;
  transition: transform 0.2s ease;
  line-height: 1;
}

.nav-dropdown:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.nav-dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 110px;
  padding: 8px 8px;
  border-radius: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(12px);
  opacity: 0;
  visibility: hidden;
  transform: translate(-50%, 10px);
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
}

.nav-dropdown-item {
  display: block;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--header-nav-color);
  font-size: 14px;
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: var(--accent-soft);
    color: var(--brand-accent);
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

.header-actions {
  flex: 0 0 auto;
  margin-left: auto;
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
    color: var(--brand-accent);
    border-color: var(--accent-border);
  }
}

.action-theme {
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: 0;
  outline: 0;
  box-shadow: none;

  &:hover,
  &:focus,
  &:focus-visible,
  &:active {
    background: transparent;
    border: 0;
    outline: 0;
    box-shadow: none;
  }
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
  color: var(--brand-accent);
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
    background: rgba(129, 131, 255, 0.1);
    box-shadow:
      0 0 14px rgba(129, 131, 255, 0.12),
      0 6px 16px rgba(6, 16, 28, 0.14);
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
    display: none;
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
  background: transparent;
  border: 0;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  transform-origin: top center;
  transition:
    transform 0.24s cubic-bezier(0.345, 0.045, 0.345, 1),
    opacity 0.2s cubic-bezier(0.345, 0.045, 0.345, 1);
}

.island-theme-btn {
  background: transparent;
  border-color: transparent;
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
    background: var(--brand-accent-soft);
    color: var(--brand-accent);
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
    padding: 0 16px;
    gap: 16px;
  }

  .state-full .header-content {
    padding: 0;
  }

  .nav-menu {
    gap: 18px;
  }

  .header-actions .action-btn:not(.action-theme):not(.action-subscribe) {
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

  .blog-brand {
    font-size: 14px;
  }

  .mini-logo-mark {
    width: 30px;
    height: 30px;
  }

}
</style>

<template>
  <section class="feature-panel">
    <div class="section-heading">
      <h2>Feature</h2>
    </div>

    <div class="feature-tabs" role="tablist" aria-label="首页特性导航">
      <button
        v-for="item in tabs"
        :key="item.key"
        :ref="el => { if (el) tabRefs[item.key] = el as HTMLElement }"
        class="feature-tab"
        :class="{ active: activeTab === item.key }"
        type="button"
        role="tab"
        :aria-selected="activeTab === item.key"
        @click="switchTab(item.key)"
      >
        {{ item.label }}
      </button>
      <div class="feature-tab-indicator" :style="indicatorPos"></div>
    </div>

    <transition name="fade" mode="out-in">
      <div :key="activeTab" class="feature-body">
        <component :is="activeComponent" v-bind="activeProps" />
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import FeatureArticlesPanel from '~/components/home/feature-panels/FeatureArticlesPanel.vue'
import FeatureAuthorPanel from '~/components/home/feature-panels/FeatureAuthorPanel.vue'
import FeatureCommentsPanel from '~/components/home/feature-panels/FeatureCommentsPanel.vue'
import FeatureMomentsPanel from '~/components/home/feature-panels/FeatureMomentsPanel.vue'
import FeatureNoticePanel from '~/components/home/feature-panels/FeatureNoticePanel.vue'

interface CategoryItem {
  id: number
  name: string
  slug: string
  count: number
  url?: string
}

interface TagItem {
  id: number
  name: string
  slug: string
  count: number
  url?: string
}

interface RecentArticleItem {
  id: number
  slug: string
  title: string
  publishDate: string
  categoryName: string
  cover: string
}

type FeatureTabKey = 'author' | 'articles' | 'moments' | 'comments' | 'notice'

const props = defineProps<{
  authorName: string
  authorDesc: string
  authorAvatar: string
  authorGithub?: string
  announcementHtml?: string
  totalArticles: number
  categories: CategoryItem[]
  tags: TagItem[]
  recentArticles: RecentArticleItem[]
  loading: boolean
}>()

const tabs: Array<{ key: FeatureTabKey; label: string }> = [
  { key: 'author', label: '博主' },
  { key: 'articles', label: '文章' },
  { key: 'moments', label: '动态' },
  { key: 'comments', label: '评论' },
  { key: 'notice', label: '网站公告' }
]

const activeTab = ref<FeatureTabKey>('author')
const tabRefs = ref<Record<FeatureTabKey, HTMLElement | null>>({} as Record<FeatureTabKey, HTMLElement | null>)
const indicatorPos = ref({ left: '0px', width: '0px', opacity: 0 })

const switchTab = (key: FeatureTabKey) => {
  activeTab.value = key
  updateIndicator()
}

const updateIndicator = () => {
  const activeEl = tabRefs.value[activeTab.value]
  if (!activeEl) return

  const parent = activeEl.parentElement
  if (!parent) return

  const parentRect = parent.getBoundingClientRect()
  const elRect = activeEl.getBoundingClientRect()

  indicatorPos.value = {
    left: `${elRect.left - parentRect.left}px`,
    width: `${elRect.width}px`,
    opacity: 1
  }
}

onMounted(() => {
  nextTick(() => updateIndicator())

  window.addEventListener('resize', updateIndicator)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIndicator)
})

const componentMap: Record<FeatureTabKey, unknown> = {
  author: FeatureAuthorPanel,
  articles: FeatureArticlesPanel,
  moments: FeatureMomentsPanel,
  comments: FeatureCommentsPanel,
  notice: FeatureNoticePanel
}

const activeComponent = computed(() => componentMap[activeTab.value])

const activeProps = computed(() => {
  switch (activeTab.value) {
    case 'author':
      return {
        authorName: props.authorName,
        authorDesc: props.authorDesc,
        authorAvatar: props.authorAvatar,
        authorGithub: props.authorGithub,
        totalArticles: props.totalArticles,
        categories: props.categories,
        tags: props.tags,
        loading: props.loading
      }
    case 'articles':
      return {
        recentArticles: props.recentArticles,
        loading: props.loading
      }
    case 'moments':
      return {
       
        recentArticles: props.recentArticles,
        tags: props.tags,
        loading: props.loading
      }
    case 'comments':
      return {
        recentArticles: props.recentArticles,
        tags: props.tags,
        loading: props.loading
      }
    case 'notice':
      return {
        authorName: props.authorName,
        authorDesc: props.authorDesc,
        announcementHtml: props.announcementHtml,
        totalArticles: props.totalArticles,
        categories: props.categories,
        tags: props.tags
      }
  }
})
</script>

<style scoped lang="scss">
.feature-panel {
  color: var(--home-text);
  width: min(1000px, 100%);
  margin: 0 auto;
}

.section-heading {
  margin-bottom: 28px;

  h2 {
    margin: 0;
    display: inline-block;
    font-size: 48px;
    line-height: 1.08;
    color: var(--home-text);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      left: 4px;
      bottom: 2px;
      width: 72%;
      height: 7px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--home-accent), transparent);
    }
  }
}

.feature-tabs {
  position: relative;
  display: flex;
  gap: 30px;
  margin-bottom: 36px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.feature-tab-indicator {
  position: absolute;
  bottom: 4px;
  height: 5px;
  border-radius: 999px;
  background: #84dfff;
  transition: left 0.3s ease, width 0.3s ease;
  pointer-events: none;
}

.feature-tab {
  position: relative;
  border: none;
  background: transparent;
  color: var(--home-text);
  font-size: 20px;
  font-weight: 500;
  padding: 0 0 14px;
  cursor: pointer;
  transition: color 0.25s ease;
  white-space: nowrap;

  &:hover {
    color: #84dfff;
  }

  &.active {
    color: #84dfff;
  }
}

.feature-body {
  display: flex;
  justify-content: flex-start;
  min-height: 150px;
  // overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 1200px) {
  .feature-panel {
    width: min(700px, 100%);
  }

  .section-heading h2 {
    font-size: 44px;
  }
}

@media (max-width: 768px) {
  .feature-panel {
    width: min(368px, 100%);
  }

  .section-heading h2 {
    font-size: 32px;
  }

  .feature-tabs {
    gap: 22px;
    margin-bottom: 28px;
  }

  .feature-tab {
    font-size: 18px;
  }
}
</style>

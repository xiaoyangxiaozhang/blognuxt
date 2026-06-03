<template>
  <div class="author-panel">
    <div v-if="loading" class="loading-box">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else>
      <div class="author-main">
        <div class="author-avatar">
          <img :src="authorAvatar" :alt="authorName || '站长头像'" />
        </div>

        <div class="author-copy">
          <h3>{{ authorName || '站长' }}</h3>
          <p>{{ authorDesc || '欢迎来到这里。' }}</p>
        </div>
      </div>

      <div v-if="socialLinks.length" class="author-socials">
        <a
          v-for="item in socialLinks"
          :key="item.name"
          :href="item.url || '#'"
          :target="item.url ? '_blank' : undefined"
          :rel="item.url ? 'noopener noreferrer' : undefined"
          class="social-link"
          :title="item.name"
          :style="brandStyle(item.icon)"
        >
          <component :is="iconMap[item.icon] || fallbackIcon" />
        </a>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import IconMdiEarth from '~icons/mdi/earth'

// 图标映射：ri 图标名 → Vue 组件
import IconRiGithubLine from '~icons/ri/github-line'
import IconRiBilibiliLine from '~icons/ri/bilibili-line'
import IconRiTwitterXLine from '~icons/ri/twitter-x-line'
import IconRiNeteaseCloudMusicLine from '~icons/ri/netease-cloud-music-line'
import IconRiTelegram2Line from '~icons/ri/telegram-2-line'
import IconRiWeiboLine from '~icons/ri/weibo-line'
import IconRiZhihuLine from '~icons/ri/zhihu-line'
import IconRiTiktokLine from '~icons/ri/tiktok-line'
import IconMaterialSymbolsMailOutlineRounded from '~icons/material-symbols/mail-outline-rounded'

const iconMap: Record<string, any> = {
  'github-line': IconRiGithubLine,
  'bilibili-line': IconRiBilibiliLine,
  'twitter-x-line': IconRiTwitterXLine,
  'netease-cloud-music-line': IconRiNeteaseCloudMusicLine,
  'telegram-2-line': IconRiTelegram2Line,
  'weibo-line': IconRiWeiboLine,
  'zhihu-line': IconRiZhihuLine,
  'tiktok-line': IconRiTiktokLine,
  'tiktok-fill': IconRiTiktokLine,
  'mail-line': IconMaterialSymbolsMailOutlineRounded
}

const fallbackIcon = IconMdiEarth

// 各平台品牌色
interface BrandColor {
  bg: string        // 默认背景色
  color: string     // 图标颜色
  hoverBg: string   // hover 背景加深
  hoverColor: string // hover 图标颜色
  border: string    // 边框色
}

const brandColors: Record<string, BrandColor> = {
  'github-line':             { bg: '#24292e', color: '#fff', hoverBg: '#1b1f23', hoverColor: '#fff', border: '#24292e' },
  'bilibili-line':           { bg: '#00A1D6', color: '#fff', hoverBg: '#0088b3', hoverColor: '#fff', border: '#00A1D6' },
  'twitter-x-line':          { bg: '#000000', color: '#fff', hoverBg: '#1a1a1a', hoverColor: '#fff', border: '#000000' },
  'netease-cloud-music-line': { bg: '#C20C0C', color: '#fff', hoverBg: '#a00a0a', hoverColor: '#fff', border: '#C20C0C' },
  'telegram-2-line':         { bg: '#26A5E4', color: '#fff', hoverBg: '#1e8bc3', hoverColor: '#fff', border: '#26A5E4' },
  'weibo-line':              { bg: '#E6162D', color: '#fff', hoverBg: '#c41226', hoverColor: '#fff', border: '#E6162D' },
  'zhihu-line':              { bg: '#0084FF', color: '#fff', hoverBg: '#0070d9', hoverColor: '#fff', border: '#0084FF' },
  'tiktok-line':             { bg: '#000000', color: '#fff', hoverBg: '#1a1a1a', hoverColor: '#fff', border: '#000000' },
  'tiktok-fill':             { bg: '#000000', color: '#fff', hoverBg: '#1a1a1a', hoverColor: '#fff', border: '#000000' },
  // 邮箱用暖橙色
  'mail-line':               { bg: '#EA4335', color: '#fff', hoverBg: '#c93427', hoverColor: '#fff', border: '#EA4335' }
}

const defaultBrand: BrandColor = {
  bg: 'var(--home-card-alt)',
  color: 'var(--home-text-muted)',
  hoverBg: 'var(--brand-accent-soft)',
  hoverColor: 'var(--brand-accent)',
  border: 'var(--home-border)'
}

const brandStyle = (icon: string): Record<string, string> => {
  const b = brandColors[icon] || defaultBrand
  return {
    '--sl-bg': b.bg,
    '--sl-color': b.color,
    '--sl-hover-bg': b.hoverBg,
    '--sl-hover-color': b.hoverColor,
    '--sl-border': b.border
  }
}

interface SidebarSocialItem {
  name: string
  url: string
  icon: string
}

const props = defineProps<{
  authorName: string
  authorDesc: string
  authorAvatar: string
  authorGithub?: string
  sidebarSocial?: SidebarSocialItem[]
  totalArticles: number
  categories: any[]
  tags: any[]
  loading: boolean
}>()

const socialLinks = computed(() => {
  return props.sidebarSocial?.filter((s) => s.url && s.name) || []
})
</script>

<style scoped lang="scss">
.author-panel {
  display: grid;
  gap: 28px;
}

.loading-box {
  max-width: 420px;
}

.author-main {
  display: flex;
  align-items: center;
  gap: 28px;
}

.author-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--home-border);
  box-shadow: var(--home-shadow);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.author-copy {
  h3 {
    margin: 0 0 14px;
    font-size: 32px;
    color: var(--home-text);
  }

  p {
    margin: 0;
    color: var(--home-text-muted);
    font-size: 18px;
    line-height: 1.8;
  }
}

.author-socials {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 20px;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.345, 0.045, 0.345, 1);

  // 品牌色通过 CSS 变量注入
  color: var(--sl-color, var(--home-text-muted));
  background: var(--sl-bg, var(--home-card-alt));
  border: 1px solid var(--sl-border, var(--home-border));

  &:hover,
  &:focus-visible {
    color: var(--sl-hover-color, var(--brand-accent));
    background: var(--sl-hover-bg, var(--brand-accent-soft));
    border-color: var(--sl-hover-color, var(--brand-accent));
    transform: translateY(-2px) scale(1.12);
    border-radius: 12px;
  }

  &:focus-visible {
    outline: 2px solid var(--sl-hover-color, var(--brand-accent));
    outline-offset: 2px;
  }
}

@media (max-width: 768px) {
  .author-copy p {
    font-size: 16px;
  }

  .social-link {
    width: 38px;
    height: 38px;
    font-size: 17px;
  }
}
</style>

<script setup lang="ts">
import IconMdiEarth from '~icons/mdi/earth'
import IconMaterialSymbolsMailOutlineRounded from '~icons/material-symbols/mail-outline-rounded'
import IconRiBilibiliLine from '~icons/ri/bilibili-line'
import IconRiGithubLine from '~icons/ri/github-line'
import IconRiNeteaseCloudMusicLine from '~icons/ri/netease-cloud-music-line'
import IconRiTelegram2Line from '~icons/ri/telegram-2-line'
import IconRiTiktokLine from '~icons/ri/tiktok-line'
import IconRiTwitterXLine from '~icons/ri/twitter-x-line'
import IconRiWeiboLine from '~icons/ri/weibo-line'
import IconRiZhihuLine from '~icons/ri/zhihu-line'

interface SocialLink {
  name: string
  url: string
  icon: string
}

interface BrandColor {
  bg: string
  color: string
  hoverBg: string
  hoverColor: string
  border: string
}

const props = defineProps<{
  links: SocialLink[]
}>()

const socialIconMap: Record<string, any> = {
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

const brandColors: Record<string, BrandColor> = {
  'github-line': { bg: '#24292e', color: '#fff', hoverBg: '#1b1f23', hoverColor: '#fff', border: '#24292e' },
  'bilibili-line': { bg: '#00A1D6', color: '#fff', hoverBg: '#0088b3', hoverColor: '#fff', border: '#00A1D6' },
  'twitter-x-line': { bg: '#000000', color: '#fff', hoverBg: '#1a1a1a', hoverColor: '#fff', border: '#000000' },
  'netease-cloud-music-line': { bg: '#C20C0C', color: '#fff', hoverBg: '#a00a0a', hoverColor: '#fff', border: '#C20C0C' },
  'telegram-2-line': { bg: '#26A5E4', color: '#fff', hoverBg: '#1e8bc3', hoverColor: '#fff', border: '#26A5E4' },
  'weibo-line': { bg: '#E6162D', color: '#fff', hoverBg: '#c41226', hoverColor: '#fff', border: '#E6162D' },
  'zhihu-line': { bg: '#0084FF', color: '#fff', hoverBg: '#0070d9', hoverColor: '#fff', border: '#0084FF' },
  'tiktok-line': { bg: '#000000', color: '#fff', hoverBg: '#1a1a1a', hoverColor: '#fff', border: '#000000' },
  'tiktok-fill': { bg: '#000000', color: '#fff', hoverBg: '#1a1a1a', hoverColor: '#fff', border: '#000000' },
  'mail-line': { bg: '#EA4335', color: '#fff', hoverBg: '#c93427', hoverColor: '#fff', border: '#EA4335' }
}

const socialIcon = (icon: string) => socialIconMap[icon] || IconMdiEarth

const brandStyle = (icon: string): Record<string, string> => {
  const brand = brandColors[icon] || {
    bg: 'var(--home-card-alt)',
    color: 'var(--home-text)',
    hoverBg: 'var(--brand-accent-soft)',
    hoverColor: 'var(--brand-accent)',
    border: 'var(--home-border)'
  }

  return {
    '--social-bg': brand.bg,
    '--social-color': brand.color,
    '--social-hover-bg': brand.hoverBg,
    '--social-hover-color': brand.hoverColor,
    '--social-border': brand.border
  }
}
</script>

<template>
  <article class="social-card">
    <div class="social-heading">
      <h3>保持联系</h3>
    </div>

    <div v-if="props.links.length" class="social-links">
      <a
        v-for="item in props.links"
        :key="`${item.name}-${item.url}`"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="social-link"
        :style="brandStyle(item.icon)"
      >
        <component :is="socialIcon(item.icon)" aria-hidden="true" />
        <span>{{ item.name }}</span>
      </a>
    </div>
    <p v-else class="social-empty">暂未配置公开联系方式</p>
  </article>
</template>

<style scoped lang="scss">
.social-card {
  padding: 30px;
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background: var(--home-card-bg);
  color: var(--home-text);
}

.social-heading h3 {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.25;
}

.social-empty {
  margin: 28px 0 0;
  color: var(--home-text);
  font-size: 14px;
  line-height: 1.7;
}

.social-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 28px;
}

.social-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--social-border, var(--home-border));
  border-radius: 8px;
  color: var(--social-color, var(--home-text));
  background: var(--social-bg, var(--home-surface));
  font-size: 14px;
  line-height: 1.4;
  text-decoration: none;
  transition: opacity var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast);

  :deep(svg) {
    width: 17px;
    height: 17px;
    flex: 0 0 auto;
  }

  &:hover,
  &:focus-visible {
    border-color: var(--social-hover-color, var(--brand-accent));
    color: var(--social-hover-color, var(--brand-accent));
    background: var(--social-hover-bg, var(--brand-accent-soft));
    opacity: 0.92;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--brand-accent);
    outline-offset: 3px;
  }
}

@media (max-width: 560px) {
  .social-card {
    padding: 24px 20px;
  }
}
</style>

<script setup lang="ts">
import { getArticleList } from '~/services/api/article'
import { parseBlogJson, useBasicSettings, useBlogSettings } from '~/composables/useBlogSettings'
import { useSiteOverlays } from '~/composables/useSiteOverlays'
import IconRiBilibiliLine from '~icons/ri/bilibili-line'
import { GithubLogoIcon, TwitterLogoIcon } from '@svg-animated-icons/vue'
import { EnvelopeClosedIcon, GlobeIcon } from '~/utils/siteIcons'

const { settings: basicSettings } = useBasicSettings()
const { settings: blogSettings } = useBlogSettings()
const isKimidouOpen = computed(() => blogSettings.value['blog.kimidou_enabled'] === 'true')

const authorName = computed(() => basicSettings.value?.['basic.author'] || '小羊嚣张')
const icp = computed(() => basicSettings.value?.['basic.icp'] || '')
const authorGithub = computed(() => {
  return (
    basicSettings.value?.['basic.github'] ||
    basicSettings.value?.['basic.author_github'] ||
    basicSettings.value?.['basic.social_github'] ||
    ''
  )
})
const socialBilibili = computed(() => basicSettings.value?.['basic.bilibili'] || '')

interface FooterSocialItem {
  name: string
  url: string
  icon: string
}

interface FooterLinkItem {
  name: string
  url: string
}

const configuredFooterSocials = computed<FooterSocialItem[]>(() =>
  parseBlogJson<FooterSocialItem[]>(blogSettings.value['blog.footer_social'], [])
    .filter((item) => item.url?.trim())
)
const footerSocials = computed<FooterSocialItem[]>(() => {
  if (configuredFooterSocials.value.length > 0) return configuredFooterSocials.value

  return [
    ...(authorGithub.value ? [{ name: 'GitHub', url: authorGithub.value, icon: 'github-line' }] : []),
    ...(socialBilibili.value ? [{ name: 'Bilibili', url: socialBilibili.value, icon: 'bilibili-line' }] : [])
  ]
})
const footerLinks = computed<FooterLinkItem[]>(() =>
  parseBlogJson<FooterLinkItem[]>(blogSettings.value['blog.footer_links'], [])
    .filter((item) => item.name?.trim() && item.url?.trim() && (isKimidouOpen.value || !item.url.startsWith('/kimidou')))
)
const { openFeedback, openAccount, openSubscribe } = useSiteOverlays()
const route = useRoute()
const isMessagePage = computed(() => route.path === '/message')
const footerIconMap: Record<string, any> = {
  'github-line': GithubLogoIcon,
  'bilibili-line': IconRiBilibiliLine,
  'mail-line': EnvelopeClosedIcon,
  'twitter-x-line': TwitterLogoIcon
}
const footerIcon = (icon: string) => footerIconMap[icon] || GlobeIcon
const footerBrandColors: Record<string, { bg: string; color: string; hoverBg: string; hoverColor: string; border: string }> = {
  'github-line': { bg: '#24292e', color: '#fff', hoverBg: '#1b1f23', hoverColor: '#fff', border: '#24292e' },
  'bilibili-line': { bg: '#00A1D6', color: '#fff', hoverBg: '#0088b3', hoverColor: '#fff', border: '#00A1D6' },
  'twitter-x-line': { bg: '#000000', color: '#fff', hoverBg: '#1a1a1a', hoverColor: '#fff', border: '#000000' },
  'mail-line': { bg: '#EA4335', color: '#fff', hoverBg: '#c93427', hoverColor: '#fff', border: '#EA4335' }
}
const footerSocialStyle = (icon: string): Record<string, string> => {
  const brand = footerBrandColors[icon] || {
    bg: 'var(--home-card-alt)',
    color: 'var(--home-text-muted)',
    hoverBg: 'var(--home-border)',
    hoverColor: 'var(--home-text)',
    border: 'var(--home-border)'
  }
  return {
    '--sl-bg': brand.bg,
    '--sl-color': brand.color,
    '--sl-hover-bg': brand.hoverBg,
    '--sl-hover-color': brand.hoverColor,
    '--sl-border': brand.border
  }
}
const copyrightYear = computed(() => {
  const year = new Date().getFullYear()
  return `2023 - ${year}`
})

const startDate = new Date('2023-01-01')
const runningDays = computed(() => {
  const diff = Date.now() - startDate.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

const { data: articleData } = await useAsyncData('footer-articles', () =>
  getArticleList({ page: 1, page_size: 1 })
)
const totalArticles = computed(() => articleData.value?.data?.total || 0)
</script>

<template>
  <footer class="blog-footer">
    <div class="footer-content">
      <div class="footer-main" :class="{ 'footer-main-message': isMessagePage }">
        <div class="footer-intro">
          <div v-if="footerSocials.length" class="footer-socials">
            <a
              v-for="item in footerSocials"
              :key="`${item.name}-${item.url}`"
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-social-link"
              :aria-label="item.name"
              :style="footerSocialStyle(item.icon)"
            >
              <component :is="footerIcon(item.icon)" aria-hidden="true" />
            </a>
          </div>
          <p v-if="isMessagePage" class="about-footer-note">谢谢你来过。</p>
          <div v-else class="footer-stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ totalArticles }}</span>
              <span class="stat-label">篇文章</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ runningDays }}</span>
              <span class="stat-label">运行天数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">CC BY-NC-SA 4.0</span>
              <span class="stat-label">许可协议</span>
            </div>
          </div>
        </div>

        <nav v-if="!isMessagePage" class="footer-nav" aria-label="页脚导航">
          <div class="footer-nav-group">
            <h2>文章</h2>
            <NuxtLink to="/articles" class="footer-nav-link">全部文章</NuxtLink>
            <NuxtLink to="/archive" class="footer-nav-link">文章归档</NuxtLink>
            <NuxtLink to="/categories" class="footer-nav-link">文章分类</NuxtLink>
            <NuxtLink to="/tags" class="footer-nav-link">文章标签</NuxtLink>
          </div>
          <div class="footer-nav-group">
            <h2>发现</h2>
            <NuxtLink to="/dynamic" class="footer-nav-link">即时动态</NuxtLink>
            <NuxtLink v-if="isKimidouOpen" to="/kimidou" class="footer-nav-link">基米斗</NuxtLink>
            <NuxtLink to="/friends" class="footer-nav-link">友链</NuxtLink>
            <NuxtLink to="/message" class="footer-nav-link">留言</NuxtLink>
          </div>
          <div class="footer-nav-group">
            <h2>服务</h2>
            <button type="button" class="footer-nav-link" @click="openFeedback">反馈与举报</button>
            <button v-if="!footerLinks.some((item) => item.url === '/subscribe')" type="button" class="footer-nav-link" @click="openSubscribe">订阅更新</button>
            <button type="button" class="footer-nav-link" @click="openAccount()">我的账号</button>
          </div>
        </nav>
      </div>

      <div class="footer-bottom">
        <div class="footer-legal">
          <p class="copyright">
            Copyright &copy; {{ copyrightYear }} {{ authorName }}
            <template v-if="icp">
              &nbsp;|&nbsp;
              <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">{{ icp }}</a>
            </template>
          </p>
          <p v-if="!isMessagePage" class="powered">Powered by Nuxt 4 & Designed with care</p>
        </div>
        <nav v-if="footerLinks.length" class="footer-links" aria-label="页脚链接">
          <template v-for="item in footerLinks" :key="`${item.name}-${item.url}`">
            <button v-if="item.url === '/feedback'" type="button" class="footer-link" @click="openFeedback">
              {{ item.name }}
            </button>
            <button v-else-if="item.url === '/account'" type="button" class="footer-link" @click="openAccount()">
              {{ item.name }}
            </button>
            <button v-else-if="item.url === '/subscribe'" type="button" class="footer-link" @click="openSubscribe">
              {{ item.name }}
            </button>
            <NuxtLink v-else :to="item.url" class="footer-link">
              {{ item.name }}
            </NuxtLink>
          </template>
        </nav>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.blog-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 48px 24px 0;
  position: relative;
  z-index: 10;
}

.footer-content {
  max-width: 1120px;
  margin: 0 auto;
}

.footer-socials {
  display: flex;
  gap: 16px;
  align-items: center;
}

.footer-social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 44px;
  height: 44px;
  text-decoration: none;
  cursor: pointer;
  transition: color 200ms var(--ease-out-expo), background-color 200ms var(--ease-out-expo), border-color 200ms var(--ease-out-expo), border-radius 200ms var(--ease-out-expo), transform 200ms var(--ease-out-expo);
  border: 1px solid var(--sl-border, var(--home-border));
  border-radius: 50%;
  color: var(--sl-color, var(--home-text-muted));
  background: var(--sl-bg, var(--home-card-alt));

  &:hover,
  &:focus-visible {
    border-color: var(--sl-hover-color, var(--home-text));
    border-radius: 12px;
    color: var(--sl-hover-color, var(--home-text));
    background: var(--sl-hover-bg, var(--home-border));
    transform: translateY(-2px) scale(1.12);
  }

  &:focus-visible {
    outline: 2px solid var(--sl-hover-color, var(--home-text));
    outline-offset: 2px;
  }
}

.footer-social-link :deep(svg) {
  width: 20px;
  height: 20px;
}

.footer-main {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 2fr);
  gap: 64px;
  padding-bottom: 48px;
}

.footer-main-message {
  display: block;
  padding-bottom: 32px;
}

.about-footer-note {
  margin: 16px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.footer-stats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 24px;
  margin-top: 28px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.footer-nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.footer-nav-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 13px;

  h2 {
    margin: 0 0 4px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
  }
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  border-top: 1px solid var(--border-color);
  padding: 22px 0 28px;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 16px;
}

.footer-nav-link,
.footer-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  text-decoration: none;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    border-radius: 3px;
    outline: 2px solid var(--text-primary);
    outline-offset: 3px;
  }
}

.footer-link {
  font-size: 12px;
}

.copyright {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;

  a {
    color: var(--text-muted);
    text-decoration: none;
    &:focus-visible {
      outline: 2px solid var(--text-primary);
      outline-offset: 3px;
    }
  }
}

.powered {
  margin: 5px 0 0;
  font-size: 11px;
  color: var(--text-muted);
}

@media (hover: hover) and (pointer: fine) {
  .footer-nav-link:hover,
  .footer-link:hover,
  .copyright a:hover {
    color: var(--text-primary);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
}

@media (max-width: 768px) {
  .footer-main {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 16px;
  }

  .footer-links {
    justify-content: flex-start;
    order: -1;
  }
}

@media (max-width: 520px) {
  .blog-footer {
    padding: 40px 20px 0;
  }

  .footer-socials {
    gap: 8px;
  }

  .footer-social-link {
    width: 40px;
    height: 40px;
  }

  .footer-nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .footer-nav-link {
    font-size: clamp(12px, 3vw, 13px);
    white-space: nowrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .footer-social-link {
    transition: none;
  }

  .footer-social-link:hover,
  .footer-social-link:focus-visible {
    transform: none;
  }
}
</style>

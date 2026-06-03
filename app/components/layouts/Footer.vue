<script setup lang="ts">
import { getBasicSettings } from '~/composables/api/user'
import { getArticleList } from '~/composables/api/article'
import IconMdiGithub from '~icons/mdi/github'
import IconRiBilibiliLine from '~icons/ri/bilibili-line'

const { data: settingsData } = await useAsyncData('footer-settings', () => getBasicSettings())

const authorName = computed(() => settingsData.value?.data?.['basic.author'] || '小羊嚣张')
const authorAvatar = computed(() => proxyImageUrl(settingsData.value?.data?.['basic.author_avatar']) || '~/assets/img/dashboard.png')
const icp = computed(() => settingsData.value?.data?.['basic.icp'] || '')
const authorGithub = computed(() => {
  return (
    settingsData.value?.data?.['basic.github'] ||
    settingsData.value?.data?.['basic.author_github'] ||
    settingsData.value?.data?.['basic.social_github'] ||
    ''
  )
})
const socialBilibili = computed(() => settingsData.value?.data?.['basic.bilibili'] || '')

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
      <div class="footer-brand">
        <div class="footer-author">
          <img :src="authorAvatar" alt="作者头像" class="author-avatar" />
          <div>
            <span class="author-name">{{ authorName }}</span>
            <p class="author-tagline">让美好持续发生</p>
          </div>
        </div>

        <div class="footer-socials">
          <a
            v-if="authorGithub"
            :href="authorGithub"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-social-link"
            title="GitHub"
          >
            <IconMdiGithub />
          </a>
          <a
            v-if="socialBilibili"
            :href="socialBilibili"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-social-link"
            title="哔哩哔哩"
          >
            <IconRiBilibiliLine />
          </a>
        </div>
      </div>

      <div class="footer-stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ totalArticles }}</span>
          <span class="stat-label">文章</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ runningDays }}</span>
          <span class="stat-label">天</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">CC BY-NC-SA 4.0</span>
          <span class="stat-label">许可协议</span>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="copyright">
          Copyright &copy; {{ copyrightYear }} {{ authorName }}
          <template v-if="icp">
            &nbsp;|&nbsp;
            <a :href="`https://beian.miit.gov.cn`" target="_blank" rel="noopener noreferrer">{{ icp }}</a>
          </template>
        </p>
        <p class="powered">Powered by Nuxt 4 &amp; Designed with care</p>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.blog-footer {
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 40px 20px 30px;
  position: relative;
  z-index: 10;
}

.footer-content {
  max-width: 1000px;
  margin: 0 auto;
}

.footer-brand {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
}

.footer-author {
  display: flex;
  align-items: center;
  gap: 14px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--accent-border);
}

.author-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.author-tagline {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-muted);
}

.footer-socials {
  display: flex;
  gap: 10px;
}

.footer-social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: var(--text-muted);
  background: var(--bg-soft);
  transition:
    color 0.25s ease,
    background 0.25s ease,
    transform 0.2s ease;

  :deep(svg) {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: var(--accent);
    background: var(--accent-soft);
    transform: translateY(-2px);
  }
}

.footer-stats-grid {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 24px 0;
  margin-bottom: 24px;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.06em;
}

.footer-bottom {
  text-align: center;
}

.copyright {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.8;

  a {
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--brand-accent);
    }
  }
}

.powered {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.7;
}

@media (max-width: 768px) {
  .footer-brand {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-stats-grid {
    gap: 28px;
  }

  .stat-value {
    font-size: 18px;
  }
}
</style>

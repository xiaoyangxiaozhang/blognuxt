<template>
  <section class="message-page">
    <div class="message-shell">
      <section class="about-intro">
        <div class="intro-copy">
          <p class="intro-greeting">你好！</p>
          <h1 class="intro-title">我是 {{ authorName || '博客作者' }}</h1>
          <p v-if="aboutDescribe" class="intro-description">{{ aboutDescribe }}</p>
          <p v-if="aboutDescribeTips" class="intro-tips">{{ aboutDescribeTips }}</p>
          <div class="intro-actions">
            <a href="#profile-section" class="intro-action">博主信息</a>
            <a href="#site-section" class="intro-action">本站信息</a>
          </div>
        </div>

        <div class="intro-portrait">
          <img :src="authorAvatar || '~/assets/img/dashboard.png'" :alt="authorName || '博客作者'" />
        </div>
      </section>

      <section id="profile-section" class="numbered-section">
        <aside class="section-marker">
          <div class="marker-top">
            <span class="marker-number">01</span>
            <h2>博主信息</h2>
          </div>
          <div class="marker-foot">{{ authorName || '博客作者' }}</div>
        </aside>

        <div class="section-content profile-content">
          <article class="content-card profile-card">
            <div v-if="profileList.length" class="profile-grid">
              <div v-for="item in profileList" :key="`${item.label}-${item.value}`" class="profile-cell">
                <span class="cell-label">{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
            <p v-else class="empty-profile">暂未填写公开资料</p>
          </article>

          <article v-if="aboutExhibition" class="content-card exhibition-card">
            <img :src="aboutExhibition" alt="展示图片" loading="lazy" />
          </article>
        </div>
      </section>

      <section class="split-section personality-section">
        <article class="content-card personality-card">
          <span class="card-eyebrow">性格</span>
          <strong class="large-value">{{ personalityTags[0] || '待填写' }}</strong>
          <span class="card-caption">记录一个正在持续变化的自己</span>
        </article>

        <article class="content-card motto-card">
          <span class="card-eyebrow">座右铭</span>
          <p class="motto-text">{{ mottoText ? `「${mottoText}」` : '暂未填写座右铭' }}</p>
          <span v-if="mottoSub" class="card-caption">{{ mottoSub }}</span>
        </article>
      </section>

      <section v-if="socialLinks.length" class="split-section platform-section">
        <article class="content-card platform-card">
          <span class="card-eyebrow">账号</span>
          <h2 class="card-heading">联系方式</h2>
          <div class="platform-links">
            <a
              v-for="item in socialLinks"
              :key="item.name"
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="platform-link"
              :style="brandStyle(item.icon)"
            >
              <component :is="socialIconComp(item.icon)" />
              {{ item.name }}
            </a>
          </div>
        </article>
      </section>

      <section id="site-section" class="numbered-section site-section">
        <aside class="section-marker">
          <div class="marker-top">
            <span class="marker-number">02</span>
            <h2>本站信息</h2>
          </div>
          <div class="marker-foot">已稳定运行 {{ stats.runningDays }} 天</div>
        </aside>

        <div class="section-content site-content">
          <article class="content-card stats-card">
            <div class="stats-grid">
              <div class="stat-card"><span class="stat-num">{{ stats.totalArticles }}</span><span class="stat-lbl">篇文章</span></div>
              <div class="stat-card"><span class="stat-num">{{ stats.totalComments }}</span><span class="stat-lbl">条留言</span></div>
              <div class="stat-card"><span class="stat-num">{{ stats.runningDays }}</span><span class="stat-lbl">运行天数</span></div>
              <div class="stat-card"><span class="stat-num">{{ stats.totalWords }}k</span><span class="stat-lbl">累计字数</span></div>
            </div>
          </article>
        </div>
      </section>

      <section class="section-block map-section">
        <h2 class="section-title">足迹地图</h2>
        <div class="map-card" aria-label="足迹地图预留区域">
          <div class="map-placeholder">
            <span class="map-label">故乡</span>
            <strong class="map-place">{{ hometown || '待记录' }}</strong>
            <p class="map-text">记录我去过的地方</p>
          </div>
        </div>
      </section>

      <article v-if="aboutDescribe || aboutStory" class="content-card about-note">
        <span class="card-eyebrow">心路历程</span>
        <h2 class="card-heading">关于本站的介绍</h2>
        <p v-if="aboutDescribe">{{ aboutDescribe }}</p>
        <p v-if="aboutStory">{{ aboutStory }}</p>
      </article>

      <section class="section-block message-board-section">
        <h2 class="section-title">留言板</h2>
        <UnifiedCommentPanel
          variant="board"
          :show-header="false"
          :comments="normalizedComments"
          :loading="loading"
          :submitting="submitting"
          :form="commentForm"
          :empty-text="commentEmptyText"
          @update:form="handleFormUpdate"
          @submit="handleSubmit"
        />
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import UnifiedCommentPanel from '~/components/comments/UnifiedCommentPanel.vue'
import { getCommentList, createComment } from '~/services/api/comments'
import { normalizeCommentList } from '~/utils/comments'
import { getBasicSettings, getSettings } from '~/services/api/user'
import { getArticleList } from '~/services/api/article'
import type { UnifiedCommentForm, UnifiedCommentItem } from '~/components/comments/UnifiedCommentPanel.vue'
import { proxyImageUrl } from '~/utils/image'

import IconRiGithubLine from '~icons/ri/github-line'
import IconRiBilibiliLine from '~icons/ri/bilibili-line'
import IconRiTwitterXLine from '~icons/ri/twitter-x-line'
import IconRiNeteaseCloudMusicLine from '~icons/ri/netease-cloud-music-line'
import IconRiTelegram2Line from '~icons/ri/telegram-2-line'
import IconRiWeiboLine from '~icons/ri/weibo-line'
import IconRiZhihuLine from '~icons/ri/zhihu-line'
import IconRiTiktokLine from '~icons/ri/tiktok-line'
import IconMaterialSymbolsMailOutlineRounded from '~icons/material-symbols/mail-outline-rounded'
import IconMdiEarth from '~icons/mdi/earth'

defineOptions({ name: 'MessagePage' })

// ===== 社交图标 =====
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
const socialIconComp = (icon: string) => socialIconMap[icon] || IconMdiEarth

interface BrandColor {
  bg: string
  color: string
  hoverBg: string
  hoverColor: string
  border: string
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

const defaultBrand: BrandColor = {
  bg: 'var(--home-card-alt)',
  color: 'var(--home-text)',
  hoverBg: 'var(--home-text)',
  hoverColor: 'var(--home-surface)',
  border: 'var(--home-border)'
}

const brandStyle = (icon: string): Record<string, string> => {
  const brand = brandColors[icon] || defaultBrand
  return {
    '--sl-bg': brand.bg,
    '--sl-color': brand.color,
    '--sl-hover-bg': brand.hoverBg,
    '--sl-hover-color': brand.hoverColor,
    '--sl-border': brand.border
  }
}

// ===== 数据 =====
const authorName = ref('')
const authorAvatar = ref('')
const aboutDescribe = ref('')
const aboutDescribeTips = ref('')
const aboutExhibition = ref('')
const aboutStory = ref('')
const profileList = ref<{ label: string; value: string }[]>([])
const hometown = ref('')
const mottoText = ref('')
const mottoSub = ref('')
const personalityTags = ref<string[]>([])
const socialLinks = ref<{ name: string; url: string; icon: string }[]>([])
const stats = reactive({ totalArticles: 0, totalComments: 0, runningDays: 0, totalWords: 0 })

// ===== 留言板 =====
const commentForm = ref<UnifiedCommentForm>({ nickname: '', email: '', website: '', content: '' })
const commentEmptyText = '还没有留言，来留下第一句问候吧。'
const comments = ref<ReturnType<typeof normalizeCommentList>>([])
const loading = ref(false)
const submitting = ref(false)
const normalizedComments = computed<UnifiedCommentItem[]>(() =>
  comments.value.map((i) => ({ id: i.id, author: i.author, avatar: i.avatar, content: i.content, publishTime: i.publishTime, website: i.website, replyTo: i.replyTo }))
)

const fetchComments = async () => {
  loading.value = true
  try {
    const res = await getCommentList({ target_type: 'page', target_key: 'message', page: 1, page_size: 50 })
    comments.value = normalizeCommentList(res.data?.list ?? [])
  } catch { comments.value = [] }
  finally { loading.value = false }
}

const handleSubmit = async () => {
  const nickname = commentForm.value.nickname.trim()
  const email = commentForm.value.email.trim()
  const content = commentForm.value.content.trim()

  if (!nickname || !email || !content) {
    ElMessage.warning('请填写昵称、邮箱和留言内容。')
    return
  }

  if (Array.from(nickname).length < 2) {
    ElMessage.warning('昵称至少需要 2 个字符。')
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning('请输入有效的邮箱地址。')
    return
  }

  submitting.value = true
  try {
    const response = await createComment({
      target_type: 'page',
      target_key: 'message',
      content,
      nickname,
      email,
      website: commentForm.value.website.trim() || undefined
    })

    if (response.code !== 0) {
      throw new Error(response.message || '留言发送失败，请稍后重试。')
    }

    commentForm.value = { nickname: '', email: '', website: '', content: '' }
    await fetchComments()
    ElMessage.success('留言发表成功。')
  } catch (error) {
    console.error(error)
    const apiMessage = error instanceof Error ? error.message : '留言发送失败，请稍后重试。'
    ElMessage.error(apiMessage)
  }
  finally { submitting.value = false }
}
const handleFormUpdate = (v: UnifiedCommentForm) => { commentForm.value = v }

// ===== 初始化 =====
const fetchData = async () => {
  try {
    const [settingsRes, blogRes, articleRes] = await Promise.all([
      getBasicSettings(), getSettings('blog'), getArticleList({ page_size: 1 })
    ])
    const basic = settingsRes.data || {}
    authorName.value = basic['basic.author'] || '博客作者'
    authorAvatar.value = proxyImageUrl(basic['basic.author_avatar']) || ''
    try {
      const raw = blogRes.data?.['blog.sidebar_social']
      if (raw) socialLinks.value = JSON.parse(raw).filter((s: any) => s.url)
    } catch {}
    const blog = blogRes.data || {}
    aboutDescribe.value = blog['blog.about_describe'] || ''
    aboutDescribeTips.value = blog['blog.about_describe_tips'] || ''
    aboutExhibition.value = proxyImageUrl(blog['blog.about_exhibition']) || ''
    aboutStory.value = blog['blog.about_story'] || ''
    try {
      const profiles = blog['blog.about_profile'] ? JSON.parse(blog['blog.about_profile']) : []
      const normalizedProfiles = Array.isArray(profiles)
        ? profiles.filter((item: any) => item?.label && item?.value).map((item: any) => ({ label: String(item.label).trim(), value: String(item.value).trim() }))
        : []
      const hometownLabels = ['故乡', '家乡', '籍贯']
      const hometownItem = normalizedProfiles.find((item) => hometownLabels.includes(item.label))
      hometown.value = hometownItem?.value || ''
      profileList.value = normalizedProfiles.filter((item) => !hometownLabels.includes(item.label))
    } catch {
      hometown.value = ''
      profileList.value = []
    }
    try {
      const mottos = blog['blog.about_motto_main'] ? JSON.parse(blog['blog.about_motto_main']) : []
      mottoText.value = Array.isArray(mottos) ? mottos.filter(Boolean).join(' · ') : String(mottos || '')
    } catch { mottoText.value = blog['blog.about_motto_main'] || '' }
    mottoSub.value = blog['blog.about_motto_sub'] || ''
    personalityTags.value = (blog['blog.about_personality'] || '')
      .split(/[、，,|/\\]+/)
      .map((item: string) => item.trim())
      .filter(Boolean)
    stats.totalArticles = articleRes.data?.total || 0
    stats.runningDays = Math.floor((Date.now() - new Date('2023-01-01').getTime()) / 86400000)
    stats.totalComments = comments.value.length
    stats.totalWords = Math.floor(stats.totalArticles * 6720 / 1000)
  } catch {}
}

onMounted(() => { fetchComments(); fetchData() })
</script>

<style scoped lang="scss">
.message-page {
  min-height: 100vh;
  background: var(--home-surface);
  color: var(--home-text);
}

.message-shell {
  width: min(1170px, calc(100% - 48px));
  margin: 96px auto 84px;
  padding: 40px;
  border-radius: 12px;
  background: var(--home-card-alt);
  color: var(--home-text);
}

.about-intro {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
  align-items: center;
  gap: 48px;
  min-height: 520px;
  padding: 32px 0;
}

.intro-copy {
  max-width: 654px;
  padding-left: 16px;
}

.intro-greeting,
.intro-title,
.intro-description,
.intro-tips {
  color: var(--home-text);
}

.intro-greeting {
  margin: 0 0 8px;
  font-size: 28px;
  line-height: 1.3;
}

.intro-title {
  margin: 0;
  font-size: 42px;
  font-weight: 700;
  line-height: 1.2;
}

.intro-description {
  max-width: 650px;
  margin: 36px 0 0;
  font-size: 18px;
  line-height: 2;
}

.intro-tips {
  margin: 16px 0 0;
  font-size: 14px;
  line-height: 1.6;
}

.intro-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 36px;
}

.intro-action {
  padding: 6px 18px;
  border-radius: 8px;
  background: var(--home-surface);
  color: var(--home-text);
  font-size: 16px;
  line-height: 32px;
  text-decoration: none;
  transition: background var(--transition-fast), transform var(--transition-fast);

  &:hover,
  &:focus-visible {
    background: var(--home-card-bg);
    color: var(--home-text);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--home-text);
    outline-offset: 2px;
  }
}

.intro-portrait {
  width: min(100%, 436px);
  aspect-ratio: 0.8;
  justify-self: end;
  overflow: hidden;
  border-radius: 12px;
  background: var(--home-surface);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.numbered-section {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(0, 2fr);
  gap: 16px;
  align-items: stretch;
  margin-top: 16px;
  scroll-margin-top: 110px;
}

.section-marker {
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 358px;
}

.marker-top {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 24px;
}

.marker-number {
  color: var(--home-text);
  font-size: 14px;
  line-height: 1.2;
}

.marker-top h2 {
  margin: 12px 0 0;
  color: var(--home-text);
  font-size: 42px;
  font-weight: 700;
  line-height: 1.1;
}

.marker-foot {
  padding: 20px 24px;
  border-radius: 12px;
  background: var(--home-card-bg);
  color: var(--home-text);
  font-size: 18px;
  line-height: 1.5;
}

.section-content {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.content-card {
  border-radius: 12px;
  background: var(--home-card-bg);
  color: var(--home-text);
}

.profile-card {
  min-height: 266px;
  padding: 16px;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  height: 100%;
}

.profile-cell {
  display: flex;
  min-width: 0;
  min-height: 107px;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
}

.cell-label,
.card-eyebrow {
  display: block;
  margin-bottom: 12px;
  color: var(--home-text);
  font-size: 13px;
  line-height: 1.2;
}

.profile-cell strong,
.large-value {
  color: var(--home-text);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
}

.empty-profile {
  margin: 0;
  color: var(--home-text);
  font-size: 14px;
}

.exhibition-card {
  min-height: 76px;
  overflow: hidden;
}

.exhibition-card img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 76px;
  object-fit: cover;
}

.split-section {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.personality-card,
.motto-card {
  display: flex;
  min-height: 240px;
  flex-direction: column;
  padding: 36px 32px;
}

.large-value {
  display: block;
  font-size: 34px;
}

.card-caption {
  display: block;
  margin-top: auto;
  padding-top: 28px;
  color: var(--home-text);
  font-size: 14px;
  line-height: 1.7;
}

.motto-text {
  margin: 0;
  color: var(--home-text);
  font-size: 24px;
  font-weight: 600;
  font-style: normal;
  line-height: 1.5;
}

.platform-section {
  grid-template-columns: 1fr;
}

.platform-card {
  min-height: 240px;
  padding: 36px 32px;
}

.card-heading {
  margin: 0;
  color: var(--home-text);
  font-size: 30px;
  font-weight: 700;
  line-height: 1.25;
}

.platform-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 28px;
}

.platform-link {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 8px;
  background: var(--sl-bg, var(--home-surface));
  color: var(--sl-color, var(--home-text));
  font-size: 14px;
  line-height: 1.4;
  text-decoration: none;
  transition: opacity var(--transition-fast), transform var(--transition-fast);

  :deep(svg) {
    width: 17px;
    height: 17px;
    flex: 0 0 auto;
  }

  &:hover,
  &:focus-visible {
    background: var(--sl-hover-bg, var(--home-surface));
    color: var(--sl-hover-color, var(--home-text));
    opacity: 0.92;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--home-text);
    outline-offset: 2px;
  }
}

.site-section {
  margin-top: 16px;
}

.stats-card {
  min-height: 266px;
  padding: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px;
  height: 100%;
  align-items: center;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.stat-num {
  color: var(--home-text);
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
}

.stat-lbl {
  color: var(--home-text);
  font-size: 14px;
}

.section-block {
  margin-top: 64px;
}

.section-title {
  margin: 0 0 28px;
  color: var(--home-text);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.map-card {
  display: flex;
  min-height: 280px;
  align-items: flex-end;
  padding: 32px;
  border-radius: 12px;
  background: var(--home-card-bg);
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.map-label {
  color: var(--home-text);
  font-size: 14px;
}

.map-place {
  color: var(--home-text);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
}

.map-text {
  margin: 0;
  color: var(--home-text);
  font-size: 18px;
}

.about-note {
  margin-top: 16px;
  padding: 36px 32px;
}

.about-note p {
  margin: 16px 0 0;
  color: var(--home-text);
  font-size: 16px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.message-shell :deep(.composer-card),
.message-shell :deep(.comment-card),
.message-shell :deep(.comment-empty) {
  border: 0;
  border-radius: 16px;
  background: var(--home-card-alt);
  box-shadow: none;
}

.message-shell :deep(.composer-card) {
  padding: 12px;
}

.message-shell :deep(.composer-topline) {
  gap: 10px;
  padding: 0 2px 10px;
}

.message-shell :deep(.info-field input) {
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--home-card-bg);
  color: var(--home-text);
}

.message-shell :deep(.info-field input:disabled),
.message-shell :deep(.info-field input::placeholder),
.message-shell :deep(.composer-body textarea::placeholder),
.message-shell :deep(.preview-placeholder),
.message-shell :deep(.comment-empty p),
.message-shell :deep(.board-author-side),
.message-shell :deep(.meta-line),
.message-shell :deep(.login-profile p) {
  color: var(--home-text);
  opacity: 1;
}

.message-shell :deep(.composer-body) {
  padding: 0 2px;
}

.message-shell :deep(.composer-body textarea) {
  min-height: 112px;
  padding: 14px;
  border-radius: 12px;
  background: var(--home-card-bg);
  color: var(--home-text);
}

.message-shell :deep(.composer-preview) {
  border-top: 0;
}

.message-shell :deep(.plain-icon) {
  color: var(--home-text);
}

.message-shell :deep(.plain-icon:hover),
.message-shell :deep(.plain-icon:focus-visible) {
  color: var(--home-text);
  background: var(--home-card-bg);
}

.message-shell :deep(.composer-footer) {
  padding: 12px 2px 2px;
}

.message-shell :deep(.login-button) {
  border: 0;
  border-radius: 8px;
  background: var(--home-card-bg);
  color: var(--home-text);
}

.message-shell :deep(.submit-button) {
  border-radius: 10px;
  background: var(--home-text);
  color: var(--home-surface);
}

.message-shell :deep(.comment-list) {
  gap: 16px;
}

.message-shell :deep(.comment-card) {
  background: var(--home-card-bg);
}

.message-shell :deep(.board-card) {
  display: block;
  padding: 22px 24px;
}

.message-shell :deep(.board-card .comment-text) {
  margin: 0;
  font-size: 16px;
  line-height: 1.8;
}

.message-shell :deep(.board-card .board-meta) {
  margin: 0 0 18px;
}

.message-shell :deep(.board-card .board-author-copy strong) {
  font-size: 14px;
}

.message-shell :deep(.board-card .board-author-side) {
  font-size: 12px;
}

.message-shell :deep(.comment-image),
.message-shell :deep(.preview-image) {
  border: 0;
}

.message-shell :deep(.comment-avatar) {
  border-radius: 4px;
  background: var(--home-card-alt);
  color: var(--home-text);
}

@media (max-width: 900px) {
  .message-shell {
    width: min(100% - 24px, 680px);
    margin-top: 72px;
    padding: 24px;
  }

  .about-intro {
    grid-template-columns: 1fr;
    min-height: 0;
    gap: 32px;
    padding: 16px 0 32px;
  }

  .intro-copy {
    padding-left: 0;
  }

  .intro-portrait {
    width: min(100%, 360px);
    justify-self: start;
    aspect-ratio: 1;
  }

  .numbered-section {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .section-marker {
    min-height: 0;
    gap: 20px;
  }

  .marker-top {
    min-height: 0;
    flex-direction: row;
    align-items: baseline;
    justify-content: flex-start;
    gap: 16px;
    padding: 24px 0;
  }

  .marker-top h2 {
    margin: 0;
    font-size: 32px;
  }

  .marker-foot {
    display: inline-block;
    width: fit-content;
  }

  .profile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-block {
    margin-top: 48px;
  }

  .section-title {
    font-size: 24px;
  }
}

@media (max-width: 560px) {
  .message-shell {
    width: calc(100% - 16px);
    margin-top: 56px;
    padding: 16px;
  }

  .intro-greeting {
    font-size: 22px;
  }

  .intro-title {
    font-size: 34px;
  }

  .intro-description {
    margin-top: 24px;
    font-size: 16px;
  }

  .intro-actions {
    margin-top: 28px;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }

  .personality-card,
  .motto-card,
  .platform-card,
  .stats-card,
  .about-note {
    padding: 24px 20px;
  }

  .split-section {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    gap: 24px 16px;
  }

  .stat-num {
    font-size: 28px;
  }

  .map-card {
    min-height: 220px;
    padding: 24px 20px;
  }

  .map-place {
    font-size: 24px;
  }
}
</style>

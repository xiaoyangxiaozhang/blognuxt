<template>
  <section class="about-page" :class="{ 'page-revealed': isRevealed }">
    <PageCurtain v-model="curtainReady" @opened="onCurtainOpened" />

    <!-- ========== Hero 区域（与动态首页一致） ========== -->
    <div class="about-hero">
      <div class="hero-media">
        <img src="~/assets/img/background.png" alt="About cover" class="hero-image" />
        <div class="hero-overlay"></div>

        <!-- 真实留言弹幕层 -->
        <div v-if="bulletTracks.length" class="bullet-screen" aria-hidden="true">
          <div class="bullet-track" v-for="(track, ti) in bulletTracks" :key="ti">
            <span
              v-for="msg in track"
              :key="msg.key"
              class="bullet-text"
              :style="{ animationDelay: msg.delay + 's' }"
            >
              {{ msg.text }}
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- ========== 内容区 ========== -->
    <div class="about-shell">
      <!-- 01 / 博主信息 -->
      <section class="section-block">
        <span class="section-number">01</span>
        <h2 class="section-title">博主信息</h2>

        <div class="info-grid">
          <article class="info-card">
            <div class="profile-header">
              <div class="profile-avatar">
                <img :src="authorAvatar || '~/assets/img/dashboard.png'" :alt="authorName" />
              </div>
              <div class="profile-meta">
                <h3 class="profile-name">{{ authorName || '博客作者' }}</h3>
                <p class="profile-desc">{{ authorDesc || '这位博主还没有填写简介' }}</p>
              </div>
            </div>
            <div class="card-divider"></div>
            <dl v-if="profileList.length" class="profile-list">
              <div v-for="item in profileList" :key="`${item.label}-${item.value}`" class="profile-item">
                <dt>{{ item.label }}</dt><dd>{{ item.value }}</dd>
              </div>
            </dl>
            <p v-else class="empty-profile">暂未填写公开资料</p>
          </article>

          <article class="info-card">
            <h3 class="card-title">社交 &amp; 创作</h3>
            <div class="social-row">
              <a v-for="item in socialLinks" :key="item.name" :href="item.url" target="_blank" rel="noopener noreferrer" class="social-btn" :title="item.name" :style="{ background: socialColor(item.icon) }">
                <component :is="socialIconComp(item.icon)" />
              </a>
            </div>
            <div class="card-divider"></div>
            <div class="motto-block">
              <span class="meta-label">座右铭</span>
              <p class="motto-text">{{ mottoText ? `「${mottoText}」` : '暂未填写座右铭' }}</p>
              <small v-if="mottoSub" class="motto-sub">{{ mottoSub }}</small>
            </div>
            <div class="card-divider"></div>
            <div class="tag-section">
              <span class="meta-label">性格标签</span>
              <div v-if="personalityTags.length" class="tag-group">
                <span v-for="(tag, index) in personalityTags" :key="tag" class="tag" :class="tagClasses[index % tagClasses.length]">{{ tag }}</span>
              </div>
              <div v-else class="empty-tags">暂未填写</div>
            </div>
          </article>
        </div>

        <article v-if="aboutDescribe || aboutStory" class="about-note">
          <h3 class="card-title">关于我</h3>
          <p v-if="aboutDescribe">{{ aboutDescribe }}</p>
          <p v-if="aboutStory">{{ aboutStory }}</p>
        </article>
      </section>

      <!-- 02 / 本站信息 -->
      <section class="section-block">
        <span class="section-number">02</span>
        <h2 class="section-title">本站信息</h2>
        <div class="stats-grid">
          <div class="stat-card"><span class="stat-num">{{ stats.totalArticles }}</span><span class="stat-lbl">篇文章</span></div>
          <div class="stat-card"><span class="stat-num">{{ stats.totalComments }}</span><span class="stat-lbl">条留言</span></div>
          <div class="stat-card"><span class="stat-num">{{ stats.runningDays }}</span><span class="stat-lbl">运行天数</span></div>
          <div class="stat-card"><span class="stat-num">{{ stats.totalWords }}k</span><span class="stat-lbl">累计字数</span></div>
        </div>
      </section>

      <!-- 03 / 足迹地图（预留） -->
      <section class="section-block">
        <span class="section-number">03</span>
        <h2 class="section-title">足迹地图</h2>
        <div class="map-card">
          <div class="map-placeholder">
            <span class="map-icon">🗺️</span>
            <p class="map-text">足迹地图加载中...</p>
            <p class="map-hint">走过 {{ cities.length }} 个城市</p>
          </div>
        </div>
      </section>

      <!-- 04 / 留言板 -->
      <section class="section-block">
        <span class="section-number">04</span>
        <h2 class="section-title">留言板</h2>
        <UnifiedCommentPanel
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
import { h } from 'vue'
import { ElMessage } from 'element-plus'
import UnifiedCommentPanel from '~/components/comments/UnifiedCommentPanel.vue'
import { getCommentList, createComment } from '~/services/api/comments'
import { normalizeCommentList } from '~/utils/comments'
import { getBasicSettings, getSettings } from '~/services/api/user'
import { getArticleList } from '~/services/api/article'
import type { UnifiedCommentForm, UnifiedCommentItem } from '~/components/comments/UnifiedCommentPanel.vue'
import PageCurtain from '~/components/shell/PageCurtain.vue'
import { proxyImageUrl } from '~/utils/image'

import IconMdiGithub from '~icons/mdi/github'
import IconRiBilibiliLine from '~icons/ri/bilibili-line'
import IconRiTwitterXLine from '~icons/ri/twitter-x-line'
import IconRiNeteaseCloudMusicLine from '~icons/ri/netease-cloud-music-line'
import IconMdiEarth from '~icons/mdi/earth'

defineOptions({ name: 'AboutPage' })

// ===== 社交图标 =====
const socialIconMap: Record<string, any> = {
  'github-line': IconMdiGithub,
  'bilibili-line': IconRiBilibiliLine,
  'twitter-x-line': IconRiTwitterXLine,
  'netease-cloud-music-line': IconRiNeteaseCloudMusicLine
}
const socialIconComp = (icon: string) => socialIconMap[icon] || IconMdiEarth
const socialColor = (icon: string) => {
  const m: Record<string, string> = {
    'github-line': '#24292e', 'bilibili-line': '#00A1D6', 'twitter-x-line': '#000',
    'netease-cloud-music-line': '#C20C0C'
  }
  return m[icon] || '#8183ff'
}

// ===== 数据 =====
const authorName = ref('')
const authorAvatar = ref('')
const authorDesc = ref('')
const aboutDescribe = ref('')
const aboutStory = ref('')
const profileList = ref<{ label: string; value: string }[]>([])
const mottoText = ref('')
const mottoSub = ref('')
const personalityTags = ref<string[]>([])
const tagClasses = ['tag-accent', 'tag-blue', 'tag-amber']
const socialLinks = ref<{ name: string; url: string; icon: string }[]>([])
const stats = reactive({ totalArticles: 0, totalComments: 0, runningDays: 0, totalWords: 0 })
const cities = ['北京', '合肥', '南京', '上海', '武汉', '深圳']

const isRevealed = ref(false)
const curtainReady = ref(false)
const triggerReveal = () => setTimeout(() => { curtainReady.value = true }, 200)
const onCurtainOpened = () => { isRevealed.value = true }

// ===== 留言板 =====
const commentForm = ref<UnifiedCommentForm>({ nickname: '', email: '', website: '', content: '' })
const commentEmptyText = '还没有留言，来留下第一句问候吧。'
const comments = ref<ReturnType<typeof normalizeCommentList>>([])
const loading = ref(false)
const submitting = ref(false)
const bulletTracks = computed(() => {
  const messages = comments.value
    .map((item) => item.content.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((text) => text.length > 42 ? `${text.slice(0, 42)}…` : text)
    .slice(0, 12)

  if (!messages.length) return []

  const trackCount = Math.min(3, messages.length)
  return Array.from({ length: trackCount }, (_, ti) =>
    messages
      .filter((_, index) => index % trackCount === ti)
      .map((text, mi) => ({
        key: `${ti}-${mi}-${text}`,
        text,
        delay: mi * 2 + ((ti + mi) % 3) * 0.5
      }))
  )
})
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
    authorDesc.value = basic['basic.author_desc'] || ''
    authorAvatar.value = proxyImageUrl(basic['basic.author_avatar']) || ''
    try {
      const raw = blogRes.data?.['blog.sidebar_social']
      if (raw) socialLinks.value = JSON.parse(raw).filter((s: any) => s.url)
    } catch {}
    const blog = blogRes.data || {}
    aboutDescribe.value = blog['blog.about_describe'] || ''
    aboutStory.value = blog['blog.about_story'] || ''
    try {
      const profiles = blog['blog.about_profile'] ? JSON.parse(blog['blog.about_profile']) : []
      profileList.value = Array.isArray(profiles)
        ? profiles.filter((item: any) => item?.label && item?.value).map((item: any) => ({ label: item.label, value: item.value }))
        : []
    } catch { profileList.value = [] }
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

watch(loading, (v) => { if (!v && import.meta.client) triggerReveal() })
onMounted(() => { if (!loading.value) triggerReveal(); fetchComments(); fetchData() })
</script>

<style scoped lang="scss">
// ===== 整体 =====
.about-page { background: var(--home-surface); min-height: 100vh; }

// ===== Hero（与动态首页一致） =====
.about-hero {
  position: relative;
  background: var(--home-card-alt);
}

.hero-media {
  position: relative;
  aspect-ratio: 800 / 550;
  min-height: min(68.75vw, 520px);
  overflow: hidden;
  background: var(--home-card-alt);
}

.hero-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.08) 58%, rgba(0,0,0,0.3) 100%);
}

// ===== 弹幕（仅展示真实留言） =====
.bullet-screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 14px;
  padding: 80px 0 0;
  pointer-events: none;
  z-index: 1;
}

.bullet-track {
  display: flex;
  gap: 12px;
  white-space: nowrap;
  animation: bulletScroll 28s linear infinite;
  &:nth-child(2) { animation-duration: 32s; animation-delay: -6s; }
  &:nth-child(3) { animation-duration: 26s; animation-delay: -14s; }
}

@keyframes bulletScroll {
  0% { transform: translateX(100vw); }
  100% { transform: translateX(-200%); }
}

.bullet-text {
  display: inline-block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.92);
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
}

// ===== 内容区 =====
.about-shell {
  width: min(960px, calc(100% - 40px));
  margin: 0 auto;
  padding: 80px 0;
}

.section-block { margin-bottom: 48px; &:last-child { margin-bottom: 0; } }
.section-number { font-size: 12px; color: var(--brand-accent); font-weight: 500; letter-spacing: 0.06em; }
.section-title { margin: 6px 0 24px; font-size: 22px; font-weight: 500; color: var(--home-text); }

// ===== 信息双栏 =====
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

.info-card {
  background: var(--home-card-bg);
  border: 1px solid var(--home-border);
  border-radius: 12px;
  padding: 24px;
}

.profile-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }

.profile-avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 0;
  flex-shrink: 0;
  img { width: 100%; height: 100%; object-fit: cover; }
}

.profile-name { margin: 0 0 2px; font-size: 17px; font-weight: 500; color: var(--home-text); }
.profile-desc { margin: 0; font-size: 13px; color: var(--home-text-muted); }

.card-divider { height: 1px; background: var(--home-border); margin: 18px 0; }

.profile-list { display: grid; gap: 14px; }
.empty-profile, .empty-tags { margin: 0; color: var(--home-text-muted); font-size: 13px; }
.profile-item { display: grid; grid-template-columns: 56px 1fr; align-items: baseline;
  dt { font-size: 12px; color: var(--home-text-muted); }
  dd { margin: 0; font-size: 14px; color: var(--home-text); }
}

// 右卡
.card-title { margin: 0 0 16px; font-size: 15px; font-weight: 500; color: var(--home-text); }

.social-row { display: flex; flex-wrap: wrap; gap: 10px; }

.social-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 50%;
  color: #fff; font-size: 16px; text-decoration: none;
  transition: all 0.25s ease;
  &:hover { transform: translateY(-2px) scale(1.1); opacity: 0.85; }
}

.meta-label { font-size: 12px; color: var(--home-text-muted); display: block; margin-bottom: 8px; }
.motto-text { margin: 0; font-size: 15px; color: var(--home-text); font-style: italic; }
.motto-sub { display: block; margin-top: 8px; color: var(--home-text-muted); font-size: 12px; }

.about-note {
  margin-top: 20px;
  padding: 22px 24px;
  border: 1px solid var(--home-border);
  border-radius: 12px;
  background: var(--home-card-bg);

  p { margin: 8px 0 0; color: var(--home-text-muted); font-size: 14px; line-height: 1.8; white-space: pre-wrap; }
}

.tag-section { }
.tag-group { display: flex; flex-wrap: wrap; gap: 8px; }
.tag { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.tag-accent { background: rgba(129,131,255,0.12); color: var(--brand-accent); }
.tag-blue { background: rgba(0,161,214,0.12); color: #00A1D6; }
.tag-amber { background: rgba(245,158,11,0.12); color: #f59e0b; }

// ===== 统计 =====
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

.stat-card {
  background: var(--home-card-bg); border: 1px solid var(--home-border);
  border-radius: 12px; padding: 24px 16px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}

.stat-num { font-size: 28px; font-weight: 500; color: var(--brand-accent); line-height: 1; }
.stat-lbl { font-size: 13px; color: var(--home-text-muted); }

// ===== 地图预留 =====
.map-card {
  background: var(--home-card-bg); border: 1px solid var(--home-border);
  border-radius: 12px; padding: 24px; min-height: 280px;
  display: flex; align-items: center; justify-content: center;
}

.map-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}

.map-icon { font-size: 36px; }
.map-text { margin: 0; font-size: 14px; color: var(--home-text-muted); }
.map-hint { margin: 0; font-size: 12px; color: var(--home-text-muted); opacity: 0.6; }

// ===== 响应式 =====
@media (max-width: 768px) {
  .info-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }

  .about-shell { padding: 64px 0 60px; }
  .bullet-screen { gap: 10px; padding: 60px 0 0; }
}
</style>

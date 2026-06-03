<template>
  <section class="about-page" :class="{ 'page-revealed': isRevealed }">
    <PageCurtain v-model="curtainReady" @opened="onCurtainOpened" />

    <!-- ========== Hero 区域（与动态首页一致） ========== -->
    <div class="about-hero">
      <div class="hero-media">
        <img src="~/assets/img/background.png" alt="About cover" class="hero-image" />
        <div class="hero-overlay"></div>

        <!-- 弹幕层 -->
        <div class="bullet-screen" aria-hidden="true">
          <div class="bullet-track" v-for="(track, ti) in bulletTracks" :key="ti">
            <span
              v-for="(msg, mi) in track"
              :key="mi"
              class="bullet-bubble"
              :style="{ animationDelay: msg.delay + 's', '--bullet-color': msg.color }"
            >
              <span class="bullet-avatar">{{ msg.initial }}</span>
              <span class="bullet-text">{{ msg.text }}</span>
            </span>
          </div>
        </div>
      </div>

      <div class="hero-meta">
        <div class="hero-text">
          <span class="hero-badge">ABOUT · MESSAGE</span>
          <h1 class="hero-title">关于 &amp; 留言</h1>
          <p class="hero-subtitle">了解我和这个站点，留下你的声音</p>
        </div>

        <div class="hero-avatar">
          <img :src="authorAvatar || '~/assets/img/dashboard.png'" :alt="authorName" />
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
                <h3 class="profile-name">{{ authorName || '小羊嚣张' }}</h3>
                <p class="profile-desc">前端开发 · 合肥 · 00后</p>
              </div>
            </div>
            <div class="card-divider"></div>
            <dl class="profile-list">
              <div class="profile-item"><dt>生日</dt><dd>2001年</dd></div>
              <div class="profile-item"><dt>学校</dt><dd>合肥工业大学</dd></div>
              <div class="profile-item"><dt>爱好</dt><dd>编码 / 游戏 / 音乐</dd></div>
              <div class="profile-item"><dt>梦想</dt><dd>成为一个有趣的人</dd></div>
            </dl>
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
              <p class="motto-text">「代码如诗，生活如歌」</p>
            </div>
            <div class="card-divider"></div>
            <div class="tag-section">
              <span class="meta-label">性格标签</span>
              <div class="tag-group">
                <span class="tag tag-accent">INTJ</span>
                <span class="tag tag-blue">双子座</span>
                <span class="tag tag-amber">乐天派</span>
              </div>
            </div>
          </article>
        </div>
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
        <div class="message-card">
          <UnifiedCommentPanel
            variant="board"
            :show-header="false"
            :comments="normalizedComments"
            :loading="loading"
            :submitting="submitting"
            :form="commentForm"
            :title="commentTitle"
            :tip="commentTip"
            :empty-text="commentEmptyText"
            @update:form="handleFormUpdate"
            @submit="handleSubmit"
          />
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { h } from 'vue'
import UnifiedCommentPanel from '~/components/comments/UnifiedCommentPanel.vue'
import { getCommentList, createComment } from '~/composables/api/comments'
import { normalizeCommentList } from '~/composables/commentDisplay'
import { getBasicSettings, getSettings } from '~/composables/api/user'
import { getArticleList } from '~/composables/api/article'
import type { UnifiedCommentForm, UnifiedCommentItem } from '~/components/comments/UnifiedCommentPanel.vue'
import PageCurtain from '~/components/layouts/PageCurtain.vue'

import IconMdiGithub from '~icons/mdi/github'
import IconRiBilibiliLine from '~icons/ri/bilibili-line'
import IconRiTwitterXLine from '~icons/ri/twitter-x-line'
import IconRiNeteaseCloudMusicLine from '~icons/ri/netease-cloud-music-line'
import IconMdiEarth from '~icons/mdi/earth'

defineOptions({ name: 'AboutPage' })

// ===== 弹幕 =====
const bulletColors = ['#8183ff', '#00A1D6', '#C20C0C', '#26A5E4', '#E6162D', '#0084FF', '#10b981']
const sampleMessages = [
  '好棒的博客！', '学到很多知识', '加油哦～', '同款博客！', '大佬带带我吧',
  '写得真好～', '关注了！', '未来可期', '加油！', '很喜欢这个主题',
  '有被安利到', '收藏了！', '好厉害！', '向你学习', '太强了吧'
]
const bulletTracks = Array.from({ length: 3 }, (_, ti) =>
  Array.from({ length: 6 }, (_, mi) => ({
    text: sampleMessages[(ti * 6 + mi) % sampleMessages.length],
    delay: mi * 2 + Math.random() * 3,
    color: bulletColors[Math.floor(Math.random() * bulletColors.length)],
    initial: '访'
  }))
)

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
const socialLinks = ref<{ name: string; url: string; icon: string }[]>([])
const stats = reactive({ totalArticles: 0, totalComments: 0, runningDays: 0, totalWords: 0 })
const cities = ['北京', '合肥', '南京', '上海', '武汉', '深圳']

const isRevealed = ref(false)
const curtainReady = ref(false)
const triggerReveal = () => setTimeout(() => { curtainReady.value = true }, 200)
const onCurtainOpened = () => { isRevealed.value = true }

// ===== 留言板 =====
const commentForm = ref<UnifiedCommentForm>({ nickname: '', email: '', website: '', content: '' })
const commentTitle = '留言'
const commentTip = '支持表情和图片上传，留下联系方式后，回复会更方便送达。'
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
  const { nickname, email, content } = commentForm.value
  if (!nickname.trim() || !email.trim() || !content.trim()) return
  submitting.value = true
  try {
    await createComment({ target_type: 'page', target_key: 'message', content: content.trim(), nickname: nickname.trim(), email: email.trim(), website: commentForm.value.website.trim() || undefined })
    commentForm.value = { nickname: '', email: '', website: '', content: '' }
    await fetchComments()
  } catch {}
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
    authorName.value = basic['basic.author'] || '小羊嚣张'
    authorAvatar.value = proxyImageUrl(basic['basic.author_avatar']) || ''
    try {
      const raw = blogRes.data?.['blog.sidebar_social']
      if (raw) socialLinks.value = JSON.parse(raw).filter((s: any) => s.url)
    } catch {}
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

// ===== 弹幕（覆盖在图片上方 overlay 之下） =====
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

.bullet-bubble {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px 5px 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.92);

  .bullet-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: var(--bullet-color, #8183ff);
    color: #fff;
    font-size: 9px;
    font-weight: 500;
    flex-shrink: 0;
  }

  .bullet-text { white-space: nowrap; }
}

// ===== Hero meta（定位与动态首页一致） =====
.hero-meta {
  position: absolute;
  right: 38px;
  bottom: -80px;
  z-index: 2;
  width: min(100% - 38px, 480px);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.hero-text {
  flex: 1;
}

.hero-badge {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 999px;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  color: rgba(255,255,255,0.85);
  font-size: 11px;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}

.hero-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: rgba(255,255,255,0.96);
  line-height: 1.2;
}

.hero-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: rgba(255,255,255,0.6);
}

.hero-avatar {
  width: 90px;
  height: 90px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--home-card-bg);
  box-shadow: 0 10px 24px rgba(0,0,0,0.08);
  border: 3px solid rgba(255,255,255,0.92);
  flex-shrink: 0;

  img { width: 100%; height: 100%; object-fit: cover; }
}

// ===== 内容区 =====
.about-shell {
  width: min(960px, calc(100% - 40px));
  margin: 0 auto;
  padding: 130px 0 80px;
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
  border: 2px solid var(--brand-accent);
  flex-shrink: 0;
  img { width: 100%; height: 100%; object-fit: cover; }
}

.profile-name { margin: 0 0 2px; font-size: 17px; font-weight: 500; color: var(--home-text); }
.profile-desc { margin: 0; font-size: 13px; color: var(--home-text-muted); }

.card-divider { height: 1px; background: var(--home-border); margin: 18px 0; }

.profile-list { display: grid; gap: 14px; }
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

// ===== 留言板 =====
.message-card { background: var(--home-card-bg); border: 1px solid var(--home-border); border-radius: 12px; padding: 24px; }

// ===== 响应式 =====
@media (max-width: 768px) {
  .info-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }

  .hero-meta { right: 16px; bottom: -60px; width: min(100% - 16px, 360px); }
  .hero-title { font-size: 22px; }
  .hero-avatar { width: 70px; height: 70px; }
  .about-shell { padding: 100px 0 60px; }
  .bullet-screen { gap: 10px; padding: 60px 0 0; gap: 10px; }
  .bullet-bubble { font-size: 11px; padding: 4px 10px 4px 4px; }
}
</style>

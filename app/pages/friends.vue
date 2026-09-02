<template>
  <div class="friends-page">
    <PageCurtain v-model="curtainReady" />

    <section class="friends-shell">
      <div v-if="pending" class="state-card">
        <el-skeleton :rows="6" animated />
      </div>

      <div v-else-if="pageError" class="state-card">
        <el-alert :title="pageError" type="error" show-icon />
      </div>

      <template v-else>
        <header class="friends-header">
          <div>
            <h1 class="friends-title">友链</h1>
          </div>
          <a class="apply-anchor" href="#apply">申请友链</a>
        </header>

        <div v-if="groups.length" class="friends-groups">
          <section v-for="group in groups" :key="group.type_id || 'uncategorized'" class="friend-group">
            <div class="group-heading">
              <h2>{{ group.type_name || '友情链接' }}</h2>
              <span>{{ group.friends.length }} 个站点</span>
            </div>

            <div class="friend-grid">
              <a
                v-for="friend in group.friends"
                :key="friend.id"
                class="friend-card"
                :class="{ 'is-invalid': friend.is_invalid }"
                :href="safeUrl(friend.url)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img v-if="friend.avatar" class="friend-avatar" :src="proxyImageUrl(friend.avatar)" :alt="friend.name">
                <div v-else class="friend-avatar friend-avatar-fallback">{{ friend.name.slice(0, 1) }}</div>
                <div class="friend-copy">
                  <h3>{{ friend.name }}</h3>
                  <p>{{ friend.description || '这个站点还没有留下简介。' }}</p>
                  <small v-if="friend.is_invalid">暂时无法访问</small>
                </div>
              </a>
            </div>
          </section>
        </div>

        <div v-else class="empty-state">
          <h2>还没有友链</h2>
          <p>欢迎提交你的网站，审核通过后会展示在这里。</p>
        </div>

        <section id="apply" class="apply-card">
          <div class="section-heading">
            <h2>申请友链</h2>
            <p>提交后由管理员审核，审核通过后会出现在友链列表中。</p>
          </div>

          <div v-if="!isLoggedIn" class="login-hint">
            <p>登录后才能提交友链申请。</p>
            <button type="button" class="primary-button" @click="loginDialogOpen = true">登录并申请</button>
          </div>

          <form v-else class="apply-form" @submit.prevent="submitApplication">
            <div class="form-grid">
              <label>
                <span>网站名称</span>
                <input v-model="application.name" required maxlength="50" placeholder="例如：我的博客">
              </label>
              <label>
                <span>网站地址</span>
                <input v-model="application.url" required type="url" maxlength="255" placeholder="https://example.com">
              </label>
              <label>
                <span>头像 / Logo 地址</span>
                <input v-model="application.avatar" required type="url" maxlength="255" placeholder="https://example.com/logo.png">
              </label>
              <label>
                <span>网站截图地址（可选）</span>
                <input v-model="application.screenshot" type="url" maxlength="255" placeholder="https://example.com/screenshot.png">
              </label>
            </div>
            <label>
              <span>网站描述</span>
              <textarea v-model="application.description" required maxlength="500" rows="4" placeholder="用一句话介绍你的网站。" />
            </label>
            <div class="form-actions">
              <p v-if="applicationSubmitted" class="success-text">申请已提交，请等待管理员审核。</p>
              <button class="primary-button" type="submit" :disabled="submitting">
                {{ submitting ? '提交中…' : '提交申请' }}
              </button>
            </div>
          </form>
        </section>
      </template>
    </section>
  </div>

  <LoginDialog
    v-model="loginDialogOpen"
    @login-success="onLoginSuccess"
    @forgot-password="openAccount('reset')"
  />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import LoginDialog from '~/components/shell/LoginDialog.vue'
import PageCurtain from '~/components/shell/PageCurtain.vue'
import { useCommentAuth } from '~/composables/useCommentAuth'
import { useSiteOverlays } from '~/composables/useSiteOverlays'
import { applyFriend, getFriendList, type ApplyFriendPayload, type FriendGroup } from '~/services/api/friends'
import { proxyImageUrl } from '~/utils/image'

const { data, pending, error: requestError } = await useAsyncData('friends-page', getFriendList)
const groups = computed<FriendGroup[]>(() => data.value?.data.groups || [])
const pageError = computed(() => requestError.value ? '友链加载失败，请稍后重试。' : '')

const { isLoggedIn, fetchProfile } = useCommentAuth()
const { openAccount } = useSiteOverlays()
const loginDialogOpen = ref(false)
const submitting = ref(false)
const applicationSubmitted = ref(false)
const curtainReady = ref(false)

const application = reactive<ApplyFriendPayload>({
  name: '',
  url: '',
  description: '',
  avatar: '',
  screenshot: ''
})

const safeUrl = (url: string) => /^https?:\/\//i.test(url.trim()) ? url.trim() : '#'

const submitApplication = async () => {
  if (!isLoggedIn.value) {
    loginDialogOpen.value = true
    return
  }

  submitting.value = true
  try {
    await applyFriend({
      name: application.name.trim(),
      url: application.url.trim(),
      description: application.description.trim(),
      avatar: application.avatar.trim(),
      screenshot: application.screenshot.trim() || undefined
    })
    applicationSubmitted.value = true
    ElMessage.success('友链申请已提交。')
  } catch (error) {
    console.error(error)
    ElMessage.error('友链申请提交失败，请检查信息后重试。')
  } finally {
    submitting.value = false
  }
}

const onLoginSuccess = async () => {
  await fetchProfile()
}

const openCurtain = () => {
  setTimeout(() => { curtainReady.value = true }, 150)
}

watch(pending, (value) => {
  if (!value && import.meta.client) openCurtain()
})

onMounted(() => {
  fetchProfile()
  if (!pending.value) openCurtain()
})
</script>

<style scoped lang="scss">
.friends-page {
  min-height: 100vh;
  background: var(--home-surface);
  color: var(--home-text);
}

.friends-shell {
  width: min(1000px, calc(100% - 60px));
  margin: 0 auto;
  padding: 104px 0 72px;
}

.friends-header,
.group-heading,
.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.friends-header {
  margin-bottom: 42px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--brand-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.friends-title,
.section-heading h2,
.group-heading h2,
.empty-state h2 {
  margin: 0;
  font-weight: 700;
}

.friends-title {
  font-size: 34px;
}

.apply-anchor,
.primary-button {
  border: 1px solid var(--brand-accent);
  border-radius: 999px;
  padding: 10px 18px;
  background: transparent;
  color: var(--brand-accent);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;

  &:hover {
    background: var(--brand-accent);
    color: #fff;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.friends-groups {
  display: grid;
  gap: 42px;
}

.group-heading {
  justify-content: flex-start;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--home-border);
}

.group-heading h2 {
  font-size: 21px;
}

.group-heading span {
  color: var(--text-muted);
  font-size: 12px;
}

.friend-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.friend-card,
.apply-card,
.state-card,
.empty-state {
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background: var(--home-card-bg);
}

.friend-card {
  display: flex;
  gap: 14px;
  min-height: 116px;
  padding: 18px;
  color: inherit;
  text-decoration: none;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--brand-accent);
    box-shadow: 0 12px 24px rgba(20, 40, 70, 0.08);
  }

  &.is-invalid {
    opacity: 0.56;
  }
}

.friend-avatar {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  border-radius: 12px;
  object-fit: cover;
}

.friend-avatar-fallback {
  display: grid;
  place-items: center;
  background: var(--brand-accent-soft);
  color: var(--brand-accent);
  font-size: 20px;
  font-weight: 700;
}

.friend-copy {
  min-width: 0;

  h3,
  p,
  small {
    margin: 0;
  }

  h3 {
    font-size: 16px;
  }

  p {
    display: -webkit-box;
    margin-top: 7px;
    overflow: hidden;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.6;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  small {
    display: block;
    margin-top: 6px;
    color: var(--text-muted);
    font-size: 11px;
  }
}

.empty-state,
.state-card {
  padding: 30px;
  color: var(--text-muted);
}

.empty-state {
  margin-bottom: 42px;
  text-align: center;

  p {
    margin: 10px 0 0;
  }
}

.apply-card {
  margin-top: 48px;
  padding: 28px;
}

.section-heading {
  margin-bottom: 24px;

  h2 {
    font-size: 24px;
  }

  p:last-child {
    margin: 10px 0 0;
    color: var(--text-muted);
    font-size: 13px;
  }
}

.login-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 18px;
  border-top: 1px solid var(--home-border);

  p {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
  }
}

.apply-form,
.form-grid {
  display: grid;
  gap: 16px;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.apply-form label {
  display: grid;
  gap: 7px;

  span {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
  }
}

.apply-form input,
.apply-form textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--home-border);
  border-radius: 10px;
  padding: 11px 13px;
  background: var(--bg-panel-solid);
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--brand-accent);
    box-shadow: 0 0 0 3px var(--brand-accent-soft);
  }
}

.apply-form textarea {
  resize: vertical;
}

.form-actions {
  align-items: center;
  justify-content: flex-end;
  margin-top: 2px;
}

.success-text {
  margin: 0 auto 0 0;
  color: #2f8f61;
  font-size: 13px;
}

@media (max-width: 820px) {
  .friend-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .friends-shell {
    width: min(100% - 40px, 600px);
    padding: 80px 0 56px;
  }

  .friends-header,
  .login-hint {
    align-items: flex-start;
    flex-direction: column;
  }

  .friend-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .apply-card {
    padding: 22px;
  }
}
</style>

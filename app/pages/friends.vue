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
                :class="{ 'is-invalid': friend.is_invalid, 'is-previewing': activeFriendId === friend.id && canShowPreview(friend) }"
                :href="safeUrl(friend.url)"
                target="_blank"
                rel="noopener noreferrer"
                @mouseenter="showPreview(friend, $event, 'pointer')"
                @mouseleave="hidePreview(friend.id)"
                @focus="showPreview(friend, $event, 'focus')"
                @blur="hidePreview(friend.id)"
                @keydown.esc="hidePreview(friend.id)"
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

          <div v-if="!canApply" class="login-hint">
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
    <LoginDialog
      v-model="loginDialogOpen"
      @login-success="onLoginSuccess"
      @forgot-password="openAccount('reset')"
    />
    <Teleport to="body">
      <Transition name="friend-preview" :css="previewTrigger === 'pointer'">
        <div
          v-if="activeFriend && canShowPreview(activeFriend)"
          class="friend-preview"
          :class="{ 'is-text-only': !previewImage(activeFriend), 'is-keyboard': previewTrigger === 'focus' }"
          :style="previewStyle"
          aria-hidden="true"
        >
          <div v-if="previewImage(activeFriend)" class="friend-preview-media">
            <img
              :src="previewImage(activeFriend)"
              :class="{ 'is-loaded': loadedPreviewImages[previewImage(activeFriend)] }"
              alt=""
              @load="loadedPreviewImages[previewImage(activeFriend)] = true"
              @error="onPreviewImageError(activeFriend)"
            >
          </div>
          <div v-if="!hasScreenshot(activeFriend)" class="friend-preview-copy">
            <span class="friend-preview-label">{{ previewLabel(activeFriend) }}</span>
            <h3>{{ previewMetadata[activeFriend.id]?.title || activeFriend.name }}</h3>
            <p>{{ previewMetadata[activeFriend.id]?.description || activeFriend.description }}</p>
            <small v-if="activeFriend.is_invalid">暂时无法访问</small>
          </div>
          <small v-else-if="activeFriend.is_invalid" class="friend-preview-invalid">暂时无法访问</small>
        </div>
      </Transition>
      <div
        v-if="previewTrigger === 'focus' && activeFriend && canShowPreview(activeFriend)"
        class="friend-preview-focus-ring"
        :style="focusRingStyle"
        aria-hidden="true"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import LoginDialog from '~/components/shell/LoginDialog.vue'
import PageCurtain from '~/components/shell/PageCurtain.vue'
import { useCommentAuth } from '~/composables/useCommentAuth'
import { useSiteOverlays } from '~/composables/useSiteOverlays'
import { applyFriend, getFriendList, getFriendPreview, type ApplyFriendPayload, type FriendGroup, type FriendItem, type FriendPreview } from '~/services/api/friends'
import { proxyImageUrl } from '~/utils/image'

const { data, pending, error: requestError } = await useAsyncData('friends-page', getFriendList)
const groups = computed<FriendGroup[]>(() => data.value?.data.groups || [])
const pageError = computed(() => requestError.value ? '友链加载失败，请稍后重试。' : '')

const { isLoggedIn, fetchProfile } = useCommentAuth()
const { openAccount } = useSiteOverlays()
const authViewReady = ref(false)
const canApply = computed(() => authViewReady.value && isLoggedIn.value)
const loginDialogOpen = ref(false)
const submitting = ref(false)
const applicationSubmitted = ref(false)
const curtainReady = ref(false)
const previewMetadata = reactive<Record<number, FriendPreview | null>>({})
const brokenPreviewImages = reactive<Record<string, boolean>>({})
const loadedPreviewImages = reactive<Record<string, boolean>>({})
const requestedPreviewIds = new Set<number>()
const activeFriendId = ref<number | null>(null)
const previewTrigger = ref<'pointer' | 'focus'>('pointer')
const previewStyle = ref<Record<string, string>>({})
const focusRingStyle = ref<Record<string, string>>({})
const activeFriend = computed(() => groups.value.flatMap(group => group.friends).find(friend => friend.id === activeFriendId.value) || null)

const application = reactive<ApplyFriendPayload>({
  name: '',
  url: '',
  description: '',
  avatar: '',
  screenshot: ''
})

const safeUrl = (url: string) => /^https?:\/\//i.test(url.trim()) ? url.trim() : '#'

const previewImage = (friend: FriendItem) => {
  if (hasScreenshot(friend)) return proxyImageUrl(friend.screenshot)
  const image = previewMetadata[friend.id]?.image
  return image && !brokenPreviewImages[image] ? image : ''
}

const hasScreenshot = (friend: FriendItem) => Boolean(friend.screenshot && !brokenPreviewImages[friend.screenshot])

const canShowPreview = (friend: FriendItem) => Boolean(previewImage(friend) || previewMetadata[friend.id]?.title || previewMetadata[friend.id]?.description)

const previewLabel = (friend: FriendItem) => {
  const image = previewMetadata[friend.id]?.image
  return image && !brokenPreviewImages[image] ? '站点预览' : '站点信息'
}

const loadPreview = async (id: number) => {
  if (requestedPreviewIds.has(id)) return
  requestedPreviewIds.add(id)
  try {
    previewMetadata[id] = (await getFriendPreview(id)).data
  } catch {
    previewMetadata[id] = null
  }
}

const prefetchMissingPreviews = () => {
  if (!import.meta.client) return
  const queue = groups.value.flatMap(group => group.friends).filter(friend => !friend.screenshot && !requestedPreviewIds.has(friend.id))
  const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
    while (queue.length) {
      const friend = queue.shift()
      if (friend) await loadPreview(friend.id)
    }
  })
  void Promise.all(workers)
}

const showPreview = (friend: FriendItem, event: Event, trigger: 'pointer' | 'focus') => {
  if (trigger === 'pointer' && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const width = Math.min(Math.max(420, rect.width), window.innerWidth - 24)
  const height = Math.min(hasScreenshot(friend) ? Math.min(280, Math.max(220, width * 0.52)) : 220, window.innerHeight - 24)
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
  const top = Math.max(12, Math.min(rect.top, window.innerHeight - height - 12))
  previewStyle.value = {
    left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`,
    '--preview-from': `translate(${rect.left - left}px, ${rect.top - top}px) scale(${rect.width / width}, ${rect.height / height})`
  }
  focusRingStyle.value = { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` }
  previewTrigger.value = trigger
  activeFriendId.value = friend.id
}

const hidePreview = (id?: number) => {
  if (id === undefined || activeFriendId.value === id) activeFriendId.value = null
}

const onPreviewImageError = (friend: FriendItem) => {
  if (friend.screenshot && !brokenPreviewImages[friend.screenshot]) {
    brokenPreviewImages[friend.screenshot] = true
    void loadPreview(friend.id)
    return
  }
  const image = previewMetadata[friend.id]?.image
  if (image) brokenPreviewImages[image] = true
}

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

watch(groups, prefetchMissingPreviews, { immediate: true })

onMounted(() => {
  authViewReady.value = true
  fetchProfile()
  if (!pending.value) openCurtain()
  document.addEventListener('scroll', hidePreviewOnScroll, { capture: true, passive: true })
  window.addEventListener('resize', hidePreviewOnScroll)
})

const hidePreviewOnScroll = () => hidePreview()

onBeforeUnmount(() => {
  document.removeEventListener('scroll', hidePreviewOnScroll, true)
  window.removeEventListener('resize', hidePreviewOnScroll)
})
</script>

<style scoped lang="scss">
.friends-page {
  min-height: 100dvh;
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
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.18s ease-out;

  &:focus-visible {
    outline: 2px solid var(--brand-accent);
    outline-offset: 3px;
  }

  &.is-invalid {
    opacity: 0.56;
  }

  &.is-previewing {
    opacity: 0;
    transform: none;
  }

  &.is-previewing:focus-visible {
    transition: none;
  }
}

@media (hover: hover) and (pointer: fine) {
  .friend-card:hover:not(.is-previewing) {
    transform: translateY(-3px);
    border-color: var(--brand-accent);
    box-shadow: 0 12px 24px rgba(20, 40, 70, 0.08);
  }
}

.friend-preview {
  position: fixed;
  z-index: 80;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background: var(--home-card-bg);
  box-shadow: 0 20px 44px rgba(20, 40, 70, 0.18);
  color: var(--home-text);
  pointer-events: none;
  transform-origin: top left;
}

.friend-preview-media {
  position: relative;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
  background: var(--home-surface);

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    transition: opacity 0.16s ease-out;

    &.is-loaded { opacity: 1; }
  }
}

.friend-preview-copy {
  flex: 0 0 auto;
  min-width: 0;
  padding: 10px 16px 12px;

  h3,
  p,
  small {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  h3 { font-size: 15px; }
  p { margin-top: 3px; color: var(--text-muted); font-size: 12px; }
  small { display: block; margin-top: 3px; color: var(--text-muted); font-size: 11px; }
}

.friend-preview-label {
  display: block;
  margin-bottom: 3px;
  color: var(--brand-accent);
  font-size: 11px;
  font-weight: 700;
}

.friend-preview-invalid {
  position: absolute;
  right: 12px;
  bottom: 12px;
  border-radius: 6px;
  padding: 4px 8px;
  background: var(--home-card-bg);
  color: var(--text-muted);
  font-size: 11px;
}

.friend-preview.is-keyboard .friend-preview-media img {
  transition: none;
}

.friend-preview.is-text-only {
  justify-content: flex-end;

  .friend-preview-copy {
    padding: 22px;

    h3 { font-size: 20px; }
    p { margin-top: 10px; white-space: normal; line-height: 1.6; }
  }
}

.friend-preview-focus-ring {
  position: fixed;
  z-index: 81;
  box-sizing: border-box;
  border: 2px solid var(--brand-accent);
  border-radius: 14px;
  pointer-events: none;
}

.friend-preview-enter-active {
  transition: opacity 0.24s cubic-bezier(0.23, 1, 0.32, 1), transform 0.24s cubic-bezier(0.23, 1, 0.32, 1);

  .friend-preview-media,
  .friend-preview-copy {
    transition: opacity 0.16s ease-out 0.07s, transform 0.18s cubic-bezier(0.23, 1, 0.32, 1) 0.05s;
  }
}

.friend-preview-leave-active {
  transition: opacity 0.16s ease-out, transform 0.16s ease-out;

  .friend-preview-media,
  .friend-preview-copy {
    transition: opacity 0.08s ease-out;
  }
}

.friend-preview-enter-from,
.friend-preview-leave-to {
  opacity: 0;
  transform: var(--preview-from);
}

.friend-preview-enter-from,
.friend-preview-leave-to {
  .friend-preview-media,
  .friend-preview-copy {
    opacity: 0;
  }
}

.friend-preview-enter-from {
  .friend-preview-media,
  .friend-preview-copy {
    transform: translateY(6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .friend-card,
  .friend-preview-enter-active,
  .friend-preview-leave-active {
    transition: none;
  }

  .friend-preview-media img,
  .friend-preview-enter-active .friend-preview-media,
  .friend-preview-enter-active .friend-preview-copy,
  .friend-preview-leave-active .friend-preview-media,
  .friend-preview-leave-active .friend-preview-copy {
    transition: none;
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

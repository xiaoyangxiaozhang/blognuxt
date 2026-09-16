<template>
  <Teleport to="body">
    <Transition name="site-dialog">
      <div v-if="accountOpen" class="dialog-overlay" role="presentation" @click.self="close">
        <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title">
          <button class="close-button" type="button" aria-label="关闭" @click="close">
            <Cross1Icon aria-hidden="true" />
          </button>

          <div class="dialog-header">
            <h2 id="account-dialog-title">{{ accountMode === 'reset' ? '重置密码' : '账号' }}</h2>
          </div>

          <template v-if="accountMode === 'reset'">
            <form class="dialog-form" @submit.prevent="resetAccountPassword">
              <label>
                <span>邮箱</span>
                <input v-model="resetForm.email" required type="email" placeholder="注册时使用的邮箱">
              </label>
              <div class="code-row">
                <label>
                  <span>验证码</span>
                  <input v-model="resetForm.code" required inputmode="numeric" maxlength="6" placeholder="6 位验证码">
                </label>
                <button class="secondary-button" type="button" :disabled="sendingCode" @click="sendResetCode">
                  {{ sendingCode ? '发送中…' : '发送验证码' }}
                </button>
              </div>
              <label>
                <span>新密码</span>
                <input v-model="resetForm.password" required type="password" minlength="6" maxlength="20" autocomplete="new-password">
              </label>
              <label>
                <span>确认密码</span>
                <input v-model="resetForm.confirmPassword" required type="password" minlength="6" maxlength="20" autocomplete="new-password">
              </label>
              <div class="form-actions">
                <button type="button" class="text-button" @click="accountMode = 'profile'">返回</button>
                <button class="primary-button" type="submit" :disabled="resetting">{{ resetting ? '重置中…' : '重置密码' }}</button>
              </div>
            </form>
          </template>

          <template v-else-if="!authReady">
            <div class="login-panel">
              <span>正在恢复登录状态…</span>
            </div>
          </template>

          <template v-else-if="!isLoggedIn">
            <div class="login-panel">
              <span>登录后管理个人资料和安全设置</span>
              <button class="primary-button" type="button" @click="loginDialogOpen = true">登录</button>
            </div>
            <button class="text-button reset-link" type="button" @click="accountMode = 'reset'">忘记密码</button>
          </template>

          <template v-else>
            <div class="profile-summary">
              <div class="profile-identity">
                <img v-if="currentUser?.avatar" :src="currentUser.avatar" :alt="currentUser.nickname || '用户头像'">
                <div v-else class="avatar-fallback">{{ (currentUser?.nickname || '用').slice(0, 1) }}</div>
                <div>
                  <strong>{{ currentUser?.nickname || '未设置昵称' }}</strong>
                  <span>{{ currentUser?.email }}</span>
                </div>
              </div>
              <button type="button" class="text-button profile-edit-button" @click="startProfileEdit">编辑资料</button>
            </div>

            <div class="profile-stats" aria-label="个人数据">
              <div class="profile-stat">
                <strong>{{ currentUser?.moment_count ?? 0 }}</strong>
                <span>动态</span>
              </div>
              <div class="profile-stat">
                <strong>{{ currentUser?.comment_count ?? 0 }}</strong>
                <span>评论</span>
              </div>
            </div>

            <form v-if="profileEditing" class="dialog-form profile-editor" @submit.prevent="saveProfile">
              <div class="avatar-editor">
                <div class="avatar-preview">
                  <img v-if="profileAvatarUrl" :src="profileAvatarUrl" alt="头像预览">
                  <span v-else>{{ (profileForm.nickname || '用').slice(0, 1) }}</span>
                </div>
                <div class="avatar-editor-copy">
                  <strong>头像</strong>
                  <span>支持 JPG、PNG、GIF、WebP，最大 5MB</span>
                  <label class="secondary-button avatar-upload-button" for="account-avatar">更换头像</label>
                  <input id="account-avatar" ref="avatarInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/gif,image/webp" @change="handleAvatarChange">
                </div>
              </div>
              <label>
                <span>名字</span>
                <input v-model="profileForm.nickname" required minlength="2" maxlength="32">
              </label>
              <label>
                <span>个人网站</span>
                <input v-model="profileForm.website" type="url" placeholder="选填">
              </label>
              <div class="form-actions">
                <button type="button" class="text-button" :disabled="profileSaving" @click="cancelProfileEdit">取消</button>
                <button class="primary-button" type="submit" :disabled="profileSaving">{{ profileSaving ? '保存中…' : '保存资料' }}</button>
              </div>
            </form>

            <div class="account-links">
              <NuxtLink class="text-button" to="/kimidou/mine" @click="close">管理我的动态</NuxtLink>
              <button type="button" class="text-button" @click="securityOpen = true">修改密码</button>
            </div>

            <template v-if="securityOpen">
              <form class="dialog-form security-panel" @submit.prevent="savePassword">
                <div class="security-heading">
                  <h3>{{ hasPassword ? '修改密码' : '设置密码' }}</h3>
                  <button type="button" class="text-button" @click="securityOpen = false">收起</button>
                </div>
                <label v-if="hasPassword">
                  <span>当前密码</span>
                  <input v-model="passwordForm.oldPassword" type="password" required autocomplete="current-password">
                </label>
                <label>
                  <span>{{ hasPassword ? '新密码' : '密码' }}</span>
                  <input v-model="passwordForm.newPassword" type="password" required minlength="6" maxlength="32" autocomplete="new-password">
                </label>
                <label v-if="!hasPassword">
                  <span>确认密码</span>
                  <input v-model="passwordForm.confirmPassword" type="password" required minlength="6" maxlength="32" autocomplete="new-password">
                </label>
                <div class="form-actions">
                  <button class="primary-button" type="submit" :disabled="passwordSaving">{{ passwordSaving ? '提交中…' : '提交' }}</button>
                </div>
              </form>

              <div class="oauth-section">
                <h3>登录方式</h3>
                <div v-if="linkedProviders.length" class="oauth-list">
                  <div v-for="provider in linkedProviders" :key="provider" class="oauth-item">
                    <span>{{ providerLabel(provider) }}</span>
                    <button type="button" class="text-button" :disabled="!canUnbindOAuth" @click="removeOAuth(provider)">
                      {{ canUnbindOAuth ? '解绑' : '不可解绑' }}
                    </button>
                  </div>
                </div>
                <p v-else class="status-text">未绑定第三方登录</p>
              </div>
            </template>

            <div class="dialog-footer">
              <button type="button" class="text-button" @click="logout">退出登录</button>
              <button type="button" class="danger-button" :disabled="!hasPassword" @click="deactivate">
                {{ hasPassword ? '注销账号' : '请先设置密码' }}
              </button>
            </div>
          </template>
        </section>
      </div>
    </Transition>
  </Teleport>

  <LoginDialog
    v-model="loginDialogOpen"
    @login-success="handleLoginSuccess"
    @forgot-password="accountMode = 'reset'"
  />
</template>

<script setup lang="ts">
import { Cross1Icon } from '@svg-animated-icons/vue'
import { ElMessage } from 'element-plus'
import LoginDialog from '~/components/shell/LoginDialog.vue'
import { useCommentAuth } from '~/composables/useCommentAuth'
import { useSiteOverlays } from '~/composables/useSiteOverlays'
import {
  changePassword,
  deactivateAccount,
  forgotPassword,
  resetPassword,
  setPassword,
  unbindOAuth,
  updateUserProfile
} from '~/services/api/auth'
import { uploadFile } from '~/services/api/upload'
import { proxyImageUrl } from '~/utils/image'

const { accountOpen, accountMode } = useSiteOverlays()
const { currentUser, authReady, isLoggedIn, fetchProfile, logoutUser } = useCommentAuth()
const loginDialogOpen = ref(false)
const profileSaving = ref(false)
const profileEditing = ref(false)
const securityOpen = ref(false)
const avatarFile = ref<File | null>(null)
const avatarPreviewUrl = ref('')
const avatarInput = ref<HTMLInputElement | null>(null)
const passwordSaving = ref(false)
const sendingCode = ref(false)
const resetting = ref(false)

const profileForm = reactive({ nickname: '', website: '' })
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const resetForm = reactive({ email: '', code: '', password: '', confirmPassword: '' })

const hasPassword = computed(() => Boolean(currentUser.value?.has_password))
const supportedOAuthProviders = ['github', 'google', 'qq']
const linkedProviders = computed(() => (currentUser.value?.linked_oauths || []).filter(provider => supportedOAuthProviders.includes(provider)))
const canUnbindOAuth = computed(() => Boolean(currentUser.value?.has_password) || linkedProviders.value.length > 1)
const profileAvatarUrl = computed(() => avatarPreviewUrl.value || proxyImageUrl(currentUser.value?.avatar))

const syncProfileForm = (user = currentUser.value) => {
  if (!user) return
  profileForm.nickname = user.nickname || ''
  profileForm.website = user.website || ''
}

const clearAvatarSelection = () => {
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value)
  avatarFile.value = null
  avatarPreviewUrl.value = ''
  if (avatarInput.value) avatarInput.value.value = ''
}

watch(currentUser, (user) => {
  if (!user) return
  if (!profileEditing.value) syncProfileForm(user)
  resetForm.email = user.email || resetForm.email
}, { immediate: true })

watch(accountOpen, (open) => {
  if (open) {
    profileEditing.value = false
    securityOpen.value = false
    clearAvatarSelection()
    void fetchProfile()
  }
})

const close = () => {
  if (profileSaving.value || passwordSaving.value || resetting.value || sendingCode.value) return
  accountOpen.value = false
  accountMode.value = 'profile'
  securityOpen.value = false
}

const handleLoginSuccess = async () => {
  await fetchProfile()
}

const startProfileEdit = () => {
  syncProfileForm()
  profileEditing.value = true
}

const cancelProfileEdit = () => {
  if (profileSaving.value) return
  syncProfileForm()
  clearAvatarSelection()
  profileEditing.value = false
}

const handleAvatarChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('头像只支持图片格式。')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('头像大小不能超过 5MB。')
    return
  }
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value)
  avatarFile.value = file
  avatarPreviewUrl.value = URL.createObjectURL(file)
}

const saveProfile = async () => {
  profileSaving.value = true
  try {
    let avatar = ''
    if (avatarFile.value) {
      const response = await uploadFile(avatarFile.value, 'avatar')
      avatar = response.data?.file_url || ''
      if (!avatar) throw new Error(response.message || '头像上传失败。')
    }
    await updateUserProfile({
      nickname: profileForm.nickname.trim(),
      website: profileForm.website.trim() || undefined,
      ...(avatar ? { avatar } : {})
    })
    await fetchProfile()
    clearAvatarSelection()
    profileEditing.value = false
    ElMessage.success('资料已保存。')
  } catch (error) {
    console.error(error)
    ElMessage.error('资料保存失败。')
  } finally {
    profileSaving.value = false
  }
}

const savePassword = async () => {
  const hadPassword = hasPassword.value
  if (!hadPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次密码不一致。')
    return
  }

  passwordSaving.value = true
  try {
    if (hadPassword) {
      await changePassword({ old_password: passwordForm.oldPassword, new_password: passwordForm.newPassword })
    } else {
      await setPassword({ password: passwordForm.newPassword, confirm_password: passwordForm.confirmPassword })
    }
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    await fetchProfile()
    securityOpen.value = false
    ElMessage.success(hadPassword ? '密码已修改。' : '密码已设置。')
  } catch (error) {
    console.error(error)
    ElMessage.error('密码操作失败。')
  } finally {
    passwordSaving.value = false
  }
}

const sendResetCode = async () => {
  if (!/^\S+@\S+\.\S+$/.test(resetForm.email.trim())) {
    ElMessage.warning('请输入正确的邮箱地址。')
    return
  }

  sendingCode.value = true
  try {
    await forgotPassword({ email: resetForm.email.trim() })
    ElMessage.success('验证码已发送。')
  } catch (error) {
    console.error(error)
    ElMessage.error('验证码发送失败。')
  } finally {
    sendingCode.value = false
  }
}

const resetAccountPassword = async () => {
  if (resetForm.password !== resetForm.confirmPassword) {
    ElMessage.warning('两次密码不一致。')
    return
  }

  resetting.value = true
  try {
    await resetPassword({ email: resetForm.email.trim(), code: resetForm.code.trim(), password: resetForm.password })
    resetForm.code = ''
    resetForm.password = ''
    resetForm.confirmPassword = ''
    accountMode.value = 'profile'
    loginDialogOpen.value = true
    ElMessage.success('密码已重置，请重新登录。')
  } catch (error) {
    console.error(error)
    ElMessage.error('密码重置失败。')
  } finally {
    resetting.value = false
  }
}

const providerLabel = (provider: string) => ({ github: 'GitHub', google: 'Google', qq: 'QQ' }[provider] || provider)

const removeOAuth = async (provider: string) => {
  if (!canUnbindOAuth.value) return
  try {
    await unbindOAuth(provider)
    await fetchProfile()
    ElMessage.success(`${providerLabel(provider)} 已解绑。`)
  } catch (error) {
    console.error(error)
    ElMessage.error('解绑失败。')
  }
}

const deactivate = async () => {
  if (!import.meta.client || !window.confirm('注销后账号无法恢复，确定继续吗？')) return
  const password = window.prompt('请输入当前密码以确认注销')
  if (!password) return

  try {
    await deactivateAccount(password)
    await logoutUser()
    close()
    ElMessage.success('账号已注销。')
  } catch (error) {
    console.error(error)
    ElMessage.error('账号注销失败。')
  }
}

const logout = async () => {
  await logoutUser()
  close()
  ElMessage.success('已退出登录。')
}
</script>

<style scoped lang="scss">
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.88);
}

:global(:root) {
  --account-dialog-bg: #000;
  --account-dialog-text: #fff;
  --account-dialog-shadow: 0 24px 70px #000;
}

:global([data-theme='blue-white']) {
  --account-dialog-bg: #fff;
  --account-dialog-text: #000;
  --account-dialog-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
}

.dialog {
  position: relative;
  width: min(100%, 520px);
  max-height: min(780px, calc(100vh - 32px));
  overflow-y: auto;
  padding: 34px;
  border: 0;
  border-radius: 18px;
  background: var(--account-dialog-bg, #000);
  color: var(--account-dialog-text, #fff);
  box-shadow: var(--account-dialog-shadow, 0 24px 70px #000);
}

.close-button {
  display: grid;
  place-items: center;
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: var(--account-dialog-text);
  font-size: 24px;
  cursor: pointer;

  :deep(svg) {
    width: 18px;
    height: 18px;
  }
}

.dialog-header {
  margin-bottom: 30px;

  h2 {
    margin: 0;
    font-size: 24px;
  }
}

.dialog-form {
  display: grid;
  gap: 14px;
}

.dialog-form label {
  display: grid;
  gap: 7px;

  span {
    font-size: 13px;
    font-weight: 600;
  }
}

.dialog-form input {
  width: 100%;
  box-sizing: border-box;
  border: 0;
  border-radius: 9px;
  padding: 10px 12px;
  background: var(--account-dialog-bg);
  color: var(--account-dialog-text);
  font: inherit;
  font-size: 14px;
  outline: 1px solid var(--account-dialog-text);

  &:focus {
    outline: 2px solid var(--brand-accent);
  }
}

.login-panel,
.profile-summary,
.dialog-footer,
.form-actions,
.code-row,
.oauth-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.login-panel {
  align-items: center;
  padding: 12px 0;
  font-size: 13px;
}

.reset-link {
  margin-top: 16px;
}

.profile-summary {
  justify-content: space-between;
  margin-bottom: 20px;

  .profile-identity {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  img,
  .avatar-fallback {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-fallback {
    display: grid;
    place-items: center;
    background: var(--brand-accent-soft);
    color: var(--brand-accent);
    font-size: 20px;
    font-weight: 700;
  }

  strong,
  span {
    display: block;
  }

  strong {
    font-size: 15px;
  }

  span {
    margin-top: 4px;
    color: var(--account-dialog-text);
    font-size: 12px;
  }
}

.profile-edit-button {
  flex: 0 0 auto;
  padding: 7px 0;
  font-weight: 600;
}

.profile-stats {
  display: flex;
  align-items: baseline;
  gap: 28px;
  margin-bottom: 20px;
}

.profile-stat {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 0;
  text-align: left;

  strong {
    font-size: 19px;
    line-height: 1;
  }

  span {
    color: var(--account-dialog-text);
    font-size: 12px;
  }
}

.profile-editor {
  margin-bottom: 2px;
}

.avatar-editor {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar-preview {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--brand-accent-soft);
  color: var(--brand-accent);
  font-size: 24px;
  font-weight: 700;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.avatar-editor-copy {
  display: grid;
  gap: 5px;
  min-width: 0;

  strong { font-size: 13px; }
  span { color: var(--account-dialog-text); font-size: 11px; }
}

.avatar-upload-button {
  width: fit-content;
  padding: 6px 12px;
  font-size: 12px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.section-divider {
  margin-top: 28px;
  padding-top: 0;

  h3 {
    margin: 0;
    font-size: 15px;
  }
}

.account-links {
  display: flex;
  gap: 24px;
  margin-top: 28px;
  padding-top: 0;
}

.form-actions {
  justify-content: flex-end;
  margin-top: 2px;
}

.primary-button,
.secondary-button,
.danger-button {
  border-radius: 999px;
  padding: 9px 17px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.primary-button {
  border: 1px solid var(--brand-accent);
  background: var(--brand-accent);
  color: #fff;
}

.secondary-button {
  flex: 0 0 auto;
  border: 0;
  background: var(--account-dialog-text);
  color: var(--account-dialog-bg);
}

.text-button {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--brand-accent);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.status-text {
  margin: 0;
  color: var(--account-dialog-text);
  font-size: 12px;
}

.oauth-section {
  display: grid;
  gap: 12px;
  margin-top: 28px;

  h3 { margin: 0; font-size: 15px; }
}

.oauth-list {
  display: grid;
  gap: 8px;
}

.oauth-item {
  padding: 7px 0;
  font-size: 13px;
}

.dialog-footer {
  align-items: center;
  margin-top: 24px;
  padding-top: 0;
}

.danger-button {
  border: 0;
  background: var(--account-dialog-bg);
  color: var(--account-dialog-text);
}

.security-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 { margin: 0; font-size: 15px; }
}

.security-panel {
  margin-top: 28px;
}

.code-row {
  align-items: end;

  label {
    flex: 1;
  }
}

.site-dialog-enter-active,
.site-dialog-leave-active {
  transition: opacity 0.2s ease;
}

.site-dialog-enter-from,
.site-dialog-leave-to {
  opacity: 0;
}
</style>

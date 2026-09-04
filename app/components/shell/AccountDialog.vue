<template>
  <Teleport to="body">
    <Transition name="site-dialog">
      <div v-if="accountOpen" class="dialog-overlay" role="presentation" @click.self="close">
        <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title">
          <button class="close-button" type="button" aria-label="关闭" @click="close">×</button>

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
              <img v-if="currentUser?.avatar" :src="currentUser.avatar" :alt="currentUser.nickname || '用户头像'">
              <div v-else class="avatar-fallback">{{ (currentUser?.nickname || '用').slice(0, 1) }}</div>
              <div>
                <strong>{{ currentUser?.nickname || '未设置昵称' }}</strong>
                <span>{{ currentUser?.email }}</span>
              </div>
            </div>

            <form class="dialog-form" @submit.prevent="saveProfile">
              <label>
                <span>昵称</span>
                <input v-model="profileForm.nickname" required minlength="2" maxlength="32">
              </label>
              <label>
                <span>个人网站</span>
                <input v-model="profileForm.website" type="url" placeholder="选填">
              </label>
              <div class="form-actions">
                <span v-if="profileSaved" class="status-text">已保存</span>
                <button class="primary-button" type="submit" :disabled="profileSaving">{{ profileSaving ? '保存中…' : '保存' }}</button>
              </div>
            </form>

            <form class="dialog-form section-divider" @submit.prevent="savePassword">
              <h3>{{ hasPassword ? '修改密码' : '设置密码' }}</h3>
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

            <div class="section-divider oauth-section">
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

const { accountOpen, accountMode } = useSiteOverlays()
const { currentUser, authReady, isLoggedIn, fetchProfile, logoutUser } = useCommentAuth()
const loginDialogOpen = ref(false)
const profileSaving = ref(false)
const profileSaved = ref(false)
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

watch(currentUser, (user) => {
  if (!user) return
  profileForm.nickname = user.nickname || ''
  profileForm.website = user.website || ''
  resetForm.email = user.email || resetForm.email
}, { immediate: true })

watch(accountOpen, (open) => {
  if (open) fetchProfile()
})

const close = () => {
  if (profileSaving.value || passwordSaving.value || resetting.value || sendingCode.value) return
  accountOpen.value = false
  accountMode.value = 'profile'
}

const handleLoginSuccess = async () => {
  await fetchProfile()
}

const saveProfile = async () => {
  profileSaving.value = true
  profileSaved.value = false
  try {
    await updateUserProfile({
      nickname: profileForm.nickname.trim(),
      website: profileForm.website.trim() || undefined
    })
    await fetchProfile()
    profileSaved.value = true
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
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(8px);
}

.dialog {
  position: relative;
  width: min(100%, 480px);
  max-height: min(780px, calc(100vh - 32px));
  overflow-y: auto;
  padding: 28px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
}

.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 24px;
  cursor: pointer;
}

.dialog-header {
  margin-bottom: 22px;

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
  border: 1px solid var(--border-color);
  border-radius: 9px;
  padding: 10px 12px;
  background: var(--bg-panel-solid);
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--brand-accent);
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
  justify-content: flex-start;
  margin-bottom: 20px;

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
    color: var(--text-muted);
    font-size: 12px;
  }
}

.section-divider {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);

  h3 {
    margin: 0;
    font-size: 15px;
  }
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
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
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
  color: var(--text-muted);
  font-size: 12px;
}

.oauth-section {
  display: grid;
  gap: 12px;
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
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.danger-button {
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
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

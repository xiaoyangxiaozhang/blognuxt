<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <button class="close-btn" type="button" aria-label="Close login dialog" @click="closeModal">
            ×
          </button>

          <div class="modal-header">
            <div class="header-icon">
              <span v-if="mode === 'login'">◌</span>
              <span v-else>◎</span>
            </div>
            <h2>{{ mode === 'login' ? '登录账号' : '创建账户' }}</h2>
            <p>{{ mode === 'login' ? '使用你的邮箱和密码继续登录' : '注册一个新账户' }}</p>
          </div>

          <form class="auth-form" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="email">邮箱</label>
              <input id="email" v-model="formState.email" type="email" placeholder="请输入邮箱">
            </div>

            <div v-if="mode === 'register'" class="form-grid">
              <div class="form-group">
                <label for="nickname">名称</label>
                <input id="nickname" v-model="formState.nickname" type="text" placeholder="请输入名称">
              </div>

              <div class="form-group">
                <label for="website">网站地址（可选）</label>
                <input id="website" v-model="formState.website" type="url" placeholder="请输入网站地址">
              </div>
            </div>

            <div class="form-group">
              <label for="password">密码</label>
              <div class="password-field">
                <input
                  id="password"
                  v-model="formState.password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="mode === 'login' ? '请输入密码' : '请输入 7 位以上密码'"
                >
                <button class="eye-btn" type="button" @click="showPassword = !showPassword">
                  {{ showPassword ? '◉' : '○' }}
                </button>
              </div>
            </div>

            <div v-if="mode === 'register'" class="form-group">
              <label for="confirmPassword">确认密码</label>
              <div class="password-field">
                <input
                  id="confirmPassword"
                  v-model="formState.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="请再次输入密码"
                >
                <button class="eye-btn" type="button" @click="showConfirmPassword = !showConfirmPassword">
                  {{ showConfirmPassword ? '◉' : '○' }}
                </button>
              </div>
            </div>

            <button class="submit-btn" type="submit" :disabled="loading">
              {{ submitText }}
            </button>
          </form>

          <div v-if="mode === 'login' && hasOAuthProviders" class="oauth-section">
            <div class="oauth-divider">
              <span>其他登录方式</span>
            </div>

            <div class="oauth-actions">
              <button
                v-for="item in enabledOAuthProviders"
                :key="item.provider"
                class="oauth-btn"
                type="button"
                :aria-label="`${item.label} 登录`"
                @click="loginWithOAuth(item.provider)"
              >
                <component :is="item.icon" v-if="item.icon" />
                <span v-else class="oauth-fallback">{{ item.fallbackText }}</span>
              </button>
            </div>
          </div>

          <p class="switch-text">
            {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
            <button class="switch-link" type="button" @click="switchMode(mode === 'login' ? 'register' : 'login')">
              {{ mode === 'login' ? '立即注册' : '立即登录' }}
            </button>
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useCommentAuth } from '~/composables/useCommentAuth'
import { useSysConfig, type OAuthProvider } from '~/composables/useSysConfig'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'login-success'): void
}>()

type AuthMode = 'login' | 'register'

const config = useRuntimeConfig()
const route = useRoute()
const { enabledOAuthProviders } = useSysConfig()
const { loginWithPassword, registerWithEmail } = useCommentAuth()

const mode = ref<AuthMode>('login')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)

const formState = reactive({
  email: '',
  nickname: '',
  website: '',
  password: '',
  confirmPassword: ''
})

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const submitText = computed(() => {
  if (loading.value) {
    return mode.value === 'login' ? '登录中...' : '注册中...'
  }

  return mode.value === 'login' ? '登录' : '注册'
})

const hasOAuthProviders = computed(() => enabledOAuthProviders.value.length > 0)

const resetForm = () => {
  formState.email = ''
  formState.nickname = ''
  formState.website = ''
  formState.password = ''
  formState.confirmPassword = ''
  showPassword.value = false
  showConfirmPassword.value = false
}

const switchMode = (nextMode: AuthMode) => {
  mode.value = nextMode
  formState.password = ''
  formState.confirmPassword = ''
  showPassword.value = false
  showConfirmPassword.value = false
}

const closeModal = () => {
  mode.value = 'login'
  resetForm()
  emit('update:modelValue', false)
}

const normalizeWebsite = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const resolveRedirectPath = () => {
  const currentPath = route.fullPath || '/'
  return currentPath.startsWith('/') && !currentPath.startsWith('//') ? currentPath : '/'
}

const validateForm = () => {
  const email = formState.email.trim()
  const nickname = formState.nickname.trim()
  const website = normalizeWebsite(formState.website)
  const password = formState.password.trim()
  const confirmPassword = formState.confirmPassword.trim()

  if (!email) {
    ElMessage.warning('请输入邮箱。')
    return null
  }

  if (!EMAIL_PATTERN.test(email)) {
    ElMessage.warning('请输入正确的邮箱地址。')
    return null
  }

  if (mode.value === 'register') {
    if (!nickname) {
      ElMessage.warning('请输入名称。')
      return null
    }

    if (nickname.length < 2 || nickname.length > 32) {
      ElMessage.warning('名称长度需在 2 到 32 位之间。')
      return null
    }
  }

  if (!password) {
    ElMessage.warning('请输入密码。')
    return null
  }

  if (mode.value === 'register' && password.length <= 6) {
    ElMessage.warning('密码必须大于 6 位。')
    return null
  }

  if (mode.value === 'register') {
    if (!confirmPassword) {
      ElMessage.warning('请再次输入密码。')
      return null
    }

    if (password !== confirmPassword) {
      ElMessage.warning('两次输入的密码不一致。')
      return null
    }
  }

  if (website) {
    try {
      new URL(website)
    } catch {
      ElMessage.warning('请输入正确的网站地址。')
      return null
    }
  }

  return {
    email,
    nickname,
    website,
    password
  }
}

const loginWithOAuth = (provider: OAuthProvider) => {
  if (!import.meta.client) return

  const redirect = encodeURIComponent(resolveRedirectPath())
  const baseURL = config.public.apiBase || ''

  window.location.href = `${baseURL}/auth/${provider}?redirect=${redirect}`
}

const handleSubmit = async () => {
  const payload = validateForm()
  if (!payload) return

  loading.value = true

  try {
    if (mode.value === 'login') {
      await loginWithPassword(payload.email, payload.password)
    } else {
      await registerWithEmail(payload.email, payload.password, payload.nickname, payload.website)
    }

    emit('login-success')
    closeModal()
  } catch (error) {
    console.error(error)
    ElMessage.error(mode.value === 'login' ? '登录失败，请检查邮箱和密码。' : '注册失败，请检查填写信息。')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-container {
  position: relative;
  width: min(100%, 500px);
  padding: 28px 24px 22px;
  border-radius: 15px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
  color: var(--text-primary);
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: transparent;
  color: var(--text-primary);
  font-size: 24px;
  cursor: pointer;
}

.modal-header {
  display: grid;
  justify-items: center;
  gap: 8px;
  margin-bottom: 22px;
  text-align: center;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
  }

  p {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
  }
}

.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--brand-accent-hover);
  font-size: 40px;
  line-height: 1;
}

.auth-form {
  display: grid;
  gap: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-group {
  display: grid;
  gap: 8px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  input {
    width: 100%;
    height: 56px;
    padding: 0 16px;
    border-radius: 14px;
    border: 1px solid var(--border-color);
    background: var(--bg-panel-solid);
    color: var(--text-primary);
    font-size: 15px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &::placeholder {
      color: var(--text-muted);
    }

    &:focus {
      outline: none;
      border-color: var(--brand-accent);
      box-shadow: 0 0 0 3px var(--brand-accent-soft);
    }
  }
}

.password-field {
  position: relative;

  input {
    padding-right: 52px;
  }
}

.eye-btn {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
}

.submit-btn {
  height: 56px;
  border: 0;
  border-radius: 14px;
  background: var(--brand-accent-hover);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.oauth-section {
  margin-top: 18px;
}

.oauth-divider {
  position: relative;
  margin-bottom: 14px;
  text-align: center;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    border-top: 1px solid var(--border-color);
    transform: translateY(-50%);
  }

  span {
    position: relative;
    padding: 0 12px;
    background: var(--bg-elevated);
    color: var(--text-muted);
    font-size: 13px;
  }
}

.oauth-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.oauth-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--brand-accent-hover);
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;

  :deep(svg) {
    width: 24px;
    height: 24px;
  }

  &:hover {
    color: var(--brand-accent-hover);
    transform: translateY(-1px);
  }
}

.oauth-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.switch-text {
  margin: 16px 0 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

.switch-link {
  border: 0;
  background: transparent;
  color: var(--brand-accent-hover);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;

  .modal-container {
    transition: transform 0.25s ease, opacity 0.25s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-container {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
}

@media (max-width: 768px) {
  .modal-container {
    width: min(100%, 500px);
    padding: 24px 18px 20px;
  }

  .modal-header h2 {
    font-size: 22px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .form-group input,
  .submit-btn {
    height: 52px;
  }
}
</style>

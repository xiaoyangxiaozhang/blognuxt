import { ElMessage } from 'element-plus'
import { getUserProfile, login, logout, register, type AuthUserProfile, type LoginResponseData } from '~/composables/api/auth'

const STORAGE_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token'
}

export const useCommentAuth = () => {
  const currentUser = useState<AuthUserProfile | null>('comment-auth-user', () => null)
  const authLoading = useState('comment-auth-loading', () => false)
  const authReady = useState('comment-auth-ready', () => false)

  const hasToken = () => {
    if (!import.meta.client) return false
    return Boolean(localStorage.getItem(STORAGE_KEYS.accessToken))
  }

  const isLoggedIn = computed(() => Boolean(currentUser.value) && hasToken())

  const clearAuth = () => {
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEYS.accessToken)
      localStorage.removeItem(STORAGE_KEYS.refreshToken)
    }
    currentUser.value = null
  }

  const fetchProfile = async () => {
    if (!import.meta.client || !hasToken()) {
      authReady.value = true
      return null
    }

    authLoading.value = true

    try {
      const response = await getUserProfile()
      const user = response.data
      if (user?.avatar) {
        user.avatar = proxyImageUrl(user.avatar)
      }
      currentUser.value = user || null
      return currentUser.value
    } catch (error) {
      console.error(error)
      clearAuth()
      return null
    } finally {
      authLoading.value = false
      authReady.value = true
    }
  }

  const applyAuthResponse = async (response: { data: LoginResponseData, message: string }) => {
    if (!response.data?.access_token) {
      throw new Error(response.message || 'Authentication failed.')
    }

    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEYS.accessToken, response.data.access_token)
      if (response.data.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.refreshToken, response.data.refresh_token)
      }
    }

    currentUser.value = response.data.user || null
    await fetchProfile()
    return currentUser.value
  }

  const loginWithPassword = async (email: string, password: string) => {
    const response = await login({
      email,
      password
    })

    await applyAuthResponse(response)
    ElMessage.success('Logged in successfully.')
    return currentUser.value
  }

  const registerWithEmail = async (email: string, password: string, nickname: string, website?: string) => {
    const response = await register({
      email,
      password,
      nickname: nickname.trim(),
      website: website?.trim() || undefined
    })

    await applyAuthResponse(response)
    ElMessage.success('Account created successfully.')
    return currentUser.value
  }

  const logoutUser = async () => {
    try {
      if (hasToken()) {
        await logout()
      }
    } catch (error) {
      console.error(error)
    } finally {
      clearAuth()
    }
  }

  const applyUserToForm = <T extends { nickname: string, email: string, website: string }>(form: T) => {
    if (!currentUser.value) return
    form.nickname = currentUser.value.nickname || form.nickname
    form.email = currentUser.value.email || form.email
    form.website = currentUser.value.website || form.website
  }

  return {
    currentUser,
    authLoading,
    authReady,
    isLoggedIn,
    fetchProfile,
    loginWithPassword,
    registerWithEmail,
    logoutUser,
    clearAuth,
    applyUserToForm
  }
}

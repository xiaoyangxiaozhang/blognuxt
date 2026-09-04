import { ElMessage } from 'element-plus'
import { getUserProfile, login, logout, register, type AuthUserProfile, type LoginResponseData } from '~/services/api/auth'
import { clearLegacyAuthStorage, refreshAccessToken, useAccessToken } from '~/composables/useApi'
import { proxyImageUrl } from '~/utils/image'

export const useCommentAuth = () => {
  const accessToken = useAccessToken()
  const currentUser = useState<AuthUserProfile | null>('comment-auth-user', () => null)
  const authLoading = useState('comment-auth-loading', () => false)
  const authReady = useState('comment-auth-ready', () => false)
  const restoreAttempted = useState('comment-auth-restore-attempted', () => false)

  const hasToken = () => Boolean(accessToken.value)

  const isLoggedIn = computed(() => Boolean(currentUser.value) && hasToken())

  const clearAuth = () => {
    accessToken.value = null
    clearLegacyAuthStorage()
    currentUser.value = null
  }

  const fetchProfile = async () => {
    if (!import.meta.client) {
      authReady.value = true
      return null
    }

    authLoading.value = true

    try {
      if (!hasToken()) {
        if (authReady.value || !await refreshAccessToken()) {
          clearAuth()
          return null
        }
      }

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

  const restoreSession = async () => {
    clearLegacyAuthStorage()
    if (!import.meta.client) {
      authReady.value = true
      return null
    }

    if (restoreAttempted.value) return currentUser.value
    restoreAttempted.value = true

    if (!hasToken() && !await refreshAccessToken()) {
      clearAuth()
      authReady.value = true
      return null
    }

    return fetchProfile()
  }

  const applyAuthResponse = async (response: { data: LoginResponseData, message: string }) => {
    if (!response.data?.access_token) {
      throw new Error(response.message || 'Authentication failed.')
    }

    accessToken.value = response.data.access_token
    clearLegacyAuthStorage()
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
      await logout()
    } catch (error) {
      console.error(error)
    } finally {
      clearAuth()
      authReady.value = true
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
    restoreSession,
    fetchProfile,
    loginWithPassword,
    registerWithEmail,
    logoutUser,
    clearAuth,
    applyUserToForm
  }
}

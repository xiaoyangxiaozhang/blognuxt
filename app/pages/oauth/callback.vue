<template>
  <section class="oauth-callback">
    <div class="callback-card">
      <h1>正在登录...</h1>
      <p>请稍候，我们正在同步你的账户信息。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useCommentAuth } from '~/composables/useCommentAuth'

const route = useRoute()
const { fetchProfile, clearAuth } = useCommentAuth()

const resolveRedirectPath = (value?: string) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/'
  }

  return value
}

onMounted(async () => {
  const accessToken = typeof route.query.access_token === 'string' ? route.query.access_token : ''
  const refreshToken = typeof route.query.refresh_token === 'string' ? route.query.refresh_token : ''
  const redirect = resolveRedirectPath(
    typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  )

  if (!accessToken) {
    ElMessage.error('第三方登录失败，未获取到登录凭证。')
    await navigateTo('/')
    return
  }

  localStorage.setItem('access_token', accessToken)

  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken)
  } else {
    localStorage.removeItem('refresh_token')
  }

  try {
    const profile = await fetchProfile()

    if (!profile) {
      throw new Error('Failed to fetch OAuth profile.')
    }

    await navigateTo(redirect, { replace: true })
  } catch (error) {
    console.error(error)
    clearAuth()
    ElMessage.error('第三方登录成功，但同步用户信息失败。')
    await navigateTo('/', { replace: true })
  }
})
</script>

<style scoped lang="scss">
.oauth-callback {
  min-height: 50vh;
  display: grid;
  place-items: center;
  padding: 32px 16px;
}

.callback-card {
  width: min(100%, 420px);
  padding: 28px 24px;
  border-radius: 15px;
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  color: var(--text-primary);
  text-align: center;
  box-shadow: 0 18px 36px var(--shadow-color);

  h1 {
    margin: 0 0 10px;
    font-size: 24px;
  }

  p {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.6;
  }
}
</style>

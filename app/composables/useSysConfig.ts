import type { Component } from 'vue'
import IconMdiGithub from '~icons/mdi/github'
import IconMdiGoogle from '~icons/mdi/google'
import IconMdiMicrosoftWindows from '~icons/mdi/microsoft-windows'
import IconSimpleIconsQq from '~icons/simple-icons/qq'
import { getSettingGroup } from '~/composables/api/sysconfig'

export type OAuthProvider = 'github' | 'google' | 'qq' | 'microsoft'
export type OAuthConfigMap = Record<string, string>

export interface OAuthProviderOption {
  provider: OAuthProvider
  label: string
  icon: Component | null
  fallbackText: string
}

const isEnabledValue = (value: string | undefined) => {
  return value === 'true' || value === '1'
}

const resolveProviderEnabled = (config: OAuthConfigMap, provider: OAuthProvider) => {
  return isEnabledValue(config[`${provider}.enabled`]) || isEnabledValue(config[`oauth.${provider}.enabled`])
}

const OAUTH_PROVIDER_META: OAuthProviderOption[] = [
  {
    provider: 'github',
    label: 'GitHub',
    icon: IconMdiGithub,
    fallbackText: 'GH'
  },
  {
    provider: 'google',
    label: 'Google',
    icon: IconMdiGoogle,
    fallbackText: 'G'
  },
  {
    provider: 'qq',
    label: 'QQ',
    icon: IconSimpleIconsQq,
    fallbackText: 'QQ'
  },
  {
    provider: 'microsoft',
    label: 'Microsoft',
    icon: IconMdiMicrosoftWindows,
    fallbackText: 'MS'
  }
]

export const useSysConfig = () => {
  const { data, pending, error, refresh } = useAsyncData('sys-oauth-settings', () => getSettingGroup('oauth'))

  const oauthConfig = computed<OAuthConfigMap>(() => data.value?.data || {})

  const enabledOAuthProviders = computed<OAuthProviderOption[]>(() => {
    const config = oauthConfig.value

    return OAUTH_PROVIDER_META.filter((item) => resolveProviderEnabled(config, item.provider))
  })

  return {
    oauthConfig,
    enabledOAuthProviders,
    pending,
    error,
    refresh
  }
}

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '~/composables/useApi'

export interface AuthUserProfile {
  id?: number | string
  email?: string
  nickname?: string
  avatar?: string
  badge?: string
  website?: string
  role?: string
  email_hash?: string
  is_virtual_email?: boolean
  has_password?: boolean
  linked_oauths?: string[]
  created_at?: string
}

export interface LoginResponseData {
  access_token: string
  token_type?: string
  expires_in?: number
  user?: AuthUserProfile
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  nickname: string
  website?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  email: string
  code: string
  password: string
}

export interface UpdateProfilePayload {
  nickname?: string
  email?: string
  avatar?: string
  badge?: string
  website?: string
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
}

export interface SetPasswordPayload {
  password: string
  confirm_password: string
}

export const login = (body: LoginPayload) => {
  return apiPost<LoginResponseData>('/auth/login', body)
}

export const register = (body: RegisterPayload) => {
  return apiPost<LoginResponseData>('/auth/register', body)
}

export const refreshToken = () => {
  return apiPost<LoginResponseData>('/auth/refresh')
}

export const logout = () => {
  return apiPost<null>('/auth/logout')
}

export const getUserProfile = () => {
  return apiGet<AuthUserProfile>('/user/profile')
}

export const forgotPassword = (body: ForgotPasswordPayload) => {
  return apiPost<null>('/auth/forgot-password', body)
}

export const resetPassword = (body: ResetPasswordPayload) => {
  return apiPost<null>('/auth/reset-password', body)
}

export const updateUserProfile = (body: UpdateProfilePayload) => {
  return apiPatch<AuthUserProfile>('/user/profile', body)
}

export const changePassword = (body: ChangePasswordPayload) => {
  return apiPut<null>('/user/password', body)
}

export const setPassword = (body: SetPasswordPayload) => {
  return apiPost<null>('/user/password', body)
}

export const deactivateAccount = (password: string) => {
  return apiDelete<null>('/user/deactivate', { password })
}

export const unbindOAuth = (provider: string) => {
  return apiDelete<null>(`/user/oauth/${encodeURIComponent(provider)}`)
}

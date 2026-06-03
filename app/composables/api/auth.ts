import { apiGet, apiPost } from '~/composables/useApi'

export interface AuthUserProfile {
  id?: number | string
  email?: string
  nickname?: string
  avatar?: string
  badge?: string
  website?: string
  role?: string
}

export interface LoginResponseData {
  access_token: string
  refresh_token?: string
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

export interface RefreshTokenPayload {
  refresh_token: string
}

export const login = (body: LoginPayload) => {
  return apiPost<LoginResponseData>('/auth/login', body)
}

export const register = (body: RegisterPayload) => {
  return apiPost<LoginResponseData>('/auth/register', body)
}

export const refreshToken = (body: RefreshTokenPayload) => {
  return apiPost<LoginResponseData>('/auth/refresh', body)
}

export const logout = () => {
  return apiPost<null>('/auth/logout')
}

export const getUserProfile = () => {
  return apiGet<AuthUserProfile>('/user/profile')
}

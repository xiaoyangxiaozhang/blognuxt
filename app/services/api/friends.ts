import { apiGet, apiPost } from '~/composables/useApi'

export interface FriendItem {
  id: number
  name: string
  url: string
  description: string
  avatar: string
  screenshot: string
  sort: number
  is_invalid: boolean
}

export interface FriendGroup {
  type_id: number | null
  type_name: string
  type_sort: number
  friends: FriendItem[]
}

export interface GroupedFriendsData {
  groups: FriendGroup[]
  total_groups: number
  total_friends: number
}

export interface ApplyFriendPayload {
  name: string
  url: string
  description: string
  avatar: string
  screenshot?: string
}

export const getFriendList = () => apiGet<GroupedFriendsData>('/friends')

export const applyFriend = (body: ApplyFriendPayload) => apiPost<null>('/friends/apply', body)

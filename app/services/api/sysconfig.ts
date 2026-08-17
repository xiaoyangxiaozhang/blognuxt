import type { SettingGroupType } from '~/types/sysconfig'
import { createApi } from './createApi'

const settingApi = createApi('')

export const getSettingGroup = async (group: SettingGroupType) => {
  return settingApi.get<Record<string, string>>(`/settings/${group}`)
}

import{createApi} from '~/composables/api/createApi'
import type { PaginationData } from '~/composables/useApi'
const momentApi = createApi('/moments')
export interface MomentContent {
  text: string
  images?: string[]
  location?: string
  tags?: string
}
// 动态列表项
export interface MomentItem {
  id: number
  publish_time: string
   content: MomentContent
   is_publish: boolean

}

export const getMomentList = (params?: Record<string, unknown>) => {
  return momentApi.list<PaginationData<MomentItem>>(params)
}
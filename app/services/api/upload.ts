import { useApi } from '~/composables/useApi'

export interface UploadResponseData {
  original_name: string
  file_url: string
}

export const uploadFile = async (file: File, type = 'comment') => {
  const api = useApi()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  return api<{
    code: number
    message: string
    data: UploadResponseData
  }>('/upload', {
    method: 'POST',
    body: formData
  })
}

import { compressImage, hasTIFFHeader, type ImageUploadOptions } from '~/utils/imageUpload'
import { useImageUploadPreference } from '~/composables/useImageUploadPreference'
import { useApi } from '~/composables/useApi'

export interface UploadResponseData {
  original_name: string
  file_url: string
}

export const uploadFile = async (file: File, type = 'comment', options: ImageUploadOptions = {}) => {
  const api = useApi()
  const keepOriginal = options.keepOriginal ?? useImageUploadPreference().value
  if (keepOriginal && (/\.(dng|tif|tiff)$/i.test(file.name) || await hasTIFFHeader(file))) {
    throw new Error('RAW/TIFF 上传会转换为 JPEG 预览，无法保留原文件。请选择 JPEG、PNG、WebP、GIF。')
  }
  const uploadTarget = await compressImage(file, { keepOriginal })
  const formData = new FormData()
  formData.append('file', uploadTarget)
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

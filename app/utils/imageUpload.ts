export interface ImageUploadOptions {
  keepOriginal?: boolean
}

export const IMAGE_COMPRESSION_THRESHOLD = 1024 * 1024
export const IMAGE_MAX_DIMENSION = 1920

export async function hasTIFFHeader(file: File): Promise<boolean> {
  try {
    const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer())
    return bytes.length === 4 && (
      (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0) ||
      (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0 && bytes[3] === 0x2a)
    )
  } catch {
    return false
  }
}

export async function hasJPEGHeader(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 3).arrayBuffer())
  return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
}

// Only JPEG photos are re-encoded. PNG text/alpha and GIF/APNG/WebP animation
// retain their bytes, dimensions and frames; delivery variants use the image proxy.
export async function compressImage(file: File, options: ImageUploadOptions = {}): Promise<File> {
  if (options.keepOriginal || file.type !== 'image/jpeg') return file

  let objectUrl: string | undefined
  try {
    if (!await hasJPEGHeader(file)) return file
    objectUrl = URL.createObjectURL(file)
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('无法读取图片'))
      element.src = objectUrl!
    })
    const sourceWidth = image.naturalWidth
    const sourceHeight = image.naturalHeight
    if (!sourceWidth || !sourceHeight) return file
    // Dimensions are checked even when the encoded file is smaller than 1 MB.
    if (file.size <= IMAGE_COMPRESSION_THRESHOLD && Math.max(sourceWidth, sourceHeight) <= IMAGE_MAX_DIMENSION) return file

    const scale = Math.min(1, IMAGE_MAX_DIMENSION / sourceWidth, IMAGE_MAX_DIMENSION / sourceHeight)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(sourceWidth * scale))
    canvas.height = Math.max(1, Math.round(sourceHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob || blob.type !== 'image/jpeg' || blob.size >= file.size) return file
    const name = file.name.replace(/\.[^/.]+$/, '') || 'image'
    return new File([blob], `${name}-compressed.jpg`, { type: blob.type, lastModified: file.lastModified })
  } catch {
    // Decode/Canvas failures must not prevent the original file from uploading.
    return file
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}

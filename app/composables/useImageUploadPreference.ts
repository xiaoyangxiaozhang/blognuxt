import { useState } from '#app'

export const useImageUploadPreference = () => useState<boolean>('image-upload-keep-original', () => false)

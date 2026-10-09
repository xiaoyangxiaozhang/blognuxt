import test from 'node:test'
import assert from 'node:assert/strict'
import { proxyImageSrcSet, proxyImageUrl } from '../app/utils/image.ts'

test('responsive proxy URLs retain the original source and request WebP widths', () => {
  const original = 'https://admin.example/uploads/photo.jpg'
  const proxied = proxyImageUrl(original)
  assert.equal(proxyImageSrcSet(proxied, [320, 640, 999]), [
    `/proxy-image?url=${encodeURIComponent(original)}&width=320&format=webp 320w`,
    `/proxy-image?url=${encodeURIComponent(original)}&width=640&format=webp 640w`
  ].join(', '))
})

test('non-proxied external images are not rewritten into false srcsets', () => {
  assert.equal(proxyImageSrcSet('https://images.example/photo.jpg', [320, 640]), undefined)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { compressImage, hasTIFFHeader } from '../app/utils/imageUpload.ts'

const photo = size => new File([new Uint8Array([255, 216, 255]), new Uint8Array(size - 3)], 'photo.jpg', { type: 'image/jpeg' })

test('protected formats and the original option never decode or change the source', async () => {
  for (const type of ['image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4']) {
    const file = new File([new Uint8Array(2 * 1024 * 1024)], 'source', { type })
    assert.strictEqual(await compressImage(file), file)
  }
  const file = photo(2 * 1024 * 1024)
  assert.strictEqual(await compressImage(file, { keepOriginal: true }), file)
})
test('low byte size does not bypass the pixel dimension limit', async () => {
  const previous = { Image: globalThis.Image, document: globalThis.document }
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage() {} }), toBlob: cb => cb(new Blob(['jpeg'], { type: 'image/jpeg' })) }
  globalThis.Image = class {
    naturalWidth = 4000
    naturalHeight = 1600
    set src(value) { queueMicrotask(() => this.onload()) }
  }
  globalThis.document = { createElement: () => canvas }
  try {
    const result = await compressImage(photo(10000))
    assert.equal(result.size, 4)
    assert.deepEqual([canvas.width, canvas.height], [1920, 768])
  } finally { Object.assign(globalThis, previous) }
})
test('public upload uses the session option and allows an explicit override', async () => {
  const source = stripTypeScriptTypes(readFileSync(new URL('../app/services/api/upload.ts', import.meta.url), 'utf8')).replace(/^import .*\n/gm, '').replace('export const uploadFile', 'const uploadFile')
  const uploads = []; const preference = { value: true }
  const uploadFile = new Function('useApi', 'compressImage', 'hasTIFFHeader', 'useImageUploadPreference', `${source}; return uploadFile;`)(
    () => async (url, options) => { uploads.push(options.body.get('file')); return { data: { file_url: '/test.jpg' } } },
    async (file, options) => options.keepOriginal ? file : new File(['small'], 'small.jpg', { type: 'image/jpeg' }),
    hasTIFFHeader, () => preference
  )
  const file = photo(10000)
  await uploadFile(file, 'avatar')
  assert.equal(uploads[0].size, file.size)
  assert.deepEqual(new Uint8Array(await uploads[0].arrayBuffer()), new Uint8Array(await file.arrayBuffer()))
  await uploadFile(file, 'avatar', { keepOriginal: false })
  assert.equal(uploads[1].size, 5)
})
test('RAW signatures are recognized even with a misleading PNG file name', async () => {
  assert.equal(await hasTIFFHeader(new File([new Uint8Array([0x49, 0x49, 0x2a, 0])], 'fake.png')), true)
  assert.equal(await hasTIFFHeader(photo(100)), false)
})

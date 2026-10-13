import test from 'node:test'
import assert from 'node:assert/strict'
import { proxyImageSrcSet, proxyImageUrl, optimizedImageAttrs, restoreOriginalImage } from '../app/utils/image.ts'
import { renderArticleMarkdown } from '../app/utils/markdown.ts'

test('responsive proxy URLs retain the original source and request WebP widths', () => {
  const original = 'https://admin.example/uploads/photo.jpg'
  const proxied = proxyImageUrl(original)
  assert.equal(proxyImageSrcSet(proxied, [320, 640, 999]), [
    `/proxy-image?width=320&format=webp&v=2&url=${encodeURIComponent(original)} 320w`,
    `/proxy-image?width=640&format=webp&v=2&url=${encodeURIComponent(original)} 640w`
  ].join(', '))
})

test('external HTTPS images can request real variants while local previews stay unchanged', () => {
  const original = 'https://images.example/photo.jpg'
  assert.equal(optimizedImageAttrs(original, [320, 640], '320px')['data-original-src'], original)
  assert.match(proxyImageSrcSet(original, [320, 640]), /width=640.*640w/)
  for (const url of ['/local.svg', 'blob:preview', 'data:image/png;base64,AA==']) {
    const attrs = optimizedImageAttrs(url)
    assert.equal(attrs.src, url)
    assert.equal(attrs.srcset, undefined)
    assert.equal(attrs['data-original-src'], undefined)
  }
})

test('fallback clears responsive candidates and only retries the original once', () => {
  const attributes = new Map(Object.entries(optimizedImageAttrs('https://admin.example/uploads/photo.jpg')))
  const image = { getAttribute: key => attributes.get(key), removeAttribute: key => attributes.delete(key), src: '' }
  assert.equal(restoreOriginalImage(image), true)
  assert.equal(image.src, '/proxy-image?url=https%3A%2F%2Fadmin.example%2Fuploads%2Fphoto.jpg')
  assert.equal(attributes.has('srcset'), false)
  assert.equal(attributes.has('sizes'), false)
  assert.equal(restoreOriginalImage(image), false)
})

test('Markdown and reader blocks share responsive images, loading rules and escaped attributes', () => {
  const result = renderArticleMarkdown('![first](https://images.example/a.png "quote & text")\n\n![second](https://images.example/b.jpg)\n\n<img src=x onerror=alert(1)>')
  assert.match(result.html, /srcset=".*1280w/)
  assert.match(result.html, /data-original-src="https:\/\/images.example\/a.png"/)
  assert.match(result.html, /loading="eager"/)
  assert.match(result.html, /loading="lazy"/)
  assert.match(result.html, /title="quote &amp; text"/)
  assert(!result.html.includes('<img src=x'))
  assert.equal(result.blocks.filter(block => block.html.includes('srcset=')).length, 2)
})

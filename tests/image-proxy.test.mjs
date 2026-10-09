import test from 'node:test'
import assert from 'node:assert/strict'
import dns from 'node:dns/promises'
import http from 'node:http'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import sharp from 'sharp'
import { fetchPublicImage, isPublicImageAddress, validateImageURL, resizePublicImage, MAX_IMAGE_BYTES } from '../server/utils/imageProxy.ts'

test('proxy blocks private, mapped, reserved and non-HTTP destinations', () => {
  for (const address of ['127.0.0.1', '10.1.2.3', '100.64.1.1', '169.254.169.254', '172.16.1.1', '192.168.1.1', '0.0.0.0', '224.1.1.1', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '64:ff9b::7f00:1', '2002:7f00:1::', '2001:db8::1']) {
    assert.equal(isPublicImageAddress(address), false, address)
  }
  assert.equal(isPublicImageAddress('8.8.8.8'), true)
  assert.equal(isPublicImageAddress('2606:4700::1111'), true)
  for (const url of ['file:///etc/passwd', 'http://user:pass@example.com/a', 'http://127.1/a', 'http://2130706433/a', 'http://[::ffff:127.0.0.1]/a', ['https://example.com/a']]) {
    assert.throws(() => validateImageURL(url))
  }
})

function mockTransport(t, respond, addresses = [{ address: '8.8.8.8', family: 4 }]) {
  const destinations = []
  t.mock.method(dns, 'lookup', async () => addresses)
  t.mock.method(http, 'get', (url, options, callback) => {
    const request = new EventEmitter()
    assert(options.signal, 'requests must carry a deadline')
    queueMicrotask(() => options.lookup(url.hostname, { all: true }, (error, resolved) => {
      if (error) return request.emit('error', error)
      destinations.push({ url: url.href, resolved })
      const spec = respond(url)
      const response = Readable.from(spec.chunks || [Buffer.from('image-bytes')])
      response.statusCode = spec.status || 200
      response.headers = spec.headers || { 'content-type': 'image/png' }
      callback(response)
    }))
    return request
  })
  return destinations
}

test('public image succeeds using the validated DNS addresses', async t => {
  const destinations = mockTransport(t, () => ({}))
  const result = await fetchPublicImage('http://images.example/a.png')
  assert.equal(result.body.toString(), 'image-bytes')
  assert.equal(result.contentType, 'image/png')
  assert.deepEqual(destinations[0].resolved, [{ address: '8.8.8.8', family: 4 }])
})

test('responsive image variants resize raster images to WebP without enlarging', async () => {
  const body = await sharp({ create: { width: 1024, height: 512, channels: 3, background: '#8183ff' } }).png().toBuffer()
  const variant = await resizePublicImage({ contentType: 'image/png', body }, 256)
  const metadata = await sharp(variant.body).metadata()
  assert.equal(variant.contentType, 'image/webp')
  assert.equal(metadata.width, 256)
  assert.equal(metadata.height, 128)
})

test('DNS answers with any private address cannot establish a request', async t => {
  const destinations = mockTransport(t, () => ({}), [{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }])
  await assert.rejects(fetchPublicImage('http://images.example/a.png'), { statusCode: 403 })
  assert.equal(destinations.length, 0)
})

test('each redirect is validated and a redirect to an internal host is rejected', async t => {
  const destinations = mockTransport(t, url => url.pathname === '/a'
    ? { status: 302, headers: { location: '/b' } }
    : { status: 302, headers: { location: 'http://169.254.169.254/private' } })
  await assert.rejects(fetchPublicImage('http://images.example/a'), { statusCode: 403 })
  assert.equal(destinations.length, 2)
})

test('HTML, oversized headers and oversized chunked responses are rejected', async t => {
  mockTransport(t, url => {
    if (url.pathname === '/html') return { headers: { 'content-type': 'text/html' } }
    if (url.pathname === '/length') return { headers: { 'content-type': 'image/png', 'content-length': String(MAX_IMAGE_BYTES + 1) } }
    return { chunks: [Buffer.alloc(MAX_IMAGE_BYTES), Buffer.from('x')] }
  })
  await assert.rejects(fetchPublicImage('http://images.example/html'), { statusCode: 415 })
  await assert.rejects(fetchPublicImage('http://images.example/length'), { statusCode: 413 })
  await assert.rejects(fetchPublicImage('http://images.example/chunked'), { statusCode: 413 })
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { ImageProxyCache } from '../server/utils/imageCache.ts'

const image = (text = '1234') => ({ contentType: 'image/webp', body: Buffer.from(text) })

test('cache reuses buffers and coalesces concurrent loads of one variant', async () => {
  const cache = new ImageProxyCache()
  let calls = 0
  const load = async () => { calls++; return image() }
  const [first, joined] = await Promise.all([cache.get('640', load), cache.get('640', load)])
  assert.equal(first.status, 'MISS')
  assert.equal(joined.status, 'COALESCED')
  const hit = await cache.get('640', load)
  assert.equal(hit.status, 'HIT')
  assert.strictEqual(hit.image.body, first.image.body)
  assert.equal(calls, 1)
  assert.equal((await cache.get('1280', load)).status, 'MISS')
})

test('cache expires without extending TTL on reads and does not store failures', async t => {
  const cache = new ImageProxyCache()
  let now = 1000
  t.mock.method(Date, 'now', () => now)
  const load = async () => image()
  await cache.get('a', load, 1)
  now = 1999
  assert.equal((await cache.get('a', load, 1)).status, 'HIT')
  now = 2000
  assert.equal((await cache.get('a', load, 1)).status, 'MISS')
  await assert.rejects(cache.get('failure', async () => { throw Error('upstream') }))
  assert.equal((await cache.get('failure', load)).status, 'MISS')
})

test('cache evicts least recently used images by byte and entry limits', async () => {
  const cache = new ImageProxyCache(8, 2)
  const load = async () => image()
  await cache.get('a', load)
  await cache.get('b', load)
  await cache.get('a', load)
  await cache.get('c', load)
  assert.equal((await cache.get('a', load)).status, 'HIT')
  assert.equal((await cache.get('b', load)).status, 'MISS')
  assert.equal((await cache.get('large', async () => image('123456789'))).status, 'MISS')
  assert.equal((await cache.get('large', async () => image('123456789'))).status, 'MISS')
  const entries = new ImageProxyCache(1024, 1)
  await entries.get('a', load)
  await entries.get('b', load)
  assert.equal((await entries.get('a', load)).status, 'MISS')
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createImmersivePreview } from '../app/utils/immersivePreview.ts'

const article = (id) => ({ id })
const prepared = (id) => ({ item: article(id), imageUrl: `${id}.jpg` })
const deferred = () => {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

test('late covers cannot replace the newest requested article', async () => {
  const b = deferred()
  const c = deferred()
  const controller = createImmersivePreview(prepared(1), {
    prepare: ({ id }) => id === 2 ? b.promise : c.promise,
    isAllowed: () => true,
    onChange: () => {},
    onBegin: () => {},
    onHurry: () => {},
    onCancel: () => {}
  })

  const requestB = controller.request(article(2))
  const requestC = controller.request(article(3))
  c.resolve('3.jpg')
  await requestC
  assert.equal(controller.snapshot().entering?.item.id, 3)
  b.resolve('2.jpg')
  await requestB
  assert.equal(controller.snapshot().entering?.item.id, 3)
  controller.complete()
  assert.equal(controller.snapshot().settled?.item.id, 3)
})

test('A to B to A remains a real reversal and keeps only the latest pending item', async () => {
  let hurry = 0
  let starts = 0
  const controller = createImmersivePreview(prepared(1), {
    prepare: async ({ id }) => `${id}.jpg`,
    isAllowed: () => true,
    onChange: () => {},
    onBegin: () => { starts++ },
    onHurry: () => { hurry++ },
    onCancel: () => {}
  })

  await controller.request(article(2))
  assert.equal(controller.snapshot().entering?.item.id, 2)
  await controller.request(article(3))
  await controller.request(article(1))
  assert.equal(hurry, 2)
  controller.complete()
  assert.equal(controller.snapshot().settled?.item.id, 2)
  assert.equal(controller.snapshot().entering?.item.id, 1)
  controller.complete()
  assert.equal(controller.snapshot().settled?.item.id, 1)
  assert.equal(starts, 2)
})

test('filter invalidation blocks stale images and a failed cover keeps the article usable', async () => {
  const slow = deferred()
  const allowed = new Set([1, 2])
  const controller = createImmersivePreview(prepared(1), {
    prepare: ({ id }) => id === 2 ? slow.promise : Promise.reject(new Error('404')),
    isAllowed: ({ id }) => allowed.has(id),
    onChange: () => {},
    onBegin: () => {},
    onHurry: () => {},
    onCancel: () => {}
  })

  const requestB = controller.request(article(2))
  allowed.delete(2)
  controller.reconcile()
  slow.resolve('2.jpg')
  await requestB
  assert.equal(controller.snapshot().settled?.item.id, 1)
  assert.equal(controller.snapshot().entering, null)

  allowed.add(3)
  await controller.request(article(3))
  assert.equal(controller.snapshot().entering?.imageUrl, null)
  controller.complete()
  assert.equal(controller.snapshot().settled?.item.id, 3)
})

test('repeat requests share one preparation and disposed work cannot commit', async () => {
  const slow = deferred()
  let preparations = 0
  const controller = createImmersivePreview(prepared(1), {
    prepare: () => { preparations++; return slow.promise },
    isAllowed: () => true,
    onChange: () => {},
    onBegin: () => {},
    onHurry: () => {},
    onCancel: () => {}
  })

  const first = controller.request(article(2))
  await controller.request(article(2))
  assert.equal(preparations, 1)
  controller.dispose()
  slow.resolve('2.jpg')
  await first
  controller.complete()
  assert.equal(controller.snapshot().phase, 'disposed')
  assert.equal(controller.snapshot().settled?.item.id, 1)
})

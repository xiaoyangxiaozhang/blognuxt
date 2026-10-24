import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { rolldown } from 'rolldown'
import { fnv1a64Base36 as upstreamHash } from 'fnv1a-64'
import { fnv1a64Base36 as browserHash } from '../app/compat/hash.js'

const bundle = await rolldown({ input: fileURLToPath(new URL('../app/compat/browser.ts', import.meta.url)) })
const { output } = await bundle.generate({ format: 'iife' })
await bundle.close()
const compat = output[0].code

test('browser cache hashes match Nuxt server hashes without BigInt', () => {
  const values = ['', '首页', '🙂', '/article/example?tag=Nuxt', '__proto__']
  for (let index = 0; index < 200; index++) values.push(`${index}:${'博客'.repeat(index)}`)
  for (const value of values) assert.equal(browserHash(value), upstreamHash(value), value)
})

test('restore missing browser APIs before SSR payload parsing and routing', async () => {
  const context = vm.createContext({ setTimeout, clearTimeout })
  vm.runInContext(`
    delete Object.hasOwn; delete Array.prototype.at; delete String.prototype.at;
    delete String.prototype.replaceAll; delete Promise.any; delete Promise.allSettled;
    delete Array.prototype.flatMap; delete Object.fromEntries;
  `, context)
  vm.runInContext(compat, context)
  assert.equal(vm.runInContext(`Object.hasOwn({ payload: 1 }, 'payload')`, context), true)
  assert.equal(vm.runInContext(`Object.hasOwn({}, 'toString')`, context), false)
  assert.equal(vm.runInContext(`[1, 2].at(-1)`, context), 2)
  assert.equal(vm.runInContext(`[1, 2].at(Infinity)`, context), undefined)
  assert.equal(vm.runInContext(`'abc'.at(-1)`, context), 'c')
  assert.equal(vm.runInContext(`'a-a'.replaceAll('a', 'b')`, context), 'b-b')
  assert.equal(vm.runInContext(`Object.fromEntries([['value', 3]]).value`, context), 3)
  assert.equal(vm.runInContext(`[1, 2].flatMap(x => [x, x]).join()`, context), '1,1,2,2')
  assert.equal(await vm.runInContext(`Promise.any([Promise.reject('no'), Promise.resolve('yes')])`, context), 'yes')
  assert.equal(await vm.runInContext(`Promise.allSettled([Promise.reject('no')]).then(x => x[0].status)`, context), 'rejected')
})

test('keep modern APIs and adapt legacy media query listeners', () => {
  const calls = []
  const context = vm.createContext({ setTimeout, clearTimeout, window: {
    matchMedia: media => ({ media, addListener: listener => calls.push(listener), removeListener: listener => calls.push(listener) })
  } })
  const native = vm.runInContext('Object.hasOwn', context)
  vm.runInContext(compat, context)
  assert.equal(vm.runInContext('Object.hasOwn', context), native)
  vm.runInContext(`var query = window.matchMedia('all'); var listener = function () {}; query.addEventListener('change', listener); query.removeEventListener('change', listener)`, context)
  assert.equal(calls.length, 2)
  assert.equal(calls[0], calls[1])
})

test('startup fallback appears on failure and disappears after delayed recovery', async () => {
  const source = await readFile(new URL('../app/compat/startup-fallback.js', import.meta.url), 'utf8')
  let timeout, ready, delay, cleared = false
  const element = () => ({ children: [], style: {}, setAttribute() {},
    appendChild(child) { child.parentNode = this; this.children.push(child) },
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1) }
  })
  const body = element()
  vm.runInNewContext(source, {
    document: { body, createElement: element },
    window: {
      setTimeout: (callback, ms) => { timeout = callback; delay = ms; return 1 },
      clearTimeout: () => { cleared = true },
      addEventListener: (_event, callback) => { ready = callback }
    }
  })
  assert.equal(delay, 12000)
  assert.equal(body.children.length, 0)
  timeout()
  assert.equal(body.children[0].id, 'blog-startup-fallback')
  assert.equal(body.children[0].children[0].children[2].textContent, '刷新页面')
  ready()
  assert.equal(cleared, true)
  assert.equal(body.children.length, 0)
})

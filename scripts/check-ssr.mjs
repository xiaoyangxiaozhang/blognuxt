import http from 'node:http'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const marker = 'AUDIT_ARTICLE_MARKER'
let mode = 'normal'
let counts = {}
const article = { id: 1, title: marker, url: '/posts/audit-article', slug: 'audit-article', summary: 'Audit only', publish_time: '2026-10-04T00:00:00Z', tags: [], category: { name: 'Audit', url: '/category/audit' } }
const upstream = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  const path = new URL(req.url, 'http://localhost').pathname
  counts[path] = (counts[path] || 0) + 1
  if (path === '/audit-sentinel') {
    res.setHeader('content-type', 'text/html')
    res.end('<html><body>AUDIT_LOCAL_ONLY</body></html>')
    return
  }
  res.setHeader('content-type', 'application/json')
  if (mode === 'category-failure' && path.endsWith('/categories')) {
    res.statusCode = 503
    res.end(JSON.stringify({ code: 503, message: 'Synthetic failure' }))
    return
  }
  if (mode === 'slow-moments' && path.endsWith('/moments')) await delay(600)
  if (path === '/api/v1/articles/audit-unavailable') {
    res.statusCode = 503
    res.end(JSON.stringify({ code: 503, message: 'Synthetic unavailable' }))
    return
  }
  if (path === '/api/v1/articles/audit-missing') {
    res.statusCode = 404
    res.end(JSON.stringify({ code: 404, message: 'Missing synthetic article' }))
    return
  }
  let data = { list: [], total: 0 }
  if (path.endsWith('/settings/blog')) data = { 'blog.title': mode === 'new-settings' ? 'UPDATED_AUDIT_BLOG' : 'Audit Blog', 'blog.kimidou_enabled': 'false' }
  if (path.endsWith('/settings/basic')) data = { 'basic.author': 'Audit author' }
  if (path.endsWith('/settings/oauth')) data = {}
  if (path.endsWith('/articles')) data = { list: [article], total: 1 }
  if (path.endsWith('/moments')) data = { list: [{ id: 1, publish_time: '2026-10-04T00:00:00Z', content: { text: 'AUDIT_MOMENT_MARKER' }, is_publish: true }], total: 1 }
  if (path.endsWith('/chatbot/config')) data = { enabled: false }
  if (path.endsWith('/stats/site')) data = {}
  res.end(JSON.stringify({ code: 0, data }))
})
await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve))
const apiPort = upstream.address().port
const allocator = http.createServer()
await new Promise(resolve => allocator.listen(0, '127.0.0.1', resolve))
const port = allocator.address().port
await new Promise(resolve => allocator.close(resolve))
const origin = 'http://127.0.0.1:' + port
const child = spawn(process.execPath, ['.output/server/index.mjs'], {
  cwd: root,
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), NITRO_HOST: '127.0.0.1', NITRO_PORT: String(port),
    NUXT_PUBLIC_API_BASE: 'http://127.0.0.1:' + apiPort + '/api/v1',
    NUXT_PUBLIC_SITE_URL: origin, NUXT_PUBLIC_ANALYTICS_ENABLED: 'false' },
  stdio: ['ignore', 'pipe', 'pipe']
})
let logs = ''
child.stdout.on('data', chunk => { logs += chunk })
child.stderr.on('data', chunk => { logs += chunk })
try {
  let ready = false
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error('Nuxt exited: ' + logs.slice(-1500))
    try { await fetch(origin + '/favicon.png'); ready = true; break } catch {}
    await delay(100)
  }
  assert(ready, 'local Nuxt startup timed out')

  const proxied = await fetch(origin + '/proxy-image?url=' + encodeURIComponent('http://127.0.0.1:' + apiPort + '/audit-sentinel'))
  const proxyBody = await proxied.text()
  assert.equal(proxied.status, 403)
  assert(!proxyBody.includes('AUDIT_LOCAL_ONLY'))
  assert.equal(counts['/audit-sentinel'], undefined, 'the internal service must not be contacted')
  const dnsBlocked = await fetch(origin + '/proxy-image?url=' + encodeURIComponent('http://localhost:' + apiPort + '/audit-sentinel'))
  assert.equal(dnsBlocked.status, 403, 'private DNS results must be blocked at connection time')
  await dnsBlocked.text()
  assert.equal(counts['/audit-sentinel'], undefined)
  console.log(JSON.stringify({ case: 'local-only image proxy probe', status: proxied.status, returnedLoopbackMarker: false, contentType: proxied.headers.get('content-type') }))

  counts = {}
  const home = await fetch(origin + '/')
  const homeHtml = await home.text()
  assert(homeHtml.includes(marker), 'synthetic article missing on healthy home')
  assert.equal(counts['/api/v1/settings/blog'], 1)
  assert.equal(counts['/api/v1/settings/basic'], 1)
  assert.equal(counts['/api/v1/categories'], undefined)
  assert.equal(counts['/api/v1/tags'], undefined)
  assert.equal(counts['/api/v1/comments'], undefined)
  assert.equal(counts['/api/v1/moments'], undefined)
  console.log(JSON.stringify({ case: 'healthy home SSR', status: home.status, apiCounts: counts }))

  counts = {}
  mode = 'slow-moments'
  const start = performance.now()
  const slow = await fetch(origin + '/')
  await slow.text()
  assert.equal(counts['/api/v1/moments'], undefined, 'noncritical activity must not block SSR')
  console.log(JSON.stringify({ case: 'home with synthetic 600ms moments delay', responseMs: Math.round(performance.now() - start) }))

  mode = 'category-failure'
  const failed = await fetch(origin + '/')
  const failedHtml = await failed.text()
  const visibleHtml = failedHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  const articleCardStillRendered = visibleHtml.includes(marker)
  assert.equal(articleCardStillRendered, true, 'unrelated failures must not hide healthy articles')
  assert(!visibleHtml.includes('获取首页数据失败'))
  console.log(JSON.stringify({ case: 'category fails while articles succeed', status: failed.status, articleCardStillRendered, wholeHomeError: visibleHtml.includes('获取首页数据失败') }))

  mode = 'normal'
  const list = await fetch(origin + '/articles')
  const listHtml = await list.text()
  const canonical = listHtml.match(/<link[^>]+rel="canonical"[^>]*>/)?.[0]
  assert(canonical?.includes(origin + '/articles'))
  console.log(JSON.stringify({ case: 'articles index canonical', canonical }))

  const missing = await fetch(origin + '/article/audit-missing')
  const missingHtml = await missing.text()
  assert.equal(missing.status, 404)
  assert(missingHtml.includes('Article not found.'))
  assert(missingHtml.includes('noindex'))
  const unavailable = await fetch(origin + '/article/audit-unavailable')
  assert.equal(unavailable.status, 503)
  await unavailable.text()
  console.log(JSON.stringify({ case: 'article error statuses', missing: missing.status, unavailable: unavailable.status }))

  mode = 'new-settings'
  const nextHome = await fetch(origin + '/')
  assert((await nextHome.text()).includes('UPDATED_AUDIT_BLOG'), 'settings must not leak across SSR requests')
  mode = 'normal'
  console.log('PASS: proxy boundary, independent SSR data, settings request reuse, canonical and HTTP error statuses')
  if (process.argv.includes('--serve')) {
    console.log(JSON.stringify({ preview: origin, mockAPI: 'http://127.0.0.1:' + apiPort }))
    await new Promise(resolve => process.once('SIGTERM', resolve))
  }
} finally {
  child.kill('SIGTERM')
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)])
  if (child.exitCode === null) child.kill('SIGKILL')
  upstream.closeAllConnections()
  await new Promise(resolve => upstream.close(resolve))
}

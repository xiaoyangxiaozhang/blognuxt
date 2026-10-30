import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import { parse } from '@vue/compiler-sfc'
import { computed, ref, reactive, watch, nextTick, effectScope } from 'vue'

const flush = async () => { await nextTick(); await new Promise(setImmediate) }
const comment = (id = 9) => ({ id, content: '请问这个功能怎么使用？', nickname: '读者', created_at: new Date().toISOString(), target_type: 'page', target_key: 'friend', target_title: '友链', url: '/friends' })
const reply = (version = 1, status = 'pending') => ({ id: 'draft-1', version, status, content: `这是第 ${version} 版回复。`, comment: comment(), expires_at: new Date(Date.now() + 30 * 60_000).toISOString(), ...(status === 'published' ? { published_comment_id: 21, published_url: '/friends' } : {}) })
const envelope = data => ({ code: 0, message: '', data })
const friendQuery = { page: 1, page_size: 5, target_type: 'page', target_key: 'friend' }

test('SSE keeps split Chinese text and tool results in the owner stream; messages cannot publish', async () => {
  const source = await readFile(new URL('../app/services/api/chatbot.ts', import.meta.url), 'utf8')
  const code = stripTypeScriptTypes(source.replace(/^import .*$/gm, '')).replace(/^export /gm, '')
  const frames = [
    ['ready', {}], ['status', { message: '正在查询评论' }],
    ['comments', { items: [comment()], total: 1, page: 1, page_size: 5, query: friendQuery }],
    ['draft', reply()], ['delta', { content: '已准备好，等待你确认。' }], ['done', { sources: [] }]
  ]
  const bytes = new TextEncoder().encode(frames.map(([event, data]) => `event: ${event}\r\ndata: ${JSON.stringify(data)}\r\n\r\n`).join(''))
  const requests = []
  const writes = []
  const context = vm.createContext({
    useRuntimeConfig: () => ({ public: { apiBase: '/api/v1' } }),
    useAccessToken: () => ({ value: 'owner-token' }), refreshAccessToken: async () => null,
    apiGet: async () => {}, apiPatch: async (...args) => writes.push(args), apiPost: async (...args) => writes.push(args),
    URL, TextDecoder, Uint8Array,
    fetch: async (url, options) => {
      requests.push({ url, options })
      return new Response(new ReadableStream({ start(controller) {
        for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7))
        controller.close()
      } }))
    }
  })
  vm.runInContext(code + '\nglobalThis.api = { streamChatbotMessage, publishReplyDraft, safeChatbotURL };', context)
  const events = []
  const deltas = []
  const result = await context.api.streamChatbotMessage({ message: '确认发布' }, text => deltas.push(text), undefined, { agent: true, onEvent: event => events.push(event) })
  assert.equal(requests[0].url, '/api/v1/admin/chatbot/agent/stream')
  assert.equal(requests[0].options.headers.Authorization, 'Bearer owner-token')
  assert.equal(result.reply, '已准备好，等待你确认。')
  assert.deepEqual(deltas, ['已准备好，等待你确认。'])
  assert.deepEqual(events.map(event => event.type), ['status', 'comments', 'draft'])
  assert.equal(events[2].data.content, reply().content)
  assert.equal(writes.length, 0)

  events.length = 0
  await context.api.streamChatbotMessage({ message: '你好' }, () => {}, undefined, { onEvent: event => events.push(event) })
  assert.equal(requests[1].url, '/api/v1/chatbot/chat/stream')
  assert.equal(events.length, 0, 'public chat must ignore privileged tool events')
  await context.api.publishReplyDraft('draft-1', 2)
  assert.equal(writes[0][0], '/admin/chatbot/reply-drafts/draft-1/publish')
  assert.equal(writes[0][1].version, 2)
  assert.equal(context.api.safeChatbotURL('javascript:alert(1)'), undefined)
  assert.equal(context.api.safeChatbotURL('//other.example'), undefined)
  assert.equal(context.api.safeChatbotURL('/friends'), '/friends')

  context.fetch = async () => new Response('event: delta\ndata: {"content":"未完成"}\n\n')
  await assert.rejects(context.api.streamChatbotMessage({}, () => {}), /连接意外中断/)
  context.fetch = async () => new Response('event: delta\ndata: {"content":"保留正文"}\n\nevent: done\ndata: {"sources":[]}')
  await assert.rejects(context.api.streamChatbotMessage({}, () => {}), /连接意外中断/, 'an incomplete done frame cannot confirm completion')
})

async function widgetFixture({ saved, getDraft, publish, update, commentToolsEnabled = true } = {}) {
  const source = await readFile(new URL('../app/components/chat/ChatbotWidget.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const code = stripTypeScriptTypes(descriptor.scriptSetup.content.replace(/^import .*$/gm, '')).replaceAll('import.meta.client', 'true')
  const currentUser = ref({ id: 1, role: 'super_admin', nickname: '博主' })
  const loggedIn = ref(true)
  const authReady = ref(true)
  const mounts = [], disposes = [], calls = []
  const storage = new Map(saved ? [['blog-chatbot-session-v3:owner:1', JSON.stringify(saved)]] : [])
  let stream = async (body, onDelta, signal, options) => {
    calls.push({ type: 'chat', body, options, signal })
    options.onEvent({ type: 'comments', data: { items: [comment(8), comment(9)], total: 2, page: 1, page_size: 5, query: friendQuery } })
    options.onEvent({ type: 'draft', data: reply() })
    onDelta('请检查草稿后确认发布。')
    return { reply: '请检查草稿后确认发布。', sources: [] }
  }
  const context = vm.createContext({
    computed, ref, reactive, watch, nextTick, setTimeout, clearTimeout, AbortController,
    crypto: { randomUUID: () => 'session-test' },
    useRoute: () => ({ path: '/friends', fullPath: '/friends', params: {} }),
    useCommentAuth: () => ({ currentUser, isLoggedIn: loggedIn, authReady, restoreSession: async () => currentUser.value }),
    onMounted: fn => mounts.push(fn), onBeforeUnmount: fn => disposes.push(fn),
    window: { addEventListener() {}, removeEventListener() {} },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    proxyImageUrl: value => value,
    getChatbotConfig: async () => envelope({ enabled: true, comment_tools_enabled: commentToolsEnabled, welcome: '你好', suggestions: [] }),
    streamChatbotMessage: (...args) => stream(...args),
    getReplyDraft: async id => { calls.push({ type: 'get', id }); return envelope(await (getDraft ? getDraft(id) : reply())) },
    updateReplyDraft: async (id, version, content) => { calls.push({ type: 'update', id, version, content }); return envelope(await (update ? update(id, version, content) : { ...reply(version + 1), content })) },
    publishReplyDraft: async (id, version) => { calls.push({ type: 'publish', id, version }); return envelope(await (publish ? publish(id, version) : reply(version, 'published'))) },
    cancelReplyDraft: async (id, version) => { calls.push({ type: 'cancel', id, version }); return envelope(reply(version, 'cancelled')) },
    console
  })
  const scope = effectScope()
  scope.run(() => vm.runInContext(code + '\nglobalThis.state = { messages, draft, send, publishReply, saveReply, cancelReply, recheckDraft, setDraftDirty, verifiedDrafts, uncertainPublishes, currentDraftId, isOwner };', context))
  await Promise.all(mounts.map(fn => fn()))
  await flush()
  return {
    state: context.state, calls, storage, currentUser, loggedIn,
    setStream: value => { stream = value },
    dispose: () => { disposes.forEach(fn => fn()); scope.stop() }
  }
}

test('disabled comment tools keep owners on ordinary chat without restoring or publishing drafts', async () => {
  const fixture = await widgetFixture({
    commentToolsEnabled: false,
    saved: { sessionId: 'previous-session', messages: [{ role: 'assistant', content: '', replyDraft: reply() }], currentDraftId: 'draft-1' }
  })
  try {
    assert.equal(fixture.state.isOwner.value, false)
    assert.equal(fixture.calls.some(call => call.type === 'get'), false)
    assert.equal(fixture.state.messages.value.some(item => item.replyDraft), false)
    let request
    fixture.setStream(async (body, onDelta, signal, options) => {
      request = { body, options }
      onDelta('普通聊天仍然可用。')
      return { reply: '普通聊天仍然可用。', sources: [] }
    })
    await fixture.state.send('你好')
    assert.equal(request.options.agent, false)
    assert.equal(request.body.draft_id, undefined)
    assert.equal(request.body.comment_ids, undefined)
    await fixture.state.publishReply(reply())
    assert.equal(fixture.calls.some(call => call.type === 'publish'), false)
  } finally { fixture.dispose() }
})

test('draft changes remain in the same chat and only an explicit publish action writes', async () => {
  let completePublish
  const fixture = await widgetFixture({ publish: () => new Promise(resolve => { completePublish = resolve }) })
  const { state, calls } = fixture
  try {
    await state.send('帮我回复第二条评论')
    assert.equal(state.messages.value.filter(item => item.replyDraft).length, 1)
    assert.equal(calls.filter(call => call.type === 'publish').length, 0)
    assert.equal(state.currentDraftId.value, 'draft-1')
    await state.send('短一点')
    const secondChat = calls.filter(call => call.type === 'chat')[1]
    assert.equal(secondChat.body.draft_id, 'draft-1')
    assert.deepEqual(Array.from(secondChat.body.comment_ids), [8, 9])
    assert.equal(state.messages.value.filter(item => item.replyDraft).length, 1, 'editing reuses the existing draft card')
    assert.equal(calls.filter(call => call.type === 'publish').length, 0)

    state.setDraftDirty('draft-1', true)
    await state.publishReply(reply())
    assert.equal(calls.filter(call => call.type === 'publish').length, 0, 'unsaved edits cannot publish an older draft')
    await state.saveReply(reply(), '手动修改后的最终回复')
    const updated = state.messages.value.find(item => item.replyDraft)?.replyDraft
    assert.equal(updated.version, 2)
    assert.equal(updated.content, '手动修改后的最终回复')
    const publishing = state.publishReply(updated)
    await state.publishReply(updated)
    assert.equal(calls.filter(call => call.type === 'publish').length, 1, 'double clicks share one in-flight action')
    assert.equal(calls.find(call => call.type === 'publish').version, 2)
    const persisted = JSON.parse(fixture.storage.get('blog-chatbot-session-v3:owner:1'))
    assert.deepEqual(persisted.uncertainPublishes, [['draft-1', 2]])
    completePublish({ ...updated, status: 'published', published_comment_id: 21 })
    await publishing
    assert.equal(state.messages.value.find(item => item.replyDraft)?.replyDraft.status, 'published')
    assert.equal(state.uncertainPublishes.size, 0)
  } finally { fixture.dispose() }
})

test('a lost publish response reads back the same action instead of issuing a second write', async () => {
  const fixture = await widgetFixture({ publish: async () => { throw new Error('connection closed') }, getDraft: async () => reply(1, 'published') })
  try {
    await fixture.state.send('拟一份回复')
    await fixture.state.publishReply(reply())
    assert.deepEqual(fixture.calls.filter(call => call.type === 'publish' || call.type === 'get').map(call => call.type), ['publish', 'get'])
    assert.equal(fixture.state.messages.value.find(item => item.replyDraft)?.replyDraft.status, 'published')
    assert.equal(fixture.state.uncertainPublishes.size, 0)
  } finally { fixture.dispose() }
})

test('continuing an older comment list retains its query and reload restores the last query', async () => {
  const fixture = await widgetFixture()
  let saved
  try {
    await fixture.state.send('看看友链评论')
    await flush()
    saved = JSON.parse(fixture.storage.get('blog-chatbot-session-v3:owner:1'))
    assert.deepEqual(saved.commentQuery, friendQuery)
    const olderQuery = { page: 3, page_size: 2, target_type: 'article', target_key: 'older-article' }
    const olderPage = { items: [comment(4), comment(5)], total: 20, page: 3, page_size: 2, query: olderQuery }
    await fixture.state.send('继续查看下一页评论', olderPage)
    const request = fixture.calls.filter(call => call.type === 'chat').at(-1).body
    assert.deepEqual(JSON.parse(JSON.stringify(request.comment_query)), olderQuery)
    assert.deepEqual(Array.from(request.comment_ids), [4, 5])
    assert.equal(fixture.state.messages.value.filter(item => item.role === 'user').at(-1).content, '继续查看下一页评论')
  } finally { fixture.dispose() }

  const restored = await widgetFixture({ saved })
  try {
    await restored.state.send('继续查看下一页评论')
    const request = restored.calls.find(call => call.type === 'chat').body
    assert.deepEqual(JSON.parse(JSON.stringify(request.comment_query)), friendQuery)
  } finally { restored.dispose() }
})

test('cached drafts need a fresh read; logout discards privileged content and late responses', async () => {
  let finishRead
  const fixture = await widgetFixture({
    saved: { sessionId: 'previous-session', messages: [{ role: 'assistant', content: '', replyDraft: reply() }], currentDraftId: 'draft-1' },
    getDraft: () => new Promise(resolve => { finishRead = resolve })
  })
  try {
    assert.equal(fixture.state.verifiedDrafts.size, 0)
    await fixture.state.publishReply(reply())
    assert.equal(fixture.calls.filter(call => call.type === 'publish').length, 0)
    fixture.loggedIn.value = false
    fixture.currentUser.value = null
    await flush()
    finishRead(reply())
    await flush()
    assert.equal(fixture.state.isOwner.value, false)
    assert.equal(fixture.state.messages.value.some(item => item.replyDraft || item.comments), false)
    assert.equal(fixture.storage.has('blog-chatbot-session-v3:owner:1'), false)
    assert.equal(fixture.state.verifiedDrafts.size, 0)
  } finally { fixture.dispose() }
})

test('interrupted replies remain visible and marked after reload but do not enter model history', async () => {
  const fixture = await widgetFixture()
  let saved
  try {
    fixture.setStream(async (_body, onDelta) => {
      onDelta('已收到的前半段回答。')
      await flush()
      const inFlight = JSON.parse(fixture.storage.get('blog-chatbot-session-v3:owner:1'))
      assert.equal(inFlight.messages.find(item => item.content === '已收到的前半段回答。').incomplete, true, 'refreshing during a stream must not restore a partial reply as complete')
      throw new Error('回复连接意外中断')
    })
    await fixture.state.send('原始问题')
    const partial = fixture.state.messages.value.find(item => item.content === '已收到的前半段回答。')
    assert.ok(partial)
    assert.equal(partial.streaming, false)
    assert.equal(partial.incomplete, true)
    assert.equal(fixture.state.draft.value, '原始问题')
    assert.equal(fixture.calls.some(call => call.type === 'publish'), false)
    await flush()
    saved = JSON.parse(fixture.storage.get('blog-chatbot-session-v3:owner:1'))
    assert.equal(saved.messages.find(item => item.content === partial.content).incomplete, true)
  } finally { fixture.dispose() }

  const restored = await widgetFixture({ saved })
  try {
    assert.equal(restored.state.messages.value.find(item => item.content === '已收到的前半段回答。').incomplete, true)
    let request
    restored.setStream(async (body, onDelta) => {
      request = body
      onDelta('完整的新回答。')
      return { reply: '完整的新回答。', sources: [] }
    })
    await restored.state.send('继续聊')
    assert.equal(request.history.some(item => item.content === '已收到的前半段回答。'), false)
    assert.equal(restored.state.messages.value.find(item => item.content === '完整的新回答。').streaming, false)
    assert.equal(restored.state.messages.value.find(item => item.content === '完整的新回答。').incomplete, undefined)
  } finally { restored.dispose() }
})

test('a failure before the first delta restores input without creating an empty reply', async () => {
  const fixture = await widgetFixture()
  try {
    fixture.setStream(async () => { throw new Error('暂时无法连接模型') })
    await fixture.state.send('再次提问')
    assert.equal(fixture.state.draft.value, '再次提问')
    assert.equal(fixture.state.messages.value.some(item => item.incomplete || item.streaming), false)
  } finally { fixture.dispose() }
})

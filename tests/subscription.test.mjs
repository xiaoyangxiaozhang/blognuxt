import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import { parse } from '@vue/compiler-sfc'
import { computed, ref, reactive, watch, nextTick, effectScope } from 'vue'

test('subscription uses the signed-in real email and preserves guest, duplicate and retry paths', async () => {
  const source = await readFile(new URL('../app/components/shell/SubscribeDialog.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const code = stripTypeScriptTypes(descriptor.scriptSetup.content.replace(/^import .*$/gm, ''))
    .replaceAll('import.meta.client', 'true')
  const props = reactive({ modelValue: false })
  const user = ref({ email: ' Reader@Example.com ', is_virtual_email: false })
  const loggedIn = ref(true)
  const calls = []
  let response = { code: 0 }
  const context = vm.createContext({
    computed, ref, watch, nextTick, onUnmounted: () => {},
    defineProps: () => props, defineEmits: () => () => {},
    useCommentAuth: () => ({ currentUser: user, isLoggedIn: loggedIn }),
    subscribeToUpdates: async body => { calls.push(body.email); return await response },
    document: { activeElement: null, body: { style: { overflow: '' } } },
    console: { error: () => {} }
  })
  const scope = effectScope()
  scope.run(() => vm.runInContext(code + '\nglobalThis.state = { accountEmail, email, submitState, errorMessage, isComplete, handleSubmit };', context))
  const state = context.state
  const open = async () => { props.modelValue = true; await new Promise(setImmediate) }
  const close = async () => { props.modelValue = false; await nextTick() }
  try {
    await open()
    assert.deepEqual(calls, ['reader@example.com'])
    assert.equal(state.submitState.value, 'success')
    assert.equal(state.isComplete.value, true)
    await state.handleSubmit()
    assert.equal(calls.length, 1)
    await close()

    loggedIn.value = false
    await open()
    assert.equal(state.accountEmail.value, '')
    assert.equal(calls.length, 1)
    state.email.value = 'invalid'
    await state.handleSubmit()
    assert.match(state.errorMessage.value, /正确/)
    state.email.value = ' Guest@Example.com '
    response = { code: 500, message: '该邮箱已订阅' }
    await state.handleSubmit()
    assert.equal(calls.at(-1), 'guest@example.com')
    assert.equal(state.submitState.value, 'already-subscribed')
    await close()

    loggedIn.value = true
    user.value = { email: 'qq_TEST@virtual.local', is_virtual_email: true }
    await open()
    assert.equal(state.accountEmail.value, '')
    assert.equal(calls.length, 2, 'virtual email must not auto-subscribe')
    state.email.value = 'qq_TEST@virtual.local'
    await state.handleSubmit()
    assert.equal(calls.length, 2)
    await close()

    user.value = { email: 'reader@example.com' }
    response = Promise.reject({ data: { message: '邮件服务暂不可用' } })
    await open()
    assert.equal(state.submitState.value, 'idle')
    assert.equal(state.errorMessage.value, '邮件服务暂不可用')
    let resolve
    response = new Promise(done => { resolve = done })
    const pending = state.handleSubmit()
    await state.handleSubmit()
    assert.equal(calls.length, 4, 'repeated clicks must not send duplicate requests')
    resolve({ code: 0 })
    await pending
    assert.equal(state.submitState.value, 'success')
  } finally {
    scope.stop()
  }
})

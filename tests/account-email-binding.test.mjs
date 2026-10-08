import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'

async function accountFixture() {
  const source = await readFile(new URL('../app/components/shell/AccountDialog.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, { id: 'account-email-binding', inlineTemplate: true })
  const mocks = `
    import { computed, ref, reactive, watch, onBeforeUnmount } from 'vue';
    export const user = ref({ id: 7, email: 'qq_SYNTHETIC@virtual.local', nickname: '测试账号', linked_oauths: ['qq'] });
    export const calls = [], notices = [];
    export let sendResult = { code: 0 }, bindResult = { code: 0 }, forgotResult = { code: 0 };
    export const setResponses = (send, bind) => { sendResult = send; bindResult = bind; };
    export const setForgotResult = result => { forgotResult = result; };
    const Cross1Icon = { render: () => null }, LoginDialog = { render: () => null };
    const ElMessage = { success: value => notices.push(value), warning: value => notices.push(value) };
    const useBlogSettings = () => ({ settings: ref({}) });
    export const mode = ref('profile');
    const useSiteOverlays = () => ({ accountOpen: ref(true), accountMode: mode });
    const useCommentAuth = () => ({ currentUser: user, authReady: ref(true), isLoggedIn: ref(true), fetchProfile: async () => user.value, logoutUser: async () => {} });
    const sendEmailBindingCode = async email => { calls.push(['send', email]); return sendResult; };
    const bindUserEmail = async (email, code) => { calls.push(['bind', email, code]); return bindResult; };
    const forgotPassword = async body => { calls.push(['reset-code', body.email]); return forgotResult; };
    const changePassword = () => {}, deactivateAccount = () => {}, resetPassword = () => {}, setPassword = () => {}, unbindOAuth = () => {}, updateUserProfile = () => {}, uploadFile = () => {};
    const proxyImageUrl = value => value;
    let tick;
    const setInterval = callback => { tick = callback; return 1; }, clearInterval = () => {};
    export const advanceSeconds = count => { for (let i = 0; i < count; i++) tick(); };
  `
  const component = compiled.content.replace(/^import[\s\S]*?from\s+(['"])([^'"]+)\1\s*;?/gm,
    (statement, _, path) => path === 'vue' ? statement : '')
    .replace('setup(__props) {', 'setup(__props, { expose }) {')
    .replace('return (_ctx: any,_cache: any) => {', 'expose({ emailBindingOpen, emailForm, emailBindingError, emailSentTo, emailResendIn, requestEmailBindingCode, submitEmailBinding, resetForm, resetCodeError, sendResetCode, emailDeliveryHelp });\nreturn (_ctx: any,_cache: any) => {')
  const code = stripTypeScriptTypes(mocks + component)
    .replace(/from (['"])vue\1/g, `from ${JSON.stringify(import.meta.resolve('vue'))}`)
  // Fresh module state per fixture.
  const module = await import(`data:text/javascript;base64,${Buffer.from(code + '\n//' + Math.random()).toString('base64')}`)
  let state
  const setup = module.default.setup
  module.default.setup = (props, context) => setup(props, { ...context, expose: value => { state = value; context.expose(value) } })
  const render = async () => {
    const app = createSSRApp(module.default)
    app.component('NuxtLink', { render: () => null })
    const context = {}
    await renderToString(app, context)
    return context.teleports.body
  }
  const html = await render()
  return { module, state, html, render }
}

test('account offers binding for a placeholder email and hides it after binding', async () => {
  const fixture = await accountFixture()
  assert.match(fixture.html, /未绑定邮箱[\s\S]*绑定邮箱/)
  assert.doesNotMatch(fixture.html, /virtual\.local/)
  fixture.module.user.value.email = 'reader@example.com'
  assert.doesNotMatch(await fixture.render(), /输入可接收邮件的邮箱|>绑定邮箱</)
})

test('binding validates input, respects resend cooldown and keeps server failures visible', async () => {
  const { state, module } = await accountFixture()
  state.emailForm.email = 'qq_SYNTHETIC@virtual.local'
  await state.requestEmailBindingCode()
  assert.equal(module.calls.length, 0)
  assert.match(state.emailBindingError.value, /真实邮箱/)
  state.emailForm.email = ' Reader@Example.com '
  module.setResponses({ code: 500, message: '邮箱已被使用' }, { code: 0 })
  await state.requestEmailBindingCode()
  assert.equal(state.emailSentTo.value, '')
  assert.equal(state.emailBindingError.value, '邮箱已被使用')
  module.setResponses({ code: 0 }, { code: 500, message: '验证码已过期' })
  await state.requestEmailBindingCode()
  assert.equal(state.emailSentTo.value, 'reader@example.com')
  assert.equal(state.emailResendIn.value, 60)
  const count = module.calls.length
  await state.requestEmailBindingCode()
  assert.equal(module.calls.length, count)
  state.emailForm.code = '123456'
  await state.submitEmailBinding()
  assert.equal(state.emailBindingError.value, '验证码已过期')
  assert.equal(module.user.value.email, 'qq_SYNTHETIC@virtual.local')
  module.setResponses({ code: 0 }, { code: 0 })
  await state.submitEmailBinding()
  assert.equal(module.user.value.email, 'reader@example.com')
  assert.equal(module.user.value.is_virtual_email, false)
  assert.equal(module.user.value.id, 7)
  assert.equal(state.emailForm.code, '')
  assert.equal(state.emailBindingOpen.value, false)
  assert.deepEqual(module.notices, ['邮箱已绑定。'])
  module.advanceSeconds(60)
  assert.equal(state.emailResendIn.value, 0)
})

test('a pending binding cannot overwrite a different account after switching users', async () => {
  const { state, module } = await accountFixture()
  state.emailForm.email = 'reader@example.com'
  await state.requestEmailBindingCode()
  state.emailForm.code = '123456'
  let complete
  module.setResponses({ code: 0 }, new Promise(resolve => { complete = resolve }))
  const pending = state.submitEmailBinding()
  module.user.value = { id: 8, email: 'qq_OTHER@virtual.local', nickname: 'Other' }
  complete({ code: 0 })
  await pending
  assert.equal(module.user.value.email, 'qq_OTHER@virtual.local')
  assert.equal(module.notices.length, 0)
})

test('password reset displays delivery failures instead of reporting a code was sent', async () => {
  const { state, module, render } = await accountFixture()
  const hint = '该邮箱无法接受验证码，请联系管理员～'
  assert.equal(state.emailDeliveryHelp, hint)
  state.resetForm.email = 'missing@example.com'
  module.setForgotResult({ code: 500, message: hint })
  await state.sendResetCode()
  assert.equal(state.resetCodeError.value, hint)
  assert.deepEqual(module.notices, [])
  module.setForgotResult(Promise.reject({ data: { message: hint } }))
  await state.sendResetCode()
  assert.equal(state.resetCodeError.value, hint)
  assert.deepEqual(module.notices, [])
  module.setForgotResult({ code: 0 })
  await state.sendResetCode()
  assert.equal(state.resetCodeError.value, '')
  assert.deepEqual(module.notices, ['验证码已发送。'])
  module.mode.value = 'reset'
  assert.match(await render(), /收不到验证码？/)
})

test('binding displays the administrator hint when mail delivery fails', async () => {
  const { state, module } = await accountFixture()
  const hint = '该邮箱无法接受验证码，请联系管理员～'
  state.emailForm.email = 'missing@example.com'
  module.setResponses({ code: 500, message: hint }, { code: 0 })
  await state.requestEmailBindingCode()
  assert.equal(state.emailBindingError.value, hint)
  assert.equal(state.emailSentTo.value, '')
  assert.equal(state.emailResendIn.value, 0)
  assert.deepEqual(module.notices, [])
})

test('binding respects Retry-After on a 429 response and allows retry when it expires', async () => {
  const { state, module } = await accountFixture()
  state.emailForm.email = 'reader@example.com'
  module.setResponses(Promise.reject({
    response: { status: 429, headers: new Headers({ 'Retry-After': '37' }) },
    data: { message: '请求过于频繁，请在 37 秒后重试' }
  }), { code: 0 })
  await state.requestEmailBindingCode()
  assert.equal(state.emailResendIn.value, 37)
  assert.equal(state.emailBindingError.value, '请求过于频繁，请在 37 秒后重试')
  assert.equal(state.emailSentTo.value, '')
  await state.requestEmailBindingCode()
  assert.equal(module.calls.length, 1)
  module.advanceSeconds(37)
  module.setResponses({ code: 0 }, { code: 0 })
  await state.requestEmailBindingCode()
  assert.equal(module.calls.length, 2)
  assert.equal(state.emailSentTo.value, 'reader@example.com')
})

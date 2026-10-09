import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'

async function loadPanel(name) {
  const source = await readFile(new URL(`../app/components/home/feature-panels/${name}.vue`, import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, { id: name, inlineTemplate: true })
  const code = stripTypeScriptTypes(`import { computed, ref } from 'vue';\n${compiled.content}`)
    .replace(/import \{ formatDate \} from ['"]~\/utils\/date['"]/, 'const formatDate = value => value')
    .replace(/import \{ proxyImageSrcSet, proxyImageUrl \} from ['"]~\/utils\/image['"]/, 'const proxyImageSrcSet = () => undefined; const proxyImageUrl = value => value')
    .replace(/import \{ proxyImageUrl \} from ['"]~\/utils\/image['"]/, 'const proxyImageUrl = value => value')
    .replace(/import \{ renderCommentContent \} from ['"]~\/utils\/commentRenderer['"]/, 'const renderCommentContent = () => []')
    .replace(/import \{ ChevronRightIcon \} from ['"]~\/utils\/siteIcons['"]/, 'const ChevronRightIcon = { render: () => null }')
    .replace(/from (['"])vue\1/g, `from ${JSON.stringify(import.meta.resolve('vue'))}`)
  return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default
}

for (const [name, items] of [['FeatureCommentsPanel', 'comments'], ['FeatureMomentsPanel', 'moments']]) {
  test(`${name} keeps loading, failure and empty states separate`, async () => {
    const panel = await loadPanel(name)
    const render = async props => {
      const app = createSSRApp(panel, { [items]: [], ...props })
      app.component('ElSkeleton', { render: () => h('div', 'Loading placeholder') })
      app.component('NuxtLink', { props: ['to'], setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()) })
      return renderToString(app)
    }
    const failed = await render({ loading: false, errorMessage: 'Synthetic failure' })
    assert.match(failed, /role="status"/)
    assert.match(failed, /Synthetic failure[\s\S]*重新加载/)
    const loading = await render({ loading: true, errorMessage: 'Synthetic failure' })
    assert.match(loading, /Loading placeholder/)
    assert.doesNotMatch(loading, /Synthetic failure|重新加载/)
    assert.doesNotMatch(await render({ loading: false, errorMessage: '' }), /Synthetic failure|重新加载/)
  })
}

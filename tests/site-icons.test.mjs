import test from 'node:test'
import assert from 'node:assert/strict'
import { h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { canonicalD } from 'morphicons/dom'
import { Eye, EyeOff, Menu, Moon, Pause, Play, Sun, X } from 'lucide'
import {
  Cross1Icon, EyeOpenIcon, HamburgerMenuIcon, HeartFilledIcon, PlayIcon, ThemeIcon
} from '../app/utils/siteIcons.ts'

test('menu, theme, password and playback icons describe the next available action', async () => {
  for (const [component, active, expected] of [
    [HamburgerMenuIcon, false, Menu], [HamburgerMenuIcon, true, X],
    [ThemeIcon, false, Sun], [ThemeIcon, true, Moon],
    [EyeOpenIcon, false, Eye], [EyeOpenIcon, true, EyeOff],
    [PlayIcon, false, Play], [PlayIcon, true, Pause]
  ]) {
    const html = await renderToString(h(component, { active }))
    assert.equal(html.match(/<path[^>]* d="([^"]+)"/)?.[1], canonicalD(expected))
  }
})

test('shared SVG keeps caller sizing, theme color, classes and decorative accessibility', async () => {
  const html = await renderToString(h(Cross1Icon, { size: 20, class: 'close-icon' }))
  assert.match(html, /width="20"/)
  assert.match(html, /stroke="currentColor"/)
  assert.match(html, /aria-hidden="true"/)
  assert.match(html, /class="site-icon close-icon"/)
  const filled = await renderToString(h(HeartFilledIcon))
  assert.match(filled, /fill="currentColor"/)
})

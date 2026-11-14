import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

test('successful activation stays successful if an old release cannot be removed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'blognuxt-deploy-'))
  const bin = join(root, 'bin')
  const releases = join(root, 'app', 'releases')
  await mkdir(bin)
  await mkdir(join(releases, 'new', '.output', 'server'), { recursive: true })
  await mkdir(join(releases, 'old'), { recursive: true })
  await writeFile(join(releases, 'new', '.output', 'server', 'index.mjs'), '')
  for (const [name, body] of Object.entries({
    sudo: 'exit 0',
    curl: 'exit 0',
    find: 'printf "200 %s/releases/new\\n100 %s/releases/old\\n" "$TEST_APP_ROOT" "$TEST_APP_ROOT"',
    rm: 'echo "simulated permission denied" >&2; exit 1'
  })) await writeFile(join(bin, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 })
  try {
    const result = spawnSync('/bin/bash', [fileURLToPath(new URL('../deploy/aliyun/activate.sh', import.meta.url)), join(root, 'app'), 'new'], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TEST_APP_ROOT: join(root, 'app'), KEEP_RELEASES: '1' },
      encoding: 'utf8'
    })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /发布成功: new/)
    assert.match(result.stderr, /无法清理旧版本/)
    assert.equal(await readlink(join(root, 'app', 'current')), join(releases, 'new'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

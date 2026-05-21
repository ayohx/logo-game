import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

test('admin page exists with password login and analytics containers', () => {
  const html = read('admin.html')

  assert.ok(html.includes('admin-password'), 'admin password input missing')
  assert.ok(html.includes('btn-admin-login'), 'admin login button missing')
  assert.ok(html.includes('admin-stats'), 'admin stats container missing')
  assert.ok(html.includes('admin-player-stats'), 'player stats container missing')
  assert.ok(html.includes('admin-recent-plays'), 'recent plays container missing')
  assert.ok(html.includes('src/admin.js'), 'admin module missing')
})

test('admin client calls only the admin Edge Function and does not hard-code password', () => {
  const src = read('src/admin.js')

  assert.ok(src.includes('logo-game-admin'), 'admin Edge Function call missing')
  assert.ok(!src.includes('coachAOG'), 'admin password must not be hard-coded in frontend')
  assert.ok(!src.includes('service_role'), 'service role key must not be exposed in frontend')
})

test('admin styles include dashboard table and stats layouts', () => {
  const css = read('style.css')

  assert.ok(css.includes('.admin-shell'), 'admin shell styles missing')
  assert.ok(css.includes('.admin-stats'), 'admin stats styles missing')
  assert.ok(css.includes('.admin-table'), 'admin table styles missing')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

test('leaderboard client manages a stable player id separate from name', () => {
  const src = read('src/utils/leaderboard.js')

  assert.ok(src.includes('logoquiz_player_id'), 'stable player id storage missing')
  assert.ok(src.includes('getPlayerProfile'), 'profile helper missing')
  assert.ok(src.includes('savePlayerProfile'), 'profile save helper missing')
  assert.ok(src.includes('logo-game-profile'), 'profile Edge Function call missing')
})

test('start screen has profile name and avatar editing controls', () => {
  const html = read('index.html')

  assert.ok(html.includes('profile-avatar'), 'avatar input missing')
  assert.ok(html.includes('avatar-type'), 'avatar type selector missing')
  assert.ok(html.includes('btn-save-profile'), 'save profile button missing')
})

test('results screen has a share button', () => {
  const html = read('index.html')

  assert.ok(html.includes('btn-share-result'), 'share result button missing')
  assert.ok(html.includes('share-status'), 'share status text missing')
})

test('main renders leaderboard avatars and handles shared player links', () => {
  const src = read('src/main.js')

  assert.ok(src.includes('leaderboard-avatar'), 'leaderboard avatar rendering missing')
  assert.ok(src.includes('URLSearchParams'), 'shared result link query handling missing')
  assert.ok(src.includes('copyShareMessage'), 'share copy handler missing')
})

test('leaderboard client builds a share message with a personal result link', () => {
  const src = read('src/utils/leaderboard.js')

  assert.ok(src.includes('buildShareMessage'), 'share message helper missing')
  assert.ok(src.includes('?player='), 'personal result link missing')
  assert.ok(!src.includes('service_role'), 'service role key must not be exposed')
})

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
  assert.ok(src.includes('PLAYER_ID_PATTERN'), 'player id validation missing')
  assert.ok(src.includes('getPlayerProfile'), 'profile helper missing')
  assert.ok(src.includes('savePlayerProfile'), 'profile save helper missing')
  assert.ok(src.includes('logo-game-profile'), 'profile Edge Function call missing')
})

test('leaderboard client upgrades legacy name-only start calls', () => {
  const src = read('src/utils/leaderboard.js')

  assert.ok(src.includes('typeof input === \'string\''), 'legacy name-only profile input is not handled')
  assert.ok(src.includes('normaliseProfileInput'), 'profile input normalisation missing')
  assert.ok(src.includes('localStorage.removeItem(PLAYER_ID_KEY)'), 'invalid stored player id is not repaired')
})

test('start screen has profile name and avatar editing controls', () => {
  const html = read('index.html')

  assert.ok(html.includes('profile-avatar'), 'avatar input missing')
  assert.ok(html.includes('avatar-type'), 'avatar type selector missing')
  assert.ok(html.includes('btn-save-profile'), 'save profile button missing')
  assert.ok(html.includes('maxlength="10"'), 'profile name should be capped at 10 characters')
  assert.ok(html.includes('readonly'), 'avatar preview should be generated from the name and selected emoji')
  assert.ok(html.includes('avatar-presets'), 'visible avatar preset choices missing')
  assert.ok(html.includes('data-avatar-type="emoji"'), 'emoji preset choices missing')
})

test('main keeps avatar preview synced to initials and selected emoji', () => {
  const src = read('src/main.js')

  assert.ok(src.includes('initialsForName'), 'initials helper missing')
  assert.ok(src.includes('updateAvatarPreview'), 'avatar preview update helper missing')
  assert.ok(src.includes('selectedEmoji'), 'selected emoji state missing')
})

test('start screen has an obvious start game button', () => {
  const html = read('index.html')
  const src = read('src/main.js')

  assert.ok(html.includes('btn-start-game'), 'start game button missing')
  assert.ok(html.includes('selected-pack'), 'selected pack helper text missing')
  assert.ok(src.includes('startSelectedGame'), 'start game handler missing')
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
  assert.ok(src.includes('That profile name is already taken'), 'duplicate name error copy missing')
  assert.ok(!src.includes('service_role'), 'service role key must not be exposed')
})

test('index cache-busts the module entry point after profile API changes', () => {
  const html = read('index.html')

  assert.match(html, /src\/main\.js\?v=/, 'module entry point should include a cache-busting version')
})

test('start screen uses mobile-safe responsive layout rules', () => {
  const css = read('style.css')

  assert.ok(css.includes('#screen-start'), 'start screen rules missing')
  assert.ok(css.includes('is-saved-feedback'), 'save success feedback style missing')
  assert.ok(css.includes('justify-content: flex-start'), 'start screen should not vertically centre overflowing mobile content')
  assert.ok(css.includes('@media (max-height: 760px)'), 'small-height mobile layout rules missing')
  assert.ok(css.includes('.parade-item:nth-child(n + 7)'), 'extra mobile parade logos should be hidden on short screens')
  assert.match(css, /#screen-game\s*\{[^}]*overflow:\s*hidden/s, 'gameplay screen must remain non-scrollable')
  assert.match(css, /\.question-stage\s*\{[^}]*overflow:\s*hidden/s, 'question stage should fit without scrolling')
})

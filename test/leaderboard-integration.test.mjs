import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

test('start screen requires a player name before shared play', () => {
  const html = read('index.html')

  assert.ok(html.includes('player-name'), 'player name input missing')
  assert.ok(html.includes('name-help'), 'player name help text missing')
})

test('app has a central leaderboard screen', () => {
  const html = read('index.html')

  assert.ok(html.includes('screen-leaderboard'), 'leaderboard screen missing')
  assert.ok(html.includes('leaderboard-list'), 'leaderboard list missing')
})

test('leaderboard client calls only Supabase Edge Functions', () => {
  const src = read('src/utils/leaderboard.js')

  assert.ok(src.includes('logo-game-start'), 'start function call missing')
  assert.ok(src.includes('logo-game-submit'), 'submit function call missing')
  assert.ok(src.includes('logo-game-leaderboard'), 'leaderboard function call missing')
  assert.ok(!src.includes('service_role'), 'service role key must never be exposed in frontend')
})

test('engine starts from server-issued questions and submits answer log', () => {
  const src = read('src/game/engine.js')

  assert.ok(src.includes('startLeaderboardGame'), 'server start call missing')
  assert.ok(src.includes('submitLeaderboardScore'), 'server submit call missing')
  assert.ok(src.includes('choiceDomain'), 'submit answer log should include chosen option domain')
  assert.ok(src.includes('choiceName'), 'submit answer log should include chosen option name for admin analytics')
  assert.ok(src.includes('correctDomain'), 'submit answer log should include correct domain for admin analytics')
  assert.ok(src.includes('pointsEarned'), 'submit answer log should include points earned per question')
})

test('main wires player-name start and leaderboard navigation', () => {
  const src = read('src/main.js')

  assert.ok(src.includes('player-name'), 'main should read player name')
  assert.ok(src.includes('renderLeaderboard'), 'main should render central leaderboard')
})

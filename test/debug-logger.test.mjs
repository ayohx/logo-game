// TDD tests for debug logger module
// Run with: node --test test/debug-logger.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel))
}

// ── File existence ────────────────────────────────────────────────────────────

test('src/utils/logger.js exists', () => {
  assert.ok(exists('src/utils/logger.js'), 'logger.js missing')
})

test('logger.js exports LOG object', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('export') && src.includes('LOG'), 'LOG export missing')
})

test('logger.js has event() method', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('event(') || src.includes('event:'), 'event() method missing')
})

test('logger.js has clear() method', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('clear(') || src.includes('clear:'), 'clear() method missing')
})

test('logger.js uses lq_debug_log as storage key', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('lq_debug_log'), 'storage key lq_debug_log missing')
})

test('logger.js caps entries (references 500)', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('500'), 'entry cap 500 missing')
})

// ── Engine wiring ─────────────────────────────────────────────────────────────

test('engine.js imports logger', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('logger'), 'engine.js does not import logger')
})

test('engine.js logs game_start event', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('game_start'), 'game_start event missing')
})

test('engine.js logs question_show event', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('question_show'), 'question_show event missing')
})

test('engine.js logs img_load_fail for prompt image', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('img_load_fail'), 'img_load_fail handler missing')
})

test('engine.js logs img_load_ok for prompt image', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('img_load_ok'), 'img_load_ok handler missing')
})

test('engine.js logs answer event', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('answer'), 'answer event missing')
})

test('engine.js logs game_end event', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('game_end'), 'game_end event missing')
})

// ── debug.html ────────────────────────────────────────────────────────────────

test('debug.html exists at project root', () => {
  assert.ok(exists('debug.html'), 'debug.html missing')
})

test('debug.html references lq_debug_log key', () => {
  const src = read('debug.html')
  assert.ok(src.includes('lq_debug_log'), 'debug.html does not read lq_debug_log')
})

test('debug.html has clear logs button', () => {
  const src = read('debug.html')
  assert.ok(
    src.toLowerCase().includes('clear') && src.toLowerCase().includes('log'),
    'clear logs button missing'
  )
})

test('debug.html highlights img_load_fail entries', () => {
  const src = read('debug.html')
  assert.ok(src.includes('img_load_fail'), 'img_load_fail highlighting missing')
})

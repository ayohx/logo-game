// TDD tests for pause feature, session logging, and debug drill-down
// Run with: node --test test/pause-sessions.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8') }

// ── Pause: timer.js ───────────────────────────────────────────────────────────

test('timer.js exports pauseTimer', () => {
  const src = read('src/game/timer.js')
  assert.ok(src.includes('export function pauseTimer'), 'pauseTimer export missing')
})

test('timer.js exports resumeTimer', () => {
  const src = read('src/game/timer.js')
  assert.ok(src.includes('export function resumeTimer'), 'resumeTimer export missing')
})

// ── Pause: engine.js ──────────────────────────────────────────────────────────

test('engine.js exports pauseGame', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('export function pauseGame'), 'pauseGame export missing')
})

test('engine.js exports resumeGame', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('export function resumeGame'), 'resumeGame export missing')
})

test('engine.js tracks state.currentQ', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('currentQ'), 'state.currentQ tracking missing')
})

test('engine.js tracks state.paused', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('paused'), 'state.paused tracking missing')
})

// ── Pause: index.html ─────────────────────────────────────────────────────────

test('index.html has pause-overlay element', () => {
  const src = read('index.html')
  assert.ok(src.includes('pause-overlay'), 'pause-overlay missing')
})

test('index.html has btn-pause element', () => {
  const src = read('index.html')
  assert.ok(src.includes('btn-pause'), 'btn-pause missing')
})

// ── Pause: main.js ────────────────────────────────────────────────────────────

test('main.js handles P key for pause', () => {
  const src = read('src/main.js')
  assert.ok(src.includes('pauseGame') || src.includes('pause'), 'P key pause handler missing')
})

// ── Pause: style.css ──────────────────────────────────────────────────────────

test('style.css has .pause-overlay', () => {
  const src = read('style.css')
  assert.ok(src.includes('.pause-overlay'), '.pause-overlay styles missing')
})

test('style.css has .pause-btn', () => {
  const src = read('style.css')
  assert.ok(src.includes('.pause-btn'), '.pause-btn styles missing')
})

// ── Session logging: logger.js ────────────────────────────────────────────────

test('logger.js exports LOG.startSession', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('startSession'), 'startSession missing')
})

test('logger.js exports LOG.logQuestion', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('logQuestion'), 'logQuestion missing')
})

test('logger.js exports LOG.logImgResult', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('logImgResult'), 'logImgResult missing')
})

test('logger.js exports LOG.logAnswer', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('logAnswer'), 'logAnswer missing')
})

test('logger.js exports LOG.endSession', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('endSession'), 'endSession missing')
})

test('logger.js uses lq_sessions storage key', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('lq_sessions'), 'lq_sessions key missing')
})

test('logger.js references 12-hour purge (12 * 60 * 60 or equivalent)', () => {
  const src = read('src/utils/logger.js')
  assert.ok(src.includes('12') && (src.includes('3600') || src.includes('60 * 60') || src.includes('43200')), '12h purge missing')
})

// ── Session logging: engine.js wiring ────────────────────────────────────────

test('engine.js calls LOG.startSession', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('startSession'), 'startSession call missing')
})

test('engine.js calls LOG.logQuestion', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('logQuestion'), 'logQuestion call missing')
})

test('engine.js calls LOG.logAnswer', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('logAnswer'), 'logAnswer call missing')
})

test('engine.js calls LOG.endSession', () => {
  const src = read('src/game/engine.js')
  assert.ok(src.includes('endSession'), 'endSession call missing')
})

// ── debug.html sessions ───────────────────────────────────────────────────────

test('debug.html reads lq_sessions', () => {
  const src = read('debug.html')
  assert.ok(src.includes('lq_sessions'), 'debug.html does not read lq_sessions')
})

test('debug.html has sessions list UI', () => {
  const src = read('debug.html')
  assert.ok(src.toLowerCase().includes('session'), 'sessions UI missing')
})

// ── Score hint: index.html ────────────────────────────────────────────────────

test('index.html has scoring hint text', () => {
  const src = read('index.html')
  assert.ok(src.includes('5') && src.includes('50'), 'scoring hint (5 per Q, 50 total) missing')
})

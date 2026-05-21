import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

test('HUD audio and pause controls have accessible labels', () => {
  const html = read('index.html')

  assert.ok(html.includes('aria-label="Pause game"'), 'pause button aria-label missing')
  assert.ok(html.includes('aria-label="Volume level"'), 'volume slider aria-label missing')
  assert.ok(html.includes('aria-hidden="true"'), 'decorative mic meter should be hidden from screen readers')
})

test('audio preferences use safe localStorage helpers', () => {
  const src = read('src/utils/audio.js')

  assert.ok(src.includes('readStorage'), 'audio should read storage through a safe helper')
  assert.ok(src.includes('writeStorage'), 'audio should write storage through a safe helper')
})

test('question options move keyboard focus to the first answer', () => {
  const src = read('src/game/engine.js')

  assert.ok(src.includes('focusFirstOption'), 'first-option focus helper missing')
  assert.ok(src.includes('.focus('), 'first option is not focused')
})

test('speech module marks unsupported voice input for the UI', () => {
  const src = read('src/utils/speech.js')

  assert.ok(src.includes('speech-unsupported'), 'unsupported speech UI marker missing')
  assert.ok(src.includes('setSpeechAvailability'), 'speech availability helper missing')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { getBestStreak } from '../src/ui/history.js'

const ROOT = path.resolve(import.meta.dirname, '..')

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

test('getBestStreak returns the longest run of correct answers', () => {
  const answers = [
    { correct: true },
    { correct: true },
    { correct: false },
    { correct: true },
    { correct: true },
    { correct: true },
  ]

  assert.strictEqual(getBestStreak(answers), 3)
})

test('engine stores the selected answer for result review', () => {
  const src = read('src/game/engine.js')

  assert.ok(src.includes('chosen:'), 'answer review should store the chosen option')
})

test('results screen has a dedicated feedback message element', () => {
  const html = read('index.html')

  assert.ok(html.includes('result-message'), 'result-message element missing')
})

test('history results render accuracy and best streak stats', () => {
  const src = read('src/ui/history.js')

  assert.ok(src.includes('Accuracy'), 'accuracy stat missing')
  assert.ok(src.includes('Best streak'), 'best streak stat missing')
})

test('history breakdown shows what the player chose', () => {
  const src = read('src/ui/history.js')

  assert.ok(src.includes('br-answer'), 'chosen-answer breakdown missing')
})

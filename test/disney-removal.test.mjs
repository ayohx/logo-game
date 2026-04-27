// TDD tests for Disney category removal
// Run with: node --test test/disney-removal.test.mjs
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

test('index.html has no btn-disney element', () => {
  const html = read('index.html')
  assert.ok(!html.includes('btn-disney'), 'btn-disney should not exist in index.html')
})

test('index.html has no pack-disney class', () => {
  const html = read('index.html')
  assert.ok(!html.includes('pack-disney'), 'pack-disney class should not exist in index.html')
})

test('src/main.js has no btn-disney reference', () => {
  const src = read('src/main.js')
  assert.ok(!src.includes('btn-disney'), 'btn-disney should not exist in main.js')
})

test('src/data/disney.js does not exist', () => {
  assert.ok(!exists('src/data/disney.js'), 'src/data/disney.js should be deleted')
})

test('src/game/questions.js does not export generateDisneyQuestions', () => {
  const src = read('src/game/questions.js')
  assert.ok(!src.includes('generateDisneyQuestions'), 'generateDisneyQuestions should be removed from questions.js')
})

test('src/game/questions.js does not import from disney.js', () => {
  const src = read('src/game/questions.js')
  assert.ok(!src.includes('disney'), 'disney import should be removed from questions.js')
})

test('src/game/engine.js does not import DISNEY', () => {
  const src = read('src/game/engine.js')
  assert.ok(!src.includes("from '../data/disney.js'"), 'DISNEY import should be removed from engine.js')
})

test('src/game/engine.js state has no disneyPool key', () => {
  const src = read('src/game/engine.js')
  assert.ok(!src.includes('disneyPool'), 'disneyPool should be removed from engine.js')
})

test('src/game/engine.js startGame has no disney pack branch', () => {
  const src = read('src/game/engine.js')
  assert.ok(!src.includes("=== 'disney'"), "disney pack branch should be removed from engine.js")
})

test('src/ui/history.js does not import from disney.js', () => {
  const src = read('src/ui/history.js')
  assert.ok(!src.includes('disney'), 'disney import should be removed from history.js')
})

test('src/ui/shuffle.js does not import from disney.js', () => {
  const src = read('src/ui/shuffle.js')
  assert.ok(!src.includes("from '../data/disney.js'"), 'disney import should be removed from shuffle.js')
})

test('src/ui/shuffle.js runShuffle has no disneyPool parameter', () => {
  const src = read('src/ui/shuffle.js')
  assert.ok(!src.includes('disneyPool'), 'disneyPool parameter should be removed from shuffle.js')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

test('travel pack contains 100 verified Travel and Adventure logos', () => {
  const src = read('src/data/travel.js')
  const domains = [...src.matchAll(/domain: '([^']+)'/g)].map(match => match[1])

  assert.equal(domains.length, 100)
  assert.ok(domains.includes('holidayextras.com'), 'Holiday Extras must be included')
  assert.equal(new Set(domains).size, domains.length, 'travel domains must be unique')
})

test('question generation supports selected pack pools', () => {
  const src = read('src/game/questions.js')

  assert.ok(src.includes('TRAVEL_POOL'), 'travel pool import missing')
  assert.ok(src.includes('PACK_POOLS'), 'pack pool registry missing')
  assert.ok(src.includes('generateQuestions'), 'pack-aware question generator missing')
})

test('start screen exposes Travel and Adventure pack selection', () => {
  const html = read('index.html')
  const main = read('src/main.js')

  assert.ok(html.includes('btn-travel'), 'travel pack button missing')
  assert.ok(html.includes('Travel &amp; Adventure'), 'travel pack label missing')
  assert.ok(main.includes('selectedPack'), 'selected pack state missing')
  assert.ok(main.includes("selectPack('travel')"), 'travel pack handler missing')
})

test('shuffle animation avoids extra random logo.dev image cycling', () => {
  const src = read('src/ui/shuffle.js')

  assert.ok(!src.includes('cyclePool'), 'shuffle should not load extra random logo images')
  assert.ok(!src.includes('LOGO_POOL'), 'shuffle should not use unrelated global logo pool')
})

test('home parade samples only a small number of selected-pack logos', () => {
  const src = read('src/ui/history.js')

  assert.ok(src.includes('getPackPool(pack)'), 'parade should use selected pack pool')
  assert.ok(src.includes('slice(0, 6)'), 'parade should avoid loading too many logos')
})

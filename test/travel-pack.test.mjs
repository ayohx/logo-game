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

test('Tech and Car pack contains 100 unique candidate logos', () => {
  const src = read('src/data/tech-car.js')
  const domains = [...src.matchAll(/domain: '([^']+)'/g)].map(match => match[1])

  assert.equal(domains.length, 100)
  assert.ok(domains.includes('tesla.com'), 'Tesla should be included')
  assert.ok(domains.includes('openai.com'), 'OpenAI should be included')
  assert.equal(new Set(domains).size, domains.length, 'tech and car domains must be unique')
})

test('Fashion and Finance pack contains 100 unique candidate logos', () => {
  const src = read('src/data/fashion-finance.js')
  const domains = [...src.matchAll(/domain: '([^']+)'/g)].map(match => match[1])

  assert.equal(domains.length, 100)
  assert.ok(domains.includes('nike.com'), 'Nike should be included')
  assert.ok(domains.includes('visa.com'), 'Visa should be included')
  assert.equal(new Set(domains).size, domains.length, 'fashion and finance domains must be unique')
})

test('question generation supports selected pack pools', () => {
  const src = read('src/game/questions.js')

  assert.ok(src.includes('TRAVEL_POOL'), 'travel pool import missing')
  assert.ok(src.includes('TECH_CAR_POOL'), 'tech and car pool import missing')
  assert.ok(src.includes('FASHION_FINANCE_POOL'), 'fashion and finance pool import missing')
  assert.ok(src.includes('ALL_LOGO_POOL'), 'Mix Brands should use the full verified logo set')
  assert.ok(src.includes('PACK_POOLS'), 'pack pool registry missing')
  assert.ok(src.includes('generateQuestions'), 'pack-aware question generator missing')
})

test('Mix Brands combines General and Travel logo pools', () => {
  const src = read('src/game/questions.js')

  assert.match(src, /brands:\s*ALL_LOGO_POOL/, 'brands pack should use all verified logos')
  assert.ok(src.includes('dedupeByDomain'), 'combined pool should dedupe domains safely')
})

test('new category packs are registered for question generation', () => {
  const src = read('src/game/questions.js')

  assert.ok(src.includes("'tech-car': TECH_CAR_POOL"), 'Tech and Car pack registry missing')
  assert.ok(src.includes("'fashion-finance': FASHION_FINANCE_POOL"), 'Fashion and Finance pack registry missing')
})

test('start screen exposes all category pack selections', () => {
  const html = read('index.html')
  const main = read('src/main.js')

  assert.ok(html.includes('btn-travel'), 'travel pack button missing')
  assert.ok(html.includes('Travel &amp; Adventure'), 'travel pack label missing')
  assert.ok(html.includes('btn-tech-car'), 'Tech and Car pack button missing')
  assert.ok(html.includes('Tech &amp; Car'), 'Tech and Car pack label missing')
  assert.ok(html.includes('btn-fashion-finance'), 'Fashion and Finance pack button missing')
  assert.ok(html.includes('Fashion &amp; Finance'), 'Fashion and Finance pack label missing')
  assert.ok(main.includes('selectedPack'), 'selected pack state missing')
  assert.ok(main.includes('PACK_BUTTONS'), 'shared pack handlers missing')
})

test('start game is disabled until a category is selected', () => {
  const html = read('index.html')
  const main = read('src/main.js')
  const css = read('style.css')

  assert.match(html, /id="btn-start-game"[^>]*disabled/, 'Start Game should be disabled before category selection')
  assert.ok(!html.includes('pack-card is-selected'), 'no pack should be pre-selected now that categories are required')
  assert.ok(main.includes("let selectedPack = ''"), 'selected pack should start empty')
  assert.ok(main.includes('syncStartButtonState'), 'main should enable Start Game after pack selection')
  assert.ok(css.includes('.btn-primary:disabled'), 'disabled primary button should have a greyed-out visual state')
  assert.ok(css.includes('cursor: not-allowed'), 'disabled Start Game should clearly look unavailable')
})

test('gameplay HUD shows the selected category as a compact reminder', () => {
  const html = read('index.html')
  const screens = read('src/ui/screens.js')
  const engine = read('src/game/engine.js')
  const css = read('style.css')

  assert.ok(html.includes('id="hud-pack-label"'), 'gameplay category badge missing from HUD')
  assert.ok(screens.includes('PACK_LABELS'), 'screen helpers should map pack slugs to readable labels')
  assert.ok(screens.includes('hud-pack-label'), 'HUD update should write the category label')
  assert.ok(engine.includes('updateHUD(state.current, state.score, CONFIG.questionsPerGame, state.pack)'), 'game should pass selected pack into HUD')
  assert.ok(css.includes('.hud-pack'), 'category badge styles missing')
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

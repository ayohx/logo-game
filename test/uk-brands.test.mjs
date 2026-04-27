// TDD tests for UK brands addition and Mix Brands rename
// Run with: node --test test/uk-brands.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

// ── UI label ─────────────────────────────────────────────────────────────────

test('index.html pack button reads "Mix Brands"', () => {
  const html = read('index.html')
  assert.ok(html.includes('Mix Brands'), 'Button should read "Mix Brands"')
})

test('index.html pack description mentions UK', () => {
  const html = read('index.html')
  assert.ok(html.toLowerCase().includes('uk'), 'Description should mention UK')
})

// ── Key UK brand domains present ──────────────────────────────────────────────

test('brands.js contains barclays.com', () => {
  const src = read('src/data/brands.js')
  assert.ok(src.includes('barclays.com'), 'barclays.com missing')
})

test('brands.js contains bt.com', () => {
  const src = read('src/data/brands.js')
  assert.ok(src.includes('bt.com'), 'bt.com missing')
})

test('brands.js contains britishairways.com', () => {
  const src = read('src/data/brands.js')
  assert.ok(src.includes('britishairways.com'), 'britishairways.com missing')
})

test('brands.js contains bbc.co.uk', () => {
  const src = read('src/data/brands.js')
  assert.ok(src.includes('bbc.co.uk'), 'bbc.co.uk missing')
})

test('brands.js contains bp.com', () => {
  const src = read('src/data/brands.js')
  assert.ok(src.includes('bp.com'), 'bp.com missing')
})

test('brands.js contains jaguar.com', () => {
  const src = read('src/data/brands.js')
  assert.ok(src.includes('jaguar.com'), 'jaguar.com missing')
})

// ── Pool size ─────────────────────────────────────────────────────────────────

test('LOGO_POOL has at least 125 entries', () => {
  const src = read('src/data/brands.js')
  const domains = [...src.matchAll(/domain:\s*'([^']+)'/g)].map(m => m[1])
  assert.ok(domains.length >= 125, `Only ${domains.length} entries, need >= 125`)
})

// ── No duplicates ─────────────────────────────────────────────────────────────

test('LOGO_POOL has no duplicate domains', () => {
  const src = read('src/data/brands.js')
  const domains = [...src.matchAll(/domain:\s*'([^']+)'/g)].map(m => m[1])
  const unique = new Set(domains)
  assert.strictEqual(domains.length, unique.size,
    `Duplicate domains found: ${domains.filter((d, i) => domains.indexOf(d) !== i).join(', ')}`)
})

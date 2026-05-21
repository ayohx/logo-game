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

test('logo helper supports Supabase Storage and keeps logo.dev fallback', () => {
  const src = read('src/ui/screens.js')
  const config = read('src/config.js')

  assert.ok(src.includes('LOGO_STORAGE_BASE'), 'Supabase Storage base URL missing')
  assert.ok(src.includes('logo-game-logos'), 'logo storage bucket missing')
  assert.ok(src.includes('logoStorageUrl'), 'storage URL helper missing')
  assert.ok(src.includes('logoDevUrl'), 'logo.dev fallback helper missing')
  assert.ok(src.includes('logoFallbackUrl'), 'fallback export missing')
  assert.ok(config.includes('logoStorageEnabled'), 'storage switch should be explicit to protect UX before upload')
})

test('game image error handlers retry logo.dev after storage miss before showing text fallback', () => {
  const src = read('src/game/engine.js')

  assert.ok(src.includes('logoFallbackUrl'), 'engine should import logo fallback helper')
  assert.ok(src.includes('retryWithLogoDev'), 'engine should retry logo.dev once on storage failure')
})

test('history and parade image markup can fall back to logo.dev', () => {
  const src = read('src/ui/history.js')

  assert.ok(src.includes('logoFallbackUrl'), 'history should import logo fallback helper')
  assert.ok(src.includes('onerror='), 'static history/parade markup needs fallback error handlers')
})

test('logo asset sync script documents required environment and uploads verified assets', () => {
  assert.ok(exists('scripts/sync-logo-assets.mjs'), 'logo sync script missing')
  const src = read('scripts/sync-logo-assets.mjs')

  assert.ok(src.includes('SUPABASE_SERVICE_ROLE_KEY'), 'service role env requirement missing')
  assert.ok(src.includes('logo-game-logos'), 'storage bucket name missing')
  assert.ok(src.includes('src/data/brands.js'), 'General logo pool import missing')
  assert.ok(src.includes('src/data/travel.js'), 'Travel logo pool import missing')
  assert.ok(src.includes('logo_assets'), 'logo asset registry upsert missing')
  assert.ok(src.includes('--dry-run'), 'dry run mode missing')
})

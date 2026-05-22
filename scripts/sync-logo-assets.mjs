#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { LOGO_POOL } from '../src/data/brands.js'
import { TRAVEL_POOL } from '../src/data/travel.js'
import { CONFIG } from '../src/config.js'

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xbcwbzsgvmerkbnnplep.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BUCKET = process.env.LOGO_STORAGE_BUCKET || 'logo-game-logos'
const VERSION = process.env.LOGO_ASSET_VERSION || 'v1'
const REGISTRY_FUNCTION = `${SUPABASE_URL}/functions/v1/logo-game-logo-assets`
const REGISTRY_BATCH_SIZE = Number(process.env.LOGO_REGISTRY_BATCH_SIZE || 25)
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'logo-assets-manifest.json')
const DRY_RUN = process.argv.includes('--dry-run')
const LIMIT = Number(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || 0)

function logoDevUrl(domain) {
  return `https://img.logo.dev/${domain}?token=${CONFIG.token}&size=160&format=png`
}

function publicUrl(storagePath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

function buildRegistry() {
  const registry = new Map()
  function add(item, pack) {
    const current = registry.get(item.domain) || {
      domain: item.domain,
      name: item.name,
      packs: new Set(),
      categories: new Set(),
    }
    current.packs.add(pack)
    current.categories.add(item.cat || 'Other')
    registry.set(item.domain, current)
  }

  LOGO_POOL.forEach(item => add(item, 'brands'))
  TRAVEL_POOL.forEach(item => add(item, 'travel'))

  const rows = [...registry.values()].map(item => ({
    domain: item.domain,
    name: item.name,
    packs: [...item.packs].sort(),
    categories: [...item.categories].sort(),
    storagePath: `${VERSION}/${item.domain}.png`,
    publicUrl: publicUrl(`${VERSION}/${item.domain}.png`),
    sourceUrl: logoDevUrl(item.domain),
  }))

  return LIMIT ? rows.slice(0, LIMIT) : rows
}

async function fetchLogo(asset) {
  const response = await fetch(asset.sourceUrl)
  const contentType = response.headers.get('content-type') || ''
  const bytes = new Uint8Array(await response.arrayBuffer())
  const ok = response.ok && contentType.startsWith('image/') && bytes.length > 0
  const hash = createHash('sha256').update(bytes).digest('hex')

  return {
    ...asset,
    status: ok ? 'verified' : 'missing',
    contentType,
    byteSize: bytes.length,
    contentHash: hash,
    bytes,
  }
}

async function uploadLogo(asset) {
  if (!SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to upload logo assets.')
  }

  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${asset.storagePath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      'Content-Type': asset.contentType || 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'x-upsert': 'true',
    },
    body: asset.bytes,
  })

  if (!response.ok) {
    throw new Error(`Upload failed for ${asset.domain}: ${response.status} ${await response.text()}`)
  }
}

function registryPayload(asset) {
  return {
    domain: asset.domain,
    name: asset.name,
    packs: asset.packs,
    categories: asset.categories,
    storage_path: asset.storagePath,
    public_url: asset.publicUrl,
    source_url: asset.sourceUrl,
    status: asset.status,
    content_type: asset.contentType,
    content_hash: asset.contentHash,
    byte_size: asset.byteSize,
    verified_at: asset.status === 'verified' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }
}

async function upsertRegistryBatch(assets, attempt = 1) {
  if (!SERVICE_KEY) return
  const response = await fetch(REGISTRY_FUNCTION, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assets: assets.map(registryPayload) }),
  })

  if (!response.ok) {
    const body = await response.text()
    if (attempt < 4 && /connection slots|timeout|temporarily|overloaded/i.test(body)) {
      const delayMs = 750 * attempt
      console.log(`Registry batch retry ${attempt} after ${delayMs}ms: ${body}`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
      return upsertRegistryBatch(assets, attempt + 1)
    }
    throw new Error(`Registry batch upsert failed: ${response.status} ${body}`)
  }
}

async function main() {
  const assets = buildRegistry()
  const manifest = []
  const registryQueue = []

  console.log(`${DRY_RUN ? 'Dry running' : 'Syncing'} ${assets.length} logo assets to ${BUCKET}/${VERSION}`)
  for (const asset of assets) {
    const result = await fetchLogo(asset)
    const manifestRow = { ...result }
    delete manifestRow.bytes
    manifest.push(manifestRow)

    if (!DRY_RUN && result.status === 'verified') {
      await uploadLogo(result)
      registryQueue.push(result)
    } else if (!DRY_RUN) {
      registryQueue.push(result)
    }

    console.log(`${result.status.padEnd(8)} ${result.domain} ${result.byteSize} bytes`)
  }

  if (!DRY_RUN && registryQueue.length) {
    console.log(`Writing ${registryQueue.length} registry rows in batches of ${REGISTRY_BATCH_SIZE}`)
    for (let i = 0; i < registryQueue.length; i += REGISTRY_BATCH_SIZE) {
      const batch = registryQueue.slice(i, i + REGISTRY_BATCH_SIZE)
      await upsertRegistryBatch(batch)
      console.log(`registry ${Math.min(i + batch.length, registryQueue.length)}/${registryQueue.length}`)
    }
  }

  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    bucket: BUCKET,
    version: VERSION,
    total: manifest.length,
    verified: manifest.filter(item => item.status === 'verified').length,
    missing: manifest.filter(item => item.status !== 'verified').length,
    assets: manifest,
  }, null, 2)}\n`)

  console.log(`Manifest written to ${MANIFEST_PATH}`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

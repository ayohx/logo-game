// ── Question generation ───────────────────────────────────────────────────────
import { CONFIG }     from '../config.js'
import { LOGO_POOL }  from '../data/brands.js'
import { TRAVEL_POOL } from '../data/travel.js'
import { shuffle }    from '../utils/helpers.js'

function dedupeByDomain(items) {
  return [...new Map(items.map(item => [item.domain, item])).values()]
}

export const ALL_LOGO_POOL = dedupeByDomain([...LOGO_POOL, ...TRAVEL_POOL])

export const PACK_POOLS = {
  brands: ALL_LOGO_POOL,
  travel: TRAVEL_POOL,
}

export function getPackPool(pack = 'brands') {
  return PACK_POOLS[pack] || PACK_POOLS.brands
}

function categoryOf(item) {
  return item.cat || 'Other'
}

function pickBalancedCorrects(pool, count, shuffleFn) {
  const categories = shuffleFn([...new Set(pool.map(categoryOf))])
  const buckets = new Map(
    categories.map(cat => [cat, shuffleFn(pool.filter(item => categoryOf(item) === cat))])
  )

  const selected = []
  while (selected.length < count) {
    let progress = false
    for (const cat of categories) {
      const bucket = buckets.get(cat)
      if (bucket && bucket.length) {
        selected.push(bucket.shift())
        progress = true
        if (selected.length >= count) break
      }
    }
    if (!progress) break
  }

  if (selected.length < count) {
    const remaining = shuffleFn(pool.filter(item => !selected.includes(item)))
    selected.push(...remaining.slice(0, count - selected.length))
  }

  return selected
}

function pickDistractors(pool, correct, selectedCorrects, usedDistractors, shuffleFn) {
  const selectedDomains = new Set(selectedCorrects.map(item => item.domain))
  const candidates = shuffleFn(pool.filter(item => item.domain !== correct.domain))
  const distractors = []

  function addFrom(matches) {
    for (const item of candidates) {
      if (distractors.length >= 2) return
      if (!matches(item)) continue
      if (distractors.some(d => d.domain === item.domain)) continue
      distractors.push(item)
    }
  }

  addFrom(item => categoryOf(item) === categoryOf(correct) && !selectedDomains.has(item.domain) && !usedDistractors.has(item.domain))
  addFrom(item => categoryOf(item) === categoryOf(correct) && !selectedDomains.has(item.domain))
  addFrom(item => !selectedDomains.has(item.domain) && !usedDistractors.has(item.domain))
  addFrom(item => !selectedDomains.has(item.domain))
  addFrom(item => categoryOf(item) === categoryOf(correct))
  addFrom(() => true)

  distractors.forEach(item => usedDistractors.add(item.domain))
  return distractors.slice(0, 2)
}

function buildModeBag(count, shuffleFn) {
  const logoCount = Math.floor(count / 2)
  const nameCount = count - logoCount
  return shuffleFn([
    ...Array(logoCount).fill('logo-to-name'),
    ...Array(nameCount).fill('name-to-logo'),
  ])
}

export function buildBrandQuestions(pool, { count = CONFIG.questionsPerGame, shuffleFn = shuffle, pack = 'brands' } = {}) {
  const selected = pickBalancedCorrects(pool, count, shuffleFn)
  const modes    = buildModeBag(count, shuffleFn)
  const usedDistractors = new Set()

  return selected.map(correct => {
    const mode    = modes.pop() || 'logo-to-name'
    const others  = pickDistractors(pool, correct, selected, usedDistractors, shuffleFn)
    const options = shuffleFn([correct, ...others])
    return { pack, correct, mode, options, correctIndex: options.indexOf(correct) }
  })
}

export function generateQuestions(pack = 'brands') {
  const pool = shuffle([...getPackPool(pack)])
  return buildBrandQuestions(pool, { count: CONFIG.questionsPerGame, pack })
}

export function generateBrandQuestions() {
  return generateQuestions('brands')
}

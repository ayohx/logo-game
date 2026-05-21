// ── Question generation ───────────────────────────────────────────────────────
import { CONFIG }     from '../config.js'
import { LOGO_POOL }  from '../data/brands.js'
import { shuffle }    from '../utils/helpers.js'

function pickBalancedCorrects(pool, count) {
  const categories = shuffle([...new Set(pool.map(item => item.cat || 'Other'))])
  const buckets = new Map(
    categories.map(cat => [cat, shuffle(pool.filter(item => (item.cat || 'Other') === cat))])
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
    const remaining = shuffle(pool.filter(item => !selected.includes(item)))
    selected.push(...remaining.slice(0, count - selected.length))
  }

  return selected
}

function pickDistractors(pool, correct) {
  const sameCategory = shuffle(
    pool.filter(item => item.domain !== correct.domain && (item.cat || 'Other') === (correct.cat || 'Other'))
  )
  const fallback = shuffle(pool.filter(item => item.domain !== correct.domain))
  const distractors = []

  if (sameCategory.length) distractors.push(sameCategory[0])

  for (const item of fallback) {
    if (distractors.length >= 2) break
    if (item.domain !== correct.domain && !distractors.some(d => d.domain === item.domain)) {
      distractors.push(item)
    }
  }

  return distractors.slice(0, 2)
}

function buildModeBag(count) {
  const logoCount = Math.floor(count / 2)
  const nameCount = count - logoCount
  return shuffle([
    ...Array(logoCount).fill('logo-to-name'),
    ...Array(nameCount).fill('name-to-logo'),
  ])
}

export function generateBrandQuestions() {
  const pool     = shuffle([...LOGO_POOL])
  const selected = pickBalancedCorrects(pool, CONFIG.questionsPerGame)
  const modes    = buildModeBag(CONFIG.questionsPerGame)

  return selected.map(correct => {
    const mode    = modes.pop() || 'logo-to-name'
    const others  = pickDistractors(pool, correct)
    const options = shuffle([correct, ...others])
    return { pack: 'brands', correct, mode, options, correctIndex: options.indexOf(correct) }
  })
}

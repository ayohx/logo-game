// ── Question generation ───────────────────────────────────────────────────────
import { CONFIG }     from '../config.js'
import { LOGO_POOL }  from '../data/brands.js'
import { shuffle }    from '../utils/helpers.js'

export function generateBrandQuestions() {
  const pool     = shuffle([...LOGO_POOL])
  const selected = pool.slice(0, CONFIG.questionsPerGame)
  return selected.map(correct => {
    const mode    = Math.random() > 0.5 ? 'logo-to-name' : 'name-to-logo'
    const others  = shuffle(pool.filter(l => l.domain !== correct.domain)).slice(0, 2)
    const options = shuffle([correct, ...others])
    return { pack: 'brands', correct, mode, options, correctIndex: options.indexOf(correct) }
  })
}

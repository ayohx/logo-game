// ── Question generation ───────────────────────────────────────────────────────
import { CONFIG }     from '../config.js'
import { LOGO_POOL }  from '../data/brands.js'
import { DISNEY, FAMOUS_FILMS } from '../data/disney.js'
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

export function generateDisneyQuestions(pool) {
  // Build a film list from the fetched pool, supplemented by the curated FAMOUS_FILMS
  // so distractor films are always recognisable animated titles.
  const poolFilms = DISNEY.allFilms(pool)
  const filmSet   = [...new Set([...poolFilms, ...FAMOUS_FILMS])]

  const selected = shuffle([...pool]).slice(0, CONFIG.questionsPerGame)

  return selected.map(correct => {
    const hasFilms = correct.films && correct.films.length > 0
    const modePool = ['image-to-name', 'name-to-image']
    if (hasFilms && filmSet.length >= 3) modePool.push('image-to-film')
    const mode = modePool[Math.floor(Math.random() * modePool.length)]

    if (mode === 'image-to-film') {
      const correctFilm = correct.films[0]
      // Draw wrong films from the curated FAMOUS_FILMS list for recognisable distractors
      const wrongFilms = shuffle(
        FAMOUS_FILMS.filter(f => f !== correctFilm)
      ).slice(0, 2)
      const opts = shuffle([correctFilm, ...wrongFilms])
      return {
        pack: 'disney',
        correct,
        mode,
        options:      opts,
        correctIndex: opts.indexOf(correctFilm),
      }
    }

    const others  = shuffle(pool.filter(c => c._id !== correct._id)).slice(0, 2)
    const options = shuffle([correct, ...others])
    return {
      pack: 'disney',
      correct,
      mode,
      options,
      correctIndex: options.indexOf(correct),
    }
  })
}

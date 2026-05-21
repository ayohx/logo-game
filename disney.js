// Disney character pool — fetches from disneyapi.dev, caches in sessionStorage
const DISNEY = (() => {
  const SESSION_KEY = 'logoquiz_disney_pool_v3'  // bump to bust cached unfiltered pools

  async function loadPool(onProgress) {
    // Return cached pool if available this session
    try {
      const cached = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')
      if (cached && Array.isArray(cached) && cached.length >= 30) return cached
    } catch {}

    // Fetch 6 pages in parallel (300 characters) — first pages = most recognisable
    const PAGES = [1, 2, 3, 4, 5, 6]
    let done = 0

    const results = await Promise.all(PAGES.map(async p => {
      try {
        const r = await fetch(`https://api.disneyapi.dev/character?pageSize=50&page=${p}`)
        const d = await r.json()
        done++
        if (onProgress) onProgress(Math.round((done / PAGES.length) * 100))
        return d.data || []
      } catch {
        done++
        if (onProgress) onProgress(Math.round((done / PAGES.length) * 100))
        return []
      }
    }))

    const all = results.flat()

    // Live-action / non-animated franchise markers.
    // Checked against a character's films + tvShows titles only (not videoGames,
    // which often cross franchises and cause false positives).
    const LIVE_ACTION = [
      // Marvel Cinematic Universe films
      'avengers', 'iron man', 'thor', 'captain america', 'black widow',
      'black panther', 'spider-man', 'spider man', 'doctor strange',
      'ant-man', 'ant man', 'guardians of the galaxy', 'eternals',
      'shang-chi', 'deadpool', 'wolverine', 'x-men', 'fantastic four',
      // Marvel Disney+ series
      'hawkeye', 'wandavision', 'moon knight', 'the falcon',
      'winter soldier', 'she-hulk', 'ms. marvel', 'secret invasion',
      'loki', 'echo', 'agatha all along', 'ironheart',
      // Marvel legacy TV
      'agents of s.h.i.e.l.d', 'agent carter', 'daredevil', 'jessica jones',
      'luke cage', 'iron fist', 'the punisher', 'runaways', 'cloak',
      // Star Wars — films
      'star wars', 'rogue one', 'solo: a star wars',
      // Star Wars — Disney+ series
      'the mandalorian', 'andor', 'obi-wan kenobi', 'book of boba fett',
      'the bad batch', 'ahsoka', 'skeleton crew', 'acolyte',
      // Star Wars — animated (keep Clone Wars animated but block live-action Star Wars universe)
      // Note: we keep 'star wars rebels' and 'star wars: the clone wars' animated shows
      // only by excluding the broader 'star wars' franchise-level entries that hit live-action chars
      // Pirates / adventure live-action
      'pirates of the caribbean',
      'national treasure',
      'indiana jones',
      // Other live-action franchises
      'tron: legacy',
      'cruella',
      'maleficent',        // live-action remake; animated Maleficent has "Sleeping Beauty" as primary film
    ]

    function isAnimated(c) {
      // Must have at least one film OR tvShow credit — filters out video-game-only / obscure chars
      const films   = c.films   || []
      const shows   = c.tvShows || []
      if (films.length === 0 && shows.length === 0) return false

      const titles = [...films, ...shows].join(' ').toLowerCase()
      return !LIVE_ACTION.some(kw => titles.includes(kw))
    }

    // Keep characters that have a usable image, a short recognisable name,
    // and come from animated properties (not Marvel/Star Wars/live-action)
    const filtered = all.filter(c =>
      c.imageUrl &&
      c.name &&
      c.name.length <= 30 &&          // tighter — cuts obscure minor characters
      !c.imageUrl.includes('Question_mark') &&
      !c.imageUrl.includes('question_mark') &&
      !c.imageUrl.includes('No_image') &&
      !c.imageUrl.includes('placeholder') &&
      isAnimated(c)
    )

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(filtered))
    return filtered
  }

  // Wikia CDN supports scale-to-width-down via the URL path.
  // Transforms any Wikia image URL to request a specific width.
  function imgUrl(url, width = 320) {
    if (!url || !url.includes('wikia.nocookie.net')) return url
    // Remove any existing scale param first (avoid doubling)
    url = url.replace(/\/scale-to-width-down\/\d+/, '')
    if (url.includes('/revision/latest')) {
      return url.replace('/revision/latest', `/revision/latest/scale-to-width-down/${width}`)
    }
    // No revision segment — append one
    const [base, query] = url.split('?')
    return `${base}/revision/latest/scale-to-width-down/${width}${query ? '?' + query : ''}`
  }

  // Collect all unique film names from a pool of characters
  function allFilms(pool) {
    return [...new Set(pool.flatMap(c => c.films || []).filter(Boolean))]
  }

  return { loadPool, allFilms, imgUrl }
})()

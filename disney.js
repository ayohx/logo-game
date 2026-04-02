// Disney character pool — fetches from disneyapi.dev, caches in sessionStorage
const DISNEY = (() => {
  const SESSION_KEY = 'logoquiz_disney_pool'

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

    // Non-animated franchise keywords — exclude Marvel, Star Wars, live-action
    const LIVE_ACTION = [
      'avengers', 'iron man', 'thor', 'captain america', 'black widow',
      'black panther', 'spider-man', 'spider man', 'doctor strange',
      'ant-man', 'ant man', 'guardians of the galaxy', 'eternals',
      'shang-chi', 'hawkeye', 'wandavision', 'moon knight', 'the falcon',
      'winter soldier', 'she-hulk', 'ms. marvel', 'secret invasion',
      'star wars', 'the mandalorian', 'andor', 'obi-wan', 'clone wars',
      'book of boba', 'rogue one', 'the bad batch', 'ahsoka',
      'pirates of the caribbean',
      'national treasure',
      'tron: legacy', 'tron: uprising',
      'indiana jones',
    ]

    function isAnimated(c) {
      const titles = [
        ...(c.films || []),
        ...(c.tvShows || []),
        ...(c.videoGames || []),
        ...(c.shortFilms || []),
      ].join(' ').toLowerCase()
      return !LIVE_ACTION.some(kw => titles.includes(kw))
    }

    // Keep characters that have a usable image, a short recognisable name,
    // and come from animated properties (not Marvel/Star Wars/live-action)
    const filtered = all.filter(c =>
      c.imageUrl &&
      c.name &&
      c.name.length <= 36 &&
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

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

    // Keep characters that have a usable image and a short recognisable name
    const filtered = all.filter(c =>
      c.imageUrl &&
      c.name &&
      c.name.length <= 36 &&
      !c.imageUrl.includes('Question_mark') &&
      !c.imageUrl.includes('question_mark') &&
      !c.imageUrl.includes('No_image') &&
      !c.imageUrl.includes('placeholder')
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

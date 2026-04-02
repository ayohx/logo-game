// ── Disney character pool — strict famous-cartoon allowlist ──────────────────
//
// Strategy: fetch from disneyapi.dev but ONLY keep characters whose exact name
// appears in FAMOUS_NAMES.  This completely eliminates live-action / obscure
// characters regardless of API ordering.  FAMOUS_FILMS supplies recognisable
// film names as wrong-answer distractors in "which film?" questions.

const SESSION_KEY = 'logoquiz_disney_pool_v5'  // bump to bust old caches

// ── Curated allowlist: ~100 iconic animated Disney / Pixar characters ─────────
const FAMOUS_NAMES = new Set([
  // ── Classic Mickey universe ──────────────────────────────────────────────
  'Mickey Mouse', 'Minnie Mouse', 'Donald Duck', 'Daisy Duck', 'Goofy', 'Pluto',
  'Chip', 'Dale', 'Pete',

  // ── Snow White (1937) ────────────────────────────────────────────────────
  'Snow White', 'Dopey', 'Grumpy', 'Happy', 'Sleepy', 'Bashful', 'Sneezy', 'Doc',
  'Evil Queen',

  // ── Pinocchio (1940) ─────────────────────────────────────────────────────
  'Pinocchio', 'Jiminy Cricket', 'Geppetto', 'Figaro',

  // ── Dumbo (1941) ─────────────────────────────────────────────────────────
  'Dumbo', 'Timothy Mouse',

  // ── Bambi (1942) ─────────────────────────────────────────────────────────
  'Bambi', 'Thumper', 'Flower',

  // ── Cinderella (1950) ────────────────────────────────────────────────────
  'Cinderella', 'Jaq', 'Gus', 'Fairy Godmother', 'Prince Charming',

  // ── Alice in Wonderland (1951) ───────────────────────────────────────────
  'Alice', 'Mad Hatter', 'Cheshire Cat', 'Queen of Hearts', 'White Rabbit',

  // ── Peter Pan (1953) ─────────────────────────────────────────────────────
  'Peter Pan', 'Tinker Bell', 'Captain Hook', 'Wendy Darling', 'Smee',

  // ── Sleeping Beauty (1959) ───────────────────────────────────────────────
  'Aurora', 'Maleficent', 'Prince Phillip', 'Flora', 'Fauna', 'Merryweather',

  // ── 101 Dalmatians (1961) ────────────────────────────────────────────────
  'Cruella De Vil', 'Pongo', 'Perdita', 'Rolly',

  // ── The Jungle Book (1967) ───────────────────────────────────────────────
  'Mowgli', 'Baloo', 'King Louie', 'Shere Khan', 'Bagheera', 'Kaa',

  // ── The Aristocats (1970) ────────────────────────────────────────────────
  'Duchess', 'Marie', 'Toulouse', 'Berlioz', 'Thomas O\'Malley',

  // ── Robin Hood (1973) ────────────────────────────────────────────────────
  'Robin Hood', 'Little John', 'Maid Marian',

  // ── The Little Mermaid (1989) ────────────────────────────────────────────
  'Ariel', 'Ursula', 'Sebastian', 'Flounder', 'Prince Eric', 'King Triton', 'Scuttle',

  // ── Beauty and the Beast (1991) ──────────────────────────────────────────
  'Belle', 'Beast', 'Gaston', 'Lumiere', 'Cogsworth', 'Mrs. Potts', 'Chip',

  // ── Aladdin (1992) ───────────────────────────────────────────────────────
  'Aladdin', 'Jasmine', 'Genie', 'Jafar', 'Iago', 'Abu',

  // ── The Lion King (1994) ─────────────────────────────────────────────────
  'Simba', 'Nala', 'Mufasa', 'Scar', 'Timon', 'Pumbaa', 'Rafiki', 'Zazu',

  // ── Pocahontas (1995) ────────────────────────────────────────────────────
  'Pocahontas', 'Meeko', 'Flit',

  // ── The Hunchback of Notre Dame (1996) ───────────────────────────────────
  'Quasimodo', 'Esmeralda', 'Frollo',

  // ── Hercules (1997) ──────────────────────────────────────────────────────
  'Hercules', 'Megara', 'Hades', 'Phil',

  // ── Mulan (1998) ─────────────────────────────────────────────────────────
  'Mulan', 'Mushu', 'Shan Yu', 'Li Shang',

  // ── Tarzan (1999) ────────────────────────────────────────────────────────
  'Tarzan', 'Jane Porter', 'Terk', 'Kerchak',

  // ── Winnie the Pooh ──────────────────────────────────────────────────────
  'Winnie the Pooh', 'Tigger', 'Eeyore', 'Piglet', 'Rabbit', 'Roo', 'Kanga', 'Owl',

  // ── The Emperor\'s New Groove (2000) ─────────────────────────────────────
  'Kuzco', 'Yzma', 'Kronk',

  // ── Lilo & Stitch (2002) ─────────────────────────────────────────────────
  'Stitch', 'Lilo',

  // ── Brother Bear (2003) ──────────────────────────────────────────────────
  'Kenai', 'Koda',

  // ── The Princess and the Frog (2009) ─────────────────────────────────────
  'Tiana', 'Prince Naveen', 'Dr. Facilier', 'Louis',

  // ── Tangled (2010) ───────────────────────────────────────────────────────
  'Rapunzel', 'Flynn Rider', 'Pascal', 'Maximus', 'Mother Gothel',

  // ── Brave (2012) ─────────────────────────────────────────────────────────
  'Merida',

  // ── Wreck-It Ralph (2012) ────────────────────────────────────────────────
  'Wreck-It Ralph', 'Vanellope von Schweetz',

  // ── Frozen (2013) ────────────────────────────────────────────────────────
  'Elsa', 'Anna', 'Olaf', 'Kristoff', 'Sven', 'Hans',

  // ── Big Hero 6 (2014) ────────────────────────────────────────────────────
  'Baymax', 'Hiro Hamada',

  // ── Zootopia (2016) ──────────────────────────────────────────────────────
  'Judy Hopps', 'Nick Wilde',

  // ── Moana (2016) ─────────────────────────────────────────────────────────
  'Moana', 'Maui', 'Tamatoa',

  // ── Encanto (2021) ───────────────────────────────────────────────────────
  'Mirabel Madrigal', 'Luisa Madrigal', 'Isabela Madrigal', 'Bruno Madrigal',

  // ── Raya and the Last Dragon (2021) ──────────────────────────────────────
  'Raya', 'Sisu',

  // ── Pixar: Toy Story ─────────────────────────────────────────────────────
  'Woody', 'Buzz Lightyear', 'Jessie', 'Rex', 'Hamm', 'Bullseye',

  // ── Pixar: Monsters, Inc. ────────────────────────────────────────────────
  'Sulley', 'Mike Wazowski', 'Boo', 'Randall Boggs',

  // ── Pixar: Finding Nemo / Dory ───────────────────────────────────────────
  'Nemo', 'Marlin', 'Dory', 'Crush', 'Pearl',

  // ── Pixar: The Incredibles ───────────────────────────────────────────────
  'Mr. Incredible', 'Elastigirl', 'Violet Parr', 'Dash Parr', 'Jack-Jack',

  // ── Pixar: Cars ──────────────────────────────────────────────────────────
  'Lightning McQueen', 'Mater',

  // ── Pixar: Up ────────────────────────────────────────────────────────────
  'Carl Fredricksen', 'Russell', 'Dug',

  // ── Pixar: WALL-E ────────────────────────────────────────────────────────
  'WALL-E', 'EVE',

  // ── Pixar: Inside Out ────────────────────────────────────────────────────
  'Joy', 'Sadness', 'Anger', 'Fear', 'Disgust', 'Bing Bong',

  // ── Pixar: Coco ──────────────────────────────────────────────────────────
  'Miguel Rivera', 'Héctor',
])

// ── Famous animated film titles — used as distractor options ─────────────────
export const FAMOUS_FILMS = [
  'Snow White and the Seven Dwarfs', 'Pinocchio', 'Fantasia', 'Dumbo', 'Bambi',
  'Cinderella', 'Alice in Wonderland', 'Peter Pan', 'Sleeping Beauty',
  '101 Dalmatians', 'The Sword in the Stone', 'The Jungle Book',
  'The Aristocats', 'Robin Hood', 'The Many Adventures of Winnie the Pooh',
  'The Rescuers', 'The Fox and the Hound', 'The Great Mouse Detective',
  'Oliver & Company', 'The Little Mermaid', 'Beauty and the Beast',
  'Aladdin', 'The Lion King', 'Pocahontas', 'The Hunchback of Notre Dame',
  'Hercules', 'Mulan', 'Tarzan', 'Fantasia 2000', 'Dinosaur',
  "The Emperor's New Groove", 'Atlantis: The Lost Empire', 'Lilo & Stitch',
  'Treasure Planet', 'Brother Bear', 'Home on the Range', 'Chicken Little',
  'Meet the Robinsons', 'Bolt', 'The Princess and the Frog', 'Tangled',
  'Winnie the Pooh', 'Brave', 'Wreck-It Ralph', 'Frozen', 'Big Hero 6',
  'Zootopia', 'Moana', 'Ralph Breaks the Internet', 'Frozen II', 'Raya and the Last Dragon',
  'Encanto', 'Strange World', 'Wish',
  // Pixar
  'Toy Story', 'Toy Story 2', 'Toy Story 3', 'Toy Story 4',
  "A Bug's Life", 'Monsters, Inc.', 'Finding Nemo', 'The Incredibles',
  'Cars', 'Ratatouille', 'WALL-E', 'Up', 'Monsters University',
  'Inside Out', 'The Good Dinosaur', 'Finding Dory', 'Coco',
  'Incredibles 2', 'Onward', 'Soul', 'Luca', 'Turning Red', 'Lightyear',
  'Elemental', 'Inside Out 2',
]

// ── Wikia CDN image scaling ───────────────────────────────────────────────────
function imgUrl(url, width = 320) {
  if (!url || !url.includes('wikia.nocookie.net')) return url
  url = url.replace(/\/scale-to-width-down\/\d+/, '')
  if (url.includes('/revision/latest')) {
    return url.replace('/revision/latest', `/revision/latest/scale-to-width-down/${width}`)
  }
  const [base, query] = url.split('?')
  return `${base}/revision/latest/scale-to-width-down/${width}${query ? '?' + query : ''}`
}

// ── Pool loader ───────────────────────────────────────────────────────────────
// Fetches multiple API pages, then filters to FAMOUS_NAMES only.
// Caches the result in sessionStorage so the loading spinner only shows once.
async function loadPool(onProgress) {
  // Return cached pool if available this session
  try {
    const cached = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')
    if (cached && Array.isArray(cached) && cached.length >= 10) return cached
  } catch { /* ignore */ }

  // Fetch pages 1–8 in parallel (400 characters) — covers most famous chars
  const PAGES = [1, 2, 3, 4, 5, 6, 7, 8]
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

  // Filter: must be in allowlist AND have a real image
  const filtered = all.filter(c =>
    c.name &&
    FAMOUS_NAMES.has(c.name) &&
    c.imageUrl &&
    !c.imageUrl.includes('Question_mark') &&
    !c.imageUrl.includes('question_mark') &&
    !c.imageUrl.includes('No_image') &&
    !c.imageUrl.includes('placeholder')
  )

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(filtered))
  return filtered
}

// ── Collect all unique film names from a pool ─────────────────────────────────
function allFilms(pool) {
  return [...new Set(pool.flatMap(c => c.films || []).filter(Boolean))]
}

export const DISNEY = { loadPool, allFilms, imgUrl, FAMOUS_FILMS }

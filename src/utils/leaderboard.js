// ── Central Supabase leaderboard API ──────────────────────────────────────────
const FUNCTION_BASE = 'https://xbcwbzsgvmerkbnnplep.supabase.co/functions/v1'
const PLAYER_ID_KEY = 'logoquiz_player_id'
const PROFILE_KEY = 'logoquiz_player_profile'
const PLAYER_ID_PATTERN = /^[a-z0-9_-]{8,64}$/

async function callFunction(name, options = {}) {
  const res = await fetch(`${FUNCTION_BASE}/${name}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data.error || 'Leaderboard request failed'
    if (/already taken|duplicate key|unique constraint/i.test(message)) {
      throw new Error('That profile name is already taken. Please add an initial or choose another name.')
    }
    throw new Error(message)
  }
  return data
}

export function normalisePlayerName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 10).trim()
}

function makePlayerId() {
  const existing = localStorage.getItem(PLAYER_ID_KEY)
  if (existing && PLAYER_ID_PATTERN.test(existing)) return existing

  if (existing) localStorage.removeItem(PLAYER_ID_KEY)

  const id = crypto.randomUUID
    ? crypto.randomUUID()
    : `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem(PLAYER_ID_KEY, id)
  return id
}

function initialsFor(name) {
  return normalisePlayerName(name).replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '??'
}

export function getPlayerProfile() {
  let stored = {}
  try {
    stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
  } catch {
    localStorage.removeItem(PROFILE_KEY)
  }
  const displayName = normalisePlayerName(stored.displayName || localStorage.getItem('logoquiz_player_name') || '')
  const avatarType = stored.avatarType === 'emoji' ? 'emoji' : 'initials'
  const avatarValue = String(stored.avatarValue || initialsFor(displayName)).trim().slice(0, 8) || '??'

  return {
    playerId: makePlayerId(),
    displayName,
    avatarType,
    avatarValue,
  }
}

function normaliseProfileInput(input) {
  if (typeof input === 'string') {
    return { ...getPlayerProfile(), displayName: input }
  }

  return { ...getPlayerProfile(), ...(input || {}) }
}

export function saveProfileLocally(profile) {
  const input = normaliseProfileInput(profile)
  const displayName = normalisePlayerName(input.displayName)
  const avatarType = input.avatarType === 'emoji' ? 'emoji' : 'initials'
  const avatarValue = String(input.avatarValue || initialsFor(displayName)).trim().slice(0, 8) || initialsFor(displayName)
  const playerId = PLAYER_ID_PATTERN.test(input.playerId || '') ? input.playerId : makePlayerId()
  const saved = { playerId, displayName, avatarType, avatarValue }
  localStorage.setItem(PLAYER_ID_KEY, playerId)
  localStorage.setItem('logoquiz_player_name', displayName)
  localStorage.setItem(PROFILE_KEY, JSON.stringify(saved))
  return saved
}

export async function savePlayerProfile(profile) {
  const saved = saveProfileLocally(profile)
  if (saved.displayName.length < 2) throw new Error('Enter your profile name before saving.')

  return callFunction('logo-game-profile', {
    method: 'POST',
    body: JSON.stringify(saved),
  })
}

export async function startLeaderboardGame(profile, pack = 'brands') {
  const saved = saveProfileLocally(profile)
  const cleanName = normalisePlayerName(saved.displayName)
  if (cleanName.length < 2) throw new Error('Enter your name before you play.')

  return callFunction('logo-game-start', {
    method: 'POST',
    body: JSON.stringify({ ...saved, pack }),
  })
}

export async function submitLeaderboardScore(sessionId, answers) {
  return callFunction('logo-game-submit', {
    method: 'POST',
    body: JSON.stringify({ sessionId, answers }),
  })
}

export async function fetchLeaderboard(playerId = '') {
  const query = playerId ? `?player=${encodeURIComponent(playerId)}` : ''
  return callFunction(`logo-game-leaderboard${query}`, { method: 'GET' })
}

export function buildShareMessage(result, profile = getPlayerProfile()) {
  const score = result?.score ?? result?.retainedBest ?? 0
  const best = result?.retainedBest ?? score
  const rank = result?.rank ? ` Rank #${result.rank}.` : ''
  const link = `https://ayohx.github.io/logo-game/?player=${encodeURIComponent(profile.playerId)}`

  return `${profile.displayName} scored ${score}/50 on Logo Quiz. Best score: ${best}/50.${rank} Play and check the leaderboard: ${link}`
}

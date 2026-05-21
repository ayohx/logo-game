// ── Central Supabase leaderboard API ──────────────────────────────────────────
const FUNCTION_BASE = 'https://xbcwbzsgvmerkbnnplep.supabase.co/functions/v1'

async function callFunction(name, options = {}) {
  const res = await fetch(`${FUNCTION_BASE}/${name}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Leaderboard request failed')
  return data
}

export function normalisePlayerName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 24)
}

export async function startLeaderboardGame(playerName) {
  const cleanName = normalisePlayerName(playerName)
  if (cleanName.length < 2) throw new Error('Enter your name before you play.')

  return callFunction('logo-game-start', {
    method: 'POST',
    body: JSON.stringify({ playerName: cleanName }),
  })
}

export async function submitLeaderboardScore(sessionId, answers) {
  return callFunction('logo-game-submit', {
    method: 'POST',
    body: JSON.stringify({ sessionId, answers }),
  })
}

export async function fetchLeaderboard() {
  return callFunction('logo-game-leaderboard', { method: 'GET' })
}

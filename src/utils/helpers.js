// ── Shared utilities ──────────────────────────────────────────────────────────

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getRank(score) {
  if (score >= 45) return { emoji: '🏆', label: 'Brand Genius',  color: '#ffd700' }
  if (score >= 35) return { emoji: '🥇', label: 'Logo Pro',      color: '#c0c0c0' }
  if (score >= 20) return { emoji: '🥈', label: 'Getting There', color: '#cd7f32' }
  return                  { emoji: '🥉', label: 'Logo Newbie',   color: '#888'    }
}

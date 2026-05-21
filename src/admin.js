const FUNCTION_BASE = 'https://xbcwbzsgvmerkbnnplep.supabase.co/functions/v1'

const passwordInput = document.getElementById('admin-password')
const loginButton = document.getElementById('btn-admin-login')
const refreshButton = document.getElementById('btn-admin-refresh')
const errorEl = document.getElementById('admin-error')
let adminPassword = ''

async function fetchAdminAnalytics(password) {
  const response = await fetch(`${FUNCTION_BASE}/logo-game-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Could not load admin analytics.')
  return data
}

function formatDate(value) {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return mins ? `${mins}m ${secs}s` : `${secs}s`
}

function avatar(row) {
  return `<span class="leaderboard-avatar admin-avatar">${row.avatar_value || row.avatarValue || '?'}</span>`
}

function renderStats(totals) {
  const items = [
    ['Games started', totals.games_started],
    ['Completed games', totals.games_completed],
    ['Profiles', totals.profiles],
    ['Unique devices', totals.unique_devices],
    ['Avg. duration', formatDuration(totals.avg_duration_seconds)],
  ]
  document.getElementById('admin-stats').innerHTML = items.map(([label, value]) => `
    <div class="admin-stat">
      <strong>${value ?? 0}</strong>
      <span>${label}</span>
    </div>
  `).join('')
}

function renderTable(targetId, headers, rows, emptyText) {
  const target = document.getElementById(targetId)
  if (!rows.length) {
    target.innerHTML = `<p class="admin-muted">${emptyText}</p>`
    return
  }
  target.innerHTML = `
    <table class="admin-table">
      <thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  `
}

function renderDashboard(data) {
  document.getElementById('admin-login').classList.add('hidden')
  document.getElementById('admin-dashboard').classList.remove('hidden')
  document.getElementById('admin-generated').textContent = `Updated ${formatDate(data.generatedAt)}`
  renderStats(data.totals || {})

  renderTable('admin-player-stats', ['Player', 'Games', 'Best', 'Avg', 'Total time', 'Last played'], (data.playerStats || []).map(row => `
    <tr>
      <td>${avatar(row)} ${row.player_name}</td>
      <td>${row.games_played}</td>
      <td>${row.best_score}</td>
      <td>${row.avg_score}</td>
      <td>${formatDuration(row.total_duration_seconds)}</td>
      <td>${formatDate(row.last_played_at)}</td>
    </tr>
  `), 'No completed plays yet.')

  renderTable('admin-recent-plays', ['Player', 'Score', 'Correct', 'Time', 'When'], (data.recentPlays || []).map(row => `
    <tr>
      <td>${avatar(row)} ${row.player_name}</td>
      <td>${row.score}</td>
      <td>${row.correct_count}/10</td>
      <td>${formatDuration(row.duration_seconds)}</td>
      <td>${formatDate(row.submitted_at)}</td>
    </tr>
  `), 'No recent plays yet.')

  renderTable('admin-leaderboard', ['Player', 'Best', 'Correct', 'Streak', 'Games', 'Last played'], (data.leaderboard || []).map(row => `
    <tr>
      <td>${avatar(row)} ${row.player_name}</td>
      <td>${row.best_score}</td>
      <td>${row.best_correct}/10</td>
      <td>${row.best_streak}</td>
      <td>${row.games_played}</td>
      <td>${formatDate(row.last_played_at || row.best_submitted_at)}</td>
    </tr>
  `), 'No leaderboard rows yet.')
}

async function loadAdmin() {
  errorEl.textContent = ''
  adminPassword = passwordInput.value
  try {
    const data = await fetchAdminAnalytics(adminPassword)
    renderDashboard(data)
  } catch (error) {
    errorEl.textContent = error instanceof Error ? error.message : 'Could not load admin analytics.'
  }
}

loginButton.addEventListener('click', loadAdmin)
passwordInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') loadAdmin()
})
refreshButton.addEventListener('click', async () => {
  if (!adminPassword) return
  renderDashboard(await fetchAdminAnalytics(adminPassword))
})

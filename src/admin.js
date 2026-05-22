const FUNCTION_BASE = 'https://xbcwbzsgvmerkbnnplep.supabase.co/functions/v1'

const passwordInput = document.getElementById('admin-password')
const loginButton = document.getElementById('btn-admin-login')
const refreshButton = document.getElementById('btn-admin-refresh')
const errorEl = document.getElementById('admin-error')
let adminPassword = ''
let activeTab = 'overview'
let sortBy = 'submitted_at'
let sortDir = 'desc'
let pageSize = 20
let page = 0
let latestData = null

const tabConfig = {
  overview: {
    title: 'Overview',
    summary: 'A quick view of play volume, completion, score quality, and speed.',
    sortBy: 'submitted_at',
    columns: [
      ['metric', 'Metric'],
      ['value', 'Value'],
    ],
  },
  recentPlays: {
    title: 'Recent Plays',
    summary: 'Latest completed games, including pack, score, speed, and duration.',
    sortBy: 'submitted_at',
    columns: [
      ['player_name', 'Player'],
      ['pack', 'Pack'],
      ['score', 'Score'],
      ['correct_count', 'Correct'],
      ['avg_time', 'Avg. answer'],
      ['duration_seconds', 'Duration'],
      ['submitted_at', 'When'],
    ],
  },
  playerStats: {
    title: 'Players & Devices',
    summary: 'Grouped by stable device/player ID, including each player\'s strongest category.',
    sortBy: 'last_played_at',
    columns: [
      ['player_name', 'Player'],
      ['games_played', 'Games'],
      ['best_score', 'Best'],
      ['avg_score', 'Avg. score'],
      ['strongest_category', 'Strongest category'],
      ['avg_answer_time', 'Avg. answer'],
      ['total_duration_seconds', 'Total time'],
      ['last_played_at', 'Last played'],
    ],
  },
  leaderboard: {
    title: 'Leaderboard',
    summary: 'Retained best score per player, matching the public leaderboard.',
    sortBy: 'best_score',
    columns: [
      ['player_name', 'Player'],
      ['best_score', 'Best'],
      ['best_correct', 'Correct'],
      ['best_streak', 'Streak'],
      ['strongest_category', 'Strongest category'],
      ['games_played', 'Games'],
      ['last_played_at', 'Last played'],
    ],
  },
  categoryPerformance: {
    title: 'Category Performance',
    summary: 'Popularity and performance by category, separating most played from best scoring.',
    sortBy: 'games_completed',
    columns: [
      ['pack', 'Category'],
      ['games_started', 'Started'],
      ['games_completed', 'Completed'],
      ['completion_rate', 'Completion'],
      ['avg_score', 'Avg. score'],
      ['avg_correct', 'Avg. correct'],
      ['avg_answer_time', 'Avg. answer'],
      ['wrong_rate', 'Wrong rate'],
      ['timeout_rate', 'Timeout rate'],
    ],
  },
  questionInsights: {
    title: 'Question Insights',
    summary: 'Logo-level difficulty based on answer history, wrong rate, and average speed.',
    sortBy: 'wrong_rate',
    columns: [
      ['correct_name', 'Logo'],
      ['pack', 'Pack'],
      ['attempts', 'Attempts'],
      ['wrong_rate', 'Wrong rate'],
      ['timeout_rate', 'Timeout rate'],
      ['avg_time', 'Avg. answer'],
      ['common_wrong_choice', 'Common wrong choice'],
    ],
  },
  logoHealth: {
    title: 'Logo Health',
    summary: 'Supabase Storage coverage and verification status for each logo asset.',
    sortBy: 'status',
    columns: [
      ['name', 'Logo'],
      ['domain', 'Domain'],
      ['packs', 'Packs'],
      ['status', 'Status'],
      ['byte_size', 'Size'],
      ['verified_at', 'Verified'],
    ],
  },
}

async function fetchAdminAnalytics(password, overrides = {}) {
  const config = tabConfig[activeTab]
  const response = await fetch(`${FUNCTION_BASE}/logo-game-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password,
      tab: activeTab,
      limit: pageSize,
      offset: page * pageSize,
      sortBy,
      sortDir,
      pack: document.getElementById('admin-pack-filter')?.value || 'all',
      search: document.getElementById('admin-search')?.value || '',
      ...overrides,
      sortBy: overrides.sortBy || sortBy || config.sortBy,
    }),
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
  const total = Math.round(Math.max(0, Number(seconds) || 0))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return mins ? `${mins}m ${secs}s` : `${secs}s`
}

function formatAnswerTime(value = 0) {
  const time = Number(value) || 0
  return `${time.toFixed(1)}s`
}

function formatPercent(value = 0) {
  return `${Math.round(Number(value) || 0)}%`
}

function formatPack(value = '') {
  const labels = {
    brands: 'Mix Brands',
    travel: 'Travel & Adventure',
    'tech-car': 'Tech & Car',
    'fashion-finance': 'Fashion & Finance',
  }
  return labels[value] || value || 'Mix Brands'
}

function avatar(row) {
  return `<span class="leaderboard-avatar admin-avatar">${row.avatar_value || row.avatarValue || '?'}</span>`
}

function renderStats(totals) {
  const items = [
    ['Games started', totals.games_started],
    ['Completed games', totals.games_completed],
    ['Completion rate', formatPercent(totals.completion_rate)],
    ['Profiles', totals.profiles],
    ['Unique devices', totals.unique_devices],
    ['Average score', totals.avg_score ?? 0],
    ['Average correct', `${totals.avg_correct ?? 0}/10`],
    ['Avg. answer speed', formatAnswerTime(totals.avg_answer_time)],
    ['Avg. duration', formatDuration(totals.avg_duration_seconds)],
    ['Timeouts', totals.total_timeouts ?? 0],
  ]
  document.getElementById('admin-stats').innerHTML = items.map(([label, value]) => `
    <div class="admin-stat">
      <strong>${value ?? 0}</strong>
      <span>${label}</span>
    </div>
  `).join('')
}

function formatCell(key, row) {
  if (key === 'player_name') return `${avatar(row)} ${row.player_name || 'Unknown'}`
  if (key === 'pack' || key === 'strongest_category') return formatPack(row[key])
  if (key === 'correct_count' || key === 'best_correct' || key === 'avg_correct') return `${row[key] ?? 0}/10`
  if (key === 'duration_seconds' || key === 'total_duration_seconds') return formatDuration(row[key])
  if (key === 'avg_time' || key === 'avg_answer_time') return formatAnswerTime(row[key])
  if (key === 'wrong_rate' || key === 'timeout_rate' || key === 'completion_rate') return formatPercent(row[key])
  if (key === 'submitted_at' || key === 'last_played_at' || key === 'best_submitted_at' || key === 'verified_at') return formatDate(row[key])
  if (key === 'common_wrong_choice') return row[key] || 'None yet'
  if (key === 'packs') return Array.isArray(row[key]) ? row[key].map(formatPack).join(', ') : formatPack(row[key])
  if (key === 'byte_size') return `${Math.round((Number(row[key]) || 0) / 1024)} KB`
  return row[key] ?? 0
}

function renderTable(rows, emptyText) {
  const target = document.getElementById('admin-table')
  const config = tabConfig[activeTab]
  if (!rows?.length) {
    target.innerHTML = `<p class="admin-muted">${emptyText}</p>`
    return
  }
  target.innerHTML = `
    <table class="admin-table">
      <thead><tr>${config.columns.map(([key, header]) => `
        <th><button class="admin-sort" type="button" data-sort="${key}">${header}${sortBy === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</button></th>
      `).join('')}</tr></thead>
      <tbody>${rows.map(row => `
        <tr>${config.columns.map(([key]) => `<td>${formatCell(key, row)}</td>`).join('')}</tr>
      `).join('')}</tbody>
    </table>
  `
  target.querySelectorAll('.admin-sort').forEach(button => {
    button.addEventListener('click', () => {
      const nextSort = button.dataset.sort
      sortDir = sortBy === nextSort && sortDir === 'desc' ? 'asc' : 'desc'
      sortBy = nextSort
      page = 0
      loadAdmin()
    })
  })
}

function renderOverviewRows(totals = {}) {
  return [
    { metric: 'Completion rate', value: formatPercent(totals.completion_rate) },
    { metric: 'Average score', value: `${totals.avg_score ?? 0}/50` },
    { metric: 'Average correct answers', value: `${totals.avg_correct ?? 0}/10` },
    { metric: 'Average answer speed', value: formatAnswerTime(totals.avg_answer_time) },
    { metric: 'Fastest average player', value: totals.fastest_player || 'Not enough data yet' },
    { metric: 'Most played category', value: totals.most_played_pack ? formatPack(totals.most_played_pack) : 'Not enough data yet' },
    { metric: 'Best-performing category', value: totals.best_performing_pack ? `${formatPack(totals.best_performing_pack)} (${totals.best_performing_pack_score ?? 0}/50 avg.)` : 'Not enough data yet' },
    { metric: 'Total timeouts', value: totals.total_timeouts ?? 0 },
  ]
}

function renderPagination(total = 0) {
  const target = document.getElementById('admin-pagination')
  const pages = Math.max(1, Math.ceil(total / pageSize))
  target.innerHTML = `
    <button class="btn btn-ghost btn-sm" id="admin-prev-page" type="button" ${page <= 0 ? 'disabled' : ''}>Previous</button>
    <span>Page ${page + 1} of ${pages}</span>
    <button class="btn btn-ghost btn-sm" id="admin-next-page" type="button" ${page + 1 >= pages ? 'disabled' : ''}>Next</button>
  `
  document.getElementById('admin-prev-page')?.addEventListener('click', () => { page = Math.max(0, page - 1); loadAdmin() })
  document.getElementById('admin-next-page')?.addEventListener('click', () => { page += 1; loadAdmin() })
}

function syncTabs() {
  document.querySelectorAll('.admin-tab').forEach(button => {
    const active = button.dataset.tab === activeTab
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-selected', String(active))
  })
}

function renderDashboard(data) {
  latestData = data
  document.getElementById('admin-login').classList.add('hidden')
  document.getElementById('admin-dashboard').classList.remove('hidden')
  document.getElementById('admin-generated').textContent = `Updated ${formatDate(data.generatedAt)}`
  document.getElementById('admin-panel-title').textContent = tabConfig[activeTab].title
  document.getElementById('admin-panel-summary').textContent = tabConfig[activeTab].summary
  syncTabs()
  renderStats(data.totals || {})
  const rows = activeTab === 'overview' ? renderOverviewRows(data.totals || {}) : (data.rows || data[activeTab] || [])
  renderTable(rows, activeTab === 'overview' ? 'No overview data yet.' : 'No rows match these filters.')
  renderPagination(activeTab === 'overview' ? rows.length : (data.totalRows ?? rows.length))
}

async function loadAdmin() {
  errorEl.textContent = ''
  adminPassword = passwordInput.value || adminPassword
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

document.querySelectorAll('.admin-tab').forEach(button => {
  button.addEventListener('click', () => {
    activeTab = button.dataset.tab || 'overview'
    sortBy = tabConfig[activeTab].sortBy
    sortDir = activeTab === 'leaderboard' ? 'desc' : 'desc'
    page = 0
    loadAdmin()
  })
})

document.getElementById('admin-pack-filter')?.addEventListener('change', () => { page = 0; loadAdmin() })
document.getElementById('admin-page-size')?.addEventListener('change', event => {
  pageSize = Number(event.target.value) || 20
  page = 0
  loadAdmin()
})
document.getElementById('admin-search')?.addEventListener('input', () => {
  window.clearTimeout(document.getElementById('admin-search')._timer)
  document.getElementById('admin-search')._timer = window.setTimeout(() => { page = 0; loadAdmin() }, 250)
})

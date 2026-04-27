// ── History & Results rendering ───────────────────────────────────────────────
import { $, logoUrl, showScreen } from './screens.js'
import { LOGO_POOL }              from '../data/brands.js'
import { CONFIG }                 from '../config.js'
import { getRank, shuffle }       from '../utils/helpers.js'

export function getHistory() {
  try { return JSON.parse(localStorage.getItem('logoquiz_history') || '[]') } catch { return [] }
}

export function saveToHistory(score, pack, answers) {
  const h = getHistory()
  h.unshift({
    date: new Date().toISOString(),
    score,
    pack,
    rank:    getRank(score).label,
    answers,
  })
  localStorage.setItem('logoquiz_history', JSON.stringify(h.slice(0, CONFIG.maxHistory)))
}

export function updateBestScore() {
  const h  = getHistory()
  const el = $('best-score')
  if (!h.length) { el.textContent = ''; return }
  const best = Math.max(...h.map(g => g.score))
  el.innerHTML = `Best: <strong>${best}</strong> pts ${getRank(best).emoji}`
}

export function initLogoParade() {
  const parade = $('logo-parade')
  const sample = shuffle([...LOGO_POOL]).slice(0, 10)
  parade.innerHTML = sample.map(l =>
    `<div class="parade-item"><img src="${logoUrl(l.domain, 56)}" alt="${l.name}" loading="lazy" /></div>`
  ).join('')
}

export function renderResults(answers, score) {
  const rank = getRank(score)
  $('rank-badge').innerHTML    = `${rank.emoji} ${rank.label}`
  $('rank-badge').style.color  = rank.color
  $('final-score').textContent = score

  const correctCount = answers.filter(a => a.correct).length
  const avgTime      = (answers.reduce((s, a) => s + a.timeUsed, 0) / answers.length).toFixed(1)

  $('result-stats').innerHTML = `
    <span>${correctCount}/${CONFIG.questionsPerGame} correct</span>
    <span>Avg ${avgTime}s per answer</span>
  `

  $('breakdown').innerHTML = answers.map((a, i) => {
    const label  = a.logo?.name || '?'
    const imgSrc = logoUrl(a.logo?.domain, 28)
    const modeLbl = {
      'logo-to-name':  '🏷️',
      'name-to-logo':  '🖼️',
    }[a.mode] || ''

    return `
      <div class="br-row ${a.correct ? 'br-correct' : 'br-wrong'}">
        <span class="br-num">Q${i + 1}</span>
        <img src="${imgSrc}" class="br-logo" alt="${label}" />
        <span class="br-name">${label}</span>
        <span class="br-mode">${modeLbl}</span>
        <span class="br-time">${a.timedOut ? 'timeout' : `${a.timeUsed.toFixed(1)}s`}</span>
        <span class="br-pts">${a.correct ? `<strong>+${a.pointsEarned}</strong>` : '—'}</span>
      </div>`
  }).join('')
}

export function renderHistory(onResults) {
  const h    = getHistory()
  const list = $('history-list')

  if (!h.length) {
    list.innerHTML = `
      <div class="empty-history">
        <div class="empty-icon">🎮</div>
        <p>No rounds played yet.</p>
        <p class="empty-sub">Play your first game to see stats here.</p>
      </div>`
    showScreen('history')
    return
  }

  list.innerHTML = h.map(g => {
    const rank      = getRank(g.score)
    const date      = new Date(g.date)
    const dateStr   = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const timeStr   = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const correct   = g.answers.filter(a => a.correct).length
    const avgSecs   = (g.answers.reduce((s, a) => s + a.timeUsed, 0) / g.answers.length).toFixed(1)

    const rows = g.answers.map((a, qi) => {
      const name    = a.logo?.name || a.char?.name || '?'
      const modeLbl = {
        'logo-to-name':  '🏷️',
        'name-to-logo':  '🖼️',
        'image-to-name': '🎭',
        'name-to-image': '🖼️',
        'image-to-film': '🎬',
      }[a.mode] || ''
      return `<div class="hd-row ${a.correct ? 'hd-ok' : 'hd-fail'}">
        <span class="hd-q">Q${qi + 1}</span>
        <span class="hd-name">${name}</span>
        <span class="hd-mode">${modeLbl}</span>
        <span class="hd-time">${a.timedOut ? 'timeout' : `${a.timeUsed.toFixed(1)}s`}</span>
        <span class="hd-pts">${a.correct ? `+${a.pointsEarned}` : '✗'}</span>
      </div>`
    }).join('')

    return `
      <details class="history-card">
        <summary class="history-summary">
          <span class="hs-emoji">${rank.emoji}</span>
          <div class="hs-info">
            <div class="hs-score">🏢 ${g.score} pts — <em>${rank.label}</em></div>
            <div class="hs-meta">${dateStr} · ${timeStr} · ${correct}/10 correct · avg ${avgSecs}s</div>
          </div>
          <span class="hs-arrow">›</span>
        </summary>
        <div class="history-detail">${rows}</div>
      </details>`
  }).join('')

  showScreen('history')
}

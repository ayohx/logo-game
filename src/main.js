// ── Main — event wiring & boot ────────────────────────────────────────────────
import { AUDIO }       from './utils/audio.js'
import { $, showScreen }  from './ui/screens.js'
import { updateBestScore, initLogoParade, renderResults, renderHistory } from './ui/history.js'
import { startGame, handleAnswer, pauseGame, resumeGame, getState } from './game/engine.js'
import { CONFIG }      from './config.js'
import { fetchLeaderboard, normalisePlayerName } from './utils/leaderboard.js'

// ── Navigation buttons ────────────────────────────────────────────────────────
const playerNameInput = $('player-name')
const nameHelp = $('name-help')

function getPlayerName() {
  const playerName = normalisePlayerName(playerNameInput?.value)
  if (playerNameInput) playerNameInput.value = playerName
  return playerName
}

if (playerNameInput) {
  playerNameInput.value = localStorage.getItem('logoquiz_player_name') || ''
  playerNameInput.addEventListener('input', () => {
    if (nameHelp) nameHelp.textContent = 'Your best score will appear once on the shared scoreboard.'
  })
}

$('btn-brands').addEventListener('click', async () => {
  const playerName = getPlayerName()
  if (playerName.length < 2) {
    if (nameHelp) nameHelp.textContent = 'Please enter at least 2 letters or numbers before playing.'
    playerNameInput?.focus()
    return
  }

  localStorage.setItem('logoquiz_player_name', playerName)
  if (nameHelp) nameHelp.textContent = 'Starting shared game...'

  try {
    await startGame('brands', playerName)
  } catch (error) {
    if (nameHelp) nameHelp.textContent = error instanceof Error ? error.message : 'Could not start the shared game.'
  }
})

$('btn-history').addEventListener('click', () => renderHistory())
$('btn-leaderboard').addEventListener('click', () => renderLeaderboard())

$('btn-play-again').addEventListener('click', () => {
  const { pack } = getState()
  startGame(pack)
})

$('btn-switch-pack').addEventListener('click', () => {
  showScreen('start')
  updateBestScore()
})

$('btn-home').addEventListener('click', () => {
  showScreen('start')
  updateBestScore()
})

$('btn-results-history').addEventListener('click', () => renderHistory())

$('btn-history-back').addEventListener('click', () => {
  const state = getState()
  if (state.answers.length === CONFIG.questionsPerGame) {
    renderResults(state.answers, state.score)
    showScreen('results')
  } else {
    showScreen('start')
    updateBestScore()
  }
})

$('btn-leaderboard-back').addEventListener('click', () => {
  showScreen('start')
  updateBestScore()
})

async function renderLeaderboard() {
  const list = $('leaderboard-list')
  showScreen('leaderboard')
  list.innerHTML = '<div class="empty-history"><p>Loading shared scores...</p></div>'

  try {
    const { leaderboard } = await fetchLeaderboard()
    if (!leaderboard.length) {
      list.innerHTML = '<div class="empty-history"><p>No shared scores yet.</p><p class="empty-sub">Play the first round to claim the board.</p></div>'
      return
    }

    list.innerHTML = leaderboard.map(row => `
      <div class="leaderboard-row">
        <span class="leaderboard-rank">#${row.rank}</span>
        <span class="leaderboard-player">${row.playerName}</span>
        <span class="leaderboard-score">${row.bestScore} pts</span>
        <span class="leaderboard-meta">${row.bestCorrect}/10 · streak ${row.bestStreak} · ${row.gamesPlayed} game${row.gamesPlayed === 1 ? '' : 's'}</span>
      </div>
    `).join('')
  } catch (error) {
    list.innerHTML = `<div class="empty-history"><p>${error instanceof Error ? error.message : 'Could not load leaderboard.'}</p></div>`
  }
}

// ── Pause button ──────────────────────────────────────────────────────────────
$('btn-pause').addEventListener('click', () => {
  const { paused } = getState()
  paused ? resumeGame() : pauseGame()
})

$('btn-resume').addEventListener('click', () => resumeGame())

// ── Volume control ────────────────────────────────────────────────────────────
const volSlider = $('volume-slider')
const volBtn    = $('btn-volume')
const muteBtn   = $('btn-mute')
const volPanel  = $('volume-panel')

if (volSlider) {
  volSlider.value = AUDIO.getVolume()
  volSlider.addEventListener('input', () => {
    AUDIO.setVolume(parseFloat(volSlider.value))
    syncMuteButton()
  })
}

function syncMuteButton() {
  if (!muteBtn) return
  const muted = AUDIO.isMuted()
  muteBtn.textContent = muted ? '🔇' : '🔊'
  muteBtn.setAttribute('aria-pressed', String(muted))
  muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound')
  muteBtn.title = muted ? 'Unmute sound (M)' : 'Mute sound (M)'
}

if (volBtn) {
  volBtn.addEventListener('click', e => {
    e.stopPropagation()
    volPanel.classList.toggle('hidden')
  })
}

if (muteBtn) {
  syncMuteButton()
  muteBtn.addEventListener('click', e => {
    e.stopPropagation()
    AUDIO.toggleMute()
    syncMuteButton()
  })
}

document.addEventListener('click', () => {
  if (volPanel) volPanel.classList.add('hidden')
})

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const { answering, paused } = getState()

  // P key — pause/resume toggle
  if (e.key === 'p' || e.key === 'P') {
    paused ? resumeGame() : pauseGame()
    return
  }

  if (e.key === 'm' || e.key === 'M') {
    AUDIO.toggleMute()
    syncMuteButton()
    return
  }

  if (!answering) return
  const map = { '1': 0, a: 0, A: 0, '2': 1, b: 1, B: 1, '3': 2, c: 2, C: 2 }
  if (map[e.key] !== undefined) handleAnswer(map[e.key])
})

// ── Boot ──────────────────────────────────────────────────────────────────────
initLogoParade()
updateBestScore()

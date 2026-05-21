// ── Main — event wiring & boot ────────────────────────────────────────────────
import { AUDIO }       from './utils/audio.js'
import { $, showScreen }  from './ui/screens.js'
import { updateBestScore, initLogoParade, renderResults, renderHistory } from './ui/history.js'
import { startGame, handleAnswer, pauseGame, resumeGame, getState } from './game/engine.js'
import { CONFIG }      from './config.js'

// ── Navigation buttons ────────────────────────────────────────────────────────
$('btn-brands').addEventListener('click',  () => startGame('brands'))

$('btn-history').addEventListener('click', () => renderHistory())

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

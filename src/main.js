// ── Main — event wiring & boot ────────────────────────────────────────────────
import { AUDIO }       from './utils/audio.js'
import { $, showScreen }  from './ui/screens.js'
import { updateBestScore, initLogoParade, renderResults, renderHistory } from './ui/history.js'
import { startGame, handleAnswer, pauseGame, resumeGame, getState } from './game/engine.js'
import { CONFIG }      from './config.js'
import { buildShareMessage, fetchLeaderboard, getPlayerProfile, normalisePlayerName, savePlayerProfile, saveProfileLocally } from './utils/leaderboard.js'

// ── Navigation buttons ────────────────────────────────────────────────────────
const playerNameInput = $('player-name')
const avatarTypeInput = $('avatar-type')
const profileAvatarInput = $('profile-avatar')
const nameHelp = $('name-help')
let activeProfile = getPlayerProfile()
let selectedEmoji = activeProfile.avatarType === 'emoji' ? emojiFromAvatarValue(activeProfile.avatarValue) : ''

function initialsForName(name) {
  return normalisePlayerName(name).replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '??'
}

function emojiFromAvatarValue(value) {
  const emojiButton = [...document.querySelectorAll('.avatar-choice[data-avatar-type="emoji"]')]
    .find(button => String(value || '').startsWith(button.dataset.avatarValue || ''))
  return emojiButton?.dataset.avatarValue || ''
}

function updateAvatarPreview() {
  if (!profileAvatarInput) return
  const initials = initialsForName(playerNameInput?.value)
  profileAvatarInput.value = avatarTypeInput?.value === 'emoji' && selectedEmoji
    ? `${selectedEmoji}${initials}`
    : initials
}

function getProfileFromForm() {
  const displayName = normalisePlayerName(playerNameInput?.value)
  const avatarType = avatarTypeInput?.value === 'emoji' ? 'emoji' : 'initials'
  const avatarValue = String(profileAvatarInput?.value || '').trim()
  return saveProfileLocally({ ...activeProfile, displayName, avatarType, avatarValue })
}

function syncProfileForm() {
  activeProfile = getPlayerProfile()
  if (playerNameInput) playerNameInput.value = activeProfile.displayName
  if (avatarTypeInput) avatarTypeInput.value = activeProfile.avatarType
  if (profileAvatarInput) profileAvatarInput.value = activeProfile.avatarValue
  selectedEmoji = activeProfile.avatarType === 'emoji' ? emojiFromAvatarValue(activeProfile.avatarValue) : ''
  updateAvatarPreview()
  syncAvatarChoices(activeProfile)
}

syncProfileForm()

playerNameInput?.addEventListener('input', () => {
  updateAvatarPreview()
  if (nameHelp) nameHelp.textContent = 'Your best score will appear once on the shared scoreboard.'
})

document.querySelectorAll('.avatar-choice').forEach(button => {
  button.addEventListener('click', () => {
    const avatarType = button.dataset.avatarType === 'emoji' ? 'emoji' : 'initials'
    selectedEmoji = avatarType === 'emoji' ? button.dataset.avatarValue : ''

    if (avatarTypeInput) avatarTypeInput.value = avatarType
    updateAvatarPreview()
    activeProfile = getProfileFromForm()
    syncAvatarChoices(activeProfile)
  })
})

$('btn-save-profile').addEventListener('click', async () => {
  try {
    activeProfile = await savePlayerProfile(getProfileFromForm())
    syncProfileForm()
    showProfileSavedFeedback()
    if (nameHelp) nameHelp.textContent = 'Profile saved. Your leaderboard name will update without losing your best score.'
  } catch (error) {
    if (nameHelp) nameHelp.textContent = error instanceof Error ? error.message : 'Could not save profile.'
  }
})

$('btn-brands').addEventListener('click', () => {
  $('selected-pack').textContent = 'Mix Brands is selected. Press Start Game when you are ready.'
  $('btn-start-game').focus()
})

$('btn-start-game').addEventListener('click', () => startSelectedGame())

async function startSelectedGame() {
  const profile = getProfileFromForm()
  if (profile.displayName.length < 2) {
    if (nameHelp) nameHelp.textContent = 'Please enter at least 2 letters or numbers before playing.'
    playerNameInput?.focus()
    return
  }

  activeProfile = profile
  if (nameHelp) nameHelp.textContent = 'Starting shared game...'

  try {
    await startGame('brands', activeProfile)
  } catch (error) {
    if (nameHelp) nameHelp.textContent = error instanceof Error ? error.message : 'Could not start the shared game.'
  }
}

function syncAvatarChoices(profile) {
  document.querySelectorAll('.avatar-choice').forEach(button => {
    const isActive = button.dataset.avatarType === profile.avatarType &&
      (profile.avatarType === 'initials' || button.dataset.avatarValue === selectedEmoji)
    button.classList.toggle('is-active', isActive)
    button.setAttribute('aria-pressed', String(isActive))
  })
}

function showProfileSavedFeedback() {
  if (!profileAvatarInput) return
  profileAvatarInput.classList.add('is-saved-feedback')
  window.setTimeout(() => profileAvatarInput.classList.remove('is-saved-feedback'), 1400)
}

$('btn-history').addEventListener('click', () => renderHistory())
$('btn-leaderboard').addEventListener('click', () => renderLeaderboard())

$('btn-play-again').addEventListener('click', () => {
  const { pack } = getState()
  startGame(pack, activeProfile)
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
$('btn-share-result').addEventListener('click', () => copyShareMessage())

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
  const params = new URLSearchParams(window.location.search)
  const linkedPlayerId = params.get('player') || ''
  showScreen('leaderboard')
  list.innerHTML = '<div class="empty-history"><p>Loading shared scores...</p></div>'

  try {
    const { leaderboard } = await fetchLeaderboard(linkedPlayerId)
    if (!leaderboard.length) {
      list.innerHTML = '<div class="empty-history"><p>No shared scores yet.</p><p class="empty-sub">Play the first round to claim the board.</p></div>'
      return
    }

    list.innerHTML = leaderboard.map(row => `
      <div class="leaderboard-row ${row.highlighted ? 'is-highlighted' : ''}">
        <span class="leaderboard-rank">#${row.rank}</span>
        <span class="leaderboard-avatar">${row.avatarValue || '?'}</span>
        <span class="leaderboard-player">${row.playerName}</span>
        <span class="leaderboard-score">${row.bestScore} pts</span>
        <span class="leaderboard-meta">${row.bestCorrect}/10 · streak ${row.bestStreak} · ${row.gamesPlayed} game${row.gamesPlayed === 1 ? '' : 's'}</span>
      </div>
    `).join('')
  } catch (error) {
    list.innerHTML = `<div class="empty-history"><p>${error instanceof Error ? error.message : 'Could not load leaderboard.'}</p></div>`
  }
}

async function copyShareMessage() {
  const status = $('share-status')
  const state = getState()
  const message = buildShareMessage(state.leaderboardResult || { score: state.score }, activeProfile)

  try {
    await navigator.clipboard.writeText(message)
    if (status) status.textContent = 'Share message copied to clipboard.'
  } catch {
    if (status) status.textContent = message
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
if (new URLSearchParams(window.location.search).has('player')) renderLeaderboard()

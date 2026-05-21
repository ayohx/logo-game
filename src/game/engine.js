// ── Core game loop & state ────────────────────────────────────────────────────
import { CONFIG }    from '../config.js'
import { AUDIO }     from '../utils/audio.js'
import { SPEECH }    from '../utils/speech.js'
import { $, logoUrl, logoFallbackUrl, showScreen, showStage, showScorePop, updateHUD } from '../ui/screens.js'
import { runShuffle }         from '../ui/shuffle.js'
import { saveToHistory, renderResults } from '../ui/history.js'
import { startTimer, stopTimer, pauseTimer, resumeTimer, getTimerStart } from './timer.js'
import { generateQuestions } from './questions.js'
import { LOG } from '../utils/logger.js'
import { startLeaderboardGame, submitLeaderboardScore } from '../utils/leaderboard.js'

const LOGO_LOAD_TIMEOUT_MS = 3500

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  pack:       'brands',
  questions:  [],
  current:    0,
  score:      0,
  answers:    [],
  answering:  false,
  paused:     false,
  currentQ:   null,
  sessionId:  null,
  playerName: '',
  leaderboardResult: null,
}

export function getState() { return state }

// ── Game lifecycle ────────────────────────────────────────────────────────────
export async function startGame(pack, playerName = '') {
  AUDIO.resume()
  const selectedPack = pack || 'brands'
  const leaderboardSession = await startLeaderboardGame(playerName, selectedPack)
  state.pack      = pack || 'brands'
  state.current   = 0
  state.score     = 0
  state.answers   = []
  state.paused    = false
  state.currentQ  = null
  state.sessionId = leaderboardSession.sessionId
  state.playerName = leaderboardSession.playerName
  state.leaderboardResult = null
  state.questions = leaderboardSession.questions || generateQuestions(state.pack)

  LOG.event('game_start', { pack: state.pack, questions: state.questions.length })
  LOG.startSession(state.pack)

  updateHUD(state.current, state.score, CONFIG.questionsPerGame)
  showScreen('game')
  setTimeout(nextQuestion, 250)
}

// ── Pause / Resume ────────────────────────────────────────────────────────────
export function pauseGame() {
  if (!state.answering || state.paused) return
  state.paused    = true
  state.answering = false
  SPEECH.stop()
  pauseTimer()
  $('pause-overlay').classList.remove('hidden')
}

export function resumeGame() {
  if (!state.paused) return
  state.paused    = false
  state.answering = true
  $('pause-overlay').classList.add('hidden')
  resumeTimer(state.currentQ, timeOut)
  SPEECH.listen(state.currentQ, handleAnswer)
}

// ── Question flow ─────────────────────────────────────────────────────────────
async function nextQuestion() {
  if (state.current >= CONFIG.questionsPerGame) { endGame(); return }
  const q = state.questions[state.current]
  await runShuffle(q)
  await showQuestion(q)
}

// ── Show question ─────────────────────────────────────────────────────────────
async function showQuestion(q) {
  showStage('question')
  state.answering = false
  state.currentQ  = q
  const assetPromises = []

  const badges = {
    'logo-to-name':   '🏷️ Name this brand',
    'name-to-logo':   '🖼️ Pick the right logo',
  }
  $('mode-badge').textContent = badges[q.mode] || ''

  LOG.event('question_show', { q: state.current + 1, mode: q.mode, domain: q.correct.domain, name: q.correct.name })
  LOG.logQuestion(state.current + 1, q.mode, q.correct, q.options, q.correctIndex)

  // Prompt
  const prompt = $('prompt')
  prompt.innerHTML = ''
  const feedback = $('question-feedback')
  if (feedback) {
    feedback.textContent = 'Choose the best answer.'
    feedback.className = 'question-feedback'
  }

  if (q.mode === 'logo-to-name') {
    const img = document.createElement('img')
    img.className = 'prompt-logo'
    img.alt       = 'Brand logo'
    img.dataset.logoDomain = q.correct.domain
    img.dataset.logoSize = String(CONFIG.logoSize)
    const src     = logoUrl(q.correct.domain, CONFIG.logoSize)
    img.onload    = () => { LOG.event('img_load_ok',   { src }); LOG.logImgResult(q.correct.domain, true,  src) }
    img.onerror   = () => { LOG.event('img_load_fail', { src, domain: q.correct.domain }); LOG.logImgResult(q.correct.domain, false, src) }
    assetPromises.push(trackLogoAsset(img, () => {
      const fallback = document.createElement('span')
      fallback.className = 'logo-fallback prompt-name'
      fallback.textContent = q.correct.name
      prompt.replaceChildren(fallback)
    }))
    img.src       = src
    prompt.appendChild(img)
  } else {
    const span       = document.createElement('span')
    span.className   = 'prompt-name'
    span.textContent = q.correct.name
    prompt.appendChild(span)
  }

  // Options
  const container  = $('options')
  container.innerHTML = ''
  const labels     = ['A', 'B', 'C']
  const optAsImage = q.mode === 'name-to-logo'
  container.className = `options ${optAsImage ? 'options-logo' : 'options-text'}`

  q.options.forEach((opt, i) => {
    const card     = document.createElement('button')
    card.className = 'option-card'
    card.type      = 'button'
    card.dataset.index = i
    card.setAttribute('aria-label', `${labels[i]}. ${opt.name}`)

    if (optAsImage) {
      const optSrc  = logoUrl(opt.domain, CONFIG.optLogoSize)
      const optImg  = document.createElement('img')
      optImg.src      = optSrc
      optImg.alt      = opt.name
      optImg.className = 'opt-logo'
      optImg.dataset.logoDomain = opt.domain
      optImg.dataset.logoSize = String(CONFIG.optLogoSize)
      optImg.onload  = () => { LOG.event('img_load_ok',   { src: optSrc }); LOG.logImgResult(opt.domain, true,  optSrc) }
      optImg.onerror = () => { LOG.event('img_load_fail', { src: optSrc, domain: opt.domain }); LOG.logImgResult(opt.domain, false, optSrc) }

      const wrap = document.createElement('div')
      wrap.className = 'opt-logo-wrap'
      wrap.appendChild(optImg)
      assetPromises.push(trackLogoAsset(optImg, () => {
        const fallback = document.createElement('span')
        fallback.className = 'logo-fallback opt-logo-fallback'
        fallback.textContent = opt.name
        wrap.replaceChildren(fallback)
      }))

      const key = document.createElement('span')
      key.className   = 'opt-key'
      key.textContent = labels[i]

      card.appendChild(wrap)
      card.appendChild(key)
    } else {
      card.innerHTML = `
        <span class="opt-key">${labels[i]}</span>
        <span class="opt-text">${opt.name}</span>
      `
    }

    card.addEventListener('click',    () => handleAnswer(i))
    card.addEventListener('touchend', e  => { e.preventDefault(); handleAnswer(i) })
    container.appendChild(card)
  })

  await waitForQuestionAssets(q, assetPromises)
  state.answering = true
  startTimer(q, timeOut)
  SPEECH.listen(q, handleAnswer)
  updateHUD(state.current, state.score, CONFIG.questionsPerGame)
  focusFirstOption()
}

function trackLogoAsset(img, showFallback) {
  return new Promise(resolve => {
    let settled = false
    let timer = null
    function retryWithLogoDev() {
      if (img.dataset.logoFallbackTried === 'true' || !img.dataset.logoDomain) return false
      if (!CONFIG.logoStorageEnabled) return false
      img.dataset.logoFallbackTried = 'true'
      window.clearTimeout(timer)
      timer = window.setTimeout(() => finish(true), LOGO_LOAD_TIMEOUT_MS)
      img.src = logoFallbackUrl(img.dataset.logoDomain, Number(img.dataset.logoSize) || undefined)
      return true
    }
    function finish(failed) {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      if (failed) showFallback()
      resolve()
    }
    timer = window.setTimeout(() => {
      if (!retryWithLogoDev()) finish(true)
    }, LOGO_LOAD_TIMEOUT_MS)
    img.addEventListener('load', () => finish(false), { once: true })
    img.addEventListener('error', () => {
      if (!retryWithLogoDev()) finish(true)
    })
  })
}

async function waitForQuestionAssets(q, assetPromises = []) {
  const feedback = $('question-feedback')
  if (feedback && assetPromises.length) feedback.textContent = 'Loading logos...'
  await Promise.all(assetPromises)
  if (feedback && state.currentQ === q) feedback.textContent = 'Choose the best answer.'
}

function focusFirstOption() {
  requestAnimationFrame(() => {
    document.querySelector('.option-card')?.focus({ preventScroll: true })
  })
}

// ── Timer expiry ──────────────────────────────────────────────────────────────
function timeOut(q) {
  if (!state.answering) return
  state.answering = false
  SPEECH.stop()
  stopTimer()
  AUDIO.wrong()
  revealAnswer(q, -1, 0, CONFIG.timePerQuestion)
}

// ── Answer handling ───────────────────────────────────────────────────────────
export function handleAnswer(idx) {
  if (!state.answering) return
  state.answering = false
  SPEECH.stop()
  stopTimer()

  const elapsed  = performance.now() - getTimerStart()
  const secsUsed = Math.min(CONFIG.timePerQuestion, elapsed / 1000)
  const secsLeft = CONFIG.timePerQuestion - secsUsed
  const q        = state.questions[state.current]
  const correct  = idx === q.correctIndex
  const points   = correct ? Math.max(0, Math.floor(secsLeft)) : 0

  LOG.event('answer', { q: state.current + 1, correct, points, timedOut: idx === -1, domain: q.correct.domain })
  LOG.logAnswer(state.current + 1, idx, correct, points, idx === -1)

  if (correct) { AUDIO.correct(); state.score += points }
  else         { AUDIO.wrong() }

  revealAnswer(q, idx, points, secsUsed)
}

function revealAnswer(q, chosenIdx, points, secsUsed) {
  const feedback = $('question-feedback')
  document.querySelectorAll('.option-card').forEach((card, i) => {
    card.disabled = true
    if      (i === q.correctIndex)                            card.classList.add('correct')
    else if (i === chosenIdx && chosenIdx !== q.correctIndex) card.classList.add('wrong')
    else                                                      card.classList.add('dim')
  })

  if (points > 0) showScorePop(points)

  if (feedback) {
    const correctName = q.correct?.name || 'the correct answer'
    const chosenCorrect = chosenIdx === q.correctIndex
    feedback.className = `question-feedback ${chosenCorrect ? 'is-correct' : chosenIdx === -1 ? 'is-timeout' : 'is-wrong'}`
    feedback.textContent = chosenCorrect
      ? `Correct. ${correctName} +${points} pts.`
      : chosenIdx === -1
        ? `Time ran out. Correct answer: ${correctName}.`
        : `Not quite. Correct answer: ${correctName}.`
  }

  state.answers.push({
    pack:         q.pack,
    correct:      chosenIdx === q.correctIndex,
    pointsEarned: points,
    timeUsed:     secsUsed,
    timedOut:     chosenIdx === -1,
    mode:         q.mode,
    logo:         q.correct,
    chosen:       chosenIdx >= 0 ? q.options[chosenIdx] : null,
  })

  updateHUD(state.current, state.score, CONFIG.questionsPerGame)
  setTimeout(() => { state.current++; nextQuestion() }, CONFIG.revealDuration)
}

// ── End game ──────────────────────────────────────────────────────────────────
async function endGame() {
  LOG.event('game_end', { score: state.score, pack: state.pack, totalQuestions: state.answers.length })
  LOG.endSession(state.score)
  AUDIO.end(state.score)
  saveToHistory(state.score, state.pack, state.answers)
  renderResults(state.answers, state.score)
  showScreen('results')
  submitSharedScore()
}

async function submitSharedScore() {
  const status = $('leaderboard-submit-status')
  if (!state.sessionId) return

  if (status) status.textContent = 'Submitting to shared leaderboard...'

  try {
    const answerLog = state.answers.map(answer => ({
      choiceDomain: answer.chosen?.domain || null,
      choiceName: answer.chosen?.name || null,
      correctDomain: answer.logo?.domain || null,
      correctName: answer.logo?.name || null,
      pack: answer.pack,
      mode: answer.mode,
      pointsEarned: answer.pointsEarned,
      timeUsed: answer.timeUsed,
      timedOut: answer.timedOut,
    }))
    state.leaderboardResult = await submitLeaderboardScore(state.sessionId, answerLog)
    if (status) {
      status.textContent = state.leaderboardResult.improved
        ? `Shared leaderboard updated. Your retained best is ${state.leaderboardResult.retainedBest} pts.`
        : `Score submitted. Your retained best remains ${state.leaderboardResult.retainedBest} pts.`
    }
  } catch (error) {
    if (status) status.textContent = error instanceof Error ? error.message : 'Could not submit score.'
  }
}

// ── Core game loop & state ────────────────────────────────────────────────────
import { CONFIG }    from '../config.js'
import { AUDIO }     from '../utils/audio.js'
import { SPEECH }    from '../utils/speech.js'
import { $, logoUrl, showScreen, showStage, showScorePop, updateHUD } from '../ui/screens.js'
import { runShuffle }         from '../ui/shuffle.js'
import { saveToHistory, renderResults } from '../ui/history.js'
import { startTimer, stopTimer, pauseTimer, resumeTimer, getTimerStart } from './timer.js'
import { generateBrandQuestions } from './questions.js'
import { LOG } from '../utils/logger.js'

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
}

export function getState() { return state }

// ── Game lifecycle ────────────────────────────────────────────────────────────
export async function startGame(pack) {
  AUDIO.resume()
  state.pack      = pack || 'brands'
  state.current   = 0
  state.score     = 0
  state.answers   = []
  state.paused    = false
  state.currentQ  = null
  state.questions = generateBrandQuestions()

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
  showQuestion(q)
}

// ── Show question ─────────────────────────────────────────────────────────────
function showQuestion(q) {
  showStage('question')
  state.answering = true
  state.currentQ  = q

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

  if (q.mode === 'logo-to-name') {
    const img = document.createElement('img')
    img.className = 'prompt-logo'
    img.alt       = 'Brand logo'
    const src     = logoUrl(q.correct.domain, CONFIG.logoSize)
    img.onload    = () => { LOG.event('img_load_ok',   { src }); LOG.logImgResult(q.correct.domain, true,  src) }
    img.onerror   = () => { LOG.event('img_load_fail', { src, domain: q.correct.domain }); LOG.logImgResult(q.correct.domain, false, src) }
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
    card.dataset.index = i

    if (optAsImage) {
      const optSrc  = logoUrl(opt.domain, CONFIG.optLogoSize)
      const optImg  = document.createElement('img')
      optImg.src      = optSrc
      optImg.alt      = opt.name
      optImg.className = 'opt-logo'
      optImg.onload  = () => { LOG.event('img_load_ok',   { src: optSrc }); LOG.logImgResult(opt.domain, true,  optSrc) }
      optImg.onerror = () => { LOG.event('img_load_fail', { src: optSrc, domain: opt.domain }); LOG.logImgResult(opt.domain, false, optSrc) }

      const wrap = document.createElement('div')
      wrap.className = 'opt-logo-wrap'
      wrap.appendChild(optImg)

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

  startTimer(q, timeOut)
  SPEECH.listen(q, handleAnswer)
  updateHUD(state.current, state.score, CONFIG.questionsPerGame)
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
  document.querySelectorAll('.option-card').forEach((card, i) => {
    card.disabled = true
    if      (i === q.correctIndex)                            card.classList.add('correct')
    else if (i === chosenIdx && chosenIdx !== q.correctIndex) card.classList.add('wrong')
    else                                                      card.classList.add('dim')
  })

  if (points > 0) showScorePop(points)

  state.answers.push({
    pack:         q.pack,
    correct:      chosenIdx === q.correctIndex,
    pointsEarned: points,
    timeUsed:     secsUsed,
    timedOut:     chosenIdx === -1,
    mode:         q.mode,
    logo:         q.correct,
  })

  updateHUD(state.current, state.score, CONFIG.questionsPerGame)
  setTimeout(() => { state.current++; nextQuestion() }, CONFIG.revealDuration)
}

// ── End game ──────────────────────────────────────────────────────────────────
function endGame() {
  LOG.event('game_end', { score: state.score, pack: state.pack, totalQuestions: state.answers.length })
  LOG.endSession(state.score)
  AUDIO.end(state.score)
  saveToHistory(state.score, state.pack, state.answers)
  renderResults(state.answers, state.score)
  showScreen('results')
}

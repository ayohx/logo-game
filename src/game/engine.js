// ── Core game loop & state ────────────────────────────────────────────────────
import { CONFIG }    from '../config.js'
import { DISNEY }    from '../data/disney.js'
import { AUDIO }     from '../utils/audio.js'
import { SPEECH }    from '../utils/speech.js'
import { $, logoUrl, showScreen, showStage, showScorePop, updateHUD } from '../ui/screens.js'
import { runShuffle }         from '../ui/shuffle.js'
import { saveToHistory, renderResults } from '../ui/history.js'
import { startTimer, stopTimer, getTimerStart } from './timer.js'
import { generateBrandQuestions, generateDisneyQuestions } from './questions.js'

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  pack:       'brands',
  disneyPool: [],
  questions:  [],
  current:    0,
  score:      0,
  answers:    [],
  answering:  false,
}

// Expose screen tracking for history back-navigation
export function getState() { return state }

// ── Game lifecycle ────────────────────────────────────────────────────────────
export async function startGame(pack) {
  AUDIO.resume()
  state.pack      = pack || 'brands'
  state.current   = 0
  state.score     = 0
  state.answers   = []
  state.questions = []

  if (state.pack === 'disney') {
    showScreen('loading')
    $('loading-msg').textContent        = 'Fetching Disney characters…'
    $('loading-bar-fill').style.width   = '0%'

    try {
      const pool = await DISNEY.loadPool(pct => {
        $('loading-bar-fill').style.width = pct + '%'
        $('loading-msg').textContent      = `Loading… ${pct}%`
      })
      if (pool.length < 10) throw new Error('Not enough characters loaded')
      state.disneyPool  = pool
      state.questions   = generateDisneyQuestions(pool)
    } catch (e) {
      console.error(e)
      $('loading-msg').textContent = '⚠️ Could not load Disney characters. Switching to Brands…'
      await new Promise(r => setTimeout(r, 1800))
      state.pack      = 'brands'
      state.questions = generateBrandQuestions()
    }
  } else {
    state.questions = generateBrandQuestions()
  }

  updateHUD(state.current, state.score, CONFIG.questionsPerGame)
  showScreen('game')
  setTimeout(nextQuestion, 250)
}

// ── Question flow ─────────────────────────────────────────────────────────────
async function nextQuestion() {
  if (state.current >= CONFIG.questionsPerGame) { endGame(); return }
  const q = state.questions[state.current]
  await runShuffle(q, state.disneyPool)
  showQuestion(q)
}

// ── Show question ─────────────────────────────────────────────────────────────
function showQuestion(q) {
  showStage('question')
  state.answering = true

  const badges = {
    'logo-to-name':   '🏷️ Name this brand',
    'name-to-logo':   '🖼️ Pick the right logo',
    'image-to-name':  '🎭 Name this character',
    'name-to-image':  '🖼️ Find the character',
    'image-to-film':  '🎬 Which film are they from?',
  }
  $('mode-badge').textContent = badges[q.mode] || ''

  // Prompt
  const prompt = $('prompt')
  prompt.innerHTML = ''

  if (['logo-to-name', 'image-to-name', 'image-to-film'].includes(q.mode)) {
    const img     = document.createElement('img')
    img.className = q.pack === 'disney' ? 'prompt-logo disney-char' : 'prompt-logo'
    img.alt       = q.pack === 'disney' ? q.correct.name : 'Brand logo'
    img.src       = q.pack === 'disney'
      ? DISNEY.imgUrl(q.correct.imageUrl, 400)
      : logoUrl(q.correct.domain, CONFIG.logoSize)
    prompt.appendChild(img)

    if (q.mode === 'image-to-film') {
      const lbl       = document.createElement('p')
      lbl.className   = 'prompt-film-char'
      lbl.textContent = q.correct.name
      prompt.appendChild(lbl)
    }
  } else {
    const span       = document.createElement('span')
    span.className   = 'prompt-name'
    span.textContent = q.correct.name
    prompt.appendChild(span)
  }

  // Options
  const container = $('options')
  container.innerHTML = ''
  const labels    = ['A', 'B', 'C']
  const optAsImage = q.mode === 'name-to-logo' || q.mode === 'name-to-image'
  const disneyClass = q.pack === 'disney' ? ' disney' : ''
  container.className = `options ${optAsImage ? 'options-logo' + disneyClass : 'options-text'}`

  q.options.forEach((opt, i) => {
    const card     = document.createElement('button')
    card.className = 'option-card'
    card.dataset.index = i

    if (optAsImage) {
      const imgSrc = q.pack === 'disney'
        ? DISNEY.imgUrl(opt.imageUrl, 280)
        : logoUrl(opt.domain, CONFIG.optLogoSize)
      card.innerHTML = `
        <div class="opt-logo-wrap">
          <img src="${imgSrc}" alt="${opt.name}" class="opt-logo" />
        </div>
        <span class="opt-key">${labels[i]}</span>
      `
    } else {
      const text = q.mode === 'image-to-film' ? opt : opt.name
      card.innerHTML = `
        <span class="opt-key">${labels[i]}</span>
        <span class="opt-text">${text}</span>
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
    logo:         q.pack === 'brands' ? q.correct : null,
    char:         q.pack === 'disney' ? q.correct : null,
    film:         q.mode === 'image-to-film'
      ? (typeof q.options[q.correctIndex] === 'string' ? q.options[q.correctIndex] : '')
      : null,
  })

  updateHUD(state.current, state.score, CONFIG.questionsPerGame)
  setTimeout(() => { state.current++; nextQuestion() }, CONFIG.revealDuration)
}

// ── End game ──────────────────────────────────────────────────────────────────
function endGame() {
  AUDIO.end(state.score)
  saveToHistory(state.score, state.pack, state.answers)
  renderResults(state.answers, state.score)
  showScreen('results')
}

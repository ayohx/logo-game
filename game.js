// ── Logo Quiz — Game Engine ────────────────────────────────────────────────────
;(function () {

  const CIRC = 2 * Math.PI * 45   // SVG timer circle circumference ≈ 282.74

  // ── State ──────────────────────────────────────────────────────────────────

  const state = {
    screen:    'start',
    questions: [],
    current:   0,
    score:     0,
    answers:   [],
    answering: false,
    rafId:     null,
    timerStart: null,
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  function $(id) { return document.getElementById(id) }

  function logoUrl(domain, size) {
    return `https://img.logo.dev/${domain}?token=${CONFIG.token}&size=${size ?? CONFIG.logoSize}&format=png`
  }

  function shuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  function getRank(score) {
    if (score >= 45) return { emoji: '🏆', label: 'Brand Genius',  color: '#ffd700' }
    if (score >= 35) return { emoji: '🥇', label: 'Logo Pro',      color: '#c0c0c0' }
    if (score >= 20) return { emoji: '🥈', label: 'Getting There', color: '#cd7f32' }
    return                  { emoji: '🥉', label: 'Logo Newbie',   color: '#888'    }
  }

  // ── Screen management ──────────────────────────────────────────────────────

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active')
      s.classList.add('leaving')
    })
    setTimeout(() => {
      document.querySelectorAll('.screen.leaving').forEach(s => s.classList.remove('leaving'))
      $('screen-' + id).classList.add('active')
      state.screen = id
    }, 180)
  }

  function showStage(id) {
    $('shuffle-stage').classList.toggle('hidden', id !== 'shuffle')
    $('question-stage').classList.toggle('hidden', id !== 'question')
  }

  // ── Question generation ────────────────────────────────────────────────────

  function generateQuestions() {
    const pool     = shuffle([...LOGO_POOL])
    const selected = pool.slice(0, CONFIG.questionsPerGame)

    return selected.map(correct => {
      const mode   = Math.random() > 0.5 ? 'logo-to-name' : 'name-to-logo'
      const others = shuffle(pool.filter(l => l.domain !== correct.domain)).slice(0, 2)
      const options = shuffle([correct, ...others])
      return { correct, mode, options, correctIndex: options.indexOf(correct) }
    })
  }

  // ── Game lifecycle ─────────────────────────────────────────────────────────

  function startGame() {
    AUDIO.resume()
    state.questions = generateQuestions()
    state.current   = 0
    state.score     = 0
    state.answers   = []
    updateHUD()
    showScreen('game')
    setTimeout(nextQuestion, 250)
  }

  async function nextQuestion() {
    if (state.current >= CONFIG.questionsPerGame) {
      endGame()
      return
    }

    const q = state.questions[state.current]
    await runShuffle(q)
    showQuestion(q)
  }

  // ── Shuffle animation ──────────────────────────────────────────────────────

  function runShuffle(q) {
    showStage('shuffle')
    const slotImg  = $('shuffle-img')
    const slotText = $('shuffle-text-name')
    const label    = $('shuffle-label')

    // Reset slot
    slotImg.classList.add('hidden')
    slotText.classList.add('hidden')
    slotImg.style.filter = ''
    label.textContent = 'Get ready…'

    return new Promise(resolve => {
      if (q.mode === 'logo-to-name') {
        // Show cycling logos, land on the correct one
        slotImg.classList.remove('hidden')
        let count = 0
        const total = 14

        const step = () => {
          if (count >= total) {
            slotImg.src = logoUrl(q.correct.domain, CONFIG.logoSize)
            slotImg.style.filter = 'none'
            slotImg.style.transform = 'scale(1.08)'
            label.textContent = '← Name this brand'
            setTimeout(() => { slotImg.style.transform = 'scale(1)'; resolve() }, 420)
            return
          }
          const r = LOGO_POOL[Math.floor(Math.random() * LOGO_POOL.length)]
          slotImg.src = logoUrl(r.domain, CONFIG.logoSize)
          slotImg.style.filter = count < 9 ? 'blur(3px) brightness(0.6)' : count < 12 ? 'blur(1px)' : 'none'
          count++
          const delay = 55 + Math.pow(count / total, 2) * 220
          setTimeout(step, delay)
        }
        step()

      } else {
        // Show cycling brand names, land on the correct one
        slotText.classList.remove('hidden')
        const names = shuffle(LOGO_POOL.map(l => l.name))
        let count = 0
        const total = 12

        const step = () => {
          if (count >= total) {
            slotText.textContent = q.correct.name
            slotText.style.color = 'var(--warning)'
            slotText.style.opacity = '1'
            label.textContent = '← Find the right logo'
            setTimeout(resolve, 420)
            return
          }
          slotText.textContent = names[count % names.length]
          slotText.style.opacity = count < 8 ? '0.35' : '0.7'
          slotText.style.color = 'var(--text)'
          count++
          const delay = 60 + Math.pow(count / total, 2) * 200
          setTimeout(step, delay)
        }
        step()
      }
    })
  }

  // ── Show question ──────────────────────────────────────────────────────────

  function showQuestion(q) {
    showStage('question')
    state.answering = true

    // Mode badge
    $('mode-badge').textContent = q.mode === 'logo-to-name' ? '🏷️ Name this brand' : '🖼️ Pick the right logo'

    // Prompt
    const prompt = $('prompt')
    prompt.innerHTML = ''
    if (q.mode === 'logo-to-name') {
      const img    = document.createElement('img')
      img.src      = logoUrl(q.correct.domain, CONFIG.logoSize)
      img.className = 'prompt-logo'
      img.alt       = 'Brand logo'
      prompt.appendChild(img)
    } else {
      const span       = document.createElement('span')
      span.className   = 'prompt-name'
      span.textContent = q.correct.name
      prompt.appendChild(span)
    }

    // Options
    const container = $('options')
    container.innerHTML = ''
    container.className = `options ${q.mode === 'name-to-logo' ? 'options-logo' : 'options-text'}`
    const labels = ['A', 'B', 'C']

    q.options.forEach((opt, i) => {
      const card      = document.createElement('button')
      card.className  = 'option-card'
      card.dataset.index = i

      if (q.mode === 'logo-to-name') {
        card.innerHTML = `
          <span class="opt-key">${labels[i]}</span>
          <span class="opt-text">${opt.name}</span>
        `
      } else {
        card.innerHTML = `
          <span class="opt-key">${labels[i]}</span>
          <div class="opt-logo-wrap">
            <img src="${logoUrl(opt.domain, CONFIG.optLogoSize)}" alt="${opt.name}" class="opt-logo" />
          </div>
          <span class="opt-name-hint">${opt.name}</span>
        `
      }

      card.addEventListener('click', () => handleAnswer(i))
      card.addEventListener('touchend', e => { e.preventDefault(); handleAnswer(i) })
      container.appendChild(card)
    })

    // Start timer + voice
    startTimer(q)
    SPEECH.listen(q, handleVoiceAnswer)
    updateHUD()
  }

  // ── Timer ──────────────────────────────────────────────────────────────────

  function startTimer(q) {
    stopTimer()
    state.timerStart = performance.now()
    const duration   = CONFIG.timePerQuestion * 1000
    const arc        = $('timer-arc')
    const numEl      = $('timer-number')
    let lastWhole    = CONFIG.timePerQuestion

    function tick(now) {
      const elapsed   = now - state.timerStart
      const remaining = Math.max(0, duration - elapsed)
      const secs      = remaining / 1000
      const progress  = secs / CONFIG.timePerQuestion          // 1 → 0

      // SVG arc
      arc.style.strokeDashoffset = CIRC * (1 - progress)

      // Number
      const whole = Math.ceil(secs)
      numEl.textContent = whole

      // Colour transitions: green → yellow → red
      const hue = Math.round(progress * 120)   // 120 (green) → 0 (red)
      const col = `hsl(${hue}, 90%, 55%)`
      arc.style.stroke  = col
      numEl.style.color = col

      // Tick sound at each second boundary
      if (whole < lastWhole && whole > 0) {
        lastWhole = whole
        AUDIO.tick(secs < 2.5)
      }

      if (remaining <= 0) {
        timeOut(q)
        return
      }

      state.rafId = requestAnimationFrame(tick)
    }

    state.rafId = requestAnimationFrame(tick)
  }

  function stopTimer() {
    if (state.rafId) { cancelAnimationFrame(state.rafId); state.rafId = null }
  }

  function timeOut(q) {
    if (!state.answering) return
    state.answering = false
    SPEECH.stop()
    stopTimer()
    AUDIO.wrong()
    revealAnswer(q, -1, 0)
  }

  // ── Answer handling ────────────────────────────────────────────────────────

  function handleAnswer(idx) {
    if (!state.answering) return
    state.answering = false
    SPEECH.stop()
    stopTimer()

    const elapsed = performance.now() - state.timerStart
    const secsUsed = Math.min(CONFIG.timePerQuestion, elapsed / 1000)
    const secsLeft = CONFIG.timePerQuestion - secsUsed
    const q        = state.questions[state.current]
    const correct  = idx === q.correctIndex
    const points   = correct ? Math.max(1, Math.ceil(secsLeft)) : 0

    if (correct) { AUDIO.correct(); state.score += points }
    else         { AUDIO.wrong() }

    revealAnswer(q, idx, points, secsUsed)
  }

  function handleVoiceAnswer(idx) { handleAnswer(idx) }

  function revealAnswer(q, chosenIdx, points, secsUsed = CONFIG.timePerQuestion) {
    document.querySelectorAll('.option-card').forEach((card, i) => {
      card.disabled = true
      if      (i === q.correctIndex)                              card.classList.add('correct')
      else if (i === chosenIdx && chosenIdx !== q.correctIndex)   card.classList.add('wrong')
      else                                                        card.classList.add('dim')
    })

    if (points > 0) showScorePop(points)

    state.answers.push({
      logo:         q.correct,
      mode:         q.mode,
      correct:      chosenIdx === q.correctIndex,
      pointsEarned: points,
      timeUsed:     secsUsed,
      timedOut:     chosenIdx === -1,
    })

    updateHUD()

    setTimeout(() => {
      state.current++
      nextQuestion()
    }, CONFIG.revealDuration)
  }

  // ── Score pop ──────────────────────────────────────────────────────────────

  function showScorePop(points) {
    const el       = document.createElement('div')
    el.className   = 'score-pop'
    el.textContent = `+${points}`
    $('score-display').parentElement.appendChild(el)
    setTimeout(() => el.remove(), 900)
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function updateHUD() {
    $('q-counter').textContent    = `Q ${Math.min(state.current + 1, CONFIG.questionsPerGame)} / ${CONFIG.questionsPerGame}`
    $('score-display').textContent = state.score
  }

  // ── End game ──────────────────────────────────────────────────────────────

  function endGame() {
    AUDIO.end(state.score)
    saveToHistory()
    renderResults()
    showScreen('results')
  }

  function renderResults() {
    const rank = getRank(state.score)
    $('rank-badge').innerHTML  = `${rank.emoji} ${rank.label}`
    $('rank-badge').style.color = rank.color
    $('final-score').textContent = state.score

    const correctCount = state.answers.filter(a => a.correct).length
    const totalTime    = state.answers.reduce((s, a) => s + a.timeUsed, 0)
    const avgTime      = (totalTime / state.answers.length).toFixed(1)

    $('result-stats').innerHTML = `
      <span>${correctCount}/${CONFIG.questionsPerGame} correct</span>
      <span>Avg ${avgTime}s per answer</span>
    `

    $('breakdown').innerHTML = state.answers.map((a, i) => `
      <div class="br-row ${a.correct ? 'br-correct' : 'br-wrong'}">
        <span class="br-num">Q${i + 1}</span>
        <img src="${logoUrl(a.logo.domain, 28)}" class="br-logo" alt="${a.logo.name}" />
        <span class="br-name">${a.logo.name}</span>
        <span class="br-mode">${a.mode === 'logo-to-name' ? '🏷️' : '🖼️'}</span>
        <span class="br-time">${a.timedOut ? 'timeout' : `${a.timeUsed.toFixed(1)}s`}</span>
        <span class="br-pts">${a.correct ? `<strong>+${a.pointsEarned}</strong>` : '—'}</span>
      </div>
    `).join('')
  }

  // ── History ───────────────────────────────────────────────────────────────

  function getHistory() {
    try { return JSON.parse(localStorage.getItem('logoquiz_history') || '[]') } catch { return [] }
  }

  function saveToHistory() {
    const h = getHistory()
    h.unshift({
      date:    new Date().toISOString(),
      score:   state.score,
      rank:    getRank(state.score).label,
      answers: state.answers,
    })
    localStorage.setItem('logoquiz_history', JSON.stringify(h.slice(0, CONFIG.maxHistory)))
  }

  function renderHistory() {
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

    list.innerHTML = h.map((g, gi) => {
      const rank       = getRank(g.score)
      const date       = new Date(g.date)
      const dateStr    = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      const timeStr    = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      const correct    = g.answers.filter(a => a.correct).length
      const avgSecs    = (g.answers.reduce((s, a) => s + a.timeUsed, 0) / g.answers.length).toFixed(1)

      const rows = g.answers.map((a, qi) => `
        <div class="hd-row ${a.correct ? 'hd-ok' : 'hd-fail'}">
          <span class="hd-q">Q${qi + 1}</span>
          <span class="hd-name">${a.logo.name}</span>
          <span class="hd-mode">${a.mode === 'logo-to-name' ? '🏷️' : '🖼️'}</span>
          <span class="hd-time">${a.timedOut ? 'timeout' : `${a.timeUsed.toFixed(1)}s`}</span>
          <span class="hd-pts">${a.correct ? `+${a.pointsEarned}` : '✗'}</span>
        </div>`).join('')

      return `
        <details class="history-card">
          <summary class="history-summary">
            <span class="hs-emoji">${rank.emoji}</span>
            <div class="hs-info">
              <div class="hs-score">${g.score} pts — <em>${rank.label}</em></div>
              <div class="hs-meta">${dateStr} · ${timeStr} · ${correct}/10 correct · avg ${avgSecs}s</div>
            </div>
            <span class="hs-arrow">›</span>
          </summary>
          <div class="history-detail">${rows}</div>
        </details>`
    }).join('')

    showScreen('history')
  }

  // ── Start screen ──────────────────────────────────────────────────────────

  function updateBestScore() {
    const h  = getHistory()
    const el = $('best-score')
    if (!h.length) { el.textContent = ''; return }
    const best = Math.max(...h.map(g => g.score))
    const rank = getRank(best)
    el.innerHTML = `Best: <strong>${best}</strong> pts ${rank.emoji}`
  }

  function initLogoParade() {
    const parade  = $('logo-parade')
    const sample  = shuffle([...LOGO_POOL]).slice(0, 10)
    parade.innerHTML = sample.map(l =>
      `<div class="parade-item">
        <img src="${logoUrl(l.domain, 56)}" alt="${l.name}" loading="lazy" />
       </div>`
    ).join('')
  }

  // ── Event wiring ──────────────────────────────────────────────────────────

  $('btn-play').addEventListener('click', startGame)
  $('btn-history').addEventListener('click', renderHistory)
  $('btn-play-again').addEventListener('click', startGame)
  $('btn-results-history').addEventListener('click', renderHistory)
  $('btn-history-back').addEventListener('click', () => {
    if (state.answers.length === CONFIG.questionsPerGame) {
      renderResults()
      showScreen('results')
    } else {
      showScreen('start')
      updateBestScore()
    }
  })

  // Keyboard input (A/B/C or 1/2/3)
  document.addEventListener('keydown', e => {
    if (state.screen !== 'game' || !state.answering) return
    const map = { '1': 0, a: 0, A: 0, '2': 1, b: 1, B: 1, '3': 2, c: 2, C: 2 }
    if (map[e.key] !== undefined) handleAnswer(map[e.key])
  })

  // ── Boot ──────────────────────────────────────────────────────────────────

  initLogoParade()
  updateBestScore()

})()

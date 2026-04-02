// ── Logo Quiz — Game Engine ────────────────────────────────────────────────────
;(function () {

  const CIRC = 2 * Math.PI * 45   // SVG timer circle circumference ≈ 282.74

  // ── State ──────────────────────────────────────────────────────────────────

  const state = {
    screen:      'start',
    pack:        'brands',   // 'brands' | 'disney'
    disneyPool:  [],
    questions:   [],
    current:     0,
    score:       0,
    answers:     [],
    answering:   false,
    rafId:       null,
    timerStart:  null,
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

  function generateBrandQuestions() {
    const pool     = shuffle([...LOGO_POOL])
    const selected = pool.slice(0, CONFIG.questionsPerGame)
    return selected.map(correct => {
      const mode    = Math.random() > 0.5 ? 'logo-to-name' : 'name-to-logo'
      const others  = shuffle(pool.filter(l => l.domain !== correct.domain)).slice(0, 2)
      const options = shuffle([correct, ...others])
      return { pack: 'brands', correct, mode, options, correctIndex: options.indexOf(correct) }
    })
  }

  function generateDisneyQuestions(pool) {
    const films   = DISNEY.allFilms(pool)
    const selected = shuffle([...pool]).slice(0, CONFIG.questionsPerGame)

    return selected.map(correct => {
      const hasFilms  = correct.films && correct.films.length > 0
      const modePool  = ['image-to-name', 'name-to-image']
      if (hasFilms && films.length >= 3) modePool.push('image-to-film')
      const mode = modePool[Math.floor(Math.random() * modePool.length)]

      if (mode === 'image-to-film') {
        const correctFilm = correct.films[0]
        const wrongFilms  = shuffle(films.filter(f => f !== correctFilm)).slice(0, 2)
        const opts = shuffle([correctFilm, ...wrongFilms])
        return {
          pack: 'disney', correct, mode,
          options: opts,
          correctIndex: opts.indexOf(correctFilm),
        }
      }

      const others  = shuffle(pool.filter(c => c._id !== correct._id)).slice(0, 2)
      const options = shuffle([correct, ...others])
      return { pack: 'disney', correct, mode, options, correctIndex: options.indexOf(correct) }
    })
  }

  // ── Game lifecycle ─────────────────────────────────────────────────────────

  async function startGame(pack) {
    AUDIO.resume()
    state.pack     = pack || 'brands'
    state.current  = 0
    state.score    = 0
    state.answers  = []
    state.questions = []

    if (state.pack === 'disney') {
      showScreen('loading')
      $('loading-msg').textContent = 'Fetching Disney characters…'
      $('loading-bar-fill').style.width = '0%'

      try {
        const pool = await DISNEY.loadPool(pct => {
          $('loading-bar-fill').style.width = pct + '%'
          $('loading-msg').textContent = `Loading… ${pct}%`
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

    updateHUD()
    showScreen('game')
    setTimeout(nextQuestion, 250)
  }

  // ── Question flow ──────────────────────────────────────────────────────────

  async function nextQuestion() {
    if (state.current >= CONFIG.questionsPerGame) { endGame(); return }
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

    slotImg.classList.add('hidden')
    slotText.classList.add('hidden')
    slotImg.style.filter = ''
    slotText.style.color = ''
    label.textContent = 'Get ready…'

    const showsImage = ['logo-to-name', 'image-to-name', 'image-to-film'].includes(q.mode)

    return new Promise(resolve => {
      if (showsImage) {
        slotImg.classList.remove('hidden')
        const targetSrc = q.pack === 'disney'
          ? DISNEY.imgUrl(q.correct.imageUrl, 400)
          : logoUrl(q.correct.domain, CONFIG.logoSize)

        // Build a pool of random images for cycling
        const cyclePool = q.pack === 'disney'
          ? shuffle([...state.disneyPool]).slice(0, 20).map(c => DISNEY.imgUrl(c.imageUrl, 200))
          : shuffle([...LOGO_POOL]).slice(0, 20).map(c => logoUrl(c.domain, CONFIG.logoSize))

        let count = 0
        const total = 14
        const step = () => {
          if (count >= total) {
            slotImg.src = targetSrc
            slotImg.style.filter = 'none'
            slotImg.style.transform = 'scale(1.08)'
            label.textContent = q.mode === 'image-to-film'
              ? `← Which film is ${q.correct.name} from?`
              : q.pack === 'disney' ? '← Name this character' : '← Name this brand'
            setTimeout(() => { slotImg.style.transform = 'scale(1)'; resolve() }, 420)
            return
          }
          slotImg.src = cyclePool[count % cyclePool.length]
          slotImg.style.filter = count < 9 ? 'blur(3px) brightness(0.6)' : count < 12 ? 'blur(1px)' : 'none'
          count++
          setTimeout(step, 55 + Math.pow(count / total, 2) * 220)
        }
        step()

      } else {
        // Text shuffle (name-to-logo or name-to-image)
        slotText.classList.remove('hidden')
        const namePool = q.pack === 'disney'
          ? shuffle([...state.disneyPool]).map(c => c.name)
          : shuffle([...LOGO_POOL]).map(c => c.name)

        let count = 0
        const total = 12
        const step = () => {
          if (count >= total) {
            slotText.textContent = q.correct.name
            slotText.style.color = 'var(--warning)'
            label.textContent = q.pack === 'disney' ? '← Find the character' : '← Find the logo'
            setTimeout(resolve, 420)
            return
          }
          slotText.textContent = namePool[count % namePool.length]
          slotText.style.opacity = count < 8 ? '0.35' : '0.7'
          slotText.style.color = 'var(--text)'
          count++
          setTimeout(step, 60 + Math.pow(count / total, 2) * 200)
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

      // For film mode, also show the character name
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
    const labels = ['A', 'B', 'C']

    // Determine if options should be shown as images or text
    const optAsImage = q.mode === 'name-to-logo' || q.mode === 'name-to-image'
    const disneyClass = q.pack === 'disney' ? ' disney' : ''
    container.className = `options ${optAsImage ? 'options-logo' + disneyClass : 'options-text'}`

    q.options.forEach((opt, i) => {
      const card     = document.createElement('button')
      card.className = 'option-card'
      card.dataset.index = i

      if (optAsImage) {
        // Image option card
        const imgSrc = q.pack === 'disney'
          ? DISNEY.imgUrl(opt.imageUrl, 280)
          : logoUrl(opt.domain, CONFIG.optLogoSize)
        const altTxt = q.pack === 'disney' ? opt.name : opt.name
        card.innerHTML = `
          <div class="opt-logo-wrap">
            <img src="${imgSrc}" alt="${altTxt}" class="opt-logo" />
          </div>
          <span class="opt-key">${labels[i]}</span>
        `
      } else {
        // Text option card
        const text = q.mode === 'image-to-film'
          ? opt                  // opt is already a string (film name)
          : opt.name             // opt is a character/brand object
        card.innerHTML = `
          <span class="opt-key">${labels[i]}</span>
          <span class="opt-text">${text}</span>
        `
      }

      card.addEventListener('click', () => handleAnswer(i))
      card.addEventListener('touchend', e => { e.preventDefault(); handleAnswer(i) })
      container.appendChild(card)
    })

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
      const progress  = secs / CONFIG.timePerQuestion

      arc.style.strokeDashoffset = CIRC * (1 - progress)
      const whole = Math.ceil(secs)
      numEl.textContent = whole

      const hue = Math.round(progress * 120)
      const col = `hsl(${hue}, 90%, 55%)`
      arc.style.stroke  = col
      numEl.style.color = col

      if (whole < lastWhole && whole > 0) {
        lastWhole = whole
        AUDIO.tick(secs < 2.5)
      }

      if (remaining <= 0) { timeOut(q); return }
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

    const elapsed  = performance.now() - state.timerStart
    const secsUsed = Math.min(CONFIG.timePerQuestion, elapsed / 1000)
    const secsLeft = CONFIG.timePerQuestion - secsUsed
    const q        = state.questions[state.current]
    const correct  = idx === q.correctIndex
    const points   = correct ? Math.max(0, Math.floor(secsLeft)) : 0

    if (correct) { AUDIO.correct(); state.score += points }
    else         { AUDIO.wrong() }

    revealAnswer(q, idx, points, secsUsed)
  }

  function handleVoiceAnswer(idx) { handleAnswer(idx) }

  function revealAnswer(q, chosenIdx, points, secsUsed = CONFIG.timePerQuestion) {
    document.querySelectorAll('.option-card').forEach((card, i) => {
      card.disabled = true
      if      (i === q.correctIndex)                             card.classList.add('correct')
      else if (i === chosenIdx && chosenIdx !== q.correctIndex)  card.classList.add('wrong')
      else                                                       card.classList.add('dim')
    })

    if (points > 0) showScorePop(points)

    state.answers.push({
      pack:         q.pack,
      correct:      chosenIdx === q.correctIndex,
      pointsEarned: points,
      timeUsed:     secsUsed,
      timedOut:     chosenIdx === -1,
      mode:         q.mode,
      // brand fields
      logo:         q.pack === 'brands'  ? q.correct : null,
      // disney fields
      char:         q.pack === 'disney'  ? q.correct : null,
      film:         q.mode === 'image-to-film'
        ? (typeof q.options[q.correctIndex] === 'string' ? q.options[q.correctIndex] : '')
        : null,
    })

    updateHUD()
    setTimeout(() => { state.current++; nextQuestion() }, CONFIG.revealDuration)
  }

  // ── Score pop ──────────────────────────────────────────────────────────────

  function showScorePop(points) {
    const el     = document.createElement('div')
    el.className = 'score-pop'
    el.textContent = `+${points}`
    $('score-display').parentElement.appendChild(el)
    setTimeout(() => el.remove(), 900)
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function updateHUD() {
    $('q-counter').textContent     = `Q ${Math.min(state.current + 1, CONFIG.questionsPerGame)} / ${CONFIG.questionsPerGame}`
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
    $('rank-badge').innerHTML   = `${rank.emoji} ${rank.label}`
    $('rank-badge').style.color = rank.color
    $('final-score').textContent = state.score

    const correctCount = state.answers.filter(a => a.correct).length
    const avgTime      = (state.answers.reduce((s, a) => s + a.timeUsed, 0) / state.answers.length).toFixed(1)

    $('result-stats').innerHTML = `
      <span>${correctCount}/${CONFIG.questionsPerGame} correct</span>
      <span>Avg ${avgTime}s per answer</span>
    `

    $('breakdown').innerHTML = state.answers.map((a, i) => {
      const label = a.pack === 'disney' ? a.char.name : a.logo.name
      const imgSrc = a.pack === 'disney'
        ? DISNEY.imgUrl(a.char.imageUrl, 56)
        : logoUrl(a.logo.domain, 28)
      const modeLbl = { 'logo-to-name':'🏷️','name-to-logo':'🖼️','image-to-name':'🎭','name-to-image':'🖼️','image-to-film':'🎬' }[a.mode] || ''
      const detail  = a.mode === 'image-to-film' ? ` → ${a.film}` : ''

      return `
        <div class="br-row ${a.correct ? 'br-correct' : 'br-wrong'}">
          <span class="br-num">Q${i + 1}</span>
          <img src="${imgSrc}" class="br-logo" alt="${label}" />
          <span class="br-name">${label}${detail}</span>
          <span class="br-mode">${modeLbl}</span>
          <span class="br-time">${a.timedOut ? 'timeout' : `${a.timeUsed.toFixed(1)}s`}</span>
          <span class="br-pts">${a.correct ? `<strong>+${a.pointsEarned}</strong>` : '—'}</span>
        </div>`
    }).join('')
  }

  // ── History ───────────────────────────────────────────────────────────────

  function getHistory() {
    try { return JSON.parse(localStorage.getItem('logoquiz_history') || '[]') } catch { return [] }
  }

  function saveToHistory() {
    const h = getHistory()
    h.unshift({ date: new Date().toISOString(), score: state.score, pack: state.pack, rank: getRank(state.score).label, answers: state.answers })
    localStorage.setItem('logoquiz_history', JSON.stringify(h.slice(0, CONFIG.maxHistory)))
  }

  function renderHistory() {
    const h    = getHistory()
    const list = $('history-list')

    if (!h.length) {
      list.innerHTML = `<div class="empty-history"><div class="empty-icon">🎮</div><p>No rounds played yet.</p><p class="empty-sub">Play your first game to see stats here.</p></div>`
      showScreen('history'); return
    }

    list.innerHTML = h.map((g) => {
      const rank      = getRank(g.score)
      const date      = new Date(g.date)
      const dateStr   = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      const timeStr   = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      const correct   = g.answers.filter(a => a.correct).length
      const avgSecs   = (g.answers.reduce((s, a) => s + a.timeUsed, 0) / g.answers.length).toFixed(1)
      const packBadge = g.pack === 'disney' ? '🏰' : '🏢'

      const rows = g.answers.map((a, qi) => {
        const name = a.pack === 'disney' ? (a.char?.name || '?') : (a.logo?.name || '?')
        const modeLbl = { 'logo-to-name':'🏷️','name-to-logo':'🖼️','image-to-name':'🎭','name-to-image':'🖼️','image-to-film':'🎬' }[a.mode] || ''
        return `<div class="hd-row ${a.correct ? 'hd-ok' : 'hd-fail'}">
          <span class="hd-q">Q${qi+1}</span>
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
              <div class="hs-score">${packBadge} ${g.score} pts — <em>${rank.label}</em></div>
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
    el.innerHTML = `Best: <strong>${best}</strong> pts ${getRank(best).emoji}`
  }

  function initLogoParade() {
    const parade = $('logo-parade')
    const sample = shuffle([...LOGO_POOL]).slice(0, 10)
    parade.innerHTML = sample.map(l =>
      `<div class="parade-item"><img src="${logoUrl(l.domain, 56)}" alt="${l.name}" loading="lazy" /></div>`
    ).join('')
  }

  // ── Event wiring ──────────────────────────────────────────────────────────

  $('btn-brands').addEventListener('click', () => startGame('brands'))
  $('btn-disney').addEventListener('click', () => startGame('disney'))
  $('btn-history').addEventListener('click', renderHistory)
  $('btn-play-again').addEventListener('click', () => startGame(state.pack))
  $('btn-switch-pack').addEventListener('click', () => { showScreen('start'); updateBestScore() })
  $('btn-home').addEventListener('click', () => { showScreen('start'); updateBestScore() })
  $('btn-results-history').addEventListener('click', renderHistory)
  $('btn-history-back').addEventListener('click', () => {
    if (state.answers.length === CONFIG.questionsPerGame) { renderResults(); showScreen('results') }
    else { showScreen('start'); updateBestScore() }
  })

  // Volume control
  const volSlider = $('volume-slider')
  const volBtn    = $('btn-volume')
  const volPanel  = $('volume-panel')

  if (volSlider) {
    volSlider.value = AUDIO.getVolume()
    volSlider.addEventListener('input', () => AUDIO.setVolume(parseFloat(volSlider.value)))
  }
  if (volBtn) {
    volBtn.addEventListener('click', e => {
      e.stopPropagation()
      volPanel.classList.toggle('hidden')
    })
  }
  document.addEventListener('click', () => { if (volPanel) volPanel.classList.add('hidden') })

  document.addEventListener('keydown', e => {
    if (state.screen !== 'game' || !state.answering) return
    const map = { '1': 0, a: 0, A: 0, '2': 1, b: 1, B: 1, '3': 2, c: 2, C: 2 }
    if (map[e.key] !== undefined) handleAnswer(map[e.key])
  })

  // ── Boot ──────────────────────────────────────────────────────────────────

  initLogoParade()
  updateBestScore()

})()

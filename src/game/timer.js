// ── Timer — requestAnimationFrame loop ────────────────────────────────────────
import { $, }     from '../ui/screens.js'
import { CONFIG } from '../config.js'
import { AUDIO }  from '../utils/audio.js'

const CIRC = 2 * Math.PI * 45   // SVG timer circle circumference ≈ 282.74

let rafId      = null
let timerStart = null

export function getTimerStart() { return timerStart }

export function startTimer(q, onTimeout) {
  stopTimer()
  timerStart = performance.now()
  const duration = CONFIG.timePerQuestion * 1000
  const arc      = $('timer-arc')
  const numEl    = $('timer-number')
  let lastWhole  = CONFIG.timePerQuestion

  function tick(now) {
    const elapsed   = now - timerStart
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

    if (remaining <= 0) { onTimeout(q); return }
    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
}

export function stopTimer() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
}

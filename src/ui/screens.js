// ── Screen management + DOM helpers ──────────────────────────────────────────
import { CONFIG } from '../config.js'

export function $(id) {
  return document.getElementById(id)
}

export function logoUrl(domain, size) {
  return `https://img.logo.dev/${domain}?token=${CONFIG.token}&size=${size ?? CONFIG.logoSize}&format=png`
}

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active')
    s.classList.add('leaving')
  })
  setTimeout(() => {
    document.querySelectorAll('.screen.leaving').forEach(s => s.classList.remove('leaving'))
    $('screen-' + id).classList.add('active')
  }, 180)
}

export function showStage(id) {
  $('shuffle-stage').classList.toggle('hidden', id !== 'shuffle')
  $('question-stage').classList.toggle('hidden', id !== 'question')
}

export function showScorePop(points) {
  const el       = document.createElement('div')
  el.className   = 'score-pop'
  el.textContent = `+${points}`
  $('score-display').parentElement.appendChild(el)
  setTimeout(() => el.remove(), 900)
}

export function updateHUD(current, score, questionsPerGame) {
  $('q-counter').textContent     = `Q ${Math.min(current + 1, questionsPerGame)} / ${questionsPerGame}`
  $('score-display').textContent = score
}

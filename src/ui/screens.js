// ── Screen management + DOM helpers ──────────────────────────────────────────
import { CONFIG } from '../config.js'

export const LOGO_ASSET_VERSION = 'v1'
export const LOGO_STORAGE_BASE = 'https://xbcwbzsgvmerkbnnplep.supabase.co/storage/v1/object/public/logo-game-logos'
export const PACK_LABELS = {
  brands: 'Mix Brands',
  travel: 'Travel & Adventure',
  'tech-car': 'Tech & Car',
  'fashion-finance': 'Fashion & Finance',
}

export function $(id) {
  return document.getElementById(id)
}

export function logoStorageUrl(domain) {
  return `${LOGO_STORAGE_BASE}/${LOGO_ASSET_VERSION}/${domain}.png`
}

export function logoDevUrl(domain, size) {
  return `https://img.logo.dev/${domain}?token=${CONFIG.token}&size=${size ?? CONFIG.logoSize}&format=png`
}

export function logoFallbackUrl(domain, size) {
  return logoDevUrl(domain, size)
}

export function logoUrl(domain, size) {
  return CONFIG.logoStorageEnabled ? logoStorageUrl(domain) : logoDevUrl(domain, size)
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

export function updateHUD(current, score, questionsPerGame, pack = 'brands') {
  $('q-counter').textContent     = `Q ${Math.min(current + 1, questionsPerGame)} / ${questionsPerGame}`
  $('score-display').textContent = score
  $('hud-pack-label').textContent = PACK_LABELS[pack] || 'Mix Brands'
}

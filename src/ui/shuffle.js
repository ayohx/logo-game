// ── Slot-machine shuffle animation ───────────────────────────────────────────
import { $, logoUrl, showStage } from './screens.js'
import { CONFIG }                from '../config.js'
import { prefersReducedMotion } from '../utils/helpers.js'

export function runShuffle(q) {
  showStage('shuffle')
  const slotImg  = $('shuffle-img')
  const slotText = $('shuffle-text-name')
  const label    = $('shuffle-label')

  slotImg.classList.add('hidden')
  slotText.classList.add('hidden')
  slotImg.style.filter = ''
  slotText.style.color = ''
  label.textContent = 'Get ready…'

  const showsImage = q.mode === 'logo-to-name'
  const reducedMotion = prefersReducedMotion()

  return new Promise(resolve => {
    if (reducedMotion) {
      if (showsImage) {
        slotImg.classList.remove('hidden')
        slotImg.src = logoUrl(q.correct.domain, CONFIG.logoSize)
        slotImg.style.filter = 'none'
        label.textContent = 'Name this brand'
        setTimeout(() => resolve(), 120)
      } else {
        slotText.classList.remove('hidden')
        slotText.textContent = q.correct.name
        slotText.style.opacity = '1'
        label.textContent = 'Find the logo'
        setTimeout(() => resolve(), 120)
      }
      return
    }

    if (showsImage) {
      slotImg.classList.remove('hidden')
      const targetSrc  = logoUrl(q.correct.domain, CONFIG.logoSize)

      slotImg.src = targetSrc
      slotImg.style.filter = 'blur(3px) brightness(0.72)'
      slotImg.style.transform = 'scale(0.92)'
      label.textContent = 'Loading logo...'
      setTimeout(() => {
        slotImg.style.filter = 'none'
        slotImg.style.transform = 'scale(1.08)'
        label.textContent = '← Name this brand'
        setTimeout(() => { slotImg.style.transform = 'scale(1)'; resolve() }, 360)
      }, 500)

    } else {
      // Text shuffle (name-to-logo)
      slotText.classList.remove('hidden')
      const namePool = q.options.map(c => c.name)

      let count = 0
      const total = 12
      const step = () => {
        if (count >= total) {
          slotText.textContent  = q.correct.name
          slotText.style.color  = 'var(--warning)'
          label.textContent     = '← Find the logo'
          setTimeout(resolve, 420)
          return
        }
        slotText.textContent  = namePool[count % namePool.length]
        slotText.style.opacity = count < 8 ? '0.35' : '0.7'
        slotText.style.color   = 'var(--text)'
        count++
        setTimeout(step, 60 + Math.pow(count / total, 2) * 200)
      }
      step()
    }
  })
}

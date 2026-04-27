// ── Slot-machine shuffle animation ───────────────────────────────────────────
import { $, logoUrl, showStage } from './screens.js'
import { LOGO_POOL }             from '../data/brands.js'
import { CONFIG }                from '../config.js'
import { shuffle }               from '../utils/helpers.js'

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

  return new Promise(resolve => {
    if (showsImage) {
      slotImg.classList.remove('hidden')
      const targetSrc  = logoUrl(q.correct.domain, CONFIG.logoSize)
      const cyclePool  = shuffle([...LOGO_POOL]).slice(0, 20).map(c => logoUrl(c.domain, CONFIG.logoSize))

      let count = 0
      const total = 14
      const step = () => {
        if (count >= total) {
          slotImg.src = targetSrc
          slotImg.style.filter    = 'none'
          slotImg.style.transform = 'scale(1.08)'
          label.textContent = '← Name this brand'
          setTimeout(() => { slotImg.style.transform = 'scale(1)'; resolve() }, 420)
          return
        }
        slotImg.src          = cyclePool[count % cyclePool.length]
        slotImg.style.filter = count < 9 ? 'blur(3px) brightness(0.6)' : count < 12 ? 'blur(1px)' : 'none'
        count++
        setTimeout(step, 55 + Math.pow(count / total, 2) * 220)
      }
      step()

    } else {
      // Text shuffle (name-to-logo)
      slotText.classList.remove('hidden')
      const namePool = shuffle([...LOGO_POOL]).map(c => c.name)

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

// ── Slot-machine shuffle animation ───────────────────────────────────────────
import { $, logoUrl, showStage } from './screens.js'
import { DISNEY }                from '../data/disney.js'
import { LOGO_POOL }             from '../data/brands.js'
import { CONFIG }                from '../config.js'
import { shuffle }               from '../utils/helpers.js'

export function runShuffle(q, disneyPool) {
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

      const cyclePool = q.pack === 'disney'
        ? shuffle([...disneyPool]).slice(0, 20).map(c => DISNEY.imgUrl(c.imageUrl, 200))
        : shuffle([...LOGO_POOL]).slice(0, 20).map(c => logoUrl(c.domain, CONFIG.logoSize))

      let count = 0
      const total = 14
      const step = () => {
        if (count >= total) {
          slotImg.src = targetSrc
          slotImg.style.filter    = 'none'
          slotImg.style.transform = 'scale(1.08)'
          label.textContent = q.mode === 'image-to-film'
            ? `← Which film is ${q.correct.name} from?`
            : q.pack === 'disney' ? '← Name this character' : '← Name this brand'
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
      // Text shuffle (name-to-logo or name-to-image)
      slotText.classList.remove('hidden')
      const namePool = q.pack === 'disney'
        ? shuffle([...disneyPool]).map(c => c.name)
        : shuffle([...LOGO_POOL]).map(c => c.name)

      let count = 0
      const total = 12
      const step = () => {
        if (count >= total) {
          slotText.textContent  = q.correct.name
          slotText.style.color  = 'var(--warning)'
          label.textContent     = q.pack === 'disney' ? '← Find the character' : '← Find the logo'
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

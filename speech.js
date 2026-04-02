// Web Speech API — voice input with graceful fallback
const SPEECH = (() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return { listen() {}, stop() {}, supported: false }

  const rec = new SpeechRecognition()
  rec.continuous    = false
  rec.interimResults = false
  rec.lang          = 'en-US'
  rec.maxAlternatives = 3

  let onResult = null

  rec.onresult = (e) => {
    if (!onResult) return
    const transcripts = Array.from(e.results[0]).map(r => r.transcript.trim().toLowerCase())

    for (const text of transcripts) {
      // Match "A", "B", "C", "1", "2", "3"
      if (/^[a1]$/.test(text)) { onResult(0); return }
      if (/^[b2]$/.test(text)) { onResult(1); return }
      if (/^[c3]$/.test(text)) { onResult(2); return }

      // Match brand name against options — check which option index the spoken word best matches
      if (window._currentOptions) {
        const idx = window._currentOptions.findIndex(opt =>
          opt.name.toLowerCase().includes(text) || text.includes(opt.name.toLowerCase())
        )
        if (idx !== -1) { onResult(idx); return }
      }
    }
  }

  rec.onerror = () => {}

  return {
    supported: true,

    listen(q, callback) {
      // Store options globally so onresult can check brand names
      window._currentOptions = q.options
      onResult = callback

      const indicator = document.getElementById('voice-indicator')
      if (indicator) indicator.classList.remove('hidden')

      try { rec.start() } catch {}
    },

    stop() {
      onResult = null
      window._currentOptions = null
      const indicator = document.getElementById('voice-indicator')
      if (indicator) indicator.classList.add('hidden')
      try { rec.stop() } catch {}
    },
  }
})()

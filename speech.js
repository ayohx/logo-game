// Web Speech API — voice input with mic activity state exposed
const SPEECH = (() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return { listen() {}, stop() {}, supported: false, isListening: false }

  const rec = new SpeechRecognition()
  rec.continuous     = false
  rec.interimResults = false
  rec.lang           = 'en-US'
  rec.maxAlternatives = 3

  let onResult    = null
  let _listening  = false

  rec.onresult = (e) => {
    if (!onResult) return
    const transcripts = Array.from(e.results[0]).map(r => r.transcript.trim().toLowerCase())

    for (const text of transcripts) {
      if (/^[a1]$/.test(text)) { onResult(0); return }
      if (/^[b2]$/.test(text)) { onResult(1); return }
      if (/^[c3]$/.test(text)) { onResult(2); return }

      if (window._currentOptions) {
        const idx = window._currentOptions.findIndex(opt => {
          const name = typeof opt === 'string' ? opt : opt.name
          if (!name) return false
          return name.toLowerCase().includes(text) || text.includes(name.toLowerCase())
        })
        if (idx !== -1) { onResult(idx); return }
      }
    }
  }

  rec.onerror = () => { _listening = false; updateIndicator() }
  rec.onend   = () => { _listening = false; updateIndicator() }

  function updateIndicator() {
    const el = document.getElementById('mic-meter')
    if (el) el.classList.toggle('active', _listening)
    const vi = document.getElementById('voice-indicator')
    if (vi) vi.classList.toggle('hidden', !_listening)
  }

  return {
    supported: true,
    get isListening() { return _listening },

    listen(q, callback) {
      window._currentOptions = q.options
      onResult   = callback
      _listening = true
      updateIndicator()
      try { rec.start() } catch {}
    },

    stop() {
      onResult               = null
      window._currentOptions = null
      _listening             = false
      updateIndicator()
      try { rec.stop() } catch {}
    },
  }
})()

// Web Audio API — zero file dependencies
const AUDIO = (() => {
  let ctx = null

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    return ctx
  }

  function tone(freq, type, startTime, duration, gainVal = 0.3, ramp = true) {
    const c = getCtx()
    const osc  = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)

    osc.type      = type
    osc.frequency.setValueAtTime(freq, startTime)

    gain.gain.setValueAtTime(gainVal, startTime)
    if (ramp) gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    osc.start(startTime)
    osc.stop(startTime + duration + 0.02)
  }

  return {
    // Rising chime for correct
    correct() {
      const c = getCtx()
      const t = c.currentTime
      tone(523, 'sine', t,        0.12, 0.25)
      tone(659, 'sine', t + 0.10, 0.12, 0.25)
      tone(784, 'sine', t + 0.20, 0.20, 0.30)
    },

    // Descending buzz for wrong / timeout
    wrong() {
      const c = getCtx()
      const t = c.currentTime
      tone(300, 'sawtooth', t,        0.15, 0.20)
      tone(220, 'sawtooth', t + 0.12, 0.15, 0.20)
      tone(160, 'sawtooth', t + 0.24, 0.20, 0.15)
    },

    // Soft tick each second (urgent = louder + higher pitch)
    tick(urgent = false) {
      const c   = getCtx()
      const t   = c.currentTime
      const freq = urgent ? 880 : 440
      tone(freq, 'square', t, 0.04, urgent ? 0.12 : 0.06, true)
    },

    // End-of-game fanfare (score-scaled — higher score = more triumphant)
    end(score) {
      const c = getCtx()
      const t = c.currentTime
      if (score >= 35) {
        // Happy ascending fanfare
        const notes = [523, 659, 784, 1047]
        notes.forEach((f, i) => tone(f, 'sine', t + i * 0.12, 0.25, 0.28))
      } else {
        // Neutral two-tone
        tone(440, 'sine', t,        0.20, 0.22)
        tone(523, 'sine', t + 0.18, 0.22, 0.22)
      }
    },

    // Resume context after user gesture (browsers require this)
    resume() {
      if (ctx && ctx.state === 'suspended') ctx.resume()
    },
  }
})()

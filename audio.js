// ── Audio Engine — warm, musical feedback ────────────────────────────────────
const AUDIO = (() => {
  let ctx        = null
  let masterGain = null

  function getCtx() {
    if (!ctx) {
      ctx        = new (window.AudioContext || window.webkitAudioContext)()
      masterGain = ctx.createGain()
      masterGain.gain.value = parseFloat(localStorage.getItem('logoquiz_vol') ?? '0.7')
      masterGain.connect(ctx.destination)
    }
    return ctx
  }

  // Utility: schedule a sine tone through masterGain
  function sine(freq, startTime, duration, peakGain, detuneHz = 0) {
    const c   = getCtx()
    const osc = c.createOscillator()
    const g   = c.createGain()
    osc.connect(g)
    g.connect(masterGain)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq + detuneHz, startTime)

    // Smooth ADSR: quick attack, natural exponential decay
    g.gain.setValueAtTime(0, startTime)
    g.gain.linearRampToValueAtTime(peakGain, startTime + 0.018)
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    osc.start(startTime)
    osc.stop(startTime + duration + 0.02)
  }

  // Warm noise burst (for texture on wrong answer)
  function noiseBurst(startTime, duration, gain) {
    const c      = getCtx()
    const size   = c.sampleRate * duration
    const buffer = c.createBuffer(1, size, c.sampleRate)
    const data   = buffer.getChannelData(0)
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * 0.3

    const src    = c.createBufferSource()
    src.buffer   = buffer

    const bpf    = c.createBiquadFilter()
    bpf.type     = 'bandpass'
    bpf.frequency.value = 180
    bpf.Q.value  = 0.8

    const g      = c.createGain()
    src.connect(bpf)
    bpf.connect(g)
    g.connect(masterGain)

    g.gain.setValueAtTime(gain, startTime)
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
    src.start(startTime)
    src.stop(startTime + duration + 0.01)
  }

  return {
    // ── Correct: warm C-major arpeggio ──────────────────────────────────────
    correct() {
      const c = getCtx()
      const t = c.currentTime

      // C5 E5 G5 — slightly detuned for warmth
      sine(523.25, t + 0.00, 0.55, 0.22,  0)
      sine(659.25, t + 0.08, 0.50, 0.20,  1.5)
      sine(783.99, t + 0.16, 0.55, 0.24, -1)
      // Octave sparkle
      sine(1046.5, t + 0.22, 0.35, 0.12,  0)
    },

    // ── Wrong: soft descending thud ─────────────────────────────────────────
    wrong() {
      const c = getCtx()
      const t = c.currentTime

      // Low sine sweep down
      const osc = c.createOscillator()
      const g   = c.createGain()
      osc.connect(g)
      g.connect(masterGain)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, t)
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.28)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.30, t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
      osc.start(t)
      osc.stop(t + 0.35)

      // Subtle low noise texture
      noiseBurst(t, 0.20, 0.08)
    },

    // ── Tick: soft woodblock click ───────────────────────────────────────────
    tick(urgent = false) {
      const c = getCtx()
      const t = c.currentTime
      // Two very short sines — fundamental + 3rd harmonic = woody click
      sine(urgent ? 900  : 600,  t, urgent ? 0.055 : 0.040, urgent ? 0.14 : 0.07)
      sine(urgent ? 2700 : 1800, t, urgent ? 0.030 : 0.022, urgent ? 0.06 : 0.03)
    },

    // ── End fanfare: score-scaled melody ────────────────────────────────────
    end(score) {
      const c = getCtx()
      const t = c.currentTime

      if (score >= 35) {
        // Triumphant: C E G C (ascending, then chord)
        const melody = [523.25, 659.25, 783.99, 1046.5]
        melody.forEach((f, i) => sine(f, t + i * 0.11, 0.38, 0.22))
        // Final chord swell
        ;[523.25, 659.25, 783.99].forEach(f => sine(f, t + 0.44, 0.65, 0.18, 0))
      } else if (score >= 20) {
        // Neutral: C E G
        sine(523.25, t + 0.00, 0.35, 0.20)
        sine(659.25, t + 0.10, 0.35, 0.20)
        sine(783.99, t + 0.20, 0.45, 0.22)
      } else {
        // Low result: descending C A F
        sine(523.25, t + 0.00, 0.35, 0.18)
        sine(440.00, t + 0.12, 0.35, 0.16)
        sine(349.23, t + 0.24, 0.45, 0.18)
      }
    },

    // ── Volume control ───────────────────────────────────────────────────────
    setVolume(v) {
      const vol = Math.max(0, Math.min(1, v))
      if (masterGain) masterGain.gain.value = vol
      localStorage.setItem('logoquiz_vol', String(vol))
    },

    getVolume() {
      return masterGain ? masterGain.gain.value : parseFloat(localStorage.getItem('logoquiz_vol') ?? '0.7')
    },

    resume() {
      if (ctx && ctx.state === 'suspended') ctx.resume()
    },
  }
})()

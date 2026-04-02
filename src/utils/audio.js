// ── Audio Engine — warm, musical feedback ─────────────────────────────────────
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

function sine(freq, startTime, duration, peakGain, detuneHz = 0) {
  const c   = getCtx()
  const osc = c.createOscillator()
  const g   = c.createGain()
  osc.connect(g)
  g.connect(masterGain)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq + detuneHz, startTime)
  g.gain.setValueAtTime(0, startTime)
  g.gain.linearRampToValueAtTime(peakGain, startTime + 0.018)
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.02)
}

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

export const AUDIO = {
  correct() {
    const c = getCtx()
    const t = c.currentTime
    sine(523.25, t + 0.00, 0.55, 0.22,  0)
    sine(659.25, t + 0.08, 0.50, 0.20,  1.5)
    sine(783.99, t + 0.16, 0.55, 0.24, -1)
    sine(1046.5,  t + 0.22, 0.35, 0.12,  0)
  },

  wrong() {
    const c = getCtx()
    const t = c.currentTime
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
    noiseBurst(t, 0.20, 0.08)
  },

  tick(urgent = false) {
    const c = getCtx()
    const t = c.currentTime
    sine(urgent ? 900  : 600,  t, urgent ? 0.055 : 0.040, urgent ? 0.14 : 0.07)
    sine(urgent ? 2700 : 1800, t, urgent ? 0.030 : 0.022, urgent ? 0.06 : 0.03)
  },

  end(score) {
    const c = getCtx()
    const t = c.currentTime
    if (score >= 35) {
      const melody = [523.25, 659.25, 783.99, 1046.5]
      melody.forEach((f, i) => sine(f, t + i * 0.11, 0.38, 0.22))
      ;[523.25, 659.25, 783.99].forEach(f => sine(f, t + 0.44, 0.65, 0.18, 0))
    } else if (score >= 20) {
      sine(523.25, t + 0.00, 0.35, 0.20)
      sine(659.25, t + 0.10, 0.35, 0.20)
      sine(783.99, t + 0.20, 0.45, 0.22)
    } else {
      sine(523.25, t + 0.00, 0.35, 0.18)
      sine(440.00, t + 0.12, 0.35, 0.16)
      sine(349.23, t + 0.24, 0.45, 0.18)
    }
  },

  setVolume(v) {
    const vol = Math.max(0, Math.min(1, v))
    if (masterGain) masterGain.gain.value = vol
    localStorage.setItem('logoquiz_vol', String(vol))
  },

  getVolume() {
    return masterGain
      ? masterGain.gain.value
      : parseFloat(localStorage.getItem('logoquiz_vol') ?? '0.7')
  },

  resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume()
  },
}

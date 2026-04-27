// ── Game debug logger — flat events + session log ─────────────────────────────
const EVENTS_KEY   = 'lq_debug_log'
const SESSIONS_KEY = 'lq_sessions'
const MAX_EVENTS   = 500
const MAX_SESSIONS = 50
const PURGE_AGE_MS = 12 * 60 * 60 * 1000  // 12 hours

// in-memory session (flushed to localStorage on endSession)
let _session = null

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]') } catch { return [] }
}

function saveEvents(entries) {
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(entries)) } catch {}
}

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') } catch { return [] }
}

export const LOG = {
  // ── Flat event log (existing) ──────────────────────────────────────────────
  event(type, data = {}) {
    const entries = loadEvents()
    entries.push({ ts: new Date().toISOString(), type, data })
    if (entries.length > MAX_EVENTS) entries.splice(0, entries.length - MAX_EVENTS)
    saveEvents(entries)
  },

  clear() {
    try { localStorage.removeItem(EVENTS_KEY) } catch {}
  },

  all() {
    return loadEvents()
  },

  // ── Session log ───────────────────────────────────────────────────────────
  startSession(pack) {
    _session = {
      id:         Date.now().toString(36),
      startedAt:  new Date().toISOString(),
      pack,
      score:      null,
      endedAt:    null,
      questions:  [],
    }
  },

  logQuestion(qNum, mode, correct, options, correctIndex) {
    if (!_session) return
    _session.questions.push({
      qNum,
      mode,
      prompt:       { domain: correct.domain, name: correct.name },
      options:      options.map(o => ({ domain: o.domain, name: o.name })),
      correctIndex,
      chosenIndex:  null,
      imgResults:   {},   // domain → { ok: bool, src: string }
      correct:      false,
      points:       0,
      timedOut:     false,
      answered:     false,
    })
  },

  logImgResult(domain, ok, src) {
    if (!_session || !_session.questions.length) return
    const q = _session.questions[_session.questions.length - 1]
    q.imgResults[domain] = { ok, src }
  },

  logAnswer(qNum, chosenIndex, correct, points, timedOut) {
    if (!_session) return
    const q = _session.questions.find(q => q.qNum === qNum)
    if (!q) return
    Object.assign(q, { chosenIndex, correct, points, timedOut, answered: true })
  },

  endSession(score) {
    if (!_session) return
    _session.endedAt = new Date().toISOString()
    _session.score   = score
    const now      = Date.now()
    const sessions = loadSessions()
      .filter(s => now - new Date(s.startedAt).getTime() < PURGE_AGE_MS)
    sessions.push(_session)
    if (sessions.length > MAX_SESSIONS) sessions.splice(0, sessions.length - MAX_SESSIONS)
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)) } catch {}
    _session = null
  },

  allSessions() {
    return loadSessions()
  },
}

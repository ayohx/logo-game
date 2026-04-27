// ── Game debug logger — persists events to localStorage ───────────────────────
const KEY     = 'lq_debug_log'
const MAX     = 500

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(entries) {
  try { localStorage.setItem(KEY, JSON.stringify(entries)) } catch { /* quota */ }
}

export const LOG = {
  event(type, data = {}) {
    const entries = load()
    entries.push({ ts: new Date().toISOString(), type, data })
    if (entries.length > MAX) entries.splice(0, entries.length - MAX)
    save(entries)
  },

  clear() {
    try { localStorage.removeItem(KEY) } catch { /* noop */ }
  },

  all() {
    return load()
  },
}

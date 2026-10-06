// In-memory + sessionStorage: intro plays once per browser tab session (new tab
// or closed tab = replay). Same-tab refresh skips after first view. In-memory
// covers client-side tab switches without a full reload.

const SESSION_KEY = 'jk_home_intro_seen'

let introPlayedInMemory = false

function directTraffic() {
  if (typeof window === 'undefined') return false
  const q = new URLSearchParams(window.location.search)
  const v = q.get('direct')
  return v === '1' || v === 'true'
}

export function shouldSkipHomeIntro() {
  if (typeof window === 'undefined') return true
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
    if (sessionStorage.getItem(SESSION_KEY) === '1') return true
    if (directTraffic()) return true
    return introPlayedInMemory
  } catch {
    return true
  }
}

export function isDirectHomeTraffic() {
  return directTraffic()
}

export function markHomeIntroSeen() {
  introPlayedInMemory = true
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* private mode */
  }
}

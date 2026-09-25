// In-memory + sessionStorage: intro plays once per browser tab session (new tab
// or closed tab = replay). Same-tab refresh skips after first view. In-memory
// covers client-side tab switches without a full reload.

const SESSION_KEY = 'jk_home_intro_seen'

let introPlayedInMemory = false

export function shouldSkipHomeIntro() {
  if (typeof window === 'undefined') return true
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
    if (sessionStorage.getItem(SESSION_KEY) === '1') return true
    return introPlayedInMemory
  } catch {
    return true
  }
}

export function markHomeIntroSeen() {
  introPlayedInMemory = true
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* private mode */
  }
}

// In-memory only. Cleared on full page load (hard refresh or new tab), so the
// JK intro replays. Survives client-side nav within the same tab so clicking
// Home in the nav doesn't force you through it again.

let introPlayedInMemory = false

export function shouldSkipHomeIntro() {
  if (typeof window === 'undefined') return true
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
    return introPlayedInMemory
  } catch {
    return true
  }
}

export function markHomeIntroSeen() {
  introPlayedInMemory = true
}

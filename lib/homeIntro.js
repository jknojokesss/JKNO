// In-memory only. Cleared on full page load (hard refresh or new tab), so the
// JK intro replays. Survives client-side nav within the same tab so clicking
// Home in the nav doesn't force you through it again.

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
}

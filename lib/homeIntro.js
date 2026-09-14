export const HOME_INTRO_KEY = 'jk-home-intro-seen'

export function shouldSkipHomeIntro() {
  if (typeof window === 'undefined') return true
  try {
    return !!sessionStorage.getItem(HOME_INTRO_KEY)
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return true
  }
}

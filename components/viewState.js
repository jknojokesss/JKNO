// ── Remember where she was ───────────────────────────────────────────────
// Viewing a PDF or composing an email opens another tab, and a phone will
// happily discard the one behind it. Coming back reloads the app, which
// without this means: top of the list, filters gone, nothing expanded —
// every single time. sessionStorage is the right home: it survives a
// reload of this tab and disappears when she is done for the day.

export function loadView(key) {
  try { return JSON.parse(window.sessionStorage.getItem(key) || 'null') } catch (e) { return null }
}

export function saveView(key, patch) {
  try {
    const prev = loadView(key) || {}
    window.sessionStorage.setItem(key, JSON.stringify({ ...prev, ...patch }))
  } catch (e) { /* private mode, quota — never worth breaking the page over */ }
}

/** Remembers the scroll position under `key`, throttled. Returns a cleanup. */
export function trackScroll(key) {
  let timer = null
  const onScroll = () => {
    if (timer) return
    timer = setTimeout(() => { timer = null; saveView(key, { scrollY: window.scrollY }) }, 400)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => { window.removeEventListener('scroll', onScroll); if (timer) clearTimeout(timer) }
}

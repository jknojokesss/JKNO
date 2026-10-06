/** Parent ↔ Riverside iframe for the homepage phone mockup. */
export const PHONE_DEMO_MSG = 'jknojokes-phone-demo'

export function postPhoneDemo(cmd, targetWindow) {
  if (!targetWindow) return
  targetWindow.postMessage({ type: PHONE_DEMO_MSG, cmd }, '*')
}

export function isPhoneDemoUrl() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('phone') === '1'
}

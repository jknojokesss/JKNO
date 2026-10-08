/** Scroll story waypoints (Aviate-style bottom strip). */
export const FLIGHT_STEPS = [
  { id: 'nose', num: '00', label: 'Home', target: 'flight-intro' },
  { id: 'books', num: '01', label: 'Books', target: 'flight-books' },
  { id: 'portal', num: '02', label: 'Portal', target: 'flight-portal' },
  { id: 'samples', num: '03', label: 'Samples', target: 'flight-samples' },
  { id: 'demos', num: '04', label: 'Gallery', target: 'flight-demos' },
  { id: 'how', num: '05', label: 'Ship', target: 'flight-how' },
  { id: 'contact', num: '06', label: 'Start', target: 'contact' },
]

export const FLIGHT_STEP_IDS = FLIGHT_STEPS.map((s) => s.id)

export function scrollToFlightStep(targetId) {
  const el = document.getElementById(targetId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

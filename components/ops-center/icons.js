const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconRefresh({ className, spinning }) {
  return (
    <svg
      className={`${className || ''} ${spinning ? 'ops-spin' : ''}`}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path {...base} d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path {...base} d="M3 3v5h5" />
      <path {...base} d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path {...base} d="M16 21h5v-5" />
    </svg>
  )
}

export function IconLayoutGrid({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect {...base} x="3" y="3" width="7" height="7" rx="1" />
      <rect {...base} x="14" y="3" width="7" height="7" rx="1" />
      <rect {...base} x="3" y="14" width="7" height="7" rx="1" />
      <rect {...base} x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

export function IconRows3({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path {...base} d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

export function IconCalendarDays({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect {...base} x="3" y="5" width="18" height="16" rx="2" />
      <path {...base} d="M16 3v4M8 3v4M3 11h18" />
      <path {...base} d="M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01" />
    </svg>
  )
}

export function IconCardSquare() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <rect {...base} x="2" y="5" width="20" height="14" rx="2" />
      <path {...base} d="M2 10h20" />
    </svg>
  )
}

export function IconArrowUpDown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path {...base} d="m7 15 5 5 5-5M7 9l5-5 5 5" />
    </svg>
  )
}

export function IconArrowDownAZ({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path {...base} d="m3 16 4 4 4-4M7 20V4" />
      <path {...base} d="M14 6h6M14 12h4M14 18h2" />
    </svg>
  )
}

export function IconUpload({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path {...base} d="M12 3v12" />
      <path {...base} d="m7 8 5-5 5 5" />
      <path {...base} d="M5 21h14" />
    </svg>
  )
}

export function IconFilter({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path {...base} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  )
}

export function IconLoan() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path {...base} d="M12 2v20" />
      <path {...base} d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

export function IconOutflow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path {...base} d="M3 3v18h18" />
      <path {...base} d="M7 16V9M12 16V5M17 16v-3" />
    </svg>
  )
}

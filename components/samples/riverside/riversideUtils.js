export const THEME = { side: '#1E1C19', border: '#33302B', accent: '#B0281C', content: '#F2F0EA' }
export const C = {
  paper: '#F2F0EA',
  card: '#FFFFFF',
  ink: '#1B1815',
  sub: '#6A655C',
  muted: '#9A9284',
  hair: '#DBD5C7',
  line: '#E6E1D6',
  red: '#B0281C',
  green: '#1C7A4E',
  neg: '#b0483a',
}

export const ui = "'DM Sans', system-ui, sans-serif"
/** Headings use the same face as body (no condensed / display fonts). */
export const head = ui
export const mono = ui

export const fmtC = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
export const fmt0 = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
export const pct = (n) => `${Number(n).toFixed(1)}%`

/** Revenue / profit up = green; expense up = red. */
export function deltaColor(delta, { cost = false } = {}) {
  if (delta == null || Math.abs(delta) < 0.005) return C.muted
  if (cost) return delta > 0 ? C.neg : C.green
  return delta > 0 ? C.green : C.neg
}

export const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${iso}T12:00:00.000Z`),
  )
}

export const paren = (n) => (n < 0 ? `(${fmt0(-n)})` : fmt0(n))
export const parenC = (n) => (n < 0 ? `(${fmtC(-n)})` : fmtC(n))

export function TieMark({ ok }) {
  if (!ok) return null
  return <span style={{ color: C.green, fontSize: 11, marginLeft: 6 }}>✓</span>
}

export const hcell = (align = 'left') => ({
  padding: '7px 12px',
  fontSize: '9px',
  color: C.muted,
  background: '#ECE7DD',
  fontWeight: 400,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${C.hair}`,
  fontFamily: ui,
  textAlign: align,
})

export const cell = (align = 'left', extra = {}) => ({
  padding: '9px 12px',
  borderBottom: `1px solid ${C.line}`,
  color: C.ink,
  fontSize: '11px',
  fontFamily: ui,
  textAlign: align,
  ...extra,
})

export const panel = { background: C.card, border: `1px solid ${C.hair}`, padding: '18px 20px', marginBottom: 20, borderRadius: 0 }

export const NAV = [
  { id: 'dashboard', label: 'Dashboard', title: 'Dashboard' },
  { id: 'financials', label: 'Financials', title: 'Financials' },
  { id: 'inventory', label: 'Sales & Items', title: 'Sales & Items' },
  { id: 'orders', label: 'Orders', title: 'Orders' },
  { id: 'stock', label: 'Stock', title: 'Stock on Hand' },
  { id: 'ai', label: 'Ask', title: 'Ask' },
]

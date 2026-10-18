/** Mr. Dipz sample portal — theme + model (no JSX; safe for node verify). */
import {
  AS_OF_DATE,
  AS_OF_LABEL,
  AREAS,
  STORES,
  PRODUCTS,
  WEEKS,
  SOLD,
  EXPIRED,
  PRIOR_SOLD,
  PRIOR_EXPIRED,
  PRIOR_MONTH,
  INVOICES,
  PNL_LINES,
  PNL_ENTRIES,
} from './mrDipzData.js'

export const CHAR = '#2B2018'
export const SPICE = '#C8462C'
export const KRAFT = '#A9763A'
export const CREAM = '#F6F0E6'
export const CARDBG = '#FFFDF9'
export const INK = '#2B2018'
export const MUTED = '#8A7A66'
export const BORDER = '#E6DBC8'
export const GREEN = '#3E7C4F'
export const AMBER = '#C98A2A'
export const RED = '#C03A22'

export const UI = "'Inter', sans-serif"
export const MONO = "'IBM Plex Mono', monospace"

export const MD_LOCALE = 'en-US'
export const MD_TZ = 'America/New_York'

const intFormatter = new Intl.NumberFormat(MD_LOCALE, { maximumFractionDigits: 0 })
const moneyFormatter = new Intl.NumberFormat(MD_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const fmtInt = (n) => intFormatter.format(Math.round(n))

export const money = (n) => {
  const v = Math.round(n * 100) / 100
  if (v < 0) return '-$' + moneyFormatter.format(Math.abs(v))
  return '$' + moneyFormatter.format(v)
}

export const money0 = (n) => {
  const v = Math.round(n)
  if (v < 0) return '-$' + intFormatter.format(Math.abs(v))
  return '$' + intFormatter.format(v)
}

export const pct1 = (n) => (Math.round(n * 10) / 10).toFixed(1) + '%'

const asOfDateFormatter = new Intl.DateTimeFormat(MD_LOCALE, {
  timeZone: MD_TZ,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export const fmtAsOfLong = (iso) => {
  if (!iso) return '—'
  return asOfDateFormatter.format(new Date(`${iso}T12:00:00.000Z`))
}

export const round2 = (n) => Math.round(n * 100) / 100

const sumAmount = (rows, month) => round2(rows.filter((r) => r.month === month).reduce((a, r) => a + r.amount, 0))

const creditPct = (credits, gross) => (gross > 0 ? Math.round((credits / gross) * 1000) / 10 : 0)

const normArea = (a) => ({ ...a, label: a.label ?? a.name })
const normStore = (s) => ({
  ...s,
  label: s.label ?? s.name,
  areaId: s.areaId ?? s.area,
  terms: s.terms || 'Net 30',
})
const normProduct = (p) => ({ ...p, label: p.label ?? p.name })

/** Nested store → product → [w1..w4] unit grids → flat money rows. */
function flattenSeptemberGrid(nested, month, weekIds, priceById) {
  const rows = []
  for (const [storeId, byProduct] of Object.entries(nested || {})) {
    for (const [productId, weekUnits] of Object.entries(byProduct)) {
      const price = priceById[productId] || 0
      if (!Array.isArray(weekUnits)) continue
      weekUnits.forEach((units, i) => {
        if (!units) return
        rows.push({
          storeId,
          productId,
          weekId: weekIds[i],
          month,
          amount: round2(units * price),
        })
      })
    }
  }
  return rows
}

function flattenPriorMonth(nested, month, priceById) {
  const rows = []
  for (const [storeId, byProduct] of Object.entries(nested || {})) {
    for (const [productId, units] of Object.entries(byProduct)) {
      const price = priceById[productId] || 0
      if (!units) continue
      rows.push({
        storeId,
        productId,
        weekId: null,
        month,
        amount: round2(units * price),
      })
    }
  }
  return rows
}

export function buildMrDipzModel() {
  const areasNorm = AREAS.map(normArea)
  const storesNorm = STORES.map(normStore)
  const productsNorm = PRODUCTS.map(normProduct)
  const areaById = Object.fromEntries(areasNorm.map((a) => [a.id, a]))
  const storeById = Object.fromEntries(storesNorm.map((s) => [s.id, s]))
  const productById = Object.fromEntries(productsNorm.map((p) => [p.id, p]))
  const weekById = Object.fromEntries(WEEKS.map((w) => [w.id, { ...w, month: w.month || '2026-09' }]))
  const weekIds = WEEKS.map((w) => w.id)
  const priceById = Object.fromEntries(productsNorm.map((p) => [p.id, p.price ?? p.casePrice ?? 0]))

  const soldRows = [
    ...flattenSeptemberGrid(SOLD, '2026-09', weekIds, priceById),
    ...flattenPriorMonth(PRIOR_SOLD, '2026-08', priceById),
  ]
  const expiredRows = [
    ...flattenSeptemberGrid(EXPIRED, '2026-09', weekIds, priceById),
    ...flattenPriorMonth(PRIOR_EXPIRED, '2026-08', priceById),
  ]

  const sepGross = sumAmount(soldRows, '2026-09')
  const sepCredits = sumAmount(expiredRows, '2026-09')
  const augGross = sumAmount(soldRows, '2026-08')
  const augCredits = sumAmount(expiredRows, '2026-08')

  const september = {
    grossSales: sepGross,
    credits: sepCredits,
    netSales: round2(sepGross - sepCredits),
    creditPct: creditPct(sepCredits, sepGross),
  }
  const august = {
    grossSales: augGross,
    credits: augCredits,
    netSales: round2(augGross - augCredits),
    creditPct: creditPct(augCredits, augGross),
  }

  const totalOwed = round2(
    INVOICES.filter((inv) => inv.status === 'Open').reduce((a, inv) => a + inv.amount, 0),
  )

  const pnlAmount = (lineId, month) => {
    const row = PNL_ENTRIES.find((e) => e.lineId === lineId && e.month === month)
    return row ? row.amount : 0
  }

  const pnlSep = {
    month: '2026-09',
    netProfit: pnlAmount('net_profit', '2026-09'),
    grossSales: pnlAmount('gross', '2026-09'),
    credits: pnlAmount('credits', '2026-09'),
    netSales: pnlAmount('net_sales', '2026-09'),
  }
  const pnlAug = {
    month: '2026-08',
    netProfit: pnlAmount('net_profit', '2026-08'),
    grossSales: pnlAmount('gross', '2026-08'),
    credits: pnlAmount('credits', '2026-08'),
    netSales: pnlAmount('net_sales', '2026-08'),
  }

  const storeRows = storesNorm
    .map((st) => {
      const sepSales = round2(soldRows.filter((r) => r.storeId === st.id && r.month === '2026-09').reduce((a, r) => a + r.amount, 0))
      const sepCred = round2(expiredRows.filter((r) => r.storeId === st.id && r.month === '2026-09').reduce((a, r) => a + r.amount, 0))
      const augSales = round2(soldRows.filter((r) => r.storeId === st.id && r.month === '2026-08').reduce((a, r) => a + r.amount, 0))
      const augCred = round2(expiredRows.filter((r) => r.storeId === st.id && r.month === '2026-08').reduce((a, r) => a + r.amount, 0))
      const owed = round2(INVOICES.filter((inv) => inv.storeId === st.id && inv.status === 'Open').reduce((a, inv) => a + inv.amount, 0))
      return {
        ...st,
        area: areaById[st.areaId],
        sepSales,
        sepCredits: sepCred,
        sepNet: round2(sepSales - sepCred),
        creditPctSep: creditPct(sepCred, sepSales),
        augSales,
        augCredits: augCred,
        balanceOwed: owed,
      }
    })
    .sort((a, b) => b.sepSales - a.sepSales)

  const areaRows = areasNorm.map((area) => {
    const inArea = storeRows.filter((s) => s.areaId === area.id)
    const sepSales = round2(inArea.reduce((a, s) => a + s.sepSales, 0))
    const sepCredits = round2(inArea.reduce((a, s) => a + s.sepCredits, 0))
    const owed = round2(inArea.reduce((a, s) => a + s.balanceOwed, 0))
    return { ...area, storeCount: inArea.length, sepSales, sepCredits, sepNet: round2(sepSales - sepCredits), balanceOwed: owed }
  })

  const productRows = productsNorm
    .map((p) => {
      const sepSold = round2(soldRows.filter((r) => r.productId === p.id && r.month === '2026-09').reduce((a, r) => a + r.amount, 0))
      const sepCred = round2(expiredRows.filter((r) => r.productId === p.id && r.month === '2026-09').reduce((a, r) => a + r.amount, 0))
      return { ...p, sepSales: sepSold, sepCredits: sepCred, sepNet: round2(sepSold - sepCred) }
    })
    .sort((a, b) => b.sepSales - a.sepSales)

  const weekRows = WEEKS.map((w) => {
    const sales = round2(soldRows.filter((r) => r.weekId === w.id && r.month === '2026-09').reduce((a, r) => a + r.amount, 0))
    const credits = round2(expiredRows.filter((r) => r.weekId === w.id && r.month === '2026-09').reduce((a, r) => a + r.amount, 0))
    return { ...w, month: w.month || '2026-09', sepSales: sales, sepCredits: credits, sepNet: round2(sales - credits) }
  })

  const creditRows = expiredRows
    .filter((r) => r.month === '2026-09')
    .map((r, idx) => ({
      ...r,
      id: `cr-${idx}`,
      store: storeById[r.storeId],
      product: productById[r.productId],
      week: weekById[r.weekId],
      reason: r.reason || 'Spoilage or short-dated pull',
    }))
    .sort((a, b) => b.amount - a.amount)

  const invoiceRows = INVOICES.filter((inv) => inv.status === 'Open')
    .map((inv) => ({
      ...inv,
      store: storeById[inv.storeId],
      aging: inv.daysOutstanding <= 30 ? 'Current' : inv.daysOutstanding <= 60 ? '31–60' : '61+',
    }))
    .sort((a, b) => b.amount - a.amount)

  const aging = {
    current: round2(invoiceRows.filter((i) => i.aging === 'Current').reduce((a, i) => a + i.amount, 0)),
    d31_60: round2(invoiceRows.filter((i) => i.aging === '31–60').reduce((a, i) => a + i.amount, 0)),
    d61: round2(invoiceRows.filter((i) => i.aging === '61+').reduce((a, i) => a + i.amount, 0)),
  }

  const pnlByMonth = ['2026-09', '2026-08'].map((month) => {
    const entries = Object.fromEntries(PNL_ENTRIES.filter((e) => e.month === month).map((e) => [e.lineId, e.amount]))
    return { month, entries }
  })

  return {
    meta: { asOf: AS_OF_DATE, asOfLabel: AS_OF_LABEL, priorMonth: PRIOR_MONTH, brand: 'Mr. Dipz' },
    areas: areaRows,
    stores: storeRows,
    products: productRows,
    weeks: weekRows,
    credits: creditRows,
    invoices: invoiceRows,
    aging,
    pnlLines: PNL_LINES,
    pnlByMonth,
    pnlSep,
    pnlAug,
    totals: { september, august, totalOwed },
    lookups: { areaById, storeById, productById, weekById },
  }
}

export const SHELL_CSS = (theme) => `*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
body{background:${theme.CREAM};font-family:${UI};color:${theme.INK}}
.md-shell{display:flex;min-height:100vh;align-items:stretch}
.md-side{width:236px;flex-shrink:0;background:${theme.CHAR};color:${theme.CREAM};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.md-nav{display:flex;flex-direction:column;gap:3px}.md-nav--main{flex:1}
.md-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:2px;border:none;background:transparent;color:#B6A78C;font-family:${UI};font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.md-navbtn:hover{background:rgba(255,255,255,.08);color:${theme.CREAM}}
.md-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px}
.md-click{transition:box-shadow .12s}.md-click:hover{box-shadow:inset 0 0 0 1.5px ${theme.SPICE}}
@media(max-width:860px){.md-shell{flex-direction:column}.md-side{width:auto;height:auto;position:static;padding:14px 12px 10px}.md-nav--main{flex-direction:row;overflow-x:auto;gap:6px;padding:4px 4px 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.md-nav::-webkit-scrollbar{display:none}.md-navbtn{width:auto;padding:8px 14px;border-radius:2px;background:rgba(255,255,255,.07);flex-shrink:0;font-size:13px;min-height:40px}.md-main{padding:18px 16px 52px;max-width:100%}}
@media(max-width:600px){input,select,textarea{font-size:16px!important}button{min-height:40px}}`

export const PNL_SHEET_CSS = () => `
.md-pnl-wrap{
  --md-pnl-c1:5.5rem;--md-pnl-c2:5.5rem;--md-pnl-c3:5.5rem;--md-pnl-gap:6px;
  --md-pnl-fs:12px;--md-pnl-fs-cur:13px;--md-pnl-fs-head:10px;
}
@media(max-width:480px){
  .md-pnl-wrap{
    --md-pnl-c1:4.5rem;--md-pnl-c2:4.5rem;--md-pnl-c3:4rem;--md-pnl-gap:8px;
    --md-pnl-fs:10px;--md-pnl-fs-cur:10px;--md-pnl-fs-head:9px;
  }
}
.md-pnl-head,.md-pnl-line{
  display:grid;grid-template-columns:minmax(0,1fr) var(--md-pnl-c1) var(--md-pnl-c2) var(--md-pnl-c3);
  column-gap:var(--md-pnl-gap);align-items:center;padding-right:6px;box-sizing:border-box;
}
.md-pnl-head{padding:0 6px 8px;font-size:var(--md-pnl-fs-head);color:${MUTED};text-transform:uppercase;letter-spacing:.6px}
.md-pnl-line{padding:8px 6px;border-radius:2px}
.md-pnl-line--indent .md-pnl-label{padding-left:20px}
.md-pnl-line--sub{border-top:1px solid ${BORDER}}
.md-pnl-label{min-width:0;font-size:13px;line-height:1.35}
.md-pnl-num{font-family:${MONO};font-size:var(--md-pnl-fs);text-align:right;font-variant-numeric:tabular-nums}
.md-pnl-num--cur{font-size:var(--md-pnl-fs-cur)}
.md-pnl-head .md-pnl-num{font-size:var(--md-pnl-fs-head);font-family:${UI};font-weight:600}
`

/** Node-friendly verification (no React import). */
export function verifyMrDipzTotals() {
  const m = buildMrDipzModel()
  const s = m.totals.september
  const a = m.totals.august
  const checks = [
    ['Sep sales', s.grossSales, 91799.75],
    ['Sep credits', s.credits, 8505.0],
    ['Sep credit %', s.creditPct, 9.3],
    ['Sep net', s.netSales, 83294.75],
    ['Aug sales', a.grossSales, 78319.0],
    ['Aug credits', a.credits, 6948.75],
    ['Aug credit %', a.creditPct, 8.9],
    ['Owed', m.totals.totalOwed, 53093.25],
    ['Sep net profit', m.pnlSep.netProfit, 5369.23],
    ['Aug net profit', m.pnlAug.netProfit, -162.28],
  ]
  const lines = []
  let ok = true
  for (const [name, got, exp] of checks) {
    const pass = Math.abs(got - exp) < 0.02
    lines.push(`${pass ? 'OK' : 'FAIL'} ${name}: ${got} (expected ${exp})`)
    if (!pass) ok = false
  }
  return { ok, lines }
}

/** Mr. Dipz sample portal tokens — aligned with Primal Krisp / Jerky Munch dashboard look. */
import MR_DIPZ_RAW from './mrDipzData'

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
export const TINT_GREEN = '#EAF3EC'
export const TINT_AMBER = '#FEF6E8'
export const TINT_RED = '#FBEDE9'

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

export const centsEqual = (a, b) => Math.abs(Math.round(a * 100) - Math.round(b * 100)) === 0

export function TieMark({ expected, actual }) {
  const ok = centsEqual(expected, actual)
  const diff = Math.round((actual - expected) * 100) / 100
  if (ok) {
    return (
      <span title="Ties to total" style={{ color: GREEN, fontSize: '12px', fontWeight: 600, lineHeight: 1 }}>
        ✓
      </span>
    )
  }
  return <span style={{ color: RED, fontSize: '11px', fontWeight: 600 }}>Off by {money(Math.abs(diff))}</span>
}

const round2 = (n) => Math.round(n * 100) / 100

export function buildMrDipzModel(data = MR_DIPZ_RAW) {
  const stores = data.stores || []
  const products = data.products || []
  const creditMemos = data.creditMemos || []
  const pnlByMonth = data.pnlByMonth || []

  const sumStores = (field, month) =>
    round2(stores.reduce((acc, st) => acc + (st[field]?.[month] || 0), 0))

  const september = {
    grossSales: sumStores('sales', 'sep'),
    credits: sumStores('credits', 'sep'),
  }
  september.netSales = round2(september.grossSales - september.credits)
  september.creditPct =
    september.grossSales > 0 ? Math.round((september.credits / september.grossSales) * 1000) / 10 : 0

  const august = {
    grossSales: sumStores('sales', 'aug'),
    credits: sumStores('credits', 'aug'),
  }
  august.netSales = round2(august.grossSales - august.credits)
  august.creditPct = august.grossSales > 0 ? Math.round((august.credits / august.grossSales) * 1000) / 10 : 0

  const totalOwed = round2(stores.reduce((acc, st) => acc + (st.balanceOwed || 0), 0))

  const productBySku = Object.fromEntries(products.map((p) => [p.sku, p]))
  const casesSepBySku = {}
  stores.forEach((st) => {
    Object.entries(st.casesSep || {}).forEach(([sku, qty]) => {
      casesSepBySku[sku] = (casesSepBySku[sku] || 0) + qty
    })
  })

  const productRows = products.map((p) => {
    const cases = casesSepBySku[p.sku] || 0
    const revenue = round2(cases * p.case_price)
    const cogs = round2(cases * p.unit_cost * 6)
    return {
      ...p,
      casesSep: cases,
      revenueSep: revenue,
      cogsSep: cogs,
      marginSep: round2(revenue - cogs),
    }
  })

  const pnlSep = pnlByMonth.find((m) => m.month === '2026-09') || null
  const pnlAug = pnlByMonth.find((m) => m.month === '2026-08') || null

  const creditsByStoreSep = stores
    .map((st) => ({
      storeId: st.id,
      storeName: st.name,
      amount: st.credits.sep,
      pctOfSales: st.sales.sep > 0 ? (st.credits.sep / st.sales.sep) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  const storeRows = stores
    .map((st) => ({
      ...st,
      netSep: round2(st.sales.sep - st.credits.sep),
      netAug: round2(st.sales.aug - st.credits.aug),
      creditPctSep: st.sales.sep > 0 ? (st.credits.sep / st.sales.sep) * 100 : 0,
    }))
    .sort((a, b) => b.sales.sep - a.sales.sep)

  const owedRows = [...stores].sort((a, b) => b.balanceOwed - a.balanceOwed)

  return {
    meta: data.meta,
    overview: data.overview,
    stores: storeRows,
    products: productRows,
    creditMemos,
    creditsByStoreSep,
    owedRows,
    pnlByMonth,
    pnlSep,
    pnlAug,
    totals: {
      september,
      august,
      totalOwed,
      casesShippedSep: data.overview?.casesShippedSep ?? Object.values(casesSepBySku).reduce((a, n) => a + n, 0),
    },
    productBySku,
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

export const PNL_SHEET_CSS = (theme) => `
.md-pnl-wrap{
  --md-pnl-c1:5.5rem;--md-pnl-c2:5.5rem;--md-pnl-c3:5.5rem;--md-pnl-gap:6px;
  --md-pnl-fs:12px;--md-pnl-fs-cur:13px;--md-pnl-fs-head:10px;
}
@media(max-width:480px){
  .md-pnl-wrap{
    --md-pnl-c1:4.5rem;--md-pnl-c2:4.5rem;--md-pnl-c3:4rem;--md-pnl-gap:8px;
    --md-pnl-fs:10px;--md-pnl-fs-cur:10px;--md-pnl-fs-head:9px;
  }
  .md-pnl-label{font-size:12px}
}
.md-pnl-head,.md-pnl-line{
  display:grid;grid-template-columns:minmax(0,1fr) var(--md-pnl-c1) var(--md-pnl-c2) var(--md-pnl-c3);
  column-gap:var(--md-pnl-gap);align-items:center;padding-right:6px;box-sizing:border-box;
}
.md-pnl-line--solo{grid-template-columns:minmax(0,1fr) var(--md-pnl-c1)}
.md-pnl-head{padding:0 6px 8px;font-size:var(--md-pnl-fs-head);color:${MUTED};text-transform:uppercase;letter-spacing:.6px}
.md-pnl-line{padding:8px 6px;border-radius:2px}
.md-pnl-line--indent{padding:4px 6px 4px 0}
.md-pnl-line--indent .md-pnl-label{padding-left:20px}
.md-pnl-line--sub{border-top:1px solid ${BORDER}}
.md-pnl-label{min-width:0;font-size:13px;line-height:1.35}
.md-pnl-num{
  font-family:${MONO};font-size:var(--md-pnl-fs);text-align:right;justify-self:stretch;
  width:100%;max-width:100%;box-sizing:border-box;white-space:nowrap;overflow:hidden;
  font-variant-numeric:tabular-nums;
}
.md-pnl-num--cur{font-size:var(--md-pnl-fs-cur)}
.md-pnl-head .md-pnl-num{font-size:var(--md-pnl-fs-head);font-family:${UI};font-weight:600;overflow:visible}
`

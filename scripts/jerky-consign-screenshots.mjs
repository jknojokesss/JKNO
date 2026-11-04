/**
 * Mock-data screenshots for Jerky consignment store tab (no Supabase writes).
 * Usage: node scripts/jerky-consign-screenshots.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { buildActivityLedger, recon, safeOnShelf, hasShelfBooks, hasLoggedConsignmentActivity, hasDropActivity, paymentPiecesFromCheck } from '../lib/consignmentRecon.js'

const OUT = '/opt/cursor/artifacts/jerky-consign-screenshots'
mkdirSync(OUT, { recursive: true })

const CHAR = '#2B2018', CREAM = '#F6F0E6', INK = '#2B2018', MUTED = '#8A7A66', GREEN = '#3E7C4F', BORDER = '#E6DBC8', CARDBG = '#FFFDF9', KRAFT = '#A9763A', SPICE = '#C8462C'
const formatDecimal2 = (n) => {
  const v = Number(String(n).replace(/[$,]/g, ''))
  if (!Number.isFinite(v)) return ''
  return (Math.round(v * 100) / 100).toFixed(2)
}

const money = (n) => '$' + (Math.round(Number(n) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const money2 = (n) => '$' + (Math.round(Number(n) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const m0 = (n) => '$' + Math.round(Number(n) || 0).toLocaleString()

const INPUT_CSS = `
.jm-consign{font-family:Inter,sans-serif}
.jm-consign input,.jm-consign select,.jm-consign textarea{font-family:Inter,sans-serif!important;font-variant-numeric:tabular-nums!important;font-feature-settings:"tnum" 1!important}
.jm-consign input[type=date],.jm-consign input[type=date]::-webkit-datetime-edit,.jm-consign input[type=date]::-webkit-datetime-edit-fields-wrapper,.jm-consign input[type=date]::-webkit-datetime-edit-text,.jm-consign input[type=date]::-webkit-datetime-edit-month-field,.jm-consign input[type=date]::-webkit-datetime-edit-day-field,.jm-consign input[type=date]::-webkit-datetime-edit-year-field{font-family:Inter,sans-serif!important;font-variant-numeric:tabular-nums!important;font-feature-settings:"tnum" 1!important}
`

const exampleStore = {
  id: 'demo',
  store: 'Sunrise Natural',
  region: 'Kansas City',
  price: 4.5,
  sent: 100,
  returned: 0,
  paid: 360,
  counted: null,
  cycle: 1,
  log: [
    { t: 'Dropped off 100 pieces on 2026-11-01 (stocked shelf)', atIso: '2026-11-01' },
    { t: 'Paid 2026-12-03: $360.00 for 80 pieces', atIso: '2026-12-03' },
  ],
}

function fmtD(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function badgeText(c) {
  const r = { ...c, ...recon(c) }
  if (!hasShelfBooks(r)) return { text: 'No drop-offs yet', bg: MUTED, compact: false }
  if (r.status === 'tracking') {
    const n = safeOnShelf(r.expected)
    const text = r.asOfDate ? `Should be on shelf: ${n} (as of ${fmtD(r.asOfDate)})` : `Should be on shelf: ${n}`
    return { text, bg: KRAFT, compact: !!r.asOfDate }
  }
  return { text: `Should be on shelf: ${safeOnShelf(r.expected)}`, bg: KRAFT, compact: false }
}

function badgeStyle(b) {
  return `display:inline-block;align-self:flex-end;flex-shrink:0;width:auto;max-width:min(200px,100%);background:${b.bg};color:#fff;font-family:Inter,sans-serif;font-variant-numeric:tabular-nums;font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px;line-height:1.25;${b.compact ? 'white-space:normal;text-align:right' : 'white-space:nowrap'}`
}

function todayEtIso() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

function payCoverHtml(c, payAmt, priceOverride) {
  const price = priceOverride !== undefined ? priceOverride : c.price
  if (!(Number(price) > 0)) return `<div style="font-size:12.5px;color:#C03A22;line-height:1.45">Set price per bag first</div>`
  if (!(Number(payAmt) > 0)) return ''
  const payCalc = paymentPiecesFromCheck(Number(payAmt), price)
  if (!payCalc) return ''
  const ppb = money2(price)
  if (payCalc.even) {
    return `<div style="font-size:12.5px;color:${MUTED};line-height:1.45">Covers ${payCalc.rounded} pieces at ${ppb}/bag</div>`
  }
  const frac = Math.round(payCalc.exact * 10) / 10
  return `<div style="font-size:12.5px;color:${MUTED};line-height:1.45">Covers ${frac} pieces at ${ppb}/bag, doesn't divide evenly <button type="button" style="background:none;border:none;padding:0;color:${KRAFT};font-weight:600;cursor:pointer;text-decoration:underline;font-size:inherit;font-family:inherit">change</button></div>`
}

function firstVisitBlock(today, startCnt = '', startDate = today) {
  const field = (label, ph = '', val = '', type = 'text', inputMode = '') => `
    <label style="display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box">
      <div style="font-size:12px;font-weight:600;color:${MUTED};margin-bottom:4px">${label}</div>
      <input type="${type}" ${inputMode ? `inputmode="${inputMode}"` : ''} value="${val}" placeholder="${ph}" style="width:100%;max-width:100%;box-sizing:border-box;padding:10px;border:1px solid ${BORDER};display:block;min-width:0;font-family:Inter,sans-serif;font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1"/>
    </label>`
  return `<div style="margin-bottom:18px;padding:14px;background:${CREAM};border:1px solid ${BORDER};border-radius:2px">
    <div style="font-weight:700;font-size:14px;color:${INK}">First visit? Log what's on the shelf now</div>
    <p style="font-size:12.5px;color:${MUTED};margin:8px 0;line-height:1.45">Opening count for this store — drop-offs and payments build from here.</p>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">${field('As-of date', '', startDate, 'date')}${field('Pieces on shelf', 'e.g. 40', startCnt, 'text', 'numeric')}
    <button style="width:100%;box-sizing:border-box;padding:11px;border:none;background:${CHAR};color:#fff;font-weight:600;font-family:Inter,sans-serif">Save starting count</button></div></div>`
}

function expandedHtml(opts = {}) {
  const { noPrice = false, payAmt = '360', store = exampleStore, price = noPrice ? 0 : store.price, showFirstVisit = false, startCnt = '' } = opts
  const c = { ...store, price, ...recon({ ...store, price }) }
  const ledger = buildActivityLedger(c)
  const today = todayEtIso()
  const badge = badgeText(c)
  const firstVisit = showFirstVisit || (!hasLoggedConsignmentActivity(c) && !hasDropActivity(c))
    ? firstVisitBlock(today, startCnt, today)
    : ''
  const ledgerRows = ledger.map(row => `
    <div style="display:grid;grid-template-columns:minmax(0,88px) minmax(0,1fr) minmax(0,72px);gap:8px;padding:8px 12px;border-top:1px solid ${CREAM};font-size:12.5px">
      <span style="font-family:Inter,sans-serif;font-variant-numeric:tabular-nums;color:#BFB096">${row.dateIso ? fmtD(row.dateIso) : 'Undated'}</span>
      <span style="color:${MUTED}">${row.label}</span>
      <span style="font-family:Inter,sans-serif;font-variant-numeric:tabular-nums;text-align:right;font-weight:600">${row.onShelf}</span>
    </div>`).join('')
  const field = (label, ph = '', val = '', type = 'text', inputMode = '') => `
    <label style="display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box">
      <div style="font-size:12px;font-weight:600;color:${MUTED};margin-bottom:4px">${label}</div>
      <input type="${type}" ${inputMode ? `inputmode="${inputMode}"` : ''} value="${val}" placeholder="${ph}" style="width:100%;max-width:100%;box-sizing:border-box;padding:10px;border:1px solid ${BORDER};display:block;min-width:0;font-family:Inter,sans-serif;font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1"/>
    </label>`
  const priceVal = noPrice ? '' : formatDecimal2(c.price)
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/><style>${INPUT_CSS}</style></head>
  <body class="jm-consign" style="margin:0;background:${CREAM};padding:16px;font-family:Inter,sans-serif;color:${INK};box-sizing:border-box">
  <div style="border:1px solid ${CHAR};background:${CARDBG};border-radius:2px;overflow:hidden;max-width:100%;box-sizing:border-box">
    <div style="padding:15px 18px;border-bottom:1px solid ${CREAM}">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">
        <div style="min-width:0;flex:1"><div style="font-weight:700;font-size:20px">${c.store}</div>
        <div style="font-size:12px;color:${MUTED};margin-top:4px;line-height:1.45">${money2(c.price || 0)}/bag · dropped off ${c.sent} · paid for ${c.paidUnits} pieces</div></div>
        <span style="${badgeStyle(badge)}">${badge.text}</span>
      </div>
    </div>
    <div style="padding:0 18px 18px;max-width:100%;min-width:0;box-sizing:border-box;overflow:hidden">
      <div style="font-size:11px;font-weight:600;color:#96866C;text-transform:uppercase;margin:14px 0 8px">Activity</div>
      <div style="border:1px solid ${BORDER};border-radius:2px;overflow:hidden;margin-bottom:16px;max-width:100%">
        <div style="display:grid;grid-template-columns:minmax(0,88px) minmax(0,1fr) minmax(0,72px);gap:8px;padding:8px 12px;background:${CREAM};font-size:10px;font-weight:600;color:#96866C;text-transform:uppercase">
          <span>Date</span><span>What happened</span><span style="text-align:right">On shelf</span></div>
        ${ledgerRows || `<div style="padding:12px;font-size:13px;color:${MUTED}">No dated entries yet.</div>`}
      </div>
      <div style="font-size:11px;font-weight:600;color:#96866C;text-transform:uppercase;margin-bottom:10px">Log activity</div>
      ${firstVisit}
      <div style="margin-bottom:14px"><div style="font-weight:700;font-size:14px">1. Dropped off</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;max-width:100%">${field('Drop-off date', '', today, 'date')}${field('Pieces added', 'e.g. 100', '', 'text', 'numeric')}
        <button style="width:100%;box-sizing:border-box;padding:11px;border:none;background:${CHAR};color:#fff;font-weight:600;font-family:Inter,sans-serif">Save drop-off</button></div></div>
      <div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:600;color:#96866C;text-transform:uppercase;margin-bottom:6px">Price per bag</div>
        <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center"><span style="color:${MUTED}">$</span><input value="${priceVal}" placeholder="4.50" style="width:110px;max-width:100%;padding:10px;border:1px solid ${BORDER};box-sizing:border-box;font-family:Inter,sans-serif;font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1"/><button style="background:${CHAR};color:#fff;border:none;padding:10px 16px;font-weight:600;font-family:Inter,sans-serif">Save</button></div>
        <div style="font-weight:700;font-size:14px">2. Got paid</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">${field('Date paid', '', today, 'date')}${field('Check amount $', 'e.g. 360', payAmt, 'text', 'decimal')}
        ${payCoverHtml(c, payAmt, price)}
        <button style="width:100%;box-sizing:border-box;padding:11px;border:none;background:${GREEN};color:#fff;font-weight:600;font-family:Inter,sans-serif;opacity:${noPrice ? 0.45 : 1}">Save payment</button></div></div>
      <div style="margin-bottom:14px"><div style="font-weight:700;font-size:14px">3. Picked up bags</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">${field('Date picked up', '', today, 'date')}${field('Pieces picked up', 'e.g. 5', '', 'text', 'numeric')}
        <button style="width:100%;box-sizing:border-box;padding:11px;border:none;background:${KRAFT};color:#fff;font-weight:600;font-family:Inter,sans-serif">Save pickup</button></div></div>
      <details style="margin-bottom:14px"><summary style="font-weight:600;font-size:13px;cursor:pointer;list-style-position:outside">Did a shelf count? (optional)</summary>
        <p style="font-size:12.5px;color:${MUTED};margin:8px 0;line-height:1.45">Only if you physically counted the shelf — used to spot gaps vs the books.</p></details>
    </div>
  </div></body></html>`
}

function noDropoffsHtml() {
  const empty = { store: 'River Market Co-op', price: 5, sent: 0, returned: 0, paid: 0, counted: null, log: [] }
  return expandedHtml({ store: empty, payAmt: '' })
}

function firstVisitBeforeHtml() {
  const empty = { store: 'River Market Co-op', price: 5, sent: 0, returned: 0, paid: 0, counted: null, log: [] }
  return expandedHtml({ store: empty, payAmt: '', showFirstVisit: true, startCnt: '40' })
}

function firstVisitAfterHtml() {
  const today = todayEtIso()
  const store = {
    store: 'River Market Co-op',
    price: 5,
    sent: 0,
    returned: 0,
    paid: 0,
    counted: null,
    log: [{ t: `Starting count 40 on ${today}`, atIso: today }],
  }
  return expandedHtml({ store, payAmt: '' })
}

function unevenCheckHtml() {
  return expandedHtml({ payAmt: '360', price: 4.52 })
}

async function main() {
  const chromePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  const browser = await chromium.launch(chromePath ? { executablePath: chromePath } : {})
  const page = await browser.newPage()

  const scenarios = [
    { slug: 'store-card-all-steps', html: expandedHtml() },
    { slug: 'covers-pieces-line', html: expandedHtml({ payAmt: '360' }) },
    { slug: 'set-price-first', html: expandedHtml({ noPrice: true, payAmt: '360' }) },
    { slug: 'no-dropoffs-yet', html: noDropoffsHtml() },
    { slug: 'activity-list', html: expandedHtml() },
    { slug: 'uneven-check-change-link', html: unevenCheckHtml() },
    { slug: 'first-visit-before-save', html: firstVisitBeforeHtml() },
    { slug: 'first-visit-after-save', html: firstVisitAfterHtml() },
  ]

  for (const { slug, html } of scenarios) {
    for (const [suffix, w, h] of [['desktop-1280', 1280, slug === 'activity-list' ? 700 : 1200], ['phone-390', 390, 1400]]) {
      await page.setViewportSize({ width: w, height: h })
      await page.setContent(html, { waitUntil: 'networkidle' })
      await page.screenshot({ path: `${OUT}/${slug}-${suffix}.png`, fullPage: true })
    }
  }

  await browser.close()
  console.log('Wrote screenshots to', OUT)
}

main().catch(e => { console.error(e); process.exit(1) })

/**
 * Mock-data screenshots for Jerky consignment store tab (no Supabase writes).
 * Usage: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/jerky-consign-screenshots.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { buildActivityLedger, missingSummary, recon, safeOnShelf, hasDropActivity, paymentPiecesFromCheck } from '../lib/consignmentRecon.js'

const OUT = '/opt/cursor/artifacts/jerky-consign-screenshots'
mkdirSync(OUT, { recursive: true })

const CHAR = '#2B2018', CREAM = '#F6F0E6', INK = '#2B2018', MUTED = '#8A7A66', GREEN = '#3E7C4F', BORDER = '#E6DBC8', CARDBG = '#FFFDF9', KRAFT = '#A9763A', SPICE = '#C8462C'
const num = 'font-family:Inter,sans-serif;font-variant-numeric:tabular-nums'

const money = (n) => '$' + (Math.round(Number(n) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const money2 = (n) => '$' + (Math.round(Number(n) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const m0 = (n) => '$' + Math.round(Number(n) || 0).toLocaleString()

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
  if (!hasDropActivity(r)) return 'No drop-offs yet'
  if (r.status === 'tracking') {
    const n = safeOnShelf(r.expected)
    return r.asOfDate ? `Should be on shelf: ${n} (as of ${fmtD(r.asOfDate)})` : `Should be on shelf: ${n}`
  }
  return `Should be on shelf: ${safeOnShelf(r.expected)}`
}

function todayEtIso() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

function expandedHtml(opts = {}) {
  const { noPrice = false, payAmt = '360', store = exampleStore } = opts
  const c = { ...store, price: noPrice ? 0 : store.price, ...recon({ ...store, price: noPrice ? 0 : store.price }) }
  const ledger = buildActivityLedger(c)
  const today = todayEtIso()
  const payCalc = Number(payAmt) > 0 && c.price > 0 ? paymentPiecesFromCheck(Number(payAmt), c.price) : null
  const payCover = !c.price
    ? 'Set price per bag below first'
    : payCalc?.even
      ? `Covers ${payCalc.rounded} pieces at ${money2(c.price)}/bag`
      : payCalc
        ? `Covers ${Math.round(payCalc.exact * 10) / 10} pieces at ${money2(c.price)}/bag, doesn't divide evenly`
        : ''
  const ledgerRows = ledger.map(row => `
    <div style="display:grid;grid-template-columns:minmax(0,88px) minmax(0,1fr) minmax(0,72px);gap:8px;padding:8px 12px;border-top:1px solid ${CREAM};font-size:12.5px">
      <span style="${num};color:#BFB096">${row.dateIso ? fmtD(row.dateIso) : 'Undated'}</span>
      <span style="color:${MUTED}">${row.label} (${row.onShelf})</span>
      <span style="${num};text-align:right;font-weight:600">${row.onShelf}</span>
    </div>`).join('')
  const badge = badgeText(c)
  const field = (label, ph = '', val = '') => `
    <label style="display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box">
      <div style="font-size:12px;font-weight:600;color:${MUTED};margin-bottom:4px">${label}</div>
      <input value="${val}" placeholder="${ph}" style="width:100%;max-width:100%;box-sizing:border-box;padding:10px;border:1px solid ${BORDER};display:block;min-width:0;${num}"/>
    </label>`
  const priceVal = noPrice ? '' : String(c.price)
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"></head>
  <body style="margin:0;background:${CREAM};padding:16px;font-family:Inter,sans-serif;color:${INK};box-sizing:border-box">
  <div style="border:1px solid ${CHAR};background:${CARDBG};border-radius:2px;overflow:hidden;max-width:100%;box-sizing:border-box">
    <div style="padding:15px 18px;border-bottom:1px solid ${CREAM}">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="min-width:0;flex:1"><div style="font-weight:700;font-size:20px">${c.store}</div>
        <div style="font-size:12px;color:${MUTED};margin-top:4px;line-height:1.45">${money2(c.price || 0)}/bag · dropped off ${c.sent} · paid for ${c.paidUnits} pieces</div></div>
        <span style="background:${hasDropActivity(c) ? KRAFT : MUTED};color:#fff;padding:5px 11px;font-size:10px;font-weight:600;border-radius:2px;max-width:min(220px,100%);text-align:right;line-height:1.35;flex-shrink:0">${badge}</span>
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
      <div style="margin-bottom:14px"><div style="font-weight:700;font-size:14px">1. Dropped off</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;max-width:100%">${field('Drop-off date', '', today)}${field('Pieces added', 'e.g. 100')}
        <button style="width:100%;box-sizing:border-box;padding:11px;border:none;background:${CHAR};color:#fff;font-weight:600">Save drop-off</button></div></div>
      <div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:600;color:#96866C;text-transform:uppercase;margin-bottom:6px">Price per bag</div>
        <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center"><span style="color:${MUTED}">$</span><input value="${priceVal}" placeholder="4.50" style="width:110px;max-width:100%;padding:10px;border:1px solid ${BORDER};box-sizing:border-box;${num}"/><button style="background:${CHAR};color:#fff;border:none;padding:10px 16px;font-weight:600">Save</button></div>
        <div style="font-weight:700;font-size:14px">2. Got paid</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">${field('Date paid', '', today)}${field('Check amount $', 'e.g. 360', payAmt)}
        <div style="font-size:12.5px;color:${!c.price ? '#C03A22' : MUTED};line-height:1.45">${payCover}</div>
        <button style="width:100%;box-sizing:border-box;padding:11px;border:none;background:${GREEN};color:#fff;font-weight:600;opacity:${!c.price ? 0.45 : 1}">Save payment</button></div></div>
      <div style="margin-bottom:14px"><div style="font-weight:700;font-size:14px">3. Picked up bags</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">${field('Date picked up', '', today)}${field('Pieces picked up', 'e.g. 5')}
        <button style="width:100%;box-sizing:border-box;padding:11px;border:none;background:${KRAFT};color:#fff;font-weight:600">Save pickup</button></div></div>
      <details open><summary style="font-weight:600;font-size:13px;cursor:pointer;margin-bottom:8px">Did a shelf count? (optional)</summary>
        <p style="font-size:12px;color:${MUTED}">Collapsed by default in the live app.</p></details>
    </div>
  </div></body></html>`
}

function noDropoffsHtml() {
  const empty = { store: 'River Market Co-op', price: 5, sent: 0, returned: 0, paid: 0, counted: null, log: [] }
  return expandedHtml({ store: empty, payAmt: '' })
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  const shots = [
    { name: 'store-card-all-steps-desktop-1280', w: 1280, h: 1200, html: expandedHtml() },
    { name: 'store-card-all-steps-phone-390', w: 390, h: 1400, html: expandedHtml() },
    { name: 'covers-pieces-line-desktop-1280', w: 1280, h: 900, html: expandedHtml({ payAmt: '360' }) },
    { name: 'set-price-first-desktop-1280', w: 1280, h: 900, html: expandedHtml({ noPrice: true, payAmt: '360' }) },
    { name: 'no-dropoffs-yet-desktop-1280', w: 1280, h: 700, html: noDropoffsHtml() },
    { name: 'activity-list-desktop-1280', w: 1280, h: 600, html: expandedHtml() },
  ]

  for (const s of shots) {
    await page.setViewportSize({ width: s.w, height: s.h })
    await page.setContent(s.html, { waitUntil: 'networkidle' })
    await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: true })
  }

  await browser.close()
  console.log('Wrote screenshots to', OUT)
}

main().catch(e => { console.error(e); process.exit(1) })

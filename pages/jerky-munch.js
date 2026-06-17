import { useState, useRef } from 'react'
import Head from 'next/head'

const CHAR = '#2B2018', SPICE = '#C8462C', KRAFT = '#A9763A', CREAM = '#F6F0E6'
const INK = '#2B2018', MUTED = '#8A7A66', GREEN = '#3E7C4F', BORDER = '#E6DBC8', AMBER = '#C98A2A', RED = '#C03A22'
const CARDBG = '#FFFDF9'
const BIZ = 'Jerky Munch'

const money = (n) => '$' + (Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const m0 = (n) => '$' + Math.round(n).toLocaleString()
const sgn = (n) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString()
const uid = () => Math.random().toString(36).slice(2, 9)
const todayStr = new Date().toISOString().slice(0, 10)
const fmtD = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'

// consignment reconciliation
const recon = (c) => {
  const paidUnits = c.price > 0 ? Math.round(c.paid / c.price) : 0
  const expected = c.sent - c.returned - paidUnits      // should still be on the shelf
  const variance = expected - c.counted                 // + = missing / shrinkage
  return { paidUnits, expected, variance, varVal: variance * c.price,
    status: c.counted == null ? 'uncounted' : variance === 0 ? 'reconciled' : variance > 0 ? 'short' : 'over' }
}

const SEED_CONSIGN = [
  { id: uid(), store: 'Cumberland Farms — Brick', price: 6, sent: 120, returned: 10, paid: 480, counted: 24, countedDate: '2026-06-09', diagnosis: '', log: [{ at: 'Jun 9', t: 'Counted 24 on shelf' }, { at: 'Jun 2', t: 'Check received $480' }] },
  { id: uid(), store: 'Wawa Pilot — Rt 37', price: 6.5, sent: 200, returned: 0, paid: 845, counted: 60, countedDate: '2026-06-11', diagnosis: '', log: [{ at: 'Jun 11', t: 'Counted 60 on shelf' }, { at: 'May 28', t: 'Check received $845' }] },
  { id: uid(), store: 'CrossFit Toms River', price: 7, sent: 60, returned: 5, paid: 280, counted: 15, countedDate: '2026-06-10', diagnosis: '', log: [{ at: 'Jun 10', t: 'Counted 15 — reconciles clean' }, { at: 'Jun 1', t: 'Check received $280' }] },
  { id: uid(), store: 'Jersey Shore Surf Co', price: 6, sent: 90, returned: 0, paid: 180, counted: 55, countedDate: '2026-06-08', diagnosis: '', log: [{ at: 'Jun 8', t: 'Counted 55 on shelf' }, { at: 'May 30', t: 'Check received $180' }] },
  { id: uid(), store: 'Local Butcher Collective', price: 6.5, sent: 75, returned: 0, paid: 0, counted: 75, countedDate: '2026-05-20', diagnosis: '', log: [{ at: 'May 20', t: 'Shipped 75 units' }] },
]

const SEED_DIRECT = [
  { id: uid(), who: 'Online store (Shopify)', source: 'Shopify / online', units: 120, rev: 1188 },
  { id: uid(), who: 'Farmers Market — Toms River', source: 'Farmers market', units: 45, rev: 405 },
  { id: uid(), who: 'Acme Corp — office bulk order', source: 'Wholesale / bulk', units: 60, rev: 480 },
  { id: uid(), who: 'Gym pop-up weekend', source: 'Pop-up event', units: 30, rev: 270 },
]
const DIRECT_SOURCES = ['Shopify / online', 'Farmers market', 'Pop-up event', 'Wholesale / bulk', 'Other']

const SEED_ADS = [
  { id: uid(), channel: 'Instagram Ads', spend: 600, rev: 2400, track: 'Meta pixel + code IG10', tracked: true },
  { id: uid(), channel: 'Influencer — @njfoodie', spend: 400, rev: 1600, track: 'Promo code NJFOODIE', tracked: true },
  { id: uid(), channel: 'Google Search', spend: 300, rev: 900, track: 'Google conversion tag', tracked: true },
  { id: uid(), channel: 'Facebook Ads', spend: 450, rev: 180, track: 'Meta pixel', tracked: true },
  { id: uid(), channel: 'Local 5K Sponsorship', spend: 250, rev: 150, track: 'Estimated — needs a promo code', tracked: false },
  { id: uid(), channel: 'Flyers / print', spend: 120, rev: 90, track: 'Estimated — needs a promo code', tracked: false },
]
const COGS_CATS = ['Ingredients', 'Packaging']
const DIAGNOSES = ['', 'Sold but not reported (store owes me)', 'Theft / shrinkage', 'Damaged or expired', 'Free samples given out', 'Miscount — recount needed', 'Unknown — investigating']
const verdict = (roas) => roas >= 2 ? { c: GREEN, t: 'Scale' } : roas >= 1 ? { c: AMBER, t: 'Watch' } : { c: RED, t: 'Cut' }

const PAY = [{ id: 'business', label: 'Business acct', color: MUTED }, { id: 'personal', label: 'Personal CC', color: RED }]
const PAYM = Object.fromEntries(PAY.map(p => [p.id, p]))
const SEED_EXPENSES = [
  { id: uid(), vendor: 'Beef supplier — Sysco', cat: 'Ingredients', amt: 1850, pay: 'business' },
  { id: uid(), vendor: 'Packaging & bags', cat: 'Packaging', amt: 420, pay: 'personal' },
  { id: uid(), vendor: 'Spices & cure', cat: 'Ingredients', amt: 260, pay: 'personal' },
  { id: uid(), vendor: 'Farmers market booth fee', cat: 'Fees', amt: 150, pay: 'personal' },
  { id: uid(), vendor: 'Dehydrator repair', cat: 'Equipment', amt: 180, pay: 'business' },
  { id: uid(), vendor: 'Gas & deliveries', cat: 'Travel', amt: 220, pay: 'personal' },
  { id: uid(), vendor: 'Labels — Vistaprint', cat: 'Packaging', amt: 95, pay: 'personal' },
]

// 11 prior months (current month is appended live) for the multi-month P&L
const MONTH_SERIES = [
  { m: 'Jul', directRev: 1200, consignRev: 900, cogs: 1450, adSpend: 700, opexNonAd: 480 },
  { m: 'Aug', directRev: 1320, consignRev: 980, cogs: 1520, adSpend: 780, opexNonAd: 500 },
  { m: 'Sep', directRev: 1450, consignRev: 1050, cogs: 1600, adSpend: 850, opexNonAd: 510 },
  { m: 'Oct', directRev: 1600, consignRev: 1150, cogs: 1720, adSpend: 950, opexNonAd: 520 },
  { m: 'Nov', directRev: 1800, consignRev: 1300, cogs: 1900, adSpend: 1200, opexNonAd: 560 },
  { m: 'Dec', directRev: 2200, consignRev: 1600, cogs: 2150, adSpend: 1500, opexNonAd: 620 },
  { m: 'Jan', directRev: 1500, consignRev: 1100, cogs: 1700, adSpend: 900, opexNonAd: 520 },
  { m: 'Feb', directRev: 1650, consignRev: 1200, cogs: 1780, adSpend: 1050, opexNonAd: 540 },
  { m: 'Mar', directRev: 1820, consignRev: 1380, cogs: 2050, adSpend: 1350, opexNonAd: 600 },
  { m: 'Apr', directRev: 1900, consignRev: 1450, cogs: 2180, adSpend: 1500, opexNonAd: 620 },
  { m: 'May', directRev: 1980, consignRev: 1510, cogs: 2280, adSpend: 1650, opexNonAd: 640 },
]
const mLine = (mo) => {
  const rev = mo.directRev + mo.consignRev, gross = rev - mo.cogs, opex = mo.adSpend + mo.opexNonAd
  return { m: mo.m, directRev: mo.directRev, consignRev: mo.consignRev, rev, cogs: mo.cogs, gross, ad: mo.adSpend, otherOpex: mo.opexNonAd, opex, net: gross - opex }
}
const PNL_ROWS = [
  { label: 'Direct sales', key: 'directRev', kind: 'line', cost: false },
  { label: 'Consignment collected', key: 'consignRev', kind: 'line', cost: false },
  { label: 'Total revenue', key: 'rev', kind: 'subtotal', cost: false },
  { label: 'Cost of goods sold', key: 'cogs', kind: 'line', cost: true },
  { label: 'Gross profit', key: 'gross', kind: 'subtotal', cost: false },
  { label: 'Advertising', key: 'ad', kind: 'line', cost: true },
  { label: 'Other operating costs', key: 'otherOpex', kind: 'line', cost: true },
  { label: 'Total operating expenses', key: 'opex', kind: 'subtotal', cost: true },
  { label: 'Net profit / loss', key: 'net', kind: 'total', cost: false },
]

// products sold this month (swap illustrations for real photos anytime)
const PRODUCTS = [
  { name: 'Original Beef', color: '#8B3A2B', sold: 78 },
  { name: 'Teriyaki', color: '#A9763A', sold: 64 },
  { name: 'Spicy Habanero', color: '#C8462C', sold: 52 },
  { name: 'Peppered', color: '#5B4636', sold: 33 },
  { name: 'Turkey Jerky', color: '#C99A2E', sold: 20 },
]
const Bag = ({ color }) => (
  <svg width="58" height="58" viewBox="0 0 64 64" style={{ display: 'block', margin: '0 auto' }}>
    <rect x="13" y="8" width="38" height="9" rx="2" fill={color} opacity="0.5" />
    <rect x="14" y="14" width="36" height="44" rx="6" fill={color} />
    <rect x="14" y="14" width="36" height="11" rx="6" fill="#000" opacity="0.08" />
    <rect x="20" y="28" width="24" height="20" rx="3" fill="#FFFDF9" opacity="0.95" />
    <rect x="23" y="33" width="18" height="3" rx="1.5" fill={color} />
    <rect x="23" y="39" width="12" height="3" rx="1.5" fill={color} opacity="0.55" />
  </svg>
)

const MONO = "'IBM Plex Mono', monospace"

export default function JerkyMunch() {
  const [tab, setTab] = useState('overview')
  const [consign, setConsign] = useState(SEED_CONSIGN)
  const [direct, setDirect] = useState(SEED_DIRECT)
  const [ads, setAds] = useState(SEED_ADS)
  const [expanded, setExpanded] = useState(null)
  const [draft, setDraft] = useState({})
  const [adding, setAdding] = useState(false)
  const [cf, setCf] = useState({ store: '', price: '', sent: '' })
  const [expenses, setExpenses] = useState(SEED_EXPENSES)
  const [addingE, setAddingE] = useState(false)
  const [ef, setEf] = useState({ vendor: '', amt: '', pay: 'personal' })
  const [addingD, setAddingD] = useState(false)
  const [df, setDf] = useState({ who: '', source: 'Shopify / online', units: '', rev: '' })
  const [pnlMonths, setPnlMonths] = useState(2)
  const [pnlView, setPnlView] = useState('single')
  const [logoOk, setLogoOk] = useState(true)
  const [addingA, setAddingA] = useState(false)
  const [af, setAf] = useState({ channel: '', spend: '', rev: '', track: '' })
  const [coa, setCoa] = useState({ name: 'chart-of-accounts.csv', rows: 48 })
  const [gl, setGl] = useState({ name: 'general-ledger-jun.csv', rows: 142 })
  const fileRef = useRef(null)
  const coaRef = useRef(null)
  const glRef = useRef(null)

  const dv = (k) => draft[k] || ''
  const setDv = (k, v) => setDraft({ ...draft, [k]: v })
  const upd = (id, patch, logEntry) => setConsign(consign.map(c => c.id === id
    ? { ...c, ...patch, log: logEntry ? [{ at: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }), t: logEntry }, ...(c.log || [])] : c.log } : c))

  const logCheck = (id) => { const a = Number(dv(id + '_chk')); if (a > 0) { const c = consign.find(x => x.id === id); upd(id, { paid: c.paid + a }, `Check received ${m0(a)}`); setDv(id + '_chk', '') } }
  const logCount = (id) => { const n = dv(id + '_cnt'); if (n !== '') { upd(id, { counted: Number(n), countedDate: todayStr }, `Counted ${n} on shelf`); setDv(id + '_cnt', '') } }
  const shipMore = (id) => { const n = Number(dv(id + '_shp')); if (n > 0) { const c = consign.find(x => x.id === id); upd(id, { sent: c.sent + n }, `Shipped ${n} more units`); setDv(id + '_shp', '') } }
  const addPartner = () => { if (!cf.store.trim()) return; setConsign([{ id: uid(), store: cf.store.trim(), price: Number(cf.price) || 0, sent: Number(cf.sent) || 0, returned: 0, paid: 0, counted: null, countedDate: '', diagnosis: '', log: [{ at: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }), t: 'Added consignment partner' }] }, ...consign]); setCf({ store: '', price: '', sent: '' }); setAdding(false) }
  const setExpensePay = (id, pay) => setExpenses(expenses.map(e => e.id === id ? { ...e, pay } : e))
  const addExpense = () => { if (!ef.vendor.trim()) return; setExpenses([{ id: uid(), vendor: ef.vendor.trim(), cat: 'Other', amt: Number(ef.amt) || 0, pay: ef.pay }, ...expenses]); setEf({ vendor: '', amt: '', pay: 'personal' }); setAddingE(false) }
  const importCSV = (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const rows = String(ev.target.result || '').split(/\r?\n/).map(r => r.trim()).filter(Boolean)
      const out = []
      rows.forEach((r, i) => {
        const cols = r.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        if (i === 0 && /vendor|name|descr|item/i.test(cols[0] || '')) return
        const vendor = cols[0], amt = Number((cols[1] || '').replace(/[$,]/g, ''))
        if (!vendor || !amt) return
        out.push({ id: uid(), vendor, cat: cols[2] || 'Other', amt, pay: /personal/i.test(cols[3] || '') ? 'personal' : 'business' })
      })
      if (out.length) setExpenses(prev => [...out, ...prev])
      e.target.value = ''
    }
    reader.readAsText(file)
  }
  const importBook = (e, setter) => { const file = e.target.files && e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => { const rows = String(ev.target.result || '').split(/\r?\n/).filter(r => r.trim()).length; setter({ name: file.name, rows: Math.max(rows - 1, 0) }) }; reader.readAsText(file); e.target.value = '' }
  const addDirect = () => { if (!df.who.trim()) return; setDirect([{ id: uid(), who: df.who.trim(), source: df.source, units: Number(df.units) || 0, rev: Number(df.rev) || 0 }, ...direct]); setDf({ who: '', source: 'Shopify / online', units: '', rev: '' }); setAddingD(false) }
  const removeDirect = (id) => setDirect(direct.filter(d => d.id !== id))
  const addAd = () => { if (!af.channel.trim()) return; const tr = af.track.trim(); setAds([{ id: uid(), channel: af.channel.trim(), spend: Number(af.spend) || 0, rev: Number(af.rev) || 0, track: tr || 'Estimated — needs a promo code', tracked: !!tr }, ...ads]); setAf({ channel: '', spend: '', rev: '', track: '' }); setAddingA(false) }
  const removeAd = (id) => setAds(ads.filter(a => a.id !== id))
  const setAdField = (id, f, v) => setAds(ads.map(a => a.id !== id ? a : (f === 'track' ? { ...a, track: v, tracked: v.trim().length > 0 } : { ...a, [f]: Number(v) || 0 })))

  // aggregates
  const R = consign.map(c => ({ ...c, ...recon(c) }))
  const cashCollected = consign.reduce((s, c) => s + c.paid, 0)
  const onShelfVal = R.reduce((s, c) => s + Math.max(c.expected, 0) * c.price, 0)
  const missUnits = R.reduce((s, c) => s + (c.variance > 0 ? c.variance : 0), 0)
  const missVal = R.reduce((s, c) => s + (c.variance > 0 ? c.varVal : 0), 0)
  const worst = R.filter(c => c.variance > 0).sort((a, b) => b.variance - a.variance)[0]
  const directRev = direct.reduce((s, d) => s + d.rev, 0)
  const directUnits = direct.reduce((s, d) => s + d.units, 0)
  const adSpend = ads.reduce((s, a) => s + a.spend, 0)
  const adRev = ads.reduce((s, a) => s + a.rev, 0)
  const redAds = ads.filter(a => a.rev / a.spend < 1)
  const wastedSpend = redAds.reduce((s, a) => s + a.spend, 0)
  const wastedReturn = redAds.reduce((s, a) => s + a.rev, 0)
  const revenue = directRev + cashCollected
  const totalExp = expenses.reduce((s, e) => s + e.amt, 0)
  const personalExp = expenses.filter(e => e.pay === 'personal').reduce((s, e) => s + e.amt, 0)
  const businessExp = totalExp - personalExp

  // P&L
  const pct = (n) => revenue ? Math.round(n / revenue * 100) : 0
  const cogs = expenses.filter(e => COGS_CATS.includes(e.cat)).reduce((s, e) => s + e.amt, 0)
  const opexNonAd = expenses.filter(e => !COGS_CATS.includes(e.cat)).reduce((s, e) => s + e.amt, 0)
  const grossProfit = revenue - cogs
  const totalOpex = opexNonAd + adSpend
  const netProfit = grossProfit - totalOpex
  const bagsSold = PRODUCTS.reduce((s, p) => s + p.sold, 0)
  const bagsOut = R.reduce((s, c) => s + Math.max(c.expected, 0), 0)

  // multi-month series — current month appended live so interactivity flows through
  const thisMonth = new Date().toLocaleString('en-US', { month: 'short' })
  const monthsAll = [...MONTH_SERIES, { m: thisMonth, directRev, consignRev: cashCollected, cogs, adSpend, opexNonAd }]
  const lines = monthsAll.slice(-pnlMonths).map(mLine)
  const lastL = lines[lines.length - 1]
  const baseL = lines[0]
  const tMovers = [
    { label: 'direct sales', key: 'directRev', cost: false },
    { label: 'consignment', key: 'consignRev', cost: false },
    { label: 'cost of goods', key: 'cogs', cost: true },
    { label: 'advertising', key: 'ad', cost: true },
    { label: 'other operating costs', key: 'otherOpex', cost: true },
  ].map(d => ({ ...d, delta: (d.cost ? -lastL[d.key] : lastL[d.key]) - (d.cost ? -baseL[d.key] : baseL[d.key]) }))
  const tBest = tMovers.slice().sort((a, b) => b.delta - a.delta)[0]
  const tWorst = tMovers.slice().sort((a, b) => a.delta - b.delta)[0]
  const tNetDelta = lastL.net - baseL.net
  const tRevDelta = lastL.rev - baseL.rev
  const rangeNet = lines.reduce((s, l) => s + l.net, 0)
  const rangeRev = lines.reduce((s, l) => s + l.rev, 0)

  const card = { background: CARDBG, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px' }
  const lbl = { fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.1px', color: '#96866C' }
  const inp = { padding: '10px 12px', fontSize: '14px', border: `1px solid ${BORDER}`, borderRadius: '9px', background: CREAM, color: INK, outline: 'none', fontFamily: 'inherit' }
  const big = { fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.4px' }
  const btn = { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.1px', cursor: 'pointer' }

  const KPI = ({ k, v, sub, accent }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px', padding: '15px 17px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...big, fontSize: '29px', color: accent || INK, lineHeight: 1.15, marginTop: '4px' }}>{v}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 400, color: '#A2937A', marginTop: '3px' }}>{sub}</div>
    </div>
  )
  const Row = ({ l, v, neg, bold, top }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: top ? `1px solid ${BORDER}` : 'none' }}>
      <span style={{ fontSize: '13px', color: bold ? INK : MUTED, fontWeight: bold ? 600 : 400 }}>{l}</span>
      <span style={{ fontFamily: MONO, fontSize: '13px', color: neg ? RED : (bold ? INK : MUTED), fontWeight: bold ? 600 : 400 }}>{v}</span>
    </div>
  )
  const Pill = ({ value, opts, map, onChange }) => (
    <select value={value} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); onChange(e.target.value) }}
      style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', padding: '6px 26px 6px 12px', borderRadius: '20px', border: 'none',
        fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.1px', color: '#fff',
        background: `${map[value].color} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 3.5L5 6.5L8 3.5' stroke='white' stroke-width='1.4' fill='none'/></svg>") no-repeat right 9px center` }}>
      {opts.map(o => <option key={o.id} value={o.id} style={{ color: INK, background: '#fff' }}>{o.label}</option>)}
    </select>
  )

  const TABS = [['overview', 'Overview'], ['pnl', 'P&L'], ['consign', 'Consignment'], ['direct', 'Direct Sales'], ['ads', 'Advertising']]
  const EXTRA = [['expenses', 'Expenses'], ['quickbooks', 'QuickBooks sync'], ['askai', 'Ask AI']]
  const currentLabel = ([...TABS, ...EXTRA].find(t => t[0] === tab) || ['', ''])[1]

  return (
    <>
      <Head>
        <title>{BIZ} — Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/jerky-munch.webmanifest" />
        <meta name="theme-color" content="#2B2018" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jerky Munch" />
        <link rel="apple-touch-icon" href="/jerky-icon.svg" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}body{background:${CREAM};font-family:'Inter',sans-serif;color:${INK}}::placeholder{color:#A99A82}
.jm-shell{display:flex;min-height:100vh;align-items:stretch}
.jm-side{width:236px;flex-shrink:0;background:${CHAR};color:${CREAM};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.jm-nav{display:flex;flex-direction:column;gap:3px;flex:1}
.jm-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:10px;border:none;background:transparent;color:#B6A78C;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s}
.jm-navbtn:hover{background:rgba(255,255,255,.08);color:${CREAM}}
.jm-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px}
@media(max-width:860px){.jm-shell{flex-direction:column}.jm-side{width:auto;height:auto;position:static;flex-direction:column;padding:14px 12px}.jm-nav{flex-direction:row;overflow-x:auto;gap:6px;padding-bottom:4px}.jm-navbtn{width:auto;padding:8px 15px;border-radius:18px;background:rgba(255,255,255,.07)}.jm-main{padding:18px 16px 52px;max-width:100%}}`}</style>
      </Head>

      <div className="jm-shell">
        {/* Sidebar */}
        <aside className="jm-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <div style={{ ...big, fontSize: '25px', letterSpacing: '-0.5px', lineHeight: 1 }}>
              <span style={{ color: SPICE }}>Jerky</span> <span style={{ color: '#E0863A' }}>Munch</span>
            </div>
            <div style={{ ...lbl, color: '#B6A78C', marginTop: '7px' }}>Dashboard</div>
          </div>
          <nav className="jm-nav">
            {TABS.map(([id, label]) => {
              const active = tab === id
              return (
                <button key={id} className="jm-navbtn" onClick={() => { setTab(id); setExpanded(null) }}
                  style={active ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${SPICE}` } : undefined}>
                  {label}
                </button>
              )
            })}
            <div style={{ ...lbl, color: '#7A6A52', fontSize: '10px', margin: '16px 14px 6px' }}>Tools</div>
            {EXTRA.map(([id, label]) => {
              const active = tab === id
              return (
                <button key={id} className="jm-navbtn" onClick={() => { setTab(id); setExpanded(null) }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', ...(active ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${SPICE}` } : {}) }}>
                  <span>{label}</span>
                  {id === 'quickbooks'
                    ? <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4FbE6A', flexShrink: 0 }} />
                    : id === 'askai'
                      ? <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', background: SPICE, padding: '2px 6px', borderRadius: '10px', flexShrink: 0 }}>AI</span>
                      : null}
                </button>
              )
            })}
          </nav>
          <div style={{ padding: '12px 10px 0', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: '8px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: '#8A7A66', lineHeight: 1.6 }}>Built &amp; maintained by<br /><span style={{ color: SPICE, fontWeight: 600 }}>JK No Jokes Financials</span></div>
          </div>
        </aside>

        {/* Main */}
        <main className="jm-main">
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '22px' }}>
            <div>
              <div style={{ ...lbl, color: SPICE }}>Jerky Munch</div>
              <h1 style={{ ...big, fontSize: '28px', color: INK, letterSpacing: '0.3px', lineHeight: 1.1 }}>{currentLabel}</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ ...big, fontSize: '24px', color: SPICE }}>{m0(revenue)}</div>
              <div style={{ ...lbl, color: '#9A8868' }}>REVENUE THIS MONTH</div>
            </div>
          </div>

          {/* ===== OVERVIEW ===== */}
          {tab === 'overview' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Bags sold this month" v={bagsSold} sub="across all flavors" accent={INK} />
                <KPI k="Revenue / mo" v={m0(revenue)} sub={`${bagsSold} bags · direct + consignment`} accent={SPICE} />
                <KPI k="Out on consignment" v={m0(onShelfVal)} sub={`${bagsOut} bags sitting in stores`} accent={KRAFT} />
                <KPI k="Missing pieces" v={`${missUnits}`} sub={`${m0(missVal)} to investigate`} accent={missUnits ? RED : GREEN} />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ ...card, flex: 1, minWidth: '290px' }}>
                  <div style={{ ...lbl, marginBottom: '14px' }}>Top consignment stores</div>
                  {(() => { const sorted = R.slice().sort((a, b) => b.paid - a.paid); const max = sorted[0]?.paid || 1; return sorted.map((c, i) => (
                    <div key={c.id} style={{ padding: '9px 0', borderTop: i ? `1px solid ${CREAM}` : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: INK, fontSize: '14px' }}>{c.store}</span>
                        <span style={{ ...big, fontSize: '15px', color: INK }}>{m0(c.paid)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: CREAM, borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(c.paid / max * 100)}%`, height: '100%', background: KRAFT }} />
                        </div>
                        <span style={{ fontSize: '11px', color: MUTED, whiteSpace: 'nowrap' }}>{c.paidUnits} bags sold</span>
                      </div>
                    </div>
                  )) })()}
                </div>
                <div style={{ ...card, flex: 1, minWidth: '290px' }}>
                  <div style={{ ...lbl, marginBottom: '14px' }}>Top direct sales</div>
                  {(() => { const sorted = direct.slice().sort((a, b) => b.rev - a.rev); const max = sorted[0]?.rev || 1; return sorted.map((d, i) => (
                    <div key={d.id} style={{ padding: '9px 0', borderTop: i ? `1px solid ${CREAM}` : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: INK, fontSize: '14px' }}>{d.who}</span>
                        <span style={{ ...big, fontSize: '15px', color: GREEN }}>{m0(d.rev)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: CREAM, borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(d.rev / max * 100)}%`, height: '100%', background: GREEN }} />
                        </div>
                        <span style={{ fontSize: '11px', color: MUTED, whiteSpace: 'nowrap' }}>{d.units} bags · {d.source}</span>
                      </div>
                    </div>
                  )) })()}
                </div>
              </div>

              <div style={{ ...card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ ...lbl }}>Sold this month, by flavor</div>
                  <div style={{ fontSize: '13px', color: MUTED }}><b style={{ ...big, fontSize: '18px', color: INK }}>{bagsSold}</b> bags total</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '12px' }}>
                  {PRODUCTS.slice().sort((a, b) => b.sold - a.sold).map(p => (
                    <div key={p.name} style={{ border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px 12px 14px', textAlign: 'center', background: CREAM }}>
                      <Bag color={p.color} />
                      <div style={{ fontWeight: 600, color: INK, marginTop: '8px', fontSize: '14px' }}>{p.name}</div>
                      <div style={{ ...big, fontSize: '26px', color: INK, marginTop: '4px' }}>{p.sold}</div>
                      <div style={{ fontSize: '11px', color: MUTED }}>bags this month</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: MUTED, marginTop: '14px' }}>These are placeholder illustrations — drop in real product photos whenever you like.</p>
              </div>
            </>
          )}

          {/* ===== P&L ===== */}
          {tab === 'pnl' && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[['single', 'This month'], ['compare', 'Compare months']].map(([v, l]) => (
                <button key={v} onClick={() => setPnlView(v)} style={{ padding: '8px 16px', borderRadius: '18px', border: `1px solid ${pnlView === v ? CHAR : BORDER}`, background: pnlView === v ? CHAR : CARDBG, color: pnlView === v ? CREAM : MUTED, ...btn }}>{l}</button>
              ))}
            </div>
          )}

          {tab === 'pnl' && pnlView === 'single' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Revenue" v={m0(revenue)} sub="direct + consignment" accent={GREEN} />
                <KPI k="Gross profit" v={m0(grossProfit)} sub={`${pct(grossProfit)}% margin`} accent={KRAFT} />
                <KPI k={netProfit >= 0 ? 'Net profit' : 'Net loss'} v={m0(netProfit)} sub={netProfit >= 0 ? 'in the black' : 'in the red'} accent={netProfit >= 0 ? GREEN : RED} />
              </div>

              <div style={{ ...card }}>
                <div style={{ ...lbl, marginBottom: '14px' }}>Profit &amp; loss — this month (cash basis)</div>
                <div style={{ ...lbl, color: KRAFT, margin: '4px 0' }}>Revenue</div>
                <Row l="Direct sales" v={m0(directRev)} />
                <Row l="Consignment (collected)" v={m0(cashCollected)} />
                <Row l="Total revenue" v={m0(revenue)} bold top />
                <div style={{ ...lbl, color: KRAFT, margin: '16px 0 4px' }}>Cost of goods sold</div>
                {COGS_CATS.map(cat => { const v = expenses.filter(e => e.cat === cat).reduce((s, e) => s + e.amt, 0); return v > 0 ? <Row key={cat} l={cat} v={`−${m0(v)}`} /> : null })}
                <Row l="Total COGS" v={`−${m0(cogs)}`} bold top />
                <Row l={`Gross profit  ·  ${pct(grossProfit)}% margin`} v={m0(grossProfit)} bold top />
                <div style={{ ...lbl, color: KRAFT, margin: '16px 0 4px' }}>Operating expenses</div>
                <Row l="Advertising" v={`−${m0(adSpend)}`} />
                {[...new Set(expenses.filter(e => !COGS_CATS.includes(e.cat)).map(e => e.cat))].map(cat => { const v = expenses.filter(e => e.cat === cat).reduce((s, e) => s + e.amt, 0); return <Row key={cat} l={cat} v={`−${m0(v)}`} /> })}
                <Row l="Total operating expenses" v={`−${m0(totalOpex)}`} bold top />
                <div style={{ marginTop: '12px', padding: '12px 14px', background: netProfit >= 0 ? '#EAF3EC' : '#FBEDE9', borderRadius: '10px' }}>
                  <Row l={`${netProfit >= 0 ? 'Net profit' : 'Net loss'}  ·  ${pct(netProfit)}% margin`} v={m0(netProfit)} bold neg={netProfit < 0} />
                </div>
              </div>

              <div style={{ ...card, marginTop: '16px', background: CHAR, borderColor: CHAR, color: CREAM, fontSize: '14px', lineHeight: 1.6 }}>
                <div style={{ ...lbl, color: '#E8A07F', marginBottom: '8px' }}>The CFO read</div>
                {netProfit < 0
                  ? <>You're <b>{m0(-netProfit)} in the red</b> this month — fixable, not fatal. Two levers: cut the <b>{m0(wastedSpend - wastedReturn)}</b> of dead ad spend and collect the <b>{m0(missVal)}</b> you're owed on missing consignment units. Do both and this swings toward black — <i>without selling one extra bag.</i></>
                  : <>You netted <b>{m0(netProfit)}</b>. Cut the <b>{m0(wastedSpend - wastedReturn)}</b> of dead ad spend and collect the <b>{m0(missVal)}</b> you're owed and it grows — same jerky, more profit.</>}
              </div>
            </>
          )}

          {/* ===== MONTHS COMPARED (sub-view of P&L) ===== */}
          {tab === 'pnl' && pnlView === 'compare' && (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ ...lbl }}>Compare</span>
                {[2, 3, 6, 12].map(n => (
                  <button key={n} onClick={() => setPnlMonths(n)} style={{ padding: '7px 15px', borderRadius: '18px', border: `1px solid ${pnlMonths === n ? CHAR : BORDER}`, background: pnlMonths === n ? CHAR : CARDBG, color: pnlMonths === n ? CREAM : MUTED, ...btn, fontSize: '13px' }}>{n} mo</button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {pnlMonths === 2 ? <>
                  <KPI k={`${baseL.m} net`} v={sgn(baseL.net)} sub="earlier month" accent={baseL.net >= 0 ? GREEN : RED} />
                  <KPI k={`${lastL.m} net`} v={sgn(lastL.net)} sub="latest month" accent={lastL.net >= 0 ? GREEN : RED} />
                  <KPI k="Change" v={`${tNetDelta >= 0 ? '+' : ''}${sgn(tNetDelta)}`} sub={tNetDelta >= 0 ? 'more profit' : 'less profit'} accent={tNetDelta >= 0 ? GREEN : RED} />
                </> : <>
                  <KPI k={`${pnlMonths}-mo revenue`} v={m0(rangeRev)} sub={`${baseL.m}–${lastL.m}`} accent={KRAFT} />
                  <KPI k={`${pnlMonths}-mo net`} v={sgn(rangeNet)} sub="total profit" accent={rangeNet >= 0 ? GREEN : RED} />
                  <KPI k="Avg net / mo" v={sgn(rangeNet / lines.length)} sub="across the range" accent={rangeNet >= 0 ? GREEN : RED} />
                </>}
              </div>

              <div style={{ ...card }}>
                <div style={{ ...lbl, marginBottom: '12px' }}>Profit &amp; loss — {baseL.m} → {lastL.m}</div>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 'max-content' }}>
                    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '8px', borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ ...lbl, width: '162px', flexShrink: 0, position: 'sticky', left: 0, background: CARDBG }} />
                      {lines.map((l, i) => <span key={l.m + i} style={{ ...lbl, width: '74px', flexShrink: 0, textAlign: 'right', color: i === lines.length - 1 ? INK : '#A99A82' }}>{l.m}</span>)}
                      {pnlMonths === 2 && <span style={{ ...lbl, width: '66px', flexShrink: 0, textAlign: 'right' }}>Δ</span>}
                    </div>
                    {PNL_ROWS.map(row => {
                      const strong = row.kind === 'subtotal' || row.kind === 'total', isNet = row.kind === 'total'
                      const val = (l) => row.cost ? -l[row.key] : l[row.key]
                      const delta = val(lastL) - val(baseL)
                      return (
                        <div key={row.key} style={{ display: 'flex', alignItems: 'center', padding: isNet ? '10px 0 2px' : '6px 0', borderTop: strong ? `1px solid ${BORDER}` : `1px solid ${CREAM}` }}>
                          <span style={{ width: '162px', flexShrink: 0, position: 'sticky', left: 0, background: CARDBG, fontSize: isNet ? '14px' : '13px', color: strong ? INK : MUTED, fontWeight: strong ? 700 : 400 }}>{row.label}</span>
                          {lines.map((l, i) => { const cv = val(l); return <span key={l.m + i} style={{ width: '74px', flexShrink: 0, textAlign: 'right', fontFamily: MONO, fontSize: '12px', fontWeight: strong ? 600 : 400, color: isNet ? (cv >= 0 ? GREEN : RED) : (strong ? INK : '#5C5040') }}>{sgn(cv)}</span> })}
                          {pnlMonths === 2 && <span style={{ width: '66px', flexShrink: 0, textAlign: 'right', fontFamily: MONO, fontSize: '12px', fontWeight: 600, color: delta === 0 ? '#A99A82' : (delta >= 0 ? GREEN : RED) }}>{delta === 0 ? '—' : (delta > 0 ? '+' : '') + sgn(delta)}</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: MUTED, marginTop: '12px' }}>Costs shown negative. {pnlMonths === 2 ? 'Δ green = better for profit, red = worse.' : 'Scroll sideways for the full range.'}</p>
              </div>

              <div style={{ ...card, marginTop: '16px', background: CHAR, borderColor: CHAR, color: CREAM, fontSize: '14px', lineHeight: 1.6 }}>
                <div style={{ ...lbl, color: '#E8A07F', marginBottom: '8px' }}>Why the net moved {tNetDelta >= 0 ? '+' : ''}{sgn(tNetDelta)} ({baseL.m} → {lastL.m})</div>
                <>Revenue {tRevDelta >= 0 ? 'climbed' : 'fell'} <b>{sgn(Math.abs(tRevDelta))}</b>{tBest && tBest.delta > 0 ? <> (mostly <b>{tBest.label}</b>, {sgn(tBest.delta)})</> : null}. But <b>{tWorst.label}</b> moved <b>{sgn(tWorst.delta)}</b> against you. {tNetDelta >= 0
                  ? <>Net came out <b>{sgn(tNetDelta)} better</b> — keep pulling the levers that turned green.</>
                  : <>Net came out <b>{sgn(Math.abs(tNetDelta))} worse</b> — that red line is exactly what ate your gains, and exactly what to fix.</>}</>
              </div>
            </>
          )}

          {/* ===== CONSIGNMENT ===== */}
          {tab === 'consign' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Partners" v={consign.length} sub="stores carrying you" />
                <KPI k="Out on shelves" v={R.reduce((s, c) => s + Math.max(c.expected, 0), 0)} sub={`${m0(onShelfVal)} of product`} accent={KRAFT} />
                <KPI k="Collected" v={m0(cashCollected)} sub="checks in the door" accent={GREEN} />
                <KPI k="Missing" v={missUnits} sub={`${m0(missVal)} to chase`} accent={missUnits ? RED : GREEN} />
              </div>

              {!adding ? (
                <button onClick={() => setAdding(true)} style={{ width: '100%', background: CHAR, color: CREAM, border: 'none', borderRadius: '11px', padding: '13px', ...btn, marginBottom: '16px' }}>+ Add a consignment partner</button>
              ) : (
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>New consignment partner</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={cf.store} onChange={e => setCf({ ...cf, store: e.target.value })} placeholder="Store name *" style={{ ...inp, flex: 2, minWidth: '160px' }} />
                    <input value={cf.price} onChange={e => setCf({ ...cf, price: e.target.value })} type="number" placeholder="$ / unit" style={{ ...inp, flex: 1, minWidth: '90px' }} />
                    <input value={cf.sent} onChange={e => setCf({ ...cf, sent: e.target.value })} type="number" placeholder="Units sent" style={{ ...inp, flex: 1, minWidth: '100px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setAdding(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addPartner} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', ...btn }}>+ Add partner</button>
                  </div>
                </div>
              )}

              {R.map(c => {
                const open = expanded === c.id
                const badge = c.status === 'reconciled' ? { c: GREEN, t: 'Reconciled' } : c.status === 'short' ? { c: RED, t: `${c.variance} missing` } : c.status === 'over' ? { c: AMBER, t: `${-c.variance} over` } : { c: MUTED, t: 'Not counted' }
                return (
                  <div key={c.id} style={{ ...card, padding: 0, marginBottom: '12px', overflow: 'hidden', borderColor: open ? CHAR : (c.status === 'short' ? '#E7C3B8' : BORDER) }}>
                    <div onClick={() => setExpanded(open ? null : c.id)} style={{ padding: '15px 18px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ ...big, fontSize: '20px', color: INK }}>{c.store}</div>
                          <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>
                            {money(c.price)}/unit · sent {c.sent} · paid for {c.paidUnits} · {money(c.paid)} collected
                          </div>
                        </div>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: '#fff', background: badge.c, padding: '5px 11px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{badge.t}</span>
                      </div>
                    </div>

                    {open && (
                      <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${CREAM}` }}>
                        <div style={{ ...lbl, margin: '14px 0 6px' }}>The reconciliation</div>
                        <div style={{ background: CREAM, borderRadius: '10px', padding: '14px 16px' }}>
                          <Row l="Units sent out" v={c.sent} />
                          <Row l={`− Paid by checks (${money(c.paid)} ÷ ${money(c.price)})`} v={`−${c.paidUnits}`} />
                          <Row l="− Returned to you" v={`−${c.returned}`} />
                          <Row l="Should still be on the shelf" v={Math.max(c.expected, 0)} bold top />
                          <Row l={`Actually counted (${fmtD(c.countedDate)})`} v={c.counted == null ? '— not counted' : c.counted} />
                          <Row
                            l={c.variance > 0 ? 'Missing — unaccounted for' : c.variance < 0 ? 'Overage — recount' : 'Matches perfectly'}
                            v={c.variance > 0 ? `${c.variance}  (${money(c.varVal)})` : c.variance < 0 ? `${-c.variance}` : '0'}
                            neg={c.variance > 0} bold top />
                        </div>

                        {c.variance > 0 && (
                          <div style={{ marginTop: '14px' }}>
                            <div style={{ ...lbl, marginBottom: '6px' }}>Why are {c.variance} missing? (diagnose it)</div>
                            <select value={c.diagnosis} onChange={e => upd(c.id, { diagnosis: e.target.value }, `Diagnosed missing units: ${e.target.value || 'cleared'}`)} style={{ ...inp, width: '100%', cursor: 'pointer' }}>
                              {DIAGNOSES.map(d => <option key={d} value={d}>{d || 'Pick a reason…'}</option>)}
                            </select>
                            {c.diagnosis === 'Sold but not reported (store owes me)' && (
                              <div style={{ marginTop: '8px', fontSize: '13px', color: RED, background: '#FBEDE9', borderRadius: '8px', padding: '9px 12px' }}>
                                Then <b>{c.store}</b> owes you <b>{money(c.varVal)}</b>. Send them an invoice for the {c.variance} units.
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ ...lbl, margin: '16px 0 8px' }}>Update this account</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                            <input value={dv(c.id + '_chk')} onChange={e => setDv(c.id + '_chk', e.target.value)} type="number" placeholder="Check $" style={{ ...inp, flex: 1, minWidth: 0 }} />
                            <button onClick={() => logCheck(c.id)} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: '9px', padding: '0 14px', ...btn, fontSize: '12px' }}>Log</button>
                          </div>
                          <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                            <input value={dv(c.id + '_cnt')} onChange={e => setDv(c.id + '_cnt', e.target.value)} type="number" placeholder="Count on shelf" style={{ ...inp, flex: 1, minWidth: 0 }} />
                            <button onClick={() => logCount(c.id)} style={{ background: KRAFT, color: '#fff', border: 'none', borderRadius: '9px', padding: '0 14px', ...btn, fontSize: '12px' }}>Log</button>
                          </div>
                          <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                            <input value={dv(c.id + '_shp')} onChange={e => setDv(c.id + '_shp', e.target.value)} type="number" placeholder="Ship more" style={{ ...inp, flex: 1, minWidth: 0 }} />
                            <button onClick={() => shipMore(c.id)} style={{ background: CHAR, color: CREAM, border: 'none', borderRadius: '9px', padding: '0 14px', ...btn, fontSize: '12px' }}>Ship</button>
                          </div>
                        </div>

                        {(c.log || []).length > 0 && (
                          <div style={{ marginTop: '16px', borderTop: `1px solid ${CREAM}`, paddingTop: '12px' }}>
                            <div style={{ ...lbl, marginBottom: '8px' }}>History</div>
                            {c.log.map((e, i) => (
                              <div key={i} style={{ fontSize: '12px', color: MUTED, padding: '3px 0' }}>
                                <span style={{ color: '#BFB096', fontFamily: MONO, marginRight: '8px' }}>{e.at}</span>{e.t}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* ===== DIRECT ===== */}
          {tab === 'direct' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Direct revenue" v={m0(directRev)} sub="cash in hand" accent={GREEN} />
                <KPI k="Units sold" v={directUnits} sub="direct channel" />
                <KPI k="Avg $ / unit" v={directUnits ? money(directRev / directUnits) : '—'} sub="vs ~$6.3 consignment" accent={SPICE} />
              </div>
              <p style={{ fontSize: '13px', color: MUTED, marginBottom: '14px', lineHeight: 1.5 }}>
                Direct clears at a <b style={{ color: INK }}>higher margin</b> than consignment — no store cut, paid on the spot. <b style={{ color: INK }}>Online orders sync from Shopify, market & pop-up sales from your Square reader, cash & wholesale you log here.</b>
              </p>
              {!addingD ? (
                <button onClick={() => setAddingD(true)} style={{ width: '100%', background: CHAR, color: CREAM, border: 'none', borderRadius: '11px', padding: '13px', ...btn, marginBottom: '16px' }}>+ Log a direct sale</button>
              ) : (
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>New direct sale</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={df.who} onChange={e => setDf({ ...df, who: e.target.value })} placeholder="Customer / event *" style={{ ...inp, flex: 2, minWidth: '160px' }} />
                    <select value={df.source} onChange={e => setDf({ ...df, source: e.target.value })} style={{ ...inp, flex: 1, minWidth: '150px', cursor: 'pointer' }}>
                      {DIRECT_SOURCES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <input value={df.units} onChange={e => setDf({ ...df, units: e.target.value })} type="number" placeholder="Units" style={{ ...inp, flex: 1, minWidth: '100px' }} />
                    <input value={df.rev} onChange={e => setDf({ ...df, rev: e.target.value })} type="number" placeholder="$ total" style={{ ...inp, flex: 1, minWidth: '100px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setAddingD(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addDirect} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', ...btn }}>+ Log sale</button>
                  </div>
                </div>
              )}
              {direct.map(d => (
                <div key={d.id} style={{ ...card, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ ...big, fontSize: '18px', color: INK }}>{d.who}</div>
                    <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>
                      <span style={{ fontWeight: 600, color: KRAFT }}>{d.source}</span> · {d.units} units · {d.units ? money(d.rev / d.units) : '$0'}/unit
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ ...big, fontSize: '22px', color: GREEN }}>{m0(d.rev)}</span>
                    <button onClick={() => removeDirect(d.id)} style={{ background: 'none', border: 'none', color: '#C9BBA0', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ===== EXPENSES ===== */}
          {tab === 'expenses' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Total spend / mo" v={m0(totalExp)} sub="all business costs" />
                <KPI k="On personal card" v={m0(personalExp)} sub="mixed in — needs fixing" accent={RED} />
                <KPI k="On business acct" v={m0(businessExp)} sub="clean & separate" accent={GREEN} />
              </div>
              <div style={{ ...card, background: '#FBEDE9', borderColor: '#E7C3B8', marginBottom: '16px', fontSize: '14px', color: INK, lineHeight: 1.55 }}>
                <b>{m0(personalExp)}</b> of business expenses ran through your <b>personal credit card</b> this month. Two problems: the business owes that money back to <i>you</i>, and if it never hits the books you <b>lose the deduction and overpay the IRS</b>. Add them here — personal card or business — and <b>every one flows straight into your P&L</b>.
              </div>

              {!addingE ? (
                <>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <button onClick={() => setAddingE(true)} style={{ flex: 1, minWidth: '160px', background: CHAR, color: CREAM, border: 'none', borderRadius: '11px', padding: '13px', ...btn }}>+ Add an expense</button>
                    <button onClick={() => fileRef.current && fileRef.current.click()} style={{ flex: 1, minWidth: '160px', background: CARDBG, color: INK, border: `1px solid ${BORDER}`, borderRadius: '11px', padding: '13px', ...btn }}>Import CSV</button>
                    <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={importCSV} style={{ display: 'none' }} />
                  </div>
                  <p style={{ fontSize: '12px', color: MUTED, marginBottom: '16px' }}>CSV columns: vendor, amount, category, business/personal — drop in a bank or card export and it loads instantly.</p>
                </>
              ) : (
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>New expense</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={ef.vendor} onChange={e => setEf({ ...ef, vendor: e.target.value })} placeholder="What was it? *" style={{ ...inp, flex: 2, minWidth: '160px' }} />
                    <input value={ef.amt} onChange={e => setEf({ ...ef, amt: e.target.value })} type="number" placeholder="$ amount" style={{ ...inp, flex: 1, minWidth: '100px' }} />
                    <select value={ef.pay} onChange={e => setEf({ ...ef, pay: e.target.value })} style={{ ...inp, flex: 1, minWidth: '150px', cursor: 'pointer' }}>
                      {PAY.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setAddingE(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addExpense} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', ...btn }}>+ Add expense</button>
                  </div>
                </div>
              )}
              {expenses.map(e => (
                <div key={e.id} style={{ ...card, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderColor: e.pay === 'personal' ? '#E7C3B8' : BORDER }}>
                  <div>
                    <div style={{ ...big, fontSize: '17px', color: INK }}>{e.vendor}</div>
                    <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>{e.cat}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ ...big, fontSize: '19px', color: e.pay === 'personal' ? RED : INK }}>{m0(e.amt)}</span>
                    <Pill value={e.pay} opts={PAY} map={PAYM} onChange={(v) => setExpensePay(e.id, v)} />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ===== ADVERTISING ===== */}
          {tab === 'ads' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Ad spend / mo" v={m0(adSpend)} sub="all channels" />
                <KPI k="Return" v={m0(adRev)} sub={`${(adRev / adSpend).toFixed(1)}x overall`} accent={GREEN} />
                <KPI k="Wasted" v={m0(wastedSpend)} sub="on losing channels" accent={RED} />
              </div>
              <div style={{ ...card, background: '#FBEDE9', borderColor: '#E7C3B8', marginBottom: '16px', fontSize: '14px', color: INK, lineHeight: 1.5 }}>
                <b>Action:</b> you're spending <b>{m0(wastedSpend)}/mo</b> on channels that bring back only <b>{m0(wastedReturn)}</b>. Cut the red ones and you keep <b>{m0(wastedSpend - wastedReturn)}</b> a month — <b>{m0((wastedSpend - wastedReturn) * 12)}/yr</b> — with zero lost sales.
              </div>
              <div style={{ ...card, marginBottom: '16px', fontSize: '13px', color: MUTED, lineHeight: 1.55 }}>
                <b style={{ color: INK }}>How each sale is traced to a channel:</b> a unique promo code per channel (IG10, NJFOODIE), the Meta/Google pixel on your Shopify store, or a “how’d you hear about us?” at checkout. Channels marked <b style={{ color: AMBER }}>“est.”</b> have no code yet — their ROI is a guess. <b style={{ color: INK }}>Step one is giving every channel a code so the number becomes real.</b>
              </div>
              {!addingA ? (
                <button onClick={() => setAddingA(true)} style={{ width: '100%', background: CHAR, color: CREAM, border: 'none', borderRadius: '11px', padding: '13px', ...btn, marginBottom: '16px' }}>+ Add a channel</button>
              ) : (
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>New ad channel</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={af.channel} onChange={e => setAf({ ...af, channel: e.target.value })} placeholder="Channel (e.g. TikTok Ads) *" style={{ ...inp, flex: 2, minWidth: '170px' }} />
                    <input value={af.track} onChange={e => setAf({ ...af, track: e.target.value })} placeholder="Promo code / how tracked" style={{ ...inp, flex: 1, minWidth: '150px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <input value={af.spend} onChange={e => setAf({ ...af, spend: e.target.value })} type="number" placeholder="$ spent / mo" style={{ ...inp, flex: 1, minWidth: '120px' }} />
                    <input value={af.rev} onChange={e => setAf({ ...af, rev: e.target.value })} type="number" placeholder="$ sales it drove" style={{ ...inp, flex: 1, minWidth: '120px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setAddingA(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addAd} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', ...btn }}>+ Add channel</button>
                  </div>
                </div>
              )}

              {ads.slice().sort((a, b) => (b.spend ? b.rev / b.spend : 0) - (a.spend ? a.rev / a.spend : 0)).map(a => {
                const roas = a.spend ? a.rev / a.spend : 0, vd = verdict(roas), open = expanded === a.id
                return (
                  <div key={a.id} style={{ ...card, marginBottom: '10px', padding: 0, overflow: 'hidden', borderColor: open ? CHAR : BORDER }}>
                    <div onClick={() => setExpanded(open ? null : a.id)} style={{ padding: '16px 18px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ ...big, fontSize: '18px', color: INK }}>{a.channel}</div>
                          <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '3px' }}>{m0(a.spend)} spent → {m0(a.rev)} back · <b style={{ color: vd.c }}>{roas.toFixed(1)}x{a.tracked ? '' : ' est.'}</b></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: a.tracked ? KRAFT : AMBER, marginTop: '5px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.tracked ? KRAFT : AMBER, flexShrink: 0 }} />{a.track}</div>
                        </div>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: '#fff', background: vd.c, padding: '5px 12px', borderRadius: '20px' }}>{vd.t}</span>
                      </div>
                      <div style={{ marginTop: '12px', height: '8px', background: CREAM, borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${Math.min(roas / 4 * 100, 100)}%`, background: vd.c }} />
                      </div>
                    </div>
                    {open && (
                      <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${CREAM}` }}>
                        <div style={{ ...lbl, margin: '14px 0 8px' }}>Update this month</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '130px' }}>
                            <div style={{ fontSize: '11px', color: MUTED, marginBottom: '4px' }}>$ spent</div>
                            <input value={a.spend} onChange={e => setAdField(a.id, 'spend', e.target.value)} type="number" style={{ ...inp, width: '100%' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: '130px' }}>
                            <div style={{ fontSize: '11px', color: MUTED, marginBottom: '4px' }}>$ sales driven</div>
                            <input value={a.rev} onChange={e => setAdField(a.id, 'rev', e.target.value)} type="number" style={{ ...inp, width: '100%' }} />
                          </div>
                        </div>
                        <div style={{ ...lbl, margin: '14px 0 6px' }}>How it's tracked</div>
                        <input value={a.track} onChange={e => setAdField(a.id, 'track', e.target.value)} placeholder="Promo code / pixel — leave blank if untracked" style={{ ...inp, width: '100%' }} />
                        <div style={{ display: 'flex', marginTop: '14px' }}>
                          <button onClick={() => removeAd(a.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#C0392B', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Delete channel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* ===== QUICKBOOKS SYNC (drop in GL + COA) ===== */}
          {tab === 'quickbooks' && (
            <>
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#2CA01C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...big, fontSize: '19px' }}>qb</div>
                  <div>
                    <div style={{ ...big, fontSize: '18px', color: INK }}>QuickBooks → your books</div>
                    <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '2px' }}>Export from QuickBooks, drop the files in here.</div>
                  </div>
                </div>
                <p style={{ fontSize: '13.5px', color: MUTED, lineHeight: 1.55 }}>Two exports keep everything current — your <b style={{ color: INK }}>Chart of Accounts</b> and your <b style={{ color: INK }}>General Ledger</b>. Drop them in and the dashboard's P&L and balances update. No live connection to babysit — same way I run it for every client.</p>
              </div>

              {[
                { title: 'Chart of Accounts', desc: 'Your account list — assets, income, expenses…', st: coa, rf: coaRef, setter: setCoa },
                { title: 'General Ledger', desc: 'Every transaction, by account and date', st: gl, rf: glRef, setter: setGl },
              ].map((b, i) => (
                <div key={i} style={{ ...card, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: INK, fontSize: '16px' }}>{b.title}</div>
                    <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '2px' }}>{b.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: GREEN, marginTop: '9px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
                      Imported · <span style={{ fontFamily: MONO }}>{b.st.name}</span> · {b.st.rows} rows
                    </div>
                  </div>
                  <div>
                    <button onClick={() => b.rf.current && b.rf.current.click()} style={{ background: CARDBG, color: INK, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '11px 18px', ...btn }}>Drop in / replace</button>
                    <input ref={b.rf} type="file" accept=".csv,.txt" onChange={e => importBook(e, b.setter)} style={{ display: 'none' }} />
                  </div>
                </div>
              ))}

              <div style={{ ...card, background: '#EAF3EC', borderColor: '#CFE4D6', fontSize: '13.5px', color: INK, lineHeight: 1.55 }}>
                Both files are in, so your P&L, account balances, and this whole dashboard reflect your real books. Each month you just drop in the fresh GL — takes about a minute.
              </div>
            </>
          )}

          {/* ===== ASK AI (preview) ===== */}
          {tab === 'askai' && (
            <>
              <div style={{ ...card, marginBottom: '16px', borderColor: 'rgba(200,70,44,.28)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ ...big, fontSize: '18px', color: INK }}>Ask your numbers</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: SPICE, padding: '2px 8px', borderRadius: '10px' }}>PREVIEW</span>
                </div>
                <div style={{ fontSize: '13.5px', color: MUTED, lineHeight: 1.55 }}>A look at what's coming: ask plain-English questions about your business and get answers straight from your live data. Here are a few samples.</div>
              </div>
              {[
                { q: 'Which store owes me the most right now?', a: <>Your counts show <b>Wawa Pilot — Rt 37</b> has the biggest gap: <b>10 bags missing</b> (~$65), most likely sold-but-unreported. Across all stores you're owed about <b>{m0(missVal)}</b> — I'd invoice the worst offenders.</> },
                { q: 'Where am I wasting ad money?', a: <>Three channels are underwater — <b>Facebook, the 5K, and flyers</b>. Together they cost <b>{m0(wastedSpend)}/mo</b> and return only <b>{m0(wastedReturn)}</b>. Move that budget to Instagram and your influencer (both ~4x).</> },
                { q: 'Did I actually make money this month?', a: <>Revenue is <b>{m0(revenue)}</b>, but after costs your net is <b>{m0(netProfit)}</b>. The two drags are ad waste and uncollected consignment money — fix both and you flip positive without selling a single extra bag.</> },
              ].map((m, i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <div style={{ background: CHAR, color: CREAM, padding: '10px 14px', borderRadius: '14px 14px 4px 14px', maxWidth: '80%', fontSize: '14px' }}>{m.q}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: SPICE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...big, fontSize: '12px' }}>JK</div>
                    <div style={{ ...card, padding: '13px 15px', fontSize: '14px', lineHeight: 1.55, maxWidth: '85%' }}>{m.a}</div>
                  </div>
                </div>
              ))}
              <div style={{ ...card, display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <input disabled placeholder="Ask anything about your business…" style={{ ...inp, flex: 1, background: '#fff', cursor: 'not-allowed' }} />
                <button disabled style={{ background: MUTED, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px 18px', ...btn, cursor: 'not-allowed' }}>Send</button>
              </div>
              <p style={{ fontSize: '12px', color: MUTED, marginTop: '10px', textAlign: 'center' }}>Live Q&amp;A is on the roadmap — this is a preview of the feature.</p>
            </>
          )}

          {/* CTA */}
          <div style={{ background: SPICE, borderRadius: '16px', padding: '26px', marginTop: '26px', color: '#fff' }}>
            <div style={{ ...lbl, color: '#FCE0D8', marginBottom: '8px' }}>How I'd help — two ways</div>
            <div style={{ ...big, fontSize: '21px', fontWeight: 600, lineHeight: 1.4, marginBottom: '12px' }}>
              Be your CFO, or run the whole back office. Your call.
            </div>
            <p style={{ fontSize: '14px', color: '#FDEEE9', lineHeight: 1.6, marginBottom: '14px' }}>
              <b>As your CFO:</b> I keep this dashboard live, reconcile every consignment account, chase the money you're owed, and tell you each month exactly where to cut and where to push.<br />
              <b>Full takeover:</b> I do all of that <i>plus</i> your books, taxes-ready, so you never touch a spreadsheet again and just make jerky.
            </p>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>— Jonathan Katz · <span style={{ color: CHAR, fontWeight: 700 }}>JK No Jokes Financials</span></div>
          </div>
        </main>
      </div>
    </>
  )
}

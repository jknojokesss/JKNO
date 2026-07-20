import { useState, useRef } from 'react'
import Head from 'next/head'

const CHAR = '#121212', SPICE = '#950C2F', KRAFT = '#B8894A', CREAM = '#F7F1E7'
const INK = '#1A1512', MUTED = '#8A8175', GREEN = '#3E7C4F', BORDER = '#E7DFD1', AMBER = '#B8894A', RED = '#C03A22'
const CARDBG = '#FFFDF9'
const BIZ = 'Next Level Taste'

const money = (n) => '$' + (Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const m0 = (n) => '$' + Math.round(n).toLocaleString()
const sgn = (n) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString()
const uid = () => Math.random().toString(36).slice(2, 9)
const todayStr = new Date().toISOString().slice(0, 10)
const fmtD = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'
const daysSince = (s) => s ? Math.round((Date.now() - new Date(s + 'T00:00:00')) / 86400000) : null

// consignment reconciliation
const recon = (c) => {
  const paidUnits = c.price > 0 ? Math.round(c.paid / c.price) : 0
  const expected = c.sent - c.returned - paidUnits      // should still be on the shelf
  const variance = expected - c.counted                 // + = missing / shrinkage
  return { paidUnits, expected, variance, varVal: variance * c.price,
    status: c.counted == null ? 'uncounted' : variance === 0 ? 'reconciled' : variance > 0 ? 'short' : 'over' }
}

const SEED_CONSIGN = [
  { id: uid(), store: 'Gourmet Glatt North', price: 8.5, sent: 60, returned: 0, paid: 425, counted: 6, countedDate: '2026-06-15', diagnosis: '', cycle: 1, lastContact: '2026-06-15', restock: 'now', notes: 'Manager Yossi reorders every ~2 weeks. Reorders the Classic board weekly.', log: [{ at: 'Jun 15', t: 'Counted 6 on shelf' }, { at: 'Jun 6', t: 'Check received $425' }] },
  { id: uid(), store: 'Gourmet Glatt South', price: 8.5, sent: 48, returned: 4, paid: 340, counted: 2, countedDate: '2026-06-15', diagnosis: '', cycle: 1, lastContact: '2026-06-12', restock: 'now', notes: 'Down to 2 boards — promised a delivery this week.', log: [{ at: 'Jun 15', t: 'Counted 2 on shelf' }, { at: 'Jun 5', t: 'Check received $340' }] },
  { id: uid(), store: 'Seasons', price: 9, sent: 54, returned: 0, paid: 360, counted: 14, countedDate: '2026-06-14', diagnosis: '', cycle: 1, lastContact: '2026-06-14', restock: 'good', notes: 'Steady account. Loves the charcuterie boards.', log: [{ at: 'Jun 14', t: 'Counted 14 — reconciles clean' }, { at: 'Jun 4', t: 'Check received $360' }] },
  { id: uid(), store: 'Nutmeg', price: 8, sent: 40, returned: 0, paid: 200, counted: 8, countedDate: '2026-06-16', diagnosis: '', cycle: 1, lastContact: '2026-05-26', restock: 'soon', notes: "Haven't spoken in ~3 weeks — check in, and ask about the missing units.", log: [{ at: 'Jun 16', t: 'Counted 8 on shelf' }, { at: 'Jun 2', t: 'Check received $200' }] },
  { id: uid(), store: 'Aisle 9 Jackson', price: 8.5, sent: 36, returned: 0, paid: 255, counted: 4, countedDate: '2026-06-13', diagnosis: '', cycle: 1, lastContact: '2026-06-13', restock: 'soon', notes: 'New buyer contact — trial going well so far.', log: [{ at: 'Jun 13', t: 'Counted 4 on shelf' }, { at: 'Jun 3', t: 'Check received $255' }] },
  { id: uid(), store: 'Aisle 9 Lakewood', price: 8.5, sent: 44, returned: 0, paid: 340, counted: 4, countedDate: '2026-06-13', diagnosis: '', cycle: 1, lastContact: '2026-06-13', restock: 'good', notes: 'Clean account, always pays on time.', log: [{ at: 'Jun 13', t: 'Counted 4 — reconciles clean' }, { at: 'Jun 3', t: 'Check received $340' }] },
  { id: uid(), store: 'Foodex', price: 8, sent: 30, returned: 0, paid: 160, counted: 9, countedDate: '2026-06-12', diagnosis: '', cycle: 1, lastContact: '2026-06-05', restock: 'soon', notes: 'Slower mover — suggest a standing weekly board order.', log: [{ at: 'Jun 12', t: 'Counted 9 on shelf' }, { at: 'Jun 1', t: 'Check received $160' }] },
  { id: uid(), store: 'Superstop', price: 8, sent: 36, returned: 0, paid: 0, counted: 36, countedDate: '2026-06-10', diagnosis: '', cycle: 1, lastContact: '2026-06-10', restock: 'good', notes: 'First delivery just landed — follow up in 2 weeks.', log: [{ at: 'Jun 10', t: 'Shipped 36 units — first delivery' }] },
  { id: uid(), store: 'Evergreen', price: 9, sent: 40, returned: 0, paid: 270, counted: 8, countedDate: '2026-06-16', diagnosis: '', cycle: 1, lastContact: '2026-06-16', restock: 'now', notes: 'Reorders fast — strong location, push more here.', log: [{ at: 'Jun 16', t: 'Counted 8 on shelf' }, { at: 'Jun 5', t: 'Check received $270' }] },
]

const SEED_DIRECT = [
  { id: uid(), who: 'Online store (Shopify)', source: 'Shopify / online', units: 120, rev: 1560 },
  { id: uid(), who: 'Catering — Simcha halls', source: 'Catering / events', units: 45, rev: 585 },
  { id: uid(), who: 'Corporate gift orders', source: 'Wholesale / bulk', units: 60, rev: 540 },
  { id: uid(), who: 'Yom Tov pre-orders', source: 'Holiday / seasonal', units: 30, rev: 390 },
]
// Revenue streams beyond standard online orders — catering/event boards and
// seasonal holiday (Yom Tov / Simchas Torah) boxes. Illustrative monthly figures.
const BOARDS_MONTH = { units: 22, rev: 3685, cost: 1660 } // catering & events (~45% cost)
const CAMP_MONTH = { units: 40, rev: 1680, cost: 1010 }   // holiday / Yom Tov boxes (~60% cost)
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
const EXP_CATS = ['Ingredients', 'Packaging', 'Marketing', 'Fees', 'Equipment', 'Travel', 'Other']
const DIAGNOSES = ['', 'Sold but not reported (store owes me)', 'Theft / shrinkage', 'Damaged or expired', 'Free samples given out', 'Miscount — recount needed', 'Unknown — investigating']
const RESTOCK = [{ id: 'good', label: 'Stocked', color: GREEN }, { id: 'soon', label: 'Order soon', color: AMBER }, { id: 'now', label: 'Needs more now', color: RED }]
const RM = Object.fromEntries(RESTOCK.map(r => [r.id, r]))
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
  { m: 'Jul', directRev: 1200, consignRev: 900, cogs: 1450, adSpend: 700, opexNonAd: 480, boardRev: 2800, boardCogs: 1400 },
  { m: 'Aug', directRev: 1320, consignRev: 980, cogs: 1520, adSpend: 780, opexNonAd: 500, boardRev: 3000, boardCogs: 1500 },
  { m: 'Sep', directRev: 1450, consignRev: 1050, cogs: 1600, adSpend: 850, opexNonAd: 510, boardRev: 3200, boardCogs: 1600 },
  { m: 'Oct', directRev: 1600, consignRev: 1150, cogs: 1720, adSpend: 950, opexNonAd: 520, boardRev: 3500, boardCogs: 1750 },
  { m: 'Nov', directRev: 1800, consignRev: 1300, cogs: 1900, adSpend: 1200, opexNonAd: 560, boardRev: 4200, boardCogs: 2100 },
  { m: 'Dec', directRev: 2200, consignRev: 1600, cogs: 2150, adSpend: 1500, opexNonAd: 620, boardRev: 5500, boardCogs: 2750 },
  { m: 'Jan', directRev: 1500, consignRev: 1100, cogs: 1700, adSpend: 900, opexNonAd: 520, boardRev: 3400, boardCogs: 1700 },
  { m: 'Feb', directRev: 1650, consignRev: 1200, cogs: 1780, adSpend: 1050, opexNonAd: 540, boardRev: 3600, boardCogs: 1800 },
  { m: 'Mar', directRev: 1820, consignRev: 1380, cogs: 2050, adSpend: 1350, opexNonAd: 600, boardRev: 4000, boardCogs: 2000 },
  { m: 'Apr', directRev: 1900, consignRev: 1450, cogs: 2180, adSpend: 1500, opexNonAd: 620, boardRev: 4400, boardCogs: 2200 },
  { m: 'May', directRev: 1980, consignRev: 1510, cogs: 2280, adSpend: 1650, opexNonAd: 640, boardRev: 4800, boardCogs: 2400 },
]
const mLine = (mo) => {
  const boardRev = mo.boardRev || 0, boardCogs = mo.boardCogs || 0
  const rev = mo.directRev + mo.consignRev + boardRev, cogs = mo.cogs + boardCogs
  const gross = rev - cogs, opex = mo.adSpend + mo.opexNonAd
  return { m: mo.m, directRev: mo.directRev, consignRev: mo.consignRev, boardRev, rev, cogs, gross, ad: mo.adSpend, otherOpex: mo.opexNonAd, opex, net: gross - opex }
}
const PNL_ROWS = [
  { label: 'Direct sales', key: 'directRev', kind: 'line', cost: false },
  { label: 'Wholesale collected', key: 'consignRev', kind: 'line', cost: false },
  { label: 'Catering Boards & camp packages holiday', key: 'boardRev', kind: 'line', cost: false },
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
  { name: 'Classic Meat Board', color: '#7A1F30', week: 13, month: 52 },
  { name: 'Jerky Sticks', color: '#8A4A2A', week: 12, month: 46 },
  { name: 'Charcuterie Board', color: '#95402F', week: 10, month: 40 },
  { name: 'Kishka', color: '#8A6A3A', week: 9, month: 34 },
  { name: 'Fish Platter', color: '#6B7A8A', week: 8, month: 30 },
  { name: '3-Tier Board', color: '#5C1220', week: 6, month: 24 },
  { name: 'Yapchik', color: '#6B4A2A', week: 5, month: 20 },
  { name: 'Kishka & Gravy', color: '#5A4030', week: 4, month: 16 },
]
// per-period sales for the front-page leaderboards (week vs month)
const STORE_PERF = [
  { store: 'Gourmet Glatt North', week: 13, weekRev: 110, month: 50, monthRev: 425 },
  { store: 'Gourmet Glatt South', week: 10, weekRev: 85, month: 40, monthRev: 340 },
  { store: 'Seasons', week: 11, weekRev: 99, month: 40, monthRev: 360 },
  { store: 'Aisle 9 Lakewood', week: 10, weekRev: 85, month: 40, monthRev: 340 },
  { store: 'Evergreen', week: 9, weekRev: 81, month: 30, monthRev: 270 },
  { store: 'Aisle 9 Jackson', week: 8, weekRev: 68, month: 30, monthRev: 255 },
  { store: 'Nutmeg', week: 7, weekRev: 56, month: 25, monthRev: 200 },
  { store: 'Foodex', week: 6, weekRev: 48, month: 20, monthRev: 160 },
  { store: 'Superstop', week: 7, weekRev: 56, month: 18, monthRev: 144 },
]
const DIRECT_PERF = [
  { who: 'Online store (Shopify)', source: 'Shopify / online', week: 31, weekRev: 403, month: 120, monthRev: 1560 },
  { who: 'Yom Tov pre-orders', source: 'Holiday / seasonal', week: 30, weekRev: 390, month: 30, monthRev: 390 },
  { who: 'Catering — Simcha halls', source: 'Catering / events', week: 20, weekRev: 260, month: 45, monthRev: 585 },
  { who: 'Acme Corp — office bulk', source: 'Wholesale / bulk', week: 0, weekRev: 0, month: 60, monthRev: 540 },
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

export default function NextLevelTaste() {
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
  const [ef, setEf] = useState({ vendor: '', amt: '', cat: 'Other', pay: 'personal' })
  const [addingD, setAddingD] = useState(false)
  const [df, setDf] = useState({ who: '', source: 'Shopify / online', units: '', rev: '' })
  const [pnlMonths, setPnlMonths] = useState(2)
  const [pnlView, setPnlView] = useState('single')
  const [period, setPeriod] = useState('month')
  const [costPerBag, setCostPerBag] = useState(4.5)
  const [boardCost, setBoardCost] = useState(75) // avg cost to make one board (estimate — owner sets real #)
  const [campCost, setCampCost] = useState(25)   // avg cost per camp package
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
  const addPartner = () => { if (!cf.store.trim()) return; setConsign([{ id: uid(), store: cf.store.trim(), price: Number(cf.price) || 0, sent: Number(cf.sent) || 0, returned: 0, paid: 0, counted: null, countedDate: '', diagnosis: '', cycle: 1, log: [{ at: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }), t: 'Added consignment partner' }] }, ...consign]); setCf({ store: '', price: '', sent: '' }); setAdding(false) }
  const closeOut = (id) => {
    const c = consign.find(x => x.id === id); if (!c) return
    const { variance, varVal } = recon(c)
    const shelf = c.counted == null ? 0 : c.counted
    let note
    if (variance > 0) note = c.diagnosis === 'Sold but not reported (store owes me)'
      ? `Closed cycle — invoiced ${money(varVal)} for ${variance} sold-not-reported bags. New cycle opens at ${shelf} on the shelf.`
      : `Closed cycle — wrote off ${variance} bags (${money(varVal)})${c.diagnosis ? ` as ${c.diagnosis.toLowerCase()}` : ''}. New cycle opens at ${shelf} on the shelf.`
    else note = `Closed cycle — reconciled clean. New cycle opens at ${shelf} on the shelf.`
    upd(id, { sent: shelf, paid: 0, returned: 0, counted: shelf, diagnosis: '', cycle: (c.cycle || 1) + 1 }, note)
    setExpanded(null)
  }
  const addExpense = () => { if (!ef.vendor.trim()) return; setExpenses([{ id: uid(), vendor: ef.vendor.trim(), cat: ef.cat || 'Other', amt: Number(ef.amt) || 0, pay: 'personal' }, ...expenses]); setEf({ vendor: '', amt: '', cat: 'Other', pay: 'personal' }); setAddingE(false) }
  const removeExpense = (id) => setExpenses(expenses.filter(e => e.id !== id))
  const exportPersonal = () => {
    const rows = [['Vendor', 'Category', 'Amount', 'Paid with']]
    expenses.filter(e => e.pay === 'personal').forEach(e => rows.push([e.vendor, e.cat, e.amt, 'Personal card']))
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'personal-card-expenses.csv'
    a.click()
  }
  const exportClose = () => {
    const rows = [['Account', 'Amount'],
      ['Wholesale income', cashCollected],
      ['Direct income (non-Shopify)', offlineDirectRev],
      ['Cost of goods sold', -closeCogs],
      ['AR — invoice stores (sold-not-reported)', closeAR],
      ['(Shopify online — booked via Shopify, do NOT re-enter)', shopifyRev]]
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'monthly-close-to-quickbooks.csv'
    a.click()
  }
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
        out.push({ id: uid(), vendor, cat: cols[2] || 'Other', amt, pay: 'personal' })
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
  const personalItems = expenses.filter(e => e.pay === 'personal').length
  const businessExp = totalExp - personalExp

  // P&L
  const pct = (n) => revenue ? Math.round(n / revenue * 100) : 0
  const soldBags = directUnits + R.reduce((s, c) => s + c.paidUnits, 0)
  const cogs = soldBags * costPerBag
  const directProfit = directRev - directUnits * costPerBag
  const opexNonAd = expenses.filter(e => !COGS_CATS.includes(e.cat)).reduce((s, e) => s + e.amt, 0)
  const grossProfit = revenue - cogs
  const totalOpex = opexNonAd + adSpend
  const netProfit = grossProfit - totalOpex
  const bagsPeriod = PRODUCTS.reduce((s, p) => s + p[period], 0)
  const bagsOut = R.reduce((s, c) => s + Math.max(c.expected, 0), 0)
  // Revenue by product line: bags (live) + premium boards + camp packages
  const productMix = [
    { line: 'Online orders', units: bagsPeriod, unit: 'orders', rev: revenue, color: SPICE, to: 'direct' },
    { line: 'Catering & events', units: BOARDS_MONTH.units, unit: 'events', rev: BOARDS_MONTH.rev, color: '#6B7A8A', to: 'direct' },
    { line: 'Holiday / Yom Tov boxes', units: CAMP_MONTH.units, unit: 'boxes', rev: CAMP_MONTH.rev, color: KRAFT, to: 'direct' },
  ]
  const totalRevenue = productMix.reduce((s, p) => s + p.rev, 0)
  // P&L totals that include boards + camp (bag vars above stay bag-only for the
  // consignment/close tabs; board cost is an estimate — tune BOARDS_MONTH/CAMP_MONTH)
  const boardRevM = BOARDS_MONTH.rev + CAMP_MONTH.rev
  const boardCogsM = BOARDS_MONTH.units * boardCost + CAMP_MONTH.units * campCost
  const pnlCogs = cogs + boardCogsM
  const pnlGross = totalRevenue - pnlCogs
  const pnlNet = pnlGross - totalOpex
  const pnlPct = (n) => totalRevenue ? Math.round(n / totalRevenue * 100) : 0

  // monthly close → QB (Shopify online excluded — it books through Shopify, no double-count)
  const shopifyRev = direct.filter(d => d.source === 'Shopify / online').reduce((s, d) => s + d.rev, 0)
  const offlineDirectRev = direct.filter(d => d.source !== 'Shopify / online').reduce((s, d) => s + d.rev, 0)
  const offlineDirectUnits = direct.filter(d => d.source !== 'Shopify / online').reduce((s, d) => s + d.units, 0)
  const consignUnits = R.reduce((s, c) => s + c.paidUnits, 0)
  const closeIncome = cashCollected + offlineDirectRev
  const closeUnits = consignUnits + offlineDirectUnits
  const closeCogs = closeUnits * costPerBag
  const closeAR = R.filter(c => c.variance > 0 && c.diagnosis === 'Sold but not reported (store owes me)').reduce((s, c) => s + c.varVal, 0)

  // multi-month series — current month appended live so interactivity flows through
  const thisMonth = new Date().toLocaleString('en-US', { month: 'short' })
  const monthsAll = [...MONTH_SERIES, { m: thisMonth, directRev, consignRev: cashCollected, cogs, adSpend, opexNonAd, boardRev: boardRevM, boardCogs: boardCogsM }]
  const lines = monthsAll.slice(-pnlMonths).map(mLine)
  const lastL = lines[lines.length - 1]
  const baseL = lines[0]
  const tMovers = [
    { label: 'direct sales', key: 'directRev', cost: false },
    { label: 'wholesale', key: 'consignRev', cost: false },
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

  const card = { background: CARDBG, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '20px' }
  const lbl = { fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#96866C' }
  const inp = { padding: '10px 12px', fontSize: '14px', border: `1px solid ${BORDER}`, borderRadius: '2px', background: CREAM, color: INK, outline: 'none', fontFamily: 'inherit' }
  const big = { fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.4px' }
  const btn = { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.1px', cursor: 'pointer' }

  const KPI = ({ k, v, sub, accent, onClick }) => (
    <div onClick={onClick} className={onClick ? 'jm-click' : undefined} style={{ ...card, flex: 1, minWidth: '150px', padding: '15px 17px', position: 'relative', ...(onClick ? { cursor: 'pointer' } : {}) }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...big, fontSize: '29px', color: accent || INK, lineHeight: 1.15, marginTop: '4px' }}>{v}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 400, color: '#A2937A', marginTop: '3px' }}>{sub}</div>
      {onClick && <span style={{ position: 'absolute', top: '11px', right: '13px', color: '#C6B79A', fontSize: '15px', lineHeight: 1 }}>›</span>}
    </div>
  )
  const MiniToggle = ({ value, onChange }) => (
    <div style={{ display: 'inline-flex', border: `1px solid ${BORDER}`, borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
      {[['week', 'Week'], ['month', 'Month']].map(([p, l]) => (
        <button key={p} onClick={() => onChange(p)} style={{ padding: '4px 11px', border: 'none', background: value === p ? CHAR : 'transparent', color: value === p ? CREAM : MUTED, fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>{l}</button>
      ))}
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
      style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', padding: '6px 26px 6px 12px', borderRadius: '2px', border: 'none',
        fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.1px', color: '#fff',
        background: `${map[value].color} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 3.5L5 6.5L8 3.5' stroke='white' stroke-width='1.4' fill='none'/></svg>") no-repeat right 9px center` }}>
      {opts.map(o => <option key={o.id} value={o.id} style={{ color: INK, background: '#fff' }}>{o.label}</option>)}
    </select>
  )

  const TABS = [['overview', 'Overview'], ['consign', 'Wholesale'], ['direct', 'Direct Sales'], ['ads', 'Advertising'], ['pnl', 'P&L']]
  const EXTRA = [['expenses', 'Import expenses'], ['quickbooks', 'QuickBooks sync'], ['close', 'Monthly close'], ['askai', 'Ask AI']]
  const currentLabel = ([...TABS, ...EXTRA].find(t => t[0] === tab) || ['', ''])[1]

  return (
    <>
      <Head>
        <title>{`${BIZ} — Dashboard`}</title>
        <meta name="description" content="Every order, every account, your real profit — one screen." />
        <meta property="og:title" content="Next Level Taste — Dashboard" />
        <meta property="og:description" content="Every order, every account, your real profit — one screen." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.jknojokes.com/next-level-taste" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Next Level Taste — Dashboard" />
        <meta name="twitter:description" content="Every order, every account, your real profit — one screen." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/next-level-taste.webmanifest" />
        <meta name="theme-color" content="#2B2018" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Next Level Taste" />
        <link rel="apple-touch-icon" href="/jerky-icon.svg" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}body{background:${CREAM};font-family:'Inter',sans-serif;color:${INK}}::placeholder{color:#A99A82}
.jm-shell{display:flex;min-height:100vh;align-items:stretch}
.jm-side{width:236px;flex-shrink:0;background:${CHAR};color:${CREAM};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.jm-nav{display:flex;flex-direction:column;gap:3px;flex:1}
.jm-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:2px;border:none;background:transparent;color:#B6A78C;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s}
.jm-navbtn:hover{background:rgba(255,255,255,.08);color:${CREAM}}
.jm-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px}
.jm-click{transition:box-shadow .12s}.jm-click:hover{box-shadow:inset 0 0 0 1.5px ${SPICE}}
@media(max-width:860px){.jm-shell{flex-direction:column}.jm-side{width:auto;height:auto;position:static;flex-direction:column;padding:14px 12px}.jm-nav{flex-direction:row;overflow-x:auto;gap:6px;padding-bottom:4px}.jm-navbtn{width:auto;padding:8px 15px;border-radius:2px;background:rgba(255,255,255,.07)}.jm-main{padding:18px 16px 52px;max-width:100%}}`}</style>
      </Head>

      <div className="jm-shell">
        {/* Sidebar */}
        <aside className="jm-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <div style={{ ...big, fontSize: '25px', letterSpacing: '-0.5px', lineHeight: 1 }}>
              <span style={{ color: CREAM }}>Next Level</span> <span style={{ color: '#C9A24B' }}>Taste</span>
            </div>
            <div style={{ ...lbl, color: '#9C8F86', marginTop: '6px', fontSize: '9px', letterSpacing: '0.04em' }}>Kosher charcuterie · boards · nationwide</div>
            <div style={{ ...lbl, color: '#B6A78C', marginTop: '4px' }}>Dashboard</div>
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
                      ? <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', background: SPICE, padding: '2px 6px', borderRadius: '2px', flexShrink: 0 }}>AI</span>
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
              <div style={{ ...lbl, color: SPICE }}>Next Level Taste</div>
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
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[['week', 'This week'], ['month', 'This month']].map(([v, l]) => (
                  <button key={v} onClick={() => setPeriod(v)} style={{ padding: '8px 16px', borderRadius: '2px', border: `1px solid ${period === v ? CHAR : BORDER}`, background: period === v ? CHAR : CARDBG, color: period === v ? CREAM : MUTED, ...btn }}>{l}</button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Revenue / mo" v={m0(totalRevenue)} sub="orders, catering & holiday" accent={SPICE} onClick={() => setTab('pnl')} />
                <KPI k={`Orders this ${period}`} v={bagsPeriod} sub="across all products" accent={INK} onClick={() => setTab('direct')} />
                <KPI k="At wholesale accounts" v={m0(onShelfVal)} sub={`${bagsOut} units with wholesale accts`} accent={KRAFT} onClick={() => setTab('consign')} />
                <KPI k="Missing pieces" v={`${missUnits}`} sub={`${m0(missVal)} to investigate`} accent={missUnits ? RED : GREEN} onClick={() => setTab('consign')} />
              </div>

              {/* Revenue by product line — bags + boards + camp packages */}
              <div className="jm-click" onClick={() => setTab('pnl')} style={{ ...card, marginBottom: '16px', cursor: 'pointer', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ ...lbl }}>Revenue by product line · this month</div>
                  <div style={{ fontSize: '13px', color: MUTED }}><b style={{ ...big, fontSize: '18px', color: INK }}>{m0(totalRevenue)}</b> total</div>
                </div>
                <div style={{ display: 'flex', height: '18px', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                  {productMix.map(p => (
                    <div key={p.line} title={`${p.line} · ${m0(p.rev)}`} style={{ width: `${Math.round(p.rev / totalRevenue * 100)}%`, background: p.color }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
                  {productMix.map(p => (
                    <div key={p.line} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '11px', height: '11px', background: p.color, borderRadius: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px' }}>
                        <b style={{ color: INK }}>{p.line}</b> <span style={{ color: INK, fontWeight: 600 }}>{m0(p.rev)}</span>
                        <span style={{ color: MUTED }}> · {p.units} {p.unit} · {Math.round(p.rev / totalRevenue * 100)}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ ...card, flex: 1, minWidth: '290px' }}>
                  <div style={{ ...lbl, marginBottom: '14px' }}>Top wholesale accounts · this {period}</div>
                  {(() => { const pv = s => period === 'week' ? s.weekRev : s.monthRev; const pb = s => period === 'week' ? s.week : s.month; const sorted = STORE_PERF.slice().sort((a, b) => pv(b) - pv(a)); const max = pv(sorted[0]) || 1; return sorted.slice(0, 6).map((c, i) => (
                    <div key={c.store} className="jm-click" onClick={() => setTab('consign')} style={{ padding: '9px 8px', borderTop: i ? `1px solid ${CREAM}` : 'none', cursor: 'pointer', borderRadius: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: INK, fontSize: '14px' }}>{c.store}</span>
                        <span style={{ ...big, fontSize: '15px', color: INK }}>{m0(pv(c))}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: CREAM, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(pv(c) / max * 100)}%`, height: '100%', background: KRAFT }} />
                        </div>
                        <span style={{ fontSize: '11px', color: MUTED, whiteSpace: 'nowrap' }}>{pb(c)} units</span>
                      </div>
                    </div>
                  )) })()}
                </div>
                <div style={{ ...card, flex: 1, minWidth: '290px' }}>
                  <div style={{ ...lbl, marginBottom: '14px' }}>Top direct sales · this {period}</div>
                  {(() => { const pv = s => period === 'week' ? s.weekRev : s.monthRev; const pb = s => period === 'week' ? s.week : s.month; const sorted = DIRECT_PERF.slice().sort((a, b) => pv(b) - pv(a)); const max = pv(sorted[0]) || 1; return sorted.map((d, i) => (
                    <div key={d.who} className="jm-click" onClick={() => setTab('direct')} style={{ padding: '9px 8px', borderTop: i ? `1px solid ${CREAM}` : 'none', cursor: 'pointer', borderRadius: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: INK, fontSize: '14px' }}>{d.who}</span>
                        <span style={{ ...big, fontSize: '15px', color: GREEN }}>{m0(pv(d))}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: CREAM, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(pv(d) / max * 100)}%`, height: '100%', background: GREEN }} />
                        </div>
                        <span style={{ fontSize: '11px', color: MUTED, whiteSpace: 'nowrap' }}>{pb(d)} units · {d.source}</span>
                      </div>
                    </div>
                  )) })()}
                </div>
              </div>

              <div style={{ ...card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ ...lbl }}>Sold this {period}, by flavor</div>
                  <div style={{ fontSize: '13px', color: MUTED }}><b style={{ ...big, fontSize: '18px', color: INK }}>{bagsPeriod}</b> orders total</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '12px' }}>
                  {PRODUCTS.slice().sort((a, b) => b[period] - a[period]).map(p => (
                    <div key={p.name} style={{ border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '16px 12px 14px', textAlign: 'center', background: CREAM }}>
                      <Bag color={p.color} />
                      <div style={{ fontWeight: 600, color: INK, marginTop: '8px', fontSize: '14px' }}>{p.name}</div>
                      <div style={{ ...big, fontSize: '26px', color: INK, marginTop: '4px' }}>{p[period]}</div>
                      <div style={{ fontSize: '11px', color: MUTED }}>this {period}</div>
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
                <button key={v} onClick={() => setPnlView(v)} style={{ padding: '8px 16px', borderRadius: '2px', border: `1px solid ${pnlView === v ? CHAR : BORDER}`, background: pnlView === v ? CHAR : CARDBG, color: pnlView === v ? CREAM : MUTED, ...btn }}>{l}</button>
              ))}
            </div>
          )}

          {tab === 'pnl' && pnlView === 'single' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Revenue" v={m0(totalRevenue)} sub="orders + catering & holiday" accent={GREEN} />
                <KPI k="Gross profit" v={m0(pnlGross)} sub={`${pnlPct(pnlGross)}% margin`} accent={KRAFT} />
                <KPI k={pnlNet >= 0 ? 'Net profit' : 'Net loss'} v={m0(pnlNet)} sub={pnlNet >= 0 ? 'in the black' : 'in the red'} accent={pnlNet >= 0 ? GREEN : RED} />
              </div>

              <div style={{ ...card }}>
                <div style={{ ...lbl, marginBottom: '14px' }}>Profit &amp; loss — this month (cash basis)</div>
                <div style={{ ...lbl, color: KRAFT, margin: '4px 0' }}>Revenue</div>
                <Row l="Direct sales" v={m0(directRev)} />
                <Row l="Wholesale (collected)" v={m0(cashCollected)} />
                <Row l="Catering Boards & camp packages holiday" v={m0(boardRevM)} />
                <Row l="Total revenue" v={m0(totalRevenue)} bold top />
                <div style={{ ...lbl, color: KRAFT, margin: '16px 0 6px' }}>Cost of goods sold</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0 8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: MUTED }}>Cost per online order:</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: MUTED }}>$<input value={costPerBag} onChange={e => setCostPerBag(Number(e.target.value) || 0)} type="number" step="0.25" style={{ ...inp, width: '74px', padding: '6px 9px' }} /></span>
                  <span style={{ fontSize: '12px', color: '#A2937A' }}>← estimate, set the real number</span>
                </div>
                <Row l={`Order cost of goods (${soldBags} orders × ${money(costPerBag)})`} v={`−${m0(cogs)}`} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: MUTED }}>Cost per catering order:</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: MUTED }}>$<input value={boardCost} onChange={e => setBoardCost(Number(e.target.value) || 0)} type="number" step="1" style={{ ...inp, width: '70px', padding: '6px 9px' }} /></span>
                  <span style={{ fontSize: '13px', color: MUTED, marginLeft: '4px' }}>holiday box:</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: MUTED }}>$<input value={campCost} onChange={e => setCampCost(Number(e.target.value) || 0)} type="number" step="1" style={{ ...inp, width: '70px', padding: '6px 9px' }} /></span>
                  <span style={{ fontSize: '12px', color: '#A2937A' }}>← set the real numbers</span>
                </div>
                <Row l={`Catering Boards & camp cost holiday cost (${BOARDS_MONTH.units} × ${money(boardCost)} + ${CAMP_MONTH.units} × ${money(campCost)})`} v={`−${m0(boardCogsM)}`} />
                <Row l={`Gross profit  ·  ${pnlPct(pnlGross)}% margin`} v={m0(pnlGross)} bold top />
                <div style={{ ...lbl, color: KRAFT, margin: '16px 0 4px' }}>Operating expenses</div>
                <Row l="Advertising" v={`−${m0(adSpend)}`} />
                {[...new Set(expenses.filter(e => !COGS_CATS.includes(e.cat)).map(e => e.cat))].map(cat => { const v = expenses.filter(e => e.cat === cat).reduce((s, e) => s + e.amt, 0); return <Row key={cat} l={cat} v={`−${m0(v)}`} /> })}
                <Row l="Total operating expenses" v={`−${m0(totalOpex)}`} bold top />
                <div style={{ marginTop: '12px', padding: '12px 14px', background: pnlNet >= 0 ? '#EAF3EC' : '#FBEDE9', borderRadius: '2px' }}>
                  <Row l={`${pnlNet >= 0 ? 'Net profit' : 'Net loss'}  ·  ${pnlPct(pnlNet)}% margin`} v={m0(pnlNet)} bold neg={pnlNet < 0} />
                </div>
              </div>
            </>
          )}

          {/* ===== MONTHS COMPARED (sub-view of P&L) ===== */}
          {tab === 'pnl' && pnlView === 'compare' && (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ ...lbl }}>Compare</span>
                {[2, 3, 6, 12].map(n => (
                  <button key={n} onClick={() => setPnlMonths(n)} style={{ padding: '7px 15px', borderRadius: '2px', border: `1px solid ${pnlMonths === n ? CHAR : BORDER}`, background: pnlMonths === n ? CHAR : CARDBG, color: pnlMonths === n ? CREAM : MUTED, ...btn, fontSize: '13px' }}>{n} mo</button>
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

              {R.some(c => c.variance > 0) && (
                <div style={{ ...card, marginBottom: '16px', background: '#FBEDE9', borderColor: '#E7C3B8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ ...lbl, color: RED }}>Money to collect</div>
                    <div style={{ fontSize: '13px', color: MUTED }}><b style={{ ...big, fontSize: '18px', color: RED }}>{m0(missVal)}</b> across {R.filter(c => c.variance > 0).length} stores</div>
                  </div>
                  {R.filter(c => c.variance > 0).sort((a, b) => b.varVal - a.varVal).map((c, i) => (
                    <div key={c.id} onClick={() => setExpanded(c.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i ? '1px solid #F2D2CB' : 'none', cursor: 'pointer', gap: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: INK, fontSize: '14px' }}>{c.store}</span>
                        <span style={{ fontSize: '12px', color: MUTED }}> · {c.variance} bags · {c.diagnosis ? c.diagnosis : 'needs a diagnosis'}</span>
                      </div>
                      <span style={{ ...big, fontSize: '15px', color: RED }}>{money(c.varVal)}</span>
                    </div>
                  ))}
                  <p style={{ fontSize: '12px', color: MUTED, marginTop: '10px', lineHeight: 1.5 }}>Bags gone from shelves you haven't been paid for. Tap a store to diagnose it — then invoice the ones the store sold and didn't report, or write off the rest at close-out.</p>
                </div>
              )}

              {!adding ? (
                <button onClick={() => setAdding(true)} style={{ width: '100%', background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '13px', ...btn, marginBottom: '16px' }}>+ Add a consignment partner</button>
              ) : (
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>New consignment partner</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={cf.store} onChange={e => setCf({ ...cf, store: e.target.value })} placeholder="Store name *" style={{ ...inp, flex: 2, minWidth: '160px' }} />
                    <input value={cf.price} onChange={e => setCf({ ...cf, price: e.target.value })} type="number" placeholder="$ / unit" style={{ ...inp, flex: 1, minWidth: '90px' }} />
                    <input value={cf.sent} onChange={e => setCf({ ...cf, sent: e.target.value })} type="number" placeholder="Units sent" style={{ ...inp, flex: 1, minWidth: '100px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setAdding(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addPartner} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '2px', padding: '11px', ...btn }}>+ Add partner</button>
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
                            {money(c.price)}/unit · sent {c.sent} · paid for {c.paidUnits} · {money(c.paid)} collected · cycle {c.cycle || 1}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: '#fff', background: badge.c, padding: '5px 11px', borderRadius: '2px', whiteSpace: 'nowrap' }}>{badge.t}</span>
                          {c.restock && c.restock !== 'good' && <span style={{ fontSize: '11px', fontWeight: 600, color: RM[c.restock].color, background: RM[c.restock].color + '1A', padding: '3px 10px', borderRadius: '2px', whiteSpace: 'nowrap' }}>{RM[c.restock].label}</span>}
                        </div>
                      </div>
                      {c.variance > 0 && c.diagnosis && (
                        <div style={{ marginTop: '10px', fontSize: '12.5px', color: c.diagnosis.includes('owes') ? RED : INK, background: c.diagnosis.includes('owes') ? '#FBEDE9' : CREAM, border: `1px solid ${c.diagnosis.includes('owes') ? '#E7C3B8' : BORDER}`, borderRadius: '2px', padding: '8px 11px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.diagnosis.includes('owes') ? RED : KRAFT, flexShrink: 0 }} />
                          <span>Diagnosed: <b>{c.diagnosis}</b></span>
                        </div>
                      )}
                    </div>

                    {open && (
                      <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${CREAM}` }}>
                        <div style={{ ...lbl, margin: '14px 0 6px' }}>The reconciliation</div>
                        <div style={{ background: CREAM, borderRadius: '2px', padding: '14px 16px' }}>
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
                              <div style={{ marginTop: '8px', fontSize: '13px', color: RED, background: '#FBEDE9', borderRadius: '2px', padding: '9px 12px' }}>
                                Then <b>{c.store}</b> owes you <b>{money(c.varVal)}</b>. Send them an invoice for the {c.variance} units.
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ ...lbl, margin: '16px 0 8px' }}>Update this account</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                            <input value={dv(c.id + '_chk')} onChange={e => setDv(c.id + '_chk', e.target.value)} type="number" placeholder="Check $" style={{ ...inp, flex: 1, minWidth: 0 }} />
                            <button onClick={() => logCheck(c.id)} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: '2px', padding: '0 14px', ...btn, fontSize: '12px' }}>Log</button>
                          </div>
                          <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                            <input value={dv(c.id + '_cnt')} onChange={e => setDv(c.id + '_cnt', e.target.value)} type="number" placeholder="Count on shelf" style={{ ...inp, flex: 1, minWidth: 0 }} />
                            <button onClick={() => logCount(c.id)} style={{ background: KRAFT, color: '#fff', border: 'none', borderRadius: '2px', padding: '0 14px', ...btn, fontSize: '12px' }}>Log</button>
                          </div>
                          <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                            <input value={dv(c.id + '_shp')} onChange={e => setDv(c.id + '_shp', e.target.value)} type="number" placeholder="Ship more" style={{ ...inp, flex: 1, minWidth: 0 }} />
                            <button onClick={() => shipMore(c.id)} style={{ background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '0 14px', ...btn, fontSize: '12px' }}>Ship</button>
                          </div>
                        </div>

                        <div style={{ ...lbl, margin: '18px 0 8px' }}>Store relationship</div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', color: MUTED }}>Last spoke: <b style={{ color: INK }}>{fmtD(c.lastContact)}</b>{c.lastContact ? ` · ${daysSince(c.lastContact)}d ago` : ''}</span>
                          <button onClick={() => upd(c.id, { lastContact: todayStr }, 'Spoke with the store')} style={{ background: KRAFT, color: '#fff', border: 'none', borderRadius: '2px', padding: '5px 13px', ...btn, fontSize: '11px' }}>Spoke today</button>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', color: MUTED }}>Do they need more?</span>
                          <select value={c.restock || 'good'} onChange={e => upd(c.id, { restock: e.target.value })} style={{ ...inp, cursor: 'pointer', maxWidth: '200px' }}>
                            {RESTOCK.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                          </select>
                        </div>
                        <textarea value={c.notes || ''} onChange={e => upd(c.id, { notes: e.target.value })} rows={2} placeholder="Notes — who you talk to, what they like, what they said…" style={{ ...inp, width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />

                        <div style={{ ...lbl, margin: '18px 0 6px' }}>End of cycle</div>
                        <button onClick={() => { if (window.confirm(`Close out cycle ${c.cycle || 1} for ${c.store}? This settles the ${c.variance > 0 ? c.variance + ' missing bags' : 'reconciliation'} and starts a fresh cycle from the ${c.counted == null ? 0 : c.counted} bags on the shelf now.`)) closeOut(c.id) }} style={{ width: '100%', background: 'none', color: INK, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '12px', ...btn }}>Close out this cycle →</button>
                        <p style={{ fontSize: '12px', color: MUTED, marginTop: '7px', lineHeight: 1.5 }}>
                          {c.variance > 0
                            ? <>Settles the <b>{c.variance} missing</b> {c.diagnosis === 'Sold but not reported (store owes me)' ? <>by <b style={{ color: RED }}>invoicing the store {money(c.varVal)}</b></> : <>as a <b>write-off</b></>}, then resets the count clean for the next delivery — so old gaps never bleed into the new cycle.</>
                            : <>Reconciles clean and resets the count for the next delivery — so old numbers never bleed into the new cycle.</>}
                        </p>

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
                <KPI k="Direct profit" v={m0(directProfit)} sub={`after $${costPerBag}/bag cost`} accent={SPICE} />
                <KPI k="Units sold" v={directUnits} sub="direct channel" />
                <KPI k="Avg $ / unit" v={directUnits ? money(directRev / directUnits) : '—'} sub="$13 retail vs ~$8.5 consignment" accent={KRAFT} />
              </div>
              {!addingD ? (
                <button onClick={() => setAddingD(true)} style={{ width: '100%', background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '13px', ...btn, marginBottom: '16px' }}>+ Log a direct sale</button>
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
                    <button onClick={() => setAddingD(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addDirect} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '2px', padding: '11px', ...btn }}>+ Log sale</button>
                  </div>
                </div>
              )}
              {direct.map(d => (
                <div key={d.id} style={{ ...card, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ ...big, fontSize: '18px', color: INK }}>{d.who}</div>
                    <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>
                      <span style={{ fontWeight: 600, color: KRAFT }}>{d.source}</span> · {d.units} units · {d.units ? money(d.rev / d.units) : '$0'}/unit · <span style={{ color: GREEN, fontWeight: 600 }}>{m0(d.rev - d.units * costPerBag)} profit</span>
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
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...big, fontSize: '18px', color: INK, marginBottom: '6px' }}>Personal-card expenses only</div>
                <p style={{ fontSize: '13.5px', color: MUTED, lineHeight: 1.55 }}>Anything on a <b style={{ color: INK }}>business card</b> already flows in through <b style={{ color: INK }}>QuickBooks</b>. This is just for what you put on your <b style={{ color: INK }}>personal card</b> — import a statement or add them by hand. Each one <b style={{ color: INK }}>hits your P&L</b> here, and <b style={{ color: INK }}>I post them into QuickBooks for you at the monthly close</b> — you never touch QB.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="On your personal card" v={m0(personalExp)} sub="the business owes you this back" accent={RED} />
                <KPI k="Items this month" v={personalItems} sub="all flow into your P&L" accent={KRAFT} />
              </div>

              {!addingE ? (
                <>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <button onClick={() => fileRef.current && fileRef.current.click()} style={{ flex: 2, minWidth: '180px', background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '13px', ...btn }}>Import expenses (CSV)</button>
                    <button onClick={() => setAddingE(true)} style={{ flex: 1, minWidth: '150px', background: CARDBG, color: INK, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '13px', ...btn }}>Add one manually</button>
                    <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={importCSV} style={{ display: 'none' }} />
                  </div>
                  <p style={{ fontSize: '12px', color: MUTED, marginBottom: '16px' }}>Drop in your personal-card statement (CSV: vendor, amount, category) and every line loads at once.</p>
                </>
              ) : (
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>New personal-card expense</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={ef.vendor} onChange={e => setEf({ ...ef, vendor: e.target.value })} placeholder="What was it? *" style={{ ...inp, flex: 2, minWidth: '160px' }} />
                    <input value={ef.amt} onChange={e => setEf({ ...ef, amt: e.target.value })} type="number" placeholder="$ amount" style={{ ...inp, flex: 1, minWidth: '100px' }} />
                    <select value={ef.cat} onChange={e => setEf({ ...ef, cat: e.target.value })} style={{ ...inp, flex: 1, minWidth: '140px', cursor: 'pointer' }}>
                      {EXP_CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setAddingE(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addExpense} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '2px', padding: '11px', ...btn }}>Add expense</button>
                  </div>
                </div>
              )}
              {expenses.filter(e => e.pay === 'personal').map(e => (
                <div key={e.id} style={{ ...card, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ ...big, fontSize: '17px', color: INK }}>{e.vendor}</div>
                    <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>{e.cat}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ ...big, fontSize: '19px', color: RED }}>{m0(e.amt)}</span>
                    <button onClick={() => removeExpense(e.id)} style={{ background: 'none', border: 'none', color: '#C9BBA0', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                  </div>
                </div>
              ))}
              {personalItems > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <button onClick={exportPersonal} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '9px 14px', ...btn, color: MUTED }}>⤓ Export for books (CSV)</button>
                  <p style={{ fontSize: '12px', color: MUTED, marginTop: '7px', lineHeight: 1.5 }}>The raw file, for your accountant if they want it — but you don't need this. I post these into QuickBooks for you at close.</p>
                </div>
              )}
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
              <div style={{ ...card, marginBottom: '16px', fontSize: '13px', color: MUTED, lineHeight: 1.55 }}>
                <b style={{ color: INK }}>How each sale is traced to a channel:</b> a unique promo code per channel (IG10, NJFOODIE), the Meta/Google pixel on your Shopify store, or a “how’d you hear about us?” at checkout. Channels marked <b style={{ color: AMBER }}>“est.”</b> have no code yet — their ROI is a guess.
              </div>
              {!addingA ? (
                <button onClick={() => setAddingA(true)} style={{ width: '100%', background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '13px', ...btn, marginBottom: '16px' }}>+ Add a channel</button>
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
                    <button onClick={() => setAddingA(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addAd} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '2px', padding: '11px', ...btn }}>+ Add channel</button>
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
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: '#fff', background: vd.c, padding: '5px 12px', borderRadius: '2px' }}>{vd.t}</span>
                      </div>
                      <div style={{ marginTop: '12px', height: '8px', background: CREAM, borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
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
                  <div style={{ width: '44px', height: '44px', borderRadius: '2px', background: '#2CA01C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...big, fontSize: '19px' }}>qb</div>
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
                    <button onClick={() => b.rf.current && b.rf.current.click()} style={{ background: CARDBG, color: INK, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '11px 18px', ...btn }}>Drop in / replace</button>
                    <input ref={b.rf} type="file" accept=".csv,.txt" onChange={e => importBook(e, b.setter)} style={{ display: 'none' }} />
                  </div>
                </div>
              ))}

              <div style={{ ...card, background: '#EAF3EC', borderColor: '#CFE4D6', fontSize: '13.5px', color: INK, lineHeight: 1.55 }}>
                Both files are in, so your P&L, account balances, and this whole dashboard reflect your real books. Each month you just drop in the fresh GL — takes about a minute.
              </div>
            </>
          )}

          {/* ===== MONTHLY CLOSE → QB ===== */}
          {tab === 'close' && (
            <>
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...big, fontSize: '18px', color: INK, marginBottom: '6px' }}>Monthly close → QuickBooks</div>
                <p style={{ fontSize: '13.5px', color: MUTED, lineHeight: 1.55 }}>Exactly what to post to QuickBooks this month. <b style={{ color: INK }}>Shopify online sales aren't in here</b> — they book through Shopify, so nothing doubles up. This is everything Shopify can't see, already categorized.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Income to post" v={m0(closeIncome)} sub="consignment + offline direct" accent={GREEN} />
                <KPI k="COGS to post" v={m0(closeCogs)} sub={`${closeUnits} orders × ${money(costPerBag)}`} accent={KRAFT} />
                <KPI k="AR to invoice" v={m0(closeAR)} sub="stores that owe you" accent={closeAR ? RED : MUTED} />
              </div>

              <div style={{ ...card }}>
                <div style={{ ...lbl, color: KRAFT, margin: '2px 0 4px' }}>Income to post</div>
                <Row l="Wholesale collected" v={m0(cashCollected)} />
                <Row l="Direct sales — non-Shopify (market, pop-up, cash, wholesale)" v={m0(offlineDirectRev)} />
                <Row l="Total income to post" v={m0(closeIncome)} bold top />

                <div style={{ ...lbl, color: KRAFT, margin: '16px 0 4px' }}>Cost of goods sold</div>
                <Row l={`${closeUnits} orders × ${money(costPerBag)}/order`} v={`−${m0(closeCogs)}`} bold top />

                <div style={{ ...lbl, color: KRAFT, margin: '16px 0 4px' }}>Accounts receivable</div>
                <Row l="Invoice stores for sold-not-reported bags" v={m0(closeAR)} bold top />
                {closeAR === 0 && <p style={{ fontSize: '12px', color: MUTED, marginTop: '4px' }}>None flagged yet — diagnose missing pieces as “sold but not reported” on the Consignment tab to invoice them.</p>}

                <div style={{ marginTop: '16px', padding: '12px 14px', background: CREAM, borderRadius: '2px', border: `1px dashed ${BORDER}` }}>
                  <div style={{ ...lbl, marginBottom: '4px' }}>Booked elsewhere — do NOT re-enter</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: MUTED }}>
                    <span>Shopify online sales <span style={{ color: '#A2937A' }}>(via Shopify → QuickBooks)</span></span>
                    <span style={{ fontFamily: MONO }}>{m0(shopifyRev)}</span>
                  </div>
                </div>
              </div>

              <button onClick={exportClose} style={{ marginTop: '14px', background: CHAR, color: CREAM, border: 'none', borderRadius: '2px', padding: '13px 20px', ...btn }}>⤓ Export for QuickBooks (CSV)</button>
            </>
          )}

          {/* ===== ASK AI (preview) ===== */}
          {tab === 'askai' && (
            <>
              <div style={{ ...card, marginBottom: '16px', borderColor: 'rgba(200,70,44,.28)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ ...big, fontSize: '18px', color: INK }}>Ask your numbers</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: SPICE, padding: '2px 8px', borderRadius: '2px' }}>PREVIEW</span>
                </div>
                <div style={{ fontSize: '13.5px', color: MUTED, lineHeight: 1.55 }}>A look at what's coming: ask plain-English questions about your business and get answers straight from your live data. Here are a few samples.</div>
              </div>
              {[
                { q: 'Which store owes me the most right now?', a: <>Your counts show <b>Nutmeg</b> has the biggest gap: <b>7 bags missing</b> (~$56), most likely sold-but-unreported. Across all stores you're owed about <b>{m0(missVal)}</b> — I'd invoice the worst offenders.</> },
                { q: 'Where am I wasting ad money?', a: <>Three channels are underwater — <b>Facebook, the 5K, and flyers</b>. Together they cost <b>{m0(wastedSpend)}/mo</b> and return only <b>{m0(wastedReturn)}</b>. Move that budget to Instagram and your influencer (both ~4x).</> },
                { q: 'Did I actually make money this month?', a: <>Revenue is <b>{m0(revenue)}</b>, but after costs your net is <b>{m0(netProfit)}</b>. The two drags are ad waste and uncollected consignment money — fix both and you flip positive without selling a single extra bag.</> },
              ].map((m, i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <div style={{ background: CHAR, color: CREAM, padding: '10px 14px', borderRadius: '2px 14px 4px 14px', maxWidth: '80%', fontSize: '14px' }}>{m.q}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '2px', background: SPICE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...big, fontSize: '12px' }}>JK</div>
                    <div style={{ ...card, padding: '13px 15px', fontSize: '14px', lineHeight: 1.55, maxWidth: '85%' }}>{m.a}</div>
                  </div>
                </div>
              ))}
              <div style={{ ...card, display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <input disabled placeholder="Ask anything about your business…" style={{ ...inp, flex: 1, background: '#fff', cursor: 'not-allowed' }} />
                <button disabled style={{ background: MUTED, color: '#fff', border: 'none', borderRadius: '2px', padding: '11px 18px', ...btn, cursor: 'not-allowed' }}>Send</button>
              </div>
              <p style={{ fontSize: '12px', color: MUTED, marginTop: '10px', textAlign: 'center' }}>Live Q&amp;A is on the roadmap — this is a preview of the feature.</p>
            </>
          )}

        </main>
      </div>
    </>
  )
}

import { useState } from 'react'
import Head from 'next/head'

const CHAR = '#2B2018', SPICE = '#C8462C', KRAFT = '#A9763A', CREAM = '#F6F0E6'
const INK = '#2B2018', MUTED = '#8A7A66', GREEN = '#3E7C4F', BORDER = '#E6DBC8', AMBER = '#C98A2A', RED = '#C03A22'
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
// prior month — for month-over-month comparison
const PRIOR = { directRev: 1980, consignRev: 1510, cogs: 2280, opexNonAd: 640, adSpend: 1650, missVal: 78, month: 'May' }
const DIAGNOSES = ['', 'Sold but not reported (store owes me)', 'Theft / shrinkage', 'Damaged or expired', 'Free samples given out', 'Miscount — recount needed', 'Unknown — investigating']
const verdict = (roas) => roas >= 2 ? { c: GREEN, t: '🟢 SCALE IT' } : roas >= 1 ? { c: AMBER, t: '🟡 WATCH' } : { c: RED, t: '🔴 CUT IT' }

const PAY = [{ id: 'business', label: 'Business acct', color: MUTED }, { id: 'personal', label: '⚠ Personal CC', color: RED }]
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
  const addDirect = () => { if (!df.who.trim()) return; setDirect([{ id: uid(), who: df.who.trim(), source: df.source, units: Number(df.units) || 0, rev: Number(df.rev) || 0 }, ...direct]); setDf({ who: '', source: 'Shopify / online', units: '', rev: '' }); setAddingD(false) }
  const removeDirect = (id) => setDirect(direct.filter(d => d.id !== id))

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

  // month-over-month vs PRIOR — comparative P&L (each line as a profit contribution: revenue +, costs −)
  const thisMonth = new Date().toLocaleString('en-US', { month: 'short' })
  const priorRevenue = PRIOR.directRev + PRIOR.consignRev
  const priorGross = priorRevenue - PRIOR.cogs
  const priorTotalOpex = PRIOR.adSpend + PRIOR.opexNonAd
  const priorNet = priorGross - priorTotalOpex
  const netDelta = netProfit - priorNet
  const revDelta = revenue - priorRevenue
  const cmp = [
    { label: 'Direct sales', now: directRev, prior: PRIOR.directRev, kind: 'line' },
    { label: 'Consignment collected', now: cashCollected, prior: PRIOR.consignRev, kind: 'line' },
    { label: 'Total revenue', now: revenue, prior: priorRevenue, kind: 'subtotal' },
    { label: 'Cost of goods sold', now: -cogs, prior: -PRIOR.cogs, kind: 'line' },
    { label: 'Gross profit', now: grossProfit, prior: priorGross, kind: 'subtotal' },
    { label: 'Advertising', now: -adSpend, prior: -PRIOR.adSpend, kind: 'line' },
    { label: 'Other operating costs', now: -opexNonAd, prior: -PRIOR.opexNonAd, kind: 'line' },
    { label: 'Total operating expenses', now: -totalOpex, prior: -priorTotalOpex, kind: 'subtotal' },
    { label: netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS', now: netProfit, prior: priorNet, kind: 'total' },
  ]
  const movers = cmp.filter(c => c.kind === 'line').map(c => ({ ...c, delta: c.now - c.prior }))
  const bestMover = movers.slice().sort((a, b) => b.delta - a.delta)[0]
  const worstMover = movers.slice().sort((a, b) => a.delta - b.delta)[0]

  const card = { background: '#FFFDF9', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px' }
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 500, letterSpacing: '1.2px', color: '#6F5E47' }
  const inp = { padding: '10px 12px', fontSize: '14px', border: `1px solid ${BORDER}`, borderRadius: '9px', background: CREAM, color: INK, outline: 'none' }
  const big = { fontFamily: 'Oswald, sans-serif', fontWeight: 600 }

  const KPI = ({ k, v, sub, accent }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px', padding: '15px 17px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...big, fontSize: '29px', color: accent || INK, lineHeight: 1.15, marginTop: '3px' }}>{v}</div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', fontWeight: 500, color: '#9A8868', marginTop: '2px' }}>{sub}</div>
    </div>
  )
  const Row = ({ l, v, neg, bold, top }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: top ? `1px solid ${BORDER}` : 'none' }}>
      <span style={{ fontSize: '13px', color: bold ? INK : MUTED, fontWeight: bold ? 600 : 400 }}>{l}</span>
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: neg ? RED : (bold ? INK : MUTED), fontWeight: bold ? 600 : 400 }}>{v}</span>
    </div>
  )
  const Pill = ({ value, opts, map, onChange }) => (
    <select value={value} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); onChange(e.target.value) }}
      style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', padding: '6px 26px 6px 12px', borderRadius: '20px', border: 'none',
        fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 500, letterSpacing: '0.3px', color: '#fff',
        background: `${map[value].color} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 3.5L5 6.5L8 3.5' stroke='white' stroke-width='1.4' fill='none'/></svg>") no-repeat right 9px center` }}>
      {opts.map(o => <option key={o.id} value={o.id} style={{ color: INK, background: '#fff' }}>{o.label}</option>)}
    </select>
  )
  const CmpRow = ({ label, now, prior, kind }) => {
    const delta = now - prior, strong = kind === 'subtotal' || kind === 'total', help = delta >= 0
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: kind === 'total' ? '11px 0 2px' : '7px 0', borderTop: strong ? `1px solid ${BORDER}` : `1px solid ${CREAM}` }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: kind === 'total' ? '14px' : '13px', color: strong ? INK : MUTED, fontWeight: strong ? 700 : 400 }}>{label}</span>
        <span style={{ width: '70px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: strong ? INK : '#5C5040', fontWeight: strong ? 600 : 400 }}>{sgn(now)}</span>
        <span style={{ width: '70px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: '#A99A82' }}>{sgn(prior)}</span>
        <span style={{ width: '60px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: 600, color: delta === 0 ? '#A99A82' : (help ? GREEN : RED) }}>{delta === 0 ? '—' : (delta > 0 ? '+' : '') + sgn(delta)}</span>
      </div>
    )
  }

  const TABS = [['overview', 'Overview'], ['pnl', 'P&L'], ['trend', 'Month vs Month'], ['consign', 'Consignment'], ['direct', 'Direct Sales'], ['expenses', 'Expenses'], ['ads', 'Advertising']]

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
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}body{background:${CREAM};font-family:'DM Sans',sans-serif;color:${INK}}::placeholder{color:#A99A82}`}</style>
      </Head>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 18px 60px' }}>
        {/* Header */}
        <div style={{ background: CHAR, borderRadius: '0 0 20px 20px', padding: '24px 26px', margin: '0 -18px 22px', color: CREAM }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '3px', color: SPICE }}>🥩 CONSIGNMENT · DIRECT · ADS — ONE SCREEN</div>
              <h1 style={{ ...big, fontSize: '34px', fontWeight: 700, letterSpacing: '1px', marginTop: '2px', textTransform: 'uppercase' }}>{BIZ}</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ ...big, fontSize: '26px', color: SPICE }}>{m0(revenue)}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#B6A78C', letterSpacing: '1px' }}>REVENUE THIS MONTH</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setExpanded(null) }}
              style={{ padding: '9px 16px', borderRadius: '20px', border: `1px solid ${tab === id ? CHAR : BORDER}`, background: tab === id ? CHAR : '#FFFDF9', color: tab === id ? CREAM : MUTED, fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '0.5px', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW (the CFO view) ===== */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <KPI k="REVENUE / MO" v={m0(revenue)} sub="direct + consignment" accent={SPICE} />
              <KPI k="OUT ON CONSIGNMENT" v={m0(onShelfVal)} sub="your jerky in stores" accent={KRAFT} />
              <KPI k="MISSING PIECES" v={`${missUnits}`} sub={`${m0(missVal)} to investigate`} accent={missUnits ? RED : GREEN} />
              <KPI k="AD ROI" v={`${(adRev / adSpend).toFixed(1)}x`} sub={`${m0(adSpend)} spent`} accent={adRev / adSpend >= 2 ? GREEN : AMBER} />
            </div>

            {/* CFO advisory */}
            <div style={{ ...card, background: CHAR, borderColor: CHAR, color: CREAM, marginBottom: '16px' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: SPICE, marginBottom: '14px' }}>📋 WHAT THE NUMBERS ARE TELLING YOU TO DO</div>
              {[
                { i: '🔴', t: <>You're burning <b>{m0(wastedSpend)}/mo</b> on Facebook, the 5K, and flyers — they return only <b>{m0(wastedReturn)}</b>. Kill them and pocket the difference. Move it to Instagram + your influencer (both 4x).</> },
                { i: '📦', t: <><b>{missUnits} units (~{m0(missVal)})</b> are missing across your consignment stores. <b>{worst?.store}</b> is the worst ({worst?.variance} gone). Most likely they sold them and didn't pay you — that's money you're owed.</> },
                { i: '💵', t: <><b>{m0(onShelfVal)}</b> of your jerky is sitting in stores unsold. The <b>Butcher Collective</b> hasn't paid a dime on 75 units since May — go check if it's even moving.</> },
                { i: '💳', t: <>You've got <b>{m0(personalExp)}</b> of business expenses on your <b>personal credit card</b> this month — the business owes you that back, and unrecorded it costs you the tax deduction. I separate every one.</> },
                { i: '✅', t: <><b>CrossFit Toms River</b> reconciles to zero — clean account. Whatever that relationship is, go get 5 more like it.</> },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', padding: '9px 0', borderTop: i ? '1px solid #43352696' : 'none', fontSize: '14px', lineHeight: 1.5, color: '#EDE4D5' }}>
                  <span style={{ fontSize: '16px' }}>{x.i}</span><span>{x.t}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ ...card, flex: 1, minWidth: '240px' }}>
                <div style={{ ...lbl, marginBottom: '10px' }}>CASH POSITION</div>
                <Row l="Collected from consignment" v={m0(cashCollected)} />
                <Row l="Direct sales" v={m0(directRev)} />
                <Row l="Still out in stores (unsold)" v={m0(onShelfVal)} />
                <Row l="Owed to you (missing/sold)" v={m0(missVal)} neg />
                <Row l="Revenue booked this month" v={m0(revenue)} bold top />
              </div>
              <div style={{ ...card, flex: 1, minWidth: '240px' }}>
                <div style={{ ...lbl, marginBottom: '10px' }}>INVENTORY FLOW</div>
                <Row l="Units sent to consignment" v={consign.reduce((s, c) => s + c.sent, 0)} />
                <Row l="Sold & paid for" v={R.reduce((s, c) => s + c.paidUnits, 0)} />
                <Row l="Returned to you" v={consign.reduce((s, c) => s + c.returned, 0)} />
                <Row l="Should be on shelves" v={R.reduce((s, c) => s + Math.max(c.expected, 0), 0)} />
                <Row l="Missing / unaccounted" v={missUnits} neg bold top />
              </div>
            </div>
          </>
        )}

        {/* ===== P&L ===== */}
        {tab === 'pnl' && (
          <>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <KPI k="REVENUE" v={m0(revenue)} sub="direct + consignment" accent={GREEN} />
              <KPI k="GROSS PROFIT" v={m0(grossProfit)} sub={`${pct(grossProfit)}% margin`} accent={KRAFT} />
              <KPI k={netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'} v={m0(netProfit)} sub={netProfit >= 0 ? 'in the black' : 'in the red'} accent={netProfit >= 0 ? GREEN : RED} />
            </div>

            <div style={{ ...card }}>
              <div style={{ ...lbl, marginBottom: '14px' }}>PROFIT &amp; LOSS — THIS MONTH (cash basis)</div>

              <div style={{ ...lbl, color: KRAFT, margin: '4px 0' }}>REVENUE</div>
              <Row l="Direct sales" v={m0(directRev)} />
              <Row l="Consignment (collected)" v={m0(cashCollected)} />
              <Row l="Total revenue" v={m0(revenue)} bold top />

              <div style={{ ...lbl, color: KRAFT, margin: '16px 0 4px' }}>COST OF GOODS SOLD</div>
              {COGS_CATS.map(cat => { const v = expenses.filter(e => e.cat === cat).reduce((s, e) => s + e.amt, 0); return v > 0 ? <Row key={cat} l={cat} v={`−${m0(v)}`} /> : null })}
              <Row l="Total COGS" v={`−${m0(cogs)}`} bold top />
              <Row l={`GROSS PROFIT  ·  ${pct(grossProfit)}% margin`} v={m0(grossProfit)} bold top />

              <div style={{ ...lbl, color: KRAFT, margin: '16px 0 4px' }}>OPERATING EXPENSES</div>
              <Row l="Advertising" v={`−${m0(adSpend)}`} />
              {[...new Set(expenses.filter(e => !COGS_CATS.includes(e.cat)).map(e => e.cat))].map(cat => { const v = expenses.filter(e => e.cat === cat).reduce((s, e) => s + e.amt, 0); return <Row key={cat} l={cat} v={`−${m0(v)}`} /> })}
              <Row l="Total operating expenses" v={`−${m0(totalOpex)}`} bold top />

              <div style={{ marginTop: '12px', padding: '12px 14px', background: netProfit >= 0 ? '#EAF3EC' : '#FBEDE9', borderRadius: '10px' }}>
                <Row l={`${netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'}  ·  ${pct(netProfit)}% margin`} v={m0(netProfit)} bold neg={netProfit < 0} />
              </div>
            </div>

            <div style={{ ...card, marginTop: '16px', background: CHAR, borderColor: CHAR, color: CREAM, fontSize: '14px', lineHeight: 1.6 }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: SPICE, marginBottom: '8px' }}>THE CFO READ</div>
              {netProfit < 0
                ? <>You're <b>{m0(-netProfit)} in the red</b> this month — fixable, not fatal. Two levers: cut the <b>{m0(wastedSpend - wastedReturn)}</b> of dead ad spend and collect the <b>{m0(missVal)}</b> you're owed on missing consignment units. Do both and this swings toward black — <i>without selling one extra bag.</i></>
                : <>You netted <b>{m0(netProfit)}</b>. Cut the <b>{m0(wastedSpend - wastedReturn)}</b> of dead ad spend and collect the <b>{m0(missVal)}</b> you're owed and it grows — same jerky, more profit.</>}
            </div>
          </>
        )}

        {/* ===== MONTH VS MONTH ===== */}
        {tab === 'trend' && (
          <>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <KPI k={`${PRIOR.month.toUpperCase()} NET`} v={sgn(priorNet)} sub="last month" accent={priorNet >= 0 ? GREEN : RED} />
              <KPI k={`${thisMonth.toUpperCase()} NET`} v={sgn(netProfit)} sub="this month" accent={netProfit >= 0 ? GREEN : RED} />
              <KPI k="CHANGE" v={`${netDelta >= 0 ? '+' : ''}${sgn(netDelta)}`} sub={netDelta >= 0 ? 'more profit' : 'less profit'} accent={netDelta >= 0 ? GREEN : RED} />
            </div>

            <div style={{ ...card, marginBottom: '16px' }}>
              <div style={{ ...lbl, marginBottom: '10px' }}>PROFIT &amp; LOSS — {thisMonth.toUpperCase()} vs {PRIOR.month.toUpperCase()}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingBottom: '6px' }}>
                <span style={{ flex: 1 }} />
                <span style={{ ...lbl, width: '70px', textAlign: 'right', color: INK }}>{thisMonth}</span>
                <span style={{ ...lbl, width: '70px', textAlign: 'right', color: '#A99A82' }}>{PRIOR.month}</span>
                <span style={{ ...lbl, width: '60px', textAlign: 'right' }}>Δ</span>
              </div>
              {cmp.map(line => <CmpRow key={line.label} {...line} />)}
              <p style={{ fontSize: '11px', color: MUTED, marginTop: '12px', fontFamily: 'DM Mono, monospace' }}>Δ in green = better for profit · red = worse. Costs shown negative.</p>
            </div>

            <div style={{ ...card, background: CHAR, borderColor: CHAR, color: CREAM, fontSize: '14px', lineHeight: 1.6 }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: SPICE, marginBottom: '8px' }}>WHY THE NET MOVED {netDelta >= 0 ? '+' : ''}{sgn(netDelta)}</div>
              <>Revenue {revDelta >= 0 ? 'climbed' : 'fell'} <b>{sgn(Math.abs(revDelta))}</b> vs {PRIOR.month}{bestMover && bestMover.delta > 0 ? <> (mostly <b>{bestMover.label.toLowerCase()}</b>, {sgn(bestMover.delta)})</> : null}. But <b>{worstMover.label.toLowerCase()}</b> moved <b>{sgn(worstMover.delta)}</b> against you. {netDelta >= 0
                ? <>Net came out <b>{sgn(netDelta)} better</b> — keep pulling the levers that turned green.</>
                : <>Net came out <b>{sgn(Math.abs(netDelta))} worse</b> — that red line is exactly what ate your gains, and exactly what to fix.</>}</>
            </div>
          </>
        )}

        {/* ===== CONSIGNMENT (the star) ===== */}
        {tab === 'consign' && (
          <>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <KPI k="PARTNERS" v={consign.length} sub="stores carrying you" />
              <KPI k="OUT ON SHELVES" v={R.reduce((s, c) => s + Math.max(c.expected, 0), 0)} sub={`${m0(onShelfVal)} of product`} accent={KRAFT} />
              <KPI k="COLLECTED" v={m0(cashCollected)} sub="checks in the door" accent={GREEN} />
              <KPI k="MISSING" v={missUnits} sub={`${m0(missVal)} to chase`} accent={missUnits ? RED : GREEN} />
            </div>

            {!adding ? (
              <button onClick={() => setAdding(true)} style={{ width: '100%', background: CHAR, color: CREAM, border: 'none', borderRadius: '11px', padding: '13px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', marginBottom: '16px' }}>+ ADD A CONSIGNMENT PARTNER</button>
            ) : (
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...lbl, marginBottom: '12px' }}>NEW CONSIGNMENT PARTNER</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input value={cf.store} onChange={e => setCf({ ...cf, store: e.target.value })} placeholder="Store name *" style={{ ...inp, flex: 2, minWidth: '160px' }} />
                  <input value={cf.price} onChange={e => setCf({ ...cf, price: e.target.value })} type="number" placeholder="$ / unit" style={{ ...inp, flex: 1, minWidth: '90px' }} />
                  <input value={cf.sent} onChange={e => setCf({ ...cf, sent: e.target.value })} type="number" placeholder="Units sent" style={{ ...inp, flex: 1, minWidth: '100px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => setAdding(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '11px', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: MUTED, cursor: 'pointer' }}>CANCEL</button>
                  <button onClick={addPartner} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' }}>+ ADD PARTNER</button>
                </div>
              </div>
            )}

            {R.map(c => {
              const open = expanded === c.id
              const badge = c.status === 'reconciled' ? { c: GREEN, t: '✓ RECONCILED' } : c.status === 'short' ? { c: RED, t: `⚠ ${c.variance} MISSING` } : c.status === 'over' ? { c: AMBER, t: `${-c.variance} OVER` } : { c: MUTED, t: 'NOT COUNTED' }
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
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 600, color: '#fff', background: badge.c, padding: '5px 11px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{badge.t}</span>
                    </div>
                  </div>

                  {open && (
                    <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${CREAM}` }}>
                      {/* The reconciliation ledger — the money shot */}
                      <div style={{ ...lbl, margin: '14px 0 6px' }}>THE RECONCILIATION</div>
                      <div style={{ background: CREAM, borderRadius: '10px', padding: '14px 16px' }}>
                        <Row l="Units sent out" v={c.sent} />
                        <Row l={`− Paid by checks (${money(c.paid)} ÷ ${money(c.price)})`} v={`−${c.paidUnits}`} />
                        <Row l="− Returned to you" v={`−${c.returned}`} />
                        <Row l="Should still be on the shelf" v={Math.max(c.expected, 0)} bold top />
                        <Row l={`Actually counted (${fmtD(c.countedDate)})`} v={c.counted == null ? '— not counted' : c.counted} />
                        <Row
                          l={c.variance > 0 ? '⚠ MISSING — unaccounted for' : c.variance < 0 ? 'Overage — recount' : '✓ Matches perfectly'}
                          v={c.variance > 0 ? `${c.variance}  (${money(c.varVal)})` : c.variance < 0 ? `${-c.variance}` : '0'}
                          neg={c.variance > 0} bold top />
                      </div>

                      {c.variance > 0 && (
                        <div style={{ marginTop: '14px' }}>
                          <div style={{ ...lbl, marginBottom: '6px' }}>WHY ARE {c.variance} MISSING? (diagnose it)</div>
                          <select value={c.diagnosis} onChange={e => upd(c.id, { diagnosis: e.target.value }, `Diagnosed missing units: ${e.target.value || 'cleared'}`)} style={{ ...inp, width: '100%', cursor: 'pointer' }}>
                            {DIAGNOSES.map(d => <option key={d} value={d}>{d || 'Pick a reason…'}</option>)}
                          </select>
                          {c.diagnosis === 'Sold but not reported (store owes me)' && (
                            <div style={{ marginTop: '8px', fontSize: '13px', color: RED, background: '#FBEDE9', borderRadius: '8px', padding: '9px 12px' }}>
                              💰 Then <b>{c.store}</b> owes you <b>{money(c.varVal)}</b>. Send them an invoice for the {c.variance} units.
                            </div>
                          )}
                        </div>
                      )}

                      {/* quick actions */}
                      <div style={{ ...lbl, margin: '16px 0 8px' }}>UPDATE THIS ACCOUNT</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                          <input value={dv(c.id + '_chk')} onChange={e => setDv(c.id + '_chk', e.target.value)} type="number" placeholder="Check $" style={{ ...inp, flex: 1, minWidth: 0 }} />
                          <button onClick={() => logCheck(c.id)} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: '9px', padding: '0 12px', fontFamily: 'DM Mono, monospace', fontSize: '11px', cursor: 'pointer' }}>LOG</button>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                          <input value={dv(c.id + '_cnt')} onChange={e => setDv(c.id + '_cnt', e.target.value)} type="number" placeholder="Count on shelf" style={{ ...inp, flex: 1, minWidth: 0 }} />
                          <button onClick={() => logCount(c.id)} style={{ background: KRAFT, color: '#fff', border: 'none', borderRadius: '9px', padding: '0 12px', fontFamily: 'DM Mono, monospace', fontSize: '11px', cursor: 'pointer' }}>LOG</button>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '6px' }}>
                          <input value={dv(c.id + '_shp')} onChange={e => setDv(c.id + '_shp', e.target.value)} type="number" placeholder="Ship more" style={{ ...inp, flex: 1, minWidth: 0 }} />
                          <button onClick={() => shipMore(c.id)} style={{ background: CHAR, color: CREAM, border: 'none', borderRadius: '9px', padding: '0 12px', fontFamily: 'DM Mono, monospace', fontSize: '11px', cursor: 'pointer' }}>SHIP</button>
                        </div>
                      </div>

                      {(c.log || []).length > 0 && (
                        <div style={{ marginTop: '16px', borderTop: `1px solid ${CREAM}`, paddingTop: '12px' }}>
                          <div style={{ ...lbl, marginBottom: '8px' }}>HISTORY</div>
                          {c.log.map((e, i) => (
                            <div key={i} style={{ fontSize: '12px', color: MUTED, padding: '3px 0' }}>
                              <span style={{ color: '#BFB096', fontFamily: 'DM Mono, monospace', marginRight: '8px' }}>{e.at}</span>{e.t}
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
              <KPI k="DIRECT REVENUE" v={m0(directRev)} sub="cash in hand" accent={GREEN} />
              <KPI k="UNITS SOLD" v={directUnits} sub="direct channel" />
              <KPI k="AVG $ / UNIT" v={directUnits ? money(directRev / directUnits) : '—'} sub="vs ~$6.3 consignment" accent={SPICE} />
            </div>
            <p style={{ fontSize: '13px', color: MUTED, marginBottom: '14px', lineHeight: 1.5 }}>
              Direct clears at a <b style={{ color: INK }}>higher margin</b> than consignment — no store cut, paid on the spot. <b style={{ color: INK }}>Online orders sync from Shopify, market & pop-up sales from your Square reader, cash & wholesale you log here.</b>
            </p>
            {!addingD ? (
              <button onClick={() => setAddingD(true)} style={{ width: '100%', background: CHAR, color: CREAM, border: 'none', borderRadius: '11px', padding: '13px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', marginBottom: '16px' }}>+ LOG A DIRECT SALE</button>
            ) : (
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...lbl, marginBottom: '12px' }}>NEW DIRECT SALE</div>
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
                  <button onClick={() => setAddingD(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '11px', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: MUTED, cursor: 'pointer' }}>CANCEL</button>
                  <button onClick={addDirect} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' }}>+ LOG SALE</button>
                </div>
              </div>
            )}
            {direct.map(d => (
              <div key={d.id} style={{ ...card, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ ...big, fontSize: '18px', color: INK }}>{d.who}</div>
                  <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.5px', color: KRAFT, textTransform: 'uppercase' }}>{d.source}</span> · {d.units} units · {d.units ? money(d.rev / d.units) : '$0'}/unit
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

        {/* ===== EXPENSES / PERSONAL CARD ===== */}
        {tab === 'expenses' && (
          <>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <KPI k="TOTAL SPEND / MO" v={m0(totalExp)} sub="all business costs" />
              <KPI k="ON PERSONAL CARD" v={m0(personalExp)} sub="mixed in — needs fixing" accent={RED} />
              <KPI k="ON BUSINESS ACCT" v={m0(businessExp)} sub="clean & separate" accent={GREEN} />
            </div>
            <div style={{ ...card, background: '#FBEDE9', borderColor: '#E7C3B8', marginBottom: '16px', fontSize: '14px', color: INK, lineHeight: 1.55 }}>
              💳 <b>{m0(personalExp)}</b> of business expenses ran through your <b>personal credit card</b> this month. Two problems: the business owes that money back to <i>you</i>, and if it never hits the books you <b>lose the deduction and overpay the IRS</b>. Tap any expense to move it to the right account — I track and separate every one of these for you.
            </div>
            {!addingE ? (
              <button onClick={() => setAddingE(true)} style={{ width: '100%', background: CHAR, color: CREAM, border: 'none', borderRadius: '11px', padding: '13px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', marginBottom: '16px' }}>+ ADD AN EXPENSE</button>
            ) : (
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...lbl, marginBottom: '12px' }}>NEW EXPENSE</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input value={ef.vendor} onChange={e => setEf({ ...ef, vendor: e.target.value })} placeholder="What was it? *" style={{ ...inp, flex: 2, minWidth: '160px' }} />
                  <input value={ef.amt} onChange={e => setEf({ ...ef, amt: e.target.value })} type="number" placeholder="$ amount" style={{ ...inp, flex: 1, minWidth: '100px' }} />
                  <select value={ef.pay} onChange={e => setEf({ ...ef, pay: e.target.value })} style={{ ...inp, flex: 1, minWidth: '150px', cursor: 'pointer' }}>
                    {PAY.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => setAddingE(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '11px', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: MUTED, cursor: 'pointer' }}>CANCEL</button>
                  <button onClick={addExpense} style={{ flex: 2, background: SPICE, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' }}>+ ADD EXPENSE</button>
                </div>
              </div>
            )}
            {expenses.map(e => (
              <div key={e.id} style={{ ...card, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderColor: e.pay === 'personal' ? '#E7C3B8' : BORDER }}>
                <div>
                  <div style={{ ...big, fontSize: '17px', color: INK }}>{e.vendor}</div>
                  <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>{e.cat}</div>
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
              <KPI k="AD SPEND / MO" v={m0(adSpend)} sub="all channels" />
              <KPI k="RETURN" v={m0(adRev)} sub={`${(adRev / adSpend).toFixed(1)}x overall`} accent={GREEN} />
              <KPI k="WASTED" v={m0(wastedSpend)} sub="on losing channels" accent={RED} />
            </div>
            <div style={{ ...card, background: '#FBEDE9', borderColor: '#E7C3B8', marginBottom: '16px', fontSize: '14px', color: INK, lineHeight: 1.5 }}>
              👉 <b>Action:</b> you're spending <b>{m0(wastedSpend)}/mo</b> on channels that bring back only <b>{m0(wastedReturn)}</b>. Cut the red ones and you keep <b>{m0(wastedSpend - wastedReturn)}</b> a month — <b>{m0((wastedSpend - wastedReturn) * 12)}/yr</b> — with zero lost sales.
            </div>
            <div style={{ ...card, marginBottom: '16px', fontSize: '13px', color: MUTED, lineHeight: 1.55 }}>
              <b style={{ color: INK }}>How each sale is traced to a channel:</b> a unique promo code per channel (IG10, NJFOODIE), the Meta/Google pixel on your Shopify store, or a “how’d you hear about us?” at checkout. Channels marked <b style={{ color: AMBER }}>“est.”</b> have no code yet — their ROI is a guess. <b style={{ color: INK }}>Step one is giving every channel a code so the number becomes real, not a hunch.</b>
            </div>
            {ads.slice().sort((a, b) => (b.rev / b.spend) - (a.rev / a.spend)).map(a => {
              const roas = a.rev / a.spend, vd = verdict(roas)
              return (
                <div key={a.id} style={{ ...card, marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ ...big, fontSize: '18px', color: INK }}>{a.channel}</div>
                      <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>{m0(a.spend)} spent → {m0(a.rev)} back · <b style={{ color: vd.c }}>{roas.toFixed(1)}x{a.tracked ? '' : ' est.'}</b></div>
                      <div style={{ fontSize: '11px', color: a.tracked ? KRAFT : AMBER, marginTop: '4px' }}>{a.tracked ? '🎯 ' : '⚠ '}{a.track}</div>
                    </div>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 600, color: '#fff', background: vd.c, padding: '5px 11px', borderRadius: '20px' }}>{vd.t}</span>
                  </div>
                  {/* spend bar */}
                  <div style={{ marginTop: '12px', height: '8px', background: CREAM, borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${Math.min(roas / 4 * 100, 100)}%`, background: vd.c }} />
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* CTA */}
        <div style={{ background: SPICE, borderRadius: '16px', padding: '26px', marginTop: '26px', color: '#fff' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#FCE0D8', marginBottom: '8px' }}>HOW I'D HELP — TWO WAYS</div>
          <div style={{ ...big, fontSize: '21px', fontWeight: 600, lineHeight: 1.4, marginBottom: '12px' }}>
            Be your CFO, or run the whole back office. Your call.
          </div>
          <p style={{ fontSize: '14px', color: '#FDEEE9', lineHeight: 1.6, marginBottom: '14px' }}>
            <b>As your CFO:</b> I keep this dashboard live, reconcile every consignment account, chase the money you're owed, and tell you each month exactly where to cut and where to push.<br />
            <b>Full takeover:</b> I do all of that <i>plus</i> your books, taxes-ready, so you never touch a spreadsheet again and just make jerky.
          </p>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: '#fff' }}>— Jonathan Katz · <span style={{ color: CHAR }}>JK No Jokes Financials</span></div>
        </div>
      </div>
    </>
  )
}

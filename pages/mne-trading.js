import { useState } from 'react'
import Head from 'next/head'

// ── Theme ────────────────────────────────────────────────────────────────────
const NAVY = '#1C2B4A', GOLD = '#B8973A', CREAM = '#F7F5F0'
const INK = '#1A1A2E', MUTED = '#7A7A8A', GREEN = '#2E7D46', RED = '#C03A22', AMBER = '#C98A2A'
const BORDER = '#E4DDD2', CARDBG = '#FFFFFF'
const MONO = "'IBM Plex Mono', monospace"
const BIZ = 'MNE Trading'

const money = (n) => '$' + (Math.round((n||0) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const m0 = (n) => '$' + Math.round(n||0).toLocaleString()
const uid = () => Math.random().toString(36).slice(2, 9)
const fmtD = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' }) : '—'
const daysTill = (s) => { if (!s) return null; const d = Math.round((new Date(s+'T00:00:00') - Date.now()) / 86400000); return d }

const BRANDS = ['Michele', 'Michael Kors', 'Armani', 'Burberry', 'Citizen', 'Bulova', 'Mau Jim', 'Ray-Ban', 'Oakley']
const STATUSES = { ordered: { label: 'Ordered', color: MUTED }, in_transit: { label: 'In Transit ✈', color: '#2A6CB8' }, arrived: { label: 'Arrived ✓', color: GREEN }, delayed: { label: 'Delayed ⚠', color: RED } }
const LANDED_TYPES = ['Freight', 'Duties', 'Delivery', 'Worker', 'Other']
const totalLanded = (p) => (p.landedCosts || []).reduce((s, c) => s + Number(c.amount || 0), 0)
const landedPerUnit = (p) => p.units ? totalLanded(p) / p.units : 0
const totalCostPerUnit = (p) => Number(p.unitCost || 0) + landedPerUnit(p)

const SEED_POS = [
  { id: uid(), poNo: 'PO-001', supplier: 'HK Watch Imports Ltd', origin: 'Hong Kong', brand: 'Michele', units: 24, unitCost: 180, total: 4320, ordered: '2026-06-01', eta: '2026-06-20', status: 'arrived', billNo: 'BILL-001', billPaid: true, shipper: 'DHL Express', customs: 'A&M Customs Brokers', notes: '', landedCosts: [{ id: uid(), type: 'Freight', amount: 480 }, { id: uid(), type: 'Duties', amount: 648 }, { id: uid(), type: 'Delivery', amount: 120 }] },
  { id: uid(), poNo: 'PO-002', supplier: 'Euro Luxury SA', origin: 'Italy', brand: 'Armani', units: 18, unitCost: 220, total: 3960, ordered: '2026-06-05', eta: '2026-06-28', status: 'arrived', billNo: 'BILL-002', billPaid: false, shipper: 'FedEx International', customs: 'A&M Customs Brokers', notes: '', landedCosts: [{ id: uid(), type: 'Freight', amount: 360 }, { id: uid(), type: 'Duties', amount: 594 }] },
  { id: uid(), poNo: 'PO-003', supplier: 'Optical World Italia', origin: 'Italy', brand: 'Ray-Ban', units: 60, unitCost: 48, total: 2880, ordered: '2026-06-10', eta: '2026-06-30', status: 'in_transit', billNo: null, billPaid: false, shipper: 'FedEx International', customs: 'A&M Customs Brokers', notes: '', landedCosts: [] },
  { id: uid(), poNo: 'PO-004', supplier: 'MK Global Dist.', origin: 'USA', brand: 'Michael Kors', units: 30, unitCost: 165, total: 4950, ordered: '2026-06-12', eta: '2026-07-08', status: 'in_transit', billNo: null, billPaid: false, shipper: 'UPS Freight', customs: '', notes: '', landedCosts: [] },
  { id: uid(), poNo: 'PO-005', supplier: 'HK Watch Imports Ltd', origin: 'Hong Kong', brand: 'Citizen', units: 48, unitCost: 95, total: 4560, ordered: '2026-06-15', eta: '2026-07-15', status: 'ordered', billNo: null, billPaid: false, shipper: 'DHL Express', customs: 'A&M Customs Brokers', notes: '', landedCosts: [] },
  { id: uid(), poNo: 'PO-006', supplier: 'Burberry Wholesale EU', origin: 'UK', brand: 'Burberry', units: 12, unitCost: 310, total: 3720, ordered: '2026-06-08', eta: '2026-06-25', status: 'delayed', billNo: null, billPaid: false, shipper: 'DHL Express', customs: 'A&M Customs Brokers', notes: 'Customs hold in London — estimated 1-week delay', landedCosts: [] },
  { id: uid(), poNo: 'PO-007', supplier: 'Pacific Sun Optics', origin: 'Japan', brand: 'Mau Jim', units: 36, unitCost: 72, total: 2592, ordered: '2026-06-18', eta: '2026-07-20', status: 'ordered', billNo: null, billPaid: false, shipper: 'Japan Post EMS', customs: 'A&M Customs Brokers', notes: '', landedCosts: [] },
]

const SEED_INVOICES = [
  { id: uid(), invNo: 'INV-001', customer: 'Luxury Watch Boutique NJ', brand: 'Michele', units: 12, unitPrice: 340, total: 4080, date: '2026-06-22', due: '2026-07-22', paid: true, paidDate: '2026-06-22', notes: '' },
  { id: uid(), invNo: 'INV-002', customer: 'Style Hub Lakewood', brand: 'Michele', units: 6, unitPrice: 340, total: 2040, date: '2026-06-21', due: '2026-07-21', paid: true, paidDate: '2026-06-23', notes: '' },
  { id: uid(), invNo: 'INV-003', customer: 'Riviera Accessories', brand: 'Armani', units: 8, unitPrice: 420, total: 3360, date: '2026-06-20', due: '2026-07-20', paid: false, paidDate: null, notes: '' },
  { id: uid(), invNo: 'INV-004', customer: 'Prestige Watches Brooklyn', brand: 'Michael Kors', units: 15, unitPrice: 310, total: 4650, date: '2026-06-23', due: '2026-07-23', paid: false, paidDate: null, notes: 'Pre-sold — goods arriving July 8' },
  { id: uid(), invNo: 'INV-005', customer: 'Fifth Ave Eyewear', brand: 'Ray-Ban', units: 30, unitPrice: 95, total: 2850, date: '2026-06-23', due: '2026-07-23', paid: false, paidDate: null, notes: 'Pre-sold — goods in transit' },
]

// 12-month P&L history (Jun matches the live invoices/POs total)
const MONTH_PL = [
  { m: 'Jul', rev: 14200, cogs: 8900 },  { m: 'Aug', rev: 15800, cogs: 9700 },
  { m: 'Sep', rev: 13600, cogs: 8600 },  { m: 'Oct', rev: 17400, cogs: 10600 },
  { m: 'Nov', rev: 19200, cogs: 11800 }, { m: 'Dec', rev: 22600, cogs: 13900 },
  { m: 'Jan', rev: 15100, cogs: 9400 },  { m: 'Feb', rev: 16300, cogs: 10100 },
  { m: 'Mar', rev: 18900, cogs: 11600 }, { m: 'Apr', rev: 20400, cogs: 12500 },
  { m: 'May', rev: 21300, cogs: 13100 }, { m: 'Jun', rev: 16980, cogs: 8280 },
]

const TABS = [['overview', 'Overview'], ['pos', "PO's & Bills"], ['invoices', 'Invoices'], ['pnl', 'P&L'], ['quickbooks', 'QuickBooks']]

export default function MNETrading() {
  const [tab, setTab] = useState('overview')
  const [pos, setPos] = useState(SEED_POS)
  const [invoices, setInvoices] = useState(SEED_INVOICES)
  const [expanded, setExpanded] = useState(null)
  const [addingPO, setAddingPO] = useState(false)
  const [addingInv, setAddingInv] = useState(false)
  const [pof, setPof] = useState({ supplier: '', origin: '', brand: BRANDS[0], units: '', unitCost: '', eta: '', shipper: '', customs: '', notes: '' })
  const [lcForm, setLcForm] = useState({}) // { poId: { type, amount } }
  const [addingLC, setAddingLC] = useState(null) // poId
  const [invf, setInvf] = useState({ customer: '', brand: BRANDS[0], units: '', unitPrice: '', due: '', notes: '' })
  const [rngStart, setRngStart] = useState(0)
  const [rngEnd, setRngEnd] = useState(99)

  // aggregates
  const arrivedPOs = pos.filter(p => p.status === 'arrived')
  const inTransitPOs = pos.filter(p => p.status === 'in_transit')
  const delayedPOs = pos.filter(p => p.status === 'delayed')
  const totalBilled = arrivedPOs.reduce((s, p) => s + p.total, 0)
  const unpaidBills = arrivedPOs.filter(p => !p.billPaid).reduce((s, p) => s + p.total, 0)
  const inTransitValue = [...inTransitPOs, ...delayedPOs].reduce((s, p) => s + p.total, 0)
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0)
  const totalCollected = invoices.filter(i => i.paid).reduce((s, i) => s + i.total, 0)
  const totalOutstanding = invoices.filter(i => !i.paid).reduce((s, i) => s + i.total, 0)
  const grossProfit = totalInvoiced - totalBilled
  const margin = totalInvoiced ? Math.round(grossProfit / totalInvoiced * 100) : 0

  // by brand P&L
  const brandPnl = BRANDS.map(b => {
    const cost = arrivedPOs.filter(p => p.brand === b).reduce((s, p) => s + p.total, 0)
    const rev = invoices.filter(i => i.brand === b).reduce((s, i) => s + i.total, 0)
    const units_bought = pos.filter(p => p.brand === b).reduce((s, p) => s + p.units, 0)
    const units_sold = invoices.filter(i => i.brand === b).reduce((s, i) => s + i.units, 0)
    return { brand: b, cost, rev, profit: rev - cost, units_bought, units_sold }
  }).filter(b => b.cost > 0 || b.rev > 0)

  // month-by-month P&L + date-range aggregation
  const ytdRevM = MONTH_PL.reduce((s, m) => s + m.rev, 0)
  const ytdCogsM = MONTH_PL.reduce((s, m) => s + m.cogs, 0)
  const rA = Math.min(rngStart, MONTH_PL.length - 1)
  const rB = Math.min(Math.max(rngEnd, rA), MONTH_PL.length - 1)
  const rSel = MONTH_PL.slice(rA, rB + 1)
  const rRev = rSel.reduce((s, m) => s + m.rev, 0)
  const rCogs = rSel.reduce((s, m) => s + m.cogs, 0)
  const rGp = rRev - rCogs
  const rLabel = `${MONTH_PL[rA].m}–${MONTH_PL[rB].m}`
  const rCount = rB - rA + 1

  const addPO = () => {
    if (!pof.supplier.trim() || !pof.brand) return
    const total = (Number(pof.units)||0) * (Number(pof.unitCost)||0)
    const newPO = { id: uid(), poNo: `PO-${String(pos.length+1).padStart(3,'0')}`, supplier: pof.supplier.trim(), origin: pof.origin.trim(), brand: pof.brand, units: Number(pof.units)||0, unitCost: Number(pof.unitCost)||0, total, ordered: new Date().toISOString().slice(0,10), eta: pof.eta, status: 'ordered', billNo: null, billPaid: false, shipper: pof.shipper.trim(), customs: pof.customs.trim(), notes: pof.notes }
    setPos(prev => [newPO, ...prev])
    setPof({ supplier: '', origin: '', brand: BRANDS[0], units: '', unitCost: '', eta: '', notes: '' }); setAddingPO(false)
  }
  const addInv = () => {
    if (!invf.customer.trim()) return
    const total = (Number(invf.units)||0) * (Number(invf.unitPrice)||0)
    const newInv = { id: uid(), invNo: `INV-${String(invoices.length+1).padStart(3,'0')}`, customer: invf.customer.trim(), brand: invf.brand, units: Number(invf.units)||0, unitPrice: Number(invf.unitPrice)||0, total, date: new Date().toISOString().slice(0,10), due: invf.due, paid: false, paidDate: null, notes: invf.notes }
    setInvoices(prev => [newInv, ...prev])
    setInvf({ customer: '', brand: BRANDS[0], units: '', unitPrice: '', due: '', notes: '' }); setAddingInv(false)
  }
  const addLandedCost = (poId) => {
    const f = lcForm[poId] || {}
    if (!f.amount || Number(f.amount) <= 0) return
    setPos(prev => prev.map(p => p.id === poId ? { ...p, landedCosts: [...(p.landedCosts||[]), { id: uid(), type: f.type || 'Freight', amount: Number(f.amount) }] } : p))
    setLcForm(prev => ({ ...prev, [poId]: { type: 'Freight', amount: '' } }))
    setAddingLC(null)
  }
  const removeLandedCost = (poId, lcId) => setPos(prev => prev.map(p => p.id === poId ? { ...p, landedCosts: (p.landedCosts||[]).filter(c => c.id !== lcId) } : p))
  const markArrived = (id) => setPos(prev => prev.map(p => p.id === id ? { ...p, status: 'arrived', billNo: `BILL-${String(arrivedPOs.length+1).padStart(3,'0')}` } : p))
  const markBillPaid = (id) => setPos(prev => prev.map(p => p.id === id ? { ...p, billPaid: true } : p))
  const markInvPaid = (id) => setInvoices(prev => prev.map(i => i.id === id ? { ...i, paid: true, paidDate: new Date().toISOString().slice(0,10) } : i))

  const exportQB = () => {
    const lines = [['Type','Ref #','Date','Due Date','Entity','Brand','Units','Amount','Status']]
    arrivedPOs.forEach(p => lines.push(['Bill', p.billNo||p.poNo, p.ordered, '', p.supplier, p.brand, p.units, p.total, p.billPaid?'Paid':'Unpaid']))
    invoices.forEach(i => lines.push(['Invoice', i.invNo, i.date, i.due, i.customer, i.brand, i.units, i.total, i.paid?'Paid':'Unpaid']))
    const csv = lines.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download = 'mne-trading-qb-export.csv'; a.click()
  }

  // styles
  const card = { background: CARDBG, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px' }
  const lbl = { fontSize: '11px', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#96866C' }
  const inp = { padding: '10px 12px', fontSize: '14px', border: `1px solid ${BORDER}`, borderRadius: '9px', background: CREAM, color: INK, outline: 'none', fontFamily: 'inherit', width: '100%' }
  const big = { fontWeight: 700, letterSpacing: '-0.4px' }
  const btn = { fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }
  const statusBadge = (s) => ({ fontSize: '12px', fontWeight: 600, color: '#fff', background: STATUSES[s]?.color || MUTED, padding: '4px 11px', borderRadius: '20px', whiteSpace: 'nowrap' })
  const currentLabel = (TABS.find(t => t[0] === tab) || ['',''])[1]

  const KPI = ({ k, v, sub, accent }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px', padding: '15px 17px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...big, fontSize: '28px', color: accent || INK, lineHeight: 1.2, marginTop: '4px' }}>{v}</div>
      {sub && <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>{sub}</div>}
    </div>
  )

  return (
    <>
      <Head>
        <title>MNE Trading — Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${CREAM};font-family:'Inter',sans-serif;color:${INK};-webkit-font-smoothing:antialiased}::placeholder{color:#B0A898}
.mne-shell{display:flex;min-height:100vh}
.mne-side{width:230px;flex-shrink:0;background:${NAVY};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.mne-nav{display:flex;flex-direction:column;gap:3px;flex:1}
.mne-btn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:10px;border:none;background:transparent;color:#8A9BB8;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer}
.mne-btn:hover{background:rgba(255,255,255,.08);color:#fff}
.mne-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px}
@media(max-width:860px){.mne-shell{flex-direction:column}.mne-side{width:auto;height:auto;position:static;padding:14px 12px}.mne-nav{flex-direction:row;overflow-x:auto;gap:6px;padding-bottom:4px}.mne-btn{width:auto;padding:8px 15px;border-radius:18px;background:rgba(255,255,255,.07)}.mne-main{padding:18px 16px 52px}}`}</style>
      </Head>

      <div className="mne-shell">
        {/* Sidebar */}
        <aside className="mne-side">
          <div style={{ padding: '2px 8px 20px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>MNE</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: GOLD, letterSpacing: '0.12em', marginTop: '2px' }}>TRADING</div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', color: '#5A6E8A', marginTop: '6px', textTransform: 'uppercase' }}>Dashboard</div>
          </div>
          <nav className="mne-nav">
            {TABS.map(([id, label]) => (
              <button key={id} className="mne-btn" onClick={() => { setTab(id); setExpanded(null) }}
                style={tab === id ? { background: 'rgba(255,255,255,.12)', color: '#fff', boxShadow: `inset 3px 0 0 ${GOLD}` } : undefined}>
                {label}
              </button>
            ))}
          </nav>
          <div style={{ padding: '12px 10px 0', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: '8px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: '#5A6E8A', lineHeight: 1.6 }}>
              Built &amp; maintained by<br /><span style={{ color: GOLD, fontWeight: 600 }}>JK No Jokes Financials</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="mne-main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: GOLD, textTransform: 'uppercase' }}>MNE Trading</div>
              <h1 style={{ ...big, fontSize: '28px', color: INK, lineHeight: 1.1, marginTop: '2px' }}>{currentLabel}</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ ...big, fontSize: '24px', color: GREEN }}>{m0(totalCollected)}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', color: MUTED, textTransform: 'uppercase' }}>Collected this month</div>
            </div>
          </div>

          {/* ===== OVERVIEW ===== */}
          {tab === 'overview' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Total invoiced" v={m0(totalInvoiced)} sub={`${m0(totalCollected)} collected`} accent={GREEN} />
                <KPI k="Outstanding invoices" v={m0(totalOutstanding)} sub={`${invoices.filter(i=>!i.paid).length} unpaid`} accent={AMBER} />
                <KPI k="In transit" v={m0(inTransitValue)} sub={`${inTransitPOs.length} shipments + ${delayedPOs.length} delayed`} accent='#2A6CB8' />
                <KPI k="Unpaid bills" v={m0(unpaidBills)} sub="owed to suppliers" accent={RED} />
              </div>

              {/* Shipment status */}
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...lbl, marginBottom: '14px' }}>Shipment status — all purchase orders</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: '10px', marginBottom: '12px' }}>
                  {[
                    { label: 'Ordered', count: pos.filter(p=>p.status==='ordered').length, color: MUTED },
                    { label: 'In Transit', count: inTransitPOs.length, color: '#2A6CB8' },
                    { label: 'Arrived', count: arrivedPOs.length, color: GREEN },
                    { label: 'Delayed', count: delayedPOs.length, color: RED },
                  ].map(s => (
                    <div key={s.label} onClick={() => setTab('pos')} style={{ background: CREAM, borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'box-shadow .15s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow='0 3px 12px rgba(0,0,0,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: INK }}>{s.label}</span>
                      <span style={{ ...big, fontSize: '22px', color: s.color }}>{s.count}</span>
                    </div>
                  ))}
                </div>
                {delayedPOs.length > 0 && (
                  <div style={{ background: '#FBEDE9', border: '1px solid #E7C3B8', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: RED, marginBottom: '6px' }}>⚠ Delayed shipments</div>
                    {delayedPOs.map(p => (
                      <div key={p.id} onClick={() => { setTab('pos'); setExpanded(p.id) }} style={{ fontSize: '13px', color: INK, marginBottom: '4px', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#E7C3B8' }}>
                        <b>{p.poNo}</b> · {p.brand} ({p.units} units) — {p.notes || 'Delay reported'}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent activity */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ ...card, flex: 1, minWidth: '280px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>Recent invoices</div>
                  {invoices.slice(0,4).map((inv, i) => (
                    <div key={inv.id} onClick={() => { setTab('invoices'); setExpanded(inv.id) }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i ? `1px solid ${CREAM}` : 'none', gap: '8px', cursor: 'pointer', borderRadius: '8px', margin: '0 -6px', padding: '8px 6px' }}
                      onMouseEnter={e => e.currentTarget.style.background='#F0EDE8'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{inv.customer}</div>
                        <div style={{ fontSize: '12px', color: MUTED }}>{inv.brand} · {inv.invNo}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ ...big, fontSize: '15px', color: inv.paid ? GREEN : AMBER }}>{m0(inv.total)}</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: inv.paid ? GREEN : AMBER }}>{inv.paid ? '✓' : 'Due'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ ...card, flex: 1, minWidth: '280px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>Upcoming arrivals</div>
                  {[...inTransitPOs, ...pos.filter(p=>p.status==='ordered')].sort((a,b)=>(a.eta||'').localeCompare(b.eta||'')).slice(0,4).map((p, i) => {
                    const d = daysTill(p.eta)
                    return (
                      <div key={p.id} onClick={() => { setTab('pos'); setExpanded(p.id) }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 6px', borderTop: i ? `1px solid ${CREAM}` : 'none', gap: '8px', cursor: 'pointer', borderRadius: '8px', margin: '0 -6px' }}
                        onMouseEnter={e => e.currentTarget.style.background='#F0EDE8'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.brand} <span style={{ fontWeight: 400, color: MUTED, fontSize: '13px' }}>({p.units} units)</span></div>
                          <div style={{ fontSize: '12px', color: MUTED }}>{p.supplier} · ETA {fmtD(p.eta)}</div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: d != null && d <= 3 ? AMBER : MUTED, whiteSpace: 'nowrap' }}>{d != null ? (d <= 0 ? 'Today' : `${d}d`) : '—'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ===== PO's & BILLS ===== */}
          {tab === 'pos' && (() => {
            const openPOs = pos.filter(p => p.status !== 'arrived')
            const bills = pos.filter(p => p.status === 'arrived')
            const POCard = (p) => {
              const open = expanded === p.id
              const st = STATUSES[p.status] || STATUSES.ordered
              return (
                <div key={p.id} style={{ ...card, padding: 0, marginBottom: '12px', overflow: 'hidden', borderColor: open ? NAVY : BORDER }}>
                  <div onClick={() => setExpanded(open ? null : p.id)} style={{ padding: '15px 18px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ ...big, fontSize: '16px', color: NAVY }}>{p.poNo}</span>
                          <span style={statusBadge(p.status)}>{st.label}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: INK, fontWeight: 600, marginTop: '5px' }}>{p.brand} <span style={{ fontWeight: 400, color: MUTED }}>· {p.units} units · {p.supplier}{p.origin ? ` (${p.origin})` : ''}</span></div>
                        <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>Ordered {fmtD(p.ordered)} · ETA {fmtD(p.eta)} · {money(p.unitCost)}/unit</div>
                        {(p.shipper || p.customs) && <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>{p.shipper ? `✈ ${p.shipper}` : ''}{p.shipper && p.customs ? ' · ' : ''}{p.customs ? `🛃 ${p.customs}` : ''}</div>}
                        {(p.landedCosts||[]).length > 0 && <div style={{ fontSize: '12px', marginTop: '4px', color: AMBER, fontWeight: 600 }}>{money(p.unitCost)}/unit → {money(totalCostPerUnit(p))}/unit landed</div>}
                      </div>
                      <div style={{ ...big, fontSize: '20px', color: INK, flexShrink: 0 }}>{m0(p.total)}</div>
                    </div>
                    {p.notes && <div style={{ marginTop: '8px', fontSize: '12px', color: p.status === 'delayed' ? RED : MUTED, background: p.status === 'delayed' ? '#FBEDE9' : CREAM, borderRadius: '7px', padding: '6px 10px' }}>{p.notes}</div>}
                  </div>
                  {open && (
                    <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${CREAM}` }}>
                      {/* Landed cost breakdown */}
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: NAVY, marginBottom: '8px' }}>Landed Cost Breakdown</div>
                        <div style={{ background: CREAM, borderRadius: '10px', padding: '12px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${BORDER}`, marginBottom: '6px' }}>
                            <span style={{ fontSize: '13px', color: MUTED }}>Unit cost</span>
                            <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 600, color: INK }}>{money(p.unitCost)}/unit</span>
                          </div>
                          {(p.landedCosts||[]).length === 0 && <div style={{ fontSize: '13px', color: MUTED, padding: '4px 0' }}>No landed costs added yet.</div>}
                          {(p.landedCosts||[]).map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px dashed ${BORDER}` }}>
                              <span style={{ fontSize: '13px', color: INK }}>{c.type}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '12px', color: MUTED }}>{m0(c.amount)} total</span>
                                <span style={{ fontFamily: MONO, fontSize: '13px', color: AMBER }}>{money(p.units ? c.amount/p.units : 0)}/unit</span>
                                <button onClick={() => removeLandedCost(p.id, c.id)} style={{ background: 'none', border: 'none', color: '#C9BBA0', fontSize: '15px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                              </div>
                            </div>
                          ))}
                          {(p.landedCosts||[]).length > 0 && <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: `1px solid ${BORDER}`, marginTop: '4px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: INK }}>Total landed/unit</span>
                              <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 600, color: AMBER }}>{money(landedPerUnit(p))}/unit</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: `2px solid ${NAVY}`, marginTop: '2px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: NAVY }}>Total cost/unit</span>
                              <span style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 700, color: NAVY }}>{money(totalCostPerUnit(p))}/unit</span>
                            </div>
                          </>}
                        </div>
                        {addingLC === p.id ? (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <select value={(lcForm[p.id]||{}).type||'Freight'} onChange={e => setLcForm(prev => ({...prev, [p.id]: {...(prev[p.id]||{}), type: e.target.value}}))} style={{ ...inp, flex: 1, minWidth: '120px', cursor: 'pointer', width: 'auto' }}>
                              {LANDED_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <input value={(lcForm[p.id]||{}).amount||''} onChange={e => setLcForm(prev => ({...prev, [p.id]: {...(prev[p.id]||{}), amount: e.target.value}}))} type="number" placeholder="Total $ amount" style={{ ...inp, flex: 1, minWidth: '130px', width: 'auto' }} />
                            <button onClick={() => addLandedCost(p.id)} style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 14px', ...btn }}>Add</button>
                            <button onClick={() => setAddingLC(null)} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '10px 14px', ...btn, color: MUTED }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setAddingLC(p.id); setLcForm(prev => ({...prev, [p.id]: { type: 'Freight', amount: '' }})) }} style={{ marginTop: '8px', background: 'none', border: `1px dashed ${NAVY}`, borderRadius: '9px', padding: '8px 14px', ...btn, color: NAVY, fontSize: '13px' }}>+ Add landed cost</button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                        <button onClick={() => { markArrived(p.id); setExpanded(null) }} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 16px', ...btn }}>✓ Goods arrived — convert to bill</button>
                        {p.status !== 'delayed' && (
                          <button onClick={() => setPos(prev => prev.map(x => x.id === p.id ? {...x, status: 'delayed'} : x))} style={{ background: 'none', border: `1px solid ${RED}`, borderRadius: '9px', padding: '10px 16px', ...btn, color: RED }}>⚠ Flag as delayed</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            }
            return (
              <>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <KPI k="Open POs" v={openPOs.length} sub={m0(openPOs.reduce((s,p)=>s+p.total,0))} accent='#2A6CB8' />
                  <KPI k="In transit" v={inTransitPOs.length} sub={m0(inTransitValue)} accent={AMBER} />
                  <KPI k="Bills outstanding" v={m0(unpaidBills)} sub={`${bills.filter(p=>!p.billPaid).length} unpaid`} accent={RED} />
                  <KPI k="Bills paid" v={m0(bills.filter(p=>p.billPaid).reduce((s,p)=>s+p.total,0))} sub={`${bills.filter(p=>p.billPaid).length} paid`} accent={GREEN} />
                </div>

                {/* ── PURCHASE ORDERS section ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: NAVY }}>Purchase Orders</div>
                  <span style={{ fontSize: '12px', color: MUTED }}>{openPOs.length} open</span>
                </div>

                {!addingPO ? (
                  <button onClick={() => setAddingPO(true)} style={{ width: '100%', background: NAVY, color: '#fff', border: 'none', borderRadius: '11px', padding: '13px', ...btn, marginBottom: '14px', fontSize: '14px' }}>+ New Purchase Order</button>
                ) : (
                  <div style={{ ...card, marginBottom: '14px' }}>
                    <div style={{ ...lbl, marginBottom: '12px' }}>New Purchase Order</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input value={pof.supplier} onChange={e => setPof({...pof, supplier: e.target.value})} placeholder="Supplier name *" style={{ ...inp, flex: 2, minWidth: '160px', width: 'auto' }} />
                      <input value={pof.origin} onChange={e => setPof({...pof, origin: e.target.value})} placeholder="Country of origin" style={{ ...inp, flex: 1, minWidth: '130px', width: 'auto' }} />
                      <select value={pof.brand} onChange={e => setPof({...pof, brand: e.target.value})} style={{ ...inp, flex: 1, minWidth: '130px', cursor: 'pointer', width: 'auto' }}>
                        {BRANDS.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      <input value={pof.units} onChange={e => setPof({...pof, units: e.target.value})} type="number" placeholder="Units" style={{ ...inp, flex: 1, minWidth: '80px', width: 'auto' }} />
                      <input value={pof.unitCost} onChange={e => setPof({...pof, unitCost: e.target.value})} type="number" placeholder="Cost / unit $" style={{ ...inp, flex: 1, minWidth: '110px', width: 'auto' }} />
                      <input value={pof.eta} onChange={e => setPof({...pof, eta: e.target.value})} type="date" style={{ ...inp, flex: 1, minWidth: '140px', width: 'auto' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      <input value={pof.shipper} onChange={e => setPof({...pof, shipper: e.target.value})} placeholder="Shipper (e.g. DHL, FedEx)" style={{ ...inp, flex: 1, minWidth: '160px', width: 'auto' }} />
                      <input value={pof.customs} onChange={e => setPof({...pof, customs: e.target.value})} placeholder="Customs broker (optional)" style={{ ...inp, flex: 1, minWidth: '160px', width: 'auto' }} />
                    </div>
                    <input value={pof.notes} onChange={e => setPof({...pof, notes: e.target.value})} placeholder="Notes (optional)" style={{ ...inp, marginTop: '8px' }} />
                    {pof.units && pof.unitCost && <div style={{ fontSize: '13px', color: MUTED, margin: '8px 0 0' }}>Total: <b style={{ color: INK }}>{m0((Number(pof.units)||0)*(Number(pof.unitCost)||0))}</b></div>}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={() => setAddingPO(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                      <button onClick={addPO} style={{ flex: 2, background: NAVY, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', ...btn }}>Create PO</button>
                    </div>
                  </div>
                )}

                {openPOs.length === 0 && <div style={{ ...card, padding: '28px', textAlign: 'center', color: MUTED, marginBottom: '14px' }}>No open purchase orders.</div>}
                {openPOs.map(p => POCard(p))}

                {/* ── BILLS section ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '28px 0 12px', paddingTop: '24px', borderTop: `2px solid ${BORDER}` }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: NAVY }}>Bills</div>
                  <span style={{ fontSize: '12px', color: MUTED }}>{bills.length} bill{bills.length !== 1 ? 's' : ''} · {m0(totalBilled)} total</span>
                </div>

                {bills.length === 0 && <div style={{ ...card, padding: '28px', textAlign: 'center', color: MUTED }}>No bills yet — mark a PO as arrived to create a bill.</div>}
                {bills.map(p => {
                  const open = expanded === p.id
                  return (
                    <div key={p.id} style={{ ...card, padding: 0, marginBottom: '12px', overflow: 'hidden', borderColor: open ? NAVY : (p.billPaid ? BORDER : '#E7C3B8') }}>
                      <div onClick={() => setExpanded(open ? null : p.id)} style={{ padding: '15px 18px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ ...big, fontSize: '16px', color: NAVY }}>{p.billNo}</span>
                              <span style={{ fontSize: '11px', color: MUTED, fontFamily: MONO }}>from {p.poNo}</span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: p.billPaid ? GREEN : RED, background: p.billPaid ? '#E7F4EC' : '#FBEDE9', padding: '3px 10px', borderRadius: '20px' }}>
                                {p.billPaid ? 'Paid ✓' : 'Unpaid'}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: INK, fontWeight: 600, marginTop: '5px' }}>{p.brand} <span style={{ fontWeight: 400, color: MUTED }}>· {p.units} units · {p.supplier}{p.origin ? ` (${p.origin})` : ''}</span></div>
                            <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>Arrived {fmtD(p.eta)} · {money(p.unitCost)}/unit</div>
                            {(p.shipper || p.customs) && <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>{p.shipper ? `✈ ${p.shipper}` : ''}{p.shipper && p.customs ? ' · ' : ''}{p.customs ? `🛃 ${p.customs}` : ''}</div>}
                            {(p.landedCosts||[]).length > 0 && <div style={{ fontSize: '12px', marginTop: '4px', color: AMBER, fontWeight: 600 }}>{money(p.unitCost)}/unit → {money(totalCostPerUnit(p))}/unit landed</div>}
                          </div>
                          <div style={{ ...big, fontSize: '20px', color: p.billPaid ? GREEN : RED, flexShrink: 0 }}>{m0(p.total)}</div>
                        </div>
                      </div>
                      {open && !p.billPaid && (
                        <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${CREAM}` }}>
                          <button onClick={() => { markBillPaid(p.id); setExpanded(null) }} style={{ marginTop: '14px', background: GREEN, color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 18px', ...btn }}>✓ Mark bill paid — {m0(p.total)}</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )
          })()}

          {/* ===== INVOICES ===== */}
          {tab === 'invoices' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Total invoiced" v={m0(totalInvoiced)} sub={`${invoices.length} invoices`} accent={INK} />
                <KPI k="Collected" v={m0(totalCollected)} sub={`${invoices.filter(i=>i.paid).length} paid`} accent={GREEN} />
                <KPI k="Outstanding" v={m0(totalOutstanding)} sub={`${invoices.filter(i=>!i.paid).length} unpaid`} accent={AMBER} />
              </div>

              {!addingInv ? (
                <button onClick={() => setAddingInv(true)} style={{ width: '100%', background: NAVY, color: '#fff', border: 'none', borderRadius: '11px', padding: '13px', ...btn, marginBottom: '16px', fontSize: '14px' }}>+ New Invoice</button>
              ) : (
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ ...lbl, marginBottom: '12px' }}>New Invoice</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={invf.customer} onChange={e => setInvf({...invf, customer: e.target.value})} placeholder="Customer / store *" style={{ ...inp, flex: 2, minWidth: '160px', width: 'auto' }} />
                    <select value={invf.brand} onChange={e => setInvf({...invf, brand: e.target.value})} style={{ ...inp, flex: 1, minWidth: '130px', cursor: 'pointer', width: 'auto' }}>
                      {BRANDS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <input value={invf.units} onChange={e => setInvf({...invf, units: e.target.value})} type="number" placeholder="Units" style={{ ...inp, flex: 1, minWidth: '80px', width: 'auto' }} />
                    <input value={invf.unitPrice} onChange={e => setInvf({...invf, unitPrice: e.target.value})} type="number" placeholder="Price / unit $" style={{ ...inp, flex: 1, minWidth: '110px', width: 'auto' }} />
                    <input value={invf.due} onChange={e => setInvf({...invf, due: e.target.value})} type="date" placeholder="Due date" style={{ ...inp, flex: 1, minWidth: '140px', width: 'auto' }} />
                  </div>
                  <input value={invf.notes} onChange={e => setInvf({...invf, notes: e.target.value})} placeholder="Notes (optional)" style={{ ...inp, marginTop: '8px' }} />
                  {invf.units && invf.unitPrice && <div style={{ fontSize: '13px', color: MUTED, margin: '8px 0 0' }}>Invoice total: <b style={{ color: INK }}>{m0((Number(invf.units)||0)*(Number(invf.unitPrice)||0))}</b></div>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setAddingInv(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '11px', ...btn, color: MUTED }}>Cancel</button>
                    <button onClick={addInv} style={{ flex: 2, background: NAVY, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', ...btn }}>Create Invoice</button>
                  </div>
                </div>
              )}

              {invoices.map(inv => {
                const open = expanded === inv.id
                const overdue = !inv.paid && inv.due && new Date(inv.due) < new Date()
                return (
                  <div key={inv.id} style={{ ...card, padding: 0, marginBottom: '12px', overflow: 'hidden', borderColor: open ? NAVY : (overdue ? '#E7C3B8' : BORDER) }}>
                    <div onClick={() => setExpanded(open ? null : inv.id)} style={{ padding: '15px 18px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ ...big, fontSize: '16px', color: NAVY }}>{inv.invNo}</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: inv.paid ? GREEN : (overdue ? RED : AMBER), background: inv.paid ? '#E7F4EC' : (overdue ? '#FBEDE9' : '#FBF1DD'), padding: '3px 10px', borderRadius: '20px' }}>
                              {inv.paid ? `Paid ${fmtD(inv.paidDate)}` : overdue ? 'Overdue' : `Due ${fmtD(inv.due)}`}
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '5px' }}>{inv.customer} <span style={{ fontWeight: 400, color: MUTED }}>· {inv.brand}{inv.units ? ` · ${inv.units} units` : ''}</span></div>
                          {inv.notes && <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{inv.notes}</div>}
                        </div>
                        <div style={{ ...big, fontSize: '20px', color: inv.paid ? GREEN : INK, flexShrink: 0 }}>{m0(inv.total)}</div>
                      </div>
                    </div>
                    {open && !inv.paid && (
                      <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${CREAM}` }}>
                        <button onClick={() => { markInvPaid(inv.id); setExpanded(null) }} style={{ marginTop: '14px', background: GREEN, color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 18px', ...btn }}>✓ Mark as paid ({m0(inv.total)})</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* ===== P&L ===== */}
          {tab === 'pnl' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Revenue" v={m0(totalInvoiced)} sub="total invoiced" accent={GREEN} />
                <KPI k="Cost of goods" v={m0(totalBilled)} sub="from arrived POs" accent={RED} />
                <KPI k="Gross profit" v={m0(grossProfit)} sub={`${margin}% margin`} accent={grossProfit >= 0 ? GREEN : RED} />
              </div>

              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...lbl, marginBottom: '14px' }}>Profit &amp; loss — all time</div>
                {[
                  { l: 'Total invoiced (revenue)', v: m0(totalInvoiced), bold: false },
                  { l: 'Cost of goods (arrived POs)', v: `−${m0(totalBilled)}`, bold: false },
                  { l: `Gross profit  ·  ${margin}% margin`, v: m0(grossProfit), bold: true, neg: grossProfit < 0 },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: r.bold ? `1px solid ${BORDER}` : (i ? `1px solid ${CREAM}` : 'none') }}>
                    <span style={{ fontSize: '13px', color: r.bold ? INK : MUTED, fontWeight: r.bold ? 600 : 400 }}>{r.l}</span>
                    <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: r.bold ? 600 : 400, color: r.neg ? RED : (r.bold ? INK : MUTED) }}>{r.v}</span>
                  </div>
                ))}
              </div>

              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap', marginBottom:'14px' }}>
                  <span style={{ ...lbl }}>Date range</span>
                  <select value={rA} onChange={e=>{const v=Number(e.target.value); setRngStart(v); if(v>rB) setRngEnd(v)}} style={{ padding:'7px 10px', border:`1px solid ${BORDER}`, borderRadius:'4px', fontFamily:MONO, fontSize:'13px', cursor:'pointer', background:'#fff', color:INK }}>
                    {MONTH_PL.map((m,i)=><option key={i} value={i}>{m.m}</option>)}
                  </select>
                  <span style={{ fontSize:'12px', color:MUTED }}>to</span>
                  <select value={rB} onChange={e=>{const v=Number(e.target.value); setRngEnd(v); if(v<rA) setRngStart(v)}} style={{ padding:'7px 10px', border:`1px solid ${BORDER}`, borderRadius:'4px', fontFamily:MONO, fontSize:'13px', cursor:'pointer', background:'#fff', color:INK }}>
                    {MONTH_PL.map((m,i)=><option key={i} value={i}>{m.m}</option>)}
                  </select>
                  <span style={{ fontSize:'13px', color:MUTED }}>{rCount} month{rCount>1?'s':''} combined</span>
                </div>
                <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                  <KPI k={`Revenue · ${rLabel}`} v={m0(rRev)} sub={`${rCount} months combined`} accent={GREEN} />
                  <KPI k="Cost of goods" v={m0(rCogs)} sub="landed cost" accent={RED} />
                  <KPI k="Gross profit" v={m0(rGp)} sub={rRev?Math.round(rGp/rRev*100)+'% margin':'—'} accent={rGp>=0?GREEN:RED} />
                </div>
              </div>

              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...lbl, marginBottom: '12px' }}>P&amp;L — month by month</div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'480px' }}>
                    <thead><tr style={{ borderBottom:`2px solid ${BORDER}` }}>
                      {['Month','Revenue','COGS','Gross Profit','Margin'].map(h=>(
                        <th key={h} style={{ padding:'8px 10px', textAlign:h==='Month'?'left':'right', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:MUTED }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{[...MONTH_PL].reverse().map((m,i)=>{ const gp=m.rev-m.cogs; return (
                      <tr key={m.m} style={{ borderTop:i?`1px solid ${CREAM}`:'none' }}>
                        <td style={{ padding:'9px 10px', fontWeight:600 }}>{m.m}</td>
                        <td style={{ padding:'9px 10px', textAlign:'right', fontFamily:MONO }}>{m0(m.rev)}</td>
                        <td style={{ padding:'9px 10px', textAlign:'right', fontFamily:MONO, color:MUTED }}>{m0(m.cogs)}</td>
                        <td style={{ padding:'9px 10px', textAlign:'right', fontFamily:MONO, fontWeight:600, color:GREEN }}>{m0(gp)}</td>
                        <td style={{ padding:'9px 10px', textAlign:'right', fontWeight:600, color:MUTED }}>{m.rev?Math.round(gp/m.rev*100)+'%':'—'}</td>
                      </tr>
                    )})}</tbody>
                    <tfoot><tr style={{ borderTop:`2px solid ${BORDER}` }}>
                      <td style={{ padding:'9px 10px', fontWeight:700 }}>YTD Total</td>
                      <td style={{ padding:'9px 10px', textAlign:'right', fontFamily:MONO, fontWeight:700 }}>{m0(ytdRevM)}</td>
                      <td style={{ padding:'9px 10px', textAlign:'right', fontFamily:MONO, color:MUTED }}>{m0(ytdCogsM)}</td>
                      <td style={{ padding:'9px 10px', textAlign:'right', fontFamily:MONO, fontWeight:700, color:GREEN }}>{m0(ytdRevM-ytdCogsM)}</td>
                      <td style={{ padding:'9px 10px', textAlign:'right', fontWeight:700, color:MUTED }}>{ytdRevM?Math.round((ytdRevM-ytdCogsM)/ytdRevM*100)+'%':'—'}</td>
                    </tr></tfoot>
                  </table>
                </div>
              </div>

              <div style={{ ...card }}>
                <div style={{ ...lbl, marginBottom: '12px' }}>By brand</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '500px' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                        {['Brand', 'Units Bought', 'Cost', 'Units Sold', 'Revenue', 'Profit', 'Margin'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Brand' ? 'left' : 'right', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: MUTED }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {brandPnl.sort((a,b) => b.rev - a.rev).map((b, i) => {
                        const m = b.rev ? Math.round(b.profit/b.rev*100) : 0
                        return (
                          <tr key={b.brand} style={{ borderTop: i ? `1px solid ${CREAM}` : 'none' }}>
                            <td style={{ padding: '9px 10px', fontWeight: 600 }}>{b.brand}</td>
                            <td style={{ padding: '9px 10px', textAlign: 'right', color: MUTED }}>{b.units_bought}</td>
                            <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: MONO, color: RED }}>{m0(b.cost)}</td>
                            <td style={{ padding: '9px 10px', textAlign: 'right', color: MUTED }}>{b.units_sold}</td>
                            <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: MONO, color: GREEN }}>{m0(b.rev)}</td>
                            <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: MONO, fontWeight: 600, color: b.profit >= 0 ? GREEN : RED }}>{m0(b.profit)}</td>
                            <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 600, color: m >= 30 ? GREEN : m >= 0 ? AMBER : RED }}>{b.rev ? m+'%' : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ===== QUICKBOOKS ===== */}
          {tab === 'quickbooks' && (
            <>
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#2CA01C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...big, fontSize: '17px' }}>QB</div>
                  <div>
                    <div style={{ ...big, fontSize: '18px' }}>Export to QuickBooks</div>
                    <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '2px' }}>Bills + invoices, ready to import.</div>
                  </div>
                </div>
                <p style={{ fontSize: '13.5px', color: MUTED, lineHeight: 1.6 }}>Every bill (from arrived purchase orders) and every invoice (your sales) in one clean export. Drop it in QuickBooks and your books are current. No manual entry, no double work.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Bills to post" v={arrivedPOs.length} sub={m0(totalBilled)} accent={RED} />
                <KPI k="Invoices to post" v={invoices.length} sub={m0(totalInvoiced)} accent={GREEN} />
                <KPI k="Unpaid bills" v={m0(unpaidBills)} sub="owed to suppliers" accent={AMBER} />
                <KPI k="Outstanding invoices" v={m0(totalOutstanding)} sub="owed to you" accent={AMBER} />
              </div>

              <div style={{ ...card, marginBottom: '12px' }}>
                <div style={{ ...lbl, marginBottom: '10px' }}>Bills (from purchase orders)</div>
                {arrivedPOs.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i ? `1px solid ${CREAM}` : 'none', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontFamily: MONO, fontSize: '12px', color: NAVY, fontWeight: 600 }}>{p.billNo}</span>
                      <span style={{ fontSize: '13px', color: INK, marginLeft: '10px' }}>{p.supplier} · {p.brand}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 600, color: p.billPaid ? GREEN : RED }}>{m0(p.total)}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: p.billPaid ? GREEN : RED }}>{p.billPaid ? 'Paid' : 'Unpaid'}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...lbl, marginBottom: '10px' }}>Invoices (your sales)</div>
                {invoices.filter(i => i.total > 0).map((inv, i) => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i ? `1px solid ${CREAM}` : 'none', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontFamily: MONO, fontSize: '12px', color: NAVY, fontWeight: 600 }}>{inv.invNo}</span>
                      <span style={{ fontSize: '13px', color: INK, marginLeft: '10px' }}>{inv.customer} · {inv.brand}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 600, color: inv.paid ? GREEN : AMBER }}>{m0(inv.total)}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: inv.paid ? GREEN : AMBER }}>{inv.paid ? 'Paid' : 'Outstanding'}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={exportQB} style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: '11px', padding: '14px 24px', ...btn, fontSize: '14px' }}>⤓ Export all for QuickBooks (CSV)</button>
            </>
          )}

        </main>
      </div>
    </>
  )
}

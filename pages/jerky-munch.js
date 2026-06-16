import { useState } from 'react'
import Head from 'next/head'

const CHAR = '#2B2018', SPICE = '#C8462C', KRAFT = '#A9763A', CREAM = '#F6F0E6'
const INK = '#2B2018', MUTED = '#8A7A66', GREEN = '#3E7C4F', BORDER = '#E6DBC8', AMBER = '#C98A2A', RED = '#C03A22'
const BIZ = 'Jerky Munch'

const money = (n) => '$' + (Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const m0 = (n) => '$' + Math.round(n).toLocaleString()
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
  { id: uid(), who: 'Online store (Shopify)', units: 120, rev: 1188 },
  { id: uid(), who: 'Farmers Market — Toms River', units: 45, rev: 405 },
  { id: uid(), who: 'Acme Corp — office bulk order', units: 60, rev: 480 },
  { id: uid(), who: 'Gym pop-up weekend', units: 30, rev: 270 },
]

const SEED_ADS = [
  { id: uid(), channel: 'Instagram Ads', spend: 600, rev: 2400 },
  { id: uid(), channel: 'Influencer — @njfoodie', spend: 400, rev: 1600 },
  { id: uid(), channel: 'Google Search', spend: 300, rev: 900 },
  { id: uid(), channel: 'Facebook Ads', spend: 450, rev: 180 },
  { id: uid(), channel: 'Local 5K Sponsorship', spend: 250, rev: 150 },
  { id: uid(), channel: 'Flyers / print', spend: 120, rev: 90 },
]
const DIAGNOSES = ['', 'Sold but not reported (store owes me)', 'Theft / shrinkage', 'Damaged or expired', 'Free samples given out', 'Miscount — recount needed', 'Unknown — investigating']
const verdict = (roas) => roas >= 2 ? { c: GREEN, t: '🟢 SCALE IT' } : roas >= 1 ? { c: AMBER, t: '🟡 WATCH' } : { c: RED, t: '🔴 CUT IT' }

export default function JerkyMunch() {
  const [tab, setTab] = useState('overview')
  const [consign, setConsign] = useState(SEED_CONSIGN)
  const [direct, setDirect] = useState(SEED_DIRECT)
  const [ads, setAds] = useState(SEED_ADS)
  const [expanded, setExpanded] = useState(null)
  const [draft, setDraft] = useState({})
  const [adding, setAdding] = useState(false)
  const [cf, setCf] = useState({ store: '', price: '', sent: '' })

  const dv = (k) => draft[k] || ''
  const setDv = (k, v) => setDraft({ ...draft, [k]: v })
  const upd = (id, patch, logEntry) => setConsign(consign.map(c => c.id === id
    ? { ...c, ...patch, log: logEntry ? [{ at: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }), t: logEntry }, ...(c.log || [])] : c.log } : c))

  const logCheck = (id) => { const a = Number(dv(id + '_chk')); if (a > 0) { const c = consign.find(x => x.id === id); upd(id, { paid: c.paid + a }, `Check received ${m0(a)}`); setDv(id + '_chk', '') } }
  const logCount = (id) => { const n = dv(id + '_cnt'); if (n !== '') { upd(id, { counted: Number(n), countedDate: todayStr }, `Counted ${n} on shelf`); setDv(id + '_cnt', '') } }
  const shipMore = (id) => { const n = Number(dv(id + '_shp')); if (n > 0) { const c = consign.find(x => x.id === id); upd(id, { sent: c.sent + n }, `Shipped ${n} more units`); setDv(id + '_shp', '') } }
  const addPartner = () => { if (!cf.store.trim()) return; setConsign([{ id: uid(), store: cf.store.trim(), price: Number(cf.price) || 0, sent: Number(cf.sent) || 0, returned: 0, paid: 0, counted: null, countedDate: '', diagnosis: '', log: [{ at: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }), t: 'Added consignment partner' }] }, ...consign]); setCf({ store: '', price: '', sent: '' }); setAdding(false) }

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

  const card = { background: '#FFFDF9', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px' }
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#B3A488' }
  const inp = { padding: '10px 12px', fontSize: '14px', border: `1px solid ${BORDER}`, borderRadius: '9px', background: CREAM, color: INK, outline: 'none' }
  const big = { fontFamily: 'Oswald, sans-serif', fontWeight: 600 }

  const KPI = ({ k, v, sub, accent }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px', padding: '15px 17px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...big, fontSize: '29px', color: accent || INK, lineHeight: 1.15, marginTop: '3px' }}>{v}</div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#BFB096', marginTop: '2px' }}>{sub}</div>
    </div>
  )
  const Row = ({ l, v, neg, bold, top }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: top ? `1px solid ${BORDER}` : 'none' }}>
      <span style={{ fontSize: '13px', color: bold ? INK : MUTED, fontWeight: bold ? 600 : 400 }}>{l}</span>
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: neg ? RED : (bold ? INK : MUTED), fontWeight: bold ? 600 : 400 }}>{v}</span>
    </div>
  )

  const TABS = [['overview', 'Overview'], ['consign', 'Consignment'], ['direct', 'Direct Sales'], ['ads', 'Advertising']]

  return (
    <>
      <Head>
        <title>{BIZ} — Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${CREAM};font-family:'DM Sans',sans-serif}::placeholder{color:#BFB096}`}</style>
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
              <KPI k="AVG $ / UNIT" v={money(directRev / directUnits)} sub="vs ~$6.3 consignment" accent={SPICE} />
            </div>
            <p style={{ fontSize: '13px', color: MUTED, marginBottom: '14px', lineHeight: 1.5 }}>
              Direct sales clear at a <b style={{ color: INK }}>higher margin</b> than consignment — no store cut, paid on the spot. Worth seeing side-by-side so you know where to push.
            </p>
            {direct.map(d => (
              <div key={d.id} style={{ ...card, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ ...big, fontSize: '18px', color: INK }}>{d.who}</div>
                  <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{d.units} units · {money(d.rev / d.units)}/unit</div>
                </div>
                <div style={{ ...big, fontSize: '22px', color: GREEN }}>{m0(d.rev)}</div>
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
            {ads.slice().sort((a, b) => (b.rev / b.spend) - (a.rev / a.spend)).map(a => {
              const roas = a.rev / a.spend, vd = verdict(roas)
              return (
                <div key={a.id} style={{ ...card, marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ ...big, fontSize: '18px', color: INK }}>{a.channel}</div>
                      <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>{m0(a.spend)} spent → {m0(a.rev)} back · <b style={{ color: vd.c }}>{roas.toFixed(1)}x</b></div>
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

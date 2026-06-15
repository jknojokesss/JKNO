import { useState, Fragment } from 'react'
import Head from 'next/head'

// ─────────────────────────────────────────────────────────────────────────
// Bespoke sample dashboard for "Bear & Wolf" (business brokers — buy & broker
// out businesses). Deal desk: track listings, the sellers behind them, the buyer
// network, and match potential buyers to each deal. Interactive sample by JK.
// ─────────────────────────────────────────────────────────────────────────

const BLACK = '#16191C', GREEN = '#1FA463', DGREEN = '#157A49', BG = '#EFF2F0'
const INK = '#161A18', MUTED = '#5C6B64', FAINT = '#9BA8A1', CARD = '#FFFFFF', RED = '#C0492F'
const BOOK = 'https://calendly.com/jk-jknojokes/30min'
const BIZ = 'Bear & Wolf'

const usd0 = (n) => '$' + Math.round(Math.abs(n)).toLocaleString('en-US')

const STAGES = [
  { v: 'sourcing', l: 'Sourcing' },
  { v: 'listed', l: 'Listed' },
  { v: 'loi', l: 'Under LOI' },
  { v: 'dd', l: 'Due Diligence' },
  { v: 'closing', l: 'Closing' },
  { v: 'sold', l: 'Sold' },
]
const STAGE_STYLE = {
  sourcing: ['#E7ECEA', '#6E8278'],
  listed: ['#E1ECF5', '#2C6E9B'],
  loi: ['#FBEBD6', '#C77D2B'],
  dd: ['#ECE4F6', '#6B4FA0'],
  closing: ['#D7F0E5', DGREEN],
  sold: [BLACK, '#5FE3A0'],
}

const SEED_BUYERS = [
  { id: 1, name: 'Sterling Equity Partners', type: 'PE firm', want: 'HVAC / home services', budget: '$2M–$8M', contact: 'deals@sterlingeq.com' },
  { id: 2, name: 'Mark Feldman', type: 'Individual', want: 'Restaurants / food', budget: '$300k–$900k', contact: '(917) 555-0144' },
  { id: 3, name: 'Apex Holdings', type: 'Strategic', want: 'Logistics / distribution', budget: '$5M+', contact: 'bd@apexhold.com' },
  { id: 4, name: 'Dana Brooks', type: 'Individual', want: 'E-comm / retail', budget: '$500k–$1.5M', contact: 'dana.brooks@gmail.com' },
  { id: 5, name: 'Riverside Capital', type: 'PE firm', want: 'Manufacturing / logistics', budget: '$3M–$12M', contact: '(312) 555-0190' },
]
const SEED_SELLERS = [
  { id: 1, name: 'Joe Mancini', business: 'Mancini HVAC', contact: '(732) 555-0112', asking: 3200000, motivation: 'Retiring' },
  { id: 2, name: 'Lena Park', business: "Park's Dumpling House", contact: 'lena@parkdumpling.com', asking: 650000, motivation: 'Relocating' },
  { id: 3, name: 'Carlos Vega', business: 'Vega Freight Lines', contact: '(201) 555-0178', asking: 6800000, motivation: 'Next venture' },
  { id: 4, name: 'Susan Cole', business: 'Cole Boutique Group', contact: 'susan@coleboutique.com', asking: 950000, motivation: 'Burnout' },
]
const SEED_DEALS = [
  { id: 1, business: 'Mancini HVAC', industry: 'Home services', seller: 'Joe Mancini', asking: 3200000, stage: 'loi', fee: 8, buyers: [1] },
  { id: 2, business: "Park's Dumpling House", industry: 'Restaurant', seller: 'Lena Park', asking: 650000, stage: 'listed', fee: 10, buyers: [2] },
  { id: 3, business: 'Vega Freight Lines', industry: 'Logistics', seller: 'Carlos Vega', asking: 6800000, stage: 'dd', fee: 6, buyers: [3, 5] },
  { id: 4, business: 'Cole Boutique Group', industry: 'Retail / e-comm', seller: 'Susan Cole', asking: 950000, stage: 'sourcing', fee: 9, buyers: [4] },
]
const feeOf = (d) => d.asking * (d.fee || 0) / 100

export default function BearWolf() {
  const [tab, setTab] = useState('deals')
  const [deals, setDeals] = useState(SEED_DEALS)
  const [buyers, setBuyers] = useState(SEED_BUYERS)
  const [sellers, setSellers] = useState(SEED_SELLERS)
  const [expanded, setExpanded] = useState(null)
  const [pick, setPick] = useState('')
  const [adding, setAdding] = useState('') // '', 'deal', 'buyer', 'seller'
  const [df, setDf] = useState({ business: '', industry: '', seller: '', asking: '', fee: '', stage: 'sourcing' })
  const [bf, setBf] = useState({ name: '', type: 'Individual', want: '', budget: '', contact: '' })
  const [sf, setSf] = useState({ name: '', business: '', contact: '', asking: '', motivation: '' })

  const setStage = (id, stage) => setDeals((p) => p.map((d) => (d.id === id ? { ...d, stage } : d)))
  const addBuyerToDeal = (id, bid) => { if (!bid) return; setDeals((p) => p.map((d) => (d.id === id ? { ...d, buyers: [...d.buyers, Number(bid)] } : d))); setPick('') }
  const removeBuyer = (id, bid) => setDeals((p) => p.map((d) => (d.id === id ? { ...d, buyers: d.buyers.filter((x) => x !== bid) } : d)))
  const addDeal = () => { if (!df.business || !df.asking) return; setDeals([{ id: Date.now(), business: df.business, industry: df.industry, seller: df.seller, asking: Number(df.asking), fee: Number(df.fee || 0), stage: df.stage, buyers: [] }, ...deals]); setDf({ business: '', industry: '', seller: '', asking: '', fee: '', stage: 'sourcing' }); setAdding('') }
  const addBuyer = () => { if (!bf.name) return; setBuyers([{ id: Date.now(), ...bf }, ...buyers]); setBf({ name: '', type: 'Individual', want: '', budget: '', contact: '' }); setAdding('') }
  const addSeller = () => { if (!sf.name) return; setSellers([{ id: Date.now(), name: sf.name, business: sf.business, contact: sf.contact, asking: Number(sf.asking || 0), motivation: sf.motivation }, ...sellers]); setSf({ name: '', business: '', contact: '', asking: '', motivation: '' }); setAdding('') }

  const active = deals.filter((d) => d.stage !== 'sold')
  const sold = deals.filter((d) => d.stage === 'sold')
  const dealValue = active.reduce((s, d) => s + d.asking, 0)
  const projFees = active.reduce((s, d) => s + feeOf(d), 0)
  const earnedFees = sold.reduce((s, d) => s + feeOf(d), 0)

  const tabs = [{ id: 'deals', label: 'Deals' }, { id: 'buyers', label: 'Buyers' }, { id: 'sellers', label: 'Sellers' }, { id: 'fees', label: 'Fees' }]
  const serif = { fontFamily: 'Cormorant Garamond, serif' }
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '1.5px', color: FAINT }
  const card = { background: CARD, border: '1px solid #DBE2DF', borderRadius: '6px', padding: '16px' }
  const th = { fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '1px', color: FAINT, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #E4EAE7' }
  const td = { fontSize: '12px', color: INK, padding: '9px 10px', borderBottom: '1px solid #EEF2F0', verticalAlign: 'middle' }
  const inp = { width: '100%', padding: '9px 10px', fontSize: '13px', fontFamily: "'DM Sans',sans-serif", border: '1px solid #CCD8D3', borderRadius: '5px', background: '#fff', color: INK, outline: 'none' }

  const Kpi = ({ k, v, sub, color }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: INK, lineHeight: 1.1, marginTop: '4px' }}>{v}</div>
      {sub && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: color || MUTED, marginTop: '4px' }}>{sub}</div>}
    </div>
  )
  const StageSel = ({ d }) => (
    <select value={d.stage} onChange={(e) => setStage(d.id, e.target.value)} style={{ background: STAGE_STYLE[d.stage][0], color: STAGE_STYLE[d.stage][1], border: 'none', borderRadius: '3px', fontFamily: 'DM Mono, monospace', fontSize: '10px', padding: '4px 6px', cursor: 'pointer' }}>
      {STAGES.map((s) => <option key={s.v} value={s.v} style={{ background: '#fff', color: INK }}>{s.l}</option>)}
    </select>
  )
  const addBtn = (key) => ({ background: adding === key ? '#E2EAE7' : GREEN, color: adding === key ? MUTED : '#fff', border: 'none', borderRadius: '5px', padding: '9px 14px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' })
  const saveBtn = { background: BLACK, color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', marginTop: '12px' }

  return (
    <>
      <Head>
        <title>{BIZ} — Deal Desk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${BG};font-family:'DM Sans',sans-serif}
          .bw-tabs::-webkit-scrollbar{display:none}.bw-tabs{scrollbar-width:none}::placeholder{color:#A6B2AC}`}</style>
      </Head>

      <div style={{ background: GREEN, color: BLACK, textAlign: 'center', padding: '8px 16px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px' }}>
        SAMPLE DASHBOARD · built for {BIZ} by JK No Jokes Financials
      </div>

      <div style={{ background: BLACK }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 18px 0', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🐺</span>
            <span style={{ ...serif, fontSize: '20px', fontWeight: 700, color: '#fff' }}>{BIZ}</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '2px', color: GREEN }}>DEAL DESK</span>
          </div>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: GREEN, color: BLACK, textDecoration: 'none', borderRadius: '4px', padding: '7px 12px', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px', whiteSpace: 'nowrap' }}>BUILT BY JK →</a>
        </div>
        <nav className="bw-tabs" style={{ display: 'flex', gap: '4px', padding: '0 18px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.12)', marginTop: '8px' }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 12px', background: 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === t.id ? '#fff' : '#7D8A84', fontSize: '11px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em',
              borderBottom: tab === t.id ? `2px solid ${GREEN}` : '2px solid transparent', marginBottom: '-1px',
            }}>{t.label}</button>
          ))}
        </nav>
      </div>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* DEALS */}
        {tab === 'deals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="ACTIVE DEALS" v={active.length} sub="In the pipeline" />
              <Kpi k="DEAL VALUE" v={usd0(dealValue)} sub="Combined asking" />
              <Kpi k="BUYERS IN NETWORK" v={buyers.length} sub="Ready to match" color={GREEN} />
              <Kpi k="PROJECTED FEES" v={usd0(projFees)} sub="If they close" color={GREEN} />
            </div>

            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <div><div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>Deal pipeline</div><div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED }}>Tap a deal to match potential buyers · change stage with the dropdown</div></div>
                <button onClick={() => setAdding(adding === 'deal' ? '' : 'deal')} style={addBtn('deal')}>{adding === 'deal' ? '✕ CANCEL' : '+ NEW DEAL'}</button>
              </div>
              {adding === 'deal' && (
                <div style={{ background: '#F5F8F6', border: '1px dashed #CCD8D3', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                    <input style={inp} placeholder="Business name" value={df.business} onChange={(e) => setDf({ ...df, business: e.target.value })} />
                    <input style={inp} placeholder="Industry" value={df.industry} onChange={(e) => setDf({ ...df, industry: e.target.value })} />
                    <input style={inp} placeholder="Seller" value={df.seller} onChange={(e) => setDf({ ...df, seller: e.target.value })} />
                    <input style={inp} type="number" placeholder="Asking price $" value={df.asking} onChange={(e) => setDf({ ...df, asking: e.target.value })} />
                    <input style={inp} type="number" step="0.1" placeholder="Your fee %" value={df.fee} onChange={(e) => setDf({ ...df, fee: e.target.value })} />
                    <select style={inp} value={df.stage} onChange={(e) => setDf({ ...df, stage: e.target.value })}>{STAGES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select>
                  </div>
                  <button onClick={addDeal} style={saveBtn}>ADD DEAL →</button>
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                  <thead><tr>{['BUSINESS', 'SELLER', 'ASKING', 'STAGE', 'BUYERS', 'FEE'].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 2 || i === 5 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {deals.map((d) => {
                      const isOpen = expanded === d.id
                      const matched = d.buyers.map((id) => buyers.find((b) => b.id === id)).filter(Boolean)
                      const available = buyers.filter((b) => !d.buyers.includes(b.id))
                      return (
                        <Fragment key={d.id}>
                          <tr>
                            <td style={{ ...td, cursor: 'pointer' }} onClick={() => { setExpanded(isOpen ? null : d.id); setPick('') }}>
                              <div style={{ fontWeight: 600 }}><span style={{ color: GREEN, marginRight: '4px' }}>{isOpen ? '▾' : '▸'}</span>{d.business}</div>
                              <div style={{ color: MUTED, fontSize: '11px', paddingLeft: '14px' }}>{d.industry}</div>
                            </td>
                            <td style={{ ...td, color: MUTED }}>{d.seller}</td>
                            <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{usd0(d.asking)}</td>
                            <td style={td}><StageSel d={d} /></td>
                            <td style={{ ...td, fontFamily: 'DM Mono, monospace' }}>{matched.length} matched</td>
                            <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', color: d.stage === 'sold' ? DGREEN : MUTED, fontWeight: d.stage === 'sold' ? 600 : 400 }}>{usd0(feeOf(d))}</td>
                          </tr>
                          {isOpen && (
                            <tr>
                              <td colSpan={6} style={{ padding: '0 10px 14px', background: '#F5F8F6' }}>
                                <div style={{ padding: '12px 14px', border: '1px solid #E4EAE7', borderRadius: '6px', background: '#fff' }}>
                                  <div style={{ ...lbl, marginBottom: '8px' }}>POTENTIAL BUYERS FOR {d.business.toUpperCase()}</div>
                                  {matched.length === 0 && <div style={{ fontSize: '12px', color: MUTED, padding: '2px 0 8px' }}>No buyers matched yet — add one below.</div>}
                                  {matched.map((b) => (
                                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid #EEF2F0' }}>
                                      <span style={{ fontSize: '12px', color: INK }}><span style={{ fontWeight: 600 }}>{b.name}</span> <span style={{ color: MUTED }}>· {b.type} · wants {b.want} · {b.budget}</span></span>
                                      <button onClick={() => removeBuyer(d.id, b.id)} style={{ background: 'none', border: 'none', color: RED, fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>remove</button>
                                    </div>
                                  ))}
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                    <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ ...inp, maxWidth: '320px' }}>
                                      <option value="">Match a buyer from your network…</option>
                                      {available.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.want} ({b.budget})</option>)}
                                    </select>
                                    <button onClick={() => addBuyerToDeal(d.id, pick)} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: '5px', padding: '9px 16px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>+ MATCH</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BUYERS */}
        {tab === 'buyers' && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div><div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>Buyer network</div><div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED }}>Who's looking, for what, and how much they'll spend</div></div>
              <button onClick={() => setAdding(adding === 'buyer' ? '' : 'buyer')} style={addBtn('buyer')}>{adding === 'buyer' ? '✕ CANCEL' : '+ ADD BUYER'}</button>
            </div>
            {adding === 'buyer' && (
              <div style={{ background: '#F5F8F6', border: '1px dashed #CCD8D3', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                  <input style={inp} placeholder="Buyer name / firm" value={bf.name} onChange={(e) => setBf({ ...bf, name: e.target.value })} />
                  <select style={inp} value={bf.type} onChange={(e) => setBf({ ...bf, type: e.target.value })}><option>Individual</option><option>PE firm</option><option>Strategic</option></select>
                  <input style={inp} placeholder="Looking for (industry)" value={bf.want} onChange={(e) => setBf({ ...bf, want: e.target.value })} />
                  <input style={inp} placeholder="Budget (e.g. $1M–$3M)" value={bf.budget} onChange={(e) => setBf({ ...bf, budget: e.target.value })} />
                  <input style={inp} placeholder="Contact" value={bf.contact} onChange={(e) => setBf({ ...bf, contact: e.target.value })} />
                </div>
                <button onClick={addBuyer} style={saveBtn}>ADD BUYER →</button>
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                <thead><tr>{['BUYER', 'TYPE', 'LOOKING FOR', 'BUDGET', 'CONTACT'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {buyers.map((b) => (
                    <tr key={b.id}>
                      <td style={{ ...td, fontWeight: 600 }}>{b.name}</td>
                      <td style={{ ...td, color: MUTED }}>{b.type}</td>
                      <td style={{ ...td, color: MUTED }}>{b.want}</td>
                      <td style={{ ...td, fontFamily: 'DM Mono, monospace' }}>{b.budget}</td>
                      <td style={{ ...td, color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{b.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SELLERS */}
        {tab === 'sellers' && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div><div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>Sellers</div><div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED }}>Owners who want out — what they've got and why they're selling</div></div>
              <button onClick={() => setAdding(adding === 'seller' ? '' : 'seller')} style={addBtn('seller')}>{adding === 'seller' ? '✕ CANCEL' : '+ ADD SELLER'}</button>
            </div>
            {adding === 'seller' && (
              <div style={{ background: '#F5F8F6', border: '1px dashed #CCD8D3', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                  <input style={inp} placeholder="Seller name" value={sf.name} onChange={(e) => setSf({ ...sf, name: e.target.value })} />
                  <input style={inp} placeholder="Business" value={sf.business} onChange={(e) => setSf({ ...sf, business: e.target.value })} />
                  <input style={inp} placeholder="Contact" value={sf.contact} onChange={(e) => setSf({ ...sf, contact: e.target.value })} />
                  <input style={inp} type="number" placeholder="Asking $" value={sf.asking} onChange={(e) => setSf({ ...sf, asking: e.target.value })} />
                  <input style={inp} placeholder="Why selling" value={sf.motivation} onChange={(e) => setSf({ ...sf, motivation: e.target.value })} />
                </div>
                <button onClick={addSeller} style={saveBtn}>ADD SELLER →</button>
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                <thead><tr>{['SELLER', 'BUSINESS', 'ASKING', 'WHY SELLING', 'CONTACT'].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 2 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {sellers.map((s) => (
                    <tr key={s.id}>
                      <td style={{ ...td, fontWeight: 600 }}>{s.name}</td>
                      <td style={{ ...td, color: MUTED }}>{s.business}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{s.asking ? usd0(s.asking) : '—'}</td>
                      <td style={{ ...td, color: MUTED }}>{s.motivation}</td>
                      <td style={{ ...td, color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{s.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FEES */}
        {tab === 'fees' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="EARNED (CLOSED)" v={usd0(earnedFees)} sub={`${sold.length} deals closed`} color={GREEN} />
              <Kpi k="PROJECTED (PIPELINE)" v={usd0(projFees)} sub={`${active.length} in flight`} />
              <Kpi k="TOTAL POTENTIAL" v={usd0(earnedFees + projFees)} sub="earned + pipeline" color={GREEN} />
            </div>
            <div style={card}>
              <div style={{ ...lbl, marginBottom: '8px' }}>FEE PER DEAL</div>
              {deals.map((d) => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EEF2F0' }}>
                  <span style={{ fontSize: '13px', color: INK }}><span style={{ fontWeight: 600 }}>{d.business}</span> <span style={{ color: MUTED }}>· {usd0(d.asking)} @ {d.fee}%</span></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StageSel d={d} />
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: d.stage === 'sold' ? GREEN : MUTED, fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>{usd0(feeOf(d))}</span>
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px', fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ color: MUTED }}>Total potential:</span><span style={{ color: GREEN }}>{usd0(earnedFees + projFees)}</span>
              </div>
            </div>
          </div>
        )}

        {/* CTA — referral angle */}
        <div style={{ marginTop: '28px', textAlign: 'center', background: BLACK, borderRadius: '10px', padding: '32px' }}>
          <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: '#fff' }}>Deals die in due diligence over messy books.</div>
          <p style={{ color: '#A6B2AC', fontSize: '14px', margin: '8px auto 18px', maxWidth: '500px', lineHeight: 1.6 }}>
            I built this for you. I also get businesses <span style={{ color: GREEN }}>sale-ready</span> — clean books and clear financials so your deals survive due diligence and close. Bring me your sellers; I'll send you buyers who need a business.
          </p>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: GREEN, color: BLACK, textDecoration: 'none', padding: '14px 30px', borderRadius: '4px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '2px' }}>LET'S TALK →</a>
          <div style={{ marginTop: '14px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#6E7D76' }}>Jonathan Katz · JK No Jokes Financials · jk@jknojokes.com</div>
        </div>
      </div>
    </>
  )
}

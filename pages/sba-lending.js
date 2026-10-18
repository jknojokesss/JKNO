import { useState, Fragment } from 'react'
import Head from 'next/head'
import DemoFontLinks from '../components/DemoFontLinks'
import DemoLobby from '../components/DemoLobby'
import DemoBooksPanel from '../components/DemoBooksPanel'
import { DEMO_HEAD, DEMO_MONO, DEMO_PORTAL_ROOT_CLASS, DEMO_RENDER_HINTS, DEMO_UI } from '../lib/demoFonts'

// ─────────────────────────────────────────────────────────────────────────
// Bespoke sample dashboard for an SBA loan broker. Front page = lead pipeline
// (follow-ups vs. first calls). Deals tab = disbursed loans (amount, rate,
// maturity, client contact). Financials = fees brought in. Interactive sample.
// A demo / relationship-builder by JK No Jokes Financials.
// ─────────────────────────────────────────────────────────────────────────

const DARK = '#15263F', NAVY = '#1F6FB2', GREEN = '#1E8E5A', BG = '#EEF2F7'
const INK = '#1B2A3A', MUTED = '#5C6B7A', FAINT = '#9AA7B4', RED = '#C0492F', CARD = '#FFFFFF'
const BOOK = 'https://calendly.com/jk-jknojokes/30min'
const BIZ = 'Riverbank Funding'

const usd0 = (n) => '$' + Math.round(Math.abs(n)).toLocaleString('en-US')
const fmtDate = (s) => { if (!s) return '—'; const d = new Date(s + 'T00:00:00'); return isNaN(d) ? s : d.toLocaleDateString([], { month: 'short', year: 'numeric' }) }

const SEED_LEADS = [
  { id: 1, name: 'Maria Gonzalez', business: 'Gonzalez Auto Body', contact: '(732) 555-0142', stage: 'followup', last: '3 days ago', note: 'Wants $350k for a 2nd location — sending docs' },
  { id: 2, name: 'Dave Kim', business: "Kim's Hardware", contact: 'dave@kimhardware.com', stage: 'followup', last: '1 week ago', note: 'Refi existing debt, ~$180k' },
  { id: 3, name: 'Priya Patel', business: 'Sunrise Daycare', contact: '(908) 555-0193', stage: 'followup', last: '2 days ago', note: 'Equipment + buildout, $220k' },
  { id: 4, name: 'Tom Russo', business: 'Russo Landscaping', contact: '(201) 555-0177', stage: 'tocall', note: 'Referral from his accountant — expanding fleet' },
  { id: 5, name: 'Aisha Bell', business: 'Bell Boutique', contact: 'aisha@bellboutique.com', stage: 'tocall', note: 'Website inquiry — startup loan' },
  { id: 6, name: 'Hector Ruiz', business: 'Ruiz Trucking', contact: '(973) 555-0120', stage: 'tocall', note: 'Working-capital line, ~$120k' },
]
const SEED_DEALS = [
  { id: 1, client: 'Hometown Pizza', contact: '(732) 555-0188', amount: 425000, rate: 10.5, maturity: '2034-03-01' },
  { id: 2, client: 'Apex Auto Repair', contact: 'mike@apexauto.com', amount: 180000, rate: 11.25, maturity: '2031-06-15' },
  { id: 3, client: 'Bright Dental', contact: '(908) 555-0166', amount: 610000, rate: 9.75, maturity: '2039-09-01' },
]
const SEED_FEES = [
  { id: 1, source: 'Hometown Pizza', date: '2026-03-01', amount: 8500 },
  { id: 2, source: 'Apex Auto Repair', date: '2026-06-15', amount: 3600 },
  { id: 3, source: 'Bright Dental', date: '2026-09-01', amount: 12200 },
]

export default function SbaLending() {
  const [tab, setTab] = useState('leads')
  const [leads, setLeads] = useState(SEED_LEADS)
  const [deals, setDeals] = useState(SEED_DEALS)
  const [fees, setFees] = useState(SEED_FEES)
  const [addingLead, setAddingLead] = useState(false)
  const [addingDeal, setAddingDeal] = useState(false)
  const [addingFee, setAddingFee] = useState(false)
  const [lf, setLf] = useState({ name: '', business: '', contact: '', note: '' })
  const [df, setDf] = useState({ client: '', contact: '', amount: '', rate: '', maturity: '' })
  const [ff, setFf] = useState({ source: '', amount: '', date: '' })

  const toCall = leads.filter((l) => l.stage === 'tocall')
  const followUp = leads.filter((l) => l.stage === 'followup')
  const disbursed = deals.reduce((s, d) => s + Number(d.amount || 0), 0)
  const weightedAvgRate =
    disbursed > 0
      ? (deals.reduce((s, d) => s + Number(d.amount || 0) * Number(d.rate || 0), 0) / disbursed).toFixed(2) + '%'
      : '—'
  const feesYtd = fees.reduce((s, f) => s + Number(f.amount || 0), 0)

  const markCalled = (id) => setLeads((p) => p.map((l) => (l.id === id ? { ...l, stage: 'followup', last: 'just now' } : l)))
  const addLead = () => { if (!lf.name) return; setLeads([{ id: Date.now(), stage: 'tocall', ...lf }, ...leads]); setLf({ name: '', business: '', contact: '', note: '' }); setAddingLead(false) }
  const addDeal = () => { if (!df.client || !df.amount) return; setDeals([{ id: Date.now(), client: df.client, contact: df.contact, amount: Number(df.amount), rate: Number(df.rate || 0), maturity: df.maturity }, ...deals]); setDf({ client: '', contact: '', amount: '', rate: '', maturity: '' }); setAddingDeal(false) }
  const addFee = () => { if (!ff.amount) return; setFees([{ id: Date.now(), source: ff.source || 'Fee', date: ff.date || new Date().toISOString().slice(0, 10), amount: Number(ff.amount) }, ...fees]); setFf({ source: '', amount: '', date: '' }); setAddingFee(false) }

  const tabs = [{ id: 'leads', label: 'Leads' }, { id: 'deals', label: 'Deals' }, { id: 'financials', label: 'Fees & books' }]
  const serif = { fontFamily: DEMO_HEAD }
  const lbl = { fontFamily: DEMO_MONO, fontSize: '9px', letterSpacing: '1.5px', color: FAINT }
  const card = { background: CARD, border: '1px solid #DCE3EB', borderRadius: '6px', padding: '16px' }
  const th = { fontFamily: DEMO_MONO, fontSize: '8px', letterSpacing: '1px', color: FAINT, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #E2E8EF' }
  const td = { fontSize: '12px', color: INK, padding: '9px 10px', borderBottom: '1px solid #EEF2F6', verticalAlign: 'top' }
  const inp = { width: '100%', padding: '9px 10px', fontSize: '13px', fontFamily: DEMO_UI, border: '1px solid #CCD6E0', borderRadius: '5px', background: '#fff', color: INK, outline: 'none' }

  const Kpi = ({ k, v, sub, color }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: INK, lineHeight: 1.1, marginTop: '4px' }}>{v}</div>
      {sub && <div style={{ fontFamily: DEMO_MONO, fontSize: '10px', color: color || MUTED, marginTop: '4px' }}>{sub}</div>}
    </div>
  )
  const addBtn = (on, setOn) => ({ background: on ? '#E2E8EF' : GREEN, color: on ? MUTED : '#fff', border: 'none', borderRadius: '5px', padding: '9px 14px', fontFamily: DEMO_MONO, fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' })

  return (
    <>
      <Head>
        <title>{BIZ} — Pipeline Dashboard Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <DemoFontLinks />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}${DEMO_RENDER_HINTS}html{overflow-x:hidden}body{background:${BG}}::placeholder{color:#A7B2BD}
          .sb-shell{display:flex;min-height:100vh;min-width:0;max-width:100%;overflow-x:hidden}
          .sb-side{width:200px;flex-shrink:0;background:${DARK};display:flex;flex-direction:column;padding:20px 12px;position:sticky;top:0;height:100vh;overflow-y:auto}
          .sb-nav-btn{display:block;width:100%;text-align:left;padding:9px 12px;border-radius:6px;border:none;background:transparent;color:#5A7080;font-family:${DEMO_UI};font-size:13px;cursor:pointer;margin-bottom:2px}
          .sb-nav-btn:hover{background:rgba(255,255,255,.06);color:#ccc}
          .sb-nav-btn.on{background:rgba(255,255,255,.09);color:#fff;box-shadow:inset 3px 0 0 ${GREEN}}
          .sb-main{flex:1;min-width:0;padding:28px 28px 60px;max-width:100%;overflow-x:hidden}
          .bl-mtabs{display:none;position:sticky;z-index:18;background:${CARD};border-bottom:1px solid #DCE3EB;padding:8px 12px;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;max-width:100%;scrollbar-width:none;margin-bottom:16px}
          .bl-mtabs::-webkit-scrollbar{display:none}
          .bl-mtabs::after{content:'';flex:0 0 8px}
          .bl-mtab{flex-shrink:0;border:1px solid #DCE3EB;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:500;font-family:${DEMO_UI};cursor:pointer;background:${CARD};color:${MUTED};white-space:nowrap}
          .bl-mtab.on{background:#E8F5EE;border-color:${GREEN};color:${INK};font-weight:600}
          @media(max-width:640px){
            .sb-side{display:none}
            .sb-main{padding:16px 14px 48px}
            .sb-page-head{margin-bottom:12px!important}
            .bl-mtabs{display:flex;top:var(--demo-lobby-h, 56px)}
            .bl-mtab{padding:8px 12px;font-size:12px}
            .sb-kpi-row>div{flex:1 1 calc(50% - 6px)!important;min-width:0!important}
          }`}</style>
      </Head>

      <DemoLobby />

      <div className={`sb-shell ${DEMO_PORTAL_ROOT_CLASS}`} style={{ ['--demo-lobby-h']: '56px' }}>
        <aside className="sb-side">
          <div style={{ paddingBottom: '20px' }}>
            <div style={{ fontFamily: DEMO_HEAD, fontSize: '16px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Riverbank<br />Funding</div>
            <div style={{ fontFamily: DEMO_MONO, fontSize: '9px', color: '#4A9FD4', letterSpacing: '.18em', marginTop: '4px' }}>LOAN DASHBOARD</div>
          </div>
          <nav style={{ flex: 1 }}>
            {tabs.map(t => (
              <button key={t.id} className={`sb-nav-btn${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </nav>
          <div style={{ borderTop: '1px solid #1E3248', paddingTop: '14px', marginTop: '8px' }}>
            <div style={{ fontFamily: DEMO_MONO, fontSize: '9px', color: '#304A60', lineHeight: 1.6 }}>
              SAMPLE DASHBOARD<br /><span style={{ color: GREEN }}>JK No Jokes Financials</span>
            </div>
            <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '10px', background: GREEN, color: '#fff', textDecoration: 'none', borderRadius: '5px', padding: '7px 12px', fontFamily: DEMO_MONO, fontSize: '10px', letterSpacing: '1px' }}>Book a call</a>
          </div>
        </aside>

        <main className="sb-main">
          <div className="sb-page-head" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'8px' }}>
            <div>
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:'9px', color:FAINT, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'3px' }}>September 2026</div>
              <div style={{ fontFamily: DEMO_HEAD, fontSize:'22px', fontWeight:600, color:INK }}>{tabs.find(t=>t.id===tab)?.label || 'Dashboard'}</div>
            </div>
            <div style={{ fontFamily:'DM Mono, monospace', fontSize:'10px', color:FAINT, background:'#EEF2F7', padding:'5px 12px', borderRadius:'20px' }}>Sample · JK No Jokes</div>
          </div>
          <div className="bl-mtabs" role="tablist">
            {tabs.map((t) => (
              <button key={t.id} type="button" role="tab" className={`bl-mtab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

        {/* LEADS */}
        {tab === 'leads' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="sb-kpi-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="TO CALL" v={toCall.length} sub="First contact" color={GREEN} />
              <Kpi k="FOLLOW-UPS DUE" v={followUp.length} sub="Already called" color={NAVY} />
              <Kpi k="LOANS DISBURSED" v={deals.length} sub={usd0(disbursed)} />
              <Kpi k="FEES (YTD)" v={usd0(feesYtd)} sub="Brought in" color={GREEN} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setAddingLead((a) => !a)} style={addBtn(addingLead)}>{addingLead ? '✕ CANCEL' : '+ NEW LEAD'}</button>
            </div>
            {addingLead && (
              <div style={{ ...card, background: '#F7FAFC', border: '1px dashed #CCD6E0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px' }}>
                  <input style={inp} placeholder="Name" value={lf.name} onChange={(e) => setLf({ ...lf, name: e.target.value })} />
                  <input style={inp} placeholder="Business" value={lf.business} onChange={(e) => setLf({ ...lf, business: e.target.value })} />
                  <input style={inp} placeholder="Phone or email" value={lf.contact} onChange={(e) => setLf({ ...lf, contact: e.target.value })} />
                  <input style={inp} placeholder="Note (what they need)" value={lf.note} onChange={(e) => setLf({ ...lf, note: e.target.value })} />
                </div>
                <button onClick={addLead} style={{ marginTop: '12px', background: NAVY, color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontFamily: DEMO_MONO, fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>ADD TO "TO CALL" →</button>
              </div>
            )}

            {/* To call — first contact */}
            <div style={card}>
              <div style={{ ...serif, fontSize: '19px', fontWeight: 600, color: INK }}>To call <span style={{ fontSize: '13px', color: MUTED }}>({toCall.length})</span></div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                  <thead><tr>{['LEAD', 'CONTACT', 'NOTE', ''].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {toCall.length === 0 && <tr><td colSpan={4} style={{ ...td, color: MUTED }}>All caught up — no first-calls waiting.</td></tr>}
                    {toCall.map((l) => (
                      <tr key={l.id}>
                        <td style={td}><div style={{ fontWeight: 600 }}>{l.name}</div><div style={{ color: MUTED, fontSize: '11px' }}>{l.business}</div></td>
                        <td style={{ ...td, color: MUTED, fontFamily: DEMO_MONO, fontSize: '11px' }}>{l.contact}</td>
                        <td style={{ ...td, color: MUTED }}>{l.note}</td>
                        <td style={{ ...td, textAlign: 'right' }}><button onClick={() => markCalled(l.id)} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontFamily: DEMO_MONO, fontSize: '10px', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap' }}>✓ CALLED</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Follow up */}
            <div style={card}>
              <div style={{ ...serif, fontSize: '19px', fontWeight: 600, color: INK, marginBottom: '10px' }}>Follow up <span style={{ fontSize: '13px', color: MUTED }}>({followUp.length})</span></div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                  <thead><tr>{['LEAD', 'CONTACT', 'LAST SPOKE', 'NOTE'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {followUp.length === 0 && <tr><td colSpan={4} style={{ ...td, color: MUTED }}>No follow-ups yet.</td></tr>}
                    {followUp.map((l) => (
                      <tr key={l.id}>
                        <td style={td}><div style={{ fontWeight: 600 }}>{l.name}</div><div style={{ color: MUTED, fontSize: '11px' }}>{l.business}</div></td>
                        <td style={{ ...td, color: MUTED, fontFamily: DEMO_MONO, fontSize: '11px' }}>{l.contact}</td>
                        <td style={{ ...td, color: MUTED, fontFamily: DEMO_MONO, fontSize: '11px' }}>{l.last}</td>
                        <td style={{ ...td, color: MUTED }}>{l.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DEALS */}
        {tab === 'deals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="sb-kpi-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="LOANS DISBURSED" v={deals.length} sub="Active" />
              <Kpi k="TOTAL DISBURSED" v={usd0(disbursed)} sub="Across all deals" color={GREEN} />
              <Kpi k="AVG RATE" v={weightedAvgRate} />
            </div>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div><div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>Disbursed loans</div><div style={{ fontFamily: DEMO_MONO, fontSize: '10px', color: MUTED }}>Funded deals</div></div>
                <button onClick={() => setAddingDeal((a) => !a)} style={addBtn(addingDeal)}>{addingDeal ? '✕ CANCEL' : '+ NEW DEAL'}</button>
              </div>
              {addingDeal && (
                <div style={{ background: '#F7FAFC', border: '1px dashed #CCD6E0', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                    <input style={inp} placeholder="Client / business" value={df.client} onChange={(e) => setDf({ ...df, client: e.target.value })} />
                    <input style={inp} placeholder="Contact (phone/email)" value={df.contact} onChange={(e) => setDf({ ...df, contact: e.target.value })} />
                    <input style={inp} type="number" placeholder="Loan amount $" value={df.amount} onChange={(e) => setDf({ ...df, amount: e.target.value })} />
                    <input style={inp} type="number" step="0.01" placeholder="Interest %" value={df.rate} onChange={(e) => setDf({ ...df, rate: e.target.value })} />
                    <input style={inp} type="date" placeholder="Maturity" value={df.maturity} onChange={(e) => setDf({ ...df, maturity: e.target.value })} />
                  </div>
                  <button onClick={addDeal} style={{ marginTop: '12px', background: NAVY, color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontFamily: DEMO_MONO, fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>ADD DEAL →</button>
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                  <thead><tr>{['CLIENT', 'CONTACT', 'AMOUNT', 'RATE', 'MATURITY'].map((h, i) => <th key={h} style={{ ...th, textAlign: i >= 2 && i <= 3 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {deals.map((d) => (
                      <tr key={d.id}>
                        <td style={{ ...td, fontWeight: 600 }}>{d.client}</td>
                        <td style={{ ...td, color: MUTED, fontFamily: DEMO_MONO, fontSize: '11px' }}>{d.contact || '—'}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: DEMO_MONO }}>{usd0(d.amount)}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: DEMO_MONO }}>{d.rate ? d.rate + '%' : '—'}</td>
                        <td style={{ ...td, fontFamily: DEMO_MONO, fontSize: '11px', color: MUTED }}>{fmtDate(d.maturity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FEES */}
        {tab === 'financials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="sb-kpi-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="FEES (YTD)" v={usd0(feesYtd)} sub="Total brought in" color={GREEN} />
              <Kpi k="DEALS CLOSED" v={fees.length} sub="Fee-earning" />
              <Kpi k="AVG FEE" v={fees.length ? usd0(feesYtd / fees.length) : '—'} sub="Per deal" />
            </div>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div><div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>Fees brought in</div><div style={{ fontFamily: DEMO_MONO, fontSize: '10px', color: MUTED }}>Fees this year</div></div>
                <button onClick={() => setAddingFee((a) => !a)} style={addBtn(addingFee)}>{addingFee ? '✕ CANCEL' : '+ ADD FEE'}</button>
              </div>
              {addingFee && (
                <div style={{ background: '#F7FAFC', border: '1px dashed #CCD6E0', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                    <input style={inp} placeholder="Source / client" value={ff.source} onChange={(e) => setFf({ ...ff, source: e.target.value })} />
                    <input style={inp} type="number" placeholder="Fee $" value={ff.amount} onChange={(e) => setFf({ ...ff, amount: e.target.value })} />
                    <input style={inp} type="date" value={ff.date} onChange={(e) => setFf({ ...ff, date: e.target.value })} />
                  </div>
                  <button onClick={addFee} style={{ marginTop: '12px', background: NAVY, color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontFamily: DEMO_MONO, fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>ADD FEE →</button>
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '440px' }}>
                  <thead><tr>{['SOURCE', 'DATE', 'FEE'].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 2 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {fees.map((f) => (
                      <tr key={f.id}>
                        <td style={{ ...td, fontWeight: 600 }}>{f.source}</td>
                        <td style={{ ...td, color: MUTED, fontFamily: DEMO_MONO, fontSize: '11px' }}>{fmtDate(f.date)}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: DEMO_MONO, color: GREEN, fontWeight: 600 }}>{usd0(f.amount)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2} style={{ ...td, textAlign: 'right', fontWeight: 600, fontFamily: DEMO_MONO, borderTop: '2px solid #E2E8EF' }}>Total fees YTD</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontFamily: DEMO_MONO, color: GREEN, borderTop: '2px solid #E2E8EF' }}>{usd0(feesYtd)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <DemoBooksPanel
              headFont={DEMO_HEAD}
              monoFont={DEMO_MONO}
              ink={INK}
              muted={MUTED}
              green={GREEN}
              border="#DCE3EB"
              title="Fee income vs QuickBooks"
              intro="Fees sync to QuickBooks nightly."
              rows={[
                { label: 'Fees logged (portal)', portal: usd0(feesYtd), qbo: usd0(feesYtd) },
                { label: 'YTD brokerage income (P&L)', portal: usd0(feesYtd), qbo: usd0(feesYtd) },
                { label: 'Open pipeline (not in GL)', portal: usd0(0), qbo: '—' },
              ]}
              footnote=""
            />
          </div>
        )}

        <p style={{ marginTop: '28px', fontSize: '14px', color: MUTED, lineHeight: 1.6 }}>
          Your borrowers need clean books to qualify. I build these portals and clean up the books.{' '}
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ color: GREEN, fontWeight: 600 }}>Book a call</a>.
        </p>
        </main>
      </div>
    </>
  )
}

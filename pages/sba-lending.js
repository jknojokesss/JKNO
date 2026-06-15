import { useState, Fragment } from 'react'
import Head from 'next/head'

// ─────────────────────────────────────────────────────────────────────────
// Bespoke sample dashboard for an SBA loan broker. Front page = lead pipeline
// (follow-ups vs. first calls). Deals tab = disbursed loans (amount, rate,
// maturity, client contact). Financials = fees brought in. Interactive sample.
// A demo / relationship-builder by JK No Jokes Financials.
// ─────────────────────────────────────────────────────────────────────────

const DARK = '#15263F', NAVY = '#1F6FB2', GREEN = '#1E8E5A', BG = '#EEF2F7'
const INK = '#1B2A3A', MUTED = '#5C6B7A', FAINT = '#9AA7B4', RED = '#C0492F', CARD = '#FFFFFF'
const BOOK = 'https://calendly.com/jk-jknojokes/30min'
const BIZ = 'Summit SBA Lending'

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
  { id: 1, source: 'Hometown Pizza', date: '2025-03-01', amount: 8500 },
  { id: 2, source: 'Apex Auto Repair', date: '2025-06-15', amount: 3600 },
  { id: 3, source: 'Bright Dental', date: '2025-09-01', amount: 12200 },
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
  const feesYtd = fees.reduce((s, f) => s + Number(f.amount || 0), 0)

  const markCalled = (id) => setLeads((p) => p.map((l) => (l.id === id ? { ...l, stage: 'followup', last: 'just now' } : l)))
  const addLead = () => { if (!lf.name) return; setLeads([{ id: Date.now(), stage: 'tocall', ...lf }, ...leads]); setLf({ name: '', business: '', contact: '', note: '' }); setAddingLead(false) }
  const addDeal = () => { if (!df.client || !df.amount) return; setDeals([{ id: Date.now(), client: df.client, contact: df.contact, amount: Number(df.amount), rate: Number(df.rate || 0), maturity: df.maturity }, ...deals]); setDf({ client: '', contact: '', amount: '', rate: '', maturity: '' }); setAddingDeal(false) }
  const addFee = () => { if (!ff.amount) return; setFees([{ id: Date.now(), source: ff.source || 'Fee', date: ff.date || new Date().toISOString().slice(0, 10), amount: Number(ff.amount) }, ...fees]); setFf({ source: '', amount: '', date: '' }); setAddingFee(false) }

  const tabs = [{ id: 'leads', label: 'Leads' }, { id: 'deals', label: 'Deals' }, { id: 'financials', label: 'Fees' }]
  const serif = { fontFamily: 'Cormorant Garamond, serif' }
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '1.5px', color: FAINT }
  const card = { background: CARD, border: '1px solid #DCE3EB', borderRadius: '6px', padding: '16px' }
  const th = { fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '1px', color: FAINT, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #E2E8EF' }
  const td = { fontSize: '12px', color: INK, padding: '9px 10px', borderBottom: '1px solid #EEF2F6', verticalAlign: 'top' }
  const inp = { width: '100%', padding: '9px 10px', fontSize: '13px', fontFamily: "'DM Sans',sans-serif", border: '1px solid #CCD6E0', borderRadius: '5px', background: '#fff', color: INK, outline: 'none' }

  const Kpi = ({ k, v, sub, color }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: INK, lineHeight: 1.1, marginTop: '4px' }}>{v}</div>
      {sub && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: color || MUTED, marginTop: '4px' }}>{sub}</div>}
    </div>
  )
  const addBtn = (on, setOn) => ({ background: on ? '#E2E8EF' : GREEN, color: on ? MUTED : '#fff', border: 'none', borderRadius: '5px', padding: '9px 14px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' })

  return (
    <>
      <Head>
        <title>{BIZ} — Pipeline Dashboard Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${BG};font-family:'DM Sans',sans-serif}
          .sb-tabs::-webkit-scrollbar{display:none}.sb-tabs{scrollbar-width:none}::placeholder{color:#A7B2BD}`}</style>
      </Head>

      <div style={{ background: NAVY, color: '#fff', textAlign: 'center', padding: '8px 16px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px' }}>
        SAMPLE DASHBOARD · built for {BIZ} by JK No Jokes Financials
      </div>

      <div style={{ background: DARK }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 18px 0', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🏦</span>
            <span style={{ ...serif, fontSize: '20px', fontWeight: 700, color: '#E8EEF5' }}>{BIZ}</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '2px', color: '#7FB0D6' }}>SBA PIPELINE</span>
          </div>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: GREEN, color: '#fff', textDecoration: 'none', borderRadius: '4px', padding: '7px 12px', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px', whiteSpace: 'nowrap' }}>BUILT BY JK →</a>
        </div>
        <nav className="sb-tabs" style={{ display: 'flex', gap: '4px', padding: '0 18px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.1)', marginTop: '8px' }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 12px', background: 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === t.id ? '#fff' : '#8499AC', fontSize: '11px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em',
              borderBottom: tab === t.id ? `2px solid ${GREEN}` : '2px solid transparent', marginBottom: '-1px',
            }}>{t.label}</button>
          ))}
        </nav>
      </div>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* LEADS */}
        {tab === 'leads' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                <button onClick={addLead} style={{ marginTop: '12px', background: NAVY, color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>ADD TO "TO CALL" →</button>
              </div>
            )}

            {/* To call — first contact */}
            <div style={card}>
              <div style={{ ...serif, fontSize: '19px', fontWeight: 600, color: INK }}>🆕 To call — first contact <span style={{ fontSize: '13px', color: MUTED }}>({toCall.length})</span></div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED, marginBottom: '10px' }}>New leads you haven't reached yet — hit "Called" to move them to follow-up</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                  <thead><tr>{['LEAD', 'CONTACT', 'NOTE', ''].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {toCall.length === 0 && <tr><td colSpan={4} style={{ ...td, color: MUTED }}>All caught up — no first-calls waiting.</td></tr>}
                    {toCall.map((l) => (
                      <tr key={l.id}>
                        <td style={td}><div style={{ fontWeight: 600 }}>{l.name}</div><div style={{ color: MUTED, fontSize: '11px' }}>{l.business}</div></td>
                        <td style={{ ...td, color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{l.contact}</td>
                        <td style={{ ...td, color: MUTED }}>{l.note}</td>
                        <td style={{ ...td, textAlign: 'right' }}><button onClick={() => markCalled(l.id)} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap' }}>✓ CALLED</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Follow up */}
            <div style={card}>
              <div style={{ ...serif, fontSize: '19px', fontWeight: 600, color: INK }}>📞 Follow up — already called <span style={{ fontSize: '13px', color: MUTED }}>({followUp.length})</span></div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED, marginBottom: '10px' }}>People you've talked to — circle back and keep them warm</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                  <thead><tr>{['LEAD', 'CONTACT', 'LAST SPOKE', 'NOTE'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {followUp.length === 0 && <tr><td colSpan={4} style={{ ...td, color: MUTED }}>No follow-ups yet.</td></tr>}
                    {followUp.map((l) => (
                      <tr key={l.id}>
                        <td style={td}><div style={{ fontWeight: 600 }}>{l.name}</div><div style={{ color: MUTED, fontSize: '11px' }}>{l.business}</div></td>
                        <td style={{ ...td, color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{l.contact}</td>
                        <td style={{ ...td, color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{l.last}</td>
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
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="LOANS DISBURSED" v={deals.length} sub="Active" />
              <Kpi k="TOTAL DISBURSED" v={usd0(disbursed)} sub="Across all deals" color={GREEN} />
              <Kpi k="AVG RATE" v={deals.length ? (deals.reduce((s, d) => s + Number(d.rate || 0), 0) / deals.length).toFixed(2) + '%' : '—'} sub="Weighted later" />
            </div>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div><div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>Disbursed loans</div><div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED }}>Amount, rate, maturity, and who to reach</div></div>
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
                  <button onClick={addDeal} style={{ marginTop: '12px', background: NAVY, color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>ADD DEAL →</button>
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                  <thead><tr>{['CLIENT', 'CONTACT', 'AMOUNT', 'RATE', 'MATURITY'].map((h, i) => <th key={h} style={{ ...th, textAlign: i >= 2 && i <= 3 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {deals.map((d) => (
                      <tr key={d.id}>
                        <td style={{ ...td, fontWeight: 600 }}>{d.client}</td>
                        <td style={{ ...td, color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{d.contact || '—'}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{usd0(d.amount)}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{d.rate ? d.rate + '%' : '—'}</td>
                        <td style={{ ...td, fontFamily: 'DM Mono, monospace', fontSize: '11px', color: MUTED }}>{fmtDate(d.maturity)}</td>
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
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="FEES (YTD)" v={usd0(feesYtd)} sub="Total brought in" color={GREEN} />
              <Kpi k="DEALS CLOSED" v={fees.length} sub="Fee-earning" />
              <Kpi k="AVG FEE" v={fees.length ? usd0(feesYtd / fees.length) : '—'} sub="Per deal" />
            </div>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div><div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>Fees brought in</div><div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED }}>Log every fee you earn — total tracks itself</div></div>
                <button onClick={() => setAddingFee((a) => !a)} style={addBtn(addingFee)}>{addingFee ? '✕ CANCEL' : '+ ADD FEE'}</button>
              </div>
              {addingFee && (
                <div style={{ background: '#F7FAFC', border: '1px dashed #CCD6E0', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                    <input style={inp} placeholder="Source / client" value={ff.source} onChange={(e) => setFf({ ...ff, source: e.target.value })} />
                    <input style={inp} type="number" placeholder="Fee $" value={ff.amount} onChange={(e) => setFf({ ...ff, amount: e.target.value })} />
                    <input style={inp} type="date" value={ff.date} onChange={(e) => setFf({ ...ff, date: e.target.value })} />
                  </div>
                  <button onClick={addFee} style={{ marginTop: '12px', background: NAVY, color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>ADD FEE →</button>
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '440px' }}>
                  <thead><tr>{['SOURCE', 'DATE', 'FEE'].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 2 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {fees.map((f) => (
                      <tr key={f.id}>
                        <td style={{ ...td, fontWeight: 600 }}>{f.source}</td>
                        <td style={{ ...td, color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{fmtDate(f.date)}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', color: GREEN, fontWeight: 600 }}>{usd0(f.amount)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2} style={{ ...td, textAlign: 'right', fontWeight: 600, fontFamily: 'DM Mono, monospace', borderTop: '2px solid #E2E8EF' }}>Total fees YTD</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontFamily: 'DM Mono, monospace', color: GREEN, borderTop: '2px solid #E2E8EF' }}>{usd0(feesYtd)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CTA — referral angle */}
        <div style={{ marginTop: '28px', textAlign: 'center', background: CARD, border: '1px solid #DCE3EB', borderRadius: '10px', padding: '30px' }}>
          <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: INK }}>Got a client who needs loan-ready books?</div>
          <p style={{ color: MUTED, fontSize: '14px', margin: '8px auto 18px', maxWidth: '480px', lineHeight: 1.6 }}>
            I built this for you. I also clean up small-business books and build dashboards like this — exactly what your borrowers need to qualify and stay on top of their numbers. Send them my way.
          </p>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: GREEN, color: '#fff', textDecoration: 'none', padding: '14px 30px', borderRadius: '4px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '2px' }}>LET'S TALK →</a>
          <div style={{ marginTop: '14px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: FAINT }}>Jonathan Katz · JK No Jokes Financials · jk@jknojokes.com</div>
        </div>
      </div>
    </>
  )
}

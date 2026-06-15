import { useState, Fragment } from 'react'
import Head from 'next/head'

// ─────────────────────────────────────────────────────────────────────────
// Bespoke sample dashboard for "Mint Capital" (mortgage broker). A pipeline
// command center: rate-lock countdown, money-in-the-pipeline, stage funnel,
// referral-agent leaderboard, and commissions. Interactive sample by JK No Jokes.
// ─────────────────────────────────────────────────────────────────────────

const DARK = '#10362E', MINT = '#2FB888', BG = '#EDF6F1'
const INK = '#163029', MUTED = '#5E7269', FAINT = '#9DB3AA', CARD = '#FFFFFF'
const GREEN = '#1F8A66', AMBER = '#C77D2B', RED = '#C0492F', GOLD = '#C9A84C'
const BOOK = 'https://calendly.com/jk-jknojokes/30min'
const BIZ = 'Mint Capital'

const usd0 = (n) => '$' + Math.round(Math.abs(n)).toLocaleString('en-US')
const today = new Date()
const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d }
const fmtIn = (n) => n == null ? '—' : addDays(n).toLocaleDateString([], { month: 'short', day: 'numeric' })

const STAGES = [
  { v: 'application', l: 'Application' },
  { v: 'processing', l: 'Processing' },
  { v: 'underwriting', l: 'Underwriting' },
  { v: 'ctc', l: 'Clear to Close' },
  { v: 'funded', l: 'Funded' },
]
const STAGE_STYLE = {
  application: ['#EAEFEC', '#6E8278'],
  processing: ['#E1ECF5', '#2C6E9B'],
  underwriting: ['#FBEBD6', AMBER],
  ctc: ['#D7F0E5', GREEN],
  funded: ['#DCEFE0', '#2E7D52'],
}

const SEED = [
  { id: 1, borrower: 'Sarah & Tom Klein', type: 'Purchase', amount: 540000, rate: 6.625, lender: 'UWM', stage: 'underwriting', lockIn: 2, closeIn: 9, agent: 'Dina Roth · Keller Williams', bps: 110 },
  { id: 2, borrower: 'Marcus Webb', type: 'Refi', amount: 310000, rate: 6.25, lender: 'Rocket', stage: 'processing', lockIn: 5, closeIn: 18, agent: 'Direct', bps: 100 },
  { id: 3, borrower: 'The Patel Family', type: 'Purchase', amount: 720000, rate: 6.75, lender: 'Pennymac', stage: 'ctc', lockIn: 4, closeIn: 3, agent: 'Jon Alvarez · Compass', bps: 115 },
  { id: 4, borrower: 'Alicia Greene', type: 'Purchase', amount: 415000, rate: 6.5, lender: 'UWM', stage: 'application', lockIn: null, closeIn: 30, agent: 'Dina Roth · Keller Williams', bps: 100 },
  { id: 5, borrower: 'David Okafor', type: 'Refi', amount: 265000, rate: 6.375, lender: 'loanDepot', stage: 'underwriting', lockIn: 1, closeIn: 11, agent: 'Direct', bps: 100 },
  { id: 6, borrower: 'Rivera Holdings', type: 'Purchase', amount: 890000, rate: 6.875, lender: 'JPMorgan', stage: 'processing', lockIn: 8, closeIn: 22, agent: 'Mia Chen · Corcoran', bps: 105 },
  { id: 7, borrower: 'Kevin Donnelly', type: 'Purchase', amount: 375000, rate: 6.625, lender: 'UWM', stage: 'funded', lockIn: null, closeIn: -6, agent: 'Jon Alvarez · Compass', bps: 110 },
  { id: 8, borrower: 'Rachel Schwartz', type: 'Refi', amount: 480000, rate: 6.25, lender: 'Rocket', stage: 'funded', lockIn: null, closeIn: -12, agent: 'Dina Roth · Keller Williams', bps: 100 },
]

const comm = (l) => l.amount * (l.bps || 0) / 10000

export default function MintCapital() {
  const [tab, setTab] = useState('pipeline')
  const [loans, setLoans] = useState(SEED)
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ borrower: '', type: 'Purchase', amount: '', rate: '', lender: '', agent: '', stage: 'application' })

  const setStage = (id, stage) => setLoans((p) => p.map((l) => (l.id === id ? { ...l, stage } : l)))
  const addLoan = () => {
    if (!f.borrower || !f.amount) return
    setLoans([{ id: Date.now(), borrower: f.borrower, type: f.type, amount: Number(f.amount), rate: Number(f.rate || 0), lender: f.lender, stage: f.stage, agent: f.agent || 'Direct', bps: 100, lockIn: 14, closeIn: 30 }, ...loans])
    setF({ borrower: '', type: 'Purchase', amount: '', rate: '', lender: '', agent: '', stage: 'application' })
    setAdding(false)
  }

  const pipeline = loans.filter((l) => l.stage !== 'funded')
  const funded = loans.filter((l) => l.stage === 'funded')
  const pipeVol = pipeline.reduce((s, l) => s + l.amount, 0)
  const projComm = pipeline.reduce((s, l) => s + comm(l), 0)
  const fundedVol = funded.reduce((s, l) => s + l.amount, 0)
  const earnedComm = funded.reduce((s, l) => s + comm(l), 0)
  const locks = pipeline.filter((l) => l.lockIn != null && l.lockIn <= 10).sort((a, b) => a.lockIn - b.lockIn)
  const closing = pipeline.filter((l) => l.closeIn != null && l.closeIn >= 0 && l.closeIn <= 7).sort((a, b) => a.closeIn - b.closeIn)

  const tabs = [{ id: 'pipeline', label: 'Pipeline' }, { id: 'loans', label: 'Loans' }, { id: 'partners', label: 'Partners' }, { id: 'commissions', label: 'Commissions' }]
  const serif = { fontFamily: 'Cormorant Garamond, serif' }
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '1.5px', color: FAINT }
  const card = { background: CARD, border: '1px solid #D6E7DE', borderRadius: '6px', padding: '16px' }
  const th = { fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '1px', color: FAINT, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #E2EDE8' }
  const td = { fontSize: '12px', color: INK, padding: '9px 10px', borderBottom: '1px solid #EEF5F1', verticalAlign: 'middle' }
  const inp = { width: '100%', padding: '9px 10px', fontSize: '13px', fontFamily: "'DM Sans',sans-serif", border: '1px solid #C9DDD4', borderRadius: '5px', background: '#fff', color: INK, outline: 'none' }

  const Kpi = ({ k, v, sub, color }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: INK, lineHeight: 1.1, marginTop: '4px' }}>{v}</div>
      {sub && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: color || MUTED, marginTop: '4px' }}>{sub}</div>}
    </div>
  )
  const StageBadge = ({ s }) => { const [bg, fg] = STAGE_STYLE[s]; return <span style={{ background: bg, color: fg, fontFamily: 'DM Mono, monospace', fontSize: '10px', padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap' }}>{STAGES.find((x) => x.v === s).l}</span> }
  const lockColor = (d) => d <= 3 ? RED : d <= 7 ? AMBER : GREEN

  return (
    <>
      <Head>
        <title>{BIZ} — Pipeline Command Center</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${BG};font-family:'DM Sans',sans-serif}
          .mc-tabs::-webkit-scrollbar{display:none}.mc-tabs{scrollbar-width:none}::placeholder{color:#A7BDB3}`}</style>
      </Head>

      <div style={{ background: MINT, color: '#08312a', textAlign: 'center', padding: '8px 16px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px' }}>
        SAMPLE DASHBOARD · built for {BIZ} by JK No Jokes Financials
      </div>

      <div style={{ background: DARK }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 18px 0', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🌿</span>
            <span style={{ ...serif, fontSize: '20px', fontWeight: 700, color: '#E7F5EE' }}>{BIZ}</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '2px', color: MINT }}>MORTGAGE PIPELINE</span>
          </div>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: MINT, color: '#08312a', textDecoration: 'none', borderRadius: '4px', padding: '7px 12px', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px', whiteSpace: 'nowrap' }}>BUILT BY JK →</a>
        </div>
        <nav className="mc-tabs" style={{ display: 'flex', gap: '4px', padding: '0 18px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.12)', marginTop: '8px' }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 12px', background: 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === t.id ? '#fff' : '#82A89B', fontSize: '11px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em',
              borderBottom: tab === t.id ? `2px solid ${MINT}` : '2px solid transparent', marginBottom: '-1px',
            }}>{t.label}</button>
          ))}
        </nav>
      </div>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* PIPELINE */}
        {tab === 'pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="LOANS IN PIPELINE" v={pipeline.length} sub={usd0(pipeVol) + ' volume'} />
              <Kpi k="MONEY IN PIPELINE" v={usd0(projComm)} sub="projected commission" color={GREEN} />
              <Kpi k="FUNDED (MTD)" v={usd0(fundedVol)} sub={`${funded.length} loans`} />
              <Kpi k="EARNED (MTD)" v={usd0(earnedComm)} sub="commission banked" color={GREEN} />
            </div>

            {/* Rate-lock countdown */}
            <div style={card}>
              <div style={{ ...serif, fontSize: '19px', fontWeight: 600, color: INK }}>⏰ Rate locks expiring</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED, marginBottom: '10px' }}>Lock these or lose the rate — soonest first</div>
              {locks.length === 0 ? <div style={{ fontSize: '12px', color: MUTED }}>No locks expiring in the next 10 days. 👍</div> :
                locks.map((l) => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #EEF5F1' }}>
                    <span style={{ fontSize: '13px', color: INK }}><span style={{ fontWeight: 600 }}>{l.borrower}</span> <span style={{ color: MUTED }}>· {usd0(l.amount)} · {l.lender}</span></span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: 600, color: lockColor(l.lockIn), whiteSpace: 'nowrap' }}>
                      {l.lockIn === 0 ? 'TODAY' : l.lockIn === 1 ? 'in 1 day' : `in ${l.lockIn} days`} · {fmtIn(l.lockIn)}
                    </span>
                  </div>
                ))}
            </div>

            {/* Stage funnel */}
            <div style={card}>
              <div style={{ ...lbl, marginBottom: '12px' }}>PIPELINE BY STAGE</div>
              <div style={{ display: 'flex', alignItems: 'stretch', gap: '6px', overflowX: 'auto' }}>
                {STAGES.map((s, i) => {
                  const ls = loans.filter((l) => l.stage === s.v)
                  const vol = ls.reduce((a, l) => a + l.amount, 0)
                  const [bg, fg] = STAGE_STYLE[s.v]
                  return (
                    <Fragment key={s.v}>
                      <div style={{ flex: 1, minWidth: '110px', background: bg, borderRadius: '6px', padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '1px', color: fg }}>{s.l.toUpperCase()}</div>
                        <div style={{ ...serif, fontSize: '26px', fontWeight: 700, color: fg, lineHeight: 1.2 }}>{ls.length}</div>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: fg, opacity: 0.8 }}>{vol ? usd0(vol / 1000) + 'k' : '—'}</div>
                      </div>
                      {i < STAGES.length - 1 && <div style={{ display: 'flex', alignItems: 'center', color: FAINT, fontSize: '14px' }}>→</div>}
                    </Fragment>
                  )
                })}
              </div>
            </div>

            {/* Closing this week */}
            <div style={card}>
              <div style={{ ...serif, fontSize: '19px', fontWeight: 600, color: INK }}>📅 Closing this week</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED, marginBottom: '10px' }}>Keep these on the rails to the finish</div>
              {closing.length === 0 ? <div style={{ fontSize: '12px', color: MUTED }}>Nothing closing in the next 7 days.</div> :
                closing.map((l) => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #EEF5F1' }}>
                    <span style={{ fontSize: '13px', color: INK }}><span style={{ fontWeight: 600 }}>{l.borrower}</span> <span style={{ color: MUTED }}>· {usd0(l.amount)} · {l.type}</span></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <StageBadge s={l.stage} />
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: 600, color: GREEN, whiteSpace: 'nowrap' }}>{l.closeIn === 0 ? 'TODAY' : `in ${l.closeIn}d`} · {fmtIn(l.closeIn)}</span>
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* LOANS */}
        {tab === 'loans' && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div><div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>All loans</div><div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED }}>Change a stage with the dropdown — pipeline &amp; commissions update live</div></div>
              <button onClick={() => setAdding((a) => !a)} style={{ background: adding ? '#E2EDE8' : MINT, color: adding ? MUTED : '#08312a', border: 'none', borderRadius: '5px', padding: '9px 14px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>{adding ? '✕ CANCEL' : '+ NEW LOAN'}</button>
            </div>
            {adding && (
              <div style={{ background: '#F4FBF8', border: '1px dashed #C9DDD4', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                  <input style={inp} placeholder="Borrower" value={f.borrower} onChange={(e) => setF({ ...f, borrower: e.target.value })} />
                  <select style={inp} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option>Purchase</option><option>Refi</option></select>
                  <input style={inp} type="number" placeholder="Loan amount $" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
                  <input style={inp} type="number" step="0.01" placeholder="Rate %" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} />
                  <input style={inp} placeholder="Lender" value={f.lender} onChange={(e) => setF({ ...f, lender: e.target.value })} />
                  <input style={inp} placeholder="Referral agent" value={f.agent} onChange={(e) => setF({ ...f, agent: e.target.value })} />
                  <select style={inp} value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })}>{STAGES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select>
                </div>
                <button onClick={addLoan} style={{ marginTop: '12px', background: DARK, color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>ADD LOAN →</button>
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                <thead><tr>{['BORROWER', 'TYPE', 'AMOUNT', 'RATE', 'LENDER', 'STAGE', 'LOCK', 'COMMISSION'].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 2 || i === 3 || i === 7 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {loans.map((l) => (
                    <tr key={l.id}>
                      <td style={{ ...td, fontWeight: 600 }}>{l.borrower}<div style={{ fontWeight: 400, color: FAINT, fontSize: '10px', fontFamily: 'DM Mono, monospace' }}>{l.agent}</div></td>
                      <td style={{ ...td, color: MUTED }}>{l.type}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{usd0(l.amount)}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{l.rate ? l.rate + '%' : '—'}</td>
                      <td style={{ ...td, color: MUTED }}>{l.lender}</td>
                      <td style={td}>
                        <select value={l.stage} onChange={(e) => setStage(l.id, e.target.value)} style={{ background: STAGE_STYLE[l.stage][0], color: STAGE_STYLE[l.stage][1], border: 'none', borderRadius: '3px', fontFamily: 'DM Mono, monospace', fontSize: '10px', padding: '3px 5px', cursor: 'pointer' }}>
                          {STAGES.map((s) => <option key={s.v} value={s.v} style={{ background: '#fff', color: INK }}>{s.l}</option>)}
                        </select>
                      </td>
                      <td style={{ ...td, fontFamily: 'DM Mono, monospace', fontSize: '11px', color: l.stage === 'funded' ? FAINT : (l.lockIn == null ? FAINT : lockColor(l.lockIn)) }}>{l.stage === 'funded' ? 'funded' : l.lockIn == null ? 'not locked' : `${l.lockIn}d`}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontWeight: 600, color: l.stage === 'funded' ? GREEN : MUTED }}>{usd0(comm(l))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PARTNERS */}
        {tab === 'partners' && (() => {
          const map = {}
          loans.forEach((l) => { const a = l.agent || 'Direct'; (map[a] = map[a] || { loans: 0, vol: 0, comm: 0 }); map[a].loans++; map[a].vol += l.amount; map[a].comm += comm(l) })
          const rows = Object.entries(map).filter(([a]) => a !== 'Direct').sort((a, b) => b[1].vol - a[1].vol)
          return (
            <div style={card}>
              <div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>🏆 Referral leaderboard</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED, marginBottom: '12px' }}>Which agents feed you the most — these are the lunches worth buying</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                  <thead><tr>{['AGENT', 'DEALS', 'VOLUME', 'YOUR COMMISSION'].map((h, i) => <th key={h} style={{ ...th, textAlign: i ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {rows.map(([a, d], i) => (
                      <tr key={a}>
                        <td style={{ ...td, fontWeight: 600 }}>{i === 0 && <span style={{ color: GOLD, marginRight: '6px' }}>★</span>}{a}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{d.loans}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{usd0(d.vol)}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', color: GREEN, fontWeight: 600 }}>{usd0(d.comm)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}

        {/* COMMISSIONS */}
        {tab === 'commissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="EARNED (FUNDED)" v={usd0(earnedComm)} sub={`${funded.length} loans closed`} color={GREEN} />
              <Kpi k="PROJECTED (PIPELINE)" v={usd0(projComm)} sub={`${pipeline.length} in flight`} />
              <Kpi k="TOTAL POTENTIAL" v={usd0(earnedComm + projComm)} sub="earned + pipeline" color={GREEN} />
            </div>
            <div style={card}>
              <div style={{ ...lbl, marginBottom: '6px' }}>FUNDED — COMMISSION BANKED</div>
              {funded.map((l) => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF5F1' }}>
                  <span style={{ fontSize: '13px', color: INK }}>{l.borrower} <span style={{ color: MUTED }}>· {usd0(l.amount)} @ {l.bps}bps</span></span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: GREEN, fontWeight: 600 }}>{usd0(comm(l))}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ color: MUTED }}>Earned:</span><span style={{ color: GREEN }}>{usd0(earnedComm)}</span>
              </div>
            </div>
            <div style={{ ...card, background: '#F4FBF8', borderColor: '#CBE7DA' }}>
              <div style={{ ...lbl, marginBottom: '6px', color: GREEN }}>STILL IN THE PIPELINE</div>
              {pipeline.map((l) => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E4F1EA' }}>
                  <span style={{ fontSize: '12px', color: INK }}>{l.borrower} <span style={{ color: MUTED }}>· {STAGES.find((x) => x.v === l.stage).l}</span></span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: MUTED }}>{usd0(comm(l))}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ color: MUTED }}>Projected:</span><span style={{ color: GREEN }}>{usd0(projComm)}</span>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '28px', textAlign: 'center', background: CARD, border: '1px solid #D6E7DE', borderRadius: '10px', padding: '30px' }}>
          <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: INK }}>Like it, {BIZ}?</div>
          <p style={{ color: MUTED, fontSize: '14px', margin: '8px auto 18px', maxWidth: '480px', lineHeight: 1.6 }}>
            I built this for you. I also keep clean books for commission-based businesses (1099s, splits, the works) — and your borrowers need loan-ready financials, which is exactly what I do. Let's send each other business.
          </p>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: DARK, color: '#fff', textDecoration: 'none', padding: '14px 30px', borderRadius: '4px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '2px' }}>LET'S TALK →</a>
          <div style={{ marginTop: '14px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: FAINT }}>Jonathan Katz · JK No Jokes Financials · jk@jknojokes.com</div>
        </div>
      </div>
    </>
  )
}

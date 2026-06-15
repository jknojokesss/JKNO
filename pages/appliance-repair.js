import { useState, Fragment } from 'react'
import Head from 'next/head'

// ─────────────────────────────────────────────────────────────────────────
// Bespoke sample dashboard for an appliance-repair business. Front page is a
// live JOB BOARD: add jobs, assign a tech, and — by expanding a job — log parts
// and labor hours as the work happens. Cost vs. charged = profit per job, live.
// Sample data — a demo by JK No Jokes Financials.
// ─────────────────────────────────────────────────────────────────────────

const DARK = '#1E2A38', BLUE = '#2C6E9B', ORANGE = '#E0813C', BG = '#EEF1F5'
const INK = '#1F2A36', MUTED = '#647082', FAINT = '#97A3B2'
const GREEN = '#2E7D52', RED = '#C0492F', CARD = '#FFFFFF'
const BOOK = 'https://calendly.com/jk-jknojokes/30min'
const BIZ = 'YT Appliance Repair'
const TECHS = ['Mike', 'Luis', 'Unassigned']
const LABOR_RATE = 90

const usd0 = (n) => '$' + Math.round(Math.abs(n)).toLocaleString('en-US')

const STATUS = {
  waiting_part: ['#FBE7D3', '#B5651D', 'Waiting for part'],
  scheduled:    ['#E1ECF5', BLUE, 'Going tomorrow'],
  in_progress:  ['#FFF3D6', '#9A7B1E', 'In progress'],
  done:         ['#E1F0E6', GREEN, 'Completed'],
}
const STATUS_OPTS = [
  { v: 'scheduled', l: 'Going tomorrow' },
  { v: 'in_progress', l: 'In progress' },
  { v: 'waiting_part', l: 'Waiting for part' },
  { v: 'done', l: 'Completed' },
]

const SEED = [
  { id: 1, customer: 'Greenfield Apts', appliance: '3× AC units — not cooling', tech: 'Luis', status: 'in_progress', charged: 1250, lines: [{ type: 'part', desc: 'Run capacitors ×3', cost: 240 }, { type: 'part', desc: 'Contactor', cost: 170 }, { type: 'labor', desc: 'Labor 2.0 hrs', cost: 180 }] },
  { id: 2, customer: 'Sarah M.', appliance: 'Whirlpool fridge — not cooling', tech: 'Mike', status: 'waiting_part', charged: 320, lines: [{ type: 'part', desc: 'Compressor relay', cost: 145 }] },
  { id: 3, customer: "Dave's Diner", appliance: 'Commercial oven — igniter', tech: 'Luis', status: 'in_progress', charged: 410, lines: [{ type: 'part', desc: 'Hot surface igniter', cost: 88 }, { type: 'labor', desc: 'Labor 0.8 hrs', cost: 75 }] },
  { id: 4, customer: 'Ken W.', appliance: 'Bosch fridge — ice maker', tech: 'Mike', status: 'waiting_part', charged: 285, lines: [{ type: 'part', desc: 'Ice maker assembly', cost: 95 }] },
  { id: 5, customer: 'Rachel K.', appliance: 'LG washer — leaking', tech: 'Mike', status: 'scheduled', charged: 240, lines: [] },
  { id: 6, customer: 'Tom B.', appliance: 'GE dryer — no heat', tech: 'Luis', status: 'done', charged: 215, lines: [{ type: 'part', desc: 'Heating element', cost: 62 }] },
  { id: 7, customer: 'Maria S.', appliance: 'Samsung dishwasher — won’t drain', tech: 'Mike', status: 'done', charged: 180, lines: [{ type: 'part', desc: 'Drain pump', cost: 38 }] },
]

const partsOf = (j) => j.lines.filter((l) => l.type === 'part').reduce((s, l) => s + l.cost, 0)
const laborOf = (j) => j.lines.filter((l) => l.type === 'labor').reduce((s, l) => s + l.cost, 0)
const costOf = (j) => j.lines.reduce((s, l) => s + l.cost, 0)
const profitOf = (j) => Number(j.charged || 0) - costOf(j)

export default function ApplianceRepair() {
  const [tab, setTab] = useState('jobs')
  const [jobs, setJobs] = useState(SEED)
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [f, setF] = useState({ customer: '', appliance: '', tech: 'Mike', status: 'scheduled', parts: '', labor: '', charged: '' })
  const [lf, setLf] = useState({ type: 'part', desc: '', cost: '', hours: '' })

  const open = jobs.filter((j) => j.status !== 'done')
  const waiting = jobs.filter((j) => j.status === 'waiting_part')
  const billed = jobs.reduce((s, j) => s + Number(j.charged || 0), 0)
  const totalProfit = jobs.reduce((s, j) => s + profitOf(j), 0)

  const addJob = () => {
    if (!f.customer || !f.appliance) return
    const lines = []
    if (Number(f.parts) > 0) lines.push({ type: 'part', desc: 'Parts', cost: Number(f.parts) })
    if (Number(f.labor) > 0) lines.push({ type: 'labor', desc: 'Labor', cost: Number(f.labor) })
    setJobs([{ id: Date.now(), customer: f.customer, appliance: f.appliance, tech: f.tech, status: f.status, charged: Number(f.charged || 0), lines }, ...jobs])
    setF({ customer: '', appliance: '', tech: 'Mike', status: 'scheduled', parts: '', labor: '', charged: '' })
    setAdding(false)
  }

  const addLine = (id) => {
    let line
    if (lf.type === 'labor') {
      const hrs = Number(lf.hours || 0); if (!hrs) return
      line = { type: 'labor', desc: `Labor ${hrs} hr${hrs === 1 ? '' : 's'}`, cost: +(hrs * LABOR_RATE).toFixed(2) }
    } else {
      const c = Number(lf.cost || 0); if (!lf.desc || !c) return
      line = { type: 'part', desc: lf.desc, cost: c }
    }
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, lines: [...j.lines, line] } : j)))
    setLf({ type: 'part', desc: '', cost: '', hours: '' })
  }

  const tabs = [{ id: 'jobs', label: 'Jobs' }, { id: 'techs', label: 'Techs' }, { id: 'financials', label: 'Financials' }]
  const serif = { fontFamily: 'Cormorant Garamond, serif' }
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '1.5px', color: FAINT }
  const card = { background: CARD, border: '1px solid #DDE3EA', borderRadius: '6px', padding: '16px' }
  const th = { fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '1px', color: FAINT, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #E2E7ED' }
  const td = { fontSize: '12px', color: INK, padding: '9px 10px', borderBottom: '1px solid #EEF1F5', verticalAlign: 'top' }
  const inp = { width: '100%', padding: '9px 10px', fontSize: '13px', fontFamily: "'DM Sans',sans-serif", border: '1px solid #CFD8E2', borderRadius: '5px', background: '#fff', color: INK, outline: 'none' }
  const inpSm = { padding: '8px 9px', fontSize: '12px', fontFamily: "'DM Sans',sans-serif", border: '1px solid #CFD8E2', borderRadius: '5px', background: '#fff', color: INK, outline: 'none' }

  const Kpi = ({ k, v, sub, color }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: INK, lineHeight: 1.1, marginTop: '4px' }}>{v}</div>
      {sub && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: color || MUTED, marginTop: '4px' }}>{sub}</div>}
    </div>
  )
  const Badge = ({ s }) => { const [bg, fg, t] = STATUS[s]; return <span style={{ background: bg, color: fg, fontFamily: 'DM Mono, monospace', fontSize: '10px', padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap' }}>{t}</span> }

  return (
    <>
      <Head>
        <title>{BIZ} — Job Dashboard Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${BG};font-family:'DM Sans',sans-serif}
          .ar-tabs::-webkit-scrollbar{display:none}.ar-tabs{scrollbar-width:none}::placeholder{color:#A8B2BE}`}</style>
      </Head>

      <div style={{ background: ORANGE, color: '#fff', textAlign: 'center', padding: '8px 16px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px' }}>
        SAMPLE DASHBOARD · built for {BIZ} by JK No Jokes Financials
      </div>

      <div style={{ background: DARK }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 18px 0', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔧</span>
            <span style={{ ...serif, fontSize: '20px', fontWeight: 700, color: '#EAF0F6' }}>{BIZ}</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '2px', color: ORANGE }}>JOB DASHBOARD</span>
          </div>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: ORANGE, color: '#fff', textDecoration: 'none', borderRadius: '4px', padding: '7px 12px', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px', whiteSpace: 'nowrap' }}>GET THIS BUILT →</a>
        </div>
        <nav className="ar-tabs" style={{ display: 'flex', gap: '4px', padding: '0 18px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.1)', marginTop: '8px' }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 12px', background: 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === t.id ? '#fff' : '#8C9AAA', fontSize: '11px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em',
              borderBottom: tab === t.id ? `2px solid ${ORANGE}` : '2px solid transparent', marginBottom: '-1px',
            }}>{t.label}</button>
          ))}
        </nav>
      </div>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* JOBS */}
        {tab === 'jobs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k="OPEN JOBS" v={open.length} sub="In the pipeline" />
              <Kpi k="WAITING ON PARTS" v={waiting.length} sub="Need a part ordered" color={ORANGE} />
              <Kpi k="BILLED (MTD)" v={usd0(billed)} sub="Across all jobs" />
              <Kpi k="PROFIT (MTD)" v={usd0(totalProfit)} sub="after parts + labor" color={GREEN} />
            </div>

            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>Job board</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED }}>Tap a job to log parts &amp; labor as you go — cost and profit update live</div>
                </div>
                <button onClick={() => setAdding((a) => !a)} style={{ background: adding ? '#E2E7ED' : ORANGE, color: adding ? MUTED : '#fff', border: 'none', borderRadius: '5px', padding: '9px 14px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>
                  {adding ? '✕ CANCEL' : '+ NEW JOB'}
                </button>
              </div>

              {adding && (
                <div style={{ background: '#F7F9FB', border: '1px dashed #CFD8E2', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                    <input style={inp} placeholder="Customer" value={f.customer} onChange={(e) => setF({ ...f, customer: e.target.value })} />
                    <input style={inp} placeholder="Appliance / problem" value={f.appliance} onChange={(e) => setF({ ...f, appliance: e.target.value })} />
                    <select style={inp} value={f.tech} onChange={(e) => setF({ ...f, tech: e.target.value })}>{TECHS.map((t) => <option key={t}>{t}</option>)}</select>
                    <select style={inp} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{STATUS_OPTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select>
                    <input style={inp} type="number" placeholder="Parts cost $" value={f.parts} onChange={(e) => setF({ ...f, parts: e.target.value })} />
                    <input style={inp} type="number" placeholder="Labor cost $" value={f.labor} onChange={(e) => setF({ ...f, labor: e.target.value })} />
                    <input style={inp} type="number" placeholder="Charged customer $" value={f.charged} onChange={(e) => setF({ ...f, charged: e.target.value })} />
                  </div>
                  <button onClick={addJob} style={{ marginTop: '12px', background: BLUE, color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>ADD JOB →</button>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
                  <thead><tr>
                    {['JOB', 'TECH', 'STATUS', 'PARTS', 'LABOR', 'COST', 'CHARGED', 'PROFIT'].map((h, i) => (
                      <th key={h} style={{ ...th, textAlign: i >= 3 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {jobs.map((j) => {
                      const p = profitOf(j), isOpen = expanded === j.id
                      return (
                        <Fragment key={j.id}>
                          <tr>
                            <td style={{ ...td, cursor: 'pointer' }} onClick={() => { setExpanded(isOpen ? null : j.id); setLf({ type: 'part', desc: '', cost: '', hours: '' }) }}>
                              <div style={{ fontWeight: 600 }}><span style={{ color: ORANGE, marginRight: '4px' }}>{isOpen ? '▾' : '▸'}</span>{j.customer}</div>
                              <div style={{ color: MUTED, fontSize: '11px', paddingLeft: '14px' }}>{j.appliance}</div>
                            </td>
                            <td style={{ ...td, color: MUTED }}>{j.tech}</td>
                            <td style={td}><Badge s={j.status} /></td>
                            <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', color: MUTED }}>{partsOf(j) ? usd0(partsOf(j)) : '—'}</td>
                            <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', color: MUTED }}>{laborOf(j) ? usd0(laborOf(j)) : '—'}</td>
                            <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{usd0(costOf(j))}</td>
                            <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{j.charged ? usd0(j.charged) : '—'}</td>
                            <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontWeight: 600, color: p >= 0 ? GREEN : RED }}>
                              {usd0(p)}{j.status !== 'done' && <span style={{ color: FAINT, fontWeight: 400, fontSize: '9px' }}> est</span>}
                            </td>
                          </tr>
                          {isOpen && (
                            <tr>
                              <td colSpan={8} style={{ padding: '0 10px 14px', background: '#F7F9FB' }}>
                                <div style={{ padding: '12px 14px', border: '1px solid #E2E7ED', borderRadius: '6px', background: '#fff' }}>
                                  <div style={{ ...lbl, marginBottom: '6px' }}>LINE ITEMS — parts &amp; labor on this job</div>
                                  {j.lines.length === 0 && <div style={{ fontSize: '12px', color: MUTED, padding: '4px 0 8px' }}>Nothing logged yet — add the first part or labor below.</div>}
                                  {j.lines.map((l, k) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #EEF1F5' }}>
                                      <span style={{ fontSize: '12px', color: INK }}>
                                        <span style={{ background: l.type === 'labor' ? '#E1ECF5' : '#F0E6DA', color: l.type === 'labor' ? BLUE : '#9A5A24', fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '1px', padding: '2px 6px', borderRadius: '3px', marginRight: '8px' }}>{l.type === 'labor' ? 'LABOR' : 'PART'}</span>
                                        {l.desc}
                                      </span>
                                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: MUTED }}>{usd0(l.cost)}</span>
                                    </div>
                                  ))}
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <select style={inpSm} value={lf.type} onChange={(e) => setLf({ ...lf, type: e.target.value })}>
                                      <option value="part">Add part / item</option>
                                      <option value="labor">Add labor hours</option>
                                    </select>
                                    {lf.type === 'part' ? (
                                      <>
                                        <input style={{ ...inpSm, minWidth: '180px', flex: 1 }} placeholder="Item (e.g. Compressor relay)" value={lf.desc} onChange={(e) => setLf({ ...lf, desc: e.target.value })} />
                                        <input style={{ ...inpSm, width: '110px' }} type="number" placeholder="$ cost" value={lf.cost} onChange={(e) => setLf({ ...lf, cost: e.target.value })} />
                                      </>
                                    ) : (
                                      <>
                                        <input style={{ ...inpSm, width: '120px' }} type="number" placeholder="Hours" value={lf.hours} onChange={(e) => setLf({ ...lf, hours: e.target.value })} />
                                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: MUTED }}>× ${LABOR_RATE}/hr = {usd0((Number(lf.hours) || 0) * LABOR_RATE)}</span>
                                      </>
                                    )}
                                    <button onClick={() => addLine(j.id)} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: '5px', padding: '8px 16px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>+ ADD</button>
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
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: FAINT, marginTop: '10px' }}>
                Tap a job to expand it, then add the parts you bought and the hours you put in. Every dollar rolls into job profit — and your books.
              </div>
            </div>
          </div>
        )}

        {/* TECHS */}
        {tab === 'techs' && (
          <div style={card}>
            <div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK, marginBottom: '12px' }}>By technician</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                <thead><tr>{['TECH', 'OPEN JOBS', 'BILLED', 'PROFIT'].map((h, i) => <th key={h} style={{ ...th, textAlign: i ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {TECHS.filter((t) => t !== 'Unassigned').map((t) => {
                    const tj = jobs.filter((j) => j.tech === t)
                    const ob = tj.filter((j) => j.status !== 'done').length
                    const bl = tj.reduce((s, j) => s + Number(j.charged || 0), 0)
                    const pr = tj.reduce((s, j) => s + profitOf(j), 0)
                    return (
                      <tr key={t}>
                        <td style={{ ...td, fontWeight: 600 }}>{t}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{ob}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{usd0(bl)}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', color: GREEN, fontWeight: 600 }}>{usd0(pr)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FINANCIALS */}
        {tab === 'financials' && (() => {
          const parts = jobs.reduce((s, j) => s + partsOf(j), 0)
          const labor = jobs.reduce((s, j) => s + laborOf(j), 0)
          const exp = [['Truck / fuel', 1850], ['Tools & equipment', 720], ['Insurance', 540], ['Phone & software', 180]]
          const totalExp = exp.reduce((s, [, v]) => s + v, 0)
          const gross = billed - parts - labor
          const net = gross - totalExp
          const Row = ({ k, v, neg, bold, color }) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 2px', borderBottom: '1px solid #EEF1F5' }}>
              <span style={{ fontSize: '13px', color: INK, fontWeight: bold ? 600 : 400 }}>{k}</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: color || (neg ? RED : INK), fontWeight: bold ? 600 : 400 }}>{neg ? '−' : ''}{usd0(v)}</span>
            </div>
          )
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={card}>
                <div style={{ ...lbl, marginBottom: '6px' }}>PROFIT &amp; LOSS — THIS MONTH</div>
                <Row k="Revenue (jobs billed)" v={billed} color={GREEN} bold />
                <Row k="Parts" v={parts} neg />
                <Row k="Labor paid to techs" v={labor} neg />
                <Row k="Gross Profit" v={gross} color={GREEN} bold />
                {exp.map(([k, v]) => <Row key={k} k={k} v={v} neg />)}
                <Row k="Overhead" v={totalExp} neg bold />
              </div>
              <div style={{ background: '#EAF3EE', border: '1px solid #CBE0D4', borderRadius: '6px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', letterSpacing: '1px', color: GREEN, fontWeight: 600 }}>NET PROFIT</span>
                <span style={{ ...serif, fontSize: '24px', fontWeight: 700, color: GREEN }}>{usd0(net)}</span>
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: FAINT, textAlign: 'center' }}>
                Built straight from your jobs — no separate bookkeeping, no shoebox of receipts.
              </div>
            </div>
          )
        })()}

        {/* CTA */}
        <div style={{ marginTop: '28px', textAlign: 'center', background: CARD, border: '1px solid #DDE3EA', borderRadius: '10px', padding: '30px' }}>
          <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: INK }}>Want this for your shop?</div>
          <p style={{ color: MUTED, fontSize: '14px', margin: '8px auto 18px', maxWidth: '470px', lineHeight: 1.6 }}>
            This is a sample. I'd build you the real thing — every job, tech, part, and dollar in one place, so you always know what each job actually made you.
          </p>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: BLUE, color: '#fff', textDecoration: 'none', padding: '14px 30px', borderRadius: '4px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '2px' }}>BOOK A FREE CALL →</a>
          <div style={{ marginTop: '14px', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: FAINT }}>Jonathan Katz · JK No Jokes Financials · jk@jknojokes.com</div>
        </div>
      </div>
    </>
  )
}

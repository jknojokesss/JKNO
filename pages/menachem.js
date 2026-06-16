import { useState, Fragment } from 'react'
import Head from 'next/head'

const INDIGO = '#3A2F6F', TEAL = '#0FB5A5', INK = '#211E33', BG = '#F4F3FB', MUTED = '#6E6986'
const BORDER = '#E7E4F2', AMBER = '#E0871E', RED = '#D2503B', GREEN = '#1E9E6A'
const BIZ = "Menachem's Dashboard"
const COMM = 0.12 // residual: rep keeps 12% of client billing every month

const STAGES = [
  { id: 'new', label: 'New', color: '#8B86A3' },
  { id: 'contacted', label: 'Contacted', color: AMBER },
  { id: 'quote', label: 'Quote Sent', color: '#2C7BC9' },
  { id: 'proposal', label: 'Proposal', color: '#7A3CC9' },
  { id: 'verbal', label: 'Verbal Yes', color: TEAL },
  { id: 'won', label: 'Won 🎉', color: GREEN },
  { id: 'lost', label: 'Lost', color: RED },
]
const SG = Object.fromEntries(STAGES.map(s => [s.id, s]))
const ACTIVE = ['new', 'contacted', 'quote', 'proposal', 'verbal']
const PROVIDERS = ['ADP', 'Paychex', 'Gusto', 'QuickBooks Payroll', 'In-house / manual', 'Heartland', 'Other']

const FEEDBACK = [
  { id: 'positive', label: '😊 Positive', color: GREEN },
  { id: 'neutral', label: '😐 Neutral', color: AMBER },
  { id: 'negative', label: '😟 Negative', color: RED },
]
const FB = Object.fromEntries(FEEDBACK.map(f => [f.id, f]))

const money = (n) => '$' + Math.round(n).toLocaleString()
const uid = () => Math.random().toString(36).slice(2, 9)
const today = new Date()
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }
const fmtDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })
const since = (s) => Math.round((today - new Date(s + 'T00:00:00')) / 86400000)

const SEED_LEADS = [
  { id: uid(), company: 'Greenwald Construction', emp: 42, provider: 'ADP', mrr: 1450, stage: 'proposal', next: 'Send final proposal — they hate ADP fees', notes: 'Switching pain: ADP nickel-and-dimes them. Biweekly, 42 on payroll + 6 1099s.' },
  { id: uid(), company: 'Bais Yaakov of Lakewood', emp: 60, provider: 'In-house / manual', mrr: 1800, stage: 'quote', next: 'Follow up on the quote with the office manager', notes: 'Doing payroll by hand in Excel. Huge time sink for them. Decision by the board.' },
  { id: uid(), company: 'Tov Catering', emp: 18, provider: 'Paychex', mrr: 640, stage: 'contacted', next: 'Book the discovery call', notes: 'Seasonal swings, lots of part-timers. Paychex contract up in 2 months.' },
  { id: uid(), company: 'RxCare Pharmacy', emp: 12, provider: 'QuickBooks Payroll', mrr: 430, stage: 'new', next: 'First call — referred by Schwartz CPA', notes: 'Wants real support, QB payroll has none.' },
  { id: uid(), company: 'Summit HVAC', emp: 25, provider: 'Gusto', mrr: 820, stage: 'verbal', next: 'Send paperwork — verbal yes on Tuesday!', notes: 'Wants workers comp + time tracking bundled. Hot.' },
]

const SEED_CLIENTS = [
  { id: uid(), company: 'Apex Staffing', emp: 50, mrr: 2100, since: '2024-03-01', lastCheckIn: daysAgo(8), feedback: 'positive', notes: 'Anchor account. Loves the per-employee pricing. Upsell 401k next.' },
  { id: uid(), company: 'Klein Medical', emp: 15, mrr: 720, since: '2024-09-15', lastCheckIn: daysAgo(21), feedback: 'positive', notes: 'Added benefits admin in Q1. Happy.' },
  { id: uid(), company: "Mendel's Bakery", emp: 22, mrr: 980, since: '2024-06-10', lastCheckIn: daysAgo(46), feedback: 'negative', notes: '⚠️ Had a tax-filing hiccup last quarter. Owner was hot. NEEDS a check-in call — churn risk.' },
  { id: uid(), company: 'Forest Ave Realty', emp: 8, mrr: 400, since: '2025-01-20', lastCheckIn: daysAgo(38), feedback: 'neutral', notes: 'Quiet account. Overdue for a touch.' },
  { id: uid(), company: 'Toms River Dental', emp: 11, mrr: 560, since: '2024-11-05', lastCheckIn: daysAgo(12), feedback: 'positive', notes: 'Referral machine — sent us 2 deals.' },
]

const SEED_PARTNERS = [
  { id: uid(), name: 'Schwartz & Co. CPA', type: 'CPA firm', referred: 5, closed: 3, notes: 'Best source. Sends payroll-shopping clients every tax season.' },
  { id: uid(), name: 'BenefitsBridge', type: 'Insurance broker', referred: 3, closed: 1, notes: 'Bundles payroll with their benefits deals.' },
  { id: uid(), name: 'Lakewood Business Network', type: 'Networking group', referred: 4, closed: 2, notes: 'Monthly breakfast. Warm intros.' },
]

// recent signings drive the upfront bonus (1 month of billing per close)
const SIGNINGS = [
  { company: 'Apex Staffing', month: 'Mar', bonus: 2100 },
  { company: 'Toms River Dental', month: 'Nov', bonus: 560 },
  { company: 'Klein Medical', month: 'Sep', bonus: 720 },
  { company: "Mendel's Bakery", month: 'Jun', bonus: 980 },
]

export default function Menachem() {
  const [tab, setTab] = useState('leads')
  const [leads, setLeads] = useState(SEED_LEADS)
  const [clients, setClients] = useState(SEED_CLIENTS)
  const [partners, setPartners] = useState(SEED_PARTNERS)
  const [expanded, setExpanded] = useState(null)
  const [adding, setAdding] = useState(false)
  const [lf, setLf] = useState({ company: '', emp: '', provider: 'ADP', mrr: '' })
  const [addingP, setAddingP] = useState(false)
  const [pf, setPf] = useState({ name: '', type: 'CPA firm' })

  // ---- leads ----
  const setLeadStage = (id, stage) => setLeads(leads.map(l => l.id === id ? { ...l, stage } : l))
  const setLeadField = (id, f, v) => setLeads(leads.map(l => l.id === id ? { ...l, [f]: v } : l))
  const addLead = () => {
    if (!lf.company.trim()) return
    setLeads([{ id: uid(), company: lf.company.trim(), emp: Number(lf.emp) || 0, provider: lf.provider, mrr: Number(lf.mrr) || 0, stage: 'new', next: '', notes: '' }, ...leads])
    setLf({ company: '', emp: '', provider: 'ADP', mrr: '' }); setAdding(false)
  }
  const activeLeads = leads.filter(l => ACTIVE.includes(l.stage))
  const pipelineMrr = activeLeads.reduce((s, l) => s + (l.mrr || 0), 0)
  const quotesOut = activeLeads.filter(l => ['quote', 'proposal', 'verbal'].includes(l.stage)).length

  // ---- clients ----
  const setClientFB = (id, fb) => setClients(clients.map(c => c.id === id ? { ...c, feedback: fb } : c))
  const setClientField = (id, f, v) => setClients(clients.map(c => c.id === id ? { ...c, [f]: v } : c))
  const checkIn = (id) => setClients(clients.map(c => c.id === id ? { ...c, lastCheckIn: today.toISOString().slice(0, 10) } : c))
  const bookMrr = clients.reduce((s, c) => s + c.mrr, 0)
  const atRisk = clients.filter(c => c.feedback === 'negative' || since(c.lastCheckIn) > 35)

  // ---- partners ----
  const addPartner = () => {
    if (!pf.name.trim()) return
    setPartners([...partners, { id: uid(), name: pf.name.trim(), type: pf.type, referred: 0, closed: 0, notes: '' }])
    setPf({ name: '', type: 'CPA firm' }); setAddingP(false)
  }
  const bump = (id, f, d) => setPartners(partners.map(p => p.id === id ? { ...p, [f]: Math.max(0, p[f] + d) } : p))
  const totalReferred = partners.reduce((s, p) => s + p.referred, 0)
  const totalClosed = partners.reduce((s, p) => s + p.closed, 0)

  // ---- commissions ----
  const monthlyResidual = bookMrr * COMM
  const annualResidual = monthlyResidual * 12
  const bonusYtd = SIGNINGS.reduce((s, x) => s + x.bonus * COMM, 0)

  const card = { background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px' }
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#A6A1BC' }
  const inp = { padding: '11px 13px', fontSize: '14px', border: `1px solid ${BORDER}`, borderRadius: '9px', background: BG, color: INK, outline: 'none' }

  const KPI = ({ k, v, sub, accent }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px', padding: '16px 18px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '30px', fontWeight: 600, color: accent || INK, lineHeight: 1.1, marginTop: '4px' }}>{v}</div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#B6B1C9', marginTop: '2px' }}>{sub}</div>
    </div>
  )

  const Pill = ({ value, opts, map, onChange }) => (
    <select value={value} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); onChange(e.target.value) }}
      style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', padding: '6px 26px 6px 12px', borderRadius: '20px', border: 'none',
        fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 600, letterSpacing: '0.3px', color: '#fff',
        background: `${map[value].color} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 3.5L5 6.5L8 3.5' stroke='white' stroke-width='1.4' fill='none'/></svg>") no-repeat right 9px center` }}>
      {opts.map(o => <option key={o.id} value={o.id} style={{ color: INK, background: '#fff' }}>{o.label}</option>)}
    </select>
  )

  const TABS = [
    { id: 'leads', label: 'Leads' },
    { id: 'clients', label: 'Clients' },
    { id: 'commissions', label: 'Commissions' },
    { id: 'partners', label: 'Referral Partners' },
  ]

  return (
    <>
      <Head>
        <title>{BIZ}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${BG};font-family:'Inter',sans-serif}::placeholder{color:#B6B1C9}`}</style>
      </Head>

      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '0 18px 60px' }}>
        {/* Header */}
        <div style={{ background: INDIGO, borderRadius: '0 0 20px 20px', padding: '26px 26px 22px', margin: '0 -18px 22px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '3px', color: TEAL }}>PAYROLL SALES · BUILT FOR MENACHEM</div>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '30px', fontWeight: 700, marginTop: '4px', letterSpacing: '-0.5px' }}>{BIZ}</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', fontWeight: 600, color: TEAL }}>{money(monthlyResidual)}/mo</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#B7B1D6', letterSpacing: '1px' }}>YOUR RESIDUAL INCOME</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setExpanded(null) }}
              style={{ padding: '9px 16px', borderRadius: '20px', border: `1px solid ${tab === t.id ? INDIGO : BORDER}`,
                background: tab === t.id ? INDIGO : '#fff', color: tab === t.id ? '#fff' : MUTED,
                fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '0.5px', cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ====== LEADS ====== */}
        {tab === 'leads' && (
          <>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <KPI k="ACTIVE LEADS" v={activeLeads.length} sub="in the pipeline" />
              <KPI k="PIPELINE / MO" v={money(pipelineMrr)} sub="if they all sign" accent={TEAL} />
              <KPI k="QUOTES OUT" v={quotesOut} sub="awaiting a yes" />
              <KPI k="EXPECTED COMM" v={money(pipelineMrr * COMM)} sub="residual / mo" accent={INDIGO} />
            </div>

            {!adding ? (
              <button onClick={() => setAdding(true)} style={{ width: '100%', background: INDIGO, color: '#fff', border: 'none', borderRadius: '11px', padding: '13px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', marginBottom: '16px' }}>+ ADD A LEAD</button>
            ) : (
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...lbl, marginBottom: '12px' }}>NEW LEAD</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input value={lf.company} onChange={e => setLf({ ...lf, company: e.target.value })} placeholder="Company *" style={{ ...inp, flex: 2, minWidth: '160px' }} />
                  <input value={lf.emp} onChange={e => setLf({ ...lf, emp: e.target.value })} type="number" placeholder="# employees" style={{ ...inp, flex: 1, minWidth: '110px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <select value={lf.provider} onChange={e => setLf({ ...lf, provider: e.target.value })} style={{ ...inp, flex: 1, minWidth: '150px' }}>
                    {PROVIDERS.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <input value={lf.mrr} onChange={e => setLf({ ...lf, mrr: e.target.value })} type="number" placeholder="Est. $ / mo billing" style={{ ...inp, flex: 1, minWidth: '150px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => setAdding(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '11px', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: MUTED, cursor: 'pointer' }}>CANCEL</button>
                  <button onClick={addLead} style={{ flex: 2, background: TEAL, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' }}>+ ADD LEAD</button>
                </div>
              </div>
            )}

            {leads.map(l => {
              const open = expanded === l.id
              return (
                <div key={l.id} style={{ ...card, padding: 0, marginBottom: '12px', overflow: 'hidden', borderColor: open ? INDIGO : BORDER }}>
                  <div onClick={() => setExpanded(open ? null : l.id)} style={{ padding: '15px 18px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '19px', fontWeight: 600, color: INK }}>{l.company}</div>
                        <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>
                          👥 {l.emp} employees · switching from <strong style={{ color: l.provider.includes('house') ? AMBER : INK }}>{l.provider}</strong>
                          {l.mrr > 0 && <span style={{ color: TEAL, fontWeight: 600 }}> · {money(l.mrr)}/mo</span>}
                        </div>
                      </div>
                      <Pill value={l.stage} opts={STAGES} map={SG} onChange={(v) => setLeadStage(l.id, v)} />
                    </div>
                    {l.next && !open && (
                      <div style={{ marginTop: '10px', fontSize: '13px', color: INK, background: '#F6F4FC', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 11px' }}>
                        🎯 <strong>Next:</strong> {l.next}
                      </div>
                    )}
                  </div>
                  {open && (
                    <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${BG}` }}>
                      <div style={{ ...lbl, margin: '14px 0 6px' }}>NEXT STEP</div>
                      <input value={l.next} onChange={e => setLeadField(l.id, 'next', e.target.value)} placeholder="What's the next move on this deal?" style={{ ...inp, width: '100%' }} />
                      <div style={{ ...lbl, margin: '14px 0 6px' }}>NOTES</div>
                      <textarea value={l.notes} onChange={e => setLeadField(l.id, 'notes', e.target.value)} rows={2} placeholder="Switching pain, decision-maker, pricing…" style={{ ...inp, width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* ====== CLIENTS ====== */}
        {tab === 'clients' && (
          <>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <KPI k="CLIENTS" v={clients.length} sub="on the books" />
              <KPI k="BOOK / MO" v={money(bookMrr)} sub="total billing" accent={TEAL} />
              <KPI k="EMPLOYEES" v={clients.reduce((s, c) => s + c.emp, 0)} sub="under management" />
              <KPI k="AT RISK" v={atRisk.length} sub="need attention" accent={atRisk.length ? RED : GREEN} />
            </div>

            {atRisk.length > 0 && (
              <div style={{ ...card, marginBottom: '16px', background: '#FCF1EF', borderColor: '#F2D2CB' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: RED, marginBottom: '10px' }}>⚠️ ACCOUNTS TO SAVE — bad feedback or overdue check-in</div>
                {atRisk.map(c => (
                  <div key={c.id} onClick={() => setExpanded(c.id)} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F2D2CB', cursor: 'pointer', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontWeight: 600, color: INK }}>{c.company}</span>
                    <span style={{ fontSize: '13px', color: RED }}>{c.feedback === 'negative' ? 'Negative feedback' : `Last check-in ${since(c.lastCheckIn)}d ago`}</span>
                  </div>
                ))}
              </div>
            )}

            {clients.map(c => {
              const open = expanded === c.id
              const overdue = since(c.lastCheckIn) > 35
              return (
                <div key={c.id} style={{ ...card, padding: 0, marginBottom: '12px', overflow: 'hidden', borderColor: open ? INDIGO : (c.feedback === 'negative' ? '#F2D2CB' : BORDER) }}>
                  <div onClick={() => setExpanded(open ? null : c.id)} style={{ padding: '15px 18px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '19px', fontWeight: 600, color: INK }}>{c.company}</div>
                        <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>
                          👥 {c.emp} · <span style={{ color: TEAL, fontWeight: 600 }}>{money(c.mrr)}/mo</span> · client since {fmtDate(c.since)}
                        </div>
                      </div>
                      <Pill value={c.feedback} opts={FEEDBACK} map={FB} onChange={(v) => setClientFB(c.id, v)} />
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace', color: overdue ? RED : MUTED }}>
                        🕑 Last check-in: {fmtDate(c.lastCheckIn)} ({since(c.lastCheckIn)}d ago){overdue ? ' — overdue' : ''}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); checkIn(c.id) }} style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: '20px', padding: '5px 13px', fontFamily: 'DM Mono, monospace', fontSize: '11px', cursor: 'pointer' }}>✓ Checked in today</button>
                    </div>
                  </div>
                  {open && (
                    <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${BG}` }}>
                      <div style={{ ...lbl, margin: '14px 0 6px' }}>ACCOUNT NOTES</div>
                      <textarea value={c.notes} onChange={e => setClientField(c.id, 'notes', e.target.value)} rows={2} style={{ ...inp, width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />
                      <div style={{ fontSize: '12px', color: MUTED, marginTop: '10px' }}>Your residual on this account: <strong style={{ color: INDIGO }}>{money(c.mrr * COMM)}/mo</strong></div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* ====== COMMISSIONS ====== */}
        {tab === 'commissions' && (
          <>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <KPI k="MONTHLY RESIDUAL" v={money(monthlyResidual)} sub={`${COMM * 100}% of your book`} accent={TEAL} />
              <KPI k="ANNUAL RESIDUAL" v={money(annualResidual)} sub="recurring, hands-off" accent={INDIGO} />
              <KPI k="SIGNING BONUSES" v={money(bonusYtd)} sub="from new deals (YTD)" />
              <KPI k="TOTAL THIS YEAR" v={money(annualResidual + bonusYtd)} sub="residual + bonuses" accent={GREEN} />
            </div>

            <div style={{ ...card, marginBottom: '16px' }}>
              <div style={{ ...lbl, marginBottom: '14px' }}>RESIDUAL BY CLIENT — {COMM * 100}% of monthly billing</div>
              {clients.slice().sort((a, b) => b.mrr - a.mrr).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${BG}` }}>
                  <span style={{ flex: 1, fontWeight: 500, color: INK, fontSize: '14px' }}>{c.company}</span>
                  <span style={{ fontSize: '12px', color: MUTED, fontFamily: 'DM Mono, monospace' }}>{money(c.mrr)}/mo billing</span>
                  <div style={{ width: '90px', textAlign: 'right', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, color: INDIGO }}>{money(c.mrr * COMM)}</div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', marginTop: '4px' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', color: MUTED }}>TOTAL / MONTH</span>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 700, color: TEAL }}>{money(monthlyResidual)}</span>
              </div>
            </div>

            <div style={{ ...card }}>
              <div style={{ ...lbl, marginBottom: '12px' }}>SIGNING BONUSES — new deals closed (1 mo billing × {COMM * 100}%)</div>
              {SIGNINGS.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${BG}`, fontSize: '14px' }}>
                  <span style={{ color: INK }}><span style={{ color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '11px', marginRight: '8px' }}>{s.month}</span>{s.company}</span>
                  <span style={{ fontWeight: 600, color: GREEN }}>+{money(s.bonus * COMM)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ====== PARTNERS ====== */}
        {tab === 'partners' && (
          <>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <KPI k="PARTNERS" v={partners.length} sub="feeding you deals" />
              <KPI k="REFERRALS IN" v={totalReferred} sub="all-time" accent={INDIGO} />
              <KPI k="CLOSED FROM THEM" v={totalClosed} sub={`${totalReferred ? Math.round(totalClosed / totalReferred * 100) : 0}% close rate`} accent={TEAL} />
            </div>

            <p style={{ fontSize: '13px', color: MUTED, marginBottom: '14px', lineHeight: 1.5 }}>
              The CPAs, brokers, and networkers who send you business. <strong style={{ color: INK }}>Stay top of mind with these and your pipeline fills itself.</strong>
            </p>

            {!addingP ? (
              <button onClick={() => setAddingP(true)} style={{ width: '100%', background: INDIGO, color: '#fff', border: 'none', borderRadius: '11px', padding: '13px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', marginBottom: '16px' }}>+ ADD A PARTNER</button>
            ) : (
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...lbl, marginBottom: '12px' }}>NEW PARTNER</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input value={pf.name} onChange={e => setPf({ ...pf, name: e.target.value })} placeholder="Partner name *" style={{ ...inp, flex: 2, minWidth: '160px' }} />
                  <select value={pf.type} onChange={e => setPf({ ...pf, type: e.target.value })} style={{ ...inp, flex: 1, minWidth: '140px' }}>
                    {['CPA firm', 'Insurance broker', 'Bookkeeper', 'Networking group', 'Bank', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => setAddingP(false)} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '11px', fontFamily: 'DM Mono, monospace', fontSize: '12px', color: MUTED, cursor: 'pointer' }}>CANCEL</button>
                  <button onClick={addPartner} style={{ flex: 2, background: TEAL, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' }}>+ ADD PARTNER</button>
                </div>
              </div>
            )}

            {partners.map(p => (
              <div key={p.id} style={{ ...card, marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 600, color: INK }}>{p.name}</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px', color: MUTED, textTransform: 'uppercase', marginTop: '3px' }}>{p.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 600, color: TEAL }}>{p.closed}/{p.referred}</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: '#B6B1C9', letterSpacing: '1px' }}>CLOSED / REFERRED</div>
                  </div>
                </div>
                {p.notes && <div style={{ fontSize: '13px', color: MUTED, marginTop: '10px' }}>{p.notes}</div>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <button onClick={() => bump(p.id, 'referred', 1)} style={{ background: '#F2F0FA', color: INDIGO, border: 'none', borderRadius: '20px', padding: '6px 13px', fontFamily: 'DM Mono, monospace', fontSize: '11px', cursor: 'pointer' }}>+ referral</button>
                  <button onClick={() => bump(p.id, 'closed', 1)} style={{ background: '#E5F7F3', color: GREEN, border: 'none', borderRadius: '20px', padding: '6px 13px', fontFamily: 'DM Mono, monospace', fontSize: '11px', cursor: 'pointer' }}>+ closed</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* CTA */}
        <div style={{ background: INDIGO, borderRadius: '16px', padding: '26px', marginTop: '26px', color: '#fff' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: TEAL, marginBottom: '8px' }}>WHY WE'D MAKE A GREAT TEAM</div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '19px', fontWeight: 600, lineHeight: 1.45, marginBottom: '12px' }}>
            You talk to small businesses with messy books all day. I clean them up.
          </div>
          <p style={{ fontSize: '14px', color: '#D5D0EC', lineHeight: 1.6, marginBottom: '14px' }}>
            Every payroll prospect you meet has the same problem behind the scenes — their books are a mess.
            Send them my way and I'll get them sorted; I'll send the bookkeeping clients who are shopping for payroll straight back to you.
            And this dashboard? I build it, I keep it live and accurate, you just sell. Two-way street.
          </p>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: '#fff' }}>— Jonathan Katz · <span style={{ color: TEAL }}>JK No Jokes Financials</span></div>
        </div>
      </div>
    </>
  )
}

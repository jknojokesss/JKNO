import { useState } from 'react'
import Head from 'next/head'

// ─────────────────────────────────────────────────────────────────────────
// Config-driven sample dashboard — one polished template, one config per
// industry (see lib/industryDemos.js). Same idea as the bespoke demos:
// 100% hardcoded sample data, no backend, everything interactive via state.
// ─────────────────────────────────────────────────────────────────────────

const BOOK = 'https://calendly.com/jk-jknojokes/30min'
const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const usd0 = (n) => '$' + Math.round(Math.abs(n)).toLocaleString('en-US')

const STATUS_SETS = {
  jobs: {
    scheduled: ['#E1ECF5', '#2C6E9B', 'Scheduled'],
    in_progress: ['#FFF3D6', '#9A7B1E', 'In progress'],
    waiting: ['#FBE7D3', '#B5651D', 'On hold'],
    done: ['#E1F0E6', '#2E7D52', 'Completed'],
  },
  orders: {
    pending: ['#FBE7D3', '#B5651D', 'Pending'],
    packed: ['#E1ECF5', '#2C6E9B', 'Ready'],
    shipped: ['#FFF3D6', '#9A7B1E', 'In transit'],
    delivered: ['#E1F0E6', '#2E7D52', 'Delivered'],
  },
  clients: {
    active: ['#E1F0E6', '#2E7D52', 'Active'],
    past_due: ['#F9DFDA', '#C0492F', 'Past due'],
    paused: ['#EDEDF0', '#6B7280', 'Paused'],
  },
}

export default function IndustryDemo({ cfg }) {
  const { biz, industry, emoji, theme, months, revCats, expLines, extraKpi, insights, ops } = cfg
  const [tab, setTab] = useState('dash')
  const [mi, setMi] = useState(11)
  const [openLine, setOpenLine] = useState(null)
  const [rows, setRows] = useState(ops.rows)
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ a: '', chg: '', cost: '' })

  const rev = months.rev, exp = months.exp
  const profit = rev.map((r, i) => r - exp[i])
  const maxRev = Math.max(...rev)
  // Revenue/expense lines are latest-month figures; scale to the selected month.
  const rScale = rev[mi] / rev[11], eScale = exp[mi] / exp[11]
  const margin = Math.round((profit[mi] / rev[mi]) * 100)

  const D = theme.dark, A = theme.accent
  const INK = '#1F2A36', MUTED = '#647082', FAINT = '#97A3B2'
  const GREEN = '#2E7D52', RED = '#C0492F'
  const serif = { fontFamily: 'Cormorant Garamond, serif' }
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '1.5px', color: FAINT }
  const card = { background: '#fff', border: '1px solid #DDE3EA', borderRadius: '6px', padding: '16px' }
  const th = { fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '1px', color: FAINT, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #E2E7ED' }
  const td = { fontSize: '12px', color: INK, padding: '9px 10px', borderBottom: '1px solid #EEF1F5', verticalAlign: 'top' }

  const Kpi = ({ k, v, sub, color }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...serif, fontSize: '26px', fontWeight: 600, color: INK, lineHeight: 1.1, marginTop: '4px' }}>{v}</div>
      {sub && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: color || MUTED, marginTop: '4px' }}>{sub}</div>}
    </div>
  )
  const Badge = ({ set, s }) => {
    const [bg, fg, t] = STATUS_SETS[set][s]
    return <span style={{ background: bg, color: fg, fontFamily: 'DM Mono, monospace', fontSize: '10px', padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap' }}>{t}</span>
  }
  const StatusSelect = ({ set, row }) => (
    <select
      value={row.s}
      onChange={(e) => setRows((prev) => prev.map((r) => (r === row ? { ...r, s: e.target.value } : r)))}
      style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', padding: '3px 6px', border: '1px solid #CFD8E2', borderRadius: '4px', background: '#fff', color: INK, cursor: 'pointer' }}>
      {Object.entries(STATUS_SETS[set]).map(([v, [, , t]]) => <option key={v} value={v}>{t}</option>)}
    </select>
  )

  const tabs = [
    { id: 'dash', label: 'Dashboard' },
    { id: 'pnl', label: 'P&L' },
    { id: 'ops', label: ops.label },
  ]

  const totalRevCats = revCats.reduce((s, [, a]) => s + a, 0)

  return (
    <>
      <Head>
        <title>{`${biz} — ${industry} Dashboard Demo`}</title>
        <meta name="description" content={`Live sample financial dashboard for a ${industry.toLowerCase()} business — built by JK No Jokes Financials.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#EEF1F5;font-family:'DM Sans',sans-serif}
          .id-tabs::-webkit-scrollbar{display:none}.id-tabs{scrollbar-width:none}::placeholder{color:#A8B2BE}
          .id-shell{display:flex;align-items:flex-start;min-height:100vh}
          .id-side{width:236px;flex-shrink:0;position:sticky;top:0;height:100vh;display:flex;flex-direction:column}
          .id-topbar{display:none}
          .id-main{flex:1;width:100%;max-width:1060px;margin:0 auto;padding:22px 22px 56px}
          @media(max-width:860px){.id-shell{display:block}.id-side{display:none}.id-topbar{display:block}.id-main{padding:18px 14px 48px}}`}</style>
      </Head>

      <div style={{ background: A, color: '#fff', textAlign: 'center', padding: '8px 16px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px' }}>
        SAMPLE DASHBOARD · built for a {industry.toLowerCase()} business by JK No Jokes Financials
      </div>

      <div className="id-shell">
        {/* SIDEBAR — desktop */}
        <aside className="id-side" style={{ background: D }}>
          <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '26px', marginBottom: '10px' }}>{emoji}</div>
            <div style={{ ...serif, fontSize: '21px', fontWeight: 700, color: '#EAF0F6', lineHeight: 1.15 }}>{biz}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '2px', color: A, marginTop: '6px' }}>{industry.toUpperCase()}</div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', padding: '14px 10px', gap: '2px', flex: 1 }}>
            {tabs.map((t) => {
              const on = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', width: '100%',
                  padding: '11px 14px', borderRadius: '6px', cursor: 'pointer',
                  background: on ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: 'none', borderLeft: on ? `2px solid ${A}` : '2px solid transparent',
                  color: on ? '#fff' : '#8C9AAA', fontSize: '13px', fontFamily: "'DM Sans',sans-serif", fontWeight: on ? 600 : 400,
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: on ? A : '#4A566B' }} />{t.label}
                </button>
              )
            })}
          </nav>
          <div style={{ padding: '16px 16px 22px' }}>
            <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', background: A, color: '#fff', textDecoration: 'none', borderRadius: '6px', padding: '11px 12px', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px' }}>GET THIS BUILT →</a>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '1px', color: '#5A6478', textAlign: 'center', marginTop: '12px', lineHeight: 1.5 }}>SAMPLE DATA · NO LOGIN<br />BY JK NO JOKES FINANCIALS</div>
          </div>
        </aside>

        {/* TOP BAR — mobile */}
        <div className="id-topbar" style={{ background: D }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', minWidth: 0 }}>
              <span style={{ fontSize: '18px' }}>{emoji}</span>
              <span style={{ ...serif, fontSize: '18px', fontWeight: 700, color: '#EAF0F6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{biz}</span>
            </div>
            <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: A, color: '#fff', textDecoration: 'none', borderRadius: '4px', padding: '7px 11px', fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '1px', whiteSpace: 'nowrap' }}>GET THIS BUILT →</a>
          </div>
          <nav className="id-tabs" style={{ display: 'flex', gap: '4px', padding: '0 16px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.1)', marginTop: '10px' }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '9px 12px', background: 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                color: tab === t.id ? '#fff' : '#8C9AAA', fontSize: '11px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em',
                borderBottom: tab === t.id ? `2px solid ${A}` : '2px solid transparent', marginBottom: '-1px',
              }}>{t.label}</button>
            ))}
          </nav>
        </div>

        <div className="id-main">

        {/* DASHBOARD */}
        {tab === 'dash' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Kpi k={`REVENUE (${MONTHS[mi].toUpperCase()})`} v={usd0(rev[mi])} sub={mi > 0 ? `${rev[mi] >= rev[mi - 1] ? '▲' : '▼'} vs ${MONTHS[mi - 1]}` : 'Start of period'} color={mi > 0 && rev[mi] < rev[mi - 1] ? RED : GREEN} />
              <Kpi k="EXPENSES" v={usd0(exp[mi])} sub="All spend, categorized" />
              <Kpi k="NET PROFIT" v={usd0(profit[mi])} sub={`${margin}% margin`} color={GREEN} />
              <Kpi k={extraKpi.k} v={extraKpi.v} sub={extraKpi.sub} color={A} />
            </div>

            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>Revenue, last 12 months</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED }}>Tap a month — every number on this page updates</div>
                </div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED }}>
                  {MONTHS[mi]}: <span style={{ color: INK }}>{usd0(rev[mi])}</span> rev · <span style={{ color: GREEN }}>{usd0(profit[mi])}</span> profit
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '150px', marginTop: '18px' }}>
                {rev.map((r, i) => {
                  const pShare = Math.max(0.04, profit[i] / r)
                  const sel = i === mi
                  return (
                    <button key={i} onClick={() => setMi(i)} title={`${MONTHS[i]}: ${usd0(r)} revenue · ${usd0(profit[i])} profit`} style={{ flex: 1, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                      <div style={{ width: '100%', height: `${Math.max(10, (r / maxRev) * 100)}%`, display: 'flex', flexDirection: 'column', borderRadius: '3px 3px 0 0', overflow: 'hidden' }}>
                        <div style={{ flex: 1 - pShare, background: sel ? `${A}44` : '#E2E7ED', transition: 'background 0.15s' }} />
                        <div style={{ flex: pShare, background: sel ? A : '#B9C4D0', transition: 'background 0.15s' }} />
                      </div>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', color: sel ? INK : FAINT, marginTop: '5px', textAlign: 'center', width: '100%', fontWeight: sel ? 700 : 400 }}>{MONTHS[i]}</div>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'flex-end' }}>
                {[[A, 'PROFIT'], [`${A}44`, 'EXPENSES']].map(([c, t], i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '1px', color: FAINT }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: c, display: 'inline-block' }} />{t}
                  </span>
                ))}
              </div>
            </div>

            {insights && (
              <div style={{ ...card, borderLeft: `3px solid ${A}`, background: '#FDFCFA' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ color: A, fontSize: '16px' }}>◈</span>
                  <div>
                    <div style={{ ...serif, fontSize: '18px', fontWeight: 600, color: INK }}>What your numbers are saying</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '1px', color: FAINT }}>PLAIN-ENGLISH INSIGHTS, READ STRAIGHT FROM YOUR BOOKS</div>
                  </div>
                </div>
                {insights.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '9px 0', borderTop: i > 0 ? '1px solid #EEF1F5' : 'none' }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: A, lineHeight: '19px' }}>0{i + 1}</span>
                    <span style={{ fontSize: '13px', color: '#3A4552', lineHeight: 1.6 }}>{t}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '16px' }}>
              <div style={card}>
                <div style={{ ...serif, fontSize: '18px', fontWeight: 600, color: INK, marginBottom: '12px' }}>Where the money comes from</div>
                {revCats.map(([name, amt], i) => {
                  const v = amt * rScale, pct = Math.round((amt / totalRevCats) * 100)
                  return (
                    <div key={i} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: INK, marginBottom: '4px' }}>
                        <span>{name}</span>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{usd0(v)} · {pct}%</span>
                      </div>
                      <div style={{ height: '7px', background: '#EEF1F5', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: A, borderRadius: '4px' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={card}>
                <div style={{ ...serif, fontSize: '18px', fontWeight: 600, color: INK, marginBottom: '12px' }}>Where it goes</div>
                {expLines.map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < expLines.length - 1 ? '1px solid #EEF1F5' : 'none' }}>
                    <span style={{ fontSize: '12px', color: INK }}>{l.n}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: MUTED }}>{usd0(l.a * eScale)}</span>
                  </div>
                ))}
                <button onClick={() => setTab('pnl')} style={{ marginTop: '12px', background: 'transparent', border: `1px solid ${A}`, color: A, borderRadius: '5px', padding: '8px 14px', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '1px', cursor: 'pointer' }}>
                  DRILL INTO THE P&L →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* P&L */}
        {tab === 'pnl' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                <div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK }}>Profit &amp; loss — {MONTHS[mi]}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED }}>Click any expense line to see the transactions behind it</div>
              </div>

              <div style={lbl}>REVENUE</div>
              {revCats.map(([name, amt], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #EEF1F5' }}>
                  <span style={{ fontSize: '13px', color: INK }}>{name}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: INK }}>{usd0(amt * rScale)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #DDE3EA' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: INK }}>Total revenue</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', fontWeight: 600, color: INK }}>{usd0(rev[mi])}</span>
              </div>

              <div style={{ ...lbl, marginTop: '18px' }}>EXPENSES</div>
              {expLines.map((l, i) => (
                <div key={i}>
                  <button onClick={() => setOpenLine(openLine === i ? null : i)} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '9px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #EEF1F5', cursor: 'pointer', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: INK, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: A }}>{openLine === i ? '▾' : '▸'}</span>{l.n}
                    </span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: RED }}>({usd0(l.a * eScale)})</span>
                  </button>
                  {openLine === i && (
                    <div style={{ background: '#F7F9FB', borderRadius: '6px', padding: '4px 12px', margin: '6px 0 10px' }}>
                      {l.tx.map(([d, vendor, amt], j) => (
                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: j < l.tx.length - 1 ? '1px solid #E9EDF2' : 'none' }}>
                          <span style={{ fontSize: '12px', color: MUTED }}>
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: FAINT, marginRight: '10px' }}>{d}</span>{vendor}
                          </span>
                          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: MUTED }}>{usd0(amt)}</span>
                        </div>
                      ))}
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: FAINT, padding: '7px 0' }}>Sample transactions — in your portal this is every real charge, straight from your bank &amp; card feeds.</div>
                    </div>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 2px' }}>
                <span style={{ ...serif, fontSize: '18px', fontWeight: 700, color: INK }}>Net profit</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '15px', fontWeight: 600, color: GREEN }}>{usd0(profit[mi])}</span>
              </div>
            </div>
          </div>
        )}

        {/* OPS */}
        {tab === 'ops' && ops.type !== 'sales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {(ops.type === 'jobs' ? [
                { k: 'OPEN', v: rows.filter((r) => r.s !== 'done').length, sub: `${rows.filter((r) => r.s === 'waiting').length} on hold` },
                { k: 'ON THE BOARD', v: usd0(rows.reduce((s, r) => s + r.chg, 0)), sub: 'total charged' },
                { k: 'PROFIT ON THE BOARD', v: usd0(rows.reduce((s, r) => s + (r.chg - r.cost), 0)), sub: `${Math.round((rows.reduce((s, r) => s + (r.chg - r.cost), 0) / Math.max(1, rows.reduce((s, r) => s + r.chg, 0))) * 100)}% blended margin` },
              ] : ops.kpis).map((k, i) => <Kpi key={i} k={k.k} v={k.v} sub={k.sub} color={i === 0 ? A : undefined} />)}
            </div>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK, marginBottom: '4px' }}>{ops.title}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED, marginBottom: '12px' }}>{ops.sub}</div>
                </div>
                {ops.type === 'jobs' && (
                  <button onClick={() => setAdding((x) => !x)} style={{ background: adding ? '#E2E7ED' : A, color: adding ? MUTED : '#fff', border: 'none', borderRadius: '5px', padding: '9px 14px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>
                    {adding ? '✕ CANCEL' : `+ NEW ${ops.unit || 'JOB'}`}
                  </button>
                )}
              </div>
              {ops.type === 'jobs' && adding && (
                <div style={{ background: '#F7F9FB', border: '1px dashed #CFD8E2', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' }}>
                    <input style={{ padding: '9px 10px', fontSize: '13px', fontFamily: "'DM Sans',sans-serif", border: '1px solid #CFD8E2', borderRadius: '5px', background: '#fff', color: INK, outline: 'none' }} placeholder="Describe the job" value={f.a} onChange={(e) => setF({ ...f, a: e.target.value })} />
                    <input style={{ padding: '9px 10px', fontSize: '13px', fontFamily: "'DM Sans',sans-serif", border: '1px solid #CFD8E2', borderRadius: '5px', background: '#fff', color: INK, outline: 'none' }} type="number" placeholder="Charging $" value={f.chg} onChange={(e) => setF({ ...f, chg: e.target.value })} />
                    <input style={{ padding: '9px 10px', fontSize: '13px', fontFamily: "'DM Sans',sans-serif", border: '1px solid #CFD8E2', borderRadius: '5px', background: '#fff', color: INK, outline: 'none' }} type="number" placeholder="Your cost $" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} />
                  </div>
                  <button onClick={() => {
                    if (!f.a || !Number(f.chg)) return
                    setRows([{ a: f.a, b: 'Just added — watch the numbers above', who: '—', s: 'scheduled', chg: Number(f.chg), cost: Number(f.cost || 0) }, ...rows])
                    setF({ a: '', chg: '', cost: '' }); setAdding(false)
                  }} style={{ marginTop: '12px', background: D, color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}>ADD IT →</button>
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
                  <thead><tr>{ops.cols.map((h, i) => <th key={i} style={{ ...th, textAlign: i >= ops.cols.length - 2 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td style={td}><div style={{ fontWeight: 500 }}>{r.a}</div><div style={{ fontSize: '11px', color: MUTED }}>{r.b}</div></td>
                        {r.who !== undefined && <td style={td}>{r.who}</td>}
                        <td style={td}><StatusSelect set={ops.type} row={r} /></td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{usd0(r.chg)}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: ops.type === 'clients' ? (r.cost > 0 ? RED : MUTED) : GREEN }}>
                          {ops.type === 'clients' ? (r.cost > 0 ? usd0(r.cost) : '—') : usd0(r.chg - r.cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: FAINT, marginTop: '10px' }}>Fully interactive — change a status above. In your build this syncs to your real workflow.</div>
            </div>
          </div>
        )}

        {tab === 'ops' && ops.type === 'sales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {ops.kpis.map((k, i) => <Kpi key={i} k={k.k} v={k.v} sub={k.sub} color={i === 0 ? A : undefined} />)}
            </div>
            <div style={card}>
              <div style={{ ...serif, fontSize: '20px', fontWeight: 600, color: INK, marginBottom: '4px' }}>{ops.title}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: MUTED, marginBottom: '12px' }}>{ops.sub}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead><tr>{['ITEM', 'SOLD', 'REVENUE', 'COST', 'MARGIN'].map((h, i) => <th key={i} style={{ ...th, textAlign: i > 0 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {ops.items.map(([name, qty, revA, cost], i) => (
                      <tr key={i}>
                        <td style={td}>{name}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{qty}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{usd0(revA)}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: MUTED }}>{usd0(cost)}</td>
                        <td style={{ ...td, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: GREEN }}>{Math.round(((revA - cost) / revA) * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: FAINT, marginTop: '10px' }}>In your build this flows in automatically from your POS — Clover, Square, Toast, or whatever you run.</div>
            </div>
          </div>
        )}

        {/* CLOSING CTA */}
        <div style={{ marginTop: '28px', background: D, borderRadius: '8px', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ ...serif, fontSize: '22px', fontWeight: 600, color: '#EAF0F6', marginBottom: '8px' }}>
            Want this for your {industry.toLowerCase()} business — with your real numbers?
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#8C9AAA', marginBottom: '18px' }}>
            Built custom for you. Books included. Free consult + $25 gift card for new clients.
          </div>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" style={{ background: A, color: '#fff', textDecoration: 'none', borderRadius: '5px', padding: '12px 24px', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', display: 'inline-block' }}>
            BOOK A 10-MINUTE CALL →
          </a>
          <div style={{ marginTop: '14px' }}>
            <a href="/demos" style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#8C9AAA', letterSpacing: '1px' }}>← ALL INDUSTRY DEMOS</a>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}

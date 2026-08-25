import React, { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────
// Lakeland Supply Co. — AR Desk demo.
// The portal reads QuickBooks (customers, invoices, payments) and handles
// the part QuickBooks makes tedious: statements and invoice sends, in
// batches, from your own email address. Read-only against the books —
// nothing posts back to QuickBooks.
// Synthetic data seeded in Supabase (arp_* tables, QuickBooks-shaped).
// ─────────────────────────────────────────────────────────────────────────

const BIZ = 'Lakeland Supply Co.'
const SENDER = 'Dana Whitfield'
const SENDER_EMAIL = 'dana@lakelandsupply.com'

// One loud accent — QuickBooks green, because the pitch is "this IS your
// QuickBooks data." It appears in the top bar, the active nav state, and
// the send/flag accents. Everything else is stone and slate.
const SIGNAL = '#2CA01C'
const SLATE = '#4A5158'
const INK = '#1B2027'
const STONE = '#C7C3B8'
const PAPER = '#F6F6F4'
const WHITE = '#FFFFFF'
const RULE = '#DFDCD3'
const MUTED = '#7C838C'

const serif = "'Charter','Bitstream Charter','Sitka Text','Iowan Old Style',Georgia,serif"
const sans = "'Inter',-apple-system,'Segoe UI',sans-serif"

// The demo dataset is pinned to this date so aging never drifts.
const AS_OF = new Date('2026-08-21T00:00:00Z')
const DAY = 86400000
const dt = (s) => new Date(s + 'T00:00:00Z')
const daysBetween = (a, b) => Math.round((b - a) / DAY)

const money0 = (n) => (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US')
const money2 = (n) => (n < 0 ? '−$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const moneyK = (n) => {
  const a = Math.abs(n)
  const s = a >= 995000 ? (a / 1e6).toFixed(1) + 'M' : a >= 1000 ? Math.round(a / 1000) + 'K' : Math.round(a)
  return (n < 0 ? '−$' : '$') + s
}
const fmtD = (s) => s ? dt(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', timeZone: 'UTC' }) : '—'
const fmtLong = (s) => dt(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

const BUCKETS = ['Current', '1–30', '31–60', '61–90', '90+']
const bucketOf = (dpd) => (dpd <= 0 ? 0 : dpd <= 30 ? 1 : dpd <= 60 ? 2 : dpd <= 90 ? 3 : 4)

const NAV = [
  { id: 'owed', label: 'Aging & Balances' },
  { id: 'unsent', label: 'Unsent Invoices' },
  { id: 'run', label: 'Statement Run' },
  { id: 'activity', label: 'Outbox & Delivery' },
]

const NEXT = {
  owed: { id: 'unsent', q: 'Which invoices never went out?' },
  unsent: { id: 'run', q: 'How fast can every statement go out?' },
  run: { id: 'activity', q: 'What went out — and did it land?' },
}

const TABLES = ['arp_customers', 'arp_invoices', 'arp_invoice_lines', 'arp_payments', 'arp_send_log']

export default function ArDesk() {
  const [tab, setTab] = useState('owed')
  const [raw, setRaw] = useState(null)
  const [err, setErr] = useState(null)
  const [intro, setIntro] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [custFilter, setCustFilter] = useState('attention')
  const [bucketFilter, setBucketFilter] = useState(null)
  const [invoiceModal, setInvoiceModal] = useState(null)   // invoice object
  const [stmtModal, setStmtModal] = useState(null)         // customer id
  const [runModal, setRunModal] = useState(false)
  // session-only demo sends: nothing persists, nothing actually emails
  const [demoSent, setDemoSent] = useState({ invoices: {}, statements: [] })

  useEffect(() => {
    try { if (!window.localStorage.getItem('ardesk-intro-seen')) setIntro(true) } catch (e) { setIntro(true) }
  }, [])
  const closeIntro = (target) => {
    try { window.localStorage.setItem('ardesk-intro-seen', '1') } catch (e) {}
    setIntro(false)
    if (target) setTab(target)
  }

  useEffect(() => {
    let alive = true
    Promise.all(TABLES.map((t) => supabase.from(t).select('*').limit(2000)))
      .then((results) => {
        if (!alive) return
        const bad = results.find((r) => r.error)
        if (bad) { setErr(bad.error.message); return }
        const [customers, invoices, lines, payments, sendLog] = results.map((r) => r.data)
        setRaw({ customers, invoices, lines, payments, sendLog })
      })
      .catch((e) => alive && setErr(String(e)))
    return () => { alive = false }
  }, [])

  const M = useMemo(() => raw && buildModel(raw), [raw])

  // open the worst account by default so the drill-in shows itself
  useEffect(() => {
    if (!M) return
    const worst = [...M.custRows].sort((a, b) => b.b90 - a.b90)[0]
    if (worst) setExpanded((e) => (e === null ? worst.id : e))
  }, [M])

  const markInvoiceSent = (invId) => setDemoSent((s) => ({ ...s, invoices: { ...s.invoices, [invId]: true } }))
  const markStatementsSent = (custIds) => setDemoSent((s) => ({ ...s, statements: [...s.statements, ...custIds.map((id) => ({ custId: id, at: Date.now() }))] }))

  return (
    <>
      <Head>
        <title>{BIZ} — AR Desk Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${PAPER}}
        body{font-family:${sans};color:${SLATE};font-size:13px;-webkit-font-smoothing:antialiased}
        table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
        h1,h2,h3{font-family:${serif};color:${INK};font-weight:600}
        button{font-family:${sans}}
        .shell{display:flex;min-height:calc(100vh - 34px)}
        .side{width:212px;flex-shrink:0;background:${INK};padding:26px 0 20px;position:sticky;top:34px;height:calc(100vh - 34px);display:flex;flex-direction:column}
        .main{flex:1;min-width:0;padding:30px 36px 20px;max-width:1280px}
        .nbtn{display:block;width:100%;text-align:left;padding:10px 24px;border:none;background:transparent;color:#9aa0a8;font-size:12.5px;font-weight:500;letter-spacing:.02em;cursor:pointer;border-left:3px solid transparent}
        .nbtn:hover{color:${STONE}}
        .nbtn.on{color:${WHITE};border-left-color:${SIGNAL};background:rgba(255,255,255,.04)}
        .card{background:${WHITE};border:1px solid ${RULE};border-radius:3px}
        .th{padding:6px 10px;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:${MUTED};font-weight:600;text-align:left;border-bottom:1px solid ${SLATE};white-space:nowrap}
        .th.r{text-align:right}
        .td{padding:7px 10px;border-bottom:1px solid ${RULE};color:${SLATE};font-size:12.5px;white-space:nowrap}
        .td.r{text-align:right}
        .td.ink{color:${INK}}
        .rowbtn{cursor:pointer}
        .rowbtn:hover td{background:#FAF9F5}
        .seg{display:inline-flex;border:1px solid ${STONE};border-radius:3px;overflow:hidden}
        .seg button{padding:6px 12px;border:none;background:${WHITE};color:${SLATE};font-size:11.5px;font-weight:500;cursor:pointer;border-right:1px solid ${RULE}}
        .seg button:last-child{border-right:none}
        .seg button.on{background:${SLATE};color:${WHITE}}
        .flag{display:inline-block;background:${SIGNAL};color:${WHITE};font-size:10px;font-weight:700;letter-spacing:.05em;padding:2px 7px;border-radius:2px;white-space:nowrap}
        .flag.dark{background:${INK}}
        .ghost{border:1px solid ${STONE};background:${WHITE};color:${SLATE};font-size:10.5px;font-weight:600;letter-spacing:.06em;padding:4px 10px;border-radius:2px;cursor:pointer}
        .ghost:hover{border-color:${SLATE}}
        .primary{border:none;background:${SIGNAL};color:${WHITE};font-size:11px;font-weight:700;letter-spacing:.06em;padding:8px 18px;border-radius:2px;cursor:pointer}
        .primary:disabled{opacity:.55;cursor:default}
        .clickable{cursor:pointer}
        .clickable:hover{border-color:${SLATE}}
        .chev{display:inline-block;width:14px;color:${MUTED};font-size:10px}
        .bucket{cursor:pointer}
        .bucket:hover{background:#FAF9F5}
        .bucket.on{background:#EEEBE3}
        .chip{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:2px;border:1px solid ${RULE};color:${MUTED};white-space:nowrap}
        .chip.warn{border-color:${INK};color:${INK}}
        .mobilenav{display:none}
        @media(max-width:820px){
          .side{display:none}
          .main{padding:14px 14px 40px}
          .mobilenav{display:flex;position:sticky;top:34px;z-index:9;background:${INK};overflow-x:auto;gap:2px;padding:0 8px}
          .mobilenav button{flex-shrink:0;border:none;background:transparent;color:#9aa0a8;font-size:12px;font-weight:600;padding:11px 10px;cursor:pointer;border-bottom:3px solid transparent}
          .mobilenav button.on{color:${WHITE};border-bottom-color:${SIGNAL}}
        }
        @media print{
          body *{visibility:hidden}
          .print-doc,.print-doc *{visibility:visible}
          .print-doc{position:absolute;left:0;top:0;width:100%;box-shadow:none!important;border:none!important;max-height:none!important;overflow:visible!important}
          html,body{background:${WHITE}}
        }
      `}</style>

      {/* SIGNAL use 1 of 3: the top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: SIGNAL, color: WHITE, height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', fontSize: '10.5px', fontWeight: 600, letterSpacing: '.12em' }}>
        <span>{BIZ.toUpperCase()} — AR DESK</span>
        <span style={{ fontWeight: 500, letterSpacing: '.08em' }}>DEMO · SYNTHETIC DATA · AS OF AUG 21, 2026</span>
      </div>

      <div className="mobilenav">
        <button onClick={() => setIntro(true)} style={{ fontFamily: serif, fontStyle: 'italic' }}>The 4 questions</button>
        {NAV.map((n) => (
          <button key={n.id} className={tab === n.id ? 'on' : ''} onClick={() => { setTab(n.id); setExpanded(null) }}>{n.label}</button>
        ))}
      </div>

      <div className="shell">
        <aside className="side">
          <div style={{ padding: '0 24px 18px', borderBottom: '1px solid rgba(199,195,184,.15)', marginBottom: '10px' }}>
            <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 700, color: WHITE, lineHeight: 1.3 }}>Lakeland<br />Supply Co.</div>
            <div style={{ fontSize: '9.5px', color: STONE, letterSpacing: '.14em', marginTop: '7px' }}>ROCHESTER, NY · WHOLESALE</div>
          </div>
          <button className="nbtn" onClick={() => setIntro(true)} style={{ fontFamily: serif, fontSize: '13.5px', fontStyle: 'italic' }}>The four questions ↺</button>
          <div style={{ margin: '8px 24px 10px', borderTop: '1px solid rgba(199,195,184,.15)' }} />
          {NAV.map((n) => (
            <button key={n.id} className={'nbtn' + (tab === n.id ? ' on' : '')} onClick={() => { setTab(n.id); setExpanded(null) }}>{n.label}</button>
          ))}
          <div style={{ margin: '16px 24px 0', borderTop: '1px solid rgba(199,195,184,.15)', paddingTop: '14px', fontSize: '10px', lineHeight: 1.7, color: '#6d747d' }}>
            SENDING AS<br />
            <span style={{ color: STONE }}>{SENDER}<br />{SENDER_EMAIL}</span>
          </div>
          <div style={{ marginTop: 'auto', padding: '16px 24px 0', fontSize: '10px', lineHeight: 1.65, color: '#6d747d' }}>
            QuickBooks stays the book of record. This desk reads it — customers, invoices, payments — and sends from your own email. Nothing posts back to QuickBooks.
          </div>
        </aside>

        <main className="main">
          {intro && M && <Intro M={M} onClose={closeIntro} />}
          {err && <div className="card" style={{ padding: '28px', color: INK }}>Couldn&rsquo;t load demo data: {err}</div>}
          {!err && !M && <div style={{ padding: '60px 0', color: MUTED, fontSize: '13px' }}>Loading the receivables…</div>}
          {M && tab === 'owed' && <Owed M={M} custFilter={custFilter} setCustFilter={setCustFilter} bucketFilter={bucketFilter} setBucketFilter={setBucketFilter} expanded={expanded} setExpanded={setExpanded} setInvoiceModal={setInvoiceModal} setStmtModal={setStmtModal} demoSent={demoSent} />}
          {M && tab === 'unsent' && <Unsent M={M} setInvoiceModal={setInvoiceModal} demoSent={demoSent} />}
          {M && tab === 'run' && <Run M={M} setStmtModal={setStmtModal} setRunModal={setRunModal} demoSent={demoSent} />}
          {M && tab === 'activity' && <Activity M={M} demoSent={demoSent} />}
          {M && NEXT[tab] && (
            <div onClick={() => setTab(NEXT[tab].id)} style={{ marginTop: '28px', border: `1px solid ${RULE}`, background: WHITE, borderRadius: '3px', padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', cursor: 'pointer' }}>
              <span style={{ fontSize: '10px', letterSpacing: '.12em', color: MUTED, fontWeight: 700 }}>NEXT QUESTION</span>
              <span style={{ fontFamily: serif, fontSize: '16px', fontWeight: 600, color: INK }}>{NEXT[tab].q} →</span>
            </div>
          )}
          {M && <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: `1px solid ${RULE}`, fontSize: '11px', color: MUTED, lineHeight: 1.7 }}>
            Nothing is typed into this portal and nothing posts back to QuickBooks. It reads the books nightly and handles the sending — statements and invoices, from {SENDER_EMAIL}, not quickbooks@notification.intuit.com. That boundary is the point.
          </div>}
        </main>
      </div>

      {M && invoiceModal && <InvoiceModal M={M} inv={invoiceModal} onClose={() => setInvoiceModal(null)} demoSent={demoSent} markInvoiceSent={markInvoiceSent} />}
      {M && stmtModal != null && <StatementModal M={M} custId={stmtModal} onClose={() => setStmtModal(null)} />}
      {M && runModal && <RunModal M={M} onClose={() => setRunModal(false)} markStatementsSent={markStatementsSent} demoSent={demoSent} />}
    </>
  )
}

// ── model ────────────────────────────────────────────────────────────────

function buildModel(raw) {
  const custById = Object.fromEntries(raw.customers.map((c) => [c.id, c]))
  const linesByInv = {}
  for (const l of raw.lines) { (linesByInv[l.invoice_id] = linesByInv[l.invoice_id] || []).push(l) }
  const paysByCust = {}
  for (const p of raw.payments) { (paysByCust[p.customer_id] = paysByCust[p.customer_id] || []).push(p) }
  const invById = Object.fromEntries(raw.invoices.map((i) => [i.id, i]))

  const open = raw.invoices.filter((i) => i.status === 'open').map((i) => {
    const dpd = daysBetween(dt(i.due_date), AS_OF)
    return { ...i, cust: custById[i.customer_id], dpd, bucket: bucketOf(dpd), lines: linesByInv[i.id] || [] }
  }).sort((a, b) => b.dpd - a.dpd)

  const aging = [0, 0, 0, 0, 0]
  for (const i of open) aging[i.bucket] += Number(i.balance)
  const arTotal = open.reduce((s, i) => s + Number(i.balance), 0)

  // last statement per customer, from the send log
  const lastStmt = {}
  const bouncing = {}
  for (const s of raw.sendLog) {
    if (s.kind === 'statement' && (!lastStmt[s.customer_id] || s.sent_at > lastStmt[s.customer_id])) lastStmt[s.customer_id] = s.sent_at
    if (s.status === 'bounced' && s.sent_at >= '2026-03-01') bouncing[s.customer_id] = true
  }

  const custRows = raw.customers.map((c) => {
    const invs = open.filter((i) => i.customer_id === c.id)
    const balance = invs.reduce((s, i) => s + Number(i.balance), 0)
    const buckets = [0, 0, 0, 0, 0]
    for (const i of invs) buckets[i.bucket] += Number(i.balance)
    const oldest = invs.length ? Math.max(...invs.map((i) => i.dpd)) : null
    const neverSent = invs.filter((i) => i.email_status === 'never_sent')
    const ls = lastStmt[c.id] || null
    const stmtAge = ls ? daysBetween(dt(ls), AS_OF) : null
    const needsAttention = balance > 0 && (oldest > 30 || neverSent.length > 0 || stmtAge === null || stmtAge > 60 || bouncing[c.id])
    return { ...c, invs, balance, buckets, b90: buckets[4], oldest, neverSent, lastStmt: ls, stmtAge, bouncing: !!bouncing[c.id], needsAttention }
  }).sort((a, b) => b.balance - a.balance)

  const neverSentInvs = open.filter((i) => i.email_status === 'never_sent')
  const bouncedInvs = open.filter((i) => i.email_status === 'bounced')
  const neverSentTotal = neverSentInvs.reduce((s, i) => s + Number(i.balance), 0)
  const neverSentPastDue = neverSentInvs.filter((i) => i.dpd > 0).reduce((s, i) => s + Number(i.balance), 0)
  const bouncedTotal = bouncedInvs.reduce((s, i) => s + Number(i.balance), 0)

  const t12Cut = new Date(AS_OF.getTime() - 365 * DAY).toISOString().slice(0, 10)
  const t12 = raw.invoices.filter((i) => i.txn_date >= t12Cut).reduce((s, i) => s + Number(i.amount), 0)
  const dso = Math.round(arTotal / (t12 / 365))

  const withBalance = custRows.filter((c) => c.balance >= 100)
  const staleStmt = withBalance.filter((c) => c.stmtAge === null || c.stmtAge > 60)
  const oldestStale = [...staleStmt].sort((a, b) => b.b90 - a.b90)[0]

  const sendLog = [...raw.sendLog].sort((a, b) => b.sent_at.localeCompare(a.sent_at))
  const lastRunDate = raw.sendLog.filter((s) => s.kind === 'statement').map((s) => s.sent_at).sort().slice(-1)[0]

  return {
    raw, custById, invById, linesByInv, paysByCust, open, aging, arTotal, custRows,
    neverSentInvs, bouncedInvs, neverSentTotal, neverSentPastDue, bouncedTotal,
    t12, dso, withBalance, staleStmt, oldestStale, sendLog, lastRunDate, lastStmt,
  }
}

// ── shared bits ──────────────────────────────────────────────────────────

function Header({ q, lead, sub }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h1 style={{ fontSize: '27px', letterSpacing: '-0.01em' }}>{q}</h1>
      {lead && <div style={{ color: INK, fontSize: '15px', fontWeight: 600, marginTop: '8px', maxWidth: '680px', lineHeight: 1.5 }}>{lead}</div>}
      {sub && <div style={{ color: MUTED, fontSize: '13px', marginTop: '6px', maxWidth: '680px', lineHeight: 1.6 }}>{sub}</div>}
    </div>
  )
}

function Kpi({ k, v, sub, onClick }) {
  return (
    <div className={'card' + (onClick ? ' clickable' : '')} onClick={onClick} style={{ padding: '14px 18px', flex: 1, minWidth: '150px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: '9.5px', letterSpacing: '.1em', color: MUTED, fontWeight: 600, marginBottom: '6px' }}>{k}</div>
      <div style={{ fontFamily: serif, fontSize: '25px', fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{v}</div>
      {sub && <div style={{ fontSize: '11px', color: MUTED, marginTop: '5px' }}>{sub}</div>}
    </div>
  )
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(27,32,39,.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: wide ? '680px' : '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(27,32,39,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 20px', borderBottom: `1px solid ${RULE}`, position: 'sticky', top: 0, background: WHITE, zIndex: 2 }}>
          <h2 style={{ fontSize: '17px' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '15px', cursor: 'pointer', color: MUTED }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// First-visit framing — the demo gets opened cold, so this is the narration.
function Intro({ M, onClose }) {
  const QS = [
    { id: 'owed', q: 'Who owes you — and how long have they owed it?', hook: `${money0(M.arTotal)} is out with ${M.withBalance.length} customers. ${money0(M.aging[4])} of it is more than 90 days past due.` },
    { id: 'unsent', q: 'Which invoices never went out?', hook: `${money0(M.neverSentTotal)} of invoices exist in QuickBooks but were never emailed to anyone.` },
    { id: 'run', q: 'How long should statements take?', hook: `${M.withBalance.length} customers carry a balance. In QuickBooks that's ${M.withBalance.length} separate trips. Here it's one pass.` },
    { id: 'activity', q: 'What went out — and did it land?', hook: `Every send tracked — delivered, opened, bounced. The last full statement run was ${fmtLong(M.lastRunDate)}.` },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,32,39,.55)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px', overflowY: 'auto' }}>
      <div className="card" style={{ maxWidth: '680px', width: '100%', padding: '30px 34px 26px', boxShadow: '0 24px 64px rgba(27,32,39,.35)' }}>
        <div style={{ fontSize: '10px', letterSpacing: '.16em', color: MUTED, fontWeight: 700, marginBottom: '12px' }}>{BIZ.toUpperCase()} — A WORKING DEMO</div>
        <h1 style={{ fontSize: '25px', lineHeight: 1.25, marginBottom: '10px' }}>The Friday afternoon job, done by lunch.</h1>
        <p style={{ fontSize: '13.5px', color: SLATE, lineHeight: 1.65, marginBottom: '18px', maxWidth: '580px' }}>
          QuickBooks keeps the books — and makes you send statements one customer at a time, from
          an Intuit address your customers&rsquo; spam filters don&rsquo;t trust. This desk reads QuickBooks
          and handles the sending: every statement in one pass, from <b style={{ color: INK }}>your own email</b>.
          {' '}<b style={{ color: INK }}>Nothing posts back to QuickBooks.</b>
        </p>
        <p style={{ fontSize: '11.5px', color: MUTED, lineHeight: 1.6, marginBottom: '18px', maxWidth: '580px' }}>
          A working demo — every number on these screens is invented, and no email actually sends.
          In production, invoice PDFs are the exact ones QuickBooks generates.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '18px' }}>
          {QS.map((x, i) => (
            <div key={x.id} className="card clickable" onClick={() => onClose(x.id)} style={{ padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ fontFamily: serif, fontSize: '15.5px', fontWeight: 700, color: INK, marginBottom: '6px' }}>{i + 1}. {x.q}</div>
              <div style={{ fontSize: '12px', color: SLATE, lineHeight: 1.55 }}>{x.hook}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '11.5px', color: MUTED }}>Click anything — it&rsquo;s all live.</div>
          <button className="primary" onClick={() => onClose('owed')}>START WITH QUESTION 1 →</button>
        </div>
      </div>
    </div>
  )
}

// ── screen 1: aging & balances ───────────────────────────────────────────

function Owed({ M, custFilter, setCustFilter, bucketFilter, setBucketFilter, expanded, setExpanded, setInvoiceModal, setStmtModal, demoSent }) {
  const pool = M.custRows.filter((c) =>
    custFilter === 'attention' ? c.needsAttention :
    custFilter === 'balance' ? c.balance >= 100 : true)
  const rows = bucketFilter == null ? pool : pool.filter((c) => c.buckets[bucketFilter] > 0)
  const maxBucket = Math.max(...M.aging, 1)
  return (
    <div>
      <Header q="Who owes you — and how long have they owed it?"
        lead={`${money0(M.arTotal)} is out with customers. ${money0(M.aging[4])} of it is more than 90 days past due — and ${M.oldestStale ? M.oldestStale.name : 'the oldest account'} hasn't been sent a statement since ${M.oldestStale && M.oldestStale.lastStmt ? fmtLong(M.oldestStale.lastStmt) : 'last spring'}.`}
        sub="Read straight from QuickBooks: every open invoice, aged as of today. The flags mark what a statement or a phone call would actually move." />
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <Kpi k="TOTAL RECEIVABLES" v={money0(M.arTotal)} sub={`${M.open.length} open invoices · ${M.withBalance.length} customers`} onClick={() => { setCustFilter('balance'); setBucketFilter(null) }} />
        <Kpi k="PAST 90 DAYS" v={money0(M.aging[4])} sub="the money going quiet" onClick={() => { setCustFilter('balance'); setBucketFilter(4) }} />
        <Kpi k="DAYS SALES OUTSTANDING" v={M.dso + ' days'} sub="cash sits 2.5 months after the sale" />
        <Kpi k="NO STATEMENT 60+ DAYS" v={M.staleStmt.length} sub={`of ${M.withBalance.length} customers with balances`} onClick={() => { setCustFilter('attention'); setBucketFilter(null) }} />
      </div>

      <div className="card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '13px 16px 4px' }}>
          <h2 style={{ fontSize: '16.5px' }}>Aging, as of Aug 21</h2>
          <span style={{ fontSize: '11px', color: MUTED }}>click a bucket to filter the list below</span>
        </div>
        <div style={{ display: 'flex', gap: '2px', padding: '10px 16px 16px' }}>
          {BUCKETS.map((b, k) => (
            <div key={b} className={'bucket' + (bucketFilter === k ? ' on' : '')} onClick={() => setBucketFilter(bucketFilter === k ? null : k)} style={{ flex: 1, padding: '10px 10px 8px', borderTop: `3px solid ${k >= 3 ? INK : STONE}` }}>
              <div style={{ fontSize: '9.5px', letterSpacing: '.08em', color: MUTED, fontWeight: 700 }}>{b.toUpperCase()}{k > 0 ? ' DAYS' : ''}</div>
              <div style={{ fontFamily: serif, fontSize: '19px', fontWeight: 700, color: INK, margin: '4px 0 6px' }}>{moneyK(M.aging[k])}</div>
              <div style={{ height: '5px', background: '#EEEBE3', borderRadius: '1px' }}>
                <div style={{ height: '100%', width: `${(M.aging[k] / maxBucket) * 100}%`, background: k >= 3 ? INK : STONE, borderRadius: '1px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
        <div className="seg">{[['attention', 'Needs attention'], ['balance', 'With balance'], ['all', 'All customers']].map(([id, label]) => <button key={id} className={custFilter === id ? 'on' : ''} onClick={() => setCustFilter(id)}>{label}</button>)}</div>
        <div style={{ fontSize: '11px', color: MUTED }}>{rows.length} customers · click a row for their invoices</div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr>
            <th className="th">Customer</th><th className="th">Terms</th><th className="th r">Open</th>
            <th className="th r">Balance</th><th className="th r">Oldest</th><th className="th">Last statement</th><th className="th"></th>
          </tr></thead>
          <tbody>
            {rows.map((c) => <CustRow key={c.id} c={c} expanded={expanded} setExpanded={setExpanded} setInvoiceModal={setInvoiceModal} setStmtModal={setStmtModal} demoSent={demoSent} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CustRow({ c, expanded, setExpanded, setInvoiceModal, setStmtModal, demoSent }) {
  const isOpen = expanded === c.id
  const stmtLabel = c.lastStmt ? fmtD(c.lastStmt) : 'never'
  const stmtStale = c.balance > 0 && (c.stmtAge === null || c.stmtAge > 60)
  return (
    <>
      <tr className="rowbtn" onClick={() => setExpanded(isOpen ? null : c.id)}>
        <td className="td ink" style={{ fontWeight: 600 }}><span className="chev">{isOpen ? '▾' : '▸'}</span>{c.name}</td>
        <td className="td">Net {c.terms_days}</td>
        <td className="td r">{c.invs.length || '—'}</td>
        <td className="td r ink" style={{ fontWeight: 700 }}>{c.balance ? money0(c.balance) : '—'}</td>
        <td className="td r" style={{ color: c.oldest > 60 ? INK : SLATE, fontWeight: c.oldest > 60 ? 700 : 400 }}>{c.oldest == null ? '—' : c.oldest <= 0 ? 'current' : c.oldest + 'd late'}</td>
        <td className="td" style={{ color: stmtStale ? INK : SLATE, fontWeight: stmtStale ? 600 : 400 }}>{stmtLabel}{stmtStale && c.lastStmt ? ` · ${c.stmtAge}d ago` : ''}</td>
        <td className="td r">
          {c.neverSent.length > 0 && <span className="flag" style={{ marginRight: '5px' }}>{c.neverSent.length} NEVER EMAILED</span>}
          {c.bouncing && <span className="flag dark">EMAIL BOUNCING</span>}
        </td>
      </tr>
      {isOpen && (
        <tr><td colSpan={7} style={{ padding: 0, borderBottom: `1px solid ${RULE}` }}>
          <div style={{ background: '#FAF9F5', padding: '14px 22px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700 }}>
                OPEN INVOICES — {c.contact ? c.contact.toUpperCase() + ' · ' : ''}{c.email ? c.email.toUpperCase() : 'NO EMAIL ON FILE'}
              </div>
              {c.balance > 0 && <button className="ghost" onClick={(e) => { e.stopPropagation(); setStmtModal(c.id) }}>PREVIEW STATEMENT →</button>}
            </div>
            {c.invs.length === 0 && <div style={{ fontSize: '12px', color: MUTED }}>Nothing open — paid in full.</div>}
            {c.invs.length > 0 && (
              <table>
                <thead><tr><th className="th">Invoice</th><th className="th">Date</th><th className="th">Due</th><th className="th r">Amount</th><th className="th r">Balance</th><th className="th">Status</th><th className="th"></th></tr></thead>
                <tbody>
                  {[...c.invs].sort((a, b) => b.dpd - a.dpd).map((i) => (
                    <tr key={i.id}>
                      <td className="td ink" style={{ fontWeight: 600 }}>#{i.doc_num}</td>
                      <td className="td">{fmtD(i.txn_date)}</td>
                      <td className="td">{fmtD(i.due_date)}</td>
                      <td className="td r">{money2(Number(i.amount))}</td>
                      <td className="td r ink" style={{ fontWeight: 600 }}>{money2(Number(i.balance))}</td>
                      <td className="td">
                        {demoSent.invoices[i.id] ? <span className="chip">SENT · DEMO</span>
                          : i.email_status === 'never_sent' ? <span className="flag">NEVER EMAILED</span>
                          : i.email_status === 'bounced' ? <span className="flag dark">BOUNCED</span>
                          : <span className="chip">{i.dpd > 0 ? `${i.dpd}D LATE` : 'CURRENT'}</span>}
                      </td>
                      <td className="td r"><button className="ghost" onClick={(e) => { e.stopPropagation(); setInvoiceModal(i) }}>VIEW →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </td></tr>
      )}
    </>
  )
}

// ── screen 2: unsent invoices ────────────────────────────────────────────

function Unsent({ M, setInvoiceModal, demoSent }) {
  const groups = [
    { title: 'Created in QuickBooks, never emailed to anyone', rows: M.neverSentInvs, empty: 'Everything has been emailed.' },
    { title: 'Emailed — but the address bounced', rows: M.bouncedInvs, empty: 'No bounces on open invoices.' },
  ]
  return (
    <div>
      <Header q="Which invoices never went out?"
        lead={`${money0(M.neverSentTotal)} of invoices exist in QuickBooks but were never emailed — ${money0(M.neverSentPastDue)} of it is already past due. The customer can't pay a bill they never received.`}
        sub={`It happens quietly: an invoice gets created on a busy day and "Save and send" never gets clicked. QuickBooks knows — it just doesn't tell you. Another ${money0(M.bouncedTotal)} was emailed to an address that bounced.`} />
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <Kpi k="NEVER EMAILED" v={money0(M.neverSentTotal)} sub={`${M.neverSentInvs.length} invoices`} />
        <Kpi k="OF WHICH PAST DUE" v={money0(M.neverSentPastDue)} sub="late for a bill nobody received" />
        <Kpi k="BOUNCED" v={money0(M.bouncedTotal)} sub={`${M.bouncedInvs.length} invoices — bad address on file`} />
      </div>
      {groups.map((g) => (
        <div key={g.title} className="card" style={{ marginBottom: '14px', overflowX: 'auto' }}>
          <div style={{ padding: '13px 16px 11px' }}><h2 style={{ fontSize: '16.5px' }}>{g.title}</h2></div>
          {g.rows.length === 0 ? <div style={{ padding: '0 16px 16px', color: MUTED, fontSize: '12.5px' }}>{g.empty}</div> : (
            <table>
              <thead><tr><th className="th">Invoice</th><th className="th">Customer</th><th className="th">Date</th><th className="th">Due</th><th className="th r">Balance</th><th className="th">Status</th><th className="th"></th></tr></thead>
              <tbody>
                {g.rows.map((i) => (
                  <tr key={i.id} className="rowbtn" onClick={() => setInvoiceModal(i)}>
                    <td className="td ink" style={{ fontWeight: 600 }}>#{i.doc_num}</td>
                    <td className="td">{i.cust.name}</td>
                    <td className="td">{fmtD(i.txn_date)}</td>
                    <td className="td">{fmtD(i.due_date)}</td>
                    <td className="td r ink" style={{ fontWeight: 700 }}>{money2(Number(i.balance))}</td>
                    <td className="td">
                      {demoSent.invoices[i.id] ? <span className="chip">SENT · DEMO</span>
                        : i.dpd > 0 ? <span className="flag">{i.dpd}D PAST DUE</span>
                        : <span className="chip">DUE {fmtD(i.due_date).toUpperCase()}</span>}
                    </td>
                    <td className="td r"><button className="ghost">VIEW & SEND →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  )
}

// ── screen 3: statement run ──────────────────────────────────────────────

function Run({ M, setStmtModal, setRunModal, demoSent }) {
  const sentIds = new Set(demoSent.statements.map((s) => s.custId))
  return (
    <div>
      <Header q="Every statement, one pass."
        lead={`${M.withBalance.length} customers carry a balance today. In QuickBooks that's ${M.withBalance.length} separate trips through Customers → Create statement — the job that eats a Friday afternoon. Here it's select, preview, send.`}
        sub={`Statements send from ${SENDER_EMAIL} — your address, your reply-to, your Sent folder. Not quickbooks@notification.intuit.com. The last full run was ${fmtLong(M.lastRunDate)}; it shows.`} />
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <Kpi k="STATEMENTS READY" v={M.withBalance.length} sub={`covering ${money0(M.arTotal)} of balances`} />
        <Kpi k="NO STATEMENT 60+ DAYS" v={M.staleStmt.length} sub="customers overdue for a nudge" />
        <Kpi k="LAST FULL RUN" v={fmtD(M.lastRunDate)} sub={`${daysBetween(dt(M.lastRunDate), AS_OF)} days ago`} />
      </div>
      <div className="card" style={{ overflowX: 'auto', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px 11px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '16.5px' }}>This run — every customer with a balance</h2>
          {/* SIGNAL use 3 of 3: the send action */}
          <button className="primary" onClick={() => setRunModal(true)}>SEND {M.withBalance.length} STATEMENTS →</button>
        </div>
        <table>
          <thead><tr><th className="th">Customer</th><th className="th">Sends to</th><th className="th r">Balance</th><th className="th r">Past due</th><th className="th">Last statement</th><th className="th"></th></tr></thead>
          <tbody>
            {M.withBalance.map((c) => (
              <tr key={c.id}>
                <td className="td ink" style={{ fontWeight: 600 }}>{c.name}</td>
                <td className="td" style={{ color: c.bouncing ? INK : SLATE, fontWeight: c.bouncing ? 600 : 400 }}>{c.email}{c.bouncing ? ' · bouncing' : ''}</td>
                <td className="td r ink" style={{ fontWeight: 700 }}>{money0(c.balance)}</td>
                <td className="td r">{c.buckets.slice(1).reduce((s, v) => s + v, 0) > 0 ? money0(c.buckets.slice(1).reduce((s, v) => s + v, 0)) : '—'}</td>
                <td className="td">{sentIds.has(c.id) ? 'just now · demo' : c.lastStmt ? fmtD(c.lastStmt) : 'never'}</td>
                <td className="td r"><button className="ghost" onClick={() => setStmtModal(c.id)}>PREVIEW →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RunModal({ M, onClose, markStatementsSent, demoSent }) {
  const [progress, setProgress] = useState(-1) // -1 confirm · >=0 sending · done at length
  const list = M.withBalance
  const done = progress >= list.length
  useEffect(() => {
    if (progress < 0 || done) return
    const t = setTimeout(() => setProgress((p) => p + 1), 90)
    return () => clearTimeout(t)
  }, [progress, done])
  useEffect(() => {
    if (done) markStatementsSent(list.map((c) => c.id))
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal title={done ? 'Statement run complete' : 'Send this statement run'} onClose={onClose} wide>
      <div style={{ padding: '18px 20px' }}>
        {progress < 0 && (
          <>
            <p style={{ fontSize: '13px', color: SLATE, lineHeight: 1.65, marginBottom: '14px' }}>
              <b style={{ color: INK }}>{list.length} statements</b>, covering <b style={{ color: INK }}>{money0(M.arTotal)}</b> of
              open balances, will send as <b style={{ color: INK }}>{SENDER} &lt;{SENDER_EMAIL}&gt;</b>.
              Replies land in your inbox; every send lands in your Sent folder.
            </p>
            <div style={{ fontSize: '11.5px', color: MUTED, lineHeight: 1.6, marginBottom: '16px' }}>
              Demo — nothing actually emails. In production this is your connected Gmail account sending one branded statement per customer.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="ghost" onClick={onClose}>CANCEL</button>
              <button className="primary" onClick={() => setProgress(0)}>SEND {list.length} STATEMENTS</button>
            </div>
          </>
        )}
        {progress >= 0 && (
          <>
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: `1px solid ${RULE}`, borderRadius: '3px', marginBottom: '14px' }}>
              {list.map((c, k) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: `1px solid ${RULE}`, fontSize: '12px', color: k < progress ? SLATE : '#B9BDC3' }}>
                  <span style={{ fontWeight: 600, color: k < progress ? INK : '#B9BDC3' }}>{c.name}</span>
                  <span>{k < progress ? (c.bouncing ? 'held — address bouncing' : `sent · ${money0(c.balance)}`) : k === progress ? 'sending…' : 'queued'}</span>
                </div>
              ))}
            </div>
            {done && (
              <p style={{ fontSize: '13px', color: SLATE, lineHeight: 1.6, marginBottom: '14px' }}>
                <b style={{ color: INK }}>{list.filter((c) => !c.bouncing).length} statements sent</b> from {SENDER_EMAIL} (demo — nothing actually emailed).
                {list.some((c) => c.bouncing) && <> {list.filter((c) => c.bouncing).length} held back for a bouncing address — fix the email, then resend.</>}
                {' '}The outbox screen now shows this run.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className={done ? 'primary' : 'ghost'} onClick={onClose}>{done ? 'DONE' : 'CLOSE'}</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

// ── screen 4: outbox & delivery ──────────────────────────────────────────

function Activity({ M, demoSent }) {
  const [showAll, setShowAll] = useState(false)
  const sessionRows = [
    ...demoSent.statements.map((s, k) => ({ key: 'ds' + k, kind: 'statement', cust: M.custById[s.custId], sent_at: null, to_email: M.custById[s.custId].email, status: M.custById[s.custId] && M.custRows.find((c) => c.id === s.custId)?.bouncing ? 'held' : 'sent', subject: 'Statement of account — August 2026', demo: true })),
    ...Object.keys(demoSent.invoices).map((id) => {
      const inv = M.invById[id]
      return { key: 'di' + id, kind: 'invoice', cust: M.custById[inv.customer_id], sent_at: null, to_email: M.custById[inv.customer_id].email, status: 'sent', subject: `Invoice ${inv.doc_num} from ${BIZ}`, demo: true }
    }),
  ]
  const logRows = M.sendLog.map((s) => ({ key: 'l' + s.id, ...s, cust: M.custById[s.customer_id] }))
  const rows = [...sessionRows, ...logRows]
  const shown = showAll ? rows : rows.slice(0, 40)
  const last30 = M.sendLog.filter((s) => daysBetween(dt(s.sent_at), AS_OF) <= 30)
  const bouncers = M.custRows.filter((c) => c.bouncing)
  return (
    <div>
      <Header q="What went out — and did it land?"
        lead={`Every send in one place — statements and invoices, delivered, opened, or bounced. ${bouncers.length ? `${bouncers.map((c) => c.name).join(' and ')} ${bouncers.length > 1 ? 'have' : 'has'} a bouncing address: everything "sent" there since spring went nowhere.` : ''}`}
        sub={`QuickBooks sends from quickbooks@notification.intuit.com and tells you almost nothing about what happened after. Sends from ${SENDER_EMAIL} live in your own Sent folder — and replies come back to you, not to a no-reply address.`} />
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <Kpi k="SENDS — LAST 30 DAYS" v={last30.length + (sessionRows.length ? ' + ' + sessionRows.length : '')} sub={sessionRows.length ? 'including this session (demo)' : 'invoices only — no statement runs'} />
        <Kpi k="BOUNCING ADDRESSES" v={bouncers.length} sub={bouncers.map((c) => c.name).join(' · ') || 'none'} />
        <Kpi k="STATEMENTS THIS MONTH" v={demoSent.statements.length ? new Set(demoSent.statements.map((s) => s.custId)).size + ' (demo)' : 0} sub={demoSent.statements.length ? 'sent from this desk just now' : `last run ${fmtD(M.lastRunDate)}`} />
      </div>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th className="th">Sent</th><th className="th">Type</th><th className="th">Customer</th><th className="th">To</th><th className="th">Subject</th><th className="th">Delivery</th></tr></thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.key}>
                <td className="td" style={{ fontWeight: s.demo ? 700 : 400, color: s.demo ? INK : SLATE }}>{s.demo ? 'just now · demo' : fmtD(s.sent_at)}</td>
                <td className="td">{s.kind === 'statement' ? 'Statement' : 'Invoice'}</td>
                <td className="td ink" style={{ fontWeight: 600 }}>{s.cust ? s.cust.name : '—'}</td>
                <td className="td">{s.to_email}</td>
                <td className="td" style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.subject}</td>
                <td className="td">
                  {s.status === 'bounced' || s.status === 'held' ? <span className="flag dark">{s.status.toUpperCase()}</span> : <span className="chip">{s.status.toUpperCase()}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 40 && (
          <div style={{ padding: '10px 16px' }}>
            <button className="ghost" onClick={() => setShowAll(!showAll)}>{showAll ? 'SHOW RECENT ONLY' : `SHOW ALL ${rows.length} SENDS`}</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── documents ────────────────────────────────────────────────────────────

// Invoice preview, styled after QBO's standard template. In production this
// modal shows the literal PDF Intuit generates (GET /invoice/<id>/pdf) — the
// exact document QuickBooks itself would email.
function InvoiceModal({ M, inv, onClose, demoSent, markInvoiceSent }) {
  const c = inv.cust || M.custById[inv.customer_id]
  const lines = inv.lines && inv.lines.length ? inv.lines : (M.linesByInv[inv.id] || [])
  const sent = !!demoSent.invoices[inv.id]
  return (
    <Modal title={`Invoice #${inv.doc_num}`} onClose={onClose} wide>
      <div style={{ padding: '20px' }}>
        <div className="card print-doc" style={{ padding: '26px 28px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div>
              <div style={{ fontFamily: serif, fontSize: '19px', fontWeight: 700, color: INK }}>{BIZ}</div>
              <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.6, marginTop: '4px' }}>214 Mill Street · Rochester, NY 14614<br />(585) 555-0114 · {SENDER_EMAIL}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', letterSpacing: '.18em', color: SLATE, fontWeight: 300 }}>INVOICE</div>
              <div style={{ fontSize: '11.5px', color: SLATE, marginTop: '6px' }}># {inv.doc_num}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '9.5px', letterSpacing: '.1em', color: MUTED, fontWeight: 700, marginBottom: '4px' }}>BILL TO</div>
              <div style={{ fontSize: '12.5px', color: INK, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: '11.5px', color: SLATE }}>{c.contact}<br />{c.email}</div>
            </div>
            <table style={{ width: 'auto', fontSize: '11.5px' }}>
              <tbody>
                <tr><td style={{ padding: '2px 14px 2px 0', color: MUTED }}>Invoice date</td><td style={{ color: INK, textAlign: 'right' }}>{fmtD(inv.txn_date)}</td></tr>
                <tr><td style={{ padding: '2px 14px 2px 0', color: MUTED }}>Terms</td><td style={{ color: INK, textAlign: 'right' }}>Net {c.terms_days}</td></tr>
                <tr><td style={{ padding: '2px 14px 2px 0', color: MUTED }}>Due date</td><td style={{ color: INK, textAlign: 'right', fontWeight: 700 }}>{fmtD(inv.due_date)}</td></tr>
              </tbody>
            </table>
          </div>
          <table>
            <thead><tr><th className="th">Activity</th><th className="th r">Qty</th><th className="th r">Rate</th><th className="th r">Amount</th></tr></thead>
            <tbody>
              {(lines.length ? lines : [{ id: 0, item: 'Supplies & freight', qty: 1, rate: inv.amount, amount: inv.amount }]).map((l) => (
                <tr key={l.id}>
                  <td className="td" style={{ whiteSpace: 'normal' }}>{l.item}</td>
                  <td className="td r">{Number(l.qty)}</td>
                  <td className="td r">{money2(Number(l.rate))}</td>
                  <td className="td r ink">{money2(Number(l.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700 }}>BALANCE DUE</div>
              <div style={{ fontFamily: serif, fontSize: '26px', fontWeight: 700, color: INK }}>{money2(Number(inv.balance))}</div>
              {Number(inv.balance) < Number(inv.amount) && <div style={{ fontSize: '11px', color: MUTED }}>of {money2(Number(inv.amount))} — partial payment received</div>}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.6, marginBottom: '14px' }}>
          Demo preview, rebuilt from the invoice lines. In production this is the exact PDF QuickBooks generates for this invoice — pulled straight from Intuit, byte for byte what QuickBooks itself would email.
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="ghost" onClick={onClose}>CLOSE</button>
          <button className="primary" disabled={sent} onClick={() => markInvoiceSent(inv.id)}>
            {sent ? 'SENT (DEMO)' : `SEND FROM ${SENDER_EMAIL.toUpperCase()}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Statement of account — the document QuickBooks has no API for, built here
// exactly how Lakeland wants it: open items, recent payments, aging strip.
function StatementModal({ M, custId, onClose }) {
  const c = M.custRows.find((x) => x.id === custId)
  if (!c) return null
  const pays = (M.paysByCust[c.id] || []).filter((p) => daysBetween(dt(p.date), AS_OF) <= 60).sort((a, b) => b.date.localeCompare(a.date))
  return (
    <Modal title={`Statement — ${c.name}`} onClose={onClose} wide>
      <div style={{ padding: '20px' }}>
        <div className="card print-doc" style={{ padding: '26px 28px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div>
              <div style={{ fontFamily: serif, fontSize: '19px', fontWeight: 700, color: INK }}>{BIZ}</div>
              <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.6, marginTop: '4px' }}>214 Mill Street · Rochester, NY 14614<br />(585) 555-0114 · {SENDER_EMAIL}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '17px', letterSpacing: '.14em', color: SLATE, fontWeight: 300 }}>STATEMENT</div>
              <div style={{ fontSize: '11.5px', color: SLATE, marginTop: '6px' }}>as of {fmtLong(AS_OF.toISOString().slice(0, 10))}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '9.5px', letterSpacing: '.1em', color: MUTED, fontWeight: 700, marginBottom: '4px' }}>FOR</div>
              <div style={{ fontSize: '12.5px', color: INK, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: '11.5px', color: SLATE }}>{c.contact} · {c.email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700 }}>AMOUNT DUE</div>
              <div style={{ fontFamily: serif, fontSize: '26px', fontWeight: 700, color: INK }}>{money2(c.balance)}</div>
            </div>
          </div>
          <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700, margin: '0 0 4px' }}>OPEN INVOICES</div>
          <table>
            <thead><tr><th className="th">Date</th><th className="th">Invoice</th><th className="th">Due</th><th className="th r">Amount</th><th className="th r">Open balance</th></tr></thead>
            <tbody>
              {[...c.invs].sort((a, b) => a.txn_date.localeCompare(b.txn_date)).map((i) => (
                <tr key={i.id}>
                  <td className="td">{fmtD(i.txn_date)}</td>
                  <td className="td ink" style={{ fontWeight: 600 }}>#{i.doc_num}</td>
                  <td className="td" style={{ fontWeight: i.dpd > 0 ? 700 : 400, color: i.dpd > 0 ? INK : SLATE }}>{fmtD(i.due_date)}{i.dpd > 0 ? ` · ${i.dpd}d past due` : ''}</td>
                  <td className="td r">{money2(Number(i.amount))}</td>
                  <td className="td r ink" style={{ fontWeight: 600 }}>{money2(Number(i.balance))}</td>
                </tr>
              ))}
              <tr style={{ background: '#EEEBE3' }}>
                <td className="td ink" colSpan={4} style={{ fontWeight: 700 }}>Total due</td>
                <td className="td r ink" style={{ fontWeight: 700, fontFamily: serif, fontSize: '15px' }}>{money2(c.balance)}</td>
              </tr>
            </tbody>
          </table>
          {pays.length > 0 && (
            <>
              <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700, margin: '16px 0 4px' }}>PAYMENTS RECEIVED — LAST 60 DAYS. THANK YOU.</div>
              <table>
                <tbody>
                  {pays.map((p) => (
                    <tr key={p.id}>
                      <td className="td">{fmtD(p.date)}</td>
                      <td className="td">{p.method}{p.ref ? ` #${p.ref}` : ''}</td>
                      <td className="td r">{money2(Number(p.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <div style={{ display: 'flex', gap: '2px', marginTop: '18px' }}>
            {BUCKETS.map((b, k) => (
              <div key={b} style={{ flex: 1, padding: '7px 9px', background: '#FAF9F5', borderTop: `2px solid ${k >= 3 && c.buckets[k] > 0 ? INK : STONE}` }}>
                <div style={{ fontSize: '8.5px', letterSpacing: '.08em', color: MUTED, fontWeight: 700 }}>{b.toUpperCase()}{k > 0 ? ' DAYS' : ''}</div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: c.buckets[k] > 0 ? INK : MUTED, fontVariantNumeric: 'tabular-nums' }}>{c.buckets[k] > 0 ? money2(c.buckets[k]) : '—'}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '10.5px', color: MUTED, marginTop: '14px', lineHeight: 1.6 }}>
            Questions about this statement? Reply to this email — it comes straight back to {SENDER} at {SENDER_EMAIL}.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="ghost" onClick={() => window.print()}>PRINT / PDF</button>
          <button className="ghost" onClick={onClose}>CLOSE</button>
        </div>
      </div>
    </Modal>
  )
}

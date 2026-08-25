import React, { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────
// Lakeland Supply Co. — statements, the simple way.
// One screen: who owes you, checked and ready. Hit send and every statement
// goes out from your own email. Click a customer to see their invoices and
// send one of those instead. Reads QuickBooks; nothing posts back.
// Synthetic data seeded in Supabase (arp_* tables, QuickBooks-shaped).
// ─────────────────────────────────────────────────────────────────────────

const BIZ = 'Lakeland Supply Co.'
const SENDER = 'Dana Whitfield'
const SENDER_EMAIL = 'dana@lakelandsupply.com'

const GREEN = '#2CA01C'
const SLATE = '#4A5158'
const INK = '#1B2027'
const PAPER = '#F6F6F4'
const WHITE = '#FFFFFF'
const RULE = '#DFDCD3'
const MUTED = '#7C838C'
const RED = '#B3261E'

const serif = "'Charter','Bitstream Charter','Sitka Text','Iowan Old Style',Georgia,serif"
const sans = "'Inter',-apple-system,'Segoe UI',sans-serif"

// The demo dataset is pinned to this date so aging never drifts.
const AS_OF = new Date('2026-08-21T00:00:00Z')
const DAY = 86400000
const dt = (s) => new Date(s + 'T00:00:00Z')
const daysBetween = (a, b) => Math.round((b - a) / DAY)

const money0 = (n) => '$' + Math.abs(Math.round(n)).toLocaleString('en-US')
const money2 = (n) => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtD = (s) => s ? dt(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '—'
const fmtLong = (s) => dt(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

const TABLES = ['arp_customers', 'arp_invoices', 'arp_invoice_lines', 'arp_payments', 'arp_send_log']

export default function ArDesk() {
  const [raw, setRaw] = useState(null)
  const [err, setErr] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [selected, setSelected] = useState(null) // Set of customer ids
  const [invoiceModal, setInvoiceModal] = useState(null)
  const [stmtModal, setStmtModal] = useState(null)
  const [run, setRun] = useState(null) // null | 'confirm' | progress number | 'done'
  const [sentInvoices, setSentInvoices] = useState({})
  const [ranOnce, setRanOnce] = useState(false)

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

  useEffect(() => {
    if (M && selected === null) setSelected(new Set(M.rows.map((c) => c.id)))
  }, [M]) // eslint-disable-line react-hooks/exhaustive-deps

  if (err) return <Frame><div className="card" style={{ padding: '28px', color: INK }}>Couldn&rsquo;t load demo data: {err}</div></Frame>
  if (!M || selected === null) return <Frame><div style={{ padding: '60px 0', color: MUTED }}>Loading…</div></Frame>

  const toggle = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const allChecked = selected.size === M.rows.length
  const sendList = M.rows.filter((c) => selected.has(c.id))

  return (
    <Frame>
      <h1 style={{ fontSize: '26px', letterSpacing: '-0.01em', marginBottom: '8px' }}>Send statements</h1>
      <p style={{ fontSize: '14px', color: SLATE, lineHeight: 1.6, maxWidth: '600px', marginBottom: '18px' }}>
        <b style={{ color: INK }}>{M.rows.length} customers owe you {money0(M.arTotal)}.</b> Everyone&rsquo;s
        checked — uncheck anyone you want to skip, then hit send. Statements go out from{' '}
        <b style={{ color: INK }}>{SENDER_EMAIL}</b>, so replies come straight back to you.
      </p>

      {ranOnce && (
        <div style={{ background: '#EDF7EA', border: `1px solid ${GREEN}`, borderRadius: '3px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: INK }}>
          <b>Statements sent.</b> {sendList.filter((c) => !c.bouncing).length} went out from {SENDER_EMAIL} (demo — nothing actually emails).
          {sendList.some((c) => c.bouncing) && <> {sendList.filter((c) => c.bouncing).length} held back — bad email address.</>}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${RULE}`, gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: SLATE, cursor: 'pointer' }}>
            <input type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(M.rows.map((c) => c.id)))} style={{ width: '15px', height: '15px', accentColor: GREEN }} />
            {selected.size} of {M.rows.length} selected
          </label>
          <button className="primary" disabled={selected.size === 0} onClick={() => setRun('confirm')}>
            SEND {selected.size} STATEMENT{selected.size === 1 ? '' : 'S'}
          </button>
        </div>
        <table>
          <thead><tr>
            <th className="th" style={{ width: '34px' }}></th>
            <th className="th">Customer</th>
            <th className="th r">They owe</th>
            <th className="th r">How late</th>
            <th className="th">Last statement</th>
            <th className="th" style={{ width: '90px' }}></th>
          </tr></thead>
          <tbody>
            {M.rows.map((c) => (
              <React.Fragment key={c.id}>
                <tr className="rowbtn" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                  <td className="td" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} style={{ width: '15px', height: '15px', accentColor: GREEN, cursor: 'pointer' }} />
                  </td>
                  <td className="td ink" style={{ fontWeight: 600, whiteSpace: 'normal' }}>
                    {c.name}
                    {c.bouncing && <div style={{ fontSize: '11px', color: RED, fontWeight: 600 }}>email bouncing — fix address</div>}
                  </td>
                  <td className="td r ink" style={{ fontWeight: 700 }}>{money0(c.balance)}</td>
                  <td className="td r" style={{ color: c.oldest > 60 ? RED : SLATE, fontWeight: c.oldest > 60 ? 700 : 400 }}>
                    {c.oldest <= 0 ? 'not due yet' : `${c.oldest} days`}
                  </td>
                  <td className="td" style={{ color: c.stmtAge == null || c.stmtAge > 60 ? INK : SLATE }}>
                    {c.lastStmt ? `${fmtD(c.lastStmt)} · ${c.stmtAge}d ago` : 'never'}
                  </td>
                  <td className="td r"><button className="ghost" onClick={(e) => { e.stopPropagation(); setStmtModal(c.id) }}>PREVIEW</button></td>
                </tr>
                {expanded === c.id && (
                  <tr><td colSpan={6} style={{ padding: 0, borderBottom: `1px solid ${RULE}` }}>
                    <div style={{ background: '#FAF9F5', padding: '10px 16px 14px' }}>
                      <div style={{ fontSize: '10.5px', letterSpacing: '.08em', color: MUTED, fontWeight: 700, margin: '4px 0 8px' }}>THEIR OPEN INVOICES — CLICK ONE TO VIEW OR SEND IT</div>
                      {c.invs.map((i) => (
                        <div key={i.id} className="invrow" onClick={() => setInvoiceModal(i)}>
                          <span style={{ fontWeight: 600, color: INK }}>#{i.doc_num}</span>
                          <span style={{ color: MUTED }}>{fmtD(i.txn_date)}</span>
                          <span style={{ color: i.dpd > 0 ? RED : MUTED }}>{i.dpd > 0 ? `${i.dpd}d late` : 'current'}</span>
                          <span style={{ flex: 1 }}>
                            {sentInvoices[i.id] ? <span className="tag">sent · demo</span>
                              : i.email_status === 'never_sent' ? <span className="tag warn">never emailed</span>
                              : i.email_status === 'bounced' ? <span className="tag warn">bounced</span> : null}
                          </span>
                          <span style={{ fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{money2(Number(i.balance))}</span>
                        </div>
                      ))}
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {M.neverSentCount > 0 && (
        <p style={{ fontSize: '12px', color: MUTED, marginTop: '14px', lineHeight: 1.6 }}>
          Heads up: {M.neverSentCount} invoices ({money0(M.neverSentTotal)}) were created in QuickBooks but never emailed to anyone —
          they&rsquo;re marked <span className="tag warn">never emailed</span> inside each customer. A statement covers them too.
        </p>
      )}

      <div style={{ marginTop: '26px', paddingTop: '14px', borderTop: `1px solid ${RULE}`, fontSize: '11px', color: MUTED, lineHeight: 1.7 }}>
        Reads QuickBooks · sends from your own email · nothing posts back to the books.
        Demo with invented numbers — no email actually sends. In production, invoices are the exact PDFs QuickBooks generates.
      </div>

      {invoiceModal && <InvoiceModal M={M} inv={invoiceModal} onClose={() => setInvoiceModal(null)} sentInvoices={sentInvoices} setSentInvoices={setSentInvoices} />}
      {stmtModal != null && <StatementModal M={M} custId={stmtModal} onClose={() => setStmtModal(null)} />}
      {run != null && <RunModal list={sendList} onClose={(finished) => { setRun(null); if (finished) setRanOnce(true) }} run={run} setRun={setRun} />}
    </Frame>
  )
}

function Frame({ children }) {
  return (
    <>
      <Head>
        <title>{BIZ} — Statements</title>
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
        .card{background:${WHITE};border:1px solid ${RULE};border-radius:3px;overflow-x:auto}
        .th{padding:6px 10px;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:${MUTED};font-weight:600;text-align:left;border-bottom:1px solid ${SLATE};white-space:nowrap}
        .th.r{text-align:right}
        .td{padding:9px 10px;border-bottom:1px solid ${RULE};color:${SLATE};font-size:12.5px;white-space:nowrap;vertical-align:top}
        .td.r{text-align:right}
        .td.ink{color:${INK}}
        .rowbtn{cursor:pointer}
        .rowbtn:hover td{background:#FAF9F5}
        .ghost{border:1px solid #C7C3B8;background:${WHITE};color:${SLATE};font-size:10.5px;font-weight:600;letter-spacing:.06em;padding:4px 10px;border-radius:2px;cursor:pointer}
        .ghost:hover{border-color:${SLATE}}
        .primary{border:none;background:${GREEN};color:${WHITE};font-size:11px;font-weight:700;letter-spacing:.06em;padding:9px 18px;border-radius:2px;cursor:pointer}
        .primary:disabled{opacity:.55;cursor:default}
        .tag{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.04em;padding:1px 7px;border-radius:2px;border:1px solid ${RULE};color:${MUTED};white-space:nowrap}
        .tag.warn{border-color:${RED};color:${RED}}
        .invrow{display:flex;gap:14px;align-items:baseline;padding:6px 8px;border-bottom:1px solid ${RULE};cursor:pointer;font-size:12.5px}
        .invrow:last-child{border-bottom:none}
        .invrow:hover{background:#F1EFE8}
        @media print{
          body *{visibility:hidden}
          .print-doc,.print-doc *{visibility:visible}
          .print-doc{position:absolute;left:0;top:0;width:100%;box-shadow:none!important;border:none!important;max-height:none!important;overflow:visible!important}
          html,body{background:${WHITE}}
        }
      `}</style>
      <div style={{ background: GREEN, color: WHITE, padding: '9px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 600, letterSpacing: '.12em', flexWrap: 'wrap', gap: '4px' }}>
        <span>{BIZ.toUpperCase()}</span>
        <span style={{ fontWeight: 500, letterSpacing: '.08em' }}>DEMO · SYNTHETIC DATA · AS OF AUG 21, 2026</span>
      </div>
      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '30px 18px 40px' }}>{children}</div>
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

  const open = raw.invoices.filter((i) => i.status === 'open').map((i) => ({
    ...i, cust: custById[i.customer_id],
    dpd: daysBetween(dt(i.due_date), AS_OF),
    lines: linesByInv[i.id] || [],
  }))

  const lastStmt = {}
  const bouncing = {}
  for (const s of raw.sendLog) {
    if (s.kind === 'statement' && (!lastStmt[s.customer_id] || s.sent_at > lastStmt[s.customer_id])) lastStmt[s.customer_id] = s.sent_at
    if (s.status === 'bounced' && s.sent_at >= '2026-03-01') bouncing[s.customer_id] = true
  }

  const rows = raw.customers.map((c) => {
    const invs = open.filter((i) => i.customer_id === c.id).sort((a, b) => b.dpd - a.dpd)
    const balance = invs.reduce((s, i) => s + Number(i.balance), 0)
    return {
      ...c, invs, balance,
      oldest: invs.length ? Math.max(...invs.map((i) => i.dpd)) : null,
      lastStmt: lastStmt[c.id] || null,
      stmtAge: lastStmt[c.id] ? daysBetween(dt(lastStmt[c.id]), AS_OF) : null,
      bouncing: !!bouncing[c.id],
    }
  }).filter((c) => c.balance >= 100).sort((a, b) => b.balance - a.balance)

  const arTotal = rows.reduce((s, c) => s + c.balance, 0)
  const neverSent = open.filter((i) => i.email_status === 'never_sent')

  return {
    rows, arTotal, custById, paysByCust,
    neverSentCount: neverSent.length,
    neverSentTotal: neverSent.reduce((s, i) => s + Number(i.balance), 0),
  }
}

// ── modals ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(27,32,39,.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(27,32,39,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 20px', borderBottom: `1px solid ${RULE}`, position: 'sticky', top: 0, background: WHITE, zIndex: 2 }}>
          <h2 style={{ fontSize: '17px' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '15px', cursor: 'pointer', color: MUTED }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// The batch send — confirm, quick progress, done.
function RunModal({ list, onClose, run, setRun }) {
  const done = typeof run === 'number' && run >= list.length
  useEffect(() => {
    if (typeof run !== 'number' || done) return
    const t = setTimeout(() => setRun(run + 1), 80)
    return () => clearTimeout(t)
  }, [run, done, setRun])
  return (
    <Modal title={done ? 'Done.' : 'Send statements'} onClose={() => onClose(done)}>
      <div style={{ padding: '18px 20px' }}>
        {run === 'confirm' && (
          <>
            <p style={{ fontSize: '13.5px', color: SLATE, lineHeight: 1.65, marginBottom: '16px' }}>
              Send <b style={{ color: INK }}>{list.length} statements</b> from <b style={{ color: INK }}>{SENDER_EMAIL}</b>?
              {list.some((c) => c.bouncing) && <> ({list.filter((c) => c.bouncing).length} will be held — their email is bouncing.)</>}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="ghost" onClick={() => onClose(false)}>CANCEL</button>
              <button className="primary" onClick={() => setRun(0)}>SEND</button>
            </div>
          </>
        )}
        {typeof run === 'number' && (
          <>
            <div style={{ maxHeight: '280px', overflowY: 'auto', border: `1px solid ${RULE}`, borderRadius: '3px', marginBottom: '14px' }}>
              {list.map((c, k) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: `1px solid ${RULE}`, fontSize: '12px' }}>
                  <span style={{ fontWeight: 600, color: k < run ? INK : '#B9BDC3' }}>{c.name}</span>
                  <span style={{ color: k < run ? (c.bouncing ? RED : SLATE) : '#B9BDC3' }}>
                    {k < run ? (c.bouncing ? 'held — bad email' : 'sent') : k === run ? 'sending…' : ''}
                  </span>
                </div>
              ))}
            </div>
            {done && (
              <p style={{ fontSize: '13px', color: SLATE, lineHeight: 1.6, marginBottom: '14px' }}>
                <b style={{ color: INK }}>{list.filter((c) => !c.bouncing).length} statements sent</b> (demo — nothing actually emailed).
                Replies come back to {SENDER_EMAIL}.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className={done ? 'primary' : 'ghost'} onClick={() => onClose(done)}>{done ? 'DONE' : 'CLOSE'}</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

// Invoice preview, styled after QBO's template. In production this is the
// literal PDF Intuit generates for the invoice.
function InvoiceModal({ M, inv, onClose, sentInvoices, setSentInvoices }) {
  const c = inv.cust || M.custById[inv.customer_id]
  const sent = !!sentInvoices[inv.id]
  const lines = inv.lines.length ? inv.lines : [{ id: 0, item: 'Supplies & freight', qty: 1, rate: inv.amount, amount: inv.amount }]
  return (
    <Modal title={`Invoice #${inv.doc_num}`} onClose={onClose}>
      <div style={{ padding: '20px' }}>
        <div className="card print-doc" style={{ padding: '24px 26px', marginBottom: '14px', overflowX: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 700, color: INK }}>{BIZ}</div>
              <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.6, marginTop: '4px' }}>214 Mill Street · Rochester, NY 14614<br />(585) 555-0114 · {SENDER_EMAIL}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', letterSpacing: '.18em', color: SLATE, fontWeight: 300 }}>INVOICE</div>
              <div style={{ fontSize: '11.5px', color: SLATE, marginTop: '4px' }}># {inv.doc_num}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '14px', flexWrap: 'wrap' }}>
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
              {lines.map((l) => (
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
              <div style={{ fontFamily: serif, fontSize: '25px', fontWeight: 700, color: INK }}>{money2(Number(inv.balance))}</div>
              {Number(inv.balance) < Number(inv.amount) && <div style={{ fontSize: '11px', color: MUTED }}>of {money2(Number(inv.amount))} — partial payment received</div>}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.6, marginBottom: '14px' }}>
          Demo preview. In production this is the exact PDF QuickBooks generates for this invoice.
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="ghost" onClick={onClose}>CLOSE</button>
          <button className="primary" disabled={sent} onClick={() => setSentInvoices((s) => ({ ...s, [inv.id]: true }))}>
            {sent ? 'SENT (DEMO)' : 'SEND IT'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// The statement — the document QuickBooks has no button for.
function StatementModal({ M, custId, onClose }) {
  const c = M.rows.find((x) => x.id === custId)
  if (!c) return null
  const pays = (M.paysByCust[c.id] || []).filter((p) => daysBetween(dt(p.date), AS_OF) <= 60).sort((a, b) => b.date.localeCompare(a.date))
  return (
    <Modal title={`Statement — ${c.name}`} onClose={onClose}>
      <div style={{ padding: '20px' }}>
        <div className="card print-doc" style={{ padding: '24px 26px', marginBottom: '14px', overflowX: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 700, color: INK }}>{BIZ}</div>
              <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.6, marginTop: '4px' }}>214 Mill Street · Rochester, NY 14614<br />(585) 555-0114 · {SENDER_EMAIL}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', letterSpacing: '.14em', color: SLATE, fontWeight: 300 }}>STATEMENT</div>
              <div style={{ fontSize: '11.5px', color: SLATE, marginTop: '4px' }}>as of {fmtLong(AS_OF.toISOString().slice(0, 10))}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '9.5px', letterSpacing: '.1em', color: MUTED, fontWeight: 700, marginBottom: '4px' }}>FOR</div>
              <div style={{ fontSize: '12.5px', color: INK, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: '11.5px', color: SLATE }}>{c.contact} · {c.email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700 }}>AMOUNT DUE</div>
              <div style={{ fontFamily: serif, fontSize: '25px', fontWeight: 700, color: INK }}>{money2(c.balance)}</div>
            </div>
          </div>
          <table>
            <thead><tr><th className="th">Date</th><th className="th">Invoice</th><th className="th">Due</th><th className="th r">Open balance</th></tr></thead>
            <tbody>
              {[...c.invs].sort((a, b) => a.txn_date.localeCompare(b.txn_date)).map((i) => (
                <tr key={i.id}>
                  <td className="td">{fmtD(i.txn_date)}</td>
                  <td className="td ink" style={{ fontWeight: 600 }}>#{i.doc_num}</td>
                  <td className="td" style={{ fontWeight: i.dpd > 0 ? 700 : 400, color: i.dpd > 0 ? INK : SLATE }}>{fmtD(i.due_date)}{i.dpd > 0 ? ` · ${i.dpd}d past due` : ''}</td>
                  <td className="td r ink" style={{ fontWeight: 600 }}>{money2(Number(i.balance))}</td>
                </tr>
              ))}
              <tr style={{ background: '#EEEBE3' }}>
                <td className="td ink" colSpan={3} style={{ fontWeight: 700 }}>Total due</td>
                <td className="td r ink" style={{ fontWeight: 700, fontFamily: serif, fontSize: '15px' }}>{money2(c.balance)}</td>
              </tr>
            </tbody>
          </table>
          {pays.length > 0 && (
            <>
              <div style={{ fontSize: '10px', letterSpacing: '.1em', color: MUTED, fontWeight: 700, margin: '14px 0 4px' }}>PAYMENTS RECEIVED — LAST 60 DAYS. THANK YOU.</div>
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

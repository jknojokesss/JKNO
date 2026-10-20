import React, { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

// Live AR desk: pulls a client's real open invoices straight from QuickBooks
// and emails the actual QBO invoice PDF from our own address (GMAIL_USER).
// Read-only against the books — the only thing that happens here is email.

const INK = '#1A1A1A', BORDER = '#E5E5E5', MUTED = '#777', RED = '#CC2222', GREEN = '#1E7A3A'
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace'

// Nothing on this page may wait on a promise that never settles.
const withTimeout = (p, ms) => Promise.race([
  p,
  new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
])

const AR_E2E = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_AR_E2E === '1'

export default function ArAdmin() {
  const router = useRouter()
  const [client, setClient] = useState('jkno')
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState(null)
  const [needsReconnect, setNeedsReconnect] = useState(false)
  const [toByInv, setToByInv] = useState({})
  const [sentByInv, setSentByInv] = useState({})
  const [mailByInv, setMailByInv] = useState({})
  const [reminderInv, setReminderInv] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [refs, setRefs] = useState(null)
  const [stmtTo, setStmtTo] = useState({})
  const [stmtSent, setStmtSent] = useState({})
  const [csort, setCsort] = useState('balance')
  const [cdir, setCdir] = useState('desc')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('due')
  const [dir, setDir] = useState('asc')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    if (AR_E2E) {
      setData({
        company: 'JK No Jokes Financials',
        environment: 'e2e',
        invoices: [{
          id: '999',
          doc: '1042',
          date: '2026-10-01',
          due: '2026-10-31',
          balance: 500,
          customer: 'MNE Trading',
          email: 'sales@eminenttrading.com',
          emailStatus: 'NotSet',
        }],
      })
      setMailByInv({
        999: {
          sendCount: 1,
          reminderCount: 0,
          firstSendAt: '2026-10-01T15:00:00Z',
          firstSendTo: 'sales@eminenttrading.com',
        },
      })
      setToByInv({ 999: 'sales@eminenttrading.com' })
      setReminderInv({
        id: '999',
        doc: '1042',
        due: '2026-10-31',
        customer: 'MNE Trading',
        email: 'sales@eminenttrading.com',
      })
      return
    }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/admin'); return }
      const { data: adminData } = await supabase.from('admins').select('email').eq('email', session.user.email).single()
      if (!adminData) router.push('/admin')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const call = async (path, opts = {}) => {
    // getSession() waits on any in-flight token refresh, and a stalled
    // refresh never resolves — that is a spinner that spins for ever with
    // nothing in the network tab. Treat a stall as signed out.
    const session = await withTimeout(supabase.auth.getSession(), 15000)
      .then((r) => r.data.session)
      .catch(() => null)
    if (!session) { router.push('/admin'); throw new Error('Signed out — sign in again.') }
    // A request that never settles leaves the page saying "Loading…" for
    // ever, which is worse than an error. Give up after 45s and say so.
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 45000)
    let res
    try {
      res = await fetch(path, {
        ...opts,
        signal: ctl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(opts.headers || {}) },
      })
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error('QuickBooks did not answer within 45 seconds. It is usually busy rather than broken — try again, and tell JK if it keeps happening.')
      }
      throw e
    } finally { clearTimeout(timer) }
    if (opts.raw) return res
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch (e) {
      throw new Error(`The server returned an error page (HTTP ${res.status}), not data.`)
    }
    if (!res.ok) {
      const err = new Error(json.error || 'Request failed')
      err.needsReconnect = !!json.needsReconnect
      throw err
    }
    return json
  }

  const load = async () => {
    setBusy('load'); setError(null); setNeedsReconnect(false); setData(null)
    try {
      const json = await call(`/api/qbo/ar?client=${encodeURIComponent(client)}`)
      setData(json)
      setMailByInv(json.mailByInvoice || {})
      const prefill = {}
      for (const i of json.invoices) prefill[i.id] = i.email || ''
      setToByInv(prefill)
    } catch (e) {
      setError(String(e.message || e))
      setNeedsReconnect(!!e.needsReconnect)
    } finally { setBusy('') }
  }

  const openPdf = async (inv) => {
    setBusy('pdf' + inv.id); setError(null)
    try {
      const res = await call(`/api/qbo/ar?client=${encodeURIComponent(client)}&action=pdf&id=${inv.id}`, { raw: true })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `PDF failed (HTTP ${res.status})`)
      }
      const blob = await res.blob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch (e) { setError(String(e.message || e)) } finally { setBusy('') }
  }

  const send = async (inv) => {
    const to = (toByInv[inv.id] || '').trim()
    if (!to) { setError(`Fill in the "send to" address for invoice ${inv.doc} first.`); return }
    if (!window.confirm(`Email the real QuickBooks PDF for invoice ${inv.doc} (${money(inv.balance)}) to ${to}?`)) return
    setBusy('send' + inv.id); setError(null)
    try {
      const json = await call('/api/qbo/ar', { method: 'POST', body: JSON.stringify({ client, invoiceId: inv.id, to }) })
      setSentByInv((s) => ({ ...s, [inv.id]: json.sent }))
      setMailByInv((m) => ({
        ...m,
        [inv.id]: {
          ...(m[inv.id] || {}),
          sendCount: ((m[inv.id] && m[inv.id].sendCount) || 0) + 1,
          firstSendAt: (m[inv.id] && m[inv.id].firstSendAt) || new Date().toISOString(),
          firstSendTo: json.sent && json.sent.to,
        },
      }))
    } catch (e) { setError(String(e.message || e)) } finally { setBusy('') }
  }

  const todayISO = new Date().toISOString().slice(0, 10)
  const shown = useMemo(() => {
    const all = (data && data.invoices) || []
    const needle = q.trim().toLowerCase()
    let out = needle
      ? all.filter((i) => String(i.customer || '').toLowerCase().includes(needle)
                       || String(i.doc || '').toLowerCase().includes(needle))
      : all
    if (overdueOnly) out = out.filter((i) => i.due && i.due < todayISO)
    const cmp = {
      doc: (a, b) => {
        const na = Number(a.doc), nb = Number(b.doc)
        if (a.doc && b.doc && !isNaN(na) && !isNaN(nb)) return na - nb
        return String(a.doc || '').localeCompare(String(b.doc || ''))
      },
      customer: (a, b) => String(a.customer || '').localeCompare(String(b.customer || '')),
      date: (a, b) => String(a.date || '').localeCompare(String(b.date || '')),
      // No due date sorts last rather than first, either direction.
      due: (a, b) => String(a.due || '9999-99-99').localeCompare(String(b.due || '9999-99-99')),
      balance: (a, b) => a.balance - b.balance,
    }
    const base = cmp[sort] || cmp.due
    return [...out].sort((a, b) => (dir === 'asc' ? base(a, b) : -base(a, b)))
  }, [data, q, sort, dir, overdueOnly, todayISO])
  const shownTotal = shown.reduce((t, i) => t + i.balance, 0)
  // Click a column to sort by it; click it again to reverse. Amounts and
  // dates open on the end people actually want: biggest, and oldest-due.
  const sortBy = (field) => {
    if (sort === field) { setDir((d) => (d === 'asc' ? 'desc' : 'asc')); return }
    setSort(field)
    setDir(field === 'balance' ? 'desc' : 'asc')
  }
  const SortH = ({ field, label, right }) => (
    <th onClick={() => sortBy(field)} title="Sort by this column"
      style={{ textAlign: right ? 'right' : 'left', padding: '8px 10px', borderBottom: `1px solid ${INK}`,
               fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em',
               color: sort === field ? INK : MUTED, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
      {label}{sort === field ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  )

  return (
    <>
      <Head><title>AR — live invoices</title><meta name="robots" content="noindex" /></Head>
      <div style={{ fontFamily: '-apple-system, Segoe UI, sans-serif', color: INK, maxWidth: '980px', margin: '0 auto', padding: '40px 20px 80px' }}>
        <h1 style={{ fontSize: '22px', marginBottom: '6px' }}>Live invoices — from QuickBooks</h1>
        <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, marginBottom: '20px', maxWidth: '640px' }}>
          Pulls the client&rsquo;s open invoices straight from their connected QuickBooks and emails the
          actual QBO invoice PDF from our address. Read-only against the books — nothing posts.
        </p>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px' }}>Client&nbsp;
            <input value={client} onChange={(e) => setClient(e.target.value)} style={{ fontFamily: mono, fontSize: '13px', padding: '6px 8px', border: `1px solid ${BORDER}`, borderRadius: '4px', width: '120px' }} />
          </label>
          <button onClick={load} disabled={busy === 'load'} style={btn(true)}>{busy === 'load' ? 'Loading…' : 'Load invoices'}</button>
          <button onClick={async () => {
            setShowNew(true)
            if (!refs) {
              try { setRefs(await call(`/api/qbo/ar?client=${encodeURIComponent(client)}&action=refs`)) }
              catch (e) { setError(String(e.message || e)); setShowNew(false) }
            }
          }} style={btn(false)}>+ New invoice</button>
          {data && <span style={{ fontSize: '13px', color: MUTED }}>
            {data.company || '(no company name)'} · {data.environment} · {data.invoices.length} open
          </span>}
        </div>

        {error && (
          <div style={{ border: `1px solid ${RED}`, borderRadius: '4px', padding: '12px 14px', fontSize: '13px', color: RED, marginBottom: '16px', lineHeight: 1.5 }}>
            {error}
            {needsReconnect && <div style={{ marginTop: '8px' }}>
              <a href={`/api/qbo/connect?client=${encodeURIComponent(client)}`} style={{ color: INK, fontWeight: 600 }}>
                Connect QuickBooks for &ldquo;{client}&rdquo; →
              </a>{' '}
              <span style={{ color: MUTED }}>(sign in at Intuit and pick the company; then come back and Load again)</span>
            </div>}
          </div>
        )}

        {reminderInv && data && (
          <ReminderModal
            inv={reminderInv}
            companyName={data.company}
            mail={mailByInv[reminderInv.id]}
            defaultTo={(toByInv[reminderInv.id] || reminderInv.email || '').trim()}
            onClose={() => setReminderInv(null)}
            onSent={(meta) => {
              setMailByInv((m) => ({
                ...m,
                [reminderInv.id]: {
                  ...(m[reminderInv.id] || {}),
                  reminderCount: ((m[reminderInv.id] && m[reminderInv.id].reminderCount) || 0) + 1,
                  lastReminderAt: meta.sentAt,
                  lastReminderTo: meta.to,
                  firstSendAt: (m[reminderInv.id] && m[reminderInv.id].firstSendAt) || null,
                  sendCount: (m[reminderInv.id] && m[reminderInv.id].sendCount) || 0,
                },
              }))
              setReminderInv(null)
            }}
            call={call}
            client={client}
          />
        )}

        {showNew && (
          <NewInvoice
            client={client}
            refs={refs}
            call={call}
            onClose={() => setShowNew(false)}
            onCreated={(created) => { setShowNew(false); load(); window.alert(`Created invoice #${created.doc} for ${money(created.total)} in QuickBooks.`) }}
          />
        )}

        {data && data.invoices.length === 0 && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '16px', fontSize: '13px', color: MUTED }}>
            No open invoices in this company. Create one in QuickBooks, then Load again.
          </div>
        )}

        {data && data.invoices.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
            <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(50) }} placeholder="Search customer or invoice #"
              style={{ fontSize: '13px', padding: '7px 9px', border: `1px solid ${BORDER}`, borderRadius: '4px', width: '250px' }} />
            <label style={{ fontSize: '12.5px', color: MUTED, display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input type="checkbox" checked={overdueOnly} onChange={(e) => { setOverdueOnly(e.target.checked); setLimit(50) }} />
              Past due only
            </label>
            {(q || overdueOnly) && <button onClick={() => { setQ(''); setOverdueOnly(false); setLimit(50) }} style={btn(false)}>Clear</button>}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: '12.5px', color: MUTED }}>
              {shown.length.toLocaleString()} of {data.invoices.length.toLocaleString()} · {money(shownTotal)}
            </span>
          </div>
        )}

        {data && data.invoices.length > 0 && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
              <thead><tr>
                <SortH field="doc" label="Invoice" />
                <SortH field="customer" label="Customer" />
                <SortH field="date" label="Date" />
                <SortH field="due" label="Due" />
                <SortH field="balance" label="Balance" right />
                {['QBO email status', 'Send to', ''].map((h, k) => (
                  <th key={k} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${INK}`, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', color: MUTED, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {shown.slice(0, limit).map((inv) => {
                  const sent = sentByInv[inv.id]
                  const mail = mailByInv[inv.id] || {}
                  const reminderLabel = mail.lastReminderAt
                    ? `Reminder sent ${formatShortDate(mail.lastReminderAt)}${mail.reminderCount > 1 ? ` (${mail.reminderCount})` : ''}`
                    : null
                  return (
                    <tr key={inv.id}>
                      <td style={td()}>
                        {inv.doc ? <b>#{inv.doc}</b> : (
                          <button onClick={async () => {
                            setBusy('num' + inv.id); setError(null)
                            try { await call('/api/qbo/ar', { method: 'POST', body: JSON.stringify({ action: 'renumber', client, invoiceId: inv.id }) }); load() }
                            catch (e) { setError(String(e.message || e)) } finally { setBusy('') }
                          }} disabled={busy === 'num' + inv.id} style={btn(false)} title="This invoice has no number — stamp the next one">
                            {busy === 'num' + inv.id ? '…' : 'Assign #'}
                          </button>
                        )}
                      </td>
                      <td style={td()}>{inv.customer}</td>
                      <td style={td()}>{inv.date || '—'}</td>
                      <td style={td()}>{inv.due || '—'}</td>
                      <td style={{ ...td(), textAlign: 'right', fontWeight: 700 }}>{money(inv.balance)}</td>
                      <td style={td()}>{inv.emailStatus === 'EmailSent' ? 'sent by QBO' : inv.emailStatus === 'NeedToSend' ? 'queued, never sent' : 'not emailed'}</td>
                      <td style={td()}>
                        <input value={toByInv[inv.id] || ''} onChange={(e) => setToByInv((s) => ({ ...s, [inv.id]: e.target.value }))}
                          placeholder="email address" style={{ fontFamily: mono, fontSize: '12px', padding: '5px 7px', border: `1px solid ${BORDER}`, borderRadius: '4px', width: '210px' }} />
                      </td>
                      <td style={{ ...td(), whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                            <button onClick={() => openPdf(inv)} disabled={busy === 'pdf' + inv.id} style={btn(false)}>{busy === 'pdf' + inv.id ? '…' : 'PDF'}</button>
                            {sent
                              ? <span style={{ color: GREEN, fontWeight: 600 }}>sent ✓</span>
                              : <button onClick={() => send(inv)} disabled={busy === 'send' + inv.id} style={btn(true)}>{busy === 'send' + inv.id ? 'Sending…' : 'Send'}</button>}
                            {inv.doc && (
                              <button type="button" onClick={() => setReminderInv(inv)} style={btn(false)}>Send reminder</button>
                            )}
                          </div>
                          {reminderLabel && <span style={{ fontSize: '11.5px', color: MUTED, lineHeight: 1.4 }}>{reminderLabel}</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.invoices.length > 0 && (() => {
          const byCust = {}
          for (const inv of data.invoices) {
            if (!inv.customerId) continue
            const g = byCust[inv.customerId] || (byCust[inv.customerId] = { id: inv.customerId, name: inv.customer, count: 0, balance: 0, email: null })
            g.count++; g.balance += inv.balance
            if (!g.email && inv.email) g.email = inv.email
          }
          const cmpC = {
            name: (a, b) => a.name.localeCompare(b.name),
            count: (a, b) => a.count - b.count,
            balance: (a, b) => a.balance - b.balance,
          }
          const baseC = cmpC[csort] || cmpC.balance
          const groups = Object.values(byCust).sort((a, b) => (cdir === 'asc' ? baseC(a, b) : -baseC(a, b)))
          const sortC = (field) => {
            if (csort === field) { setCdir((d) => (d === 'asc' ? 'desc' : 'asc')); return }
            setCsort(field)
            setCdir(field === 'name' ? 'asc' : 'desc')
          }
          const SortC = ({ field, label, right }) => (
            <th onClick={() => sortC(field)} title="Sort by this column"
              style={{ textAlign: right ? 'right' : 'left', padding: '8px 10px', borderBottom: `1px solid ${INK}`,
                       fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em',
                       color: csort === field ? INK : MUTED, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
              {label}{csort === field ? (cdir === 'asc' ? ' ▲' : ' ▼') : ''}
            </th>
          )
          const openStmt = async (g) => {
            setBusy('stmt' + g.id); setError(null)
            try {
              const res = await call(`/api/qbo/ar?client=${encodeURIComponent(client)}&action=statement&id=${g.id}`, { raw: true })
              if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `Statement failed (HTTP ${res.status})`) }
              const blob = await res.blob()
              window.open(URL.createObjectURL(blob), '_blank')
            } catch (e) { setError(String(e.message || e)) } finally { setBusy('') }
          }
          const sendStmt = async (g) => {
            const to = (stmtTo[g.id] ?? g.email ?? '').trim()
            if (!to) { setError(`Fill in the "send to" address for ${g.name} first.`); return }
            if (!window.confirm(`Email ${g.name}'s statement (${g.count} open invoice${g.count === 1 ? '' : 's'}, ${money(g.balance)}) to ${to}?`)) return
            setBusy('sendstmt' + g.id); setError(null)
            try {
              await call('/api/qbo/ar', { method: 'POST', body: JSON.stringify({ action: 'send-statement', client, customerId: g.id, to }) })
              setStmtSent((s) => ({ ...s, [g.id]: to }))
            } catch (e) { setError(String(e.message || e)) } finally { setBusy('') }
          }
          return (
            <div style={{ marginTop: '26px' }}>
              <h2 style={{ fontSize: '17px', marginBottom: '4px' }}>Statements — by customer</h2>
              <p style={{ fontSize: '12.5px', color: MUTED, lineHeight: 1.6, marginBottom: '12px', maxWidth: '640px' }}>
                The statement is built live from QuickBooks — open invoices, payments from the last 60 days,
                and an aging strip — and emails from your address. QuickBooks has no button for this; this is it.
              </p>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                  <thead><tr>
                    <SortC field="name" label="Customer" />
                    <SortC field="count" label="Open" right />
                    <SortC field="balance" label="Balance" right />
                    {['Send to', ''].map((h, k) => (
                      <th key={k} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${INK}`, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', color: MUTED, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {groups.map((g) => (
                      <tr key={g.id}>
                        <td style={td()}><b>{g.name}</b></td>
                        <td style={{ ...td(), textAlign: 'right' }}>{g.count}</td>
                        <td style={{ ...td(), textAlign: 'right', fontWeight: 700 }}>{money(g.balance)}</td>
                        <td style={td()}>
                          <input value={stmtTo[g.id] ?? g.email ?? ''} onChange={(e) => setStmtTo((s) => ({ ...s, [g.id]: e.target.value }))}
                            placeholder="email address" style={{ fontFamily: mono, fontSize: '12px', padding: '5px 7px', border: `1px solid ${BORDER}`, borderRadius: '4px', width: '210px' }} />
                        </td>
                        <td style={{ ...td(), whiteSpace: 'nowrap' }}>
                          <button onClick={() => openStmt(g)} disabled={busy === 'stmt' + g.id} style={btn(false)}>{busy === 'stmt' + g.id ? '…' : 'Preview'}</button>{' '}
                          {stmtSent[g.id]
                            ? <span style={{ color: GREEN, fontWeight: 600 }}>sent ✓</span>
                            : <button onClick={() => sendStmt(g)} disabled={busy === 'sendstmt' + g.id} style={btn(true)}>{busy === 'sendstmt' + g.id ? 'Sending…' : 'Send statement'}</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}

        <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6, marginTop: '18px', maxWidth: '640px' }}>
          The PDF is the one QuickBooks generates — template, logo and all. Emails send from{' '}
          the site&rsquo;s own mailbox (SMTP_USER) with the PDF attached, so replies come back to that inbox.
          Statements are our own document, built live from the books.
        </p>
      </div>
    </>
  )
}

// Create a real invoice in QuickBooks: preview first (writes nothing), then
// an explicit confirm posts it with the preview's requestId, so a retry
// cannot create it twice. This is the portal's only write to the books.
function NewInvoice({ client, refs, call, onClose, onCreated }) {
  const today = new Date().toISOString().slice(0, 10)
  const [customerId, setCustomerId] = useState('')
  const [txnDate, setTxnDate] = useState(today)
  const [dueDate, setDueDate] = useState('')
  const [emailTo, setEmailTo] = useState('')
  const [lines, setLines] = useState([{ itemId: '', description: '', qty: '1', rate: '' }])
  const [preview, setPreview] = useState(null) // { preview, requestId }
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState(null)

  const cust = refs && refs.customers.find((c) => String(c.id) === String(customerId))
  const setLine = (i, k, v) => setLines((ls) => ls.map((l, n) => (n === i ? { ...l, [k]: v } : l)))
  const total = lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0), 0)
  const body = () => ({
    action: 'create', client,
    invoice: {
      customerId, txnDate, dueDate: dueDate || undefined,
      emailTo: (emailTo || (cust && cust.email) || '').trim() || undefined,
      lines: lines.filter((l) => l.itemId || l.rate).map((l) => ({
        itemId: l.itemId, description: l.description.trim() || undefined,
        qty: parseFloat(l.qty) || 0, rate: parseFloat(l.rate) || 0,
      })),
    },
  })

  const doPreview = async () => {
    setBusy('preview'); setErr(null)
    try { setPreview(await call('/api/qbo/ar', { method: 'POST', body: JSON.stringify(body()) })) }
    catch (e) { setErr(String(e.message || e)) } finally { setBusy('') }
  }
  const doCreate = async () => {
    if (!window.confirm(`Create this invoice for ${preview.preview.customer} (${money(preview.preview.total)}) in QuickBooks? This writes to the books.`)) return
    setBusy('create'); setErr(null)
    try {
      const json = await call('/api/qbo/ar', { method: 'POST', body: JSON.stringify({ ...body(), confirm: true, requestId: preview.requestId }) })
      onCreated(json.created)
    } catch (e) { setErr(String(e.message || e)) } finally { setBusy('') }
  }

  const input = (extra = {}) => ({ fontSize: '13px', padding: '6px 8px', border: `1px solid ${BORDER}`, borderRadius: '4px', ...extra })

  return (
    <div style={{ border: `1px solid ${INK}`, borderRadius: '4px', padding: '16px', marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <b style={{ fontSize: '14px' }}>New invoice — writes to QuickBooks after preview + confirm</b>
        <button onClick={onClose} style={btn(false)}>Close</button>
      </div>
      {!refs && <div style={{ fontSize: '13px', color: MUTED }}>Loading customers and items…</div>}
      {refs && (
        <>
          {(refs.warnings || []).map((w, k) => (
            <div key={k} style={{ fontSize: '12.5px', color: RED, lineHeight: 1.6, marginBottom: '10px' }}>{w}</div>
          ))}
          {refs.items.length === 0 && (
            <div style={{ fontSize: '12.5px', color: RED, lineHeight: 1.6, marginBottom: '10px' }}>
              No products/services came back from QuickBooks, and an invoice line needs one.
              Add one under Sales → Products &amp; services, then reopen this form.
            </div>
          )}
          {refs.customers.length === 0 && (
            <div style={{ fontSize: '12.5px', color: RED, lineHeight: 1.6, marginBottom: '10px' }}>
              No active customers came back from QuickBooks for this company.
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', color: MUTED }}>Customer<br />
              <select value={customerId} onChange={(e) => {
                const picked = refs.customers.find((c) => String(c.id) === e.target.value)
                setCustomerId(e.target.value)
                // Fill the bill-to from the customer record; keep a hand-typed
                // address only if it isn't just the previous customer's email.
                const prevEmail = cust && cust.email
                if (picked && (!emailTo || emailTo === prevEmail)) setEmailTo(picked.email || '')
                setPreview(null)
              }} style={input({ minWidth: '220px' })}>
                <option value="">— pick —</option>
                {refs.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label style={{ fontSize: '12px', color: MUTED }}>Invoice date<br />
              <input type="date" value={txnDate} onChange={(e) => { setTxnDate(e.target.value); setPreview(null) }} style={input()} />
            </label>
            <label style={{ fontSize: '12px', color: MUTED }}>Due date (optional)<br />
              <input type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); setPreview(null) }} style={input()} />
            </label>
            <label style={{ fontSize: '12px', color: MUTED }}>Bill-to email<br />
              <input value={emailTo} onChange={(e) => { setEmailTo(e.target.value); setPreview(null) }} placeholder={(cust && cust.email) || 'customer email'} style={input({ width: '220px' })} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 60px 90px 100px 30px', gap: '8px', alignItems: 'center', overflowX: 'auto' }}>
            {['Product / service', 'Description (shows on the invoice)', 'Qty', 'Rate', 'Amount', ''].map((h, k) => (
              <div key={k} style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.06em', color: MUTED, fontWeight: 600, textAlign: k >= 2 && k <= 4 ? 'right' : 'left' }}>{h}</div>
            ))}
            {lines.map((l, i) => {
              const amount = (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0)
              return (
                <React.Fragment key={i}>
                  <select value={l.itemId} onChange={(e) => {
                    // Carry the item's rate and description onto the line, the
                    // way QuickBooks does. A value the user typed is kept; one
                    // that merely came from the previous item is replaced.
                    const prev = refs.items.find((x) => String(x.id) === String(l.itemId))
                    const item = refs.items.find((x) => String(x.id) === e.target.value)
                    setLines((ls) => ls.map((row, n) => {
                      if (n !== i) return row
                      const next = { ...row, itemId: e.target.value }
                      if (item) {
                        const rateWasTheirs = row.rate && !(prev && String(prev.rate) === String(row.rate))
                        const descWasTheirs = row.description && !(prev && prev.description === row.description)
                        if (!rateWasTheirs) next.rate = item.rate != null ? String(item.rate) : ''
                        if (!descWasTheirs) next.description = item.description || ''
                      }
                      return next
                    }))
                    setPreview(null)
                  }} style={input()}>
                    <option value="">— pick —</option>
                    {refs.items.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <input value={l.description} onChange={(e) => { setLine(i, 'description', e.target.value); setPreview(null) }} placeholder="e.g. August bookkeeping" style={input()} />
                  <input value={l.qty} onChange={(e) => { setLine(i, 'qty', e.target.value); setPreview(null) }} style={input({ textAlign: 'right' })} />
                  <input value={l.rate} onChange={(e) => { setLine(i, 'rate', e.target.value.replace(/[^0-9.-]/g, '')); setPreview(null) }}
                    placeholder="0.00" title="A credit or discount goes in as a negative rate" style={input({ textAlign: 'right' })} />
                  <div style={{ fontSize: '13px', fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: amount < 0 ? RED : undefined }}>
                    {amount ? (amount < 0 ? '−' + money(Math.abs(amount)) : money(amount)) : '—'}
                  </div>
                  {lines.length > 1
                    ? <button onClick={() => { setLines((ls) => ls.filter((_, n) => n !== i)); setPreview(null) }} style={btn(false)}>×</button>
                    : <span />}
                </React.Fragment>
              )
            })}
          </div>
          <div style={{ fontSize: '11px', color: MUTED, marginTop: '8px' }}>
            Loaded from QuickBooks: {refs.customers.length} customers · {refs.items.length} products/services
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setLines((ls) => [...ls, { itemId: '', description: '', qty: '1', rate: '' }])} style={btn(false)}>+ line</button>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Total {money(total)}</span>
            <span style={{ flex: 1 }} />
            {!preview && <button onClick={doPreview} disabled={busy === 'preview' || !customerId} style={btn(true)}>{busy === 'preview' ? 'Checking…' : 'Preview'}</button>}
            {preview && (
              <>
                <span style={{ fontSize: '12.5px', color: GREEN }}>
                  Ready: {preview.preview.doc ? `invoice #${preview.preview.doc} · ` : ''}{preview.preview.customer} · {money(preview.preview.total)}{preview.preview.email ? ` · bill-to ${preview.preview.email}` : ''}
                </span>
                <button onClick={doCreate} disabled={busy === 'create'} style={btn(true)}>{busy === 'create' ? 'Creating…' : 'Create in QuickBooks'}</button>
              </>
            )}
          </div>
          {err && <div style={{ fontSize: '12.5px', color: RED, marginTop: '8px', lineHeight: 1.5 }}>{err}</div>}
        </>
      )}
    </div>
  )
}

function formatShortDate(isoOrTs) {
  if (!isoOrTs) return ''
  const s = String(isoOrTs)
  const datePart = s.includes('T') ? s.slice(0, 10) : s
  if (!/^\d{4}-\d{2}-\d{2}/.test(datePart)) return s
  return new Date(datePart + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function formatLongDate(iso) {
  if (!iso) return null
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function reminderDefaults(inv, companyName, mail) {
  const doc = inv.doc || inv.id
  const co = companyName || 'JK No Jokes Financials'
  const due = formatLongDate(inv.due)
  const subject = due
    ? `Reminder: Invoice #${doc} from ${co}, due ${due}`
    : `Reminder: Invoice #${doc} from ${co}`
  const sentOn = mail && mail.firstSendAt ? formatLongDate(String(mail.firstSendAt).slice(0, 10)) : null
  const body = sentOn
    ? `Just a friendly reminder that the invoice below, sent on ${sentOn}, is still open. Let me know if you didn't receive it or have any questions.`
    : `Just a friendly reminder that the invoice below is still open. Let me know if you didn't receive it or have any questions.`
  return { subject, body }
}

function ReminderModal({ inv, companyName, mail, defaultTo, onClose, onSent, call, client }) {
  const defaults = reminderDefaults(inv, companyName, mail)
  const [to, setTo] = useState(defaultTo)
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState(defaults.subject)
  const [body, setBody] = useState(defaults.body)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [ok, setOk] = useState(null)

  const field = { width: '100%', fontSize: '15px', padding: '10px 11px', border: `1px solid ${BORDER}`, borderRadius: '4px', fontFamily: 'inherit' }
  const label = { display: 'block', fontSize: '12px', color: MUTED, marginBottom: '5px' }

  const submit = async () => {
    setBusy(true); setErr(null); setOk(null)
    try {
      const json = await call('/api/qbo/ar', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send-reminder',
          client,
          invoiceId: inv.id,
          to,
          cc,
          subject,
          body,
        }),
      })
      const note = json.mailLog && json.mailLog.skipped
        ? ` Reminder sent, but the log was not saved (${json.mailLog.reason}).`
        : ''
      setOk(`Reminder sent to ${json.sent.to}.${note}`)
      onSent({ sentAt: new Date().toISOString(), to: json.sent.to })
    } catch (e) {
      setErr(String(e.message || e))
    } finally { setBusy(false) }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="reminder-title"
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '12px' }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: '520px', maxHeight: '92vh', overflow: 'auto', borderRadius: '8px', padding: '18px 16px 20px', boxShadow: '0 16px 48px rgba(0,0,0,.2)' }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8B1E16', marginBottom: '6px' }}>Reminder</div>
        <h2 id="reminder-title" style={{ fontSize: '18px', marginBottom: '4px' }}>Send reminder — invoice #{inv.doc || inv.id}</h2>
        <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.55, marginBottom: '14px' }}>
          Same PDF and pay link as the original send. Nothing goes out until you click Send reminder below.
        </p>

        <label style={label}>To
          <input value={to} onChange={(e) => setTo(e.target.value)} type="email" autoComplete="email" style={field} />
        </label>
        <label style={{ ...label, marginTop: '12px' }}>CC (optional)
          <input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="one or more, comma-separated" style={field} />
        </label>
        <label style={{ ...label, marginTop: '12px' }}>Subject
          <input value={subject} onChange={(e) => setSubject(e.target.value)} style={field} />
        </label>
        <label style={{ ...label, marginTop: '12px' }}>Message
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} />
        </label>

        {err && <div style={{ fontSize: '13px', color: RED, marginTop: '12px', lineHeight: 1.5 }}>{err}</div>}
        {ok && <div style={{ fontSize: '13px', color: GREEN, marginTop: '12px', lineHeight: 1.5 }}>{ok}</div>}

        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '10px', marginTop: '18px' }}>
          <button type="button" onClick={onClose} disabled={busy} style={{ ...btn(false), padding: '12px 14px', fontSize: '14px' }}>Cancel</button>
          <button type="button" onClick={submit} disabled={busy} style={{ ...btn(true), padding: '12px 14px', fontSize: '14px' }}>{busy ? 'Sending…' : 'Send reminder'}</button>
        </div>
      </div>
    </div>
  )
}

const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const td = () => ({ padding: '8px 10px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'middle' })
const btn = (primary) => ({
  fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
  border: primary ? 'none' : `1px solid ${BORDER}`,
  background: primary ? INK : '#fff', color: primary ? '#fff' : INK,
})

import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

// ── Client portal: invoices & statements, sent from YOUR OWN Gmail ───────
// A portal login is mapped server-side to exactly one QuickBooks company;
// the page never chooses a client. Emailing opens the user's Gmail with
// to / subject / body prefilled (body includes a secure link to the
// document) — the mail goes out from their account when they hit send.
// Nothing here emails on its own, and only invoice creation writes to QBO.

const INK = '#1A1A1A', BORDER = '#E5E5E5', MUTED = '#777', RED = '#CC2222', GREEN = '#1E7A3A'
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace'

const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const td = () => ({ padding: '8px 10px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'middle' })
const btn = (primary) => ({
  fontSize: '12px', fontWeight: 600, padding: '7px 12px', borderRadius: '4px', cursor: 'pointer',
  border: primary ? 'none' : `1px solid ${BORDER}`,
  background: primary ? INK : '#fff', color: primary ? '#fff' : INK,
})
const input = (extra = {}) => ({ fontSize: '14px', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: '4px', ...extra })

const DEFAULT_INVOICE_BODY = 'Hi,\n\nYour invoice is ready — you can view it here:\n{link}\n\nAny questions, just reply to this email.\n\nThank you!'
const DEFAULT_STATEMENT_BODY = 'Hi,\n\nHere is your current statement of account:\n{link}\n\nAny questions, just reply to this email.\n\nThank you!'

export default function Portal() {
  const [session, setSession] = useState(undefined) // undefined = checking
  const [data, setData] = useState(null)
  const [refs, setRefs] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [compose, setCompose] = useState(null) // { kind, id, name, to, subject, body }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const call = async (path, opts = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Signed out — sign in again.')
    const res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(opts.headers || {}) },
    })
    if (opts.raw) return res
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch (e) { throw new Error(`The server returned an error page (HTTP ${res.status}).`) }
    if (!res.ok) throw new Error(json.error || 'Request failed')
    return json
  }

  const load = async () => {
    setBusy('load'); setError(null)
    try { setData(await call('/api/portal/ar')) }
    catch (e) { setError(String(e.message || e)) } finally { setBusy('') }
  }
  useEffect(() => { if (session) load() }, [!!session]) // eslint-disable-line react-hooks/exhaustive-deps

  const openBlob = async (path, label) => {
    setBusy(label); setError(null)
    try {
      const res = await call(path, { raw: true })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `Failed (HTTP ${res.status})`) }
      window.open(URL.createObjectURL(await res.blob()), '_blank')
    } catch (e) { setError(String(e.message || e)) } finally { setBusy('') }
  }

  // Compose flow: mint the signed doc link, fill the template, open Gmail.
  const startCompose = (kind, id, name, to, subjectDefault) => {
    let saved = null
    try { saved = window.localStorage.getItem('portal-body-' + kind) } catch (e) {}
    setCompose({
      kind, id, name, to: to || '',
      subject: subjectDefault,
      body: saved || (kind === 'statement' ? DEFAULT_STATEMENT_BODY : DEFAULT_INVOICE_BODY),
      saveDefault: false,
    })
  }
  const openGmail = async () => {
    setBusy('gmail'); setError(null)
    try {
      const { url } = await call('/api/portal/ar', { method: 'POST', body: JSON.stringify({ action: 'link', kind: compose.kind, id: compose.id }) })
      const body = compose.body.includes('{link}') ? compose.body.replaceAll('{link}', url) : compose.body + '\n\n' + url
      if (compose.saveDefault) { try { window.localStorage.setItem('portal-body-' + compose.kind, compose.body) } catch (e) {} }
      const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(compose.to)}&su=${encodeURIComponent(compose.subject)}&body=${encodeURIComponent(body)}`
      window.open(gmail, '_blank')
      setCompose(null)
    } catch (e) { setError(String(e.message || e)) } finally { setBusy('') }
  }

  if (session === undefined) return <Frame><p style={{ color: MUTED }}>Loading…</p></Frame>
  if (!session) return <Frame><Login /></Frame>

  return (
    <Frame onSignOut={() => supabase.auth.signOut()}>
      {error && <div style={{ border: `1px solid ${RED}`, borderRadius: '4px', padding: '12px 14px', fontSize: '13px', color: RED, marginBottom: '16px', lineHeight: 1.5 }}>{error}</div>}

      {!data && !error && <p style={{ color: MUTED }}>Loading your invoices…</p>}

      {data && data.needsConnect && (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '24px', maxWidth: '520px' }}>
          <h2 style={{ fontSize: '17px', marginBottom: '8px' }}>One step first: connect your QuickBooks</h2>
          <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, marginBottom: '14px' }}>
            Click below, sign in with your Intuit login, and pick your company. That&rsquo;s the whole setup —
            this portal reads your QuickBooks directly and nothing installs.
          </p>
          <a href={data.connectUrl} style={{ ...btn(true), textDecoration: 'none', display: 'inline-block' }}>Connect QuickBooks →</a>
          <p style={{ fontSize: '12px', color: MUTED, marginTop: '12px' }}>Done connecting? <button onClick={load} style={btn(false)}>Reload</button></p>
        </div>
      )}

      {data && !data.needsConnect && (
        <>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px' }}>{data.company || 'Your company'}</h2>
            <span style={{ fontSize: '12.5px', color: MUTED }}>{data.invoices.length} open invoice{data.invoices.length === 1 ? '' : 's'} · live from QuickBooks</span>
            <span style={{ flex: 1 }} />
            <button onClick={load} disabled={busy === 'load'} style={btn(false)}>{busy === 'load' ? 'Refreshing…' : 'Refresh'}</button>
            <button onClick={async () => {
              setShowNew(true)
              if (!refs) { try { setRefs(await call('/api/portal/ar?action=refs')) } catch (e) { setError(String(e.message || e)); setShowNew(false) } }
            }} style={btn(true)}>+ New invoice</button>
          </div>

          {showNew && <NewInvoice refs={refs} call={call} onClose={() => setShowNew(false)}
            onCreated={(created) => { setShowNew(false); load(); window.alert(`Created invoice #${created.doc} for ${money(created.total)} in QuickBooks.`) }} />}

          {data.invoices.length === 0 && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '16px', fontSize: '13px', color: MUTED }}>
              No open invoices right now.
            </div>
          )}

          {data.invoices.length > 0 && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', overflowX: 'auto', marginBottom: '26px' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                <thead><tr>
                  {['Invoice', 'Customer', 'Date', 'Due', 'Balance', ''].map((h, k) => (
                    <th key={k} style={{ textAlign: k === 4 ? 'right' : 'left', padding: '8px 10px', borderBottom: `1px solid ${INK}`, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', color: MUTED, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={td()}><b>{inv.doc ? '#' + inv.doc : '(no number)'}</b></td>
                      <td style={td()}>{inv.customer}</td>
                      <td style={td()}>{inv.date || '—'}</td>
                      <td style={td()}>{inv.due || '—'}</td>
                      <td style={{ ...td(), textAlign: 'right', fontWeight: 700 }}>{money(inv.balance)}</td>
                      <td style={{ ...td(), whiteSpace: 'nowrap' }}>
                        <button onClick={() => openBlob(`/api/portal/ar?action=pdf&id=${inv.id}`, 'pdf' + inv.id)} disabled={busy === 'pdf' + inv.id} style={btn(false)}>{busy === 'pdf' + inv.id ? '…' : 'PDF'}</button>{' '}
                        <button onClick={() => startCompose('invoice', inv.id, inv.customer, inv.email, `Invoice ${inv.doc || ''} from ${data.company || 'us'}`.replace('  ', ' '))} style={btn(true)}>Email →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.invoices.length > 0 && <Statements data={data} openBlob={openBlob} busy={busy} startCompose={startCompose} />}
        </>
      )}

      {compose && (
        <div onClick={() => setCompose(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '6px', maxWidth: '560px', width: '100%', padding: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Email {compose.kind === 'statement' ? 'statement' : 'invoice'} — {compose.name}</h3>
            <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6, marginBottom: '14px' }}>
              This opens Gmail with everything filled in — you just hit Send there, so the email comes from
              <b> your</b> address. <code style={{ fontFamily: mono, fontSize: '11px' }}>{'{link}'}</code> becomes a
              secure link to the {compose.kind === 'statement' ? 'live statement' : 'invoice PDF'}.
            </p>
            <label style={{ fontSize: '12px', color: MUTED, display: 'block', marginBottom: '10px' }}>To<br />
              <input value={compose.to} onChange={(e) => setCompose((c) => ({ ...c, to: e.target.value }))} placeholder="customer@email.com" style={input({ width: '100%', fontFamily: mono })} />
            </label>
            <label style={{ fontSize: '12px', color: MUTED, display: 'block', marginBottom: '10px' }}>Subject<br />
              <input value={compose.subject} onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))} style={input({ width: '100%' })} />
            </label>
            <label style={{ fontSize: '12px', color: MUTED, display: 'block', marginBottom: '10px' }}>Message<br />
              <textarea value={compose.body} onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))} rows={7} style={input({ width: '100%', fontFamily: 'inherit', lineHeight: 1.5 })} />
            </label>
            <label style={{ fontSize: '12px', color: MUTED, display: 'flex', gap: '7px', alignItems: 'center', marginBottom: '14px' }}>
              <input type="checkbox" checked={compose.saveDefault} onChange={(e) => setCompose((c) => ({ ...c, saveDefault: e.target.checked }))} />
              Remember this wording as my default
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setCompose(null)} style={btn(false)}>Cancel</button>
              <button onClick={openGmail} disabled={busy === 'gmail' || !compose.to} style={btn(true)}>{busy === 'gmail' ? 'Preparing…' : 'Open in Gmail →'}</button>
            </div>
          </div>
        </div>
      )}
    </Frame>
  )
}

function Statements({ data, openBlob, busy, startCompose }) {
  const byCust = {}
  for (const inv of data.invoices) {
    if (!inv.customerId) continue
    const g = byCust[inv.customerId] || (byCust[inv.customerId] = { id: inv.customerId, name: inv.customer, count: 0, balance: 0, email: null })
    g.count++; g.balance += inv.balance
    if (!g.email && inv.email) g.email = inv.email
  }
  const groups = Object.values(byCust).sort((a, b) => b.balance - a.balance)
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return (
    <div>
      <h2 style={{ fontSize: '17px', marginBottom: '4px' }}>Statements — by customer</h2>
      <p style={{ fontSize: '12.5px', color: MUTED, lineHeight: 1.6, marginBottom: '12px', maxWidth: '620px' }}>
        Built fresh from QuickBooks every time — open invoices, recent payments, and aging. The email
        carries a live link, so your customer always sees current numbers, even if they open it next week.
      </p>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
          <thead><tr>
            {['Customer', 'Open', 'Balance', ''].map((h, k) => (
              <th key={k} style={{ textAlign: k === 1 || k === 2 ? 'right' : 'left', padding: '8px 10px', borderBottom: `1px solid ${INK}`, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', color: MUTED, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id}>
                <td style={td()}><b>{g.name}</b></td>
                <td style={{ ...td(), textAlign: 'right' }}>{g.count}</td>
                <td style={{ ...td(), textAlign: 'right', fontWeight: 700 }}>{money(g.balance)}</td>
                <td style={{ ...td(), whiteSpace: 'nowrap' }}>
                  <button onClick={() => openBlob(`/api/portal/ar?action=statement&id=${g.id}`, 'stmt' + g.id)} disabled={busy === 'stmt' + g.id} style={btn(false)}>{busy === 'stmt' + g.id ? '…' : 'Preview'}</button>{' '}
                  <button onClick={() => startCompose('statement', g.id, g.name, g.email, `Statement of account — ${monthYear} — ${data.company || ''}`.trim())} style={btn(true)}>Email →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Same guarded create as the admin page: preview writes nothing, confirm
// posts once with the preview's requestId.
function NewInvoice({ refs, call, onClose, onCreated }) {
  const today = new Date().toISOString().slice(0, 10)
  const [customerId, setCustomerId] = useState('')
  const [txnDate, setTxnDate] = useState(today)
  const [dueDate, setDueDate] = useState('')
  const [emailTo, setEmailTo] = useState('')
  const [lines, setLines] = useState([{ itemId: '', description: '', qty: '1', rate: '' }])
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState(null)

  const cust = refs && refs.customers.find((c) => String(c.id) === String(customerId))
  const setLine = (i, k, v) => setLines((ls) => ls.map((l, n) => (n === i ? { ...l, [k]: v } : l)))
  const total = lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0), 0)
  const body = () => ({
    action: 'create',
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
    try { setPreview(await call('/api/portal/ar', { method: 'POST', body: JSON.stringify(body()) })) }
    catch (e) { setErr(String(e.message || e)) } finally { setBusy('') }
  }
  const doCreate = async () => {
    if (!window.confirm(`Create invoice #${preview.preview.doc} for ${preview.preview.customer} (${money(preview.preview.total)}) in QuickBooks?`)) return
    setBusy('create'); setErr(null)
    try {
      const json = await call('/api/portal/ar', { method: 'POST', body: JSON.stringify({ ...body(), confirm: true, requestId: preview.requestId }) })
      onCreated(json.created)
    } catch (e) { setErr(String(e.message || e)) } finally { setBusy('') }
  }

  return (
    <div style={{ border: `1px solid ${INK}`, borderRadius: '4px', padding: '16px', marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <b style={{ fontSize: '14px' }}>New invoice</b>
        <button onClick={onClose} style={btn(false)}>Close</button>
      </div>
      {!refs && <div style={{ fontSize: '13px', color: MUTED }}>Loading customers and items…</div>}
      {refs && refs.items.length === 0 && (
        <div style={{ fontSize: '13px', color: RED, lineHeight: 1.6 }}>
          Your QuickBooks has no products/services yet — add one in QuickBooks under
          Sales → Products &amp; services, then reopen this form.
        </div>
      )}
      {refs && refs.items.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', color: MUTED }}>Customer<br />
              <select value={customerId} onChange={(e) => {
                const picked = refs.customers.find((c) => String(c.id) === e.target.value)
                const prevEmail = cust && cust.email
                setCustomerId(e.target.value)
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
              <input value={emailTo} onChange={(e) => { setEmailTo(e.target.value); setPreview(null) }} placeholder="customer email" style={input({ width: '220px' })} />
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
                    const item = refs.items.find((x) => String(x.id) === e.target.value)
                    setLine(i, 'itemId', e.target.value)
                    if (item && item.rate && !l.rate) setLine(i, 'rate', String(item.rate))
                    setPreview(null)
                  }} style={input()}>
                    <option value="">— pick —</option>
                    {refs.items.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <input value={l.description} onChange={(e) => { setLine(i, 'description', e.target.value); setPreview(null) }} placeholder="e.g. August services" style={input()} />
                  <input value={l.qty} onChange={(e) => { setLine(i, 'qty', e.target.value); setPreview(null) }} style={input({ textAlign: 'right' })} />
                  <input value={l.rate} onChange={(e) => { setLine(i, 'rate', e.target.value); setPreview(null) }} style={input({ textAlign: 'right' })} />
                  <div style={{ fontSize: '13px', fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{amount > 0 ? money(amount) : '—'}</div>
                  {lines.length > 1
                    ? <button onClick={() => { setLines((ls) => ls.filter((_, n) => n !== i)); setPreview(null) }} style={btn(false)}>×</button>
                    : <span />}
                </React.Fragment>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setLines((ls) => [...ls, { itemId: '', description: '', qty: '1', rate: '' }])} style={btn(false)}>+ line</button>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Total {money(total)}</span>
            <span style={{ flex: 1 }} />
            {!preview && <button onClick={doPreview} disabled={busy === 'preview' || !customerId} style={btn(true)}>{busy === 'preview' ? 'Checking…' : 'Preview'}</button>}
            {preview && (
              <>
                <span style={{ fontSize: '12.5px', color: GREEN }}>
                  Ready: invoice #{preview.preview.doc} · {preview.preview.customer} · {money(preview.preview.total)}
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

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const signIn = async (e) => {
    e.preventDefault()
    setBusy(true); setErr(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    // Say something useful for every failure shape: a plain wrong password, a
    // server-side auth fault (which arrives with no usable message), and
    // anything else.
    if (error) {
      const msg = String(error.message || '').trim()
      if (/invalid login credentials/i.test(msg)) setErr('Wrong email or password.')
      else if (!msg || msg === '{}' || error.status >= 500) setErr('The sign-in service had a problem on our end, not yours. Tell JK and it will be fixed — no need to keep retrying.')
      else setErr(msg)
    }
    setBusy(false)
  }
  return (
    <form onSubmit={signIn} style={{ maxWidth: '360px', margin: '60px auto 0' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '6px' }}>Sign in</h2>
      <p style={{ fontSize: '12.5px', color: MUTED, lineHeight: 1.6, marginBottom: '16px' }}>
        Use the login you were given. Your books are visible only to you.
      </p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="login email" autoComplete="username" style={input({ width: '100%', marginBottom: '10px', fontFamily: mono })} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" autoComplete="current-password" style={input({ width: '100%', marginBottom: '14px', fontFamily: mono })} />
      {err && <div style={{ fontSize: '12.5px', color: RED, marginBottom: '12px' }}>{err}</div>}
      <button type="submit" disabled={busy || !email || !password} style={{ ...btn(true), width: '100%', padding: '10px' }}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  )
}

function ChangePassword({ onClose }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (pw.length < 8) { setErr('Use at least 8 characters.'); return }
    if (pw !== pw2) { setErr("The two entries don't match."); return }
    setBusy(true); setErr(null)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) { setErr(error.message); return }
    window.alert('Password changed. Use the new one from now on — nobody else knows it.')
    onClose()
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '6px', maxWidth: '380px', width: '100%', padding: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>Change password</h3>
        <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6, marginBottom: '12px' }}>
          Pick your own — once you change it, you&rsquo;re the only person who knows it.
        </p>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="new password (8+ characters)" autoComplete="new-password" style={input({ width: '100%', marginBottom: '8px', fontFamily: mono })} />
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="new password again" autoComplete="new-password" style={input({ width: '100%', marginBottom: '12px', fontFamily: mono })} />
        {err && <div style={{ fontSize: '12.5px', color: RED, marginBottom: '10px' }}>{err}</div>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btn(false)}>Cancel</button>
          <button onClick={save} disabled={busy} style={btn(true)}>{busy ? 'Saving…' : 'Save password'}</button>
        </div>
      </div>
    </div>
  )
}

function Frame({ children, onSignOut }) {
  const [changePw, setChangePw] = useState(false)
  return (
    <>
      <Head><title>Invoices & Statements</title><meta name="robots" content="noindex" /><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div style={{ fontFamily: '-apple-system, Segoe UI, sans-serif', color: INK, maxWidth: '980px', margin: '0 auto', padding: '28px 18px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '22px', borderBottom: `1px solid ${BORDER}`, paddingBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '20px' }}>Invoices &amp; Statements</h1>
            <div style={{ fontSize: '11.5px', color: MUTED, marginTop: '2px' }}>Reads your QuickBooks · emails go out from your own Gmail</div>
          </div>
          {onSignOut && <span style={{ whiteSpace: 'nowrap' }}>
            <button onClick={() => setChangePw(true)} style={{ ...btn(false), marginRight: '8px' }}>Change password</button>
            <button onClick={onSignOut} style={btn(false)}>Sign out</button>
          </span>}
        </div>
        {children}
        {changePw && <ChangePassword onClose={() => setChangePw(false)} />}
      </div>
    </>
  )
}

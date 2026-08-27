import React, { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import CustomerFilter from '../components/CustomerFilter'
import WorkQueue from '../components/WorkQueue'

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

const DEFAULT_INVOICE_BODY = 'Hi,\n\nYour invoice is attached.\n\nAny questions, just reply to this email.\n\nThank you!'
const DEFAULT_INVOICES_BODY = 'Hi,\n\nYour invoices are attached:\n{list}\n\nTotal due: {total}\n\nAny questions, just reply to this email.\n\nThank you!'
const DEFAULT_STATEMENT_BODY = 'Hi,\n\nYour statement of account is attached.\n\nAny questions, just reply to this email.\n\nThank you!'

export default function Portal() {
  const [session, setSession] = useState(undefined) // undefined = checking
  const [data, setData] = useState(null)
  const [refs, setRefs] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [compose, setCompose] = useState(null) // { kind, id, name, to, subject, body }
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('due')
  const [dir, setDir] = useState('asc')
  const [aging, setAging] = useState('all')
  const [excluded, setExcluded] = useState(new Set())
  const [limit, setLimit] = useState(50)
  const [tab, setTab] = useState('chase')
  const [minBal, setMinBal] = useState('')
  const [sel, setSel] = useState(new Set())
  const [views, setViews] = useState([])

  // Saved views live in the browser: they are one person's working habits,
  // not company data, and they must survive nothing more than this laptop.
  useEffect(() => {
    try { setViews(JSON.parse(window.localStorage.getItem('portal-views') || '[]')) } catch (e) {}
  }, [])
  const persistViews = (next) => {
    setViews(next)
    try { window.localStorage.setItem('portal-views', JSON.stringify(next)) } catch (e) {}
  }
  const saveView = () => {
    const name = window.prompt('Name this view (e.g. "90+ over $500")')
    if (!name) return
    const v = { name, q, sort, dir, aging, minBal, excluded: [...excluded] }
    persistViews([...views.filter((x) => x.name !== name), v])
  }
  const applyView = (v) => {
    setQ(v.q || ''); setSort(v.sort || 'due'); setDir(v.dir || 'asc')
    setAging(v.aging || 'all'); setMinBal(v.minBal || '')
    setExcluded(new Set(v.excluded || [])); setLimit(50); setTab('invoices')
  }

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

  const load = async (fresh) => {
    setBusy('load'); setError(null)
    try { setData(await call('/api/portal/ar' + (fresh ? '?fresh=1' : ''))) }
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

  // Compose flow. An invoice goes out as QuickBooks' own PDF, downloaded
  // here for the sender to drag in — a customer-facing email should carry
  // the sender's document, not a link to somebody else's domain. Statements
  // have no PDF, so those still travel as a signed link.
  //
  // Whatever the message needs is fetched WHILE the sender reads it, so the
  // Send click itself is synchronous: the download starts and Gmail opens in
  // the same gesture. Doing the fetch on click instead meant either a popup
  // the browser blocked, or a blank tab sitting there looking broken.
  // Several invoices for one customer, one email. Each PDF is fetched and
  // downloaded; the browser asks once about multiple files.
  const startComposeMany = (invoices) => {
    const first = invoices[0]
    const total = invoices.reduce((t, i) => t + i.balance, 0)
    let saved = null
    try { saved = window.localStorage.getItem('portal-body-invoices') } catch (e) {}
    setCompose({
      kind: 'invoices', id: first.id, ids: invoices.map((i) => i.id),
      docs: invoices.map((i) => i.doc || i.id),
      name: first.customer, customerId: first.customerId, to: first.email || '',
      subject: `Invoices from ${data.company || 'us'}`,
      body: saved || DEFAULT_INVOICES_BODY,
      listText: invoices.map((i) => `  ${i.doc ? '#' + i.doc : 'Invoice'} — ${money(i.balance)}${i.due ? ` (due ${i.due})` : ''}`).join('\n'),
      totalText: money(total),
      saveDefault: false, attach: true, ready: null, readyErr: null,
    })
    Promise.all(invoices.map((inv) =>
      call(`/api/portal/ar?action=pdf&id=${inv.id}`, { raw: true }).then(async (res) => {
        if (!res.ok) throw new Error(`QuickBooks did not return a PDF for ${inv.doc ? '#' + inv.doc : 'one invoice'}.`)
        return { blob: await res.blob(), doc: inv.doc || inv.id }
      })
    ))
      .then((files) => setCompose((c) => (c && c.kind === 'invoices' ? { ...c, ready: files } : c)))
      .catch((e) => setCompose((c) => (c && c.kind === 'invoices' ? { ...c, readyErr: String(e.message || e) } : c)))
  }

  const startCompose = (kind, id, name, to, subjectDefault, doc, customerId) => {
    let saved = null
    try { saved = window.localStorage.getItem('portal-body-' + kind) } catch (e) {}
    const attach = true // both kinds attach a PDF now; the link is opt-in
    setCompose({
      kind, id, name, doc, to: to || '', customerId: customerId != null ? customerId : (kind === 'statement' ? id : null),
      subject: subjectDefault,
      body: saved || (kind === 'statement' ? DEFAULT_STATEMENT_BODY : DEFAULT_INVOICE_BODY),
      saveDefault: false,
      attach,
      ready: null,      // the blob (attach) or the link (statement)
      readyErr: null,
    })
    prepare(kind, id, attach)
  }

  // Fetch the attachment or mint the link in the background. Keyed by id so a
  // late response for a closed or replaced modal is discarded.
  const prepare = (kind, id, attach) => {
    const settle = (patch) => setCompose((c) => (c && String(c.id) === String(id) ? { ...c, ...patch } : c))
    if (attach) {
      const path = kind === 'statement'
        ? `/api/portal/ar?action=statement-pdf&id=${id}`   // drawn by us
        : `/api/portal/ar?action=pdf&id=${id}`             // Intuit's own
      call(path, { raw: true })
        .then(async (res) => {
          if (!res.ok) throw new Error(kind === 'statement'
            ? 'The statement PDF could not be built.'
            : 'QuickBooks did not return a PDF for this invoice.')
          settle({ ready: await res.blob() })
        })
        .catch((e) => settle({ readyErr: String(e.message || e) }))
    } else {
      call('/api/portal/ar', { method: 'POST', body: JSON.stringify({ action: 'link', kind, id }) })
        .then((r) => settle({ ready: r.url }))
        .catch((e) => settle({ readyErr: String(e.message || e) }))
    }
  }

  // Everything below runs inside the click — no awaits, so no popup block
  // and no empty tab.
  const openGmail = () => {
    const c = compose
    if (!c || !c.ready) return
    let body = c.body
    if (c.kind === 'invoices') {
      body = body.replaceAll('{list}', c.listText).replaceAll('{total}', c.totalText).replaceAll('{link}', '').trim()
      for (const f of c.ready) {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(f.blob)
        a.download = `Invoice-${f.doc}.pdf`
        document.body.appendChild(a); a.click(); a.remove()
      }
    } else if (c.attach) {
      body = body.replaceAll('{link}', '').trim()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(c.ready)
      a.download = c.kind === 'statement'
        ? `Statement-${String(c.name || 'customer').replace(/[^A-Za-z0-9]+/g, '-')}.pdf`
        : `Invoice-${c.doc || c.id}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
    } else {
      body = body.includes('{link}') ? body.replaceAll('{link}', c.ready) : body + '\n\n' + c.ready
    }
    if (c.saveDefault) { try { window.localStorage.setItem('portal-body-' + c.kind, c.body) } catch (e) {} }
    setSel(new Set())
    // Fire-and-forget: a failed log must never cost her the email.
    call('/api/portal/ar', { method: 'POST', body: JSON.stringify({
      action: 'log-send', kind: c.kind, customerId: c.customerId, customerName: c.name, doc: c.doc, to: c.to,
    }) }).then(() => load()).catch(() => {})
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.to)}&su=${encodeURIComponent(c.subject)}&body=${encodeURIComponent(body)}`,
      '_blank'
    )
    setCompose(null)
  }

  // A real book can run to thousands of open invoices, so the list is
  // searched and paged rather than dumped.
  const todayISO = new Date().toISOString().slice(0, 10)

  // Aging is how anyone chasing money actually thinks about a book this
  // size: not 7,000 rows, but "what is 90+ days old".
  const AGING = [
    { key: 'all', label: 'All' },
    { key: 'current', label: 'Not yet due' },
    { key: '1-30', label: '1–30 days' },
    { key: '31-60', label: '31–60' },
    { key: '61-90', label: '61–90' },
    { key: '90+', label: '90+ days' },
  ]
  const bucketOf = (inv) => {
    if (!inv.due) return 'current'
    const days = Math.floor((Date.parse(todayISO) - Date.parse(inv.due)) / 86400000)
    if (days <= 0) return 'current'
    if (days <= 30) return '1-30'
    if (days <= 60) return '31-60'
    if (days <= 90) return '61-90'
    return '90+'
  }

  // Every customer in the book, for the tick-list.
  const customers = useMemo(() => {
    const m = new Map()
    for (const i of (data && data.invoices) || []) {
      if (!i.customerId) continue
      const g = m.get(i.customerId) || { id: i.customerId, name: i.customer, count: 0 }
      g.count++
      m.set(i.customerId, g)
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  // Bucket tallies are computed before the aging filter, so the chips keep
  // showing what each one holds while one of them is selected.
  const tallies = useMemo(() => {
    const t = {}
    for (const k of AGING.map((a) => a.key)) t[k] = { n: 0, amt: 0 }
    for (const i of (data && data.invoices) || []) {
      if (excluded.has(i.customerId)) continue
      const b = bucketOf(i)
      t[b].n++; t[b].amt += i.balance
      t.all.n++; t.all.amt += i.balance
    }
    return t
  }, [data, excluded, todayISO]) // eslint-disable-line react-hooks/exhaustive-deps

  const queue = useMemo(() => {
    const m = new Map()
    for (const i of (data && data.invoices) || []) {
      if (!i.customerId) continue
      if (excluded.has(i.customerId)) continue
      if (minBal && i.balance < Number(minBal)) continue
      const g = m.get(i.customerId) || {
        id: i.customerId, name: i.customer, balance: 0, pastDue: 0, oldestDays: 0, email: null, invoices: [],
      }
      g.balance += i.balance
      g.invoices.push(i)
      const days = i.due ? Math.floor((Date.parse(todayISO) - Date.parse(i.due)) / 86400000) : 0
      if (days > 0) { g.pastDue += i.balance; g.oldestDays = Math.max(g.oldestDays, days) }
      if (!g.email && i.email) g.email = i.email
      m.set(i.customerId, g)
    }
    const sends = (data && data.sends) || {}
    return [...m.values()].map((g) => ({
      ...g,
      // Oldest first inside a customer: that is the one being chased.
      invoices: [...g.invoices].sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999'))),
      lastSent: sends[g.id] || null,
    }))
  }, [data, excluded, minBal, todayISO])

  const shown = useMemo(() => {
    const all = (data && data.invoices) || []
    const needle = q.trim().toLowerCase()
    let out = needle
      ? all.filter((i) => String(i.customer || '').toLowerCase().includes(needle)
                       || String(i.doc || '').toLowerCase().includes(needle))
      : all
    if (excluded.size) out = out.filter((i) => !excluded.has(i.customerId))
    if (aging !== 'all') out = out.filter((i) => bucketOf(i) === aging)
    if (minBal) out = out.filter((i) => i.balance >= Number(minBal))
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
  }, [data, q, sort, dir, aging, excluded, minBal, todayISO]) // eslint-disable-line react-hooks/exhaustive-deps
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
            <button onClick={() => load(true)} disabled={busy === 'load'} style={btn(false)}>{busy === 'load' ? 'Refreshing…' : 'Refresh'}</button>
            <button onClick={async () => {
              setShowNew(true)
              if (!refs) { try { setRefs(await call('/api/portal/ar?action=refs')) } catch (e) { setError(String(e.message || e)); setShowNew(false) } }
            }} style={btn(true)}>+ New invoice</button>
          </div>

          <div style={{ display: 'flex', gap: '4px', borderBottom: `1px solid ${BORDER}`, marginBottom: '16px' }}>
            {[['chase', 'To chase'], ['invoices', 'Invoices']].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                fontSize: '13px', fontWeight: tab === k ? 700 : 500, padding: '8px 14px', cursor: 'pointer',
                border: 'none', background: 'none', color: tab === k ? INK : MUTED,
                borderBottom: `2px solid ${tab === k ? INK : 'transparent'}`, marginBottom: '-1px',
              }}>{label}</button>
            ))}
          </div>

          {showNew && <NewInvoice refs={refs} call={call} onClose={() => setShowNew(false)}
            onCreated={(created) => { setShowNew(false); load(); window.alert(`Created invoice #${created.doc} for ${money(created.total)} in QuickBooks.`) }} />}

          {tab === 'chase' && data.invoices.length > 0 && (
            <WorkQueue
              rows={queue}
              busy={busy}
              onSeeAll={() => setTab('invoices')}
              onPreview={(r) => openBlob(`/api/portal/ar?action=statement&id=${r.id}`, 'stmt' + r.id)}
              onStatement={(r) => startCompose('statement', r.id, r.name, r.email,
                `Statement of account — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — ${data.company || ''}`.trim(),
                null, r.id)}
              onInvoicePdf={(inv) => openBlob(`/api/portal/ar?action=pdf&id=${inv.id}`, 'pdf' + inv.id)}
              onInvoiceEmail={(inv) => startCompose('invoice', inv.id, inv.customer, inv.email,
                `Invoice ${inv.doc || ''} from ${data.company || 'us'}`.replace('  ', ' '), inv.doc, inv.customerId)}
              onPrintAll={(ids) => openBlob(
                '/api/portal/ar?action=statements-all' + (ids.length && ids.length < queue.length ? `&ids=${ids.join(',')}` : ''),
                'stmtall')}
              toolbar={<>
                <CustomerFilter customers={customers} excluded={excluded} onChange={setExcluded} />
                <label style={{ fontSize: '12.5px', color: MUTED, display: 'flex', gap: '5px', alignItems: 'center' }}>
                  over $
                  <input value={minBal} onChange={(e) => setMinBal(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0" style={input({ width: '70px', padding: '7px 8px' })} />
                </label>
                {(excluded.size > 0 || minBal) && (
                  <button onClick={() => { setExcluded(new Set()); setMinBal('') }} style={btn(false)}>Clear</button>
                )}
              </>}
            />
          )}

          {data.invoices.length === 0 && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '16px', fontSize: '13px', color: MUTED }}>
              No open invoices right now.
            </div>
          )}

          {tab === 'invoices' && data.invoices.length > 0 && (
            <>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
              <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(50) }}
                placeholder="Search customer or invoice #"
                style={input({ width: '260px' })} />
              <CustomerFilter customers={customers} excluded={excluded}
                onChange={(next) => { setExcluded(next); setLimit(50) }} />
              <label style={{ fontSize: '12.5px', color: MUTED, display: 'flex', gap: '5px', alignItems: 'center' }}>
                over $
                <input value={minBal} onChange={(e) => { setMinBal(e.target.value.replace(/[^0-9.]/g, '')); setLimit(50) }}
                  placeholder="0" style={input({ width: '70px', padding: '7px 8px' })} />
              </label>
              {(q || aging !== 'all' || excluded.size > 0 || minBal) && (
                <button onClick={() => { setQ(''); setAging('all'); setExcluded(new Set()); setMinBal(''); setLimit(50) }} style={btn(false)}>Clear</button>
              )}
              <button onClick={saveView} style={btn(false)}>Save view</button>
              {views.length > 0 && (
                <select value="" onChange={(e) => { const v = views.find((x) => x.name === e.target.value); if (v) applyView(v) }}
                  style={input({ padding: '7px 8px' })}>
                  <option value="">Saved views…</option>
                  {views.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              )}
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: '12.5px', color: MUTED }}>
                {shown.length.toLocaleString()} of {data.invoices.length.toLocaleString()} · {money(shownTotal)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {AGING.map((a) => {
                const on = aging === a.key
                const t = tallies[a.key] || { n: 0, amt: 0 }
                return (
                  <button key={a.key} onClick={() => { setAging(a.key); setLimit(50) }}
                    style={{
                      fontSize: '12px', padding: '6px 11px', borderRadius: '14px', cursor: 'pointer',
                      border: `1px solid ${on ? INK : BORDER}`, background: on ? INK : '#fff',
                      color: on ? '#fff' : (t.n ? INK : MUTED), fontWeight: on ? 700 : 500,
                    }}>
                    {a.label} <span style={{ opacity: .75 }}>{t.n.toLocaleString()} · {money(t.amt)}</span>
                  </button>
                )
              })}
            </div>
            {sel.size > 0 && (() => {
              const picked = shown.filter((i) => sel.has(i.id))
              const names = new Set(picked.map((i) => i.customerId))
              const total = picked.reduce((t, i) => t + i.balance, 0)
              const oneCustomer = names.size === 1
              return (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
                              border: `1px solid ${INK}`, borderRadius: '4px', padding: '10px 12px', marginBottom: '10px' }}>
                  <b style={{ fontSize: '13px' }}>{picked.length} selected · {money(total)}</b>
                  <span style={{ fontSize: '12.5px', color: MUTED }}>
                    {oneCustomer ? picked[0].customer : `${names.size} different customers`}
                  </span>
                  <span style={{ flex: 1 }} />
                  {!oneCustomer && (
                    <span style={{ fontSize: '12px', color: MUTED }}>
                      Pick invoices from one customer to email them together.
                    </span>
                  )}
                  <button onClick={() => setSel(new Set())} style={btn(false)}>Clear</button>
                  <button onClick={() => startComposeMany(picked)} disabled={!oneCustomer} style={btn(oneCustomer)}>
                    Email {picked.length} together →
                  </button>
                </div>
              )
            })()}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', overflowX: 'auto', marginBottom: '26px' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                <thead><tr>
                  <th style={{ borderBottom: `1px solid ${INK}`, padding: '8px 6px 8px 10px', width: '28px' }}>
                    <input type="checkbox"
                      checked={shown.length > 0 && shown.slice(0, limit).every((i) => sel.has(i.id))}
                      onChange={(e) => {
                        const next = new Set(sel)
                        for (const i of shown.slice(0, limit)) e.target.checked ? next.add(i.id) : next.delete(i.id)
                        setSel(next)
                      }} />
                  </th>
                  <SortH field="doc" label="Invoice" />
                  <SortH field="customer" label="Customer" />
                  <SortH field="date" label="Date" />
                  <SortH field="due" label="Due" />
                  <SortH field="balance" label="Balance" right />
                  <th style={{ borderBottom: `1px solid ${INK}` }}></th>
                </tr></thead>
                <tbody>
                  {shown.slice(0, limit).map((inv) => (
                    <tr key={inv.id} style={sel.has(inv.id) ? { background: '#F5F7FA' } : undefined}>
                      <td style={{ ...td(), padding: '8px 6px 8px 10px' }}>
                        <input type="checkbox" checked={sel.has(inv.id)} onChange={() => {
                          const next = new Set(sel)
                          next.has(inv.id) ? next.delete(inv.id) : next.add(inv.id)
                          setSel(next)
                        }} />
                      </td>
                      <td style={td()}><b>{inv.doc ? '#' + inv.doc : '(no number)'}</b></td>
                      <td style={td()}>{inv.customer}</td>
                      <td style={td()}>{inv.date || '—'}</td>
                      <td style={td()}>{inv.due || '—'}</td>
                      <td style={{ ...td(), textAlign: 'right', fontWeight: 700 }}>{money(inv.balance)}</td>
                      <td style={{ ...td(), whiteSpace: 'nowrap' }}>
                        <button onClick={() => openBlob(`/api/portal/ar?action=pdf&id=${inv.id}`, 'pdf' + inv.id)} disabled={busy === 'pdf' + inv.id} style={btn(false)}>{busy === 'pdf' + inv.id ? '…' : 'PDF'}</button>{' '}
                        <button onClick={() => startCompose('invoice', inv.id, inv.customer, inv.email, `Invoice ${inv.doc || ''} from ${data.company || 'us'}`.replace('  ', ' '), inv.doc, inv.customerId)} style={btn(true)}>Email →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shown.length > limit && (
                <div style={{ padding: '10px 12px', borderTop: `1px solid ${BORDER}` }}>
                  <button onClick={() => setLimit((n) => n + 100)} style={btn(false)}>
                    Show 100 more ({(shown.length - limit).toLocaleString()} left)
                  </button>
                </div>
              )}
              {shown.length === 0 && (
                <div style={{ padding: '16px', fontSize: '13px', color: MUTED }}>Nothing matches that search.</div>
              )}
            </div>
            </>
          )}
        </>
      )}

      {compose && (
        <div onClick={() => setCompose(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '6px', maxWidth: '560px', width: '100%', padding: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Email {compose.kind === 'statement' ? 'statement' : 'invoice'} — {compose.name}</h3>
            <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6, marginBottom: '14px' }}>
              This opens Gmail with everything filled in — you hit Send there, so the email comes from
              <b> your</b> address.{' '}
              {compose.kind === 'invoices'
                ? <>All {compose.docs.length} QuickBooks PDFs download at the same time — <b>drag them into the Gmail window</b> before sending. Your browser may ask once whether to allow multiple files.</>
                : compose.attach
                ? <>The {compose.kind === 'statement' ? 'statement' : 'QuickBooks invoice'} PDF downloads at the same time — <b>drag it into the Gmail window</b> before sending. Nothing in the email points anywhere but you.</>
                : <><code style={{ fontFamily: mono, fontSize: '11px' }}>{'{link}'}</code> becomes a secure link to the live statement, which always shows current numbers.</>}
            </p>
            {(compose.kind === 'invoice' || compose.kind === 'statement') && (
              <label style={{ fontSize: '12px', color: MUTED, display: 'flex', gap: '7px', alignItems: 'center', marginBottom: '10px' }}>
                <input type="checkbox" checked={!compose.attach}
                  onChange={(e) => {
                    const attach = !e.target.checked
                    setCompose((c) => ({ ...c, attach, ready: null, readyErr: null }))
                    prepare(compose.kind, compose.id, attach)
                  }} />
                Send a link instead of attaching the PDF
              </label>
            )}
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
            {compose.readyErr && (
              <div style={{ fontSize: '12.5px', color: RED, lineHeight: 1.6, marginBottom: '10px' }}>
                {compose.readyErr}{compose.attach ? ' — tick the box above to send a link instead.' : ''}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setCompose(null)} style={btn(false)}>Cancel</button>
              <button onClick={openGmail} disabled={!compose.to || !compose.ready} style={btn(true)}>
                {compose.readyErr ? 'Unavailable'
                  : !compose.ready ? (compose.attach ? 'Getting the PDF…' : 'Preparing…')
                  : 'Open in Gmail →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Frame>
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
      {refs && (
        <>
          {(refs.warnings || []).map((w, k) => (
            <div key={k} style={{ fontSize: '12.5px', color: RED, lineHeight: 1.6, marginBottom: '10px' }}>{w}</div>
          ))}
          {/* Warnings sit above the form; they never replace it, so a company
              missing one list can still use the rest. */}
          {refs.items.length === 0 && (
            <div style={{ fontSize: '12.5px', color: RED, lineHeight: 1.6, marginBottom: '10px' }}>
              No products/services came back from QuickBooks, and an invoice line needs one.
              Add one under Sales → Products &amp; services in QuickBooks, then close and reopen this form.
            </div>
          )}
          {refs.customers.length === 0 && (
            <div style={{ fontSize: '12.5px', color: RED, lineHeight: 1.6, marginBottom: '10px' }}>
              No active customers came back from QuickBooks. Add a customer there, then close and reopen this form.
            </div>
          )}
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
          <div style={{ fontSize: '11px', color: MUTED, marginTop: '8px' }}>
            Loaded from QuickBooks: {refs.customers.length} customer{refs.customers.length === 1 ? '' : 's'} · {refs.items.length} product{refs.items.length === 1 ? '' : 's'}/service{refs.items.length === 1 ? '' : 's'}
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

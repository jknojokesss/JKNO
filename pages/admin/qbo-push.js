import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

// Push a journal entry into a client's QuickBooks.
// Preview always runs first and touches nothing. Posting is a second,
// separate click on a saved draft.

const INK = '#1A1A1A', BORDER = '#E5E5E5', MUTED = '#777', RED = '#CC2222', GREEN = '#1E7A3A', AMBER = '#C98A2A'
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace'

const BLANK = [
  { account: '', debit: '', credit: '', description: '' },
  { account: '', debit: '', credit: '', description: '' },
]

export default function QboPush() {
  const router = useRouter()
  const [client, setClient] = useState('reydel')
  const [txnDate, setTxnDate] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [memo, setMemo] = useState('')
  const [lines, setLines] = useState(BLANK)

  const [preview, setPreview] = useState(null)
  const [draftId, setDraftId] = useState(null)
  const [posted, setPosted] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/admin'); return }
      const { data: adminData } = await supabase.from('admins').select('email').eq('email', session.user.email).single()
      if (!adminData) router.push('/admin')
    })
    const d = new Date()
    setTxnDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }, [])

  const call = async (payload) => {
    const res = await fetch('/api/qbo/push-je', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.errors ? json.errors.join(' · ') : json.error || 'Request failed')
    return json
  }

  const cleanLines = () => lines
    .filter((l) => l.account.trim())
    .map((l) => ({
      account: l.account.trim(),
      debit: parseFloat(l.debit) || 0,
      credit: parseFloat(l.credit) || 0,
      description: l.description.trim() || undefined,
      customer: (l.customer || '').trim() || undefined,
    }))

  const doPreview = async () => {
    setBusy('preview'); setError(null); setPreview(null); setDraftId(null); setPosted(null)
    try {
      setPreview(await call({ action: 'preview', client, txnDate, docNumber, memo, lines: cleanLines() }))
    } catch (e) { setError(String(e.message)) } finally { setBusy('') }
  }

  const doSave = async () => {
    setBusy('save'); setError(null)
    try {
      const r = await call({ action: 'save', client, txnDate, docNumber, memo, lines: cleanLines() })
      setDraftId(r.id)
    } catch (e) { setError(String(e.message)) } finally { setBusy('') }
  }

  const doPost = async () => {
    const where = preview && preview.company === 'PRODUCTION' ? 'the REAL books' : 'the sandbox'
    if (!confirm(`Post this journal entry to ${where} for ${client}?\n\nThis writes to QuickBooks.`)) return
    setBusy('post'); setError(null)
    try {
      setPosted(await call({ action: 'post', id: draftId, confirm: true }))
      loadHistory()
    } catch (e) { setError(String(e.message)) } finally { setBusy('') }
  }

  const doUndo = async (id) => {
    if (!confirm('Delete this journal entry out of QuickBooks?')) return
    setBusy('undo'); setError(null)
    try { await call({ action: 'undo', id, confirm: true }); loadHistory(); setPosted(null) }
    catch (e) { setError(String(e.message)) } finally { setBusy('') }
  }

  const loadHistory = async () => {
    try { const r = await call({ action: 'list', client }); setHistory(r.entries || []) } catch (e) { /* ignore */ }
  }
  useEffect(() => { loadHistory() }, [client])

  const setLine = (i, k, v) => setLines((p) => p.map((l, x) => (x === i ? { ...l, [k]: v } : l)))
  const totals = cleanLines().reduce((a, l) => ({ d: a.d + l.debit, c: a.c + l.credit }), { d: 0, c: 0 })
  const balanced = Math.round((totals.d - totals.c) * 100) === 0 && totals.d > 0

  const inp = { width: '100%', padding: '9px 10px', border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14, outline: 'none' }
  const btn = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 7, padding: '12px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' })

  return (
    <>
      <Head><title>Push a journal entry to QuickBooks</title></Head>
      <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: 940, margin: '0 auto', padding: '28px 20px 80px', color: INK }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Push a journal entry to QuickBooks</h1>
        <p style={{ color: MUTED, fontSize: 14, marginBottom: 22 }}>
          Preview first — it resolves your account names against the client's real chart of accounts and
          checks the entry balances, without touching anything. Posting is a second click.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <label><div style={lbl}>Client slug</div><input style={inp} value={client} onChange={(e) => setClient(e.target.value)} /></label>
          <label><div style={lbl}>Date</div><input type="date" style={inp} value={txnDate} onChange={(e) => setTxnDate(e.target.value)} /></label>
          <label><div style={lbl}>Doc number</div><input style={inp} placeholder="JK-2026-06-COGS" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} /></label>
        </div>
        <label style={{ display: 'block', marginBottom: 18 }}>
          <div style={lbl}>Memo</div>
          <input style={inp} placeholder="Inventory relief from stock movement" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>

        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 40px', gap: 8, padding: '9px 12px', background: '#FAFAFA', borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: MUTED }}>
            <span>Account</span><span>Debit</span><span>Credit</span><span>Description</span><span />
          </div>
          {lines.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 40px', gap: 8, padding: '8px 12px', borderBottom: `1px solid #F2F2F2`, alignItems: 'center' }}>
              <input style={inp} placeholder="Cost of Goods Sold" value={l.account} onChange={(e) => setLine(i, 'account', e.target.value)} />
              <input style={inp} inputMode="decimal" value={l.debit} onChange={(e) => setLine(i, 'debit', e.target.value)} />
              <input style={inp} inputMode="decimal" value={l.credit} onChange={(e) => setLine(i, 'credit', e.target.value)} />
              <input style={inp} value={l.description} onChange={(e) => setLine(i, 'description', e.target.value)} />
              <button onClick={() => setLines((p) => p.filter((_, x) => x !== i))} style={{ border: 'none', background: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px' }}>
            <button onClick={() => setLines((p) => [...p, { account: '', debit: '', credit: '', description: '' }])}
              style={{ border: `1px solid ${BORDER}`, background: '#fff', borderRadius: 6, padding: '7px 12px', fontSize: 13, cursor: 'pointer' }}>+ Line</button>
            <div style={{ fontFamily: mono, fontSize: 13, color: balanced ? GREEN : RED, fontWeight: 600 }}>
              Dr {totals.d.toFixed(2)} · Cr {totals.c.toFixed(2)} {balanced ? '✓ balanced' : `· off by ${(totals.d - totals.c).toFixed(2)}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={doPreview} disabled={!!busy} style={btn(INK)}>{busy === 'preview' ? 'Checking…' : 'Preview'}</button>
          {preview && preview.ok && !draftId && <button onClick={doSave} disabled={!!busy} style={btn('#444')}>{busy === 'save' ? 'Saving…' : 'Save as draft'}</button>}
          {draftId && !posted && <button onClick={doPost} disabled={!!busy} style={btn(RED)}>{busy === 'post' ? 'Posting…' : 'Post it to QuickBooks'}</button>}
        </div>

        {error && <Box color={RED} title="Error">{error}</Box>}

        {preview && (
          <Box color={preview.ok ? GREEN : AMBER} title={preview.ok ? 'Looks good' : 'Not ready'}>
            <div style={{ marginBottom: 8 }}>
              Company <b>{preview.company}</b> · realm {preview.realmId} · matched against {preview.accountCount} accounts
              {preview.company === 'PRODUCTION' && <b style={{ color: RED }}> — these are the client's real books.</b>}
            </div>
            {preview.duplicate && <div style={{ color: RED, fontWeight: 600, marginBottom: 8 }}>Doc number already posted as QBO id {preview.duplicate.qbo_id}.</div>}
            {preview.errors && preview.errors.length > 0 && (
              <ul style={{ margin: '0 0 10px 18px', color: RED }}>{preview.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 10 }}>
              <tbody>
                {preview.resolved.map((r) => (
                  <tr key={r.line} style={{ borderBottom: '1px solid #EEE' }}>
                    <td style={{ padding: '5px 0', color: MUTED }}>{r.wrote}</td>
                    <td style={{ padding: '5px 0' }}>{r.matched ? <>→ <b>{r.matched}</b> <span style={{ color: MUTED, fontFamily: mono }}>#{r.id}</span></> : <span style={{ color: RED }}>no match</span>}</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontFamily: mono }}>{r.debit ? `Dr ${r.debit.toFixed(2)}` : `Cr ${r.credit.toFixed(2)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <details>
              <summary style={{ cursor: 'pointer', color: MUTED, fontSize: 13 }}>Exact payload</summary>
              <pre style={{ background: '#0F1720', color: '#CFE9C4', padding: 14, borderRadius: 6, fontSize: 11.5, overflowX: 'auto', marginTop: 8 }}>
                {JSON.stringify(preview.payload, null, 2)}
              </pre>
            </details>
          </Box>
        )}

        {draftId && !posted && <Box color={AMBER} title="Saved as a draft">Nothing is in QuickBooks yet. The red button posts it.</Box>}
        {posted && <Box color={GREEN} title="Posted">In {posted.company} as JournalEntry id <b>{posted.qboId}</b>{posted.docNumber ? ` (${posted.docNumber})` : ''}.</Box>}

        {history.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, margin: '28px 0 10px' }}>Recent for {client}</h2>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
              {history.map((h) => (
                <div key={h.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderBottom: `1px solid #F2F2F2`, fontSize: 13 }}>
                  <span style={{ fontFamily: mono, color: MUTED }}>{h.txn_date}</span>
                  <span style={{ flex: 1 }}>{h.doc_number || h.memo || '—'}</span>
                  <span style={{ fontWeight: 600, color: h.status === 'posted' ? GREEN : h.status === 'error' ? RED : MUTED }}>{h.status}</span>
                  {h.qbo_id && <span style={{ fontFamily: mono, color: MUTED }}>#{h.qbo_id}</span>}
                  {h.status === 'posted' && <button onClick={() => doUndo(h.id)} style={{ border: `1px solid ${BORDER}`, background: '#fff', borderRadius: 5, padding: '4px 9px', fontSize: 12, cursor: 'pointer' }}>Undo</button>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

const lbl = { fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#777', marginBottom: 5 }

const Box = ({ color, title, children }) => (
  <div style={{ border: `1px solid ${color}33`, background: `${color}0D`, borderLeft: `3px solid ${color}`, borderRadius: 7, padding: 14, marginBottom: 14, fontSize: 14 }}>
    <div style={{ fontWeight: 700, color, marginBottom: 6 }}>{title}</div>
    {children}
  </div>
)

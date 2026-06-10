import { useState, useEffect } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

const THEME = { accent: '#CC2222' }

// Parse a QuickBooks Online "General Ledger" export (xlsx) into flat rows.
// QBO groups by account, but every transaction row repeats its account in the
// "Distribution account" column, so we map columns by header name and read any
// row that has a real date.
function parseGL(aoa) {
  let hdr = -1
  const col = {}
  for (let i = 0; i < Math.min(20, aoa.length); i++) {
    const cells = aoa[i].map((c) => String(c).toLowerCase().trim())
    if (cells.includes('transaction date') && cells.includes('amount')) {
      hdr = i
      cells.forEach((c, idx) => {
        if (c === 'distribution account') col.account = idx
        if (c === 'transaction date') col.date = idx
        if (c === 'transaction type') col.type = idx
        if (c === 'name') col.name = idx
        if (c === 'description') col.desc = idx
        if (c === 'split') col.split = idx
        if (c === 'amount') col.amount = idx
      })
      break
    }
  }
  // sensible fallback to the observed layout
  if (hdr === -1) { hdr = 4; Object.assign(col, { account: 1, date: 2, type: 3, name: 5, desc: 6, split: 7, amount: 8 }) }

  const rows = []
  let section = ''
  for (let i = hdr + 1; i < aoa.length; i++) {
    const r = aoa[i]
    const dRaw = String(r[col.date] ?? '').trim()
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dRaw)
    if (!m) {
      // account section header row (account name in the first column, no date)
      const first = String(r[0] ?? '').trim()
      if (first && !dRaw) section = first
      continue
    }
    let amtRaw = String(r[col.amount] ?? '').trim()
    const neg = /^\(.*\)$/.test(amtRaw)
    let amt = parseFloat(amtRaw.replace(/[(),$\s]/g, '').replace(/[^0-9.\-]/g, ''))
    if (!isFinite(amt)) amt = 0
    if (neg) amt = -Math.abs(amt)
    rows.push({
      date: `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`,
      account: String(r[col.account] ?? '').trim() || section,
      type: String(r[col.type] ?? '').trim(),
      description: String(r[col.desc] ?? '').trim() || String(r[col.name] ?? '').trim(),
      split_account: String(r[col.split] ?? '').trim(),
      amount: amt,
    })
  }
  return rows
}

// Parse a QuickBooks "Account List" / Chart of Accounts export into
// {account, qb_type}. Finds the Type column by header; account name defaults to
// the first column. Strips parent path (Parent:Sub → Sub) to match GL names.
function parseCOA(aoa) {
  let hdr = -1, nameCol = -1, typeCol = -1
  for (let i = 0; i < Math.min(20, aoa.length); i++) {
    const cells = aoa[i].map((c) => String(c).toLowerCase().trim())
    const ti = cells.findIndex((c) => c === 'account type' || c === 'type')
    if (ti >= 0) {
      const ni = cells.findIndex((c) => ['account name', 'account', 'name', 'full name', 'distribution account'].includes(c))
      hdr = i; typeCol = ti; nameCol = ni >= 0 ? ni : 0
      break
    }
  }
  if (hdr === -1) return []
  const out = []
  for (let i = hdr + 1; i < aoa.length; i++) {
    const name = String(aoa[i][nameCol] ?? '').trim()
    const qb_type = String(aoa[i][typeCol] ?? '').trim()
    if (!name || !qb_type) continue
    out.push({ account: name.split(':').pop().trim(), qb_type })
  }
  return out
}

export default function GLImport() {
  const router = useRouter()
  const [ready, setReady]   = useState(false)   // SheetJS loaded
  const [rows, setRows]     = useState(null)
  const [meta, setMeta]     = useState(null)
  const [fileName, setFile] = useState('')
  const [busy, setBusy]     = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError]   = useState(null)
  // Chart of Accounts import
  const [coaRows, setCoaRows]     = useState(null)
  const [coaMeta, setCoaMeta]     = useState(null)
  const [coaFile, setCoaFile]     = useState('')
  const [coaBusy, setCoaBusy]     = useState(false)
  const [coaResult, setCoaResult] = useState(null)
  const [coaError, setCoaError]   = useState(null)
  // Import history + undo
  const [history, setHistory]         = useState([])
  const [restoreBusy, setRestoreBusy] = useState(false)
  const [restoreMsg, setRestoreMsg]   = useState(null)

  const loadHistory = () =>
    supabase.from('import_log').select('*').order('imported_at', { ascending: false }).limit(8)
      .then(({ data }) => setHistory(data || []))

  // Admins only.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/admin'); return }
      const { data: adminData } = await supabase.from('admins').select('email').eq('email', session.user.email).single()
      if (!adminData) { router.push('/admin'); return }
      loadHistory()
    })
  }, [])

  const onFile = async (e) => {
    setError(null); setResult(null); setRows(null); setMeta(null)
    const file = e.target.files?.[0]
    if (!file) return
    setFile(file.name)
    try {
      const buf = await file.arrayBuffer()
      const wb = window.XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const aoa = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })
      const parsed = parseGL(aoa)
      if (!parsed.length) { setError('No transaction rows found — is this the QuickBooks General Ledger export?'); return }
      const dates = parsed.map((r) => r.date).sort()
      const accts = new Set(parsed.map((r) => r.account))
      setRows(parsed)
      setMeta({ count: parsed.length, from: dates[0], to: dates[dates.length - 1], accounts: accts.size })
    } catch (err) {
      setError('Could not read the file: ' + (err.message || err))
    }
  }

  const doImport = async () => {
    if (!rows) return
    setBusy(true); setError(null); setResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/gl-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ rows }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Import failed')
      setResult(j)
      loadHistory()
    } catch (e) {
      setError(String(e.message || e))
    }
    setBusy(false)
  }

  const onCOAFile = async (e) => {
    setCoaError(null); setCoaResult(null); setCoaRows(null); setCoaMeta(null)
    const file = e.target.files?.[0]
    if (!file) return
    setCoaFile(file.name)
    try {
      const buf = await file.arrayBuffer()
      const wb = window.XLSX.read(buf, { type: 'array' })
      const aoa = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' })
      const parsed = parseCOA(aoa)
      if (!parsed.length) { setCoaError('No accounts found — is this the Chart of Accounts / Account List export? It needs a "Type" column.'); return }
      setCoaMeta({ count: parsed.length, types: new Set(parsed.map((r) => r.qb_type)).size })
      setCoaRows(parsed)
    } catch (err) {
      setCoaError('Could not read the file: ' + (err.message || err))
    }
  }

  const doCOAImport = async () => {
    if (!coaRows) return
    setCoaBusy(true); setCoaError(null); setCoaResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/coa-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ accounts: coaRows }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Import failed')
      setCoaResult(j)
      loadHistory()
    } catch (e) {
      setCoaError(String(e.message || e))
    }
    setCoaBusy(false)
  }

  const doRestore = async () => {
    if (!window.confirm('Restore the previous ledger? This replaces the current ledger with the snapshot taken before the last GL import.')) return
    setRestoreBusy(true); setRestoreMsg(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/gl-restore', { method: 'POST', headers: { authorization: `Bearer ${session?.access_token}` } })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Restore failed')
      setRestoreMsg(`✓ Restored ${j.restored.toLocaleString()} rows · ${j.period} · ${j.balanceSheet?.balanced ? 'balanced' : 'OUT OF BALANCE'}`)
      loadHistory()
    } catch (e) {
      setRestoreMsg('✕ ' + String(e.message || e))
    }
    setRestoreBusy(false)
  }

  const label = { fontSize: '10px', color: '#888', letterSpacing: '0.1em' }

  return (
    <>
      <Head><title>GL Import — Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      </Head>
      <Script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js" onLoad={() => setReady(true)} />

      <div style={{ minHeight: '100vh', background: '#F8F8F8', fontFamily: 'DM Mono, monospace', padding: '40px' }}>
        <div style={{ maxWidth: '660px', margin: '0 auto' }}>
          <button onClick={() => router.push('/financials')} style={{ background: 'none', border: 'none', color: '#888', fontSize: '11px', cursor: 'pointer', marginBottom: '20px', fontFamily: 'DM Mono, monospace' }}>← Financials</button>

          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', padding: '28px' }}>
            <div style={{ fontSize: '10px', color: THEME.accent, letterSpacing: '0.2em', marginBottom: '6px' }}>ADMIN</div>
            <h1 style={{ fontSize: '20px', color: '#1a1a1a', marginBottom: '8px' }}>QuickBooks GL Import</h1>
            <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.6, marginBottom: '20px' }}>
              In QuickBooks Online: <b>Reports → General Ledger</b>, set the date range (Jan 1 → today, accrual),
              then <b>Export → Export to Excel</b>. Drop that .xlsx here. It replaces the whole ledger and
              rebuilds the P&L, monthly table, and account balances from it — so everything ties out.
            </p>

            <label style={{ display: 'block', border: '1px dashed #CCC', borderRadius: '6px', padding: '24px', textAlign: 'center', cursor: ready ? 'pointer' : 'default', background: '#FAFAFA' }}>
              <input type="file" accept=".xlsx,.xls,.csv" disabled={!ready} onChange={onFile} style={{ display: 'none' }} />
              <div style={{ fontSize: '12px', color: ready ? '#1a1a1a' : '#bbb' }}>
                {ready ? (fileName || 'Click to choose the General Ledger .xlsx') : 'Loading spreadsheet reader…'}
              </div>
            </label>

            {meta && (
              <div style={{ marginTop: '18px', padding: '14px', background: '#F8F8F8', border: '1px solid #E5E5E5', borderRadius: '6px', fontSize: '12px', color: '#333', lineHeight: 1.9 }}>
                <div style={label}>PARSED PREVIEW</div>
                Transactions: <b>{meta.count.toLocaleString()}</b><br />
                Date range: <b>{meta.from} → {meta.to}</b><br />
                Accounts: <b>{meta.accounts}</b>
              </div>
            )}

            {rows && (
              <button onClick={doImport} disabled={busy}
                style={{ width: '100%', marginTop: '18px', padding: '12px', background: busy ? '#999' : THEME.accent, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', letterSpacing: '0.1em', cursor: busy ? 'default' : 'pointer', fontFamily: 'DM Mono, monospace' }}>
                {busy ? 'IMPORTING…' : `REPLACE LEDGER WITH ${meta.count.toLocaleString()} ROWS`}
              </button>
            )}

            {result && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '12px', color: '#166534', lineHeight: 1.9 }}>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>✓ Imported</div>
                GL rows: {result.glRows.toLocaleString()}<br />
                Period: {result.period}<br />
                Months rebuilt: {result.months} &nbsp;·&nbsp; P&L accounts: {result.plAccounts}
                {result.newAccounts?.length > 0 && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', color: '#92400e' }}>
                    <b>New accounts not yet categorized</b> (excluded from P&L until classified):<br />
                    {result.newAccounts.map((a) => `${a.account} (${a.net})`).join(', ')}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '12px', color: '#991b1b', lineHeight: 1.6, wordBreak: 'break-word' }}>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>✕ Error</div>
                {error}
              </div>
            )}
          </div>

          {/* Chart of Accounts card — sets account classification */}
          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', padding: '28px', marginTop: '20px' }}>
            <div style={{ fontSize: '10px', color: THEME.accent, letterSpacing: '0.2em', marginBottom: '6px' }}>ADMIN</div>
            <h1 style={{ fontSize: '20px', color: '#1a1a1a', marginBottom: '8px' }}>Chart of Accounts</h1>
            <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.6, marginBottom: '20px' }}>
              Sets how each account is classified (asset / liability / equity / income / expense). In QuickBooks Online:
              <b> Accounting → Chart of Accounts → Run Report</b> (Account List) → <b>Export → Excel</b>. Upload it whenever
              you change an account&apos;s type in QB — the P&amp;L and Balance Sheet follow on the next GL import.
            </p>

            <label style={{ display: 'block', border: '1px dashed #CCC', borderRadius: '6px', padding: '24px', textAlign: 'center', cursor: ready ? 'pointer' : 'default', background: '#FAFAFA' }}>
              <input type="file" accept=".xlsx,.xls,.csv" disabled={!ready} onChange={onCOAFile} style={{ display: 'none' }} />
              <div style={{ fontSize: '12px', color: ready ? '#1a1a1a' : '#bbb' }}>
                {ready ? (coaFile || 'Click to choose the Chart of Accounts .xlsx') : 'Loading spreadsheet reader…'}
              </div>
            </label>

            {coaMeta && (
              <div style={{ marginTop: '18px', padding: '14px', background: '#F8F8F8', border: '1px solid #E5E5E5', borderRadius: '6px', fontSize: '12px', color: '#333', lineHeight: 1.9 }}>
                <div style={label}>PARSED PREVIEW</div>
                Accounts: <b>{coaMeta.count}</b> &nbsp;·&nbsp; Distinct types: <b>{coaMeta.types}</b>
              </div>
            )}

            {coaRows && (
              <button onClick={doCOAImport} disabled={coaBusy}
                style={{ width: '100%', marginTop: '18px', padding: '12px', background: coaBusy ? '#999' : '#1a1a1a', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', letterSpacing: '0.1em', cursor: coaBusy ? 'default' : 'pointer', fontFamily: 'DM Mono, monospace' }}>
                {coaBusy ? 'UPDATING…' : `UPDATE ${coaMeta.count} ACCOUNT TYPES`}
              </button>
            )}

            {coaResult && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '12px', color: '#166534', lineHeight: 1.9 }}>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>✓ Classification updated</div>
                Accounts classified: {coaResult.accountsClassified}<br />
                {coaResult.breakdown && Object.entries(coaResult.breakdown).map(([k, v]) => `${k}: ${v}`).join('  ·  ')}
                {coaResult.balanceSheet && (
                  <div style={{ marginTop: '6px' }}>
                    Balance sheet: {coaResult.balanceSheet.balanced ? '✓ in balance' : `✕ off by $${coaResult.balanceSheet.offBy}`}
                  </div>
                )}
                {coaResult.unmapped?.length > 0 && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', color: '#92400e' }}>
                    <b>Unrecognized types</b> (left unclassified): {coaResult.unmapped.map((a) => `${a.account} [${a.qb_type}]`).join(', ')}
                  </div>
                )}
                {coaResult.glAccountsStillUnclassified?.length > 0 && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b' }}>
                    <b>In the ledger but still unclassified</b> (possible name mismatch): {coaResult.glAccountsStillUnclassified.join(', ')}
                  </div>
                )}
              </div>
            )}

            {coaError && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '12px', color: '#991b1b', lineHeight: 1.6, wordBreak: 'break-word' }}>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>✕ Error</div>
                {coaError}
              </div>
            )}
          </div>

          {/* Import history + one-level undo */}
          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', padding: '28px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
              <h1 style={{ fontSize: '20px', color: '#1a1a1a' }}>Import History</h1>
              <button onClick={doRestore} disabled={restoreBusy}
                style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em', color: '#1a1a1a', background: '#F5F5F5', border: '1px solid #E5E5E5', borderRadius: '4px', padding: '8px 12px', cursor: restoreBusy ? 'default' : 'pointer' }}>
                {restoreBusy ? 'RESTORING…' : '↺ RESTORE PREVIOUS LEDGER'}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#888', lineHeight: 1.6, marginBottom: '14px' }}>
              Every GL import snapshots the prior ledger first. "Restore previous" undoes the most recent import.
            </p>
            {restoreMsg && (
              <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '4px', fontSize: '11px',
                background: restoreMsg.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${restoreMsg.startsWith('✓') ? '#bbf7d0' : '#fecaca'}`,
                color: restoreMsg.startsWith('✓') ? '#166534' : '#991b1b' }}>
                {restoreMsg}
              </div>
            )}
            {history.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#aaa' }}>No imports recorded yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['When', 'Type', 'Rows', 'By', 'Bal'].map((h) => (
                      <th key={h} style={{ padding: '6px 8px', fontSize: '9px', color: '#888', letterSpacing: '0.1em', textAlign: h === 'Rows' ? 'right' : 'left', borderBottom: '1px solid #E5E5E5', fontFamily: 'DM Mono, monospace' }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td style={{ padding: '6px 8px', fontSize: '10px', color: '#333', fontFamily: 'DM Mono, monospace', borderBottom: '1px solid #F5F5F5' }}>{new Date(h.imported_at).toLocaleString()}</td>
                      <td style={{ padding: '6px 8px', fontSize: '10px', color: '#333', fontFamily: 'DM Mono, monospace', borderBottom: '1px solid #F5F5F5' }}>{h.kind}</td>
                      <td style={{ padding: '6px 8px', fontSize: '10px', color: '#333', fontFamily: 'DM Mono, monospace', textAlign: 'right', borderBottom: '1px solid #F5F5F5' }}>{h.row_count?.toLocaleString() ?? '—'}</td>
                      <td style={{ padding: '6px 8px', fontSize: '10px', color: '#888', fontFamily: 'DM Mono, monospace', borderBottom: '1px solid #F5F5F5' }}>{h.imported_by}</td>
                      <td style={{ padding: '6px 8px', fontSize: '10px', fontFamily: 'DM Mono, monospace', borderBottom: '1px solid #F5F5F5', color: h.balanced === false ? '#CC2222' : '#16a34a' }}>{h.balanced === null || h.balanced === undefined ? '—' : h.balanced ? '✓' : '✕'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

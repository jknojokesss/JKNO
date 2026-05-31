import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const THEME = { sidebarBg: '#1A1A1A', accent: '#CC2222' }

export default function CloverSync() {
  const router = useRouter()
  const [start, setStart]   = useState('2026-05-01')
  const [end, setEnd]       = useState('2026-05-31')
  const [busy, setBusy]     = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError]   = useState(null)

  const run = async () => {
    setBusy(true); setResult(null); setError(null)
    try {
      const res = await fetch('/api/clover-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      setResult(data)
    } catch (e) {
      setError(String(e.message || e))
    }
    setBusy(false)
  }

  return (
    <>
      <Head>
        <title>Clover Sync — Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      </Head>
      <div style={{ minHeight: '100vh', background: '#F8F8F8', fontFamily: 'DM Mono, monospace', padding: '40px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>

          <button onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: '11px', cursor: 'pointer', marginBottom: '20px', fontFamily: 'DM Mono, monospace' }}>
            ← Dashboard
          </button>

          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', padding: '28px' }}>
            <div style={{ fontSize: '10px', color: THEME.accent, letterSpacing: '0.2em', marginBottom: '6px' }}>ADMIN</div>
            <h1 style={{ fontSize: '20px', color: '#1a1a1a', marginBottom: '8px' }}>Clover Sync</h1>
            <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.6, marginBottom: '24px' }}>
              Pulls orders + line items + payment type from Clover for the date range and upserts into Supabase.
              Safe to re-run — rows dedupe on line-item ID, so nothing duplicates.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <label style={{ flex: 1, fontSize: '10px', color: '#888', letterSpacing: '0.1em' }}>
                START
                <input type="date" value={start} onChange={e => setStart(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: '6px', padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px', fontFamily: 'DM Mono, monospace', fontSize: '12px' }} />
              </label>
              <label style={{ flex: 1, fontSize: '10px', color: '#888', letterSpacing: '0.1em' }}>
                END
                <input type="date" value={end} onChange={e => setEnd(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: '6px', padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px', fontFamily: 'DM Mono, monospace', fontSize: '12px' }} />
              </label>
            </div>

            <button onClick={run} disabled={busy}
              style={{ width: '100%', padding: '12px', background: busy ? '#999' : THEME.accent, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', letterSpacing: '0.1em', cursor: busy ? 'default' : 'pointer', fontFamily: 'DM Mono, monospace' }}>
              {busy ? 'SYNCING…' : 'SYNC NOW'}
            </button>

            {result && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '12px', color: '#166534', lineHeight: 1.8 }}>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>✓ Sync complete</div>
                Window: {result.window.start} → {result.window.end}<br />
                Orders pulled: {result.ordersPulled}<br />
                Payments pulled: {result.paymentsPulled}<br />
                Line items upserted: {result.lineItemsUpserted}
              </div>
            )}

            {error && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '12px', color: '#991b1b', lineHeight: 1.6, wordBreak: 'break-word' }}>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>✕ Error</div>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

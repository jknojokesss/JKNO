import { useEffect, useState } from 'react'
import Head from 'next/head'

const GOLD = '#C9A84C', INK = '#1A1A2E'
const KEY = 'jknj_expo_leads'

// Local recovery viewer: shows every lead saved on THIS device/browser (saved on
// submit, before the email even tries to send — so nothing's ever lost). Open this
// on the same browser you captured leads with. Download CSV or re-send to your inbox.
export default function ExpoLeads() {
  const [leads, setLeads] = useState([])
  const [resend, setResend] = useState('') // status text

  useEffect(() => {
    try { setLeads(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch (_) { setLeads([]) }
  }, [])

  const downloadCSV = () => {
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`
    const rows = [['Time', 'Name', 'Business', 'Email', 'Phone', 'Type'].map(esc).join(',')]
    leads.forEach((l) => rows.push([l.at, l.name, l.business, l.email, l.phone, l.industry].map(esc).join(',')))
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'expo-leads.csv'
    document.body.appendChild(a); a.click(); a.remove()
  }

  const resendAll = async () => {
    if (!leads.length) return
    setResend(`Sending 0/${leads.length}…`)
    let ok = 0
    for (let i = 0; i < leads.length; i++) {
      try {
        const r = await fetch('/api/expo-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leads[i]) })
        if (r.ok) ok++
      } catch (_) {}
      setResend(`Sending ${i + 1}/${leads.length}…`)
    }
    setResend(`✓ Re-sent ${ok}/${leads.length} to jk@jknojokes.com (check inbox + spam).`)
  }

  const clearAll = () => {
    if (!confirm('Delete all saved leads on this device? Download the CSV first if you want a copy.')) return
    localStorage.removeItem(KEY); setLeads([])
  }

  const cell = { padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #F0ECE2', color: INK, fontFamily: "'DM Sans', sans-serif" }
  const th = { ...cell, fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '1px', color: '#8A8275', textAlign: 'left', borderBottom: '2px solid #E5DFD2' }
  const btn = (bg, color) => ({ background: bg, color, border: 'none', borderRadius: '8px', padding: '12px 18px', fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' })

  return (
    <>
      <Head>
        <title>Saved Expo Leads</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#F7F4EF;font-family:'DM Sans',sans-serif}`}</style>
      </Head>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 20px 60px' }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 700, letterSpacing: '2px', color: INK }}>JK<span style={{ color: GOLD }}>.</span></div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: 600, color: INK, marginTop: '6px' }}>Saved leads on this device</h1>
        <p style={{ color: '#5A6070', fontSize: '14px', marginTop: '6px', lineHeight: 1.6 }}>
          Every entry you submitted is stored locally on this browser — even the ones whose email failed. {leads.length} saved.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '20px 0' }}>
          <button onClick={downloadCSV} style={btn('#16a34a', '#fff')} disabled={!leads.length}>↓ DOWNLOAD CSV</button>
          <button onClick={resendAll} style={btn(GOLD, INK)} disabled={!leads.length}>✉ RE-SEND ALL TO MY INBOX</button>
          <button onClick={clearAll} style={btn('#F0ECE2', '#8A8275')} disabled={!leads.length}>CLEAR</button>
        </div>
        {resend && <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: '#16a34a', marginBottom: '16px' }}>{resend}</p>}

        {leads.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #EDE7DA', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#8A8275', fontFamily: "'DM Mono', monospace", fontSize: '13px' }}>
            No saved leads on this browser.<br /><br />
            (Local storage is per-browser and per-site — open this on the same browser + same www.jknojokes.com address you captured them on.)
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #EDE7DA', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>NAME</th><th style={th}>BUSINESS</th><th style={th}>EMAIL</th><th style={th}>PHONE</th><th style={th}>TYPE</th></tr></thead>
              <tbody>
                {leads.map((l, i) => (
                  <tr key={i}>
                    <td style={cell}>{l.name}</td>
                    <td style={cell}>{l.business || '—'}</td>
                    <td style={cell}>{l.email}</td>
                    <td style={cell}>{l.phone || '—'}</td>
                    <td style={cell}>{l.industry || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

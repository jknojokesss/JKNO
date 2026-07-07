import { useState, useRef } from 'react'
import Head from 'next/head'

const GOLD = '#C9A84C'
const INK = '#0D0D0D'
const PAPER = '#F7F4EF'
const SLATE = '#2C3E50'

const EMAIL_SUBJECT = `Quick question about your books`

const emailBody = (firstName) =>
  `Hi ${firstName},\n\nDo you actually know your numbers week to week, or are you waiting on your accountant to tell you how last month went?\n\nI build financial dashboards for local businesses that give you a live view of your P&L, cash flow, and sales — and beyond just financials, I can build dashboards to track anything in your business: orders, inventory, team performance, you name it.\n\nYou can see a live demo at jknojokes.com — happy to walk you through it personally too. Interested?\n\nReach out today!\n\n— Jonathan Katz | JK No Jokes Financials | jknojokes.com`

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase())
  const get = (row, ...keys) => {
    for (const k of keys) {
      const i = headers.findIndex((h) => h.includes(k))
      if (i !== -1 && row[i]) return row[i].replace(/^"|"$/g, '').trim()
    }
    return ''
  }
  return lines.slice(1).map((line) => {
    const row = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || line.split(',')
    const firstName = get(row, 'first name', 'first_name', 'firstname') || get(row, 'name').split(' ')[0]
    const lastName = get(row, 'last name', 'last_name', 'lastname') || get(row, 'name').split(' ').slice(1).join(' ')
    const company = get(row, 'company', 'business', 'organization', 'account')
    const email = get(row, 'email')
    const title = get(row, 'title', 'job title', 'position', 'role')
    const city = get(row, 'city', 'location')
    const phone = get(row, 'phone', 'mobile', 'direct')
    return { firstName, lastName, company, email, title, city, phone, sent: false }
  }).filter((c) => c.email || c.firstName)
}

const EMPTY_FORM = { firstName: '', lastName: '', company: '', email: '', title: '', city: '', phone: '' }

export default function Outreach() {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setContacts((prev) => [...prev, ...parseCSV(e.target.result)])
    reader.readAsText(file)
  }

  const handleAdd = () => {
    if (!form.firstName && !form.lastName) { setFormError('First name is required.'); return }
    if (!form.email) { setFormError('Email is required.'); return }
    setContacts((prev) => [...prev, { ...form, sent: false }])
    setForm(EMPTY_FORM)
    setFormError('')
  }

  const markSent = (idx) =>
    setContacts((prev) => prev.map((c, i) => i === idx ? { ...c, sent: true } : c))

  const removeContact = (idx) =>
    setContacts((prev) => prev.filter((_, i) => i !== idx))

  const openZoho = (contact, idx) => {
    const to = encodeURIComponent(contact.email)
    const subject = encodeURIComponent(EMAIL_SUBJECT)
    const body = encodeURIComponent(emailBody(contact.firstName || 'there'))
    window.open(`https://mail.zoho.com/mail/compose.do?to=${to}&subject=${subject}&body=${body}`, '_blank')
    markSent(idx)
  }

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase()
    return !q || [c.firstName, c.lastName, c.company, c.email].some((v) => v?.toLowerCase().includes(q))
  })

  const sentCount = contacts.filter((c) => c.sent).length

  const cell = { padding: '12px 14px', fontSize: '13px', borderBottom: '1px solid #EDE7DA', color: INK, fontFamily: "'DM Sans', sans-serif", verticalAlign: 'middle' }
  const th = { ...cell, fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '1.5px', color: '#8A8275', textAlign: 'left', borderBottom: '2px solid #E5DFD2', background: '#FAF8F4' }
  const input = { border: '1px solid #DDD8CE', borderRadius: '8px', padding: '9px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', background: '#fff', color: INK, outline: 'none', width: '100%' }

  return (
    <>
      <Head>
        <title>Outreach — JK No Jokes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${PAPER};font-family:'DM Sans',sans-serif}`}</style>
      </Head>

      <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, letterSpacing: '2px', color: INK }}>JK<span style={{ color: GOLD }}>.</span></div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '36px', fontWeight: 600, color: INK, marginTop: '4px' }}>Outreach</h1>
          <p style={{ color: '#7A7060', fontSize: '14px', marginTop: '4px' }}>Add contacts manually or upload a CSV — then fire emails straight into Zoho.</p>
        </div>

        {/* Manual entry form */}
        <div style={{ background: '#fff', border: '1px solid #EDE7DA', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '2px', color: '#8A8275', marginBottom: '16px' }}>ADD CONTACT MANUALLY</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#8A8275', marginBottom: '4px', fontFamily: "'DM Mono', monospace", letterSpacing: '1px' }}>FIRST NAME *</div>
              <input style={input} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Jonathan" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8A8275', marginBottom: '4px', fontFamily: "'DM Mono', monospace", letterSpacing: '1px' }}>LAST NAME</div>
              <input style={input} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Smith" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8A8275', marginBottom: '4px', fontFamily: "'DM Mono', monospace", letterSpacing: '1px' }}>EMAIL *</div>
              <input style={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jon@business.com" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8A8275', marginBottom: '4px', fontFamily: "'DM Mono', monospace", letterSpacing: '1px' }}>COMPANY</div>
              <input style={input} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Smith Auto Repair" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8A8275', marginBottom: '4px', fontFamily: "'DM Mono', monospace", letterSpacing: '1px' }}>CITY</div>
              <input style={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Toms River" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8A8275', marginBottom: '4px', fontFamily: "'DM Mono', monospace", letterSpacing: '1px' }}>PHONE</div>
              <input style={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="732-555-0100" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            </div>
          </div>
          {formError && <p style={{ fontSize: '12px', color: '#C0392B', marginBottom: '10px', fontFamily: "'DM Mono', monospace" }}>{formError}</p>}
          <button onClick={handleAdd} style={{ background: GOLD, color: INK, border: 'none', borderRadius: '8px', padding: '10px 24px', fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' }}>
            + ADD CONTACT
          </button>
        </div>

        {/* CSV Upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current.click()}
          style={{ border: `2px dashed ${dragOver ? GOLD : '#D5CDBF'}`, borderRadius: '12px', padding: '28px 40px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#FDF9F0' : '#FAF8F4', transition: 'all 0.2s', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
        >
          <span style={{ fontSize: '20px' }}>📂</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#8A8275', letterSpacing: '1px' }}>
            {fileName ? `${fileName} loaded — drop another to add more` : 'DRAG & DROP CSV OR CLICK TO UPLOAD'}
          </span>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
        </div>

        {/* Contact list */}
        {contacts.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: SLATE }}>{contacts.length} contacts</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#16a34a' }}>{sentCount} emailed</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#B0A898' }}>{contacts.length - sentCount} remaining</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...input, width: '180px' }} />
                <button onClick={() => { setContacts([]); setFileName('') }} style={{ background: '#F0ECE2', border: 'none', borderRadius: '8px', padding: '8px 16px', fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '1px', color: '#8A8275', cursor: 'pointer' }}>CLEAR ALL</button>
              </div>
            </div>

            <div style={{ height: '4px', background: '#EDE7DA', borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ height: '4px', background: GOLD, borderRadius: '4px', width: `${(sentCount / contacts.length) * 100}%`, transition: 'width 0.3s' }} />
            </div>

            <div style={{ background: '#fff', border: '1px solid #EDE7DA', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>NAME</th>
                    <th style={th}>COMPANY</th>
                    <th style={th}>EMAIL</th>
                    <th style={th}>CITY</th>
                    <th style={{ ...th, textAlign: 'center' }}>ACTION</th>
                    <th style={{ ...th, textAlign: 'center' }}>DEL</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const realIdx = contacts.indexOf(c)
                    return (
                      <tr key={i} style={{ background: c.sent ? '#FAFDF7' : '#fff' }}>
                        <td style={cell}><span style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</span></td>
                        <td style={{ ...cell, color: SLATE }}>{c.company || '—'}</td>
                        <td style={{ ...cell, fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#5A6070' }}>{c.email || '—'}</td>
                        <td style={{ ...cell, fontSize: '12px', color: '#8A8275' }}>{c.city || '—'}</td>
                        <td style={{ ...cell, textAlign: 'center' }}>
                          {c.sent ? (
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#16a34a', letterSpacing: '1px', cursor: 'pointer' }} onClick={() => setContacts((prev) => prev.map((x, j) => j === realIdx ? { ...x, sent: false } : x))} title="Click to undo">✓ SENT ↩</span>
                          ) : (
                            <button
                              onClick={() => openZoho(c, realIdx)}
                              disabled={!c.email}
                              style={{ background: c.email ? GOLD : '#EDE7DA', color: c.email ? INK : '#B0A898', border: 'none', borderRadius: '7px', padding: '7px 16px', fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '1px', cursor: c.email ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
                            >
                              SEND EMAIL →
                            </button>
                          )}
                        </td>
                        <td style={{ ...cell, textAlign: 'center' }}>
                          <button onClick={() => removeContact(realIdx)} style={{ background: 'none', border: 'none', color: '#CCC', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>×</button>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} style={{ ...cell, textAlign: 'center', color: '#B0A898', padding: '40px' }}>No contacts match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Email preview */}
            <div style={{ marginTop: '32px', background: '#FAF8F4', border: '1px solid #EDE7DA', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '2px', color: '#8A8275', marginBottom: '12px' }}>EMAIL TEMPLATE</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: SLATE, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                <strong style={{ color: INK }}>Subject:</strong> {EMAIL_SUBJECT}{'\n\n'}{emailBody('[First Name]')}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

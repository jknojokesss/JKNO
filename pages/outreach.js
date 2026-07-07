import { useState, useRef } from 'react'
import Head from 'next/head'

const GOLD = '#C9A84C'
const GOLD_LIGHT = '#E8D5A3'
const INK = '#0D0D0D'
const PAPER = '#F7F4EF'
const SLATE = '#2C3E50'

const EMAIL_SUBJECT = `Quick question about your books`

const emailBody = (firstName) =>
  `Hi ${firstName},\n\nDo you actually know your numbers week to week, or are you waiting on your accountant to tell you how last month went?\n\nI build financial dashboards for local businesses that give you a live view of your P&L, cash flow, and sales — and beyond just financials, I can build dashboards to track anything in your business: orders, inventory, team performance, you name it.\n\nYou can see a live demo at jknojokes.com — happy to walk you through it personally too. Interested?\n\n— Jonathan Katz | JK No Jokes Financials | jknojokes.com`

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

export default function Outreach() {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result)
      setContacts(parsed)
    }
    reader.readAsText(file)
  }

  const markSent = (i) => {
    setContacts((prev) => prev.map((c, idx) => idx === i ? { ...c, sent: true } : c))
  }

  const openZoho = (contact, i) => {
    const to = encodeURIComponent(contact.email)
    const subject = encodeURIComponent(EMAIL_SUBJECT)
    const body = encodeURIComponent(emailBody(contact.firstName || 'there'))
    window.open(`https://mail.zoho.com/zm/#compose?to=${to}&subject=${subject}&body=${body}`, '_blank')
    markSent(i)
  }

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  const sentCount = contacts.filter((c) => c.sent).length

  const cell = {
    padding: '12px 14px',
    fontSize: '13px',
    borderBottom: '1px solid #EDE7DA',
    color: INK,
    fontFamily: "'DM Sans', sans-serif",
    verticalAlign: 'middle',
  }
  const th = {
    ...cell,
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    letterSpacing: '1.5px',
    color: '#8A8275',
    textAlign: 'left',
    borderBottom: '2px solid #E5DFD2',
    background: '#FAF8F4',
  }

  return (
    <>
      <Head>
        <title>Outreach — JK No Jokes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${PAPER};font-family:'DM Sans',sans-serif}`}</style>
      </Head>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, letterSpacing: '2px', color: INK }}>
            JK<span style={{ color: GOLD }}>.</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '36px', fontWeight: 600, color: INK, marginTop: '4px' }}>
            Outreach
          </h1>
          <p style={{ color: '#7A7060', fontSize: '14px', marginTop: '4px' }}>
            Upload a CSV from Apollo or Outscraper — then fire emails straight into Zoho.
          </p>
        </div>

        {/* Upload zone */}
        {contacts.length === 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${dragOver ? GOLD : '#D5CDBF'}`,
              borderRadius: '14px',
              padding: '60px 40px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? '#FDF9F0' : '#FAF8F4',
              transition: 'all 0.2s',
              marginBottom: '32px',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: '#8A8275', letterSpacing: '1px' }}>
              DRAG & DROP CSV OR CLICK TO UPLOAD
            </p>
            <p style={{ fontSize: '12px', color: '#B0A898', marginTop: '8px' }}>
              Works with Apollo and Outscraper exports
            </p>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        )}

        {/* Loaded state */}
        {contacts.length > 0 && (
          <>
            {/* Stats bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#8A8275' }}>
                  {fileName}
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: SLATE }}>
                    {contacts.length} contacts
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#16a34a' }}>
                    {sentCount} emailed
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#B0A898' }}>
                    {contacts.length - sentCount} remaining
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  placeholder="Search contacts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    border: '1px solid #DDD8CE',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    background: '#fff',
                    color: INK,
                    outline: 'none',
                    width: '200px',
                  }}
                />
                <button
                  onClick={() => { setContacts([]); setFileName('') }}
                  style={{
                    background: '#F0ECE2',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '1px',
                    color: '#8A8275',
                    cursor: 'pointer',
                  }}
                >
                  CLEAR
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: '4px', background: '#EDE7DA', borderRadius: '4px', marginBottom: '20px' }}>
              <div style={{ height: '4px', background: GOLD, borderRadius: '4px', width: `${contacts.length ? (sentCount / contacts.length) * 100 : 0}%`, transition: 'width 0.3s' }} />
            </div>

            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #EDE7DA', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>NAME</th>
                    <th style={th}>COMPANY</th>
                    <th style={th}>TITLE</th>
                    <th style={th}>EMAIL</th>
                    <th style={th}>CITY</th>
                    <th style={{ ...th, textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={i} style={{ background: c.sent ? '#FAFDF7' : '#fff' }}>
                      <td style={cell}>
                        <span style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</span>
                      </td>
                      <td style={{ ...cell, color: SLATE }}>{c.company || '—'}</td>
                      <td style={{ ...cell, color: '#8A8275', fontSize: '12px' }}>{c.title || '—'}</td>
                      <td style={{ ...cell, fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#5A6070' }}>{c.email || '—'}</td>
                      <td style={{ ...cell, fontSize: '12px', color: '#8A8275' }}>{c.city || '—'}</td>
                      <td style={{ ...cell, textAlign: 'center' }}>
                        {c.sent ? (
                          <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '11px',
                            color: '#16a34a',
                            letterSpacing: '1px',
                          }}>✓ SENT</span>
                        ) : (
                          <button
                            onClick={() => openZoho(c, contacts.indexOf(c))}
                            disabled={!c.email}
                            style={{
                              background: c.email ? GOLD : '#EDE7DA',
                              color: c.email ? INK : '#B0A898',
                              border: 'none',
                              borderRadius: '7px',
                              padding: '7px 16px',
                              fontFamily: "'DM Mono', monospace",
                              fontSize: '11px',
                              letterSpacing: '1px',
                              cursor: c.email ? 'pointer' : 'default',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            SEND EMAIL →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ ...cell, textAlign: 'center', color: '#B0A898', padding: '40px' }}>
                        No contacts match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Email preview */}
            <div style={{ marginTop: '32px', background: '#FAF8F4', border: '1px solid #EDE7DA', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '2px', color: '#8A8275', marginBottom: '12px' }}>EMAIL TEMPLATE PREVIEW</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: SLATE, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                <strong style={{ color: INK }}>Subject:</strong> {EMAIL_SUBJECT}{'\n\n'}
                {emailBody('[First Name]')}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const GOLD = '#C9A84C'
const INK = '#0D0D0D'
const PAPER = '#F7F4EF'
const SLATE = '#2C3E50'

const EMAIL_SUBJECT = `what your numbers could look like (demo inside)`

const emailBody = (firstName) =>
  `Hi ${firstName},\n\nI do bookkeeping and build live dashboards for local businesses — sales, cash flow, and orders on one screen.\n\nHere's a demo you can click around: jknojokes.com\n\nEverything in it can be custom-built for your business — orders, inventory, team performance, whatever you need tracked. Happy to walk you through it personally. Interested? Reach out today!\n\n— Jonathan Katz | JK No Jokes Financials | jknojokes.com\n\nP.S. Not for you? Just reply STOP and I won't email again.`

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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [scrapeCat, setScrapeCat] = useState('')
  const [scrapeTown, setScrapeTown] = useState('Lakewood')
  const [scraping, setScraping] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState('')
  const fileRef = useRef()

  const refetch = async () => {
    const { data } = await supabase.from('outreach_contacts').select('*').order('created_at', { ascending: true })
    if (data) setContacts(data.map((r) => ({ ...r, firstName: r.first_name, lastName: r.last_name })))
  }

  useEffect(() => { refetch().then(() => setLoading(false)) }, [])

  const scrapeLeads = async () => {
    if (!scrapeCat.trim()) { setScrapeMsg('Enter a category.'); return }
    setScraping(true)
    setScrapeMsg('Searching Google Maps and scraping websites… (up to a minute)')
    try {
      const res = await fetch('/api/scrape-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: scrapeCat.trim(), town: scrapeTown.trim() }),
      })
      let d
      try { d = await res.json() } catch { setScrapeMsg('Error: the search timed out — try a more specific category (e.g. "pizza" not "small business").'); setScraping(false); return }
      if (!res.ok) { setScrapeMsg('Error: ' + (d.error || 'failed')); setScraping(false); return }
      setScrapeMsg(`Found ${d.found} businesses · ${d.withEmails} had emails · added ${d.added} new${d.skippedDuplicates ? ` · skipped ${d.skippedDuplicates} dupes` : ''}.`)
      await refetch()
    } catch (err) {
      setScrapeMsg('Error: ' + err.message)
    }
    setScraping(false)
  }

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const parsed = parseCSV(e.target.result)
      const rows = parsed.map((c) => ({ first_name: c.firstName, last_name: c.lastName, company: c.company, email: c.email, title: c.title, city: c.city, phone: c.phone, sent: false }))
      const { data } = await supabase.from('outreach_contacts').insert(rows).select()
      if (data) setContacts((prev) => [...prev, ...data.map((r) => ({ ...r, firstName: r.first_name, lastName: r.last_name }))])
    }
    reader.readAsText(file)
  }

  const handleAdd = async () => {
    if (!form.firstName && !form.lastName) { setFormError('First name is required.'); return }
    if (!form.email) { setFormError('Email is required.'); return }
    const { data } = await supabase.from('outreach_contacts').insert({ first_name: form.firstName, last_name: form.lastName, company: form.company, email: form.email, title: form.title, city: form.city, phone: form.phone, sent: false }).select().single()
    if (data) setContacts((prev) => [...prev, { ...data, firstName: data.first_name, lastName: data.last_name }])
    setForm(EMPTY_FORM)
    setFormError('')
  }

  const markSent = async (idx) => {
    const c = contacts[idx]
    const sentAt = new Date().toISOString()
    await supabase.from('outreach_contacts').update({ sent: true, sent_at: sentAt }).eq('id', c.id)
    setContacts((prev) => prev.map((x, i) => i === idx ? { ...x, sent: true, sent_at: sentAt } : x))
  }

  const FOLLOW_UP_DAYS = 4
  const dueForFollowUp = (c) =>
    c.sent && !c.followed_up && c.sent_at && (Date.now() - new Date(c.sent_at).getTime()) / 86400000 >= FOLLOW_UP_DAYS

  const sendFollowUp = async (contact, idx) => {
    try {
      const res = await fetch('/api/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contact.email, firstName: contact.firstName, followUp: true }),
      })
      if (!res.ok) { const e = await res.json(); alert('Send failed: ' + e.error); return }
      await supabase.from('outreach_contacts').update({ followed_up: true }).eq('id', contact.id)
      setContacts((prev) => prev.map((x, i) => i === idx ? { ...x, followed_up: true } : x))
    } catch (err) {
      alert('Send failed: ' + err.message)
    }
  }

  const markUnsent = async (idx) => {
    const c = contacts[idx]
    await supabase.from('outreach_contacts').update({ sent: false }).eq('id', c.id)
    setContacts((prev) => prev.map((x, i) => i === idx ? { ...x, sent: false } : x))
  }

  const removeContact = async (idx) => {
    const c = contacts[idx]
    await supabase.from('outreach_contacts').delete().eq('id', c.id)
    setContacts((prev) => prev.filter((_, i) => i !== idx))
  }

  const clearAll = async () => {
    await supabase.from('outreach_contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setContacts([])
    setFileName('')
  }

  const openZoho = async (contact, idx) => {
    try {
      const res = await fetch('/api/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contact.email, firstName: contact.firstName }),
      })
      if (!res.ok) { const e = await res.json(); alert('Send failed: ' + e.error); return }
      markSent(idx)
    } catch (err) {
      alert('Send failed: ' + err.message)
    }
  }

  if (loading) return <div style={{ background: PAPER, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", fontSize: '13px', color: '#8A8275' }}>Loading…</div>

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
          <p style={{ color: '#7A7060', fontSize: '14px', marginTop: '4px' }}>Find local leads, add contacts manually, or upload a CSV — then fire emails straight into Zoho.</p>
        </div>

        {/* Find leads via Google Maps */}
        <div style={{ background: '#0D0D0D', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '2px', color: GOLD, marginBottom: '6px' }}>FIND LOCAL LEADS · GOOGLE MAPS</div>
          <p style={{ color: '#B0A898', fontSize: '13px', marginBottom: '16px' }}>Pulls every business in a category + town, scrapes their websites for emails, and adds the ones it finds.</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2', minWidth: '180px' }}>
              <div style={{ fontSize: '11px', color: '#8A8275', marginBottom: '4px', fontFamily: "'DM Mono', monospace", letterSpacing: '1px' }}>CATEGORY</div>
              <input style={{ ...input, width: '100%' }} value={scrapeCat} onChange={(e) => setScrapeCat(e.target.value)} placeholder="restaurants" onKeyDown={(e) => e.key === 'Enter' && !scraping && scrapeLeads()} />
            </div>
            <div style={{ flex: '1', minWidth: '130px' }}>
              <div style={{ fontSize: '11px', color: '#8A8275', marginBottom: '4px', fontFamily: "'DM Mono', monospace", letterSpacing: '1px' }}>TOWN (NJ)</div>
              <input style={{ ...input, width: '100%' }} value={scrapeTown} onChange={(e) => setScrapeTown(e.target.value)} placeholder="Lakewood" onKeyDown={(e) => e.key === 'Enter' && !scraping && scrapeLeads()} />
            </div>
            <button onClick={scrapeLeads} disabled={scraping} style={{ background: scraping ? '#8A7A3C' : GOLD, color: INK, border: 'none', borderRadius: '8px', padding: '10px 24px', fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '1px', cursor: scraping ? 'default' : 'pointer', height: '38px' }}>
              {scraping ? 'SEARCHING…' : 'FIND LEADS'}
            </button>
          </div>
          {scrapeMsg && <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: scrapeMsg.startsWith('Error') ? '#E24B4A' : '#5DCAA5', marginTop: '14px' }}>{scrapeMsg}</p>}
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
                <button onClick={clearAll} style={{ background: '#F0ECE2', border: 'none', borderRadius: '8px', padding: '8px 16px', fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '1px', color: '#8A8275', cursor: 'pointer' }}>CLEAR ALL</button>
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
                          {c.sent && dueForFollowUp(c) ? (
                            <button
                              onClick={() => sendFollowUp(c, realIdx)}
                              style={{ background: '#2C3E50', color: '#fff', border: 'none', borderRadius: '7px', padding: '7px 16px', fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              FOLLOW UP →
                            </button>
                          ) : c.sent ? (
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#16a34a', letterSpacing: '1px', cursor: 'pointer' }} onClick={() => markUnsent(realIdx)} title="Click to undo">{c.followed_up ? '✓✓ FOLLOWED UP' : '✓ SENT ↩'}</span>
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

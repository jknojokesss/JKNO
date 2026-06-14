import { useState } from 'react'
import Head from 'next/head'

const GOLD = '#C9A84C', INK = '#1A1A2E', CREAM = '#F7F4EF'

export default function Expo() {
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '', industry: '' })
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [errMsg, setErrMsg] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) { setErrMsg('Please add at least a name and email.'); setStatus('error'); return }
    setStatus('sending'); setErrMsg('')
    // Local backup first — never lose a lead to flaky expo wifi.
    try {
      const prev = JSON.parse(localStorage.getItem('jknj_expo_leads') || '[]')
      prev.push({ ...form, at: new Date().toISOString() })
      localStorage.setItem('jknj_expo_leads', JSON.stringify(prev))
    } catch (_) {}
    try {
      const res = await fetch('/api/expo-lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error((j.error || 'Something went wrong') + (j.detail ? ` [${j.detail}]` : '')) }
      setStatus('done')
    } catch (err) {
      setErrMsg(err.message + ' — their info is saved on this device, you can re-send later.')
      setStatus('error')
    }
  }

  const reset = () => { setForm({ name: '', business: '', email: '', phone: '', industry: '' }); setStatus('idle'); setErrMsg('') }

  const input = {
    width: '100%', padding: '18px 18px', fontSize: '18px', fontFamily: "'DM Sans', sans-serif",
    border: '1.5px solid #DDD8CE', borderRadius: '10px', background: '#fff', color: INK, outline: 'none', marginBottom: '14px',
  }

  return (
    <>
      <Head>
        <title>JK No Jokes — Get Your Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${CREAM};font-family:'DM Sans',sans-serif}::placeholder{color:#A8A095}input:focus{border-color:${GOLD}!important}`}</style>
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 48px' }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>

          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '30px', fontWeight: 700, letterSpacing: '2px', color: INK }}>
              JK<span style={{ color: GOLD }}>.</span>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '3px', color: GOLD, marginTop: '2px' }}>NO JOKES BOOKKEEPING</div>
          </div>

          {status === 'done' ? (
            <div style={{ textAlign: 'center', marginTop: '40px', background: '#fff', border: '1px solid #EDE7DA', borderRadius: '16px', padding: '44px 28px' }}>
              <div style={{ fontSize: '52px', marginBottom: '8px' }}>🎁</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: 600, color: INK }}>You're in!</h1>
              <p style={{ fontSize: '17px', color: '#5A6070', lineHeight: 1.6, margin: '12px auto 0', maxWidth: '380px' }}>
                Check your email — the live demo and your <strong>$25 gift card</strong> consultation link are on the way. I'll be in touch within a day.
              </p>
              <a href="/demo" style={{ display: 'inline-block', marginTop: '26px', background: GOLD, color: INK, textDecoration: 'none', padding: '14px 28px', borderRadius: '8px', fontFamily: "'DM Mono', monospace", fontSize: '13px', letterSpacing: '1.5px' }}>SEE THE LIVE DEMO →</a>
              <div style={{ marginTop: '20px' }}>
                <button onClick={reset} style={{ background: 'none', border: 'none', color: '#8A8275', fontFamily: "'DM Mono', monospace", fontSize: '13px', letterSpacing: '1px', cursor: 'pointer', padding: '10px' }}>
                  ↻ NEXT PERSON
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '22px' }}>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px,6vw,40px)', fontWeight: 600, color: INK, lineHeight: 1.1 }}>
                  Know your <span style={{ color: GOLD }}>real</span> numbers.
                </h1>
                <p style={{ fontSize: '16px', color: '#5A6070', lineHeight: 1.6, margin: '12px auto 0', maxWidth: '440px' }}>
                  Clean books + a live dashboard showing your true profit and margins. Drop your info and I'll send the demo and a <strong>free $25 gift card</strong> for a quick consult.
                </p>
                <a href="/demo" style={{ display: 'inline-block', marginTop: '16px', color: '#B8943C', textDecoration: 'none', fontFamily: "'DM Mono', monospace", fontSize: '13px', letterSpacing: '1px', borderBottom: `1px solid ${GOLD}`, paddingBottom: '2px' }}>
                  See the live demo first →
                </a>
              </div>

              <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #EDE7DA', borderRadius: '16px', padding: '24px' }}>
                <input style={input} placeholder="Your name *" value={form.name} onChange={set('name')} autoComplete="off" />
                <input style={input} placeholder="Business name" value={form.business} onChange={set('business')} autoComplete="off" />
                <input style={input} type="email" placeholder="Email *" value={form.email} onChange={set('email')} autoComplete="off" />
                <input style={input} type="tel" placeholder="Phone" value={form.phone} onChange={set('phone')} autoComplete="off" />
                <input style={{ ...input, marginBottom: '20px' }} placeholder="What kind of business? (e.g. tire shop, restaurant)" value={form.industry} onChange={set('industry')} autoComplete="off" />

                {status === 'error' && <p style={{ color: '#C0392B', fontSize: '14px', marginBottom: '14px', lineHeight: 1.5 }}>{errMsg}</p>}

                <button type="submit" disabled={status === 'sending'} style={{
                  width: '100%', padding: '20px', background: status === 'sending' ? '#D8C68A' : GOLD, color: INK, border: 'none',
                  borderRadius: '10px', fontFamily: "'DM Mono', monospace", fontSize: '15px', letterSpacing: '1.5px', cursor: 'pointer',
                }}>
                  {status === 'sending' ? 'SENDING…' : 'GET MY DEMO + $25 GIFT CARD →'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#A8A095', marginTop: '12px', fontFamily: "'DM Mono', monospace", letterSpacing: '0.5px' }}>
                  Must run a small business · no spam, just the demo + offer
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}

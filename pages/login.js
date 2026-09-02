import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// ── One login link for every client ──────────────────────────────────────
// This page does NOT sign anybody in. Our clients' portals live in different
// places — /portal, /gowns, /jerky-munch, and Reydel's own app on another
// origin — so "Client Login" on the marketing site used to be a redirect
// straight to Reydel's door and everyone else landed in the wrong place.
//
// Now it asks for an email, asks the server which door that is
// (/api/login-destination), and sends them there with the email pre-filled.
// The password is always typed on the destination's own screen: a session
// made here would not survive the hop to another origin anyway, and keeping
// the credential out of this page keeps the routing layer un-privileged.
//
// The lookup never says whether an account exists — an unknown email routes
// to the default portal like any other. Don't add a "no such account"
// message here; that turns this into a client-list enumerator.
export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const go = async () => {
    const clean = email.trim()
    if (!clean) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      })
      if (!res.ok) throw new Error('lookup failed')
      const { url } = await res.json()
      const target = `${url}${url.includes('?') ? '&' : '?'}email=${encodeURIComponent(clean)}`
      // External portals (Reydel) leave the site; ours stay in the router.
      if (/^https?:\/\//i.test(target)) window.location.href = target
      else router.push(target)
    } catch {
      setError('Could not reach the sign-in service. Try again, or email jk@jknojokes.com.')
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') go() }

  return (
    <>
      <Head>
        <title>Client Login — JK No Jokes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1A2035; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-card { animation: fadeUp 0.5s ease both; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#1A2035',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%',
          transform: 'translateX(-50%)',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(100,120,180,0.08) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(100,120,180,0.08) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        {/* Back to home */}
        <button onClick={() => router.push('/')} style={{
          position: 'absolute', top: '24px', left: '24px',
          background: 'none', border: 'none',
          color: '#A8B0C8', fontSize: '12px',
          fontFamily: 'DM Mono, monospace', letterSpacing: '1px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          transition: 'color 0.2s',
          zIndex: 10,
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
          onMouseLeave={e => e.currentTarget.style.color = '#A8B0C8'}
        >
          ← BACK TO HOME
        </button>

        {/* Card */}
        <div className="login-card" style={{
          background: '#1E2540',
          border: '1px solid #2E3A5C',
          borderRadius: '4px',
          padding: '48px 44px',
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>

          {/* Gold corner accents */}
          <div style={{ position:'absolute', top:0, left:0, width:20, height:20,
            borderTop:'2px solid #C9A84C', borderLeft:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', top:0, right:0, width:20, height:20,
            borderTop:'2px solid #C9A84C', borderRight:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', bottom:0, left:0, width:20, height:20,
            borderBottom:'2px solid #C9A84C', borderLeft:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', bottom:0, right:0, width:20, height:20,
            borderBottom:'2px solid #C9A84C', borderRight:'2px solid #C9A84C' }} />

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px',
              fontWeight: '700', color: '#EAE8E4', letterSpacing: '2px', lineHeight: 1 }}>
              JK<span style={{ color: '#C9A84C' }}>.</span>
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px',
              letterSpacing: '3px', color: '#C9A84C', textTransform: 'uppercase', marginTop: '8px' }}>
              No Jokes Financials
            </div>
            <div style={{ width: '40px', height: '1px', background: '#2E3A5C', margin: '16px auto 0' }} />
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px',
              fontWeight: '700', color: '#EAE8E4', margin: 0, marginBottom: '8px',
              letterSpacing: '-0.5px' }}>
              Client Portal
            </h1>
            <p style={{ fontSize: '14px', color: '#A8B0C8', margin: 0, lineHeight: 1.6 }}>
              Enter your email and we&rsquo;ll take you to your portal.
            </p>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
              fontSize: '10px', letterSpacing: '2px', color: '#6B7A96',
              marginBottom: '8px', textTransform: 'uppercase' }}>Email</label>
            <input type="email" value={email} autoComplete="username"
              onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="you@company.com"
              style={{ width: '100%', padding: '12px 14px',
                border: '1px solid #2E3A5C', borderRadius: '2px',
                fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
                color: '#EAE8E4', background: '#243050',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#2E3A5C'} />
          </div>

          {/* Error — connectivity only. Never anything about the account. */}
          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 14px',
              background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)',
              borderRadius: '2px', fontSize: '13px', color: '#F1948A',
              fontFamily: 'DM Sans, sans-serif' }}>{error}</div>
          )}

          {/* Button */}
          <button onClick={go} disabled={loading || !email}
            style={{ width: '100%', padding: '14px 20px',
              background: loading || !email ? '#2E3A5C' : '#C9A84C',
              color: loading || !email ? '#6B7A96' : '#12151C',
              border: 'none', borderRadius: '2px', fontSize: '12px',
              fontFamily: 'DM Mono, monospace', fontWeight: '500', letterSpacing: '2px',
              cursor: loading || !email ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!loading && email) e.target.style.background = '#E8D5A3' }}
            onMouseLeave={e => { if (!loading && email) e.target.style.background = '#C9A84C' }}>
            {loading ? 'Finding your portal...' : 'Continue →'}
          </button>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px',
            color: '#6B7A96', lineHeight: 1.7, fontFamily: 'DM Sans, sans-serif' }}>
            You&rsquo;ll enter your password on your own portal.<br />
            Trouble getting in? <a href="mailto:jk@jknojokes.com" style={{ color: '#C9A84C', textDecoration: 'none' }}>jk@jknojokes.com</a>
          </p>
        </div>
      </div>
    </>
  )
}

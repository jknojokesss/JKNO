import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
      else setChecking(false)
    })
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Incorrect email or password. Please try again.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin() }

  if (checking) return null

  return (
    <>
      <Head>
        <title>Client Login — JK No Jokes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
              No Jokes Bookkeeping
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
              Sign in to view your financials and insights.
            </p>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
              fontSize: '10px', letterSpacing: '2px', color: '#6B7A96',
              marginBottom: '8px', textTransform: 'uppercase' }}>Email</label>
            <input type="email" value={email}
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

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
              fontSize: '10px', letterSpacing: '2px', color: '#6B7A96',
              marginBottom: '8px', textTransform: 'uppercase' }}>Password</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px',
                border: '1px solid #2E3A5C', borderRadius: '2px',
                fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
                color: '#EAE8E4', background: '#243050',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#2E3A5C'} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 14px',
              background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)',
              borderRadius: '2px', fontSize: '13px', color: '#F1948A',
              fontFamily: 'DM Sans, sans-serif' }}>{error}</div>
          )}

          {/* Button */}
          <button onClick={handleLogin} disabled={loading || !email || !password}
            style={{ width: '100%', padding: '14px 20px',
              background: loading || !email || !password ? '#2E3A5C' : '#C9A84C',
              color: loading || !email || !password ? '#6B7A96' : '#12151C',
              border: 'none', borderRadius: '2px', fontSize: '12px',
              fontFamily: 'DM Mono, monospace', fontWeight: '500', letterSpacing: '2px',
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!loading && email && password) e.target.style.background = '#E8D5A3' }}
            onMouseLeave={e => { if (!loading && email && password) e.target.style.background = '#C9A84C' }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          {/* Footer note */}
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#6B7A96',
            marginTop: '24px', marginBottom: 0, lineHeight: 1.6,
            fontFamily: 'DM Mono, monospace', letterSpacing: '0.5px' }}>
            No account? <span style={{ color: '#C9A84C', cursor: 'pointer' }}
              onClick={() => router.push('/#contact')}>Request access →</span>
          </p>
        </div>

        {/* Bottom */}
        <div style={{ marginTop: '32px', fontFamily: 'DM Mono, monospace',
          fontSize: '10px', letterSpacing: '2px', color: '#2E3A5C',
          textTransform: 'uppercase', position: 'relative' }}>
          JK No Jokes © {new Date().getFullYear()}
        </div>
      </div>
    </>
  )
}

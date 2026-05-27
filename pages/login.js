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
      </Head>
      <div style={{
        minHeight: '100vh', background: '#F7F4EF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(201,168,76,0.08) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(44,62,80,0.06) 0%, transparent 50%)` }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', width: '1px', height: '80px',
          background: 'linear-gradient(to bottom, transparent, #C9A84C)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', width: '1px', height: '80px',
          background: 'linear-gradient(to top, transparent, #C9A84C)' }} />

        <div style={{ background: '#fff', border: '1px solid #E8D5A3', borderRadius: '2px',
          padding: '56px 52px', width: '100%', maxWidth: '420px',
          position: 'relative', boxShadow: '0 4px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ position:'absolute', top:0, left:0, width:24, height:24,
            borderTop:'2px solid #C9A84C', borderLeft:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', top:0, right:0, width:24, height:24,
            borderTop:'2px solid #C9A84C', borderRight:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', bottom:0, left:0, width:24, height:24,
            borderBottom:'2px solid #C9A84C', borderLeft:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', bottom:0, right:0, width:24, height:24,
            borderBottom:'2px solid #C9A84C', borderRight:'2px solid #C9A84C' }} />

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px',
              fontWeight: '700', color: '#0D0D0D', letterSpacing: '-0.5px', lineHeight: 1 }}>JK</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
              letterSpacing: '3px', color: '#C9A84C', textTransform: 'uppercase', marginTop: '6px' }}>
              No Jokes Bookkeeping
            </div>
            <div style={{ width: '40px', height: '1px', background: '#C9A84C', margin: '16px auto 0' }} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px',
              fontWeight: '600', color: '#0D0D0D', margin: 0, marginBottom: '8px' }}>
              Client Portal
            </h1>
            <p style={{ fontSize: '14px', color: '#718096', margin: 0, lineHeight: 1.6 }}>
              Sign in to view your financials,<br />reports, and business insights.
            </p>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
              fontSize: '10px', letterSpacing: '2px', color: '#A0AEC0',
              marginBottom: '8px', textTransform: 'uppercase' }}>Email</label>
            <input type="email" value={email}
              onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="you@company.com"
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0',
                borderRadius: '2px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
                color: '#0D0D0D', background: '#fff', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
              fontSize: '10px', letterSpacing: '2px', color: '#A0AEC0',
              marginBottom: '8px', textTransform: 'uppercase' }}>Password</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0',
                borderRadius: '2px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
                color: '#0D0D0D', background: '#fff', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 14px',
              background: '#FFF5F5', border: '1px solid #F1948A',
              borderRadius: '2px', fontSize: '13px', color: '#C0392B' }}>{error}</div>
          )}

          <button onClick={handleLogin} disabled={loading || !email || !password}
            style={{ width: '100%', padding: '14px 20px',
              background: loading || !email || !password ? '#f5f5f5' : '#0D0D0D',
              color: loading || !email || !password ? '#999' : '#fff',
              border: 'none', borderRadius: '2px', fontSize: '13px',
              fontFamily: 'DM Mono, monospace', fontWeight: '500', letterSpacing: '2px',
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase' }}
            onMouseEnter={e => { if (!loading && email && password) e.target.style.background = '#2C3E50' }}
            onMouseLeave={e => { if (!loading && email && password) e.target.style.background = '#0D0D0D' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#A0AEC0',
            marginTop: '24px', marginBottom: 0, lineHeight: 1.6 }}>
            Access restricted to invited clients.<br />
            <span style={{ color: '#C9A84C', cursor: 'pointer' }}
              onClick={() => router.push('/#contact')}>
              Request access →
            </span>
          </p>
        </div>

        <div style={{ position: 'absolute', bottom: '24px',
          fontFamily: 'DM Mono, monospace', fontSize: '10px',
          letterSpacing: '2px', color: '#CBD5E0', textTransform: 'uppercase' }}>
          Powered by JK No Jokes © {new Date().getFullYear()}
        </div>
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data } = await supabase.from('admins').select('email').eq('email', session.user.email).single()
        if (data) router.push('/admin/dashboard')
        else setChecking(false)
      } else setChecking(false)
    })
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) { setError('Incorrect email or password.'); setLoading(false); return }

    // Check if admin
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', email).single()
    if (!adminData) {
      await supabase.auth.signOut()
      setError('Access denied. This portal is for admins only.')
      setLoading(false)
      return
    }
    router.push('/admin/dashboard')
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin() }
  if (checking) return null

  return (
    <>
      <Head><title>Admin — JK No Jokes</title></Head>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: #0D1120; }`}</style>
      <div style={{ minHeight: '100vh', background: '#0D1120',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', position: 'relative', overflow: 'hidden' }}>

        {/* Grid bg */}
        <div style={{ position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px' }} />

        <div style={{ background: '#161D30', border: '1px solid #2E3A5C',
          borderRadius: '4px', padding: '48px 44px', width: '100%', maxWidth: '400px',
          position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

          {/* Gold corners */}
          {['tl','tr','bl','br'].map(c => (
            <div key={c} style={{ position: 'absolute',
              top: c.startsWith('t') ? 0 : 'auto',
              bottom: c.startsWith('b') ? 0 : 'auto',
              left: c.endsWith('l') ? 0 : 'auto',
              right: c.endsWith('r') ? 0 : 'auto',
              width: 20, height: 20,
              borderTop: c.startsWith('t') ? '2px solid #C9A84C' : 'none',
              borderBottom: c.startsWith('b') ? '2px solid #C9A84C' : 'none',
              borderLeft: c.endsWith('l') ? '2px solid #C9A84C' : 'none',
              borderRight: c.endsWith('r') ? '2px solid #C9A84C' : 'none',
            }} />
          ))}

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '26px',
              fontWeight: '700', color: '#EAE8E4', letterSpacing: '2px' }}>
              JK<span style={{ color: '#C9A84C' }}>.</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px',
              letterSpacing: '3px', color: '#C9A84C', marginTop: '6px' }}>
              ADMIN PORTAL
            </div>
            <div style={{ width: '40px', height: '1px', background: '#2E3A5C', margin: '14px auto 0' }} />
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '20px',
            fontWeight: '600', color: '#EAE8E4', textAlign: 'center',
            marginBottom: '28px', letterSpacing: '-0.3px' }}>
            Staff Login
          </h1>

          {/* Email */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '10px',
              letterSpacing: '2px', color: '#6B7A96', marginBottom: '8px' }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown} placeholder="jk@jknojokes.com"
              style={{ width: '100%', padding: '12px 14px', background: '#1E2540',
                border: '1px solid #2E3A5C', borderRadius: '2px', fontSize: '14px',
                color: '#EAE8E4', outline: 'none', fontFamily: 'sans-serif' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#2E3A5C'} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '10px',
              letterSpacing: '2px', color: '#6B7A96', marginBottom: '8px' }}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown} placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', background: '#1E2540',
                border: '1px solid #2E3A5C', borderRadius: '2px', fontSize: '14px',
                color: '#EAE8E4', outline: 'none', fontFamily: 'sans-serif' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#2E3A5C'} />
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 14px',
              background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)',
              borderRadius: '2px', fontSize: '13px', color: '#F1948A' }}>{error}</div>
          )}

          <button onClick={handleLogin} disabled={loading || !email || !password}
            style={{ width: '100%', padding: '14px',
              background: loading || !email || !password ? '#1E2540' : '#C9A84C',
              color: loading || !email || !password ? '#4A5568' : '#0D1120',
              border: 'none', borderRadius: '2px', fontSize: '12px',
              fontFamily: 'monospace', letterSpacing: '2px', cursor: 'pointer',
              textTransform: 'uppercase', fontWeight: '600', transition: 'all 0.2s' }}>
            {loading ? 'VERIFYING...' : 'SIGN IN →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#2E3A5C',
            marginTop: '20px', fontFamily: 'monospace', letterSpacing: '1px' }}>
            CLIENT LOGIN AT{' '}
            <span style={{ color: '#C9A84C', cursor: 'pointer' }}
              onClick={() => router.push('/login')}>
              JKNOJOKES.COM/LOGIN
            </span>
          </p>
        </div>
      </div>
    </>
  )
}

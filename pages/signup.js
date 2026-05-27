import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      <Head><title>Setup Account — JK No Jokes</title></Head>
      <div style={{ minHeight: '100vh', background: '#F7F4EF',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid #E8D5A3',
          padding: '48px', width: '100%', maxWidth: '400px',
          boxShadow: '0 4px 40px rgba(0,0,0,0.06)' }}>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px',
              fontWeight: '700', color: '#0D0D0D' }}>JK</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
              letterSpacing: '3px', color: '#C9A84C', marginTop: '4px' }}>
              ACCOUNT SETUP
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
              fontSize: '10px', letterSpacing: '2px', color: '#A0AEC0',
              marginBottom: '8px' }}>EMAIL</label>
            <input type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0',
                borderRadius: '2px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
              fontSize: '10px', letterSpacing: '2px', color: '#A0AEC0',
              marginBottom: '8px' }}>PASSWORD</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0',
                borderRadius: '2px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 14px',
              background: '#FFF5F5', border: '1px solid #F1948A',
              fontSize: '13px', color: '#C0392B' }}>{error}</div>
          )}

          <button onClick={handleSignup} disabled={loading || !email || !password}
            style={{ width: '100%', padding: '14px',
              background: '#0D0D0D', color: '#fff', border: 'none',
              fontSize: '13px', fontFamily: 'DM Mono, monospace',
              letterSpacing: '2px', cursor: 'pointer' }}>
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </div>
      </div>
    </>
  )
}

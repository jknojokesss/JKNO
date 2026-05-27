import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase puts the token in the URL hash - we need to let it process
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  const handleReset = async () => {
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      <Head><title>Reset Password — JK No Jokes</title></Head>
      <div style={{
        minHeight: '100vh', background: '#F7F4EF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: '#fff', border: '1px solid #E8D5A3',
          borderRadius: '2px', padding: '56px 52px',
          width: '100%', maxWidth: '420px',
          position: 'relative', boxShadow: '0 4px 40px rgba(0,0,0,0.06)',
        }}>
          {/* Gold corners */}
          <div style={{ position:'absolute', top:0, left:0, width:24, height:24,
            borderTop:'2px solid #C9A84C', borderLeft:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', top:0, right:0, width:24, height:24,
            borderTop:'2px solid #C9A84C', borderRight:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', bottom:0, left:0, width:24, height:24,
            borderBottom:'2px solid #C9A84C', borderLeft:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', bottom:0, right:0, width:24, height:24,
            borderBottom:'2px solid #C9A84C', borderRight:'2px solid #C9A84C' }} />

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px',
              fontWeight: '700', color: '#0D0D0D' }}>JK</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px',
              letterSpacing: '3px', color: '#C9A84C', marginTop: '6px' }}>
              No Jokes Bookkeeping
            </div>
            <div style={{ width: '40px', height: '1px', background: '#C9A84C', margin: '16px auto 0' }} />
          </div>

          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px',
            fontWeight: '600', color: '#0D0D0D', textAlign: 'center',
            marginBottom: '28px' }}>Set New Password</h1>

          {!ready ? (
            <div style={{ textAlign: 'center', color: '#718096', fontSize: '14px' }}>
              Processing your reset link...
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
                  fontSize: '10px', letterSpacing: '2px', color: '#A0AEC0',
                  marginBottom: '8px', textTransform: 'uppercase' }}>New Password</label>
                <input type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0',
                    borderRadius: '2px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
                    outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontFamily: 'DM Mono, monospace',
                  fontSize: '10px', letterSpacing: '2px', color: '#A0AEC0',
                  marginBottom: '8px', textTransform: 'uppercase' }}>Confirm Password</label>
                <input type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0',
                    borderRadius: '2px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
                    outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {error && (
                <div style={{ marginBottom: '16px', padding: '10px 14px',
                  background: '#FFF5F5', border: '1px solid #F1948A',
                  borderRadius: '2px', fontSize: '13px', color: '#C0392B' }}>
                  {error}
                </div>
              )}

              <button onClick={handleReset} disabled={loading || !password || !confirm}
                style={{ width: '100%', padding: '14px 20px',
                  background: loading || !password || !confirm ? '#f5f5f5' : '#0D0D0D',
                  color: loading || !password || !confirm ? '#999' : '#fff',
                  border: 'none', borderRadius: '2px', fontSize: '13px',
                  fontFamily: 'DM Mono, monospace', letterSpacing: '2px',
                  cursor: 'pointer', textTransform: 'uppercase' }}>
                {loading ? 'Saving...' : 'Set Password'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

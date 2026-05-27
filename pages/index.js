import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Login() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
      else setChecking(false)
    })
  }, [])

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      alert('Login failed: ' + error.message)
      setLoading(false)
    }
  }

  if (checking) return null

  return (
    <>
      <Head>
        <title>JK No Jokes — Client Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#F7F4EF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Background texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(201,168,76,0.08) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(44,62,80,0.06) 0%, transparent 50%)`,
        }} />

        {/* Decorative lines */}
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          width: '1px', height: '80px',
          background: 'linear-gradient(to bottom, transparent, #C9A84C)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: '50%',
          width: '1px', height: '80px',
          background: 'linear-gradient(to top, transparent, #C9A84C)',
        }} />

        {/* Card */}
        <div className="fade-up" style={{
          background: '#fff',
          border: '1px solid #E8D5A3',
          borderRadius: '2px',
          padding: '56px 52px',
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          boxShadow: '0 4px 40px rgba(0,0,0,0.06)',
        }}>

          {/* Gold corner accents */}
          <div style={{ position:'absolute', top:0, left:0, width:24, height:24,
            borderTop:'2px solid #C9A84C', borderLeft:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', top:0, right:0, width:24, height:24,
            borderTop:'2px solid #C9A84C', borderRight:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', bottom:0, left:0, width:24, height:24,
            borderBottom:'2px solid #C9A84C', borderLeft:'2px solid #C9A84C' }} />
          <div style={{ position:'absolute', bottom:0, right:0, width:24, height:24,
            borderBottom:'2px solid #C9A84C', borderRight:'2px solid #C9A84C' }} />

          {/* Logo area */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '28px',
              fontWeight: '700',
              color: '#0D0D0D',
              letterSpacing: '-0.5px',
              lineHeight: 1,
            }}>
              JK
            </div>
            <div style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              letterSpacing: '3px',
              color: '#C9A84C',
              textTransform: 'uppercase',
              marginTop: '6px',
            }}>
              No Jokes Bookkeeping
            </div>
            <div style={{
              width: '40px', height: '1px',
              background: '#C9A84C',
              margin: '16px auto 0',
            }} />
          </div>

          {/* Welcome text */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '22px',
              fontWeight: '600',
              color: '#0D0D0D',
              margin: 0,
              marginBottom: '8px',
            }}>
              Client Portal
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#718096',
              margin: 0,
              lineHeight: 1.6,
            }}>
              Sign in to view your financials,<br />reports, and business insights.
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: loading ? '#f5f5f5' : '#0D0D0D',
              color: loading ? '#999' : '#fff',
              border: 'none',
              borderRadius: '2px',
              fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: '500',
              letterSpacing: '0.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#2C3E50' }}
            onMouseLeave={e => { if (!loading) e.target.style.background = '#0D0D0D' }}
          >
            {!loading && (
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Footer note */}
          <p style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#A0AEC0',
            marginTop: '24px',
            marginBottom: 0,
            lineHeight: 1.6,
          }}>
            Access is restricted to invited clients only.<br />
            Contact <span style={{ color: '#C9A84C' }}>jk@jknojokes.com</span> for access.
          </p>
        </div>

        {/* Bottom branding */}
        <div style={{
          position: 'absolute', bottom: '24px',
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          letterSpacing: '2px',
          color: '#CBD5E0',
          textTransform: 'uppercase',
        }}>
          Powered by JK No Jokes © {new Date().getFullYear()}
        </div>
      </div>
    </>
  )
}

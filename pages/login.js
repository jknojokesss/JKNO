import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import MarketingShell, { PageHero } from '../components/MarketingShell'
import { supabase } from '../lib/supabase'
import { loginUrlWithEmail } from '../lib/loginRouting'

// ── One login link for every client ──────────────────────────────────────
// Step 1: email → /api/login-destination picks the right door.
// Step 2: password on THIS page when the portal lives here (/portal, /admin);
// otherwise we hand off to that app with ?email= prefilled (Reydel, gowns,
// jerky — separate origins or Supabase projects).
//
// The lookup never says whether an account exists — unknown emails still get
// a destination (usually /portal). Don't add a "no such account" message.
export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phase, setPhase] = useState('email') // 'email' | 'password'
  const [destination, setDestination] = useState('/portal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    const q = router.query.email
    if (typeof q === 'string' && q.trim()) setEmail(q.trim())
  }, [router.query.email])

  const destinationLabel = (url) => {
    if (url === '/admin') return 'JK admin'
    if (url === '/portal') return 'client portal'
    if (url === '/jerky-munch') return 'Jerky Munch'
    if (url.includes('reydel')) return 'Reydel Tire portal'
    if (url.includes('gowns')) return 'Lew Imports shop'
    return 'your portal'
  }

  const continueWithEmail = async () => {
    const clean = email.trim()
    if (!clean) return
    setLoading(true)
    setError('')
    setResetSent(false)
    try {
      const res = await fetch('/api/login-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      })
      if (!res.ok) throw new Error('lookup failed')
      const { url, signInHere } = await res.json()
      const dest = url || '/portal'
      setDestination(dest)

      if (signInHere) {
        setPhase('password')
        setLoading(false)
        return
      }

      const target = loginUrlWithEmail(dest, clean)
      if (/^https?:\/\//i.test(target)) window.location.href = target
      else router.push(target)
    } catch {
      setError('Could not reach the sign-in service. Try again, or email jk@jknojokes.com.')
      setLoading(false)
    }
  }

  const signInHere = async () => {
    const clean = email.trim()
    if (!clean || !password) return
    setLoading(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: clean,
      password,
    })
    if (signInError) {
      const msg = String(signInError.message || '').trim()
      if (/invalid login credentials/i.test(msg)) setError('Wrong email or password.')
      else if (!msg || signInError.status >= 500) {
        setError('Sign-in is having trouble on our end. Email jk@jknojokes.com instead of retrying forever.')
      } else setError(msg)
      setLoading(false)
      return
    }

    if (destination === '/admin') {
      const { data: adminRow } = await supabase.from('admins').select('email').eq('email', clean).maybeSingle()
      if (!adminRow) {
        await supabase.auth.signOut()
        setError('That login is not an admin account. Use the client login flow or contact JK.')
        setLoading(false)
        return
      }
      router.push('/admin/dashboard')
      return
    }

    router.push('/portal')
  }

  const forgotPassword = async () => {
    const clean = email.trim()
    if (!clean) return
    setResetLoading(true)
    setError('')
    const base = window.location.hostname === 'localhost'
      ? window.location.origin
      : 'https://jknojokes.com'
    await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo: `${base}/reset-password`,
    })
    setResetLoading(false)
    setResetSent(true)
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return
    if (phase === 'email') continueWithEmail()
    else signInHere()
  }

  const backToEmail = () => {
    setPhase('email')
    setPassword('')
    setError('')
    setResetSent(false)
  }

  return (
    <MarketingShell
      title="Client login | JK No Jokes Financials"
      description="Sign in to your client portal or get routed to the right app."
    >
      <Head>
        <meta name="robots" content="noindex" />
      </Head>

      <PageHero
        kicker="Clients"
        title="Sign in"
        lead={
          phase === 'email'
            ? 'Enter your email — we\u2019ll send you to the right portal, or finish sign-in here when your books live on JK No Jokes.'
            : `Password for ${destinationLabel(destination)}.`
        }
        align="center"
      />

      <section className="m-section m-login-section" aria-labelledby="login-form-title">
        <div className="m-wrap m-login-section__card">
          <div className="m-card m-card--pop m-login-card">
            <h2 id="login-form-title" className="m-login-card__title">
              {phase === 'email' ? 'Continue with email' : 'Enter your password'}
            </h2>
            <p className="m-login-card__hint">
              Invited clients only. Trouble getting in?{' '}
              <a href="mailto:jk@jknojokes.com">jk@jknojokes.com</a>
            </p>

            <label className="m-label" style={{ marginTop: 20 }}>
              Email
              <input
                type="email"
                value={email}
                autoComplete="username"
                readOnly={phase === 'password'}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@company.com"
              />
            </label>

            {phase === 'password' && (
              <>
                <label className="m-label" style={{ marginTop: 14 }}>
                  Password
                  <input
                    type="password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Your password"
                    autoFocus
                  />
                </label>
                <p className="m-login-card__hint" style={{ marginTop: 12, marginBottom: 0 }}>
                  <button
                    type="button"
                    className="m-jk-text-link"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
                    onClick={forgotPassword}
                    disabled={resetLoading || !email.trim()}
                  >
                    {resetLoading ? 'Sending reset link…' : 'Forgot password?'}
                  </button>
                  {resetSent && (
                    <span role="status"> Check your inbox for a reset link.</span>
                  )}
                </p>
              </>
            )}

            {error && (
              <p className="m-form-error" role="alert">{error}</p>
            )}

            <button
              type="button"
              className="m-btn m-btn--primary m-btn--pop"
              style={{ width: '100%', marginTop: 18 }}
              onClick={phase === 'email' ? continueWithEmail : signInHere}
              disabled={loading || !email.trim() || (phase === 'password' && !password)}
            >
              {loading
                ? (phase === 'email' ? 'Finding your portal…' : 'Signing in…')
                : (phase === 'email' ? 'Continue' : 'Sign in')}
            </button>

            {phase === 'password' ? (
              <p className="m-login-card__foot">
                <button
                  type="button"
                  className="m-jk-text-link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
                  onClick={backToEmail}
                >
                  Use a different email
                </button>
              </p>
            ) : (
              <p className="m-login-card__foot">
                Staff with admin access use the same email here — you&apos;ll be routed to admin after password.
              </p>
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

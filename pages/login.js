import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import MarketingShell, { PageHero } from '../components/MarketingShell'

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
      if (/^https?:\/\//i.test(target)) window.location.href = target
      else router.push(target)
    } catch {
      setError('Could not reach the sign-in service. Try again, or email jk@jknojokes.com.')
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') go() }

  return (
    <MarketingShell
      title="Client login | JK No Jokes Financials"
      description="Enter your email to open your client portal."
    >
      <Head>
        <meta name="robots" content="noindex" />
      </Head>

      <PageHero
        kicker="Clients"
        title="Your portal"
        lead="Enter your email and I&rsquo;ll send you to the right sign-in screen. Your password stays on that portal — not here."
        align="center"
      />

      <section className="m-section m-login-section" aria-labelledby="login-form-title">
        <div className="m-wrap m-login-section__card">
          <div className="m-card m-card--pop m-login-card">
            <h2 id="login-form-title" className="m-login-card__title">
              Continue with email
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
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@company.com"
              />
            </label>

            {error && (
              <p className="m-form-error" role="alert">{error}</p>
            )}

            <button
              type="button"
              className="m-btn m-btn--primary m-btn--pop"
              style={{ width: '100%', marginTop: 18 }}
              onClick={go}
              disabled={loading || !email.trim()}
            >
              {loading ? 'Finding your portal…' : 'Continue'}
            </button>

            <p className="m-login-card__foot">
              You&rsquo;ll enter your password on your own portal after this step.
            </p>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

import { useState } from 'react'
import MarketingShell from '../components/MarketingShell'
import HomeIntro from '../components/HomeIntro'
import HomeShowcase, { HomeRotator } from '../components/HomeShowcase'
import HomeSpotlight from '../components/HomeSpotlight'
import { BOOKING_URL } from '../lib/marketing'

export default function Landing() {
  const [introPlaying, setIntroPlaying] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', business: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.business) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setSubmitted(true)
      else alert('Something went wrong. Please email jk@jknojokes.com directly.')
    } catch {
      alert('Something went wrong. Please email jk@jknojokes.com directly.')
    }
    setSubmitting(false)
  }

  const scrollShowcase = () => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <MarketingShell
      padTop={false}
      darkHeader={introPlaying}
      title="JK No Jokes Financials — Custom Dashboards Wired Into Your Systems"
      description="Custom financial portals wired into QuickBooks — POS, distributor invoices, wholesale billing, job costing, inventory, AR, and month-end close."
    >
      <HomeIntro
        onStart={() => setIntroPlaying(true)}
        onDone={() => setIntroPlaying(false)}
      />

      <HomeSpotlight active={!introPlaying}>
        <div className="m-home">
          <section className="m-stage">
            <div className="m-wrap m-stage__inner">
              <h1 className="m-stage__title">
                We build the software<br />behind your numbers.
              </h1>
              <HomeRotator />
              <p className="m-stage__sub">
                QuickBooks wired to your register, distributors, and vendors — updated every night.
              </p>
              <button type="button" className="m-btn m-btn--primary m-btn--pop m-stage__btn" onClick={scrollShowcase}>
                Pick your industry ↓
              </button>
            </div>
          </section>

          <HomeShowcase />

          <section id="contact" className="m-contact-slab">
            <div className="m-wrap" style={{ maxWidth: '440px' }}>
              <h2 className="m-h2 m-contact-slab__title">
                What would you want built first?
              </h2>

              {submitted ? (
                <div className="m-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 600 }}>We&rsquo;ll be in touch.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { key: 'name', label: 'Your name', type: 'text', placeholder: 'John Smith' },
                    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com' },
                    { key: 'business', label: 'Business name', type: 'text', placeholder: 'Acme Corp' },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="m-label">{label}</label>
                      <input type={type} placeholder={placeholder} value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="m-btn m-btn--primary m-btn--pop"
                    style={{ width: '100%', marginTop: '4px' }}
                    onClick={handleSubmit}
                    disabled={submitting || !form.name || !form.email || !form.business}
                  >
                    {submitting ? 'Sending…' : 'Send message'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '13px', color: '#9AA3BD' }}>
                    Or <a href="mailto:jk@jknojokes.com" style={{ color: '#5A6577' }}>jk@jknojokes.com</a>
                    {' · '}
                    <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#5A6577' }}>book a call</a>
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </HomeSpotlight>
    </MarketingShell>
  )
}

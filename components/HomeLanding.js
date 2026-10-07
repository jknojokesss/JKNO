import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { BUSINESS_TYPES, SERVICE_PACKAGES } from '../lib/buildStack'
import { FEATURED_DEMOS } from '../lib/marketingDemos'
import { HERO_DOORS, getDemoHook } from '../lib/demoHooks'
import DemoGalleryCard from './DemoGalleryCard'

/** Homepage grid — range of industries; full list lives on /demos */
const HOME_DEMOS = [
  FEATURED_DEMOS[0],
  FEATURED_DEMOS[1],
  FEATURED_DEMOS[5],
  FEATURED_DEMOS[4],
].filter(Boolean)

const STEPS = [
  { n: '1', title: 'Call', body: 'Thirty minutes. What you sell, how you get paid, what you keep rebuilding in Excel.' },
  { n: '2', title: 'Wire-up', body: 'Your books, register, vendors — I write the sync. It runs every night.' },
  { n: '3', title: 'Go live', body: 'About six days. We walk the portal together. Nothing ships until it matches your books.' },
]

const TRADES = [
  'Tire / auto',
  'Contractor / trades',
  'Import / wholesale',
  'Retail / custom orders',
  'Property / professional services',
  'Other',
]

const BOOKS = [
  'QuickBooks Online',
  'QuickBooks Desktop',
  'Spreadsheet / accountant only',
  'Other software',
]

export default function HomeLanding({
  live,
  form,
  setForm,
  onSubmit,
  submitted,
  submitting,
}) {
  const router = useRouter()

  const scrollContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollDemos = () => {
    document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={live ? 'm-home m-home--live' : 'm-home'}>
      <section className="m-dark-band m-dark-band--brief">
        <div className="m-wrap m-hero-brief">
          <div className="m-hero-brief__copy">
            <p className="m-hero-brief__mark" aria-hidden="true">
              <span className="m-hero-brief__jk">JK<span className="m-hero-brief__dot">.</span></span>
            </p>
            <h1 className="m-band__title m-band__title--brief">
              QuickBooks closes the month.
              <br />
              <span className="m-hero-accent">You run the week.</span>
            </h1>
            <p className="m-band__sub m-band__sub--brief">
              Custom owner portals — register, vendors, jobs — wired to the books you already trust.
              About six days from kickoff to go-live.
            </p>
            <div className="m-band__actions">
              <button type="button" className="m-btn m-btn--gold m-btn--pop" onClick={scrollContact}>
                Get started
              </button>
              <button type="button" className="m-btn m-btn--ghost-light" onClick={scrollDemos}>
                View demos
              </button>
            </div>
          </div>

          <div className="m-hero-doors">
            <p className="m-hero-doors__cap">Pick a door — no login</p>
            {HERO_DOORS.map((p, i) => {
              const { hook } = getDemoHook(p.href)
              return (
                <a key={p.href} href={p.href} className="m-hero-door" style={{ '--door-i': i }}>
                  <span className="m-hero-door__num">{p.n}</span>
                  <span className="m-hero-door__body">
                    <span className="m-hero-door__hook">{hook}</span>
                    <span className="m-hero-door__name">{p.name}</span>
                  </span>
                  <span className="m-hero-door__go" aria-hidden="true">→</span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <section className="m-section">
        <div className="m-wrap">
          <h2 className="m-h2">What owners hire me for</h2>
          <p className="m-lead" style={{ maxWidth: '52ch', marginBottom: '24px' }}>
            Books in on a schedule, operating screen out — different UI depending on the business.
          </p>
          <div className="m-package-grid">
            {SERVICE_PACKAGES.map((p) => (
              <a key={p.title} href={p.href} className="m-package-card">
                <span className="m-package-card__title">{p.title}</span>
                <span className="m-package-card__blurb">{p.blurb}</span>
                <span className="m-package-card__go">Open sample</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="demos" className="m-section m-section--panel">
        <div className="m-wrap">
          <h2 className="m-h2">More samples</h2>
          <p className="m-lead m-lead--tight">
            Fictitious names. If one screen makes you reach for your phone, that&rsquo;s the conversation we want.
          </p>
          <div className="m-demo-spot-grid">
            {HOME_DEMOS.map((d, i) => (
              <DemoGalleryCard
                key={d.src}
                href={d.src}
                biz={d.biz || d.label}
                industry={d.label}
                index={i}
              />
            ))}
          </div>
          <p style={{ marginTop: '24px' }}>
            <button type="button" className="m-btn--text" onClick={() => router.push('/demos')}>
              All demos
            </button>
          </p>
        </div>
      </section>

      <section className="m-section">
        <div className="m-wrap">
          <h2 className="m-h2">Who I build for</h2>
          <ul className="m-home-fit">
            {BUSINESS_TYPES.map((row) => (
              <li key={row.label}>
                <strong>{row.label}</strong>
                <span>{row.detail}</span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: '28px' }}>
            <button type="button" className="m-btn m-btn--secondary" onClick={() => router.push('/what-we-do')}>
              What I build
            </button>
          </p>
        </div>
      </section>

      <section id="how" className="m-section m-section--panel">
        <div className="m-wrap">
          <h2 className="m-h2">How it works</h2>
          <div className="m-how-strip" style={{ marginTop: '32px' }}>
            {STEPS.map((s) => (
              <div key={s.n} className="m-step-pop">
                <div className="m-step-pop__n">{s.n}</div>
                <h3 className="m-step-pop__title">{s.title}</h3>
                <p className="m-step-pop__body">{s.body}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '28px' }}>
            <button type="button" className="m-btn--text" onClick={() => router.push('/how-it-works')}>
              Full timeline
            </button>
          </p>
        </div>
      </section>

      <section id="contact" className="m-contact-slab">
        <div className="m-wrap m-contact-grid">
          <div>
            <h2 className="m-h2">Get started</h2>
            <p className="m-lead" style={{ marginTop: '12px' }}>
              Tell me what you run and what you want on one screen. I&rsquo;ll point you at the right demo and quote the build.
            </p>
            <p style={{ marginTop: '20px', fontSize: '15px', color: 'var(--m-muted)' }}>
              Or{' '}
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn--text">
                book a 30-minute call
              </a>
              .
            </p>
          </div>

          <div className="m-card" style={{ padding: '24px 22px' }}>
            {submitted ? (
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Got it — I&rsquo;ll be in touch.</p>
            ) : (
              <>
                {[
                  { key: 'name', label: 'Your name', type: 'text', placeholder: 'Your name' },
                  { key: 'email', label: 'Email', type: 'email', placeholder: 'you@yourshop.com' },
                  { key: 'business', label: 'Business', type: 'text', placeholder: 'Shop name' },
                ].map(({ key, label, type, placeholder }) => (
                  <label key={key} className="m-label" style={{ marginTop: key === 'name' ? 0 : 14 }}>
                    {label}
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </label>
                ))}

                <label className="m-label" style={{ marginTop: 14 }}>
                  Trade
                  <select
                    className="m-select"
                    value={form.trade}
                    onChange={(e) => setForm({ ...form, trade: e.target.value })}
                  >
                    <option value="">Select</option>
                    {TRADES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>

                <label className="m-label" style={{ marginTop: 14 }}>
                  Books today
                  <select
                    className="m-select"
                    value={form.quickbooks}
                    onChange={(e) => setForm({ ...form, quickbooks: e.target.value })}
                  >
                    <option value="">Select</option>
                    {BOOKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </label>

                <label className="m-label" style={{ marginTop: 14 }}>
                  One screen you want
                  <textarea
                    rows={3}
                    placeholder="e.g. margin per ticket, landed cost per PO…"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </label>

                <button
                  type="button"
                  className="m-btn m-btn--primary"
                  style={{ width: '100%', marginTop: 18 }}
                  onClick={onSubmit}
                  disabled={
                    submitting
                    || !form.name
                    || !form.email
                    || !form.business
                    || !form.trade
                    || !form.quickbooks
                  }
                >
                  {submitting ? 'Sending…' : 'Send'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

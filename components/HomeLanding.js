import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { FEATURED_DEMOS } from '../lib/marketingDemos'
import { HERO_DOORS } from '../lib/demoHooks'
import DemoGalleryCard from './DemoGalleryCard'

const HOME_DEMOS = [
  FEATURED_DEMOS[0],
  FEATURED_DEMOS[1],
  FEATURED_DEMOS[5],
  FEATURED_DEMOS[4],
  FEATURED_DEMOS[3],
  FEATURED_DEMOS[8],
].filter(Boolean)

const PROOF = [
  { n: '06', label: 'days', detail: 'kickoff to go-live, typical' },
  { n: '01', label: 'login', detail: 'one company — scoped on the server' },
  { n: '00', label: 'chatbots', detail: 'answers from your books, computed' },
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
      <section className="m-hero-home">
        <div className="m-wrap m-hero-home__grid">
          <div className="m-hero-home__copy">
            <p className="m-hero-home__mark" aria-hidden="true">
              JK<span className="m-hero-home__dot">.</span>
            </p>
            <h1 className="m-hero-home__title">
              Your accountant has the month.
              <span className="m-hero-home__title-line">You need <em>today</em>.</span>
            </h1>
            <p className="m-hero-home__sub">
              Register, vendors, jobs — synced nightly into a login that looks like your business, not a template.
            </p>
            <p className="m-hero-home__actions">
              <button type="button" className="m-hero-home__action m-hero-home__action--lead" onClick={scrollContact}>
                Tell me what you run
              </button>
              <span className="m-hero-home__action-sep" aria-hidden="true">/</span>
              <button type="button" className="m-hero-home__action" onClick={scrollDemos}>
                Walk a sample
              </button>
            </p>
            <p className="m-hero-home__foot">
              <button type="button" className="m-hero-home__link" onClick={() => router.push('/what-we-do')}>
                What we build
              </button>
              <span className="m-hero-home__foot-dot" aria-hidden="true">·</span>
              <button type="button" className="m-hero-home__link" onClick={() => router.push('/how-it-works')}>
                How it ships
              </button>
            </p>
          </div>

          <div className="m-hero-home__samples">
            <p className="m-hero-home__samples-note">Sample portals — no login</p>
            {HERO_DOORS.map((p) => (
              <a key={p.href} href={p.href} className="m-hero-home__bar">
                <span className="m-hero-home__bar-text">
                  <span className="m-hero-home__bar-name">{p.name}</span>
                  <span className="m-hero-home__bar-industry">{p.industry}</span>
                </span>
                <span className="m-hero-home__bar-go" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="m-home-proof" aria-label="How it works in numbers">
        <div className="m-wrap m-home-proof__grid">
          {PROOF.map((row) => (
            <div key={row.label} className="m-home-proof__cell">
              <p className="m-home-proof__num">
                {row.n}
                <span className="m-home-proof__label">{row.label}</span>
              </p>
              <p className="m-home-proof__detail">{row.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="m-home-manifesto">
        <div className="m-wrap">
          <p className="m-home-manifesto__text">
            Not another SaaS dashboard.
            <br />
            The screen you&rsquo;d build if you had a year — shipped in a week.
          </p>
        </div>
      </section>

      <section id="demos" className="m-home-demos">
        <div className="m-wrap">
          <div className="m-home-demos__head">
            <h2 className="m-home-demos__title">Walk someone else&rsquo;s week.</h2>
            <p className="m-home-demos__lead">
              Fictitious companies. Real layouts. If one question sticks in your head, we&rsquo;re done.
            </p>
            <button type="button" className="m-btn m-btn--secondary m-home-demos__all" onClick={() => router.push('/demos')}>
              All samples
            </button>
          </div>
          <div className="m-demo-spot-grid m-demo-spot-grid--home">
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
        </div>
      </section>

      <section id="contact" className="m-home-close">
        <div className="m-wrap m-home-close__grid">
          <div className="m-home-close__copy">
            <p className="m-home-close__kicker">Ready when you are</p>
            <h2 className="m-home-close__title">Tell me the one screen you keep rebuilding in Excel.</h2>
            <p className="m-home-close__lead">
              I&rsquo;ll point you at the closest sample and quote the build — or{' '}
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-home-close__book">
                book thirty minutes
              </a>
              .
            </p>
          </div>

          <div className="m-home-close__form m-card">
            {submitted ? (
              <p className="m-home-close__thanks">Got it. I&rsquo;ll be in touch.</p>
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
                  That one screen
                  <textarea
                    rows={3}
                    placeholder="Margin per ticket, landed cost per PO, rent roll on the 1st…"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </label>

                <button
                  type="button"
                  className="m-btn m-btn--gold m-btn--pop"
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

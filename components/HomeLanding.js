import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { FEATURED_DEMOS } from '../lib/marketingDemos'
import { HERO_SAMPLE_BARS } from '../lib/samplePortals'
import DemoGalleryCard from './DemoGalleryCard'

const HOME_DEMOS = [
  FEATURED_DEMOS[0],
  FEATURED_DEMOS[1],
  FEATURED_DEMOS[5],
  FEATURED_DEMOS[4],
  FEATURED_DEMOS[3],
  FEATURED_DEMOS[8],
].filter(Boolean)

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

const BRIDGE = [
  'QuickBooks in the middle',
  'Nightly sync',
  'One login per company',
  'Close ties to the books',
]

const FIT_ROWS = [
  {
    label: 'Books',
    body: 'P&L and balance sheet, trailing two years. GL detail for recon. Statements stay the source of truth — not a spreadsheet rebuild.',
  },
  {
    label: 'Portal',
    body: 'Your name on sign-in, your palette on the nav. Margin and cash while the week is open; closed month matches QuickBooks.',
  },
  {
    label: 'Ship',
    body: 'About six business days from kickoff to your login. Integrations, screens, tune until close matches.',
  },
]

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function HomeLanding({
  form,
  setForm,
  onSubmit,
  submitted,
  submitting,
}) {
  const router = useRouter()

  return (
    <div className="m-home m-home--live">
      <section className="m-hero-home" id="top">
        <div className="m-wrap m-hero-home__grid">
          <div className="m-hero-home__copy">
            <p className="m-hero-home__mark" aria-hidden="true">
              JK<span className="m-hero-home__dot">.</span>
            </p>
            <h1 className="m-hero-home__title">
              Your accountant has <em>the month.</em>
              <span className="m-hero-home__title-line">You need today.</span>
            </h1>
            <p className="m-hero-home__sub">
              Register, vendors, jobs — synced nightly into a login that looks like your business, not a template.
            </p>
            <div className="m-hero-home__actions">
              <button
                type="button"
                className="m-hero-home__action m-hero-home__action--lead"
                onClick={() => scrollToId('contact')}
              >
                Start a build
              </button>
              <span className="m-hero-home__action-sep" aria-hidden="true">or</span>
              <button
                type="button"
                className="m-hero-home__action"
                onClick={() => router.push('/demos')}
              >
                Open samples
              </button>
            </div>
            <p className="m-hero-home__foot">
              <button
                type="button"
                className="m-hero-home__link"
                onClick={() => router.push('/how-it-works')}
              >
                How it ships
              </button>
              <span className="m-hero-home__foot-dot" aria-hidden="true">·</span>
              <span>Six days kickoff to login</span>
            </p>
          </div>

          <div className="m-hero-home__samples" id="samples">
            <p className="m-hero-home__samples-label">Fictitious shops · real screens</p>
            {HERO_SAMPLE_BARS.map((p) => (
              <DemoGalleryCard
                key={p.href}
                href={p.href}
                biz={p.name}
                industry={p.industry}
                onDark
              />
            ))}
          </div>
        </div>
      </section>

      <section className="m-home-bridge" aria-label="At a glance">
        <div className="m-wrap m-home-bridge__row">
          {BRIDGE.map((item) => (
            <span key={item} className="m-home-bridge__item">{item}</span>
          ))}
        </div>
      </section>

      <section className="m-section m-section--paper" id="books">
        <div className="m-wrap">
          <p className="m-kicker">What you get</p>
          <h2 className="m-h2" style={{ maxWidth: '20ch', marginBottom: '1.25rem' }}>
            One pipe. Your portal on top.
          </h2>
          <ul className="m-home-fit">
            {FIT_ROWS.map((row) => (
              <li key={row.label}>
                <strong>{row.label}</strong>
                <span>{row.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="m-home-demos" id="demos">
        <div className="m-wrap">
          <div className="m-home-demos__head">
            <h2 className="m-home-demos__title">Sample portals</h2>
            <p className="m-home-demos__lead">
              If one screen sticks in your head, we&rsquo;re done. No login — walk someone else&rsquo;s week.
            </p>
            <button
              type="button"
              className="m-btn m-btn--secondary m-home-demos__all"
              onClick={() => router.push('/demos')}
            >
              All samples
            </button>
          </div>
          <div className="m-demo-grid m-demo-grid--gallery">
            {HOME_DEMOS.map((d) => (
              <DemoGalleryCard
                key={d.src}
                href={d.src}
                biz={d.biz || d.label}
                industry={d.label}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="m-dark-band" id="how">
        <div className="m-wrap m-band m-band--solo">
          <div className="m-band__hero" style={{ maxWidth: '40rem' }}>
            <p className="m-band__kicker">How it ships</p>
            <h2 className="m-band__title">Kickoff to login in about six days</h2>
            <ul className="m-band__checks">
              <li>Tell me what you run and what&rsquo;s already in QuickBooks.</li>
              <li>I wire nightly sync and your portal shell.</li>
              <li>You walk it on real GL — not a slide deck.</li>
              <li>We tune until close and the screen you asked for match.</li>
            </ul>
            <p className="m-band__foot">
              <button
                type="button"
                className="m-band__foot-link"
                onClick={() => router.push('/how-it-works')}
              >
                Full timeline
              </button>
            </p>
          </div>
        </div>
      </section>

      <section className="m-home-close" id="contact">
        <div className="m-wrap m-home-close__grid">
          <div className="m-home-close__copy">
            <p className="m-home-close__kicker">Start</p>
            <h2 className="m-home-close__title">
              Tell me the one screen you keep rebuilding in Excel.
            </h2>
            <p className="m-home-close__lead">
              I&rsquo;ll point you at the closest sample and quote the build — or{' '}
              <a className="m-home-close__book" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                book thirty minutes
              </a>
              .
            </p>
          </div>

          <div className="m-card m-home-close__form">
            {submitted ? (
              <p className="m-home-close__thanks">Got it. I&rsquo;ll be in touch.</p>
            ) : (
              <>
                {[
                  { key: 'name', label: 'Your name', type: 'text', placeholder: 'Your name' },
                  { key: 'email', label: 'Email', type: 'email', placeholder: 'you@yourshop.com' },
                  { key: 'business', label: 'Business', type: 'text', placeholder: 'Shop name' },
                ].map(({ key, label, type, placeholder }) => (
                  <label key={key} className="m-label" style={{ marginTop: key === 'name' ? 0 : 14, display: 'block' }}>
                    {label}
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </label>
                ))}

                <label className="m-label" style={{ marginTop: 14, display: 'block' }}>
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

                <label className="m-label" style={{ marginTop: 14, display: 'block' }}>
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

                <label className="m-label" style={{ marginTop: 14, display: 'block' }}>
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

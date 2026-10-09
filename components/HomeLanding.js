import { useRef } from 'react'
import { useHomeCardReveal } from '../lib/useHomeCardReveal'
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

const CARD_STAGGER_MS = {
  books: 0,
  portal: 60,
  samples: 40,
  demos: 60,
  how: 40,
  contact: 80,
}

function StoryCard({ id, className = '', children }) {
  const stagger = CARD_STAGGER_MS[id] ?? 0
  return (
    <article
      className={`m-home-card${className ? ` ${className}` : ''}`}
      data-home-card={id}
      style={{ '--fly-stagger': `${stagger}ms` }}
    >
      <div className="m-home-card__fly">{children}</div>
    </article>
  )
}

export default function HomeLanding({
  form,
  setForm,
  onSubmit,
  submitted,
  submitting,
}) {
  const router = useRouter()
  const rootRef = useRef(null)
  useHomeCardReveal(rootRef)

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div ref={rootRef} className="m-home">
      <div className="m-home__bg" aria-hidden="true" />
      <div className="m-home__grain" aria-hidden="true" />

      <div className="m-home__scroll">
        <header className="m-home__hero" id="top">
          <p className="m-home__eyebrow">Owner portals on real books</p>
          <h1 className="m-home__hero-h">Your accountant has the month. You need today.</h1>
          <p className="m-home__hero-lead">
            Register, vendors, jobs — synced nightly into a login that looks like your business, not a template.
          </p>
          <button
            type="button"
            className="m-home__scroll-cue"
            onClick={() => scrollToSection('books')}
          >
            See how it works
          </button>
        </header>

        <div className="m-home__lane m-home__lane--left" id="books">
          <StoryCard id="books">
            <div className="c-eyebrow">
              Books <i aria-hidden="true" />
            </div>
            <h2>QuickBooks in the middle</h2>
            <p className="lead">
              Nightly sync mirrors your chart and GL — statements stay the source of truth, not a spreadsheet rebuild.
            </p>
            <ul className="checks">
              <li>P&amp;L and balance sheet, trailing two years</li>
              <li>GL detail for recon and close</li>
              <li>One Intuit connection per company</li>
            </ul>
          </StoryCard>
        </div>

        <div className="m-home__lane m-home__lane--right" id="portal">
          <StoryCard id="portal">
            <div className="c-eyebrow">
              Portal <i aria-hidden="true" />
            </div>
            <h2>Looks like your shop</h2>
            <p className="lead">
              Your name on the sign-in, your palette on the nav — one login maps to exactly one set of books.
            </p>
            <ul className="checks">
              <li>Margin and cash while the week is still open</li>
              <li>Closed month ties to QuickBooks</li>
              <li>No shared template with another client</li>
            </ul>
          </StoryCard>
        </div>

        <div className="m-home__lane m-home__lane--left" id="samples">
          <StoryCard id="samples">
            <div className="c-eyebrow">
              Samples <i aria-hidden="true" />
            </div>
            <h2>Open a sample — no login</h2>
            <p className="lead">Fictitious companies. Real layouts. Pick one that feels close.</p>
            <div className="m-home-card__samples">
              {HERO_SAMPLE_BARS.map((p) => (
                <DemoGalleryCard
                  key={p.href}
                  href={p.href}
                  biz={p.name}
                  industry={p.industry}
                />
              ))}
            </div>
          </StoryCard>
        </div>

        <div className="m-home__lane m-home__lane--right" id="demos">
          <StoryCard id="demos">
            <div className="c-eyebrow">
              Gallery <i aria-hidden="true" />
            </div>
            <h2>More sample portals</h2>
            <p className="lead">If one screen sticks in your head, we&rsquo;re done.</p>
            <div className="m-home-card__demos">
              {HOME_DEMOS.map((d) => (
                <DemoGalleryCard
                  key={d.src}
                  href={d.src}
                  biz={d.biz || d.label}
                  industry={d.label}
                  compact
                />
              ))}
            </div>
            <button
              type="button"
              className="m-home-card__btn"
              onClick={() => router.push('/demos')}
            >
              All samples
            </button>
          </StoryCard>
        </div>

        <div className="m-home__lane m-home__lane--left" id="how">
          <StoryCard id="how">
            <div className="c-eyebrow">
              How it ships <i aria-hidden="true" />
            </div>
            <h2>One build, about six days</h2>
            <ol className="steps">
              <li>Tell me what you run and what&rsquo;s already in QuickBooks.</li>
              <li>I wire nightly sync and your portal shell.</li>
              <li>You walk it on real GL — not a slide deck.</li>
              <li>We tune until close and the screen you asked for match.</li>
            </ol>
            <button
              type="button"
              className="m-home-card__btn m-home-card__btn--ghost"
              onClick={() => router.push('/how-it-works')}
            >
              Full timeline
            </button>
          </StoryCard>
        </div>

        <div className="m-home__lane m-home__lane--right" id="contact">
          <StoryCard id="contact" className="m-home-card--form">
            <div className="c-eyebrow">
              Start <i aria-hidden="true" />
            </div>
            <h2>Tell me the one screen you keep rebuilding in Excel.</h2>
            <p className="lead">
              I&rsquo;ll point you at the closest sample and quote the build — or{' '}
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#8c6b25' }}>
                book thirty minutes
              </a>
              .
            </p>
            {submitted ? (
              <p className="lead" style={{ marginBottom: 0 }}>Got it. I&rsquo;ll be in touch.</p>
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
          </StoryCard>
        </div>
      </div>
    </div>
  )
}

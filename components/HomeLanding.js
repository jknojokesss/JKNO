import { useRef } from 'react'
import { useHomeFlightMotion, FLIGHT_STEPS } from '../lib/useHomeFlightMotion'
import { useFlightCardReveal } from '../lib/useFlightCardReveal'
import { scrollToFlightStep } from '../lib/flightSteps'
import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { FEATURED_DEMOS } from '../lib/marketingDemos'
import { HERO_SAMPLE_BARS } from '../lib/samplePortals'
import DemoGalleryCard from './DemoGalleryCard'
import ChocolateBarLink, { ChocolateBarCaption } from './ChocolateBarLink'

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

function FlightCard({ id, className = '', children }) {
  const stagger = CARD_STAGGER_MS[id] ?? 0
  return (
    <article
      className={`m-flight-card${className ? ` ${className}` : ''}`}
      data-flight-card={id}
      style={{ '--fly-stagger': `${stagger}ms` }}
    >
      <div className="m-flight-card__fly">{children}</div>
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
  useFlightCardReveal(rootRef)
  const { hud, activeStep } = useHomeFlightMotion(rootRef)
  const scrollDemos = () => {
    scrollToFlightStep('flight-samples')
  }

  const scrollContact = () => {
    scrollToFlightStep('contact')
  }

  return (
    <div ref={rootRef} className="m-flight m-flight--live">
      <div className="m-flight__sky" aria-hidden="true" />
      <div className="m-flight__haze" aria-hidden="true" />
      <div className="m-flight__horizon" aria-hidden="true" />
      <div className="m-flight__orb" aria-hidden="true" />
      <div className="m-flight__vignette" aria-hidden="true" />
      <div className="m-flight__grain" aria-hidden="true" />
      <div className="m-flight__dim" aria-hidden="true" />
      <div className="m-flight__debris" aria-hidden="true">
        <span className="m-flight__shard m-flight__shard--1" />
        <span className="m-flight__shard m-flight__shard--2" />
        <span className="m-flight__shard m-flight__shard--3" />
        <span className="m-flight__shard m-flight__shard--4" />
        <span className="m-flight__shard m-flight__shard--5" />
        <span className="m-flight__shard m-flight__shard--6" />
        <span className="m-flight__contrail m-flight__contrail--1" />
        <span className="m-flight__contrail m-flight__contrail--2" />
        <span className="m-flight__contrail m-flight__contrail--3" />
        <span className="m-flight__foil m-flight__foil--1" />
        <span className="m-flight__foil m-flight__foil--2" />
      </div>
      <aside className="m-flight-instruments" aria-hidden="true">
        <div className="m-flight-instruments__inst">
          <span className="m-flight-instruments__lab">Books</span>
          <span className="m-flight-instruments__val" key={`b-${hud.books}`}>{hud.books}</span>
        </div>
        <div className="m-flight-instruments__inst">
          <span className="m-flight-instruments__lab">Sync</span>
          <span className="m-flight-instruments__val" key={`s-${hud.sync}`}>{hud.sync}</span>
        </div>
        <div className="m-flight-instruments__inst">
          <span className="m-flight-instruments__lab">Login</span>
          <span className="m-flight-instruments__val" key={`l-${hud.login}`}>{hud.login}</span>
        </div>
      </aside>

      <nav className="m-flight-strip" aria-label="Story progress">
        <div className="m-flight-strip__track">
          <div className="m-flight-strip__fill" />
          <div className="m-flight-strip__beacon" />
        </div>
        <ul className="m-flight-waypoints">
          {FLIGHT_STEPS.map((step, i) => (
            <li key={step.id} data-on={activeStep === i ? '1' : undefined}>
              <button
                type="button"
                onClick={() => scrollToFlightStep(step.target)}
                aria-current={activeStep === i ? 'step' : undefined}
              >
                <span className="wp-n">{step.num}</span>
                <span className="wp-l">{step.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="m-flight__scroll">
        <header className="m-flight__nose" id="flight-intro">
          <p className="m-flight__eyebrow">Owner portals on real books</p>
          <h1 className="m-flight__hero-h">Your accountant has the month. You need today.</h1>
          <p className="m-flight__hero-lead">
            Register, vendors, jobs — synced nightly into a login that looks like your business, not a template.
          </p>
          <button type="button" className="m-flight__go" onClick={scrollDemos}>
            Walk a sample
          </button>
          <button type="button" className="m-flight__go m-flight__go--ghost" onClick={scrollContact}>
            Tell me what you run
          </button>
          <p className="m-flight__scroll-cue" aria-hidden="true">
            <span>Scroll</span>
          </p>
        </header>

        <div className="m-flight__lane m-flight__lane--left" id="flight-books">
          <FlightCard id="books">
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
          </FlightCard>
        </div>

        <div className="m-flight__lane m-flight__lane--right" id="flight-portal">
          <FlightCard id="portal">
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
          </FlightCard>
        </div>

        <div className="m-flight__lane m-flight__lane--left" id="flight-samples">
          <FlightCard id="samples">
            <div className="c-eyebrow">
              Samples <i aria-hidden="true" />
            </div>
            <h2>Open a sample — no login</h2>
            <p className="lead">Fictitious companies. Real layouts. Pick one that feels close.</p>
            <ChocolateBarCaption strip={false}>Tap a bar</ChocolateBarCaption>
            <div className="jk-choc-stack" style={{ gap: 12 }}>
              {HERO_SAMPLE_BARS.map((p) => (
                <ChocolateBarLink
                  key={p.href}
                  href={p.href}
                  name={p.name}
                  industry={p.industry}
                />
              ))}
            </div>
          </FlightCard>
        </div>

        <div className="m-flight__lane m-flight__lane--right" id="flight-demos">
          <FlightCard id="demos" className="m-flight-card--demos">
            <div className="c-eyebrow">
              Gallery <i aria-hidden="true" />
            </div>
            <h2>Walk someone else&rsquo;s week</h2>
            <p className="lead">If one question sticks in your head, we&rsquo;re done.</p>
            <div className="jk-choc-grid jk-choc-grid--home">
              {HOME_DEMOS.map((d) => (
                <DemoGalleryCard
                  key={d.src}
                  href={d.src}
                  biz={d.biz || d.label}
                  industry={d.label}
                />
              ))}
            </div>
            <button
              type="button"
              className="m-flight__go"
              style={{ marginTop: '1.25rem', width: '100%' }}
              onClick={() => router.push('/demos')}
            >
              All samples
            </button>
          </FlightCard>
        </div>

        <div className="m-flight__lane m-flight__lane--left" id="flight-how">
          <FlightCard id="how">
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
              className="m-flight__go m-flight__go--ghost"
              style={{ color: '#1a222c', borderColor: 'rgba(16,24,32,0.2)' }}
              onClick={() => router.push('/how-it-works')}
            >
              Full timeline
            </button>
          </FlightCard>
        </div>

        <div className="m-flight__lane m-flight__lane--right" id="contact">
          <FlightCard id="contact" className="m-flight-card--form">
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
          </FlightCard>
        </div>
      </div>
    </div>
  )
}

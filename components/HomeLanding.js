import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { FEATURED_DEMOS } from '../lib/marketingDemos'
import { ALL_DEMOS } from '../lib/industryDemos'
import { HERO_SAMPLE_BARS } from '../lib/samplePortals'
import { FUN_CHAPTERS, scrollToChapter } from '../lib/funChapters'
import { useFunCardReveal } from '../lib/useFunCardReveal'
import DemoGalleryCard from './DemoGalleryCard'

const HOME_DEMOS = [
  FEATURED_DEMOS[0],
  FEATURED_DEMOS[1],
  FEATURED_DEMOS[5],
  FEATURED_DEMOS[4],
  FEATURED_DEMOS[3],
  FEATURED_DEMOS[8],
].filter(Boolean)

const MARQUEE = [
  'QuickBooks',
  'Nightly sync',
  'Your register',
  'Your vendors',
  'One login',
  'Real close',
  'Six-day build',
  'No template',
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

function demoMeta(href) {
  const featured = FEATURED_DEMOS.find((d) => d.src === href)
  if (featured) {
    return { emoji: featured.emoji, accent: featured.accent }
  }
  const row = ALL_DEMOS.find((d) => d.href === href)
  return { emoji: row?.emoji || '✦', accent: '#c9a84c' }
}

function FunCard({ id, className = '', children }) {
  return (
    <article className={`m-fun-card${className ? ` ${className}` : ''}`} data-fun-card={id}>
      <div className="m-fun-card__fly">{children}</div>
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
  const [activeChapter, setActiveChapter] = useState(0)
  useFunCardReveal(rootRef)

  useEffect(() => {
    const onScroll = () => {
      const focal = window.scrollY + window.innerHeight * 0.35
      let best = 0
      let bestDist = Infinity
      FUN_CHAPTERS.forEach((ch, i) => {
        const el = document.getElementById(ch.target)
        if (!el) return
        const top = el.getBoundingClientRect().top + window.scrollY
        const d = Math.abs(focal - top)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
      setActiveChapter(best)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const marqueeItems = [...MARQUEE, ...MARQUEE]

  return (
    <div ref={rootRef} className="m-fun">
      <div className="m-fun__marquee" aria-hidden="true">
        <div className="m-fun__marquee-track">
          {marqueeItems.map((t, i) => (
            <span key={`${t}-${i}`}>{t}</span>
          ))}
        </div>
      </div>

      <div className="m-fun__main">
        <header className="m-fun__hero" id="top">
          <span className="m-fun__sticker">Real books · custom login</span>
          <p className="m-fun__mark" aria-hidden="true">
            JK<span className="m-fun__mark-dot">.</span>
          </p>
          <h1 className="m-fun__h1">
            Your accountant has
            <span className="m-fun__h1-pop">the month</span>
            You need today.
          </h1>
          <p className="m-fun__lead">
            Margin while the week is still open — then a close that ties to QuickBooks. Built for owners who are done rebuilding the same screen every Monday.
          </p>
          <div className="m-fun__hero-actions">
            <button
              type="button"
              className="m-fun__btn m-fun__btn--primary"
              onClick={() => scrollToChapter('samples')}
            >
              Open a sample
            </button>
            <button
              type="button"
              className="m-fun__btn m-fun__btn--ghost"
              onClick={() => scrollToChapter('contact')}
            >
              Start a build
            </button>
          </div>
        </header>

        <div className="m-fun__lane m-fun__lane--left" id="books">
          <FunCard id="books">
            <p className="m-fun-card__kicker">Books</p>
            <h2>QuickBooks stays the boss</h2>
            <p className="lead">
              Nightly sync mirrors your chart and GL. Statements win arguments — not a spreadsheet rebuild.
            </p>
            <ul className="checks">
              <li>P&amp;L and balance sheet, trailing two years</li>
              <li>GL detail for recon and close</li>
              <li>One Intuit connection per company</li>
            </ul>
          </FunCard>
        </div>

        <div className="m-fun__lane m-fun__lane--right" id="portal">
          <FunCard id="portal">
            <p className="m-fun-card__kicker">Portal</p>
            <h2>Looks like your shop</h2>
            <p className="lead">
              Your name on sign-in, your colors on the nav. One login, one company — never someone else&rsquo;s template.
            </p>
            <ul className="checks">
              <li>Live week vs closed month, labeled honestly</li>
              <li>Integrations for register, vendors, jobs</li>
              <li>Built in about six days after kickoff</li>
            </ul>
          </FunCard>
        </div>

        <div className="m-fun__lane m-fun__lane--left" id="samples">
          <FunCard id="samples">
            <p className="m-fun-card__kicker">Samples</p>
            <h2>Try a fictitious shop</h2>
            <p className="lead">No login. Pick a door — if one screen sticks, that&rsquo;s the meeting.</p>
            <div className="m-fun-doors">
              {HERO_SAMPLE_BARS.map((p) => {
                const meta = demoMeta(p.href)
                return (
                  <DemoGalleryCard
                    key={p.href}
                    variant="fun"
                    href={p.href}
                    biz={p.name}
                    industry={p.industry}
                    emoji={meta.emoji}
                    accent={meta.accent}
                  />
                )
              })}
            </div>
          </FunCard>
        </div>

        <div className="m-fun__lane m-fun__lane--right" id="demos">
          <FunCard id="demos">
            <p className="m-fun-card__kicker">Gallery</p>
            <h2>More doors</h2>
            <p className="lead">Tires, roofs, gowns, imports — same pipe, different screens.</p>
            <div className="m-fun-doors m-fun-doors--grid">
              {HOME_DEMOS.map((d) => {
                const meta = demoMeta(d.src)
                return (
                  <DemoGalleryCard
                    key={d.src}
                    variant="fun"
                    href={d.src}
                    biz={d.biz || d.label}
                    industry={d.label}
                    emoji={meta.emoji}
                    accent={meta.accent}
                    compact
                  />
                )
              })}
            </div>
            <button
              type="button"
              className="m-fun__btn m-fun__btn--primary"
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={() => router.push('/demos')}
            >
              All samples
            </button>
          </FunCard>
        </div>

        <div className="m-fun__lane m-fun__lane--left" id="how">
          <FunCard id="how">
            <p className="m-fun-card__kicker">Ship</p>
            <h2>Kickoff → login in ~6 days</h2>
            <ol className="steps">
              <li>Tell me what you run and what&rsquo;s in QuickBooks already.</li>
              <li>I wire sync and your portal shell.</li>
              <li>You click around on real GL — not slides.</li>
              <li>We tune until close and your must-have screen match.</li>
            </ol>
            <button
              type="button"
              className="m-fun__btn m-fun__btn--ghost"
              style={{ marginTop: '0.5rem', width: '100%' }}
              onClick={() => router.push('/how-it-works')}
            >
              Full timeline
            </button>
          </FunCard>
        </div>

        <div className="m-fun__lane m-fun__lane--right" id="contact">
          <FunCard id="contact" className="m-fun-card--form">
            <p className="m-fun-card__kicker">Start</p>
            <h2>What&rsquo;s the one screen you keep rebuilding?</h2>
            <p className="lead">
              I&rsquo;ll point you at the closest sample — or{' '}
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#8c6b25', fontWeight: 600 }}>
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
          </FunCard>
        </div>
      </div>

      <nav className="m-fun-chapters" aria-label="Page sections">
        <ul className="m-fun-chapters__list">
          {FUN_CHAPTERS.map((ch, i) => (
            <li key={ch.id}>
              <button
                type="button"
                className={activeChapter === i ? 'is-on' : undefined}
                onClick={() => scrollToChapter(ch.target)}
              >
                {ch.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

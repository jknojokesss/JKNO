import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'
import { BUILD_STACK } from '../lib/buildStack'
import { FEATURED_DEMOS } from '../lib/marketingDemos'

const ROTATE = ['margin', 'profit', 'inventory', 'cash flow', 'job cost', 'rent roll']

const NAV = [
  { id: 'overview', label: 'Overview', kicker: 'Your portal' },
  { id: 'build', label: 'What we build', kicker: 'Capabilities' },
  { id: 'how', label: 'How it works', kicker: 'Process' },
  { id: 'demos', label: 'Demos', kicker: 'See it live' },
  { id: 'about', label: 'About', kicker: 'Who we are' },
  { id: 'contact', label: 'Get started', kicker: 'Contact' },
]

const STEPS = [
  { n: '01', title: 'We learn your business', body: 'One call. How you get paid, what you sell, what you wish you could see on one screen.' },
  { n: '02', title: 'We wire your systems', body: 'QuickBooks, register, vendors, bank — integrations we wrote, on a nightly schedule.' },
  { n: '03', title: 'You get one portal', body: 'Custom dashboard. Not a template. Log in any time. Numbers stay current.' },
]

const FLOW = ['QuickBooks', 'Register', 'Distributors', 'Bank', 'Your portal']

const TIMELINE = [
  ['Day 1', 'Kickoff call — we learn your business and what you want to see.'],
  ['Days 2–5', 'We build your portal and wire the integrations.'],
  ['Day 6', 'Review, tweaks, go live.'],
  ['Ongoing', 'Books updated every month. Portal stays current.'],
]

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

function OverviewRotator() {
  const [i, setI] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const id = window.setInterval(() => {
      setVisible(false)
      window.setTimeout(() => {
        setI((n) => (n + 1) % ROTATE.length)
        setVisible(true)
      }, 220)
    }, 2800)
    return () => window.clearInterval(id)
  }, [])

  return (
    <h2 className="hp-spotlight__title">
      Your{' '}
      <span className={`hp-spotlight__word${visible ? ' is-in' : ' is-out'}`}>{ROTATE[i]}</span>
      <br />on one screen.
    </h2>
  )
}

function ScreenFooter({ onNav, showDemos }) {
  return (
    <footer className="hp-foot">
      <button type="button" className="hp-btn hp-btn--primary" onClick={() => onNav('contact')}>
        Get started
      </button>
      <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hp-btn hp-btn--ghost">
        Book a call
      </a>
      {showDemos && (
        <button type="button" className="hp-btn hp-btn--ghost" onClick={() => onNav('demos')}>
          Browse demos
        </button>
      )}
    </footer>
  )
}

function Screen({ tab, form, setForm, onSubmit, submitted, submitting, onNav }) {
  if (tab === 'overview') {
    return (
      <div className="hp-overview">
        <section className="hp-spotlight">
          <p className="hp-spotlight__kicker">Custom financial portal</p>
          <OverviewRotator />
          <p className="hp-spotlight__sub">
            QuickBooks wired to your register, distributors, and vendors — updated every night.
          </p>
          <div className="hp-actions hp-actions--light">
            <button type="button" className="hp-btn hp-btn--primary" onClick={() => onNav('contact')}>
              Get started
            </button>
            <button type="button" className="hp-btn hp-btn--light" onClick={() => onNav('demos')}>
              Browse demos
            </button>
          </div>
        </section>

        <div className="hp-flow" aria-label="Systems we connect">
          {FLOW.map((node, idx) => (
            <span key={node} className="hp-flow__seg">
              <span className="hp-flow__node">{node}</span>
              {idx < FLOW.length - 1 && <span className="hp-flow__arrow" aria-hidden="true">→</span>}
            </span>
          ))}
        </div>

        <p className="hp-manifest">
          Not Zapier. Not a template. One portal built for your business — numbers that tie out to QuickBooks.
        </p>

        <nav className="hp-jump" aria-label="Explore">
          {NAV.filter((n) => n.id !== 'overview' && n.id !== 'contact').map((n) => (
            <button key={n.id} type="button" className="hp-jump__btn" onClick={() => onNav(n.id)}>
              {n.label} →
            </button>
          ))}
        </nav>
      </div>
    )
  }

  if (tab === 'build') {
    return (
      <div className="hp-page">
        <p className="hp-page-lead">
          Everything here is built custom for one business. No template, no settings screen to learn.
        </p>

        <nav className="hp-build-nav" aria-label="Sections">
          {BUILD_STACK.map((col) => (
            <a key={col.kicker} href={`#${slug(col.kicker)}`} className="hp-build-nav__a">
              {col.kicker}
            </a>
          ))}
        </nav>

        <div className="hp-stack">
          {BUILD_STACK.map((col) => (
            <section key={col.title} id={slug(col.kicker)} className="hp-build">
              <div className="hp-build__head">
                <span className="hp-kicker">{col.kicker}</span>
                <h2 className="hp-build__title">{col.title}</h2>
                <p className="hp-build__blurb">{col.blurb}</p>
              </div>
              <ul className="hp-item-list">
                {col.items.map((it) => (
                  <li key={it.t} className="hp-item">
                    {it.href ? (
                      <a href={it.href} className="hp-item__link">
                        <span className="hp-item__t">{it.t}</span>
                        <span className="hp-item__d">{it.d}</span>
                        <span className="hp-item__go" aria-hidden="true">→</span>
                      </a>
                    ) : (
                      <>
                        <span className="hp-item__t">{it.t}</span>
                        <span className="hp-item__d">{it.d}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <ScreenFooter onNav={onNav} showDemos />
      </div>
    )
  }

  if (tab === 'how') {
    return (
      <div className="hp-page">
        <section className="hp-spotlight hp-spotlight--compact">
          <p className="hp-spotlight__kicker">How it works</p>
          <h2 className="hp-spotlight__title hp-spotlight__title--sm">
            Messy books in.<br />Clear numbers out.
          </h2>
          <p className="hp-spotlight__sub">Three steps. Six days to launch. Then your portal stays current every month.</p>
        </section>

        <ol className="hp-timeline">
          {STEPS.map((s) => (
            <li key={s.n} className="hp-timeline__step">
              <span className="hp-timeline__n">{s.n}</span>
              <div>
                <h3 className="hp-timeline__title">{s.title}</h3>
                <p className="hp-timeline__body">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="hp-build">
          <div className="hp-build__head">
            <span className="hp-kicker">Launch schedule</span>
            <h2 className="hp-build__title">Six days to go live</h2>
          </div>
          <ul className="hp-item-list hp-item-list--compact">
            {TIMELINE.map(([when, what]) => (
              <li key={when} className="hp-item">
                <span className="hp-item__t hp-mono">{when}</span>
                <span className="hp-item__d">{what}</span>
              </li>
            ))}
          </ul>
        </section>

        <ScreenFooter onNav={onNav} />
      </div>
    )
  }

  if (tab === 'demos') {
    return (
      <div className="hp-page">
        <p className="hp-page-lead">
          {FEATURED_DEMOS.length} sample portals — fictitious businesses, real product ideas. Click in, no login.
        </p>

        <div className="hp-demo-list">
          {FEATURED_DEMOS.map((d) => (
            <a key={d.src} href={d.src} className="hp-demo-row">
              <span className="hp-demo-row__label">{d.label}</span>
              <span className="hp-demo-row__cap">{d.caption}</span>
              <span className="hp-demo-row__go" aria-hidden="true">→</span>
            </a>
          ))}
        </div>

        <ScreenFooter onNav={onNav} />
      </div>
    )
  }

  if (tab === 'about') {
    return (
      <div className="hp-page">
        <section className="hp-spotlight hp-spotlight--compact hp-spotlight--founder">
          <div className="hp-founder__photo">
            <img src="/1779727210800.jpg" alt="Jonathan Katz" width={72} height={72} />
          </div>
          <div>
            <div className="hp-founder__name">Jonathan (Chaim) Katz</div>
            <div className="hp-founder__role">Founder · JK No Jokes Financials</div>
          </div>
        </section>

        <div className="hp-split">
          <div className="hp-prose">
            <h2 className="hp-prose__title">We write the software and keep the books</h2>
            <p className="hp-body">
              Small shop. Custom portals wired to QuickBooks, your register, your distributors —
              whatever your business actually runs on.
            </p>
            <p className="hp-body">
              We work with owners who are tired of flying blind — who know something is off
              but can&rsquo;t see it in a pile of spreadsheets or a QuickBooks report that makes no sense.
            </p>
            <p className="hp-body">Our job is to make your numbers clear, your reporting automatic, and your books something you actually look at.</p>
          </div>
          <ul className="hp-checklist">
            {[
              'One point of contact — the person who built your portal',
              'Your own login, scoped to your company on the server',
              'Integrations we wrote ourselves, not a Zapier chain',
              'Nothing goes live until it ties out to QuickBooks',
            ].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <ScreenFooter onNav={onNav} showDemos />
      </div>
    )
  }

  return (
    <div id="contact" className="hp-page hp-contact">
      <div className="hp-contact__grid">
        <section className="hp-spotlight hp-spotlight--compact">
          <p className="hp-spotlight__kicker">Get started</p>
          <h2 className="hp-spotlight__title hp-spotlight__title--sm">
            What would you want<br />built first?
          </h2>
          <p className="hp-spotlight__sub">
            Tell us what you run today — register, vendors, job cost, inventory, AR.
            We&rsquo;ll show you what we&rsquo;d wire up on one screen.
          </p>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hp-spotlight__link">
            Or book a 30-min call →
          </a>
        </section>

        <div className="hp-contact__form">
          {submitted ? (
            <div className="hp-get__done">We&rsquo;ll be in touch.</div>
          ) : (
            <>
              {[
                { key: 'name', label: 'Your name', placeholder: 'John Smith' },
                { key: 'email', label: 'Email', placeholder: 'you@company.com' },
                { key: 'business', label: 'Business name', placeholder: 'Acme Corp' },
              ].map(({ key, label, placeholder }) => (
                <label key={key} className="hp-field">
                  <span>{label}</span>
                  <input
                    type={key === 'email' ? 'email' : 'text'}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </label>
              ))}
              <button
                type="button"
                className="hp-get__submit"
                onClick={onSubmit}
                disabled={submitting || !form.name || !form.email || !form.business}
              >
                {submitting ? 'Sending…' : 'Send message'}
              </button>
              <p className="hp-get__alt">
                Or <a href="mailto:jk@jknojokes.com">jk@jknojokes.com</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HomePortal({ live, form, setForm, onSubmit, submitted, submitting }) {
  const router = useRouter()
  const [tab, setTab] = useState('overview')

  const pick = (id) => {
    setTab(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`hp-portal${live ? ' hp-portal--live' : ''}`}>
      <header className="hp-topbar">
        <div className="hp-topbar__brand">
          <span className="hp-topbar__jk">JK<span>.</span></span>
          <span className="hp-topbar__name">NO JOKES</span>
          <span className="hp-topbar__fin">Financials</span>
        </div>
        <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hp-topbar__cta">
          Book a call
        </a>
      </header>

      <div className="hp-mobilenav">
        {NAV.map((n) => (
          <button key={n.id} type="button" className={tab === n.id ? 'is-on' : ''} onClick={() => pick(n.id)}>
            {n.label}
          </button>
        ))}
      </div>

      <div className="hp-shell">
        <aside className="hp-side">
          <div className="hp-brand">
            <div className="hp-brand__label">Menu</div>
          </div>

          <nav className="hp-nav" aria-label="Site">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`hp-navbtn${tab === n.id ? ' is-on' : ''}${n.id === 'contact' ? ' hp-navbtn--cta' : ''}`}
                onClick={() => pick(n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="hp-sidefoot">
            <button type="button" className="hp-sidefoot__link" onClick={() => router.push('/login')}>Log in</button>
            <button type="button" className="hp-sidefoot__link" onClick={() => router.push('/privacy')}>Privacy</button>
            <button type="button" className="hp-sidefoot__link" onClick={() => router.push('/terms')}>Terms</button>
            <div className="hp-sidefoot__tag">Built in Jersey. No jokes.</div>
          </div>
        </aside>

        <main className={`hp-main${tab === 'overview' ? ' hp-main--overview' : ''}`}>
          <div key={tab} className="hp-screen">
            <Screen
              tab={tab}
              form={form}
              setForm={setForm}
              onSubmit={onSubmit}
              submitted={submitted}
              submitting={submitting}
              onNav={pick}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

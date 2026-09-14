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

const WIRED = [
  ['QuickBooks Online', 'P&L, balance sheet, GL detail, JE pushback'],
  ['POS register', 'Tickets, line items, payment mix'],
  ['Distributor portal', 'Unit cost, PO#, stock vs same-day'],
  ['Bank & card', 'Classified to your chart of accounts'],
]

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
    <h2 className="hp-hero__title">
      Your{' '}
      <span className={`hp-hero__word${visible ? ' is-in' : ' is-out'}`}>{ROTATE[i]}</span>
      {' '}— on one screen.
    </h2>
  )
}

function Screen({ tab, form, setForm, onSubmit, submitted, submitting, onNav }) {
  if (tab === 'overview') {
    return (
      <>
        <div className="hp-hero">
          <OverviewRotator />
          <p className="hp-hero__sub">
            QuickBooks wired to your register, distributors, and vendors — updated every night.
            We build this custom for your shop, contractor, wholesaler, or whatever you run.
          </p>
        </div>

        <div className="hp-syncbar">
          <span className="hp-syncbar__dot" aria-hidden="true" />
          <span className="hp-syncbar__text">Nightly sync · last run 2:14 AM</span>
        </div>

        <div className="hp-card">
          <div className="hp-card__head">
            <h2 className="hp-card__title">What we wire up</h2>
            <span className="hp-card__meta">Your systems → one portal</span>
          </div>
          <table className="hp-table">
            <thead>
              <tr><th>Source</th><th>Pulls</th><th className="hp-num">Status</th></tr>
            </thead>
            <tbody>
              {WIRED.map(([src, pulls]) => (
                <tr key={src}>
                  <td className="hp-feature-name">{src}</td>
                  <td className="hp-feature-desc">{pulls}</td>
                  <td className="hp-num hp-mono hp-good">ok</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="hp-actions">
          <button type="button" className="hp-btn hp-btn--primary" onClick={() => onNav('contact')}>
            Get started
          </button>
          <button type="button" className="hp-btn hp-btn--ghost" onClick={() => onNav('demos')}>
            Browse demos
          </button>
        </div>
      </>
    )
  }

  if (tab === 'build') {
    return (
      <div className="hp-stack">
        {BUILD_STACK.map((col) => (
          <div key={col.title} className="hp-card">
            <div className="hp-card__head">
              <div>
                <div className="hp-kicker">{col.kicker}</div>
                <h2 className="hp-card__title">{col.title}</h2>
              </div>
            </div>
            <p className="hp-card__blurb">{col.blurb}</p>
            <table className="hp-table">
              <tbody>
                {col.items.map((it) => (
                  <tr key={it.t}>
                    <td className="hp-feature-name">{it.t}</td>
                    <td className="hp-feature-desc">{it.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    )
  }

  if (tab === 'how') {
    return (
      <>
        <div className="hp-step-row">
          {STEPS.map((s) => (
            <div key={s.n} className="hp-card hp-card--step">
              <div className="hp-step-n">{s.n}</div>
              <h3 className="hp-step-title">{s.title}</h3>
              <p className="hp-body">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="hp-card">
          <div className="hp-card__head"><h2 className="hp-card__title">Six days to launch</h2></div>
          <table className="hp-table">
            <tbody>
              {[
                ['Day 1', 'Kickoff call — we learn your business and what you want to see.'],
                ['Days 2–5', 'We build your portal and wire the integrations.'],
                ['Day 6', 'Review, tweaks, go live.'],
                ['Ongoing', 'Books updated every month. Portal stays current.'],
              ].map(([when, what]) => (
                <tr key={when}>
                  <td className="hp-mono hp-when">{when}</td>
                  <td>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="hp-actions">
          <button type="button" className="hp-btn hp-btn--primary" onClick={() => onNav('contact')}>Get started</button>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hp-btn hp-btn--ghost">Book a call</a>
        </div>
      </>
    )
  }

  if (tab === 'demos') {
    return (
      <>
        <p className="hp-body hp-body--top">Click into a sample portal — fictitious businesses, real product ideas.</p>
        <div className="hp-card">
          <table className="hp-table">
            <thead>
              <tr><th>Industry</th><th>What it shows</th><th /></tr>
            </thead>
            <tbody>
              {FEATURED_DEMOS.map((d) => (
                <tr key={d.src}>
                  <td className="hp-feature-name">{d.label}</td>
                  <td className="hp-feature-desc">{d.caption}</td>
                  <td className="hp-num">
                    <a href={d.src} className="hp-link">Open →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hp-body">
          <button type="button" className="hp-link-btn" onClick={() => onNav('contact')}>Want one built for your business?</button>
        </p>
      </>
    )
  }

  if (tab === 'about') {
    return (
      <>
        <div className="hp-founder">
          <div className="hp-founder__photo">
            <img src="/1779727210800.jpg" alt="Jonathan Katz" width={88} height={88} />
          </div>
          <div>
            <div className="hp-founder__name">Jonathan (Chaim) Katz</div>
            <div className="hp-founder__role">Founder</div>
          </div>
        </div>
        <div className="hp-split">
        <div className="hp-card">
          <div className="hp-card__head"><h2 className="hp-card__title">We write the software and keep the books</h2></div>
          <div className="hp-card__body">
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
        </div>
        <div className="hp-card">
          <div className="hp-card__head"><h2 className="hp-card__title">What you get</h2></div>
          <ul className="hp-bullets">
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
        </div>
      </>
    )
  }

  return (
    <div id="contact" className="hp-get">
      <div className="hp-get__copy">
        <h2 className="hp-get__title">What would you want built first?</h2>
        <p className="hp-get__lead">
          Tell us what you run today. We&rsquo;ll show you what we&rsquo;d wire up — register, vendors, job cost, inventory, AR, whatever you need on one screen.
        </p>
        <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hp-get__book">Or book a 30-min call →</a>
      </div>
      <div className="hp-get__form">
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
  )
}

export default function HomePortal({ live, form, setForm, onSubmit, submitted, submitting }) {
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const active = NAV.find((n) => n.id === tab)

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
            <div className="hp-brand__jk">JK<span>.</span></div>
            <div className="hp-brand__sub">Your financial portal</div>
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

        <main className="hp-main">
          <header className="hp-top">
            <div>
              <div className="hp-top__month">{active?.kicker}</div>
              <h1 className="hp-top__title">{active?.label}</h1>
            </div>
          </header>

          <Screen
            tab={tab}
            form={form}
            setForm={setForm}
            onSubmit={onSubmit}
            submitted={submitted}
            submitting={submitting}
            onNav={pick}
          />
        </main>
      </div>
    </div>
  )
}

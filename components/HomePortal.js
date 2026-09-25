import { useState, useEffect, useRef } from 'react'

import { useRouter } from 'next/router'

import { BOOKING_URL } from '../lib/marketing'

import { BUILD_STACK } from '../lib/buildStack'

import { FEATURED_DEMOS } from '../lib/marketingDemos'



const NAV = [

  { id: 'overview', label: 'Overview' },

  { id: 'build', label: 'What we build' },

  { id: 'how', label: 'How it works' },

  { id: 'demos', label: 'Demos' },

  { id: 'about', label: 'About' },

  { id: 'contact', label: 'Get started' },

]

/** Mobile: high-intent tabs first; Get started is pinned outside the scroll row. */
const MOBILE_NAV = [

  { id: 'overview', label: 'Overview' },

  { id: 'demos', label: 'Demos' },

  { id: 'about', label: 'About' },

  { id: 'build', label: 'Build' },

  { id: 'how', label: 'How' },

]



const HOW = [

  { title: 'Kickoff call', body: 'Thirty minutes. How you get paid, what you sell, what has to land on one screen.' },

  { title: 'Wire-up', body: 'QuickBooks, register, vendors, bank, whatever you run on. I write the integrations; they sync every night.' },

  { title: 'Go live', body: 'About six days. You log in, we walk it, fix what\u2019s off. Nothing ships until it matches QuickBooks.' },

]



const LIVE_PROOF = [

  { k: 'Live stack', v: 'QuickBooks, your register, and vendor invoices on one nightly sync.' },

  { k: 'What you get', v: 'Profit per ticket or job on screen. Month-end tied to the official QBO statements.' },

  { k: 'Timeline', v: 'About six business days from kickoff call to your login.' },

]



const NEXT_STEPS = [

  { n: '1', title: 'You reach out', body: 'Short form or a 30-minute call. Tell me what you run and what you keep rebuilding in Excel.' },

  { n: '2', title: 'I wire your shop', body: 'Connect QuickBooks, build the integrations, and put your screens in this portal shell.' },

  { n: '3', title: 'You sign in', body: 'We walk it together. Nothing stays live until the portal matches QuickBooks.' },

]



const OVERVIEW_DEMO_PICKS = FEATURED_DEMOS.slice(0, 3)

const TIRE_DEMO = FEATURED_DEMOS[0]



const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')



function PageHero({ title, lead, tone, children }) {

  return (

    <header className={`hp-page-hero hp-anim-sweep${tone ? ` hp-page-hero--${tone}` : ''}`}>

      {children || (

        <>

          <h2 className="hp-page-hero__title hp-anim hp-anim--hero">{title}</h2>

          {lead && <p className="hp-page-hero__lead hp-anim hp-anim--in hp-anim--d1">{lead}</p>}

        </>

      )}

    </header>

  )

}



function Stagger({ className = '', alt = false, children }) {

  return (

    <div className={`hp-stagger${alt ? ' hp-stagger--alt' : ''}${className ? ` ${className}` : ''}`}>

      {children}

    </div>

  )

}



function ProofStrip() {

  return (

    <section className="hp-proof" aria-label="What clients get">

      {LIVE_PROOF.map((row) => (

        <div key={row.k} className="hp-proof__item">

          <p className="hp-proof__k">{row.k}</p>

          <p className="hp-proof__v">{row.v}</p>

        </div>

      ))}

    </section>

  )

}



function TireHeroLead() {
  return (
    <a href={TIRE_DEMO.src} className="hp-tire-lead">
      <span className="hp-tire-lead__tag">Sample tire &amp; auto shop</span>
      <span className="hp-tire-lead__title">{TIRE_DEMO.caption}</span>
      <span className="hp-tire-lead__go">Open demo →</span>
    </a>
  )
}

function DemoQuickPicks({ onNav }) {

  return (

    <section className="hp-demo-picks" aria-labelledby="hp-demo-picks-title">

      <div className="hp-demo-picks__head">

        <h2 id="hp-demo-picks-title" className="hp-demo-picks__title">Pick a trade. Click through.</h2>

        <button type="button" className="hp-demo-picks__all" onClick={() => onNav('demos')}>

          All demos

        </button>

      </div>

      <div className="hp-demo-picks__grid">

        {OVERVIEW_DEMO_PICKS.map((d) => (

          <a key={d.src} href={d.src} className="hp-demo-pick">

            <span className="hp-demo-pick__label">{d.label}</span>

            <span className="hp-demo-pick__cap">{d.caption}</span>

            <span className="hp-demo-pick__go" aria-hidden="true">→</span>

          </a>

        ))}

      </div>

    </section>

  )

}



function NextSteps() {

  return (

    <section className="hp-next" aria-labelledby="hp-next-title">

      <h2 id="hp-next-title" className="hp-next__title">What happens after you reach out</h2>

      <ol className="hp-next__steps">

        {NEXT_STEPS.map((s) => (

          <li key={s.n} className="hp-next__step">

            <span className="hp-next__n">{s.n}</span>

            <div>

              <h3 className="hp-next__step-t">{s.title}</h3>

              <p className="hp-next__step-d">{s.body}</p>

            </div>

          </li>

        ))}

      </ol>

    </section>

  )

}



function PricingNote() {

  return (

    <p className="hp-pricing-note">

      Not $49/mo shelf software. Custom portal and books for your shop — you work with me directly.

    </p>

  )

}



function FounderStrip({ onNav }) {

  return (

    <button type="button" className="hp-founder-strip" onClick={() => onNav('about')}>

      <img className="hp-founder-strip__img" src="/1779727210800.jpg" alt="" width={56} height={56} />

      <div className="hp-founder-strip__copy">

        <p className="hp-founder-strip__name">Jonathan (Chaim) Katz</p>

        <p className="hp-founder-strip__role">I build the portal, write the integrations, and keep the books.</p>

      </div>

      <span className="hp-founder-strip__go" aria-hidden="true">About →</span>

    </button>

  )

}



function ScreenFooter({ onNav }) {

  return (

    <footer className="hp-foot hp-anim hp-anim--up hp-anim--d6">

      <button type="button" className="hp-btn hp-btn--primary" onClick={() => onNav('contact')}>

        Get started

      </button>

      <p className="hp-foot__alt">

        or <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">book a call</a>

      </p>

    </footer>

  )

}



function Screen({ tab, form, setForm, onSubmit, submitted, submitting, onNav }) {

  if (tab === 'overview') {

    const pillars = [BUILD_STACK[0], BUILD_STACK[1], BUILD_STACK[3]]



    return (

      <div className="hp-overview">

        <header className="hp-overview__hero hp-anim-sweep">

          <h1 className="hp-overview__headline">
            <span className="hp-overview__headline-line hp-anim hp-anim--hero">One portal. Your systems.</span>
            <span className="hp-overview__headline-accent hp-anim hp-anim--hero hp-anim--d1">Numbers that tie out.</span>
          </h1>

          <TireHeroLead />

          <p className="hp-overview__deck hp-anim hp-anim--in hp-anim--d2">
            QuickBooks and your register on a nightly sync. Month-end tied to the official QBO
            statements — built in this portal shell for your shop.
          </p>

          <div className="hp-overview__cta">

            <div className="hp-overview__actions">

              <a href={TIRE_DEMO.src} className="hp-btn hp-btn--primary hp-only-mobile">

                Open tire shop demo

              </a>

              <button type="button" className="hp-btn hp-btn--primary hp-only-desktop" onClick={() => onNav('contact')}>

                Get started

              </button>

              <button type="button" className="hp-overview__link" onClick={() => onNav('demos')}>

                All sample portals

              </button>

            </div>

            <p className="hp-hero-next">

              30-min call → connect QuickBooks → about six days to your login.

            </p>

          </div>

        </header>



        <DemoQuickPicks onNav={onNav} />



        <ProofStrip />



        <div className="hp-overview__pillars hp-stagger">

          {pillars.map((block, i) => (

            <section key={block.title} className={`hp-overview__pillar hp-overview__pillar--${i}`}>

              <h3 className="hp-overview__pillar-t">{block.title}</h3>

              <p className="hp-overview__pillar-d">{block.blurb}</p>

            </section>

          ))}

          <button type="button" className="hp-overview__more" onClick={() => onNav('build')}>

            Full capability list

          </button>

        </div>



        <FounderStrip onNav={onNav} />



        <NextSteps />



        <PricingNote />



        <ScreenFooter onNav={onNav} />

      </div>

    )

  }



  if (tab === 'build') {

    return (

      <div className="hp-page">

        <PageHero
          title="What we build"
          lead="Not a template. One business at a time: integrations, screens, and month-end for that shop."
        />



        <nav className="hp-build-nav hp-anim hp-anim--in hp-anim--d2" aria-label="Sections">

          {BUILD_STACK.map((col) => (

            <a key={col.title} href={`#${slug(col.kicker)}`} className="hp-build-nav__a">

              {col.kicker}

            </a>

          ))}

        </nav>



        <Stagger className="hp-stack">

          {BUILD_STACK.map((col, i) => (

            <section key={col.title} id={slug(col.kicker)} className={`hp-build hp-build--${i}`}>

              <div className="hp-build__head">

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

        </Stagger>



        <ScreenFooter onNav={onNav} />

      </div>

    )

  }



  if (tab === 'how') {

    return (

      <div className="hp-page">

        <PageHero
          tone="how"
          title="How it works"
          lead="Call, build, launch. About a week. After that the sync keeps running and I keep the month tied out."
        />



        <ol className="hp-timeline hp-stagger">

          {HOW.map((s, i) => (

            <li key={s.title} className="hp-timeline__step">

              <span className="hp-timeline__n">{String(i + 1).padStart(2, '0')}</span>

              <div>

                <h3 className="hp-timeline__title">{s.title}</h3>

                <p className="hp-timeline__body">{s.body}</p>

              </div>

            </li>

          ))}

        </ol>



        <ScreenFooter onNav={onNav} />

      </div>

    )

  }



  if (tab === 'demos') {

    return (

      <div className="hp-page">

        <PageHero
          tone="demos"
          title="Demos"
          lead={`${FEATURED_DEMOS.length} sample portals. Made-up businesses, real screens. Pick your trade, click in.`}
        />



        <div className="hp-demo-panel hp-anim hp-anim--up hp-anim--d2">

          <Stagger alt className="hp-demo-list">

          {FEATURED_DEMOS.map((d) => (

            <a key={d.src} href={d.src} className="hp-demo-row">

              <span className="hp-demo-row__label">{d.label}</span>

              <span className="hp-demo-row__cap">{d.caption}</span>

              <span className="hp-demo-row__go" aria-hidden="true">→</span>

            </a>

          ))}

          </Stagger>

        </div>



        <ScreenFooter onNav={onNav} />

      </div>

    )

  }



  if (tab === 'about') {

    return (

      <div className="hp-page">

        <PageHero tone="about">

          <div className="hp-founder hp-anim hp-anim--hero">

            <img className="hp-founder__img hp-anim hp-anim--scale hp-anim--d1" src="/1779727210800.jpg" alt="Jonathan Katz" width={88} height={88} />

            <div className="hp-anim hp-anim--in hp-anim--d2">

              <h2 className="hp-page-hero__title">Jonathan (Chaim) Katz</h2>

              <p className="hp-founder__role">Founder · JK No Jokes Financials</p>

            </div>

          </div>

        </PageHero>



        <div className="hp-about__body hp-anim hp-anim--up hp-anim--d3">

          <p className="hp-body">

            Small shop in Jersey. I write the integrations, build the portal, and keep the books.

          </p>

          <p className="hp-body">

            QuickBooks, register, distributor, wired on a nightly sync. One login, your company only.

          </p>

          <p className="hp-body">

            You get me, not a ticket queue. Nothing goes live until it matches QuickBooks.

          </p>

        </div>



        <ScreenFooter onNav={onNav} />

      </div>

    )

  }



  return (

    <div id="contact" className="hp-page hp-contact">

      <header className="hp-contact__head">

        <h2 className="hp-page-title hp-page-title--tight">Get started</h2>

        <p className="hp-contact__lead">

          Tell me what you run. I&rsquo;ll show you a demo in your trade and quote the build.

        </p>

      </header>



      <div className="hp-contact__form hp-contact__form--lead">

        {submitted ? (

          <div className="hp-get__done">We&rsquo;ll be in touch.</div>

        ) : (

          <>

            {[

              { key: 'name', label: 'Your name', placeholder: 'Your name' },

              { key: 'email', label: 'Email', placeholder: 'you@yourshop.com' },

              { key: 'business', label: 'Business name', placeholder: 'Your shop' },

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



      <NextSteps />



      <PricingNote />



      <p className="hp-contact__book">

        <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hp-contact__call">

          Book a 30-min call

        </a>

        {' '}

        if you prefer to talk first.

      </p>

    </div>

  )

}



export default function HomePortal({ live, enteredInstant, form, setForm, onSubmit, submitted, submitting }) {

  const router = useRouter()

  const [tab, setTab] = useState('overview')

  const [motionSettled, setMotionSettled] = useState(false)

  const navCountRef = useRef(0)



  useEffect(() => {

    if (!live) return undefined

    const t = window.setTimeout(() => setMotionSettled(true), 5000)

    return () => window.clearTimeout(t)

  }, [live])



  const pick = (id) => {

    navCountRef.current += 1

    if (navCountRef.current > 1) setMotionSettled(true)

    setTab(id)

    window.scrollTo({ top: 0, behavior: 'smooth' })

  }



  return (

    <div
      className={`hp-portal${live ? ' hp-portal--live' : ''}${enteredInstant ? ' hp-portal--instant' : ''}${motionSettled ? ' hp-portal--settled' : ''}`}
    >

      <header className="hp-topbar">

        <button type="button" className="hp-topbar__brand" onClick={() => pick('overview')} aria-label="Home">

          <span className="hp-topbar__jk">JK<span>.</span></span>

          <span className="hp-topbar__name">NO JOKES</span>

          <span className="hp-topbar__fin">Financials</span>

        </button>

        <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hp-topbar__cta">

          Book a call

        </a>

      </header>



      <div className="hp-mobilenav-bar">

        <div className="hp-mobilenav" aria-label="Site sections">

          {MOBILE_NAV.map((n) => (

            <button key={n.id} type="button" className={tab === n.id ? 'is-on' : ''} onClick={() => pick(n.id)}>

              {n.label}

            </button>

          ))}

        </div>

        <button
          type="button"
          className={`hp-mobilenav__cta${tab === 'contact' ? ' is-on' : ''}`}
          onClick={() => pick('contact')}
        >
          Get started
        </button>

      </div>



      <div className="hp-shell">

        <aside className="hp-side">

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

          {live && (

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

          )}

        </main>

      </div>

    </div>

  )

}



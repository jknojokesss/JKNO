import { useState } from 'react'

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



const HOW = [

  { title: 'Kickoff call', body: 'Thirty minutes. How you get paid, what you sell, what has to land on one screen.' },

  { title: 'Wire-up', body: 'QuickBooks, register, vendors, bank, whatever you run on. I write the integrations; they sync every night.' },

  { title: 'Go live', body: 'About six days. You log in, we walk it, fix what\u2019s off. Nothing ships until it matches QuickBooks.' },

]



const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')



function PageHero({ title, lead, tone, children }) {

  return (

    <header className={`hp-page-hero${tone ? ` hp-page-hero--${tone}` : ''}`}>

      {children || (

        <>

          <h2 className="hp-page-hero__title">{title}</h2>

          {lead && <p className="hp-page-hero__lead">{lead}</p>}

        </>

      )}

    </header>

  )

}



function ScreenFooter({ onNav }) {

  return (

    <footer className="hp-foot">

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

        <header className="hp-overview__hero">

          <h1 className="hp-overview__headline">
            One portal. Your systems.<br />
            <span className="hp-overview__headline-accent">Numbers that tie out.</span>
          </h1>

          <p className="hp-overview__hook">
            You&rsquo;re already in it. Sidebar, top bar, these screens. Same shell I build
            for your shop.
          </p>

          <p className="hp-overview__deck">
            Register, vendors, QuickBooks behind one login. The screens your register and QBO
            never gave you, synced every night, tied out at month-end.
          </p>

          <div className="hp-overview__actions">

            <button type="button" className="hp-btn hp-btn--primary" onClick={() => onNav('contact')}>

              Get started

            </button>

            <button type="button" className="hp-overview__link" onClick={() => onNav('demos')}>

              See sample portals

            </button>

          </div>

        </header>



        <p className="hp-body hp-overview__note">

          Click around the nav. Demos opens sample businesses in this same shell.

          Roughly six days kickoff to live. Tire shops, contractors, wholesalers, custom retail
          on QuickBooks. That&rsquo;s usually who calls.

        </p>



        <div className="hp-overview__pillars">

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



        <nav className="hp-build-nav" aria-label="Sections">

          {BUILD_STACK.map((col) => (

            <a key={col.title} href={`#${slug(col.kicker)}`} className="hp-build-nav__a">

              {col.kicker}

            </a>

          ))}

        </nav>



        <div className="hp-stack">

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

        </div>



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



        <ol className="hp-timeline">

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



        <div className="hp-demo-panel">

          <div className="hp-demo-list">

          {FEATURED_DEMOS.map((d) => (

            <a key={d.src} href={d.src} className="hp-demo-row">

              <span className="hp-demo-row__label">{d.label}</span>

              <span className="hp-demo-row__cap">{d.caption}</span>

              <span className="hp-demo-row__go" aria-hidden="true">→</span>

            </a>

          ))}

          </div>

        </div>



        <ScreenFooter onNav={onNav} />

      </div>

    )

  }



  if (tab === 'about') {

    return (

      <div className="hp-page">

        <PageHero tone="about">

          <div className="hp-founder">

            <img className="hp-founder__img" src="/1779727210800.jpg" alt="Jonathan Katz" width={88} height={88} />

            <div>

              <h2 className="hp-page-hero__title">Jonathan (Chaim) Katz</h2>

              <p className="hp-founder__role">Founder · JK No Jokes Financials</p>

            </div>

          </div>

        </PageHero>



        <div className="hp-about__body">

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

      <PageHero
        tone="contact"
        title="Get started"
        lead="What you run today and which screen you&rsquo;re tired of rebuilding in Excel."
      />



      <div className="hp-contact__grid">

        <div className="hp-contact__copy">

          <p className="hp-body">

            Register, vendors, inventory, AR. Tell me what you run and what you need on one screen.

          </p>

          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hp-contact__call">

            Book a 30-min call

          </a>

        </div>



        <div className="hp-contact__form">

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

        <button type="button" className="hp-topbar__brand" onClick={() => pick('overview')} aria-label="Home">

          <span className="hp-topbar__jk">JK<span>.</span></span>

          <span className="hp-topbar__name">NO JOKES</span>

          <span className="hp-topbar__fin">Financials</span>

        </button>

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



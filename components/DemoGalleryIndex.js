import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { ALL_DEMOS } from '../lib/industryDemos'
import { SERVICE_PACKAGES } from '../lib/buildStack'
import {
  DEMO_TRADE_FILTERS,
  STARTER_DEMOS,
  painLineForDemo,
  tradeTagForDemo,
} from '../lib/homeSamplePains'
import DemoGalleryCard from './DemoGalleryCard'
import { BOOKING_URL } from '../lib/marketing'

export default function DemoGalleryIndex() {
  const router = useRouter()
  const [trade, setTrade] = useState('all')

  const filtered = useMemo(() => {
    if (trade === 'all') return ALL_DEMOS
    return ALL_DEMOS.filter((d) => tradeTagForDemo(d.href) === trade)
  }, [trade])

  return (
    <>
      <section
        className="m-section m-ship-intro"
        style={{ paddingTop: 'clamp(20px,3vw,32px)', paddingBottom: 'clamp(16px,2.5vw,28px)' }}
      >
        <div className="m-wrap m-ship-intro__inner">
          <p className="m-ship-hook">
            Already have a bookkeeper? <strong>Add the portal.</strong> Want books done too?{' '}
            <strong>We can do both.</strong>
          </p>
          <ul className="m-ship-chain" aria-label="How a build ships">
            <li>
              <span className="m-ship-chain__verb">Kickoff</span> 30 min — what you sell, what you want on screen
            </li>
            <li>
              <span className="m-ship-chain__verb">Build</span> connect QuickBooks + your tools, nightly sync
            </li>
            <li>
              <span className="m-ship-chain__verb">Launch</span> you sign in on real data; we tune until it clicks
            </li>
            <li>
              <span className="m-ship-chain__verb">Support</span> sync keeps running; month-end help if you want it
            </li>
          </ul>
          <p className="m-ship-intro__note">
            Typical first portal: a few weeks from kickoff to login on live data (scope-dependent). Setup is a flat quote
            after the call — many land in the <strong>$12k–$28k</strong> range depending on integrations. Ongoing support
            is optional if you keep your own bookkeeper.
          </p>
          <button
            type="button"
            className="m-ship-intro__more m-jk-text-link"
            onClick={() => router.push('/how-it-works')}
          >
            How it works
          </button>
        </div>
      </section>

      <section className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-wrap">
          <p className="m-kicker" style={{ marginBottom: 12 }}>Start here</p>
          <p className="m-about-p" style={{ marginTop: 0, marginBottom: 16, maxWidth: '42rem' }}>
            Four samples owners usually open first — each answers one money question in plain language.
          </p>
          <div className="m-demo-grid m-demo-grid--gallery">
            {STARTER_DEMOS.map((s) => {
              const row = ALL_DEMOS.find((d) => d.href === s.href)
              if (!row) return null
              return (
                <DemoGalleryCard
                  key={s.href}
                  href={s.href}
                  biz={row.biz}
                  pain={s.pain}
                  compact
                />
              )
            })}
          </div>
        </div>
      </section>

      <section className="m-section" style={{ paddingTop: 'clamp(24px,3vw,36px)' }}>
        <div className="m-wrap">
          <p className="m-kicker" style={{ marginBottom: 12 }}>Packages</p>
          <div className="m-demo-grid">
            {SERVICE_PACKAGES.map((p) => (
              <DemoGalleryCard
                key={p.title}
                href={p.href}
                biz={p.title}
                industry={p.blurb}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="m-section" style={{ paddingTop: 'clamp(32px,4vw,48px)' }}>
        <div className="m-wrap">
          <div className="m-demo-filter-bar">
            <p className="m-kicker" style={{ marginBottom: 0 }}>All samples</p>
            <div className="m-demo-filter-bar__chips" role="tablist" aria-label="Filter by trade">
              {DEMO_TRADE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={trade === f.id}
                  className={trade === f.id ? 'm-demo-filter-chip m-demo-filter-chip--on' : 'm-demo-filter-chip'}
                  onClick={() => setTrade(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="m-demo-grid m-demo-grid--gallery" style={{ marginTop: 16 }}>
            {filtered.map((d) => (
              <DemoGalleryCard
                key={d.href}
                href={d.href}
                biz={d.biz}
                pain={painLineForDemo(d.href)}
                compact
              />
            ))}
          </div>
        </div>
      </section>

      <section className="m-cta-slab">
        <div className="m-wrap m-cta-slab__inner">
          <h2 className="m-h2 m-cta-slab__title">Nothing here with your name on it?</h2>
          <p className="m-cta-slab__lead">Tell me what you sell — I&rsquo;ll point you at the closest sample or mock yours first.</p>
          <div className="m-cta-slab__actions">
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Tell me what you need</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop-dark">Book a call</a>
          </div>
        </div>
      </section>
    </>
  )
}

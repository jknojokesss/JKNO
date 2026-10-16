import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { ALL_DEMOS } from '../lib/industryDemos'
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
            You run the shop: <strong>I wire the numbers</strong> into one login you will actually open. Bookkeeper
            optional; <strong>your business, clearer every week.</strong>
          </p>
          <ul className="m-ship-chain" aria-label="How a build ships">
            <li>
              <span className="m-ship-chain__verb">Kickoff</span> 30 min: what you sell, what you want on screen
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
            Typical first portal: a few weeks from kickoff to login on live data (scope-dependent). Setup is quoted after
            the call; ongoing support is optional if you keep your own bookkeeper.
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
            Pick the question that keeps you up at night: margin, cash, who owes you. One shop or several businesses;
            each sample is a real screen layout, not a slide deck.
          </p>
          <div className="m-demo-grid m-demo-grid--gallery m-demo-grid--starters">
            {STARTER_DEMOS.map((s) => {
              const row = ALL_DEMOS.find((d) => d.href === s.href)
              if (!row) return null
              const featured = s.href === '/operations-portal'
              return (
                <DemoGalleryCard
                  key={s.href}
                  href={s.href}
                  biz={row.biz}
                  pain={s.pain || painLineForDemo(s.href)}
                  compact
                  featured={featured}
                  featuredLabel="Multi-business"
                />
              )
            })}
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
                pain={painLineForDemo(d.href) || undefined}
                compact
              />
            ))}
          </div>
        </div>
      </section>

      <section className="m-cta-slab">
        <div className="m-wrap m-cta-slab__inner">
          <h2 className="m-h2 m-cta-slab__title">Want this on your name and your data?</h2>
          <p className="m-cta-slab__lead">Describe the screen in your head. I&rsquo;ll show you the closest sample or sketch yours first.</p>
          <div className="m-cta-slab__actions">
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Tell me what you need</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop-dark">Book a call</a>
          </div>
        </div>
      </section>
    </>
  )
}

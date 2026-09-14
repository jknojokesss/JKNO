import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../components/MarketingShell'
import { BOOKING_URL } from '../lib/marketing'
import { BUILD_STACK } from '../lib/buildStack'

export default function WhatWeDo() {
  const router = useRouter()
  return (
    <MarketingShell title="What You Get — JK No Jokes Financials">
      <PageHero
        kicker="What you get"
        title={<>Everything we build<br />for one business.</>}
        lead="Shops, contractors, wholesalers, custom-order retail — one custom portal wired to whatever you already run."
        align="center"
      />

      <section className="m-section m-section--stack" style={{ paddingTop: 'clamp(32px,4vw,48px)' }}>
        <div className="m-wrap m-stack-list">
          {BUILD_STACK.map((col, i) => (
            <div key={col.title} className={`m-split-row${i < BUILD_STACK.length - 1 ? ' m-split-row--bordered' : ''}`}>
              <div className="m-split-row__head">
                <div className="m-kicker">{col.kicker}</div>
                <h3 className="m-stack-title">{col.title}</h3>
                <p className="m-stack-blurb">{col.blurb}</p>
              </div>
              <div className="m-split-row__items">
                {col.items.map((it) => {
                  const body = (
                    <div className="m-stack-item">
                      <div className="m-stack-item__title">{it.t}</div>
                      <div className="m-stack-item__desc">{it.d}</div>
                    </div>
                  )
                  return it.href
                    ? <a key={it.t} href={it.href} className="m-stack-item-link">{body}</a>
                    : <div key={it.t}>{body}</div>
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="m-section--panel" style={{ padding: 'clamp(56px,7vw,72px) 0' }}>
        <div className="m-wrap" style={{ textAlign: 'center', maxWidth: '560px' }}>
          <h2 className="m-h2" style={{ marginBottom: '14px' }}>All of this. Built for your business.</h2>
          <p className="m-lead" style={{ margin: '0 auto 24px' }}>
            Tell us what you run today and we&rsquo;ll show you what we&rsquo;d wire up.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Get started</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop">Book a call</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

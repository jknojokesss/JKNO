import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../components/MarketingShell'
import { BOOKING_URL } from '../lib/marketing'
import { BUILD_STACK, SERVICE_PACKAGES } from '../lib/buildStack'
import DemoGalleryCard from '../components/DemoGalleryCard'

export default function WhatWeDo() {
  const router = useRouter()
  return (
    <MarketingShell title="What You Get | JK No Jokes Financials">
      <PageHero
        kicker="What we build"
        title="One business at a time."
        lead="Not a template. Integrations, screens, and month-end wired to what you already run."
        align="center"
      />

      <section className="m-section" style={{ paddingTop: 'clamp(32px,4vw,48px)', paddingBottom: 0 }}>
        <div className="m-wrap">
          <h2 className="m-h2" style={{ marginBottom: '12px' }}>Four packages</h2>
          <p className="m-lead" style={{ maxWidth: '58ch', marginBottom: '24px' }}>
            Most owners land in one of these. The portal is custom; the pipe is the same — QuickBooks in the middle, sync at night, your login on top.
          </p>
          <div className="m-demo-grid m-demo-grid--tight">
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

      <section className="m-section m-section--stack" style={{ paddingTop: 'clamp(40px,5vw,56px)' }}>
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

      <section className="m-section" style={{ paddingTop: 0 }}>
        <div className="m-wrap" style={{ maxWidth: '560px' }}>
          <p className="m-about-p" style={{ marginBottom: '24px' }}>
            Tell me what you run and I&rsquo;ll show you what I&rsquo;d wire up.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Get started</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop">Book a call</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

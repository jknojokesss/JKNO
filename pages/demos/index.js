import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../../components/MarketingShell'
import { BOOKING_URL } from '../../lib/marketing'
import { ALL_DEMOS } from '../../lib/industryDemos'

export default function DemoGallery() {
  const router = useRouter()
  return (
    <MarketingShell
      title="Live Industry Demos — JK No Jokes Financials"
      description="Live, clickable financial dashboard demos — one for your industry. No login, sample data."
    >
      <PageHero
        kicker={`${ALL_DEMOS.length} live demos · no login`}
        title={<>One of these is<br /><span style={{ color: '#B8943C' }}>your business.</span></>}
        lead="Every demo below is a real, clickable dashboard built the way we'd build yours. Find your industry and click in."
        align="center"
      />

      <section className="m-section">
        <div className="m-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {ALL_DEMOS.map((d) => (
              <a key={d.href} href={d.href} className="m-card" style={{
                textDecoration: 'none', color: 'inherit', display: 'block',
                borderLeftWidth: '3px', transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A84C' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#DFE4EC' }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#B8943C', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{d.industry}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '19px', fontWeight: 600, color: '#0E1420', marginBottom: '8px' }}>{d.biz}</div>
                <div style={{ fontSize: '14px', color: '#48536A', lineHeight: 1.6, marginBottom: '12px' }}>{d.blurb}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#B8943C' }}>Open live demo →</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="m-cta-band">
        <div className="m-wrap m-cta-band__inner" style={{ textAlign: 'left' }}>
          <div>
            <h2 className="m-h2" style={{ fontSize: 'clamp(22px, 3vw, 30px)', marginBottom: '8px' }}>
              Don&rsquo;t see your industry?
            </h2>
            <p className="m-lead" style={{ fontSize: '16px', margin: 0, maxWidth: '480px' }}>
              We&rsquo;ll build a demo around your business before you pay anything. 30 minutes on a call.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--primary m-cta-band__btn">Book a free call</a>
            <button type="button" className="m-btn m-btn--secondary m-cta-band__btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }} onClick={() => router.push('/#contact')}>Send a message</button>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

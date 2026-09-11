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

      <section className="m-section--panel" style={{ padding: 'clamp(56px,7vw,72px) 0' }}>
        <div className="m-wrap" style={{ textAlign: 'center', maxWidth: '520px' }}>
          <h2 className="m-h2" style={{ marginBottom: '12px' }}>Don&rsquo;t see your industry?</h2>
          <p className="m-lead" style={{ margin: '0 auto 24px' }}>
            We&rsquo;ll build a demo around your business, wired into your own systems, before you pay a dime.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="m-btn m-btn--primary" onClick={() => router.push('/#contact')}>Get in touch</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary">Book a call</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

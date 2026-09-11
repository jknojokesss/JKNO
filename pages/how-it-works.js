import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../components/MarketingShell'
import { BOOKING_URL } from '../lib/marketing'

const STEPS = [
  { title: 'We learn your business', body: 'One call. You tell us how you get paid, what you sell, what you spend, and what you wish you could see on one screen. We figure out exactly what the dashboard needs to show.' },
  { title: 'We wire up your systems', body: 'QuickBooks, your register, vendor invoices, bank activity — whatever you already run. We write the integrations ourselves and run them on a nightly schedule.' },
  { title: 'You get one portal', body: 'A custom dashboard built around your business. Not a template. Log in any time. Your numbers stay current. Have a question? You get a plain-English answer from someone who knows your books.' },
]

const TIMELINE = [
  { label: 'Day 1', title: 'Kickoff call', desc: '30 minutes. We learn your business and what you want to see.' },
  { label: 'Days 2–5', title: 'Build phase', desc: 'We build your portal and wire the integrations. You don\'t lift a finger.' },
  { label: 'Day 6', title: 'Review & launch', desc: 'You see your portal, we walk through it together, make tweaks, and go live.' },
  { label: 'Ongoing', title: 'Monthly updates', desc: 'Books updated every month. Portal always current.' },
]

export default function HowItWorks() {
  const router = useRouter()
  return (
    <MarketingShell title="How It Works — JK No Jokes Financials">
      <PageHero
        kicker="How it works"
        title={<>From messy books to<br />clear numbers.</>}
        lead="Three steps. No bloated software. No settings screen to learn. Just a system that runs while you focus on the business."
      />

      <section className="m-section">
        <div className="m-wrap">
          <div className="m-how-strip" style={{ marginBottom: '72px' }}>
            {STEPS.map((s, i) => (
              <div key={s.title}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#C9A84C', marginBottom: '10px' }}>Step {i + 1}</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 600, marginBottom: '12px', lineHeight: 1.25 }}>{s.title}</h3>
                <p style={{ fontSize: '15px', color: '#48536A', lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #DFE4EC', paddingTop: '56px' }}>
            <h2 className="m-h2" style={{ marginBottom: '32px' }}>Six days to launch</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '28px' }}>
              {TIMELINE.map((item) => (
                <div key={item.label} className="m-card" style={{ borderLeftWidth: '3px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#B8943C', marginBottom: '6px', letterSpacing: '0.06em' }}>{item.label}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>{item.title}</div>
                  <div style={{ fontSize: '14px', color: '#48536A', lineHeight: 1.65 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '48px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="m-btn m-btn--primary" onClick={() => router.push('/#contact')}>Get started</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary">Book a call</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

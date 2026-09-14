import { useRouter } from 'next/router'
import MarketingShell, { PageHero } from '../components/MarketingShell'
import { BOOKING_URL } from '../lib/marketing'

const STEPS = [
  { n: '01', title: 'We learn your business', body: 'One call. How you get paid, what you sell, what you wish you could see on one screen.' },
  { n: '02', title: 'We wire your systems', body: 'QuickBooks, register, vendors, bank — integrations we wrote, on a nightly schedule.' },
  { n: '03', title: 'You get one portal', body: 'Custom dashboard. Not a template. Log in any time. Numbers stay current.' },
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
        title={<>Messy books in.<br />Clear numbers out.</>}
        lead="Three steps. No bloated software. No settings screen. A system that runs while you run the business."
        align="center"
      />

      <section className="m-section" style={{ paddingTop: 'clamp(32px,4vw,48px)' }}>
        <div className="m-wrap">
          <div className="m-step-row m-step-row--pop">
            {STEPS.map((s) => (
              <div key={s.n} className="m-step-pop">
                <div className="m-step-pop__n">{s.n}</div>
                <h3 className="m-step-pop__title">{s.title}</h3>
                <p className="m-step-pop__body">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="m-timeline-block">
            <h2 className="m-h2" style={{ marginBottom: '24px' }}>Six days to launch</h2>
            <div className="m-timeline-grid">
              {TIMELINE.map((item) => (
                <div key={item.label} className="m-card m-card--pop">
                  <div className="m-timeline-label">{item.label}</div>
                  <div className="m-timeline-title">{item.title}</div>
                  <div className="m-timeline-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/#contact')}>Get started</button>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--secondary m-btn--pop">Book a call</a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

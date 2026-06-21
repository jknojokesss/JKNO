import Head from 'next/head'
import { useRouter } from 'next/router'

const SECTIONS = [
  {
    heading: '1. Introduction',
    body: 'JK No Jokes Financials ("we," "us," or "our") operates jknojokes.com and provides financial dashboard and bookkeeping services. This Privacy Policy explains how we collect, use, and protect your information.',
  },
  {
    heading: '2. Information We Collect',
    items: [
      { label: 'Information you provide', bullets: ['Full name', 'Email address', 'Business name', 'Financial and accounting data you share with us'] },
      { label: 'Information collected automatically', bullets: ['Bank transaction data (via Plaid, with your explicit authorization)', 'Business financial data including revenue, expenses, and profit figures', 'Usage data and log information when you access your client portal'] },
    ],
  },
  {
    heading: '3. How We Use Your Information',
    bullets: [
      'Provide and maintain your client financial dashboard',
      'Connect to your bank accounts and financial institutions via Plaid',
      'Generate financial reports, insights, and analytics',
      'Communicate with you about your account',
      'Improve our services',
    ],
  },
  {
    heading: '4. Data Storage',
    body: 'Your data is stored securely using Supabase, a secure cloud database provider. All data is encrypted at rest and in transit. We maintain your data only as long as necessary to provide our services or as required by law.',
  },
  {
    heading: '5. Third Party Services',
    body: 'We use the following third party services to operate our platform:',
    boldItems: [
      { label: 'Supabase', desc: 'secure cloud database storage' },
      { label: 'Plaid', desc: 'bank account connectivity and transaction data (jknojokes.com/plaid-privacy)' },
      { label: 'Anthropic', desc: 'AI-powered financial insights and analysis' },
      { label: 'Vercel', desc: 'website hosting' },
    ],
    footer: 'Each third party has their own privacy policy governing their use of your data.',
  },
  {
    heading: '6. Data Sharing',
    body: 'We do not sell your personal or financial data to any third party. We only share data with the service providers listed above as necessary to operate our platform. We may disclose your information if required by law or legal process.',
  },
  {
    heading: '7. Your Rights (New Jersey Residents)',
    body: 'As a New Jersey resident you have the right to:',
    bullets: ['Access the personal data we hold about you', 'Request correction of inaccurate data', 'Request deletion of your data', 'Opt out of any data sharing'],
    footer: 'To exercise any of these rights contact us at jk@jknojokes.com.',
  },
  {
    heading: '8. Security',
    body: 'We take reasonable technical and organizational measures to protect your data including encryption, secure access controls, and regular security reviews. However no system is completely secure and we cannot guarantee absolute security.',
  },
  {
    heading: '9. Children\'s Privacy',
    body: 'Our services are not directed at children under 13. We do not knowingly collect personal information from children.',
  },
  {
    heading: '10. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page with an updated date.',
  },
  {
    heading: '11. Contact Us',
    body: 'If you have any questions about this Privacy Policy please contact us:',
    contact: true,
  },
]

export default function Privacy() {
  const router = useRouter()
  return (
    <>
      <Head>
        <title>Privacy Policy — JK No Jokes Financials</title>
        <meta name="description" content="Privacy Policy for JK No Jokes Financials" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: #F7F4EF; color: #1A1A2E; font-family: 'DM Sans', sans-serif; }`}</style>
      </Head>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #DDD8CE', padding: '20px 48px', background: '#F7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: '700', letterSpacing: '2px', color: '#1A1A2E' }}>
          JK<span style={{ color: '#C9A84C' }}>.</span>
        </button>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1px', color: '#5A6070', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← HOME
        </button>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 48px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: '56px', paddingBottom: '40px', borderBottom: '1px solid #DDD8CE' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '3px', color: '#C9A84C', marginBottom: '16px' }}>LEGAL</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: '600', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: '16px', color: '#1A1A2E' }}>
            Privacy Policy
          </h1>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#5A6070', lineHeight: 1.7 }}>
            <strong style={{ color: '#1A1A2E' }}>JK No Jokes Financials</strong><br />
            Last updated: May 31, 2026
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {SECTIONS.map((s, i) => (
            <div key={i}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: '600', color: '#1A1A2E', marginBottom: '12px' }}>{s.heading}</h2>
              {s.body && <p style={{ fontSize: '15px', color: '#5A6070', lineHeight: 1.8, marginBottom: s.bullets || s.boldItems || s.items || s.footer ? '12px' : 0 }}>{s.body}</p>}
              {s.items && s.items.map((item, j) => (
                <div key={j} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em', marginBottom: '8px' }}>{item.label}:</div>
                  <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.bullets.map((b, k) => <li key={k} style={{ fontSize: '15px', color: '#5A6070', lineHeight: 1.7 }}>{b}</li>)}
                  </ul>
                </div>
              ))}
              {s.bullets && (
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: s.footer ? '12px' : 0 }}>
                  {s.bullets.map((b, j) => <li key={j} style={{ fontSize: '15px', color: '#5A6070', lineHeight: 1.7 }}>{b}</li>)}
                </ul>
              )}
              {s.boldItems && (
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: s.footer ? '12px' : 0 }}>
                  {s.boldItems.map((b, j) => (
                    <li key={j} style={{ fontSize: '15px', color: '#5A6070', lineHeight: 1.7 }}>
                      <strong style={{ color: '#1A1A2E' }}>{b.label}</strong> — {b.desc}
                    </li>
                  ))}
                </ul>
              )}
              {s.footer && <p style={{ fontSize: '15px', color: '#5A6070', lineHeight: 1.8 }}>{s.footer}</p>}
              {s.contact && (
                <div style={{ marginTop: '12px', padding: '20px 24px', background: '#E8E4DC', border: '1px solid #DDD8CE' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: '600', color: '#1A1A2E', marginBottom: '6px' }}>JK No Jokes Financials</div>
                  <div style={{ fontSize: '14px', color: '#5A6070' }}>Email: <a href="mailto:jk@jknojokes.com" style={{ color: '#C9A84C', textDecoration: 'none' }}>jk@jknojokes.com</a></div>
                  <div style={{ fontSize: '14px', color: '#5A6070' }}>Website: jknojokes.com</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #DDD8CE', padding: '28px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#F7F4EF' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: '700', letterSpacing: '2px' }}>JK<span style={{ color: '#C9A84C' }}>.</span></div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#5A6070', letterSpacing: '1px' }}>© {new Date().getFullYear()} JK NO JOKES FINANCIALS</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button onClick={() => router.push('/privacy')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#C9A84C', letterSpacing: '1px' }}>PRIVACY</button>
          <button onClick={() => router.push('/terms')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#5A6070', letterSpacing: '1px' }}>TERMS</button>
        </div>
      </footer>
    </>
  )
}

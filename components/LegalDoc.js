import MarketingShell from './MarketingShell'

export default function LegalDoc({ title, sections }) {
  return (
    <MarketingShell title={`${title} — JK No Jokes Financials`} description={`${title} for JK No Jokes Financials`}>
      <main className="m-wrap" style={{ maxWidth: '720px', padding: 'clamp(48px,6vw,72px) 24px clamp(64px,8vw,96px)' }}>
        <div style={{ marginBottom: '40px', paddingBottom: '28px', borderBottom: '1px solid #DFE4EC' }}>
          <div className="m-kicker">Legal</div>
          <h1 className="m-h1" style={{ fontSize: 'clamp(32px, 4vw, 44px)', marginBottom: '12px' }}>{title}</h1>
          <div style={{ fontSize: '15px', color: '#48536A', lineHeight: 1.7 }}>
            <strong>JK No Jokes Financials</strong><br />
            Last updated: May 31, 2026
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>{s.heading}</h2>
              {s.body && <p style={{ fontSize: '15px', color: '#48536A', lineHeight: 1.75, marginBottom: s.bullets || s.boldItems || s.items || s.footer ? '12px' : 0 }}>{s.body}</p>}
              {s.items && s.items.map((item) => (
                <div key={item.label} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{item.label}:</div>
                  <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.bullets.map((b) => <li key={b} style={{ fontSize: '15px', color: '#48536A', lineHeight: 1.7 }}>{b}</li>)}
                  </ul>
                </div>
              ))}
              {s.bullets && (
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: s.footer ? '12px' : 0 }}>
                  {s.bullets.map((b) => <li key={b} style={{ fontSize: '15px', color: '#48536A', lineHeight: 1.7 }}>{b}</li>)}
                </ul>
              )}
              {s.boldItems && (
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: s.footer ? '12px' : 0 }}>
                  {s.boldItems.map((b) => (
                    <li key={b.label} style={{ fontSize: '15px', color: '#48536A', lineHeight: 1.7 }}>
                      <strong>{b.label}</strong> — {b.text}
                    </li>
                  ))}
                </ul>
              )}
              {s.footer && <p style={{ fontSize: '15px', color: '#48536A', lineHeight: 1.75 }}>{s.footer}</p>}
            </div>
          ))}
        </div>
      </main>
    </MarketingShell>
  )
}

import MarketingShell from './MarketingShell'

export default function LegalDoc({ title, sections }) {
  return (
    <MarketingShell
      title={`${title} — JK No Jokes Financials`}
      description={`${title} for JK No Jokes Financials`}
      flightTheme={false}
    >
      <main className="m-legal-doc">
        <article className="m-legal-doc__paper">
          <header className="m-legal-doc__head">
            <div className="m-kicker">Legal</div>
            <h1 className="m-legal-doc__title">{title}</h1>
            <p className="m-legal-doc__meta">
              <strong>JK No Jokes Financials</strong>
              <br />
              Last updated: May 31, 2026
            </p>
          </header>

          <div className="m-legal-doc__body">
            {sections.map((s) => (
              <section key={s.heading} className="m-legal-doc__section">
                <h2 className="m-legal-doc__h2">{s.heading}</h2>
                {s.body && (
                  <p className="m-legal-doc__p">{s.body}</p>
                )}
                {s.items && s.items.map((item) => (
                  <div key={item.label} className="m-legal-doc__block">
                    <p className="m-legal-doc__item-label">{item.label}:</p>
                    <ul className="m-legal-doc__ul">
                      {item.bullets.map((b) => (
                        <li key={b} className="m-legal-doc__li">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {s.bullets && (
                  <ul className="m-legal-doc__ul">
                    {s.bullets.map((b) => (
                      <li key={b} className="m-legal-doc__li">{b}</li>
                    ))}
                  </ul>
                )}
                {s.boldItems && (
                  <ul className="m-legal-doc__ul">
                    {s.boldItems.map((b) => (
                      <li key={b.label} className="m-legal-doc__li">
                        <strong>{b.label}</strong>
                        {' — '}
                        {b.desc ?? b.text}
                      </li>
                    ))}
                  </ul>
                )}
                {s.footer && <p className="m-legal-doc__p">{s.footer}</p>}
                {s.contact && (
                  <p className="m-legal-doc__p">
                    <strong>JK No Jokes Financials</strong>
                    <br />
                    Email:{' '}
                    <a className="m-legal-doc__link" href="mailto:jk@jknojokes.com">
                      jk@jknojokes.com
                    </a>
                  </p>
                )}
              </section>
            ))}
          </div>
        </article>
      </main>
    </MarketingShell>
  )
}

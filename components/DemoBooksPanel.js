// Shared “portal vs QuickBooks” block for sample portals — matches what we sell
// in lib/buildStack.js (financials vs QBO, month-end close).

/**
 * @param {{
 *   title?: string
 *   intro: string
 *   rows: { label: string, portal: string, qbo: string }[]
 *   footnote?: string
 *   bullets?: string[]
 *   headFont?: string
 *   monoFont?: string
 *   ink?: string
 *   muted?: string
 *   green?: string
 *   border?: string
 * }} props
 */
export default function DemoBooksPanel({
  title = 'QuickBooks at month-end',
  intro,
  rows,
  footnote = 'Nightly sync on P&L, balance sheet, and GL — month-end journal entries post when you approve.',
  bullets,
  headFont = "'Inter', sans-serif",
  monoFont = "'IBM Plex Mono', monospace",
  ink = '#1A2430',
  muted = '#5C6B7A',
  green = '#1E7A4A',
  border = '#D8DEE6',
}) {
  const card = {
    background: '#fff',
    border: `1px solid ${border}`,
    borderRadius: '8px',
    padding: '20px 22px',
    maxWidth: '720px',
  }
  const th = {
    fontFamily: monoFont,
    fontSize: '9px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: muted,
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: `1px solid ${border}`,
  }
  const td = {
    fontSize: '13px',
    color: ink,
    padding: '10px',
    borderBottom: `1px solid ${border}`,
    verticalAlign: 'middle',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={card}>
        <div style={{ fontFamily: headFont, fontSize: '20px', fontWeight: 600, color: ink, marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: '16px' }}>{intro}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Line</th>
              <th style={{ ...th, textAlign: 'right' }}>Portal</th>
              <th style={{ ...th, textAlign: 'right' }}>QBO statement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, portal, qbo }) => (
              <tr key={label}>
                <td style={td}>{label}</td>
                <td style={{ ...td, textAlign: 'right', fontFamily: monoFont }}>{portal}</td>
                <td style={{ ...td, textAlign: 'right', fontFamily: monoFont, color: green }}>{qbo} ✓</td>
              </tr>
            ))}
          </tbody>
        </table>
        {footnote && (
          <p style={{ fontSize: '11px', color: muted, marginTop: '14px', lineHeight: 1.5, marginBottom: 0 }}>{footnote}</p>
        )}
      </div>
      {bullets?.length ? (
        <div style={{ ...card, borderLeft: `3px solid ${green}`, maxWidth: '720px' }}>
          <div style={{ fontFamily: monoFont, fontSize: '9px', letterSpacing: '0.1em', color: muted, marginBottom: '8px' }}>MONTH-END (WHEN YOU CLOSE)</div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: ink, lineHeight: 1.6 }}>
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

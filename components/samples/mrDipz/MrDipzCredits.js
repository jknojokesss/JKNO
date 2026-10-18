import { BORDER, INK, MUTED, MONO, money, pct1 } from './mrDipzUtils'

export default function MrDipzCredits({ model, card, lbl, onCreditClick }) {
  const { totals, credits } = model

  return (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ ...card, flex: 1, minWidth: 200 }}>
          <div style={lbl}>September credits</div>
          <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, marginTop: 6 }}>{money(totals.september.credits)}</div>
          <div style={{ fontSize: 12, color: MUTED }}>{pct1(totals.september.creditPct)} of gross sales</div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 200 }}>
          <div style={lbl}>August credits</div>
          <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, marginTop: 6 }}>{money(totals.august.credits)}</div>
          <div style={{ fontSize: 12, color: MUTED }}>{pct1(totals.august.creditPct)} of gross sales</div>
        </div>
      </div>
      <div style={card}>
        <div style={{ ...lbl, marginBottom: 12 }}>Credit lines (September)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: MUTED, fontSize: 11, textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Store</th>
              <th style={{ padding: 8 }}>Week</th>
              <th style={{ padding: 8 }}>Product</th>
              <th style={{ padding: 8 }}>Reason</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {credits.map((c) => (
              <tr key={c.id} className="md-click" style={{ borderTop: `1px solid ${BORDER}`, cursor: 'pointer' }} onClick={() => onCreditClick(c)}>
                <td style={{ padding: 10, fontWeight: 600, color: INK }}>{c.store?.label}</td>
                <td style={{ padding: 10, color: MUTED }}>{c.week?.label}</td>
                <td style={{ padding: 10 }}>{c.product?.label}</td>
                <td style={{ padding: 10, color: MUTED }}>{c.reason}</td>
                <td style={{ padding: 10, textAlign: 'right', fontFamily: MONO }}>{money(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

import { BORDER, INK, MUTED, MONO, money } from './mrDipzUtils'

export default function MrDipzCredits({ model, card, lbl, onCreditClick }) {
  const { creditMemos, stores, totals } = model
  const storeName = Object.fromEntries(stores.map((s) => [s.id, s.name]))
  const sorted = [...creditMemos].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ ...card, flex: 1, minWidth: 200 }}>
          <div style={{ ...lbl }}>September credits (stores)</div>
          <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, marginTop: 6 }}>{money(totals.september.credits)}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{totals.september.creditPct.toFixed(1)}% of gross sales</div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 200 }}>
          <div style={{ ...lbl }}>August credits</div>
          <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, marginTop: 6 }}>{money(totals.august.credits)}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{totals.august.creditPct.toFixed(1)}% of gross sales</div>
        </div>
      </div>
      <div style={card}>
        <div style={{ ...lbl, marginBottom: 12 }}>Credit memos (September)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: MUTED, fontSize: 11 }}>
              <th style={{ padding: '8px 4px' }}>Date</th>
              <th style={{ padding: '8px 4px' }}>Store</th>
              <th style={{ padding: '8px 4px' }}>Reason</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((cm) => (
              <tr
                key={cm.id}
                className="md-click"
                style={{ borderTop: `1px solid ${BORDER}`, cursor: 'pointer' }}
                onClick={() => onCreditClick(cm, storeName[cm.storeId])}
              >
                <td style={{ padding: '10px 4px', fontFamily: MONO, fontSize: 12 }}>{cm.date}</td>
                <td style={{ padding: '10px 4px', fontWeight: 600, color: INK }}>{storeName[cm.storeId]}</td>
                <td style={{ padding: '10px 4px', color: MUTED }}>{cm.reason}</td>
                <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO }}>{money(cm.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

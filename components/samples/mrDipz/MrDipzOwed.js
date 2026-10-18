import { BORDER, INK, MUTED, MONO, AMBER, money } from './mrDipzUtils'

export default function MrDipzOwed({ model, card, lbl, onInvoiceClick }) {
  const { totals, aging, invoices } = model

  return (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ ...card, flex: 1, minWidth: 160 }}>
          <div style={lbl}>Total owed</div>
          <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: AMBER, marginTop: 6 }}>{money(totals.totalOwed)}</div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 120 }}>
          <div style={lbl}>Current</div>
          <div style={{ fontFamily: MONO, fontSize: 18, marginTop: 6 }}>{money(aging.current)}</div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 120 }}>
          <div style={lbl}>31–60 days</div>
          <div style={{ fontFamily: MONO, fontSize: 18, marginTop: 6 }}>{money(aging.d31_60)}</div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 120 }}>
          <div style={lbl}>61+ days</div>
          <div style={{ fontFamily: MONO, fontSize: 18, marginTop: 6 }}>{money(aging.d61)}</div>
        </div>
      </div>
      <div style={card}>
        <div style={{ ...lbl, marginBottom: 12 }}>Open invoices</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: MUTED, fontSize: 11, textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Invoice</th>
              <th style={{ padding: 8 }}>Store</th>
              <th style={{ padding: 8 }}>Due</th>
              <th style={{ padding: 8 }}>Aging</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="md-click" style={{ borderTop: `1px solid ${BORDER}`, cursor: 'pointer' }} onClick={() => onInvoiceClick(inv)}>
                <td style={{ padding: 10, fontFamily: MONO, fontSize: 12 }}>{inv.id}</td>
                <td style={{ padding: 10, fontWeight: 600, color: INK }}>{inv.store?.label}</td>
                <td style={{ padding: 10, color: MUTED }}>{inv.due}</td>
                <td style={{ padding: 10 }}>{inv.aging}</td>
                <td style={{ padding: 10, textAlign: 'right', fontFamily: MONO }}>{money(inv.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

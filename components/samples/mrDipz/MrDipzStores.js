import { BORDER, CARDBG, INK, MUTED, MONO, UI, money, pct1 } from './mrDipzUtils'

export default function MrDipzStores({ model, card, lbl, inp, onStoreClick }) {
  const { stores } = model

  return (
    <div style={card}>
      <div style={{ ...lbl, marginBottom: 14 }}>Store sales — September vs August</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <th style={{ padding: '8px 6px' }}>Store</th>
              <th style={{ padding: '8px 6px' }}>Region</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Sep sales</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Sep credits</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Sep net</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Owed</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((st) => (
              <tr
                key={st.id}
                className="md-click"
                onClick={() => onStoreClick(st)}
                style={{ cursor: 'pointer', borderTop: `1px solid ${BORDER}` }}
              >
                <td style={{ padding: '10px 6px' }}>
                  <div style={{ fontWeight: 600, color: INK }}>{st.name}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{st.city}</div>
                </td>
                <td style={{ padding: '10px 6px', color: MUTED }}>{st.region}</td>
                <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO }}>{money(st.sales.sep)}</td>
                <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO, color: MUTED }}>
                  {money(st.credits.sep)}
                  <span style={{ fontSize: 10, marginLeft: 4 }}>({pct1(st.creditPctSep)})</span>
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO }}>{money(st.netSep)}</td>
                <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO }}>{money(st.balanceOwed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

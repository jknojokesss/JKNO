import { BORDER, INK, MUTED, MONO, AMBER, money } from './mrDipzUtils'

export default function MrDipzOwed({ model, card, lbl, onStoreClick }) {
  const { owedRows, totals } = model
  const max = owedRows[0]?.balanceOwed || 1

  return (
    <>
      <div style={{ ...card, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ ...lbl }}>Total open balance</div>
          <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 700, color: AMBER, marginTop: 4 }}>{money(totals.totalOwed)}</div>
        </div>
        <div style={{ fontSize: 13, color: MUTED, maxWidth: 360 }}>Sample AR — what each store still owes on delivered cases (fictitious).</div>
      </div>
      <div style={card}>
        <div style={{ ...lbl, marginBottom: 12 }}>Owed by store</div>
        {owedRows.map((st, i) => (
          <button
            key={st.id}
            type="button"
            className="md-click"
            onClick={() => onStoreClick(st)}
            style={{
              display: 'block',
              width: '100%',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              padding: '12px 0',
              borderTop: i ? `1px solid ${BORDER}` : 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: INK }}>{st.name}</span>
              <span style={{ fontFamily: MONO, fontWeight: 600 }}>{money(st.balanceOwed)}</span>
            </div>
            <div style={{ height: 5, background: '#F6F0E6', borderRadius: 2 }}>
              <div style={{ width: `${Math.round((st.balanceOwed / max) * 100)}%`, height: '100%', background: AMBER }} />
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{st.terms} · last delivery {st.lastDelivery}</div>
          </button>
        ))}
      </div>
    </>
  )
}

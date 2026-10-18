import { BORDER, CARDBG, INK, MUTED, SPICE, UI, MONO, money, fmtInt } from './mrDipzUtils'

export default function MrDipzDetail({ detail, onClose, productBySku }) {
  if (!detail) return null

  const panel = {
    background: CARDBG,
    border: `1px solid ${BORDER}`,
    borderRadius: '2px',
    padding: '18px 20px',
    marginBottom: '16px',
  }

  const titleStyle = { fontFamily: UI, fontWeight: 700, fontSize: '18px', color: INK, marginBottom: '6px' }
  const subStyle = { fontSize: '12px', color: MUTED, marginBottom: '14px' }

  if (detail.type === 'store') {
    const st = detail.store
    const cases = Object.entries(st.casesSep || {})
    return (
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div style={titleStyle}>{st.name}</div>
            <div style={subStyle}>{st.city} · {st.terms} · {st.rep}</div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: MUTED }} aria-label="Close">×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
          <Metric label="Sep gross sales" value={money(st.sales.sep)} />
          <Metric label="Sep credits" value={money(st.credits.sep)} accent />
          <Metric label="Sep net" value={money(st.netSep)} />
          <Metric label="Balance owed" value={money(st.balanceOwed)} accent />
        </div>
        {cases.length ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: SPICE, marginBottom: 8 }}>Cases shipped (Sep)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: MUTED, fontSize: 11 }}>
                  <th style={{ padding: '6px 4px' }}>SKU</th>
                  <th style={{ padding: '6px 4px' }}>Product</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Cases</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(([sku, qty]) => (
                  <tr key={sku} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 4px', fontFamily: MONO, fontSize: 12 }}>{sku}</td>
                    <td style={{ padding: '8px 4px' }}>{productBySku[sku]?.name || sku}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: MONO }}>{fmtInt(qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    )
  }

  if (detail.type === 'credit') {
    const cm = detail.credit
    const store = detail.storeName
    return (
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={titleStyle}>Credit {cm.id}</div>
            <div style={subStyle}>{store} · {cm.date}</div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: MUTED }}>×</button>
        </div>
        <Metric label="Amount" value={money(cm.amount)} accent />
        <p style={{ marginTop: 12, fontSize: 14, color: INK, lineHeight: 1.5 }}>{cm.reason}</p>
        <p style={{ marginTop: 8, fontSize: 12, color: MUTED }}>{productBySku[cm.sku]?.name || cm.sku} · {fmtInt(cm.cases)} cases</p>
      </div>
    )
  }

  if (detail.type === 'product') {
    const p = detail.product
    return (
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={titleStyle}>{p.name}</div>
            <div style={subStyle}>{p.sku} · {p.size} · {p.category}</div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: MUTED }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
          <Metric label="Cases (Sep)" value={fmtInt(p.casesSep)} />
          <Metric label="Revenue (Sep)" value={money(p.revenueSep)} />
          <Metric label="Est. COGS" value={money(p.cogsSep)} />
          <Metric label="Case price" value={money(p.case_price)} />
        </div>
      </div>
    )
  }

  return null
}

function Metric({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: '#A9763A' }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 17, fontWeight: 600, color: accent ? '#C98A2A' : INK, marginTop: 4 }}>{value}</div>
    </div>
  )
}

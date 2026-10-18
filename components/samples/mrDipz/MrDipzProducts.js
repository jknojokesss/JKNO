import { BORDER, INK, MUTED, MONO, KRAFT, money, fmtInt } from './mrDipzUtils'

export default function MrDipzProducts({ model, card, lbl, onProductClick }) {
  const { products } = model
  const sorted = [...products].sort((a, b) => b.casesSep - a.casesSep)
  const maxCases = sorted[0]?.casesSep || 1

  return (
    <div style={card}>
      <div style={{ ...lbl, marginBottom: 14 }}>Products — September case movement</div>
      {sorted.map((p, i) => (
        <button
          key={p.sku}
          type="button"
          className="md-click"
          onClick={() => onProductClick(p)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            border: 'none',
            background: 'transparent',
            padding: '12px 0',
            borderTop: i ? `1px solid ${BORDER}` : 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: INK }}>{p.name}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{p.sku} · {p.category}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600 }}>{fmtInt(p.casesSep)} cases</div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>{money(p.revenueSep)}</div>
            </div>
          </div>
          <div style={{ height: 6, background: '#F6F0E6', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${Math.round((p.casesSep / maxCases) * 100)}%`, height: '100%', background: KRAFT }} />
          </div>
        </button>
      ))}
    </div>
  )
}

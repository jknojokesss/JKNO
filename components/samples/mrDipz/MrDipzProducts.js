import { BORDER, INK, MUTED, MONO, KRAFT, money } from './mrDipzUtils'

export default function MrDipzProducts({ model, card, lbl, onProductClick }) {
  const max = model.products[0]?.sepSales || 1

  return (
    <div style={card}>
      <div style={{ ...lbl, marginBottom: 14 }}>Products — September</div>
      {model.products.map((p, i) => (
        <button
          key={p.id}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, color: INK }}>{p.label}</span>
            <span style={{ fontFamily: MONO }}>{money(p.sepSales)}</span>
          </div>
          <div style={{ height: 6, background: '#F6F0E6', borderRadius: 2 }}>
            <div style={{ width: `${Math.round((p.sepSales / max) * 100)}%`, height: '100%', background: KRAFT }} />
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Credits {money(p.sepCredits)}</div>
        </button>
      ))}
    </div>
  )
}

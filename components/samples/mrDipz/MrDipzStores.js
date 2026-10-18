import { useState } from 'react'
import { BORDER, INK, MUTED, MONO, money, pct1 } from './mrDipzUtils'

export default function MrDipzStores({ model, card, lbl, onStoreClick, onAreaClick }) {
  const [areaFilter, setAreaFilter] = useState('all')
  const rows = areaFilter === 'all' ? model.stores : model.stores.filter((s) => s.areaId === areaFilter)

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={lbl}>Stores</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <FilterChip active={areaFilter === 'all'} onClick={() => setAreaFilter('all')}>All areas</FilterChip>
          {model.areas.map((a) => (
            <FilterChip key={a.id} active={areaFilter === a.id} onClick={() => setAreaFilter(a.id)}>{a.label}</FilterChip>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 680 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: MUTED, fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: 8 }}>Store</th>
              <th style={{ padding: 8 }}>Area</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Sep sales</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Credits</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Net</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Owed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((st) => (
              <tr key={st.id} className="md-click" style={{ cursor: 'pointer', borderTop: `1px solid ${BORDER}` }} onClick={() => onStoreClick(st)}>
                <td style={{ padding: 10, fontWeight: 600, color: INK }}>{st.label}</td>
                <td style={{ padding: 10 }}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); onAreaClick(st.area) }} style={{ border: 'none', background: 'none', color: MUTED, cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
                    {st.area?.label}
                  </button>
                </td>
                <td style={{ padding: 10, textAlign: 'right', fontFamily: MONO }}>{money(st.sepSales)}</td>
                <td style={{ padding: 10, textAlign: 'right', fontFamily: MONO, color: MUTED }}>{money(st.sepCredits)} ({pct1(st.creditPctSep)})</td>
                <td style={{ padding: 10, textAlign: 'right', fontFamily: MONO }}>{money(st.sepNet)}</td>
                <td style={{ padding: 10, textAlign: 'right', fontFamily: MONO }}>{money(st.balanceOwed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilterChip({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 2,
        border: '1px solid #E6DBC8',
        background: active ? '#2B2018' : '#FFFDF9',
        color: active ? '#F6F0E6' : '#8A7A66',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

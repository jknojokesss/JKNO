import { useMemo } from 'react'
import DATA from './aufschnittData'
import { INK, MUTED, BORDER, CREAM, RED, MONO, money, money0, fmtCases, fmtAsOfLong, fmtWeekEnding } from './aufschnittUtils'

export default function AufschnittStockTab({ card, lbl, brand, onOpen, sort, setSort }) {
  const rows = useMemo(() => {
    const base = brand === 'All products' ? DATA.stock : DATA.stock.filter((r) => r.brand === brand)
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...base].sort((a, b) => (a[sort.key] - b[sort.key]) * dir)
  }, [brand, sort])

  const totals = useMemo(
    () => ({
      cases: rows.reduce((s, r) => s + r.onHandCases, 0),
      value: rows.reduce((s, r) => s + r.valueAtCost, 0),
    }),
    [rows]
  )

  const SortTh = ({ label, keyName }) => (
    <th style={{ textAlign: 'right', padding: '8px 4px' }}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ key: keyName, dir: s.key === keyName && s.dir === 'asc' ? 'desc' : 'asc' }))}
        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 10, textTransform: 'uppercase', color: MUTED, minHeight: 40 }}
      >
        {label}
        {sort.key === keyName ? (sort.dir === 'asc' ? ' asc' : ' desc') : ''}
      </button>
    </th>
  )

  return (
    <div style={{ ...card, overflowX: 'hidden' }}>
      <div style={{ ...lbl, marginBottom: 10 }}>Stock</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
            <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: 10, textTransform: 'uppercase', color: MUTED }}>Product</th>
            <SortTh label="Cases" keyName="onHandCases" />
            <SortTh label="Avg/wk" keyName="avgWeeklyCases" />
            <SortTh label="Wks" keyName="weeksSupply" />
            <SortTh label="Value" keyName="valueAtCost" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.productId}
              className="au-click"
              role="button"
              tabIndex={0}
              onClick={() => onOpen({ type: 'stock', row: r })}
              onKeyDown={(e) => e.key === 'Enter' && onOpen({ type: 'stock', row: r })}
              style={{ borderBottom: `1px solid ${CREAM}`, cursor: 'pointer' }}
            >
              <td style={{ padding: '8px 4px', maxWidth: 140 }}>
                <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{r.name}</div>
                <div style={{ fontSize: 10, color: MUTED }}>{r.brand}</div>
              </td>
              <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: MONO }}>{r.onHandCases}</td>
              <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: MONO }}>{fmtCases(r.avgWeeklyCases)}</td>
              <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: MONO, color: r.weeksSupply < 3 ? RED : INK }}>
                {r.weeksSupply.toFixed(1)}
              </td>
              <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: MONO }}>{money0(r.valueAtCost)}</td>
            </tr>
          ))}
          <tr style={{ borderTop: `2px solid ${BORDER}`, fontWeight: 700 }}>
            <td style={{ padding: '10px 4px' }}>Total</td>
            <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO }}>{totals.cases}</td>
            <td />
            <td />
            <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO }}>{money0(totals.value)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function StockDetail({ detail, card, lbl, big, onBack }) {
  const r = detail.row
  return (
    <div>
      <button type="button" className="au-detail-back" onClick={onBack}>Back</button>
      <h2 style={{ ...big, fontSize: 20, marginBottom: 4 }}>{r.name}</h2>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>{r.brand}</div>

      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ ...lbl, marginBottom: 8 }}>On hand by location</div>
        {r.locations.map((loc) => (
          <div key={loc.location} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${CREAM}` }}>
            <span style={{ fontSize: 13 }}>{loc.location}</span>
            <span style={{ fontFamily: MONO }}>{loc.cases} cases</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, borderTop: `1px solid ${BORDER}` }}>
          <span>Total</span>
          <span style={{ fontFamily: MONO }}>{r.onHandCases} cases</span>
        </div>
      </div>

      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ ...lbl, marginBottom: 8 }}>Last 8 weeks sold (cases)</div>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <tbody>
            {(r.weeklyCases || []).map((c, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${CREAM}` }}>
                <td style={{ padding: '4px 0', color: MUTED }}>
                  {r.weeklyWeekEndings?.[i] ? fmtWeekEnding(r.weeklyWeekEndings[i]) : `Week ${i + 1}`}
                </td>
                <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: MONO }}>{fmtCases(c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontSize: 12, fontWeight: 600 }}>
          <span>Average</span>
          <span style={{ fontFamily: MONO }}>{fmtCases(r.avgWeeklyCases)} / wk</span>
        </div>
      </div>

      {r.incoming && (
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ ...lbl, marginBottom: 8 }}>Incoming on order</div>
          <div style={{ fontSize: 13 }}>
            {r.incoming.cases} cases · expected {fmtAsOfLong(r.incoming.expected)}
          </div>
        </div>
      )}

      <div style={{ ...card }}>
        <div style={{ ...lbl, marginBottom: 8 }}>Cost</div>
        <div style={{ fontFamily: MONO, fontSize: 14 }}>{money(r.costPerCase)} per case</div>
      </div>
    </div>
  )
}

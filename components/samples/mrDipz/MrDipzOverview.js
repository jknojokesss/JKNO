import { SPICE, INK, MUTED, BORDER, GREEN, RED, MONO, money, pct1 } from './mrDipzUtils'

export default function MrDipzOverview({ model, card, lbl, KPI, goTab, onAreaClick, onWeekClick }) {
  const { totals, areas, weeks, pnlSep, pnlAug } = model
  const sep = totals.september
  const aug = totals.august
  const salesDelta = aug.grossSales > 0 ? ((sep.grossSales - aug.grossSales) / aug.grossSales) * 100 : 0

  return (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <KPI k="Gross sales (Sep)" v={money(sep.grossSales)} sub={`${salesDelta >= 0 ? '+' : ''}${pct1(salesDelta)} vs Aug`} accent={SPICE} onClick={() => goTab('stores')} />
        <KPI k="Credits (Sep)" v={money(sep.credits)} sub={pct1(sep.creditPct) + ' of sales'} onClick={() => goTab('credits')} />
        <KPI k="Net sales (Sep)" v={money(sep.netSales)} onClick={() => goTab('financials')} />
        <KPI k="Owed by stores" v={money(totals.totalOwed)} onClick={() => goTab('owed')} />
        <KPI k="Net profit (Sep)" v={money(pnlSep.netProfit)} sub={`Aug ${money(pnlAug.netProfit)}`} accent={pnlSep.netProfit >= 0 ? GREEN : RED} onClick={() => goTab('financials')} />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: 260 }}>
          <div style={{ ...lbl, marginBottom: 12 }}>By area</div>
          {areas.map((a, i) => (
            <button
              key={a.id}
              type="button"
              className="md-click"
              onClick={() => onAreaClick(a)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 0',
                border: 'none',
                borderTop: i ? `1px solid ${BORDER}` : 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontWeight: 600, color: INK }}>{a.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 13 }}>{money(a.sepSales)}</span>
            </button>
          ))}
        </div>
        <div style={{ ...card, flex: 1, minWidth: 260 }}>
          <div style={{ ...lbl, marginBottom: 12 }}>By week</div>
          {weeks.map((w, i) => (
            <button
              key={w.id}
              type="button"
              className="md-click"
              onClick={() => onWeekClick(w)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 0',
                border: 'none',
                borderTop: i ? `1px solid ${BORDER}` : 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: INK }}>{w.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 13 }}>{money(w.sepSales)}</span>
            </button>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 12, color: MUTED, marginTop: 14 }}>Tap a row for detail. All numbers are fictitious.</p>
    </>
  )
}

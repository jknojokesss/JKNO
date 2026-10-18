import { SPICE, CHAR, CREAM, CARDBG, INK, MUTED, BORDER, GREEN, AMBER, RED, UI, money0, pct1 } from './mrDipzUtils'

export default function MrDipzOverview({ model, card, lbl, big, KPI, goTab, onStoreClick }) {
  const { totals, overview, stores, pnlSep } = model
  const sep = totals.september
  const aug = totals.august
  const salesDelta = aug.grossSales > 0 ? ((sep.grossSales - aug.grossSales) / aug.grossSales) * 100 : 0

  const topStores = stores.slice(0, 5)
  const attention = overview.needsAttention || []

  const sevColor = { high: RED, medium: AMBER, low: MUTED }

  return (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <KPI k="Cash on hand" v={money0(overview.cashOnHand)} onClick={() => goTab('financials')} />
        <KPI
          k="Gross sales (Sep)"
          v={money0(sep.grossSales)}
          sub={`${salesDelta >= 0 ? '+' : ''}${pct1(salesDelta)} vs August`}
          accent={SPICE}
          onClick={() => goTab('stores')}
        />
        <KPI k="Credits (Sep)" v={money0(sep.credits)} sub={`${pct1(sep.creditPct)} of sales`} accent={AMBER} onClick={() => goTab('credits')} />
        <KPI k="Net sales (Sep)" v={money0(sep.netSales)} onClick={() => goTab('financials')} />
        <KPI k="Owed by stores" v={money0(totals.totalOwed)} accent={AMBER} onClick={() => goTab('owed')} />
        <KPI k="Cases shipped" v={String(totals.casesShippedSep)} onClick={() => goTab('products')} />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: 280 }}>
          <div style={{ ...lbl, marginBottom: 12 }}>September snapshot</div>
          <Row l="Gross sales" v={money0(sep.grossSales)} />
          <Row l="Credits" v={money0(sep.credits)} neg />
          <Row l="Net sales" v={money0(sep.netSales)} bold top />
          <Row l="Net profit (books)" v={money0(pnlSep?.netProfit ?? 0)} bold top accent={pnlSep?.netProfit >= 0 ? GREEN : RED} />
        </div>
        <div style={{ ...card, flex: 1, minWidth: 280 }}>
          <div style={{ ...lbl, marginBottom: 12 }}>Top stores (Sep gross)</div>
          {topStores.map((st, i) => (
            <button
              key={st.id}
              type="button"
              className="md-click"
              onClick={() => onStoreClick(st)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 0',
                border: 'none',
                borderTop: i ? `1px solid ${CREAM}` : 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{st.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: INK }}>{money0(st.sales.sep)}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ ...lbl, marginBottom: 12 }}>Needs attention</div>
        {attention.map((item) => (
          <div key={item.title} style={{ padding: '12px 0', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: sevColor[item.severity] || MUTED }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: INK }}>{item.title}</span>
            </div>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.45, paddingLeft: 16 }}>{item.detail}</p>
          </div>
        ))}
      </div>
    </>
  )
}

const MONO = "'IBM Plex Mono', monospace"

function Row({ l, v, neg, bold, top, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: top ? `1px solid ${BORDER}` : 'none' }}>
      <span style={{ fontSize: 13, color: bold ? INK : MUTED, fontWeight: bold ? 600 : 400 }}>{l}</span>
      <span style={{ fontFamily: MONO, fontSize: 13, color: accent || (neg ? RED : bold ? INK : MUTED), fontWeight: bold ? 600 : 400 }}>{v}</span>
    </div>
  )
}

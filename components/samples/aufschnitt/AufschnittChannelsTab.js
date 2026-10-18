import DATA from './aufschnittData'
import { RevenueNetChart } from './AufschnittCharts'
import { INK, MUTED, BORDER, CREAM, MONO, money, money0, pct1, pctChange, changeColor } from './aufschnittUtils'

export default function AufschnittChannelsTab({ card, lbl, brand, onOpen }) {
  const channels = DATA.channels

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {channels.map((ch) => {
        const delta = pctChange(ch.curRev, ch.priorRev)
        const unitDelta = pctChange(ch.curUnits, ch.priorUnits)
        const filteredBrand = brand === 'All brands' ? ch.byBrand : ch.byBrand.filter((b) => b.brand === brand)
        const curRev =
          brand === 'All brands' ? ch.curRev : filteredBrand.reduce((s, b) => s + b.revenue, 0)
        const priorRev =
          brand === 'All brands'
            ? ch.priorRev
            : DATA.salesRows
                .filter((r) => r.month === '2026-08' && r.channel === ch.channel && r.brand === brand)
                .reduce((s, r) => s + r.revenue, 0)
        return (
          <button
            key={ch.channel}
            type="button"
            className="au-click"
            onClick={() => onOpen({ type: 'channel-detail', channel: ch.channel, brand })}
            style={{
              ...card,
              textAlign: 'left',
              cursor: 'pointer',
              width: '100%',
              position: 'relative',
            }}
          >
            <div style={{ ...lbl, marginBottom: 6 }}>{ch.channel}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: INK, fontFamily: MONO }}>{money0(curRev)}</span>
              <span style={{ fontSize: 13, color: changeColor(pctChange(curRev, priorRev)) }}>
                {pctChange(curRev, priorRev) >= 0 ? '+' : ''}
                {pct1(pctChange(curRev, priorRev))} vs August
              </span>
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
              {ch.curUnits.toLocaleString()} units · {unitDelta >= 0 ? '+' : ''}
              {pct1(unitDelta)} units vs August
            </div>
            <span style={{ position: 'absolute', top: 14, right: 14, color: '#C6B79A', fontSize: 15 }}>›</span>
          </button>
        )
      })}
    </div>
  )
}

export function ChannelDetail({ detail, card, lbl, big, onBack }) {
  const ch = DATA.channels.find((c) => c.channel === detail.channel)
  if (!ch) return null
  const brand = detail.brand || 'All brands'
  const products =
    brand === 'All brands' ? ch.byProduct : ch.byProduct.filter((p) => p.brand === brand)
  const brands = brand === 'All brands' ? ch.byBrand : ch.byBrand.filter((b) => b.brand === brand)
  const storeRows =
    ch.channel === 'Stores' && ch.extra.storeSplits
      ? ch.extra.storeSplits['2026-09'][brand]
      : ch.extra.stores

  return (
    <div>
      <button type="button" className="au-detail-back" onClick={onBack}>← Back</button>
      <h2 style={{ ...big, fontSize: 22, marginBottom: 16 }}>{ch.channel}</h2>

      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ ...lbl, marginBottom: 8 }}>By brand</div>
        {brands.map((b) => (
          <div key={b.brand} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${CREAM}` }}>
            <span>{b.brand}</span>
            <span style={{ fontFamily: MONO }}>{money0(b.revenue)}</span>
          </div>
        ))}
      </div>

      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ ...lbl, marginBottom: 8 }}>By product</div>
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {products.map((p) => (
            <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderTop: `1px solid ${CREAM}`, fontSize: 13 }}>
              <span style={{ minWidth: 0 }}>{p.name}</span>
              <span style={{ fontFamily: MONO, whiteSpace: 'nowrap' }}>{money0(p.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      {ch.channel === 'Amazon' && ch.extra.amazon && (
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ ...lbl, marginBottom: 8 }}>Amazon payout</div>
          <Row l="Gross sales" v={money(ch.extra.amazon.grossSales)} />
          <Row l="Amazon fees" v={money(-ch.extra.amazon.fees)} />
          <Row l="Net payout" v={money(ch.extra.amazon.netPayout)} bold />
        </div>
      )}

      {ch.channel === 'Own site' && ch.extra.ownSite && (
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ ...lbl, marginBottom: 8 }}>Own site split</div>
          <Row l="Single bags" v={money0(ch.extra.ownSite.singleBags)} />
          <Row l="Case packs" v={money0(ch.extra.ownSite.casePacks)} />
        </div>
      )}

      {ch.channel === 'Stores' && storeRows && (
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ ...lbl, marginBottom: 8 }}>By store account</div>
          {storeRows.map((s) => (
            <div key={s.store} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, borderTop: `1px solid ${CREAM}` }}>
              <span>{s.store}</span>
              <span style={{ fontFamily: MONO }}>{money0(s.revenue)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...card }}>
        <div style={{ ...lbl, marginBottom: 12 }}>Six-month trend</div>
        <RevenueNetChart
          data={ch.trend.map((t) => ({ name: t.label.slice(0, 3), revenue: t.revenue, net: t.revenue * 0.07 }))}
        />
      </div>
    </div>
  )
}

function Row({ l, v, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: bold ? 700 : 400 }}>
      <span style={{ color: MUTED, fontSize: 13 }}>{l}</span>
      <span style={{ fontFamily: MONO, fontSize: 13 }}>{v}</span>
    </div>
  )
}

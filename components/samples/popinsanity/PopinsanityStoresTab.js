import { useMemo, useState } from 'react'
import { wholesaleStats, storeOldestDays } from './popinsanityComputed'
import { KPI } from './PopinsanityShared'
import { money, money0, fmtInt, RED, MUTED, INK, BORDER, CREAM, UI, MONO } from './popinsanityUtils'

function CardField({ k, v }) {
  return (
    <div>
      <div className="pop-card-k">{k}</div>
      <div className="pop-card-v">{v}</div>
    </div>
  )
}

export default function PopinsanityStoresTab({ styles, openStore }) {
  const { card, lbl, big } = styles
  const ws = wholesaleStats()
  const [area, setArea] = useState('All')
  const areas = useMemo(() => ['All', ...new Set(ws.stores.map((s) => s.area))], [ws.stores])
  const rows = area === 'All' ? ws.stores : ws.stores.filter((s) => s.area === area)

  const footer = {
    salesThis: rows.reduce((s, r) => s + r.sales_this, 0),
    salesPrior: rows.reduce((s, r) => s + r.sales_prior, 0),
    owed: rows.reduce((s, r) => s + r.owed, 0),
  }

  const agingMax = Math.max(ws.aging.bucket0, ws.aging.bucket31, ws.aging.bucket61, 1)

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <KPI card={card} lbl={lbl} big={big} k="Stores carrying" v={fmtInt(ws.count)} />
        <KPI card={card} lbl={lbl} big={big} k="Wholesale sales · Oct" v={money0(ws.salesThis)} accent="#C8102E" />
        <KPI card={card} lbl={lbl} big={big} k="Owed by stores" v={money0(ws.owed)} />
        <KPI card={card} lbl={lbl} big={big} k="Past 30 days" v={money0(ws.past30)} />
      </div>

      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ ...lbl, marginBottom: '10px' }}>Open invoices by age</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: 48, marginBottom: '8px' }}>
          {[
            ['0–30 days', ws.aging.bucket0],
            ['31–60 days', ws.aging.bucket31],
            ['61–90 days', ws.aging.bucket61],
          ].map(([label, amt]) => (
            <div key={label} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ height: `${Math.max(8, (amt / agingMax) * 40)}px`, background: '#C8102E', borderRadius: 2, opacity: amt ? 1 : 0.25 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: MUTED, fontFamily: MONO }}>
          {[
            ['0–30 days', ws.aging.bucket0],
            ['31–60 days', ws.aging.bucket31],
            ['61–90 days', ws.aging.bucket61],
          ].map(([label, amt]) => (
            <div key={label} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: UI, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
              <div style={{ color: INK, marginTop: 2 }}>{money(amt)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {areas.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setArea(a)}
            style={{
              border: `1px solid ${area === a ? '#C8102E' : BORDER}`,
              background: area === a ? CREAM : 'transparent',
              borderRadius: 2,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              color: INK,
            }}
          >
            {a}
          </button>
        ))}
      </div>

      <div style={{ ...card, overflowX: 'auto' }}>
        <div className="pop-order-table-wrap">
          <table className="pop-table">
            <thead>
              <tr>
                <th className="pop-th">Store</th>
                <th className="pop-th">Area</th>
                <th className="pop-th pop-th--r">Oct sales</th>
                <th className="pop-th pop-th--r">Sep sales</th>
                <th className="pop-th pop-th--r">Owed</th>
                <th className="pop-th pop-th--r">Oldest invoice</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const oldest = storeOldestDays(s)
                return (
                  <tr key={s.name} className="pop-click" role="button" tabIndex={0} onClick={() => openStore(s.name)} onKeyDown={(e) => e.key === 'Enter' && openStore(s.name)} style={{ cursor: 'pointer' }}>
                    <td className="pop-td"><span className="pop-client-name" style={{ fontWeight: 600, fontSize: 13, marginBottom: 0 }}>{s.name}</span></td>
                    <td className="pop-td">{s.area}</td>
                    <td className="pop-td pop-td--r">{money(s.sales_this)}</td>
                    <td className="pop-td pop-td--r">{money(s.sales_prior)}</td>
                    <td className="pop-td pop-td--r">{money(s.owed)}</td>
                    <td className="pop-td pop-td--r" style={{ color: oldest != null && oldest > 60 ? RED : INK }}>{oldest != null ? `${oldest} days` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="pop-tfoot">
                <td className="pop-td" colSpan={2}>Total</td>
                <td className="pop-td pop-td--r">{money(footer.salesThis)}</td>
                <td className="pop-td pop-td--r">{money(footer.salesPrior)}</td>
                <td className="pop-td pop-td--r">{money(footer.owed)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="pop-order-cards">
          {rows.map((s) => {
            const oldest = storeOldestDays(s)
            return (
              <button key={s.name} type="button" className="pop-order-card" onClick={() => openStore(s.name)}>
                <div className="pop-card-title pop-client-name">{s.name}</div>
                <div className="pop-order-sub">{s.area}</div>
                <div className="pop-card-grid" style={{ marginTop: 10 }}>
                  <CardField k="Oct sales" v={money(s.sales_this)} />
                  <CardField k="Sep sales" v={money(s.sales_prior)} />
                  <CardField k="Owed" v={money(s.owed)} />
                  <CardField k="Oldest" v={oldest != null ? `${oldest} days` : '—'} />
                </div>
              </button>
            )
          })}
          <div className="pop-order-card" style={{ cursor: 'default' }}>
            <div className="pop-card-title">Total</div>
            <div className="pop-card-grid">
              <CardField k="Oct sales" v={money(footer.salesThis)} />
              <CardField k="Sep sales" v={money(footer.salesPrior)} />
              <CardField k="Owed" v={money(footer.owed)} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

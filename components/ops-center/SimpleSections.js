import { OPS_SAMPLE } from '../../data/ops-center-sample.js'
import { formatMoney } from './utils'

function MobileRowCard({ headers, row }) {
  return (
    <div className="border-t border-[#c5d0d6]/30 px-3 py-3 first:border-t-0">
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 text-xs">
        {headers.map((h) => (
          <div key={h.key} className="contents">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#5c7280]">{h.label}</dt>
            <dd
              className={`text-right text-[#2f4049] ${h.money || h.align === 'right' ? 'tabular-nums whitespace-nowrap' : 'break-words'}`}
            >
              {h.money ? formatMoney(row[h.key]) : row[h.key]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function MobileFooter({ headers, foot, footerCols }) {
  return (
    <div className="border-t-2 border-[#c5d0d6]/50 bg-[#e8eef1]/40 px-3 py-3">
      <p className="mb-2 text-xs font-semibold">Total</p>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 text-xs font-semibold">
        {footerCols.map(({ col, sumKey }) => {
          const h = headers.find((x) => x.key === col)
          if (!h) return null
          return (
            <div key={col} className="contents">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#5c7280]">{h.label}</dt>
              <dd className="text-right tabular-nums whitespace-nowrap">{formatMoney(foot[sumKey])}</dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

function SimpleCard({ title, headers, rows, footerCols }) {
  const foot = footerCols.reduce(
    (acc, col) => {
      if (col.sumKey) acc[col.sumKey] = rows.reduce((s, r) => s + (r[col.sumKey] || 0), 0)
      return acc
    },
    {},
  )

  return (
    <section className="ops-card mt-10 overflow-hidden">
      <div className="border-b border-[#c5d0d6]/40 bg-[#e8eef1]/30 px-4 py-3 sm:px-5">
        <h2 className="ops-heading text-lg font-semibold text-[#2f4049]">{title}</h2>
      </div>
      <div className="sm:hidden">
        {rows.map((row, i) => (
          <MobileRowCard key={i} headers={headers} row={row} />
        ))}
        <MobileFooter headers={headers} foot={foot} footerCols={footerCols} />
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="ops-table ops-obligations-table w-full sm:min-w-[480px]">
          <thead>
            <tr className="bg-[#e8eef1]/50 text-[10px] font-semibold uppercase tracking-wide text-[#5c7280]">
              {headers.map((h) => (
                <th key={h.key} className={`px-3 py-2 ${h.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-[#c5d0d6]/30">
                {headers.map((h) => (
                  <td
                    key={h.key}
                    className={`px-3 py-2 text-sm text-[#2f4049] ${h.align === 'right' || h.money ? 'ops-num-cell text-right tabular-nums' : ''}`}
                  >
                    {h.money ? formatMoney(row[h.key]) : row[h.key]}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 border-[#c5d0d6]/50 bg-[#e8eef1]/40 font-semibold">
              {headers.map((h, i) => {
                if (i === 0) return <td key={h.key} className="px-3 py-2 text-sm">Total</td>
                const sumKey = footerCols.find((f) => f.col === h.key)?.sumKey
                if (!sumKey) return <td key={h.key} className="px-3 py-2" />
                return (
                  <td key={h.key} className="ops-num-cell px-3 py-2 text-right text-sm tabular-nums">
                    {formatMoney(foot[sumKey])}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function FixedObligations() {
  const headers = [
    { key: 'entity', label: 'Entity' },
    { key: 'obligation', label: 'Obligation' },
    { key: 'lender', label: 'Lender' },
    { key: 'payment', label: 'Payment', align: 'right', money: true },
    { key: 'rate', label: 'Rate' },
    { key: 'balance', label: 'Balance', align: 'right', money: true },
  ]
  return (
    <SimpleCard
      title="Fixed obligations"
      headers={headers}
      rows={OPS_SAMPLE.obligations}
      footerCols={[
        { col: 'payment', sumKey: 'payment' },
        { col: 'balance', sumKey: 'balance' },
      ]}
    />
  )
}

export function RentalBuildings() {
  const headers = [
    { key: 'entity', label: 'Entity' },
    { key: 'building', label: 'Building' },
    { key: 'rent', label: 'Rent', align: 'right', money: true },
    { key: 'debtSvc', label: 'Debt svc', align: 'right', money: true },
    { key: 'net', label: 'Net', align: 'right', money: true },
    { key: 'balance', label: 'Balance', align: 'right', money: true },
  ]
  return (
    <SimpleCard
      title="Rental buildings"
      headers={headers}
      rows={OPS_SAMPLE.buildings}
      footerCols={[
        { col: 'rent', sumKey: 'rent' },
        { col: 'debtSvc', sumKey: 'debtSvc' },
        { col: 'net', sumKey: 'net' },
        { col: 'balance', sumKey: 'balance' },
      ]}
    />
  )
}

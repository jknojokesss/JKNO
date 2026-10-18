import { useEffect, useMemo, useState } from 'react'
import { money, pct1, pctOf, fmtD, fmtInt } from './mrDipzUtils'
import { Card, KPI, MdTable } from './MrDipzKit'

const STATUS_FILTER = {
  all: () => true,
  open: (r) => r.status === 'needs-backup' || r.status === 'dispute',
  matched: (r) => r.status === 'matched',
  'needs-backup': (r) => r.status === 'needs-backup',
  dispute: (r) => r.status === 'dispute',
}

export default function MrDipzDeductions({ model, open, initialFilter }) {
  const d = model.deductions
  const [filter, setFilter] = useState(initialFilter || 'all')

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter)
  }, [initialFilter])

  const rows = useMemo(() => {
    const fn = STATUS_FILTER[filter] || STATUS_FILTER.all
    return [...d.rows].filter(fn).sort((a, b) => b.remittanceDate.localeCompare(a.remittanceDate) || a.ref.localeCompare(b.ref))
  }, [d.rows, filter])

  const filteredTotal = useMemo(() => rows.reduce((t, r) => t + r.amount, 0), [rows])

  return (
    <>
      <div className="md-kpis" style={{ marginBottom: 12 }}>
        <KPI k="TOTAL DEDUCTED" v={money(d.summary.total)} onClick={() => setFilter('all')} />
        <KPI k="MATCHED" v={money(d.summary.matched)} onClick={() => setFilter('matched')} />
        <KPI k="NEEDS BACKUP" v={money(d.summary.needsBackup)} onClick={() => setFilter('needs-backup')} />
        <KPI k="DISPUTE" v={money(d.summary.dispute)} onClick={() => setFilter('dispute')} />
      </div>

      <Card title="Remittances · last 90 days">
        <MdTable
          columns={['Deduction', 'Remit', 'Invoice', 'Code', 'Amount', 'Days', 'Status']}
          rows={[
            ...rows.map((r) => ({
              key: r.id,
              name: r.ref,
              sub: `#${r.invoiceNo} · ${fmtD(r.invoiceDate)} · ${money(r.invoiceAmount)}`,
              cells: [fmtD(r.remittanceDate), `#${r.invoiceNo}`, r.code, money(r.amount), fmtInt(r.daysLeft), r.statusLabel],
              onClick: () => open({ type: 'deduction', id: r.id }),
            })),
            {
              key: 'total',
              kind: 'total',
              name: filter === 'all' ? 'Total' : 'Filtered total',
              cells: ['', '', '', money(filter === 'all' ? d.summary.total : filteredTotal), '', ''],
            },
          ]}
          stackAt={5}
        />
      </Card>

      <Card title="Expired % by flavor">
        <MdTable
          columns={['Flavor', 'Sold', 'Expired', 'Expired %']}
          rows={[
            ...model.expiredByFlavor.map((r) => ({
              key: r.productId,
              name: r.name,
              cells: [fmtInt(r.sold), fmtInt(r.expired), pct1(r.expiredPct)],
              onClick: () => open({ type: 'productCredit', id: r.productId }),
            })),
            {
              key: 'total',
              kind: 'total',
              name: 'Total',
              cells: [
                fmtInt(model.totals.units),
                fmtInt(model.totals.expUnits),
                pct1(pctOf(model.totals.expUnits, model.totals.units)),
              ],
              onClick: () => open({ type: 'pnl', id: 'credits' }),
            },
          ]}
        />
      </Card>
    </>
  )
}

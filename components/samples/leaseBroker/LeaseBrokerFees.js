import { useMemo, useState } from 'react'
import { fmtD, moneyOrDash } from './leaseBrokerUtils'
import { feesCollectedThisMonth, feesOwedTotal } from './leaseBrokerModel'
import { canMarkFeePaid, feeStatusLabel } from './leaseBrokerFeeStatus'

export default function LeaseBrokerFees({ deals, meta, ready, openDeal, onMarkFeePaid }) {
  const [sort, setSort] = useState({ key: 'owed', dir: 'desc' })
  const [q, setQ] = useState('')

  const owedTotal = feesOwedTotal(deals)
  const collectedMonth = feesCollectedThisMonth(deals, meta.as_of)

  const rows = useMemo(() => {
    const all = deals.map((d) => ({
      id: d.id,
      client: d.client.name,
      amount: d.fee.amount,
      paid: d.fee.paid,
      paid_date: d.fee.paid_date,
      statusLabel: feeStatusLabel(d),
      markPaid: canMarkFeePaid(d),
    }))
    const filtered = q.trim()
      ? all.filter((r) => r.client.toLowerCase().includes(q.trim().toLowerCase()))
      : all
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sort.key === 'client') return a.client.localeCompare(b.client) * dir
      if (sort.key === 'amount') return (a.amount - b.amount) * dir
      if (sort.key === 'paid') return a.statusLabel.localeCompare(b.statusLabel) * dir
      if (sort.key === 'owed') {
        const rank = (r) => (r.statusLabel === 'Owed' ? r.amount : 0)
        return (rank(a) - rank(b)) * dir
      }
      return 0
    })
  }, [deals, q, sort])

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 16 }}>
        <div className="lb-card" style={{ marginBottom: 0 }}>
          <h2 className="lb-section-h" style={{ fontSize: 16 }}>Owed now</h2>
          <div className="lb-kpi-val lb-num">{moneyOrDash(owedTotal, ready)}</div>
        </div>
        <div className="lb-card" style={{ marginBottom: 0 }}>
          <h2 className="lb-section-h" style={{ fontSize: 16 }}>Collected this month</h2>
          <div className="lb-kpi-val lb-num">{moneyOrDash(collectedMonth, ready)}</div>
        </div>
      </div>

      <input
        className="lb-inp lb-search"
        placeholder="Search client"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search fees"
      />

      <div className="lb-card lb-card--flush">
        <div className="lb-show-desktop lb-scroll">
          <table className="lb-table lb-table--wide">
            <thead>
              <tr>
                <th>
                  <button type="button" className="lb-link-btn" onClick={() => toggleSort('client')}>Client</button>
                </th>
                <th className="lb-num">
                  <button type="button" className="lb-link-btn" onClick={() => toggleSort('amount')}>Fee</button>
                </th>
                <th>Status</th>
                <th>Date paid</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <button type="button" className="lb-link-btn lb-card-title" onClick={() => openDeal(r.id)}>
                      {r.client}
                    </button>
                  </td>
                  <td className="lb-num">{moneyOrDash(r.amount, ready)}</td>
                  <td>{r.statusLabel}</td>
                  <td className="lb-tabnum">{r.paid ? fmtD(r.paid_date) : '—'}</td>
                  <td className="lb-num">
                    {r.markPaid ? (
                      <button type="button" className="lb-btn lb-btn--quiet" onClick={() => onMarkFeePaid(r.id)}>
                        Mark paid
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lb-show-mobile lb-stack">
          {rows.map((r) => (
            <div key={r.id} className="lb-stack-row">
              <div className="lb-stack-line1">
                <button type="button" className="lb-link-btn" onClick={() => openDeal(r.id)}>
                  {r.client}
                </button>
                <span className="lb-num">{moneyOrDash(r.amount, ready)}</span>
              </div>
              <div className="lb-stack-line3">
                <span>{r.statusLabel}</span>
                <span className="lb-meta lb-tabnum">{r.paid ? fmtD(r.paid_date) : '—'}</span>
              </div>
              {r.markPaid ? (
                <button type="button" className="lb-btn lb-btn--quiet" style={{ marginTop: 8, width: '100%' }} onClick={() => onMarkFeePaid(r.id)}>
                  Mark paid
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

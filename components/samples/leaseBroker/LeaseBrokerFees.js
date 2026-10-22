import { useMemo, useState } from 'react'
import { GREEN, INK, MUTED, fmtD, moneyOrDash } from './leaseBrokerUtils'
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
      stage: d.stage,
      statusLabel: feeStatusLabel(d),
      markPaid: canMarkFeePaid(d),
      deal: d,
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

  const statusColor = (label) => {
    if (label === 'Paid') return GREEN
    if (label === 'Owed') return INK
    return MUTED
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
        <div className="lb-card" style={{ marginBottom: 0 }}>
          <div className="lb-lbl">Owed now</div>
          <div style={{ fontSize: 26, fontWeight: 700 }} className="lb-num">{moneyOrDash(owedTotal, ready)}</div>
        </div>
        <div className="lb-card" style={{ marginBottom: 0 }}>
          <div className="lb-lbl">Collected this month</div>
          <div style={{ fontSize: 26, fontWeight: 700 }} className="lb-num">{moneyOrDash(collectedMonth, ready)}</div>
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
                  <button type="button" className="lb-btn lb-btn--ghost" style={{ border: 'none', padding: 0, minHeight: 0, fontSize: 10, fontWeight: 600 }} onClick={() => toggleSort('client')}>
                    Client
                  </button>
                </th>
                <th className="lb-num">
                  <button type="button" className="lb-btn lb-btn--ghost" style={{ border: 'none', padding: 0, minHeight: 0, fontSize: 10, fontWeight: 600 }} onClick={() => toggleSort('amount')}>
                    Fee
                  </button>
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
                    <button type="button" className="lb-btn lb-btn--ghost" style={{ padding: 0, minHeight: 0, border: 'none', fontWeight: 600, color: INK }} onClick={() => openDeal(r.id)}>
                      {r.client}
                    </button>
                  </td>
                  <td className="lb-num">{moneyOrDash(r.amount, ready)}</td>
                  <td style={{ color: statusColor(r.statusLabel), fontWeight: 600, fontSize: 13 }}>{r.statusLabel}</td>
                  <td>{r.paid ? fmtD(r.paid_date) : '—'}</td>
                  <td className="lb-num">
                    {r.markPaid ? (
                      <button type="button" className="lb-btn" style={{ fontSize: 12, padding: '5px 10px', minHeight: 32 }} onClick={() => onMarkFeePaid(r.id)}>
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
                <button type="button" className="lb-btn lb-btn--ghost" style={{ padding: 0, minHeight: 0, border: 'none', fontWeight: 600, color: INK }} onClick={() => openDeal(r.id)}>
                  {r.client}
                </button>
                <span className="lb-num">{moneyOrDash(r.amount, ready)}</span>
              </div>
              <div className="lb-stack-line3">
                <span style={{ fontWeight: 600, color: statusColor(r.statusLabel) }}>{r.statusLabel}</span>
                <span style={{ color: MUTED }}>{r.paid ? fmtD(r.paid_date) : '—'}</span>
              </div>
              {r.markPaid ? (
                <button type="button" className="lb-btn" style={{ marginTop: 8, width: '100%' }} onClick={() => onMarkFeePaid(r.id)}>
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

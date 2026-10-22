import { useMemo, useState } from 'react'
import { GREEN, INK, MUTED, RED, fmtD, moneyOrDash } from './leaseBrokerUtils'
import { feesCollectedThisMonth, feesOwed, feesOwedTotal } from './leaseBrokerModel'

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
    }))
    const filtered = q.trim()
      ? all.filter((r) => r.client.toLowerCase().includes(q.trim().toLowerCase()))
      : all
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sort.key === 'client') return a.client.localeCompare(b.client) * dir
      if (sort.key === 'amount') return (a.amount - b.amount) * dir
      if (sort.key === 'paid') return (Number(a.paid) - Number(b.paid)) * dir
      if (sort.key === 'owed') {
        const ao = a.paid ? 0 : a.amount
        const bo = b.paid ? 0 : b.amount
        return (ao - bo) * dir
      }
      return 0
    })
  }, [deals, q, sort])

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  const owed = feesOwed(deals)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
        <div className="lb-card" style={{ marginBottom: 0 }}>
          <div className="lb-lbl">Owed now</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: RED }} className="lb-num">{moneyOrDash(owedTotal, ready)}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{owed.length} deal{owed.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="lb-card" style={{ marginBottom: 0 }}>
          <div className="lb-lbl">Collected this month</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: GREEN }} className="lb-num">{moneyOrDash(collectedMonth, ready)}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Through {fmtD(meta.as_of)}</div>
        </div>
      </div>

      <input
        className="lb-inp lb-search"
        placeholder="Search client"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search fees"
      />

      <div className="lb-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="lb-table">
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
                <td style={{ color: r.paid ? GREEN : RED, fontWeight: 600, fontSize: 13 }}>{r.paid ? 'Paid' : 'Owed'}</td>
                <td>{r.paid ? fmtD(r.paid_date) : '—'}</td>
                <td className="lb-num">
                  {!r.paid ? (
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
    </div>
  )
}

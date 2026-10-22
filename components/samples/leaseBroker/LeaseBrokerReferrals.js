import { useMemo, useState } from 'react'
import { INK, fmtPhone } from './leaseBrokerUtils'
import { referralCounts } from './leaseBrokerModel'

export default function LeaseBrokerReferrals({ deals, referrers, openDeal }) {
  const [q, setQ] = useState('')
  const counts = referralCounts(deals, referrers)

  const rows = useMemo(() => {
    const filtered = q.trim() ? counts.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase())) : counts
    return [...filtered].sort((a, b) => b.count - a.count)
  }, [counts, q])

  const clientsByReferrer = useMemo(() => {
    const map = new Map()
    referrers.forEach((r) => map.set(r.id, []))
    deals.forEach((d) => {
      if (d.referrer_id && map.has(d.referrer_id)) map.get(d.referrer_id).push(d)
    })
    return map
  }, [deals, referrers])

  return (
    <div>
      <input className="lb-inp lb-search" placeholder="Search referrer" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="lb-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="lb-table">
          <thead>
            <tr>
              <th>Referrer</th>
              <th>Phone</th>
              <th className="lb-num">Deals</th>
              <th>Recent clients</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const linked = (clientsByReferrer.get(r.id) || []).slice(-3).reverse()
              return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{fmtPhone(r.phone)}</td>
                  <td className="lb-num" style={{ fontWeight: 700 }}>{r.count}</td>
                  <td>
                    {linked.length === 0 ? (
                      '—'
                    ) : (
                      <span style={{ fontSize: 13 }}>
                        {linked.map((d, i) => (
                          <span key={d.id}>
                            {i > 0 ? ', ' : ''}
                            <button
                              type="button"
                              className="lb-btn lb-btn--ghost"
                              style={{ padding: 0, minHeight: 0, border: 'none', color: INK, fontWeight: 500 }}
                              onClick={() => openDeal(d.id)}
                            >
                              {d.client.name}
                            </button>
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { fmtPhone } from './leaseBrokerUtils'
import { referralCounts } from './leaseBrokerModel'
import LeaseBrokerClientList from './LeaseBrokerClientList'

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
      <input className="lb-inp lb-search" placeholder="Search referrer" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search referrer" />

      <div className="lb-card lb-card--flush">
        <div className="lb-show-desktop lb-scroll">
          <table className="lb-table lb-table--wide">
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
                    <td className="lb-card-title">{r.name}</td>
                    <td className="lb-tabnum">{fmtPhone(r.phone)}</td>
                    <td className="lb-num">{r.count}</td>
                    <td>
                      <LeaseBrokerClientList clients={linked} onOpen={openDeal} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="lb-show-mobile lb-stack">
          {rows.map((r) => {
            const linked = (clientsByReferrer.get(r.id) || []).slice(-3).reverse()
            return (
              <div key={r.id} className="lb-stack-row">
                <div className="lb-stack-line1">
                  <span>{r.name}</span>
                  <span className="lb-num">{r.count}</span>
                </div>
                <div className="lb-stack-line2 lb-tabnum">{fmtPhone(r.phone)}</div>
                <div className="lb-stack-line3" style={{ justifyContent: 'flex-start' }}>
                  <LeaseBrokerClientList clients={linked} onOpen={openDeal} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

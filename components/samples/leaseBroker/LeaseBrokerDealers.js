import { useMemo, useState } from 'react'
import { fmtD, fmtPhone } from './leaseBrokerUtils'

export default function LeaseBrokerDealers({ dealers, onAddDealer }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: 'last_quote_date', dir: 'desc' })

  const rows = useMemo(() => {
    const filtered = q.trim()
      ? dealers.filter(
          (d) =>
            d.name.toLowerCase().includes(q.trim().toLowerCase()) ||
            d.salesperson.toLowerCase().includes(q.trim().toLowerCase()) ||
            d.brands.some((b) => b.toLowerCase().includes(q.trim().toLowerCase()))
        )
      : dealers
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const va = a[sort.key]
      const vb = b[sort.key]
      if (sort.key === 'last_quote_date') {
        const sa = va || ''
        const sb = vb || ''
        return sa.localeCompare(sb) * dir
      }
      if (typeof va === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }, [dealers, q, sort])

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <input className="lb-inp lb-search" style={{ flex: 1, minWidth: 200, marginBottom: 0 }} placeholder="Search dealer, rep, or brand" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="lb-btn lb-btn--primary" onClick={onAddDealer}>Add dealer</button>
      </div>

      <div className="lb-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="lb-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="lb-btn lb-btn--ghost" style={{ border: 'none', padding: 0, minHeight: 0, fontSize: 10 }} onClick={() => toggleSort('name')}>Dealer</button>
              </th>
              <th>Salesperson</th>
              <th>Brands</th>
              <th>Phone</th>
              <th className="lb-num">
                <button type="button" className="lb-btn lb-btn--ghost" style={{ border: 'none', padding: 0, minHeight: 0, fontSize: 10 }} onClick={() => toggleSort('last_quote_date')}>Last quote</button>
              </th>
              <th className="lb-num">
                <button type="button" className="lb-btn lb-btn--ghost" style={{ border: 'none', padding: 0, minHeight: 0, fontSize: 10 }} onClick={() => toggleSort('deals_closed')}>Closed</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td>{d.salesperson || '—'}</td>
                <td>{d.brands.join(', ')}</td>
                <td>{fmtPhone(d.phone)}</td>
                <td className="lb-num">{d.last_quote_date ? fmtD(d.last_quote_date) : '—'}</td>
                <td className="lb-num">{d.deals_closed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

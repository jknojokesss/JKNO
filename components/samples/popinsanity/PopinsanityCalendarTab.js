import { useMemo } from 'react'
import { cashByMonthKey, monthLabel } from './popinsanityComputed'
import { ClickRow } from './PopinsanityShared'
import { money, moneyK, fmtD, sumBy, SPICE, UI, MUTED, BORDER, CARDBG } from './popinsanityUtils'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildMonthGrid(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  const first = new Date(Date.UTC(y, m - 1, 1))
  const startDow = first.getUTCDay()
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push({ muted: true })
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${monthKey}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, iso, muted: false })
  }
  while (cells.length % 7 !== 0) cells.push({ muted: true })
  return cells
}

export default function PopinsanityCalendarTab({ styles, monthKey, setMonthKey, openDay, openOrder }) {
  const { card, lbl, btn } = styles
  const { map, keys } = cashByMonthKey()
  const items = map[monthKey] || []
  const monthTotal = sumBy(items, 'amount')
  const byDate = useMemo(() => {
    const g = {}
    items.forEach((it) => {
      if (!g[it.date]) g[it.date] = []
      g[it.date].push(it)
    })
    return g
  }, [items])
  const cells = buildMonthGrid(monthKey)
  const idx = keys.indexOf(monthKey)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={idx <= 0}
          onClick={() => setMonthKey(keys[idx - 1])}
          style={{ ...btn, padding: '8px 14px', border: `1px solid ${BORDER}`, background: CARDBG, borderRadius: 2, opacity: idx <= 0 ? 0.4 : 1 }}
        >
          Prev
        </button>
        <span style={{ fontFamily: UI, fontWeight: 700, fontSize: 16, minWidth: 100, textAlign: 'center' }}>{monthLabel(monthKey)}</span>
        <button
          type="button"
          disabled={idx >= keys.length - 1}
          onClick={() => setMonthKey(keys[idx + 1])}
          style={{ ...btn, padding: '8px 14px', border: `1px solid ${BORDER}`, background: CARDBG, borderRadius: 2, opacity: idx >= keys.length - 1 ? 0.4 : 1 }}
        >
          Next
        </button>
        <span style={{ marginLeft: 'auto', fontFamily: UI, fontWeight: 600 }}>{money(monthTotal)}</span>
      </div>
      <div style={{ ...card, marginBottom: 16 }}>
        <div className="pop-cal-grid">
          {DOW.map((d) => <div key={d} className="pop-cal-dow">{d}</div>)}
          {cells.map((c, i) => {
            if (c.muted) return <div key={i} className="pop-cal-cell pop-cal-cell--muted">·</div>
            const dayItems = byDate[c.iso]
            const amt = dayItems ? sumBy(dayItems, 'amount') : 0
            if (!amt) {
              return (
                <div key={c.iso} className="pop-cal-cell" style={{ color: MUTED, fontSize: 10 }}>
                  <div>{c.day}</div>
                </div>
              )
            }
            return (
              <button
                key={c.iso}
                type="button"
                className="pop-cal-cell pop-cal-cell--due"
                onClick={() => openDay(c.iso, dayItems)}
                style={{ border: `1px solid ${BORDER}`, background: CARDBG, cursor: 'pointer', width: '100%' }}
              >
                <div style={{ fontSize: 10, color: MUTED }}>{c.day}</div>
                <div style={{ color: SPICE, fontWeight: 600 }}>{moneyK(amt)}</div>
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ ...card, overflowX: 'auto' }}>
        <div style={{ ...lbl, marginBottom: 8 }}>Due this month</div>
        <table className="pop-table">
          <thead>
            <tr>
              <th className="pop-th">Date</th>
              <th className="pop-th">Client</th>
              <th className="pop-th">Type</th>
              <th className="pop-th pop-th--r">Amount</th>
            </tr>
          </thead>
          <tbody>
            {[...items].sort((a, b) => a.date.localeCompare(b.date)).map((it, i) => (
              <ClickRow key={i} onClick={() => openOrder(it.orderId)}>
                <td className="pop-td">{fmtD(it.date)}</td>
                <td className="pop-td"><span className="pop-client-name" style={{ fontWeight: 600, fontSize: 13, marginBottom: 0 }}>{it.client}</span></td>
                <td className="pop-td">{it.type}</td>
                <td className="pop-td pop-td--r">{money(it.amount)}</td>
              </ClickRow>
            ))}
          </tbody>
          <tfoot>
            <tr className="pop-tfoot">
              <td className="pop-td" colSpan={3}>Total</td>
              <td className="pop-td pop-td--r">{money(monthTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}

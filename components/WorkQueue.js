import { useState, useMemo } from 'react'

// ── Who to chase today ───────────────────────────────────────────────────
// The front door for a book too big to read. Not 7,000 invoices — a short
// list of customers who owe money, worst first, each one action wide.
// "Last chased" is the portal's own log (QuickBooks doesn't know an email
// went out), which is what stops the same customer being chased twice on
// Tuesday and nobody being chased on Thursday.

const INK = '#1A1A1A', BORDER = '#E5E5E5', MUTED = '#777', RED = '#CC2222', GREEN = '#1E7A3A'
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const btn = (primary) => ({
  fontSize: '12px', fontWeight: 600, padding: '7px 12px', borderRadius: '4px', cursor: 'pointer',
  border: primary ? 'none' : `1px solid ${BORDER}`, background: primary ? INK : '#fff', color: primary ? '#fff' : INK,
})
const td = () => ({ padding: '9px 10px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'middle' })

const daysSince = (iso) => Math.floor((Date.now() - Date.parse(iso)) / 86400000)

export default function WorkQueue({ rows, onStatement, onPreview, busy, onSeeAll }) {
  const [show, setShow] = useState(20)
  const [staleOnly, setStaleOnly] = useState(false)

  const list = useMemo(() => {
    const out = staleOnly
      ? rows.filter((r) => !r.lastSent || daysSince(r.lastSent.at) >= 30)
      : rows
    // Worst first: most money that is actually late.
    return [...out].sort((a, b) => b.pastDue - a.pastDue || b.balance - a.balance)
  }, [rows, staleOnly])

  const totalPastDue = list.reduce((t, r) => t + r.pastDue, 0)
  const neverChased = rows.filter((r) => !r.lastSent).length

  if (!rows.length) {
    return <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '18px', fontSize: '13px', color: MUTED }}>
      Nobody owes you anything right now.
    </div>
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '17px' }}>
          {list.length.toLocaleString()} customer{list.length === 1 ? '' : 's'} owe you {money(totalPastDue)} past due
        </h2>
        <span style={{ flex: 1 }} />
        <label style={{ fontSize: '12.5px', color: MUTED, display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input type="checkbox" checked={staleOnly} onChange={(e) => { setStaleOnly(e.target.checked); setShow(20) }} />
          Not chased in 30 days
        </label>
        <button onClick={onSeeAll} style={btn(false)}>See every invoice</button>
      </div>
      <p style={{ fontSize: '12.5px', color: MUTED, lineHeight: 1.6, marginBottom: '12px', maxWidth: '640px' }}>
        Worst first, by how much is actually late.{neverChased > 0 && <> {neverChased} of them {neverChased === 1 ? 'has' : 'have'} never been sent a statement from here.</>}
      </p>

      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
          <thead><tr>
            {['Customer', 'Past due', 'Total open', 'Oldest', 'Last chased', ''].map((h, k) => (
              <th key={k} style={{ textAlign: k === 1 || k === 2 || k === 3 ? 'right' : 'left', padding: '8px 10px', borderBottom: `1px solid ${INK}`, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', color: MUTED, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {list.slice(0, show).map((r) => {
              const chased = r.lastSent ? daysSince(r.lastSent.at) : null
              return (
                <tr key={r.id}>
                  <td style={td()}>
                    <b>{r.name}</b>
                    {!r.email && <div style={{ fontSize: '11px', color: RED }}>no email on file</div>}
                  </td>
                  <td style={{ ...td(), textAlign: 'right', fontWeight: 700, color: r.pastDue > 0 ? INK : MUTED }}>
                    {r.pastDue > 0 ? money(r.pastDue) : '—'}
                  </td>
                  <td style={{ ...td(), textAlign: 'right' }}>{money(r.balance)}</td>
                  <td style={{ ...td(), textAlign: 'right', color: r.oldestDays > 60 ? RED : MUTED }}>
                    {r.oldestDays > 0 ? `${r.oldestDays}d` : 'current'}
                  </td>
                  <td style={{ ...td(), color: chased === null ? RED : chased >= 30 ? INK : GREEN }}>
                    {chased === null ? 'never' : chased === 0 ? 'today' : `${chased}d ago`}
                  </td>
                  <td style={{ ...td(), whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button onClick={() => onPreview(r)} disabled={busy === 'stmt' + r.id} style={btn(false)}>
                      {busy === 'stmt' + r.id ? '…' : 'Preview'}
                    </button>{' '}
                    <button onClick={() => onStatement(r)} style={btn(true)}>Send statement →</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {list.length > show && (
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${BORDER}` }}>
            <button onClick={() => setShow((n) => n + 40)} style={btn(false)}>
              Show 40 more ({(list.length - show).toLocaleString()} left)
            </button>
          </div>
        )}
        {list.length === 0 && (
          <div style={{ padding: '16px', fontSize: '13px', color: MUTED }}>
            Everyone here has been chased in the last 30 days.
          </div>
        )}
      </div>
    </div>
  )
}

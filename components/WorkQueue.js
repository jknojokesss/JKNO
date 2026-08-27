import React, { useState, useMemo, useEffect } from 'react'
import useIsPhone from './useIsPhone'
import { loadView, saveView } from './viewState'

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
const th = (right) => ({
  textAlign: right ? 'right' : 'left', padding: '8px 10px', borderBottom: `1px solid ${INK}`,
  fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap',
})

// `f` holds the filters a saved view can capture, owned by the page so a
// view can restore this screen as well as the invoice one. Everything else
// here — what is expanded, how far down, what is ticked — is ephemeral and
// stays local.
export default function WorkQueue({ rows, onStatement, onPreview, busy, onSeeAll, onInvoicePdf, onInvoiceEmail, onPrintAll, toolbar, f, setF }) {
  const [show, setShow] = useState(20)
  const { wq, only, staleOnly, sort, dir } = f
  const setWq = (v) => setF({ wq: v })
  const setOnly = (v) => setF({ only: v })
  const setStaleOnly = (v) => setF({ staleOnly: v })
  const setSort = (v) => setF({ sort: v })
  const setDir = (v) => setF({ dir: typeof v === 'function' ? v(dir) : v })
  const [open, setOpen] = useState(null)
  const [picked, setPicked] = useState(new Set())
  const phone = useIsPhone()
  const [showFilters, setShowFilters] = useState(false)

  // The queue's own view: which customer was open, how far down the list she
  // had gone, what she had filtered to.
  useEffect(() => {
    const v = loadView('portal-queue')
    if (!v) return
    if (v.open) setOpen(v.open)
    if (v.show) setShow(v.show)
  }, [])
  useEffect(() => { saveView('portal-queue', { open, show }) }, [open, show])

  const list = useMemo(() => {
    const needle = wq.trim().toLowerCase()
    let out = needle ? rows.filter((r) => r.name.toLowerCase().includes(needle)) : rows
    if (staleOnly) out = out.filter((r) => !r.lastSent || daysSince(r.lastSent.at) >= 30)
    if (only === 'pastdue') out = out.filter((r) => r.pastDue > 0)
    if (only === 'current') out = out.filter((r) => r.pastDue === 0)
    if (only === 'never') out = out.filter((r) => !r.lastSent)
    const cmp = {
      name: (a, b) => a.name.localeCompare(b.name),
      pastDue: (a, b) => a.pastDue - b.pastDue || a.balance - b.balance,
      balance: (a, b) => a.balance - b.balance,
      oldest: (a, b) => a.oldestDays - b.oldestDays,
      // Never chased sorts as infinitely stale, so it leads on 'longest since'.
      chased: (a, b) => (a.lastSent ? daysSince(a.lastSent.at) : 1e9) - (b.lastSent ? daysSince(b.lastSent.at) : 1e9),
    }
    const base = cmp[sort] || cmp.pastDue
    return [...out].sort((a, b) => (dir === 'asc' ? base(a, b) : -base(a, b)))
  }, [rows, staleOnly, wq, sort, dir, only])

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
        {/* The tabs already lead to the invoice list; on a phone that button
            is a row of screen for nothing. */}
        {!phone && <button onClick={onSeeAll} style={btn(false)}>See every invoice</button>}
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
        <input value={wq} onChange={(e) => { setWq(e.target.value); setShow(20) }} placeholder="Search customer"
          style={{ fontSize: '14px', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: '4px', flex: 1, minWidth: 0 }} />
        {phone && (
          <button onClick={() => setShowFilters((f) => !f)} style={{ ...btn(false), whiteSpace: 'nowrap' }}>
            Filters{(only !== 'all' || staleOnly) ? ' •' : ''}
          </button>
        )}
      </div>

      <div style={{ display: (phone && !showFilters) ? 'none' : 'flex', gap: '8px', alignItems: 'center',
                    flexWrap: 'wrap', marginBottom: '10px' }}>
        {toolbar}
        {[['all', 'Everyone'], ['pastdue', 'Past due'], ['current', 'Not yet due'], ['never', 'Never chased']].map(([k, label]) => (
          <button key={k} onClick={() => { setOnly(k); setShow(20) }} style={{
            fontSize: '12px', padding: '6px 11px', borderRadius: '14px', cursor: 'pointer',
            border: `1px solid ${only === k ? INK : BORDER}`, background: only === k ? INK : '#fff',
            color: only === k ? '#fff' : INK, fontWeight: only === k ? 700 : 500,
          }}>{label}</button>
        ))}
        <label style={{ fontSize: '12.5px', color: MUTED, display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input type="checkbox" checked={staleOnly} onChange={(e) => { setStaleOnly(e.target.checked); setShow(20) }} />
          Not chased in 30 days
        </label>
        <span style={{ flex: 1 }} />
        <button onClick={() => onPrintAll(list.map((r) => r.id))} disabled={busy === 'stmtall' || !list.length} style={btn(false)}>
          {busy === 'stmtall' ? 'Building…' : `Print ${list.length.toLocaleString()} statement${list.length === 1 ? '' : 's'}`}
        </button>
      </div>

      {picked.size > 0 && (() => {
        const rowsPicked = list.filter((r) => picked.has(r.id))
        const total = rowsPicked.reduce((t, r) => t + r.balance, 0)
        return (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
                        border: `1px solid ${INK}`, borderRadius: '4px', padding: '10px 12px', marginBottom: '10px' }}>
            <b style={{ fontSize: '13px' }}>{rowsPicked.length} customer{rowsPicked.length === 1 ? '' : 's'} selected · {money(total)}</b>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: '12px', color: MUTED }}>
              Emailing a batch at once needs one-click send — for now, print these or send them one at a time.
            </span>
            <button onClick={() => setPicked(new Set())} style={btn(false)}>Clear</button>
            <button onClick={() => onPrintAll(rowsPicked.map((r) => r.id))} disabled={busy === 'stmtall'} style={btn(true)}>
              {busy === 'stmtall' ? 'Building…' : `Print ${rowsPicked.length} statement${rowsPicked.length === 1 ? '' : 's'}`}
            </button>
          </div>
        )
      })()}
      <p style={{ fontSize: '12.5px', color: MUTED, lineHeight: 1.6, marginBottom: '12px', maxWidth: '640px' }}>
        Worst first, by how much is actually late.{neverChased > 0 && <> {neverChased} of them {neverChased === 1 ? 'has' : 'have'} never been sent a statement from here.</>}
      </p>

      {phone ? (
        <div>
          {list.slice(0, show).map((r) => {
            const chased = r.lastSent ? daysSince(r.lastSent.at) : null
            const isOpen = open === r.id
            return (
              <div key={r.id} style={{
                border: `1px solid ${picked.has(r.id) ? INK : BORDER}`, borderRadius: '6px',
                padding: '12px', marginBottom: '8px', background: picked.has(r.id) ? '#F5F7FA' : '#fff',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <input type="checkbox" checked={picked.has(r.id)} onChange={() => {
                    const next = new Set(picked)
                    next.has(r.id) ? next.delete(r.id) : next.add(r.id)
                    setPicked(next)
                  }} style={{ marginTop: '3px' }} />
                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => setOpen(isOpen ? null : r.id)}>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{r.name}</div>
                    {/* One compact meta line: on a 390px card, three facts
                        spelled out in full wrap into three rows. */}
                    <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '3px' }}>
                      {r.invoices.length} inv · {money(r.balance)}
                      {r.oldestDays > 0 && <span style={{ color: r.oldestDays > 60 ? RED : MUTED }}> · {r.oldestDays}d late</span>}
                    </div>
                    <div style={{ fontSize: '12.5px', marginTop: '3px', color: chased === null ? RED : chased >= 30 ? INK : GREEN }}>
                      {chased === null ? 'never chased' : chased === 0 ? 'chased today' : `chased ${chased}d ago`}
                      {!r.email && <span style={{ color: RED }}> · no email</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '10px', color: MUTED, fontWeight: 700, letterSpacing: '.05em' }}>PAST DUE</div>
                    <div style={{ fontWeight: 700, fontSize: '16px' }}>{r.pastDue > 0 ? money(r.pastDue) : '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => setOpen(isOpen ? null : r.id)} style={{ ...btn(false), flex: 1 }}>
                    {isOpen ? 'Hide' : 'Invoices'}
                  </button>
                  <button onClick={() => onPreview(r)} disabled={busy === 'stmt' + r.id} style={{ ...btn(false), flex: 1 }}>
                    {busy === 'stmt' + r.id ? '…' : 'Preview'}
                  </button>
                  <button onClick={() => onStatement(r)} style={{ ...btn(true), flex: 2 }}>Send →</button>
                </div>
                {isOpen && (
                  <div style={{ marginTop: '10px', borderTop: `1px solid ${BORDER}`, paddingTop: '8px' }}>
                    {r.invoices.map((inv) => {
                      const late = inv.due ? Math.floor((Date.now() - Date.parse(inv.due)) / 86400000) : 0
                      return (
                        <div key={inv.id} style={{ padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{inv.doc ? '#' + inv.doc : '(no number)'}</span>
                            <span style={{ fontWeight: 700, fontSize: '13px' }}>{money(inv.balance)}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: late > 0 ? RED : MUTED, margin: '2px 0 6px' }}>
                            {inv.due ? (late > 0 ? `${late} days late` : `due ${inv.due}`) : 'no due date'}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => onInvoicePdf(inv)} disabled={busy === 'pdf' + inv.id} style={{ ...btn(false), flex: 1 }}>
                              {busy === 'pdf' + inv.id ? '…' : 'PDF'}
                            </button>
                            <button onClick={() => onInvoiceEmail(inv)} style={{ ...btn(true), flex: 2 }}>Email →</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {list.length > show && (
            <button onClick={() => setShow((n) => n + 40)} style={{ ...btn(false), width: '100%' }}>
              Show 40 more ({(list.length - show).toLocaleString()} left)
            </button>
          )}
          {list.length === 0 && <div style={{ fontSize: '13px', color: MUTED, padding: '8px 2px' }}>Nobody matches that.</div>}
        </div>
      ) : (
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '4px', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
          <thead><tr>
            <th style={{ borderBottom: `1px solid ${INK}`, padding: '8px 6px 8px 10px', width: '28px' }}>
              <input type="checkbox"
                checked={list.length > 0 && list.slice(0, show).every((r) => picked.has(r.id))}
                onChange={(e) => {
                  const next = new Set(picked)
                  for (const r of list.slice(0, show)) e.target.checked ? next.add(r.id) : next.delete(r.id)
                  setPicked(next)
                }} />
            </th>
            {[['name', 'Customer', false], ['pastDue', 'Past due', true], ['balance', 'Total open', true],
              ['oldest', 'Oldest', true], ['chased', 'Last chased', false]].map(([field, label, right]) => (
              <th key={field} onClick={() => {
                if (sort === field) { setDir((d) => (d === 'asc' ? 'desc' : 'asc')); return }
                setSort(field); setDir(field === 'name' ? 'asc' : 'desc'); setShow(20)
              }} title="Sort by this column"
                style={{ ...th(right), color: sort === field ? INK : MUTED, cursor: 'pointer', userSelect: 'none' }}>
                {label}{sort === field ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
            <th style={{ borderBottom: `1px solid ${INK}` }}></th>
          </tr></thead>
          <tbody>
            {list.slice(0, show).map((r) => {
              const chased = r.lastSent ? daysSince(r.lastSent.at) : null
              const isOpen = open === r.id
              return (
                <React.Fragment key={r.id}>
                <tr onClick={() => setOpen(isOpen ? null : r.id)} style={{ cursor: 'pointer', background: picked.has(r.id) ? '#F5F7FA' : undefined }}>
                  <td style={{ ...td(), padding: '9px 6px 9px 10px' }} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={picked.has(r.id)} onChange={() => {
                      const next = new Set(picked)
                      next.has(r.id) ? next.delete(r.id) : next.add(r.id)
                      setPicked(next)
                    }} />
                  </td>
                  <td style={td()}>
                    <span style={{ display: 'inline-block', width: '16px', color: MUTED, fontSize: '10px' }}>{isOpen ? '▾' : '▸'}</span>
                    <b>{r.name}</b>
                    <span style={{ color: MUTED, fontWeight: 400 }}> · {r.invoices.length} invoice{r.invoices.length === 1 ? '' : 's'}</span>
                    {!r.email && <div style={{ fontSize: '11px', color: RED, paddingLeft: '16px' }}>no email on file</div>}
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
                  <td style={{ ...td(), whiteSpace: 'nowrap', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onPreview(r)} disabled={busy === 'stmt' + r.id} style={btn(false)}>
                      {busy === 'stmt' + r.id ? '…' : 'Preview'}
                    </button>{' '}
                    <button onClick={() => onStatement(r)} style={btn(true)}>Send statement →</button>
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={7} style={{ padding: 0, borderBottom: `1px solid ${BORDER}`, background: '#FAFAF8' }}>
                      <div style={{ padding: '10px 14px 14px' }}>
                        <div style={{ fontSize: '10.5px', letterSpacing: '.08em', color: MUTED, fontWeight: 700, margin: '2px 0 8px' }}>
                          THEIR OPEN INVOICES — OLDEST FIRST
                        </div>
                        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12.5px', fontVariantNumeric: 'tabular-nums' }}>
                          <tbody>
                            {r.invoices.map((inv) => {
                              const late = inv.due ? Math.floor((Date.now() - Date.parse(inv.due)) / 86400000) : 0
                              return (
                                <tr key={inv.id}>
                                  <td style={{ ...td(), fontWeight: 600 }}>{inv.doc ? '#' + inv.doc : '(no number)'}</td>
                                  <td style={td()}>{inv.date || '—'}</td>
                                  <td style={{ ...td(), color: late > 0 ? RED : MUTED }}>
                                    {inv.due ? (late > 0 ? `${late}d late` : `due ${inv.due}`) : 'no due date'}
                                  </td>
                                  <td style={{ ...td(), textAlign: 'right', fontWeight: 700 }}>{money(inv.balance)}</td>
                                  <td style={{ ...td(), textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <button onClick={() => onInvoicePdf(inv)} disabled={busy === 'pdf' + inv.id} style={btn(false)}>
                                      {busy === 'pdf' + inv.id ? '…' : 'PDF / print'}
                                    </button>{' '}
                                    <button onClick={() => onInvoiceEmail(inv)} style={btn(true)}>Email →</button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
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
      )}
    </div>
  )
}

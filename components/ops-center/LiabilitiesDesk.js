import { useMemo, useState } from 'react'
import { OPS_SAMPLE } from '../../data/ops-center-sample.js'
import {
  NAVY_GRADIENT,
  GOLD_ON_NAVY,
  formatMoney,
  formatMoneyCompact,
  sumPayables,
  monthBuckets,
  cardCounts,
  stlTotal,
  stlMonthlyTotal,
  stlEarliestPayoffLabel,
  poTotal,
  ccScheduleTotal,
  sortPayables,
  SORT_DEFAULTS,
  dueTheme,
  SCHEDULE_MONTH_KEYS,
  fmtDueGroupTitle,
  useRefreshSpin,
  dueMonthKey,
} from './utils'
import {
  IconRefresh,
  IconLayoutGrid,
  IconRows3,
  IconCalendarDays,
  IconCardSquare,
  IconArrowUpDown,
  IconArrowDownAZ,
  IconUpload,
  IconFilter,
  IconOutflow,
} from './icons'
import { PayableRow, CompactPayableRow } from './PayableCells'
import ShortTermLoansSection from './ShortTermLoans'

const VIEWS = [
  { id: 'sheet', label: 'Sheet', Icon: IconLayoutGrid },
  { id: 'grouped', label: 'By due date', Icon: IconRows3 },
  { id: 'calendar', label: 'Calendar', Icon: IconCalendarDays },
]

const SORT_OPTIONS = [
  { value: 'dueDate', label: 'Due date' },
  { value: 'amount', label: 'Amount' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'entered', label: 'Entered date' },
  { value: 'entity', label: 'Entity' },
]

function TableHead({ showDue }) {
  return (
    <thead className="sticky top-0 z-[1]">
      <tr style={{ background: NAVY_GRADIENT }}>
        {['VENDOR / CARD', 'BILL', 'FEES', ...(showDue ? ['DUE'] : []), 'TOTAL'].map((h, i) => (
          <th
            key={h}
            className={`ops-th ${i > 0 ? 'text-right' : 'text-left'}`}
            style={{ textAlign: i > 0 ? 'right' : 'left' }}
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function TotalsBar({ rows, filtered }) {
  const { bill, fees, total } = sumPayables(rows)
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 text-white"
      style={{ background: NAVY_GRADIENT }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/85">
        {filtered ? 'Filtered total' : 'Totals'}
      </span>
      <dl className="flex flex-wrap gap-6 text-right text-xs sm:gap-10">
        <div>
          <dt className="text-[10px] uppercase text-white/55">Bill</dt>
          <dd className="tabular-nums font-medium">{formatMoney(bill)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-white/55">CC fees</dt>
          <dd className="tabular-nums font-medium">{formatMoney(fees)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-white/55">Bill + fees</dt>
          <dd className="ops-heading tabular-nums text-lg font-semibold" style={{ color: GOLD_ON_NAVY }}>
            {formatMoney(total)}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function CalendarMonth({ year, month, payables, selectedDay, onSelectDay }) {
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const theme = dueTheme(`${monthKey}-01`)
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const byDay = useMemo(() => {
    const m = {}
    payables.forEach((p) => {
      if (!p.due || !p.due.startsWith(monthKey)) return
      const d = parseInt(p.due.slice(8, 10), 10)
      if (!m[d]) m[d] = []
      m[d].push(p)
    })
    return m
  }, [payables, monthKey])

  const cells = []
  for (let i = 0; i < startPad; i++) cells.push({ type: 'pad' })
  for (let d = 1; d <= daysInMonth; d++) {
    const rows = byDay[d] || []
    const iso = `${monthKey}-${String(d).padStart(2, '0')}`
    const tot = sumPayables(rows).total
    cells.push({ type: 'day', day: d, iso, rows, tot })
  }

  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="mb-6">
      <h4 className="ops-heading mb-2 text-sm font-semibold text-[#2f4049] sm:text-base">{monthLabel}</h4>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-[#5c7280]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (c.type === 'pad') return <div key={`p-${i}`} className="min-h-[3.25rem] sm:min-h-16" />
          const has = c.rows.length > 0
          const sel = selectedDay === c.iso
          return (
            <button
              key={c.iso}
              type="button"
              disabled={!has}
              onClick={() => onSelectDay(c.iso)}
              className={`flex min-h-[3.25rem] flex-col items-start rounded-md border p-1 text-left text-[10px] transition sm:min-h-16 sm:p-1.5 ${
                has ? '' : 'border-transparent bg-[#e8eef1]/40 text-[#5c7280]/60'
              } ${sel ? 'ring-2 ring-offset-1' : ''}`}
              style={
                has
                  ? {
                      background: theme.rowBg,
                      borderColor: theme.stripe,
                      ...(sel ? { ringColor: theme.stripe } : {}),
                    }
                  : undefined
              }
            >
              <span className="text-xs font-semibold tabular-nums text-[#2f4049]">{c.day}</span>
              {has ? (
                <>
                  <span className="mt-0.5 truncate text-[9px] font-medium tabular-nums leading-tight sm:text-[10px]">
                    {formatMoneyCompact(c.tot)}
                  </span>
                  <span className="text-[9px] text-[#5c7280]">{c.rows.length} due</span>
                </>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CalendarDayDetail({ day, payables }) {
  const rows = payables.filter((p) => p.due === day)
  if (!day || !rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-amber-400/40 bg-amber-50/40 p-6 text-center text-sm text-[#5c7280]">
        Pick a highlighted day
      </div>
    )
  }
  const byCard = new Map()
  rows.forEach((r) => {
    const k = r.card || 'Unknown'
    if (!byCard.has(k)) byCard.set(k, [])
    byCard.get(k).push(r)
  })
  const theme = dueTheme(day)
  return (
    <div className="rounded-xl border border-amber-400/40 bg-amber-50/40 p-4">
      <h4 className="ops-heading text-sm font-semibold text-[#2f4049]">Due {fmtDueGroupTitle(day)}</h4>
      <p className="mb-3 text-xs tabular-nums text-[#5c7280]">{formatMoney(sumPayables(rows).total)} · {rows.length} due</p>
      <div className="space-y-3">
        {[...byCard.entries()].map(([card, cardRows]) => {
          const sub = sumPayables(cardRows)
          return (
            <div key={card} className="rounded-lg border border-amber-200/60 bg-white/70 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="ops-heading text-xs font-semibold text-[#2f4049]">{card}</span>
                <span className="text-xs font-semibold tabular-nums">{formatMoney(sub.total)}</span>
              </div>
              <p className="text-[10px] text-[#5c7280]">{cardRows.length} due</p>
              <div className="mt-2 border-l-2 border-amber-400/50 pl-2">
                {cardRows.map((r, i) => <CompactPayableRow key={i} row={r} index={i} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LoanRunway({ cashTotal }) {
  const stl = stlTotal()
  const buckets = monthBuckets(OPS_SAMPLE.payables)
  const monthOut = SCHEDULE_MONTH_KEYS.map((k) => ({
    key: k,
    label: dueTheme(`${k}-01`).shortLabel || k,
    amount: sumPayables(buckets[k] || []).total,
  }))
  const po = poTotal()
  const loansPayables = stl
  const totalOut = loansPayables + monthOut.reduce((s, m) => s + m.amount, 0) + po
  const shortage = totalOut - cashTotal
  const monthlyLoans = stlMonthlyTotal()
  const earliestPayoff = stlEarliestPayoffLabel()

  const statCells = [
    { label: 'Loans net balance', value: formatMoney(stl) },
    { label: 'Monthly loan payments', value: formatMoney(monthlyLoans) },
    { label: 'Earliest payoff', value: earliestPayoff },
  ]

  return (
    <div className="border-t border-[#c5d0d6]/40 bg-gradient-to-b from-[#e8eef1]/30 to-white px-3 py-4 sm:px-5 sm:py-5">
      <p className="ops-eyebrow mb-3 text-[10px] tracking-widest text-[#5c7280]">LOAN RUNWAY</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_minmax(12rem,16rem)]">
        <div className="ops-card min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: NAVY_GRADIENT }}>
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/12 ring-1 ring-white/20 text-[#e8c97a]">
              <IconOutflow />
            </span>
            <h3 className="ops-heading text-base font-semibold">Amount going out</h3>
          </div>
          <div className="max-w-full overflow-x-auto">
            <table className="ops-table w-full min-w-[240px]">
              <thead>
                <tr className="bg-[#e8eef1]/80 text-[10px] font-semibold uppercase tracking-wide text-[#5c7280]">
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#c5d0d6]/30">
                  <td className="px-3 py-2 text-sm font-medium text-[#2f4049]">Loans & payables</td>
                  <td className="px-3 py-2 text-right text-sm tabular-nums">{formatMoney(loansPayables)}</td>
                </tr>
                {monthOut.map((m) => (
                  <tr key={m.key} className="border-t border-[#c5d0d6]/30">
                    <td className="px-3 py-2 text-sm text-[#2f4049]">
                      <span className="font-medium">{m.label}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums">{formatMoney(m.amount)}</td>
                  </tr>
                ))}
                {OPS_SAMPLE.purchaseOrders.map((poRow) => (
                  <tr key={poRow.item} className="border-t border-[#c5d0d6]/30">
                    <td className="px-3 py-2 text-sm font-medium text-[#2f4049]">{poRow.item}</td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums">{formatMoney(poRow.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[#c5d0d6]/50 bg-[#e8eef1]/50 font-semibold">
                  <td className="px-3 py-2 text-sm">Total out</td>
                  <td className="px-3 py-2 text-right text-sm tabular-nums">{formatMoney(totalOut)}</td>
                </tr>
                <tr className="border-t border-[#c5d0d6]/30">
                  <td className="px-3 py-2 text-sm font-semibold text-[#2f4049]">Shortage</td>
                  <td
                    className="px-3 py-2 text-right text-sm font-semibold tabular-nums"
                    style={{ color: shortage > 0 ? '#c0392b' : '#2f4049' }}
                  >
                    {formatMoney(shortage)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
          {statCells.map((cell) => (
            <div
              key={cell.label}
              className="rounded-xl border border-[#c5d0d6]/50 bg-white px-3 py-3 shadow-sm lg:px-4"
            >
              <p className="text-[10px] font-semibold uppercase leading-snug tracking-wide text-[#5c7280]">
                {cell.label}
              </p>
              <p className="ops-heading mt-1 text-sm font-semibold tabular-nums text-[#2f4049] sm:text-base">
                {cell.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LiabilitiesDesk({ cashTotal }) {
  const [view, setView] = useState('sheet')
  const [sortField, setSortField] = useState('dueDate')
  const [sortAsc, setSortAsc] = useState(true)
  const [monthFilters, setMonthFilters] = useState([])
  const [cardFilter, setCardFilter] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [calDay, setCalDay] = useState('')
  const refresh = useRefreshSpin(setSpinning)

  const allPayables = OPS_SAMPLE.payables
  const ccTotal = ccScheduleTotal(allPayables)
  const stl = stlTotal()

  const monthStats = useMemo(() => {
    const buckets = monthBuckets(allPayables)
    return SCHEDULE_MONTH_KEYS.map((k) => {
      const rows = buckets[k] || []
      const s = sumPayables(rows)
      const theme = dueTheme(`${k}-01`)
      return { key: k, ...s, theme, label: theme.label }
    })
  }, [allPayables])

  const cards = useMemo(() => cardCounts(allPayables), [allPayables])

  const filtered = useMemo(() => {
    let rows = [...allPayables]
    if (monthFilters.length) rows = rows.filter((r) => monthFilters.includes(dueMonthKey(r.due)))
    if (cardFilter) rows = rows.filter((r) => r.card === cardFilter)
    const fieldMap = { dueDate: 'dueDate', amount: 'amount', vendor: 'vendor', entered: 'entered', entity: 'entity' }
    return sortPayables(rows, fieldMap[sortField] || 'dueDate', sortAsc)
  }, [allPayables, monthFilters, cardFilter, sortField, sortAsc])

  const filtersActive = monthFilters.length > 0 || Boolean(cardFilter)

  const toggleMonth = (key) => {
    setMonthFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  const clearFilters = () => {
    setMonthFilters([])
    setCardFilter('')
  }

  const onSortChange = (e) => {
    const v = e.target.value
    setSortField(v)
    setSortAsc(SORT_DEFAULTS[v] ?? true)
  }

  const groupedByDue = useMemo(() => {
    const map = new Map()
    filtered.forEach((r) => {
      const k = r.due || 'none'
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(r)
    })
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  const grandSchedule = sumPayables(allPayables)

  return (
    <section className="ops-card mt-8 overflow-hidden">
      <div style={{ background: NAVY_GRADIENT }}>
        <div className="px-4 py-4 sm:px-5">
          <p className="ops-eyebrow-navy">LIABILITIES DESK</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/12 ring-1 ring-white/20 text-white">
              <IconCardSquare />
            </span>
            <h2 className="ops-heading flex-1 text-2xl text-white sm:text-3xl">CC payables</h2>
            <button type="button" className="ops-text-btn text-white/80" onClick={refresh}>
              <IconRefresh spinning={spinning} />
              Refresh
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/10">
          <div className="min-w-0 border-r border-white/15 px-4 py-4 sm:px-5">
            <p className="ops-eyebrow-navy">CC SCHEDULE</p>
            <p className="ops-heading mt-1 text-3xl tabular-nums sm:text-4xl" style={{ color: GOLD_ON_NAVY }}>
              {formatMoney(ccTotal)}
            </p>
          </div>
          <div className="min-w-0 overflow-hidden px-4 py-4 text-right sm:px-5">
            <p className="ops-eyebrow-navy normal-case">Short-term loans</p>
            <p className="ops-heading mt-1 text-3xl tabular-nums text-white max-sm:text-2xl max-sm:leading-none sm:text-4xl">
              {formatMoney(stl)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 border-t border-white/10 px-3 py-2 sm:px-4">
          {VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                view === id
                  ? 'bg-white text-[#1e3a5f] shadow-md ring-1 ring-white/40'
                  : 'text-white/90 hover:bg-white/12'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-[#c5d0d6]/40 bg-[#e8eef1]/25 px-3 py-2.5 sm:flex sm:flex-row sm:items-center sm:justify-between sm:px-4">
        {view !== 'calendar' ? (
          <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-0">
            <span className="ops-heading flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#2f4049]/70">
              <IconArrowUpDown size={14} />
              Sort
            </span>
            <select className="ops-select text-xs" value={sortField} onChange={onSortChange} aria-label="Sort">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="button"
              className="ops-ghost-btn inline-flex items-center gap-1 text-xs"
              onClick={() => setSortAsc((s) => !s)}
            >
              <IconArrowDownAZ />
              {sortAsc ? 'Asc' : 'Desc'}
            </button>
          </div>
        ) : (
          <div />
        )}
        <details className="text-xs text-[#5c7280]">
          <summary className="flex cursor-pointer list-none items-center gap-1 hover:text-[#2f4049] [&::-webkit-details-marker]:hidden">
            <IconUpload />
            Update from Excel
          </summary>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <input type="file" accept=".xlsx" className="text-xs" />
            <button type="button" className="ops-btn-primary opacity-50" disabled>Upload and update</button>
          </div>
        </details>
      </div>

      <div className="border-b border-[#c5d0d6]/30 bg-gradient-to-b from-[#e8eef1]/40 to-[#e8eef1]/15 px-3 py-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="ops-heading flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#2f4049]/70">
            <IconFilter />
            Filter
          </span>
          <div className="flex flex-wrap gap-2">
            {monthStats.map((m) => {
              const active = monthFilters.includes(m.key)
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => toggleMonth(m.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    active ? 'ring-2 ring-offset-1 ring-[#2f4049]/40' : 'border-[#c5d0d6]/60 bg-white'
                  }`}
                >
                  <span className="size-2 rounded-full" style={{ background: m.theme.stripe }} />
                  {m.label.replace(' 2026', '')} 2026 {formatMoneyCompact(m.total)}
                </button>
              )
            })}
          </div>
          <select
            className="ops-select max-w-full text-xs sm:ml-auto"
            value={cardFilter}
            onChange={(e) => setCardFilter(e.target.value)}
            aria-label="Card filter"
          >
            <option value="">All cards</option>
            {cards.map(([card, count]) => (
              <option key={card} value={card}>{card} ({count})</option>
            ))}
          </select>
          {filtersActive ? (
            <button type="button" className="text-xs font-medium text-[#1e3a5f] underline" onClick={clearFilters}>
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {monthStats.map((m) => (
            <div
              key={m.key}
              className="rounded-lg px-3 py-3 text-white"
              style={{ background: NAVY_GRADIENT, borderLeft: `4px solid ${m.theme.stripe}` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
                Due {m.label.replace(' 2026', '').toUpperCase()} 2026
              </p>
              <p className="ops-heading mt-1 text-2xl tabular-nums sm:text-3xl" style={{ color: GOLD_ON_NAVY }}>
                {formatMoney(m.total)}
              </p>
              <p className="mt-1 text-xs text-white/75">{m.count} payables</p>
            </div>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[#2f4049]">
          <span className="text-[#5c7280]">CC schedule by due month</span>
          <span className="flex items-center gap-2 font-semibold tabular-nums">
            {formatMoney(grandSchedule.total)}
            <span className="text-[#5c7280] font-normal" aria-hidden>✓</span>
          </span>
        </div>

        {view === 'sheet' ? (
          <div className="overflow-hidden rounded-xl ring-1 ring-[#2f4049]/10">
            <div className="max-h-[min(70vh,520px)] overflow-auto">
              <table className="ops-table w-full min-w-[560px] border-collapse">
                <TableHead showDue />
                <tbody>
                  {filtered.map((row, i) => (
                    <PayableRow key={i} row={row} index={i} showDue />
                  ))}
                </tbody>
              </table>
            </div>
            <TotalsBar rows={filtered} filtered={filtersActive} />
          </div>
        ) : null}

        {view === 'grouped' ? (
          <div className="space-y-3">
            {groupedByDue.map(([due, rows]) => {
              const theme = dueTheme(due === 'none' ? null : due)
              const sub = sumPayables(rows)
              return (
                <div key={due} className="overflow-hidden rounded-xl ring-1 ring-[#2f4049]/10">
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-white"
                    style={{ background: theme.headerBg, borderLeft: `4px solid ${theme.stripe}` }}
                  >
                    <div>
                      <span className="ops-heading font-semibold">Due {fmtDueGroupTitle(due === 'none' ? null : due)}</span>
                      <span className="ml-2 text-sm text-white/70">{rows.length} payables</span>
                    </div>
                    <span className="ops-heading text-xl tabular-nums" style={{ color: GOLD_ON_NAVY }}>
                      {formatMoney(sub.total)}
                    </span>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    <table className="ops-table w-full min-w-[480px] border-collapse">
                      <TableHead showDue={false} />
                      <tbody>
                        {rows.map((row, i) => (
                          <PayableRow key={i} row={row} index={i} showDue={false} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {view === 'calendar' ? (
          <div className="lg:grid lg:grid-cols-[1fr_minmax(18rem,22rem)] lg:gap-4">
            <div>
              <CalendarMonth year={2026} month={9} payables={allPayables} selectedDay={calDay} onSelectDay={setCalDay} />
              <CalendarMonth year={2026} month={10} payables={allPayables} selectedDay={calDay} onSelectDay={setCalDay} />
              <CalendarMonth year={2026} month={11} payables={allPayables} selectedDay={calDay} onSelectDay={setCalDay} />
            </div>
            <aside className="mt-4 lg:sticky lg:top-24 lg:mt-0 lg:self-start">
              <CalendarDayDetail day={calDay} payables={allPayables} />
            </aside>
          </div>
        ) : null}
      </div>

      <ShortTermLoansSection heroTotal={stl} />
      <LoanRunway cashTotal={cashTotal} />
    </section>
  )
}

import { useState, useEffect, useRef, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import DATA from '../../../data/riverside-tires.json'
import { isDemoEmbedQuery } from '../../../lib/demoEmbed'
import { PHONE_DEMO_MSG, isPhoneDemoUrl } from '../../../lib/phoneDemoPostMessage'
import { DEMO_PORTAL_ROOT_CLASS, DEMO_RENDER_HINTS } from '../../../lib/demoFonts'
import DemoFontLinks from '../../DemoFontLinks'
import DemoLobby from '../../DemoLobby'
import {
  THEME,
  C,
  head,
  ui,
  mono,
  fmtC,
  fmt0,
  pct,
  fmtDate,
  paren,
  parenC,
  TieMark,
  hcell,
  cell,
  panel,
  NAV,
} from './riversideUtils'

const BIZ = 'Riverside Tires'

/** One pass per portal open — no wrap back to the first tab mid-loop */
const PHONE_DEMO_TABS = ['dashboard', 'orders', 'financials', 'stock']
const PHONE_TAB_MS = 2300
const PHONE_TAB_MS_ORDERS = 2800
const PHONE_SCROLL_MS = 320
const PHONE_SCROLL_STEP_ORDERS = 56
const PHONE_SCROLL_STEP = 48

const AS_OF = DATA.meta.as_of
const MONTHS = DATA.monthly
const LAST_MONTH = MONTHS[MONTHS.length - 1]
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const monthShort = (label) => label.charAt(0) + label.slice(1).toLowerCase()
const monthLong = (key) => `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`
const monthYear = (m) => `${monthShort(m.label)} ${m.month.slice(0, 4)}`

const sumBy = (rows, key = 'amount') => rows.reduce((s, r) => s + r[key], 0)

/* ---------- Orders helpers ---------- */

const WEEK_START = DATA.meta.week_start

const CF_PERIOD_KEYS = ['all', ...MONTHS.map((m) => m.month)]
const ITEM_PERIOD_KEYS = CF_PERIOD_KEYS
const STOCK_MONTH_IDS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08']

const cfPeriodLabel = (key) => (key === 'all' ? 'Jan–Aug 2026' : monthYear(MONTHS.find((m) => m.month === key) || LAST_MONTH))
const cfPillLabel = (key) => (key === 'all' ? 'All time' : MONTHS.find((m) => m.month === key)?.label || key)
const plNetForCfKey = (key) => (key === 'all' ? sumBy(MONTHS, 'profit') : MONTHS.find((m) => m.month === key)?.profit || 0)
const bsForCfKey = (key) => DATA.balance_sheet[key === 'all' ? '2026-08' : key]
const inventoryOnBs = (key) => bsForCfKey(key)?.assets.find((a) => a.label === 'Inventory')?.amount

const ORDER_PERIODS = [
  { id: '7d', label: '7 days' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All' },
]

const inPeriod = (o, period) => {
  if (period === '7d') return o.date >= WEEK_START && o.date <= AS_OF
  if (period === 'month') return o.date.slice(0, 7) === AS_OF.slice(0, 7) && o.date <= AS_OF
  return true
}

const withProfit = (o) => {
  const profit = o.sale - o.cost
  return { ...o, profit, margin: o.sale > 0 ? (profit / o.sale) * 100 : 0 }
}

const ORDERS = DATA.orders.map(withProfit)

const isNewTireOrder = (o) => o.size && !['Service', 'Parts'].includes(o.size) && !/used/i.test(o.item)
const isUsedTireOrder = (o) => /used/i.test(o.item)

const totalsOf = (rows) => {
  const sale = sumBy(rows, 'sale')
  const cost = sumBy(rows, 'cost')
  const profit = sale - cost
  return { sale, cost, profit, margin: sale > 0 ? (profit / sale) * 100 : 0, tickets: rows.length }
}

const SOURCES = [...new Set(ORDERS.map((o) => o.source))].sort()
const SIZES = [...new Set(ORDERS.map((o) => o.size))].sort()

/* ---------- Stock helpers ---------- */

const stockSnapFor = (id) => DATA.stock_by_month[id] || DATA.stock_by_month[STOCK_MONTH_IDS[STOCK_MONTH_IDS.length - 1]]

const stockRowsFor = (id) => {
  const snap = stockSnapFor(id)
  return snap.rows.map((r) => ({ size: r.size, desc: r.desc, unitCost: r.unitCost, onHand: r.onHand, value: r.value }))
}

/* ---------- Statement helpers ---------- */

const PL_PERIODS = [
  { id: 'all', label: 'All time', full: 'Jan–Aug 2026', keys: MONTHS.map((m) => m.month), prior: null },
  ...MONTHS.map((m, i) => ({
    id: m.month,
    label: m.label,
    full: monthYear(m),
    keys: [m.month],
    prior: i > 0 ? [MONTHS[i - 1].month] : null,
  })),
]

function buildPL(keys) {
  const out = {}
  ;['income', 'cogs', 'expense'].forEach((sec) => {
    const map = new Map()
    keys.forEach((k) => {
      ;(DATA.pl_by_month[k]?.[sec] || []).forEach((l) => {
        const cur = map.get(l.label) || { label: l.label, amount: 0, drill: [] }
        cur.amount += l.amount
        cur.drill = cur.drill.concat(l.drill || [])
        map.set(l.label, cur)
      })
    })
    out[sec] = [...map.values()].map((l) => ({ ...l, drill: [...l.drill].sort((a, b) => (a.date < b.date ? -1 : 1)) }))
  })
  out.inc = sumBy(out.income)
  out.cogsTotal = sumBy(out.cogs)
  out.exp = sumBy(out.expense)
  out.gross = out.inc - out.cogsTotal
  out.net = out.gross - out.exp
  out.reportedNet = keys.reduce((s, k) => s + (MONTHS.find((m) => m.month === k)?.profit || 0), 0)
  return out
}

const downloadCsv = (filename, rows) => {
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ---------- Small UI pieces ---------- */

function PageHead({ title }) {
  return (
    <h1
      style={{
        fontSize: 23,
        fontWeight: 700,
        color: C.ink,
        fontFamily: head,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        margin: '0 0 20px',
      }}
    >
      {title}
    </h1>
  )
}

function Pill({ on, onClick, children, disabled }) {
  return (
    <button type="button" className={`rt-pill${on ? ' on' : ''}`} onClick={onClick} disabled={disabled} aria-pressed={on}>
      {children}
    </button>
  )
}

function Kpi({ label, value, sub, color = C.ink, tie }) {
  return (
    <div style={{ flex: '1 1 150px', background: C.card, border: `1px solid ${C.hair}`, padding: '14px 16px' }}>
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.15em', marginBottom: 6, fontFamily: ui, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 18, color, fontWeight: 600, fontFamily: ui, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
        {value}
        {tie ? <TieMark ok /> : null}
      </div>
      {sub ? <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontFamily: ui }}>{sub}</div> : null}
    </div>
  )
}

function SubTabs({ active, onChange, tabs }) {
  return (
    <div className="rt-fintabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={active === t.id} className={active === t.id ? 'on' : ''} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

function PanelTitle({ children, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
      <div style={{ fontFamily: head, fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{children}</div>
      {right}
    </div>
  )
}

/* ---------- Charts ---------- */

function BarChart({ items, fmt, label }) {
  const W = 360
  const H = 156
  const padT = 20
  const padB = 24
  const max = Math.max(...items.map((i) => i.value), 1)
  const slot = (W - 16) / items.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: 'block' }}>
      <line x1="8" x2={W - 8} y1={H - padB} y2={H - padB} stroke={C.hair} />
      {items.map((it, i) => {
        const bh = (it.value / max) * (H - padT - padB)
        const x = 8 + i * slot + slot * 0.18
        const w = slot * 0.64
        const y = H - padB - bh
        const last = i === items.length - 1
        return (
          <g key={it.label}>
            <title>{`${it.label}: ${fmt(it.value)}`}</title>
            <rect x={x} y={y} width={w} height={bh} fill={last ? THEME.side : '#C9C4B8'} />
            <text x={x + w / 2} y={y - 5} textAnchor="middle" fontSize="9" fontFamily={mono} fill={last ? C.ink : C.sub}>
              {fmt(it.value)}
            </text>
            <text x={x + w / 2} y={H - 8} textAnchor="middle" fontSize="9" fontFamily={ui} fill={C.muted} letterSpacing="0.08em">
              {it.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const MIX_COLORS = ['#B0281C', '#8A8577', '#B9AE9A', '#D3CBBA']

function ComboRevExpProfitChart({ months, onFullPl }) {
  const W = 420
  const H = 200
  const padL = 36
  const padR = 12
  const padT = 28
  const padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const maxY = Math.max(...months.map((m) => Math.max(m.revenue, m.cogs + m.opex, m.profit)), 1)
  const slot = innerW / months.length
  const y = (v) => padT + innerH - (v / maxY) * innerH
  const fmtK = (v) => `$${(v / 1000).toFixed(0)}K`
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10, fontFamily: ui, fontSize: 10, color: C.sub }}>
        {[
          ['Revenue', '#B0281C'],
          ['Expenses', '#CBC2B0'],
          ['Profit', '#1C7A4E'],
        ].map(([l, c]) => (
          <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, background: c, display: 'inline-block' }} />
            {l}
          </span>
        ))}
        <button type="button" className="rt-linkbtn" style={{ marginLeft: 'auto' }} onClick={onFullPl}>
          Full P&L
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Revenue, expenses, and profit by month" style={{ display: 'block', maxHeight: 220 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const yy = padT + innerH * (1 - t)
          const val = maxY * t
          return (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={yy} y2={yy} stroke={C.line} strokeWidth="0.5" />
              <text x={padL - 4} y={yy + 3} textAnchor="end" fontSize="8" fontFamily={mono} fill={C.muted}>
                {fmtK(val)}
              </text>
            </g>
          )
        })}
        {months.map((m, i) => {
          const cx = padL + i * slot + slot / 2
          const bw = slot * 0.28
          const exp = m.cogs + m.opex
          return (
            <g key={m.month}>
              <rect x={cx - bw - 2} y={y(m.revenue)} width={bw} height={padT + innerH - y(m.revenue)} fill="#B0281C" />
              <rect x={cx + 2} y={y(exp)} width={bw} height={padT + innerH - y(exp)} fill="#CBC2B0" />
              <circle cx={cx} cy={y(m.profit)} r={3} fill="#1C7A4E" />
              {i > 0 ? (
                <line
                  x1={padL + (i - 1) * slot + slot / 2}
                  y1={y(months[i - 1].profit)}
                  x2={cx}
                  y2={y(m.profit)}
                  stroke="#1C7A4E"
                  strokeWidth="1.2"
                />
              ) : null}
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="8" fontFamily={ui} fill={C.muted}>
                {m.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function StackedMixBar({ segments }) {
  return (
    <div style={{ display: 'flex', height: 10, width: '100%', marginBottom: 14, overflow: 'hidden' }}>
      {segments.map((s, i) => (
        <div key={s.name} style={{ width: `${s.pct}%`, background: MIX_COLORS[i] || C.line, minWidth: s.pct > 0 ? 2 : 0 }} title={`${s.name} ${s.pct}%`} />
      ))}
    </div>
  )
}

function MarginBadge({ margin }) {
  const bg = margin >= 38 ? C.green : margin >= 22 ? '#6A655C' : THEME.accent
  return (
    <span className="rt-margin-badge" style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: '#fff', background: bg, padding: '2px 7px', borderRadius: 2 }}>
      {pct(margin)}
    </span>
  )
}

function SourcePill({ source }) {
  const tone =
    source.includes('Distributor') || source.includes('Inventory')
      ? { bg: '#E8F2EC', color: '#1C7A4E' }
      : source.includes('Service')
        ? { bg: '#EEEAE3', color: '#6A655C' }
        : { bg: '#F3E8E6', color: '#B0281C' }
  return (
    <span style={{ fontFamily: mono, fontSize: 9, padding: '3px 7px', background: tone.bg, color: tone.color, whiteSpace: 'nowrap' }}>
      {source.replace(' · matched', '').replace(' · same-day', '')}
    </span>
  )
}

function LineChart({ items, fmt, label }) {
  const W = 360
  const H = 156
  const padT = 22
  const padB = 24
  const vals = items.map((i) => i.value)
  const lo = Math.min(...vals) - 1
  const hi = Math.max(...vals) + 1
  const slot = (W - 16) / items.length
  const pts = items.map((it, i) => ({
    x: 8 + i * slot + slot / 2,
    y: padT + (1 - (it.value - lo) / (hi - lo || 1)) * (H - padT - padB),
    ...it,
  }))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: 'block' }}>
      <line x1="8" x2={W - 8} y1={H - padB} y2={H - padB} stroke={C.hair} />
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={THEME.side} strokeWidth="1.5" />
      {pts.map((p, i) => (
        <g key={p.label}>
          <title>{`${p.label}: ${fmt(p.value)}`}</title>
          <circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 3.5 : 2.5} fill={i === pts.length - 1 ? THEME.side : C.card} stroke={THEME.side} strokeWidth="1.2" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fontFamily={mono} fill={C.sub}>
            {fmt(p.value)}
          </text>
          <text x={p.x} y={H - 8} textAnchor="middle" fontSize="9" fontFamily={ui} fill={C.muted} letterSpacing="0.08em">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

/* ---------- Drill modal ---------- */

function DrillModal({ drill, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const rowsTotal = sumBy(drill.rows)
  return (
    <div className="rt-modal" onClick={onClose} role="presentation">
      <div className="rt-modal__box" role="dialog" aria-modal="true" aria-label={`${drill.title} detail`} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
          <div>
            <span style={{ fontFamily: head, fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{drill.title}</span>
            <span style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginLeft: 10 }}>{drill.period}</span>
          </div>
          <button type="button" className="rt-pill" onClick={onClose} aria-label="Close detail">
            Close
          </button>
        </div>
        <div style={{ overflow: 'auto', border: `1px solid ${C.hair}`, maxHeight: '58vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
            <thead>
              <tr>
                <th style={hcell()}>Date</th>
                <th style={hcell()}>Description</th>
                <th style={hcell()}>Type</th>
                <th style={hcell('right')}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {drill.rows.map((r, i) => (
                <tr key={`${r.date}-${i}`}>
                  <td style={cell('left', { fontFamily: mono, fontSize: 10, color: C.muted, whiteSpace: 'nowrap' })}>{fmtDate(r.date)}</td>
                  <td style={cell()}>{r.description}</td>
                  <td style={cell('left', { color: C.sub })}>{r.type}</td>
                  <td style={cell('right', { fontFamily: mono })}>{paren(r.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={cell('left', { fontWeight: 600, borderBottom: 'none' })}>Total</td>
                <td style={cell('right', { fontFamily: mono, fontWeight: 700, borderBottom: 'none' })}>
                  {paren(rowsTotal)}
                  <TieMark ok={Math.abs(rowsTotal - Math.abs(drill.total)) < 1} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ---------- Statement rows ---------- */

function Stmt({ compare, children }) {
  return (
    <div className={compare ? 'rt-stmt cmp' : 'rt-stmt'}>
      {children}
    </div>
  )
}

function StmtHead({ compare, current, prior }) {
  return (
    <div className="rt-stmt__row rt-stmt__head">
      <span />
      <span>{current}</span>
      {compare ? <span>{prior}</span> : null}
      {compare ? <span>Change</span> : null}
    </div>
  )
}

function StmtSection({ children }) {
  return (
    <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.14em', fontWeight: 700, padding: '16px 8px 4px', fontFamily: ui, textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}

function StmtLine({ label, amount, prior, compare, indent, total, strong, onDrill, tie }) {
  const delta = compare && prior != null ? amount - prior : null
  const clickable = !!onDrill
  return (
    <div
      className={`rt-stmt__row${total ? ' total' : ''}${clickable ? ' click' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onDrill}
      onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onDrill()) : undefined}
      style={{ paddingLeft: indent ? 22 : 8, fontWeight: total || strong ? 600 : 400, color: indent ? C.sub : C.ink }}
    >
      <span>
        {label}
        {clickable ? <span style={{ color: C.muted, marginLeft: 6 }}>›</span> : null}
      </span>
      <span className="num" style={{ color: C.ink, fontWeight: total || strong ? 700 : 400 }}>
        {paren(amount)}
        {tie ? <TieMark ok /> : null}
      </span>
      {compare ? (
        <span className="num" style={{ color: C.muted }}>
          {prior != null ? paren(prior) : '—'}
        </span>
      ) : null}
      {compare ? (
        <span className="num" style={{ color: delta == null ? C.muted : delta > 0 ? C.green : delta < 0 ? C.neg : C.muted }}>
          {delta == null ? '—' : paren(delta)}
        </span>
      ) : null}
    </div>
  )
}

function StmtPanel({ title, period, children }) {
  return (
    <div style={{ ...panel, maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${C.hair}`, paddingBottom: 12, marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: ui }}>{title}</div>
        <div style={{ fontSize: 12, color: C.sub, fontFamily: ui, fontWeight: 500 }}>{period}</div>
      </div>
      {children}
    </div>
  )
}

function PeriodBar({ children, compare, onCompare, compareDisabled }) {
  return (
    <div className="rt-fin-pills">
      <span>PERIOD</span>
      {children}
      <label
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: ui,
          fontSize: 11,
          color: compareDisabled ? C.muted : C.sub,
          cursor: compareDisabled ? 'default' : 'pointer',
        }}
      >
        <input type="checkbox" checked={compare && !compareDisabled} disabled={compareDisabled} onChange={(e) => onCompare(e.target.checked)} />
        Compare to prior period
      </label>
    </div>
  )
}

/* ---------- Financials ---------- */

function PlView({ onDrill, periodId, setPeriodId }) {
  const [compare, setCompare] = useState(false)
  const period = PL_PERIODS.find((p) => p.id === periodId) || PL_PERIODS[PL_PERIODS.length - 3]
  const pl = useMemo(() => buildPL(period.keys), [period])
  const priorPl = useMemo(() => (period.prior ? buildPL(period.prior) : null), [period])
  const showCompare = compare && !!priorPl
  const priorLine = (sec, label) => priorPl?.[sec]?.find((l) => l.label === label)?.amount
  const drillFor = (l) =>
    l.drill?.length ? () => onDrill({ title: l.label, period: period.full, rows: l.drill, total: l.amount }) : undefined

  const net = pl.net
  return (
    <>
      <PeriodBar compare={compare} onCompare={setCompare} compareDisabled={!priorPl}>
        {PL_PERIODS.map((p) => (
          <Pill key={p.id} on={p.id === period.id} onClick={() => setPeriodId(p.id)}>
            {p.label}
          </Pill>
        ))}
      </PeriodBar>
      <StmtPanel title="Profit & Loss" period={period.full}>
        <Stmt compare={showCompare}>
          <StmtHead compare={showCompare} current={period.label} prior="Prior" />
          <StmtSection>Income</StmtSection>
          {pl.income.map((l) => (
            <StmtLine key={l.label} label={l.label} amount={l.amount} prior={priorLine('income', l.label)} compare={showCompare} indent onDrill={drillFor(l)} />
          ))}
          <StmtLine label="Total income" amount={pl.inc} prior={priorPl?.inc} compare={showCompare} total />
          <StmtSection>Cost of goods sold</StmtSection>
          {pl.cogs.map((l) => (
            <StmtLine
              key={l.label}
              label={l.label}
              amount={-l.amount}
              prior={priorLine('cogs', l.label) != null ? -priorLine('cogs', l.label) : undefined}
              compare={showCompare}
              indent
              onDrill={drillFor(l)}
            />
          ))}
          <StmtLine label="Gross profit" amount={pl.gross} prior={priorPl?.gross} compare={showCompare} total />
          <StmtSection>Operating expenses</StmtSection>
          {pl.expense.map((l) => (
            <StmtLine
              key={l.label}
              label={l.label}
              amount={-l.amount}
              prior={priorLine('expense', l.label) != null ? -priorLine('expense', l.label) : undefined}
              compare={showCompare}
              indent
              onDrill={drillFor(l)}
            />
          ))}
          <StmtLine label="Total operating expenses" amount={-pl.exp} prior={priorPl ? -priorPl.exp : undefined} compare={showCompare} total />
          <StmtLine label="Net income" amount={net} prior={priorPl?.net} compare={showCompare} total strong tie={Math.abs(net - pl.reportedNet) < 1} />
        </Stmt>
        {pl.inc > 0 ? (
          <div style={{ textAlign: 'right', fontFamily: ui, fontSize: 11, color: C.muted, padding: '8px 8px 0' }}>
            Gross margin {pct((pl.gross / pl.inc) * 100)} · Net margin {pct((net / pl.inc) * 100)}
          </div>
        ) : null}
      </StmtPanel>
    </>
  )
}

function CashFlowView() {
  const [key, setKey] = useState('all')
  const cf = DATA.cash_flow[key]
  const bs = bsForCfKey(key)
  const checking = bs?.assets.find((a) => a.label === 'Business checking')?.amount
  const opTotal = sumBy(cf.operating)
  const invTotal = sumBy(cf.investing)
  const finTotal = sumBy(cf.financing)
  const plNet = plNetForCfKey(key)
  const period = cfPeriodLabel(key)
  const headLabel = key === 'all' ? 'YTD' : monthShort(MONTHS.find((m) => m.month === key)?.label || '')
  return (
    <>
      <PeriodBar compare={false} onCompare={() => {}} compareDisabled>
        {CF_PERIOD_KEYS.map((k) => (
          <Pill key={k} on={k === key} onClick={() => setKey(k)}>
            {cfPillLabel(k)}
          </Pill>
        ))}
      </PeriodBar>
      <StmtPanel title="Cash Flow" period={period}>
        <Stmt>
          <StmtHead current={headLabel} />
          <StmtSection>Operating activities</StmtSection>
          {cf.operating.map((l) => (
            <StmtLine
              key={l.label}
              label={l.label}
              amount={l.amount}
              indent
              tie={l.label === 'Net income' ? Math.abs(l.amount - plNet) < 1 : undefined}
            />
          ))}
          <StmtLine label="Net cash from operating activities" amount={opTotal} total />
          <StmtSection>Investing activities</StmtSection>
          {cf.investing.map((l) => (
            <StmtLine key={l.label} label={l.label} amount={l.amount} indent />
          ))}
          <StmtLine label="Net cash from investing activities" amount={invTotal} total />
          <StmtSection>Financing activities</StmtSection>
          {cf.financing.map((l) => (
            <StmtLine key={l.label} label={l.label} amount={l.amount} indent />
          ))}
          <StmtLine label="Net cash from financing activities" amount={finTotal} total />
          <StmtLine label="Net change in cash" amount={cf.netChange} total strong tie={Math.abs(opTotal + invTotal + finTotal - cf.netChange) < 1} />
          <StmtLine label="Cash at beginning of period" amount={cf.cashStart} indent />
          <StmtLine
            label="Cash at end of period"
            amount={cf.cashEnd}
            total
            strong
            tie={checking != null && Math.abs(checking - cf.cashEnd) < 1 && Math.abs(cf.cashStart + cf.netChange - cf.cashEnd) < 1}
          />
        </Stmt>
      </StmtPanel>
    </>
  )
}

function BalanceSheetView({ onDrill }) {
  const keys = Object.keys(DATA.balance_sheet)
  const [key, setKey] = useState(keys[keys.length - 1])
  const bs = DATA.balance_sheet[key]
  const assets = sumBy(bs.assets)
  const liab = sumBy(bs.liabilities)
  const eq = sumBy(bs.equity)
  const drillFor = (l) => (l.drill?.length ? () => onDrill({ title: l.label, period: `As of ${bs.label}`, rows: l.drill, total: l.amount }) : undefined)
  return (
    <>
      <PeriodBar compare={false} onCompare={() => {}} compareDisabled>
        {keys.map((k) => (
          <Pill key={k} on={k === key} onClick={() => setKey(k)}>
            {MONTHS.find((m) => m.month === k)?.label || k}
          </Pill>
        ))}
      </PeriodBar>
      <StmtPanel title="Balance Sheet" period={`As of ${bs.label}`}>
        <Stmt>
          <StmtHead current={bs.label.split(',')[0]} />
          <StmtSection>Assets</StmtSection>
          {bs.assets.map((l) => (
            <StmtLine key={l.label} label={l.label} amount={l.amount} indent onDrill={drillFor(l)} />
          ))}
          <StmtLine label="Total assets" amount={assets} total strong />
          <StmtSection>Liabilities</StmtSection>
          {bs.liabilities.map((l) => (
            <StmtLine key={l.label} label={l.label} amount={l.amount} indent onDrill={drillFor(l)} />
          ))}
          <StmtLine label="Total liabilities" amount={liab} total />
          <StmtSection>Equity</StmtSection>
          {bs.equity.map((l) => (
            <StmtLine key={l.label} label={l.label} amount={l.amount} indent onDrill={drillFor(l)} />
          ))}
          <StmtLine label="Total equity" amount={eq} total />
          <StmtLine label="Total liabilities & equity" amount={liab + eq} total strong tie={Math.abs(assets - liab - eq) < 1} />
        </Stmt>
      </StmtPanel>
    </>
  )
}

function MonthlyTableView({ onPickMonth }) {
  const rows = MONTHS.map((m) => ({
    ...m,
    gross: m.revenue - m.cogs,
    margin: (m.profit / m.revenue) * 100,
    inProgress: false,
  }))
  const total = {
    month: 'total',
    label: 'TOTAL',
    revenue: sumBy(rows, 'revenue'),
    cogs: sumBy(rows, 'cogs'),
    gross: sumBy(rows, 'gross'),
    profit: sumBy(rows, 'profit'),
    margin: (sumBy(rows, 'profit') / sumBy(rows, 'revenue')) * 100,
    inProgress: false,
  }
  const sepRow = {
    month: '2026-09',
    label: 'September',
    revenue: null,
    cogs: null,
    gross: null,
    profit: null,
    margin: null,
    inProgress: true,
  }
  return (
    <div style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
        <thead>
          <tr>
            <th style={hcell()}>Month</th>
            <th style={hcell('right')}>Revenue</th>
            <th style={hcell('right')}>COGS</th>
            <th style={hcell('right')}>Gross Profit</th>
            <th style={hcell('right')}>Net Profit</th>
            <th style={hcell('right')}>Margin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => (
            <tr key={m.month} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
              <td style={cell('left')}>
                <button type="button" className="rt-linkbtn" onClick={() => onPickMonth(m.month)}>
                  {monthYear(m)}
                </button>
              </td>
              <td style={cell('right', { fontFamily: mono })}>{fmt0(m.revenue)}</td>
              <td style={cell('right', { fontFamily: mono })}>{fmt0(m.cogs)}</td>
              <td style={cell('right', { fontFamily: mono, fontWeight: 600 })}>{fmt0(m.gross)}</td>
              <td style={cell('right', { fontFamily: mono, fontWeight: 600 })}>{fmt0(m.profit)}</td>
              <td style={cell('right', { fontFamily: mono, color: C.sub })}>{pct(m.margin)}</td>
            </tr>
          ))}
          <tr style={{ opacity: 0.55 }}>
            <td style={cell('left', { fontStyle: 'italic' })}>{sepRow.label} · In progress</td>
            <td style={cell('right', { fontFamily: mono })}>—</td>
            <td style={cell('right', { fontFamily: mono })}>—</td>
            <td style={cell('right', { fontFamily: mono })}>—</td>
            <td style={cell('right', { fontFamily: mono })}>—</td>
            <td style={cell('right', { fontFamily: mono })}>—</td>
          </tr>
          <tr style={{ background: '#ECE7DD' }}>
            <td style={cell('left', { fontWeight: 700, borderBottom: 'none' })}>{total.label}</td>
            <td style={cell('right', { fontFamily: mono, fontWeight: 700, borderBottom: 'none' })}>
              {fmt0(total.revenue)}
              <TieMark ok={total.revenue === DATA.ytd_revenue} />
            </td>
            <td style={cell('right', { fontFamily: mono, fontWeight: 700, borderBottom: 'none' })}>{fmt0(total.cogs)}</td>
            <td style={cell('right', { fontFamily: mono, fontWeight: 700, borderBottom: 'none' })}>{fmt0(total.gross)}</td>
            <td style={cell('right', { fontFamily: mono, fontWeight: 700, borderBottom: 'none' })}>{fmt0(total.profit)}</td>
            <td style={cell('right', { fontFamily: mono, fontWeight: 700, borderBottom: 'none' })}>{pct(total.margin)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function AccountBalancesView({ onDrill }) {
  const key = '2026-08'
  const bs = DATA.balance_sheet[key]
  const [open, setOpen] = useState({ ASSETS: true, LIABILITIES: true, EQUITY: true, INCOME: false, EXPENSES: false })
  const assets = sumBy(bs.assets)
  const liab = sumBy(bs.liabilities)
  const eq = sumBy(bs.equity)
  const balanced = Math.abs(assets - liab - eq) < 2

  const sections = [
    { id: 'ASSETS', title: 'ASSETS', rows: bs.assets.map((l) => ({ ...l, type: 'Asset' })) },
    { id: 'LIABILITIES', title: 'LIABILITIES', rows: bs.liabilities.map((l) => ({ ...l, type: 'Liability' })) },
    { id: 'EQUITY', title: 'EQUITY', rows: bs.equity.map((l) => ({ ...l, type: 'Equity' })) },
    { id: 'INCOME', title: 'INCOME', rows: (DATA.accounts_ytd?.income || []).map((l) => ({ ...l, type: 'Income' })) },
    { id: 'EXPENSES', title: 'EXPENSES', rows: (DATA.accounts_ytd?.expense || []).map((l) => ({ ...l, type: 'Expense' })) },
  ]

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))

  return (
    <div style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto', maxWidth: 760 }}>
      {sections.map((sec) => (
        <div key={sec.id} style={{ borderBottom: `1px solid ${C.hair}` }}>
          <button type="button" className="rt-acct-head" onClick={() => toggle(sec.id)} aria-expanded={open[sec.id]}>
            <span>{open[sec.id] ? '▾' : '▸'}</span> {sec.title}
          </button>
          {open[sec.id] ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
              <tbody>
                {sec.rows.map((l) => {
                  const canDrill = !!l.drill?.length
                  const period = sec.id === 'ASSETS' || sec.id === 'LIABILITIES' || sec.id === 'EQUITY' ? `As of ${bs.label}` : 'Jan–Aug 2026 YTD'
                  return (
                    <tr
                      key={`${sec.id}-${l.label}`}
                      className={canDrill ? 'rt-clickrow' : undefined}
                      tabIndex={canDrill ? 0 : undefined}
                      onClick={canDrill ? () => onDrill({ title: l.label, period, rows: l.drill, total: l.amount }) : undefined}
                      onKeyDown={canDrill ? (e) => e.key === 'Enter' && onDrill({ title: l.label, period, rows: l.drill, total: l.amount }) : undefined}
                    >
                      <td style={cell()}>{l.label}</td>
                      <td style={cell('right', { fontFamily: mono, width: 120 })}>{paren(l.amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : null}
        </div>
      ))}
      <div style={{ padding: '12px 14px', fontFamily: ui, fontSize: 12, color: C.sub, textAlign: 'right' }}>
        In balance <TieMark ok={balanced} />
      </div>
    </div>
  )
}

const FIN_TABS = [
  { id: 'pl', label: 'Profit & Loss' },
  { id: 'cf', label: 'Cash Flow' },
  { id: 'bs', label: 'Balance Sheet' },
  { id: 'monthly', label: 'Monthly Table' },
  { id: 'accounts', label: 'Account Balances' },
]

function FinancialsTab({ fin, setFin, plPeriod, setPlPeriod }) {
  const [drill, setDrill] = useState(null)
  return (
    <>
      <PageHead title={NAV.find((n) => n.id === 'financials').title} />
      <SubTabs active={fin} onChange={setFin} tabs={FIN_TABS} />
      {fin === 'pl' && <PlView onDrill={setDrill} periodId={plPeriod} setPeriodId={setPlPeriod} />}
      {fin === 'cf' && <CashFlowView />}
      {fin === 'bs' && <BalanceSheetView onDrill={setDrill} />}
      {fin === 'monthly' && (
        <MonthlyTableView
          onPickMonth={(m) => {
            setPlPeriod(m)
            setFin('pl')
          }}
        />
      )}
      {fin === 'accounts' && <AccountBalancesView onDrill={setDrill} />}
      {drill ? <DrillModal drill={drill} onClose={() => setDrill(null)} /> : null}
    </>
  )
}

/* ---------- Dashboard ---------- */

function DashboardTab({ period, setPeriod, onOpenOrders, onOpenFinancials, onOpenSalesItems }) {
  const rows = ORDERS.filter((o) => inPeriod(o, period))
  const reg = totalsOf(rows)
  const ordersView = totalsOf(ORDERS.filter((o) => inPeriod(o, period)))
  const tied = reg.sale === ordersView.sale && reg.cost === ordersView.cost && reg.tickets === ordersView.tickets

  const m = LAST_MONTH
  const plAug = buildPL([m.month])
  const netTie = Math.abs(plAug.net - m.profit) < 1
  const monthName = MONTH_NAMES[Number(AS_OF.slice(5, 7)) - 1]
  const augTires = DATA.aug_tire_sales
  const mixTotal = sumBy(DATA.sales_mix_aug, 'revenue')
  const mixTie = mixTotal === m.revenue
  const topSixRev = sumBy(DATA.top_tire_sizes_aug, 'revenue')
  const topSixUnits = sumBy(DATA.top_tire_sizes_aug, 'units')
  const topSixTie =
    topSixRev === augTires.top_six_revenue &&
    topSixUnits === augTires.top_six_units &&
    topSixRev < augTires.new_tire_revenue &&
    topSixUnits < augTires.new_tire_units

  const grossAug = m.revenue - m.cogs
  const strip = [
    ['Revenue', fmt0(m.revenue)],
    ['Gross profit', fmt0(grossAug)],
    ['Net margin', pct((m.profit / m.revenue) * 100)],
    ['YTD revenue', fmt0(DATA.ytd_revenue)],
    ['Tires sold', String(m.tiresSold)],
  ]

  const profitRows = MONTHS.map((x) => ({ ...x, margin: (x.profit / x.revenue) * 100 }))
  const profitTotal = sumBy(profitRows, 'profit')

  return (
    <>
      <div style={{ ...panel, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ fontFamily: head, fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Open period · {monthName} · through {fmtDate(AS_OF).replace(/, \d{4}$/, '')}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {ORDER_PERIODS.filter((p) => p.id !== 'all').map((p) => (
              <Pill key={p.id} on={period === p.id} onClick={() => setPeriod(p.id)}>
                {p.label}
              </Pill>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {[
            ['Sales', fmt0(reg.sale), C.ink],
            ['Est. cost', fmt0(reg.cost), C.ink],
            ['Est. gross', fmt0(reg.profit), C.green],
            ['Est. margin', pct(reg.margin), C.ink],
            ['Tickets', String(reg.tickets), C.ink],
          ].map(([l, v, color], i) => (
            <div key={l} style={{ flex: '1 1 120px', padding: '10px 14px', borderLeft: i ? `1px solid ${C.line}` : 'none' }}>
              <div style={{ fontFamily: ui, fontSize: 10.5, color: C.muted }}>{l}</div>
              <div style={{ fontFamily: mono, fontSize: 16, color, fontWeight: 500, marginTop: 4 }}>
                {v}
                {l === 'Tickets' ? <TieMark ok={tied} /> : null}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" className="rt-linkbtn" onClick={onOpenOrders}>
            View these {reg.tickets} tickets in Orders →
          </button>
        </div>
      </div>

      <div style={{ fontFamily: head, fontSize: 13, fontWeight: 600, color: C.red, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        Net profit · {monthYear(m)}
      </div>
      <div className="rt-hero" style={{ fontFamily: head, fontSize: 72, fontWeight: 700, color: C.ink, lineHeight: 1, margin: '6px 0 16px' }}>
        {fmt0(m.profit)}
        <TieMark ok={netTie} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {strip.map(([l, v]) => (
          <div key={l} style={{ ...panel, flex: '1 1 120px', marginBottom: 0 }}>
            <div style={{ fontFamily: ui, fontSize: 10, color: C.muted }}>{l}</div>
            <div style={{ fontFamily: mono, fontSize: 18, marginTop: 6, fontWeight: 500 }}>
              {v}
              {l === 'YTD revenue' ? <TieMark ok={DATA.ytd_revenue === sumBy(MONTHS, 'revenue')} /> : null}
              {l === 'Tires sold' ? <TieMark ok={m.tiresSold === augTires.tires_sold_units} /> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="rt-dash-main">
        <div style={{ ...panel, marginBottom: 0 }}>
          <PanelTitle>Revenue, Expenses &amp; Profit</PanelTitle>
          <ComboRevExpProfitChart months={MONTHS} onFullPl={() => onOpenFinancials('all')} />
        </div>
        <div style={{ ...panel, marginBottom: 0 }}>
          <PanelTitle>Profit by Month</PanelTitle>
          <div style={{ border: `1px solid ${C.hair}` }}>
            {profitRows.map((x) => (
              <button
                key={x.month}
                type="button"
                className="rt-profit-row"
                onClick={() => onOpenFinancials(x.month)}
              >
                <span>{monthShort(x.label)}</span>
                <span style={{ fontFamily: mono }}>{fmt0(x.profit)}</span>
                <span style={{ fontFamily: mono, color: C.sub }}>{pct(x.margin)}</span>
              </button>
            ))}
            <div className="rt-profit-row total">
              <span>Total</span>
              <span style={{ fontFamily: mono, fontWeight: 700 }}>
                {fmt0(profitTotal)}
                <TieMark ok={profitTotal === sumBy(MONTHS, 'profit')} />
              </span>
              <span />
            </div>
          </div>
        </div>
      </div>

      <div className="rt-chartrow" style={{ marginTop: 16 }}>
        <div style={{ ...panel, marginBottom: 0 }}>
          <PanelTitle right={mixTie ? <TieMark ok /> : null}>Sales Mix · Aug 2026</PanelTitle>
          <StackedMixBar segments={DATA.sales_mix_aug} />
          {DATA.sales_mix_aug.map((s, i) => (
            <div key={s.name} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: ui, fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: C.ink }}>{s.name}</span>
                <span style={{ fontFamily: mono, color: C.sub }}>
                  {fmt0(s.revenue)} · {pct(s.pct)}
                </span>
              </div>
              <div style={{ height: 5, background: C.line }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: MIX_COLORS[i] }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...panel, marginBottom: 0, overflow: 'auto' }}>
          <PanelTitle
            right={
              <button type="button" className="rt-linkbtn" onClick={onOpenSalesItems}>
                All
              </button>
            }
          >
            Top Tire Sizes · Aug 2026
          </PanelTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 280 }}>
            <thead>
              <tr>
                <th style={hcell()}>#</th>
                <th style={hcell()}>Size</th>
                <th style={hcell('right')}>Units</th>
                <th style={hcell('right')}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {DATA.top_tire_sizes_aug.map((t) => (
                <tr key={t.size}>
                  <td style={cell('left', { fontFamily: mono, color: C.muted })}>{t.rank}</td>
                  <td style={cell('left', { fontFamily: mono })}>{t.size}</td>
                  <td style={cell('right', { fontFamily: mono })}>{t.units}</td>
                  <td style={cell('right', { fontFamily: mono })}>{fmt0(t.revenue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={cell('left', { fontWeight: 600, borderBottom: 'none' })}>
                  Top six
                  <TieMark ok={topSixTie} />
                </td>
                <td style={cell('right', { fontFamily: mono, fontWeight: 600, borderBottom: 'none' })}>{topSixUnits}</td>
                <td style={cell('right', { fontFamily: mono, fontWeight: 600, borderBottom: 'none' })}>{fmt0(topSixRev)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )
}

/* ---------- Sales & Items ---------- */

function SalesItemsTab() {
  const [view, setView] = useState('ranked')
  const [periodKey, setPeriodKey] = useState('2026-08')
  const [compareOn, setCompareOn] = useState(false)
  const [compareKey, setCompareKey] = useState('2026-07')
  const [sort, setSort] = useState('revenue')
  const [sortDir, setSortDir] = useState(-1)
  const [q, setQ] = useState('')

  const stats = DATA.period_stats?.[periodKey] || DATA.period_stats?.['2026-08']
  const items = (DATA.sales_items_by_month?.[periodKey] || DATA.sales_items_aug).filter((it) => !q.trim() || it.item.toLowerCase().includes(q.trim().toLowerCase()))
  const sortKey = sort === 'avg' ? 'avgSale' : sort
  const withAvg = items.map((it) => ({ ...it, avgSale: it.units ? it.revenue / it.units : 0 }))
  const ranked = [...withAvg].sort((a, b) => (a[sortKey] - b[sortKey]) * sortDir)

  const compareItems = compareOn ? DATA.sales_items_by_month?.[compareKey] || [] : []
  const compareMap = new Map(compareItems.map((it) => [it.item, it]))

  const maxMonthRev = Math.max(...MONTHS.map((m) => m.revenue), 1)

  return (
    <>
      <PageHead title={NAV.find((n) => n.id === 'inventory').title} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="Revenue" value={fmt0(stats?.revenue || 0)} />
        <Kpi label="Units sold" value={String(stats?.unitsSold || 0)} />
        <Kpi label="Unique items" value={String(stats?.uniqueItems || items.length)} />
        <Kpi label="Avg ticket" value={fmtC(stats?.ticketCount ? stats.revenue / stats.ticketCount : 0)} />
      </div>
      <SubTabs
        active={view}
        onChange={setView}
        tabs={[
          { id: 'ranked', label: 'Items Ranked' },
          { id: 'month', label: 'By Month' },
        ]}
      />
      {view === 'ranked' && (
        <>
          <div className="rt-fin-pills">
            <span>PERIOD</span>
            {ITEM_PERIOD_KEYS.map((k) => (
              <Pill key={k} on={k === periodKey} onClick={() => setPeriodKey(k)}>
                {cfPillLabel(k)}
              </Pill>
            ))}
            <button type="button" className="rt-pill" style={{ marginLeft: 8 }} onClick={() => setCompareOn((v) => !v)}>
              {compareOn ? 'Compare on' : 'Compare'}
            </button>
            {compareOn ? (
              <>
                <span style={{ fontSize: 9, color: C.muted, letterSpacing: '0.12em' }}>COMPARE TO</span>
                {MONTHS.map((m) => (
                  <Pill key={m.month} on={compareKey === m.month} onClick={() => setCompareKey(m.month)}>
                    {m.label}
                  </Pill>
                ))}
              </>
            ) : null}
          </div>
          <div className="rt-filters">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items" aria-label="Search items" style={{ ...selectStyle, flex: '1 1 160px', minWidth: 0 }} />
            <span style={{ fontSize: 9, color: C.muted, letterSpacing: '0.12em' }}>SORT</span>
            {[
              ['revenue', 'Revenue'],
              ['units', 'Units'],
              ['avg', 'Avg sale'],
            ].map(([id, label]) => (
              <Pill
                key={id}
                on={sort === id}
                onClick={() => {
                  if (sort === id) setSortDir((d) => -d)
                  else {
                    setSort(id)
                    setSortDir(-1)
                  }
                }}
              >
                {label}
              </Pill>
            ))}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: compareOn ? 720 : 460 }}>
              <thead>
                <tr>
                  <th style={hcell()}>#</th>
                  <th style={hcell()}>Item</th>
                  <th style={hcell('right')}>Units</th>
                  <th style={hcell('right')}>Revenue</th>
                  <th style={hcell('right')}>Avg sale</th>
                  {compareOn ? (
                    <>
                      <th style={hcell('right')}>Units B</th>
                      <th style={hcell('right')}>Rev B</th>
                      <th style={hcell('right')}>Δ Units</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {ranked.map((t, i) => {
                  const b = compareMap.get(t.item)
                  return (
                    <tr key={t.item} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                      <td style={cell('left', { fontFamily: mono, color: C.muted })}>{i + 1}</td>
                      <td style={cell('left', { fontFamily: mono })}>{t.item}</td>
                      <td style={cell('right', { fontFamily: mono })}>{t.units}</td>
                      <td style={cell('right', { fontFamily: mono, fontWeight: 600 })}>{fmt0(t.revenue)}</td>
                      <td style={cell('right', { fontFamily: mono, color: C.sub })}>{t.units ? fmtC(t.avgSale) : '—'}</td>
                      {compareOn ? (
                        <>
                          <td style={cell('right', { fontFamily: mono })}>{b?.units ?? '—'}</td>
                          <td style={cell('right', { fontFamily: mono })}>{b ? fmt0(b.revenue) : '—'}</td>
                          <td style={cell('right', { fontFamily: mono })}>{b ? b.units - t.units : '—'}</td>
                        </>
                      ) : null}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {view === 'month' && (
        <>
          <div style={{ fontFamily: head, fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Sales by month</div>
          <div style={{ background: C.card, border: `1px solid ${C.hair}`, padding: '8px 12px' }}>
            {MONTHS.map((x) => (
              <div key={x.month} style={{ display: 'grid', gridTemplateColumns: '88px 1fr auto', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.line}` }}>
                <span style={{ fontFamily: mono, fontSize: 11 }}>{monthShort(x.label)}</span>
                <div style={{ height: 8, background: C.line }}>
                  <div style={{ width: `${(x.revenue / maxMonthRev) * 100}%`, height: '100%', background: '#B0281C' }} />
                </div>
                <span style={{ fontFamily: mono, fontSize: 11, whiteSpace: 'nowrap' }}>
                  {fmt0(x.revenue)} · {x.tiresSold} sold
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', fontFamily: mono, fontWeight: 700 }}>
              <span>TOTAL</span>
              <span>
                {fmt0(DATA.ytd_revenue)} <TieMark ok={DATA.ytd_revenue === sumBy(MONTHS, 'revenue')} />
              </span>
            </div>
          </div>
        </>
      )}
    </>
  )
}

/* ---------- Orders ---------- */

function OrderCards({ rows }) {
  return (
    <div className="rt-order-cards">
      {rows.map((r) => (
        <article key={r.ticket} className="rt-order-card">
          <div className="rt-order-card__top">
            <span className="rt-order-card__ticket">{r.ticket}</span>
            <span className="rt-order-card__date">{fmtDate(r.date)}</span>
          </div>
          <p className="rt-order-card__item">{r.item}</p>
          <dl className="rt-order-card__nums">
            <div>
              <dt>Sale</dt>
              <dd>{fmtC(r.sale)}</dd>
            </div>
            <div>
              <dt>{r.est ? 'Est. cost' : 'Cost'}</dt>
              <dd>{fmtC(r.cost)}</dd>
            </div>
            <div>
              <dt>{r.est ? 'Est. profit' : 'Profit'}</dt>
              <dd className="rt-order-card__profit">{fmtC(r.profit)}</dd>
            </div>
            <div>
              <dt>Margin</dt>
              <dd>{pct(r.margin)}</dd>
            </div>
          </dl>
          <p className="rt-order-card__match">
            {r.source}
            {r.flagged ? ' · Review' : ''}
          </p>
        </article>
      ))}
    </div>
  )
}

const selectStyle = {
  fontFamily: ui,
  fontSize: 12,
  padding: '7px 10px',
  border: `1px solid ${C.hair}`,
  background: C.card,
  color: C.ink,
  minHeight: 32,
}

function OrdersTab({ initialPeriod }) {
  const [period, setPeriod] = useState(initialPeriod)
  const [q, setQ] = useState('')
  const [source, setSource] = useState('all')
  const [size, setSize] = useState('all')
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [hideEst, setHideEst] = useState(false)
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState(-1)

  const rows = ORDERS.filter((o) => {
    if (!inPeriod(o, period)) return false
    if (source !== 'all' && o.source !== source) return false
    if (size !== 'all' && o.size !== size) return false
    if (flaggedOnly && !o.flagged) return false
    if (hideEst && o.est) return false
    const needle = q.trim().toLowerCase()
    if (needle && !`${o.ticket} ${o.item} ${o.size} ${o.source}`.toLowerCase().includes(needle)) return false
    return true
  }).sort((a, b) => {
    const dir = sortDir
    if (sortKey === 'date') return (a.date < b.date ? -1 : 1) * dir
    if (sortKey === 'profit') return (a.profit - b.profit) * dir
    if (sortKey === 'margin') return (a.margin - b.margin) * dir
    if (sortKey === 'sale') return (a.sale - b.sale) * dir
    return 0
  })

  const t = totalsOf(rows)
  const newRows = rows.filter(isNewTireOrder)
  const usedRows = rows.filter(isUsedTireOrder)
  const newProfit = newRows.length ? sumBy(newRows, 'profit') / newRows.length : 0
  const usedProfit = usedRows.length ? sumBy(usedRows, 'profit') / usedRows.length : 0
  const bestMargin = rows.reduce((best, r) => (r.margin > (best?.margin || -1) ? r : best), null)
  const flaggedCount = rows.filter((r) => r.flagged).length
  const estCount = rows.filter((r) => r.est).length
  const bySource = SOURCES.map((s) => ({ source: s, count: rows.filter((r) => r.source === s).length })).filter((x) => x.count)

  const filtered = q.trim() || source !== 'all' || size !== 'all' || flaggedOnly || hideEst

  const reset = () => {
    setQ('')
    setSource('all')
    setSize('all')
    setFlaggedOnly(false)
    setHideEst(false)
  }

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => -d)
    else {
      setSortKey(key)
      setSortDir(-1)
    }
  }

  const exportCsv = () => {
    downloadCsv('riverside-tires-orders.csv', [
      ['Date', 'Ticket', 'Item', 'Qty', 'Sale', 'Est. cost', 'Est. profit', 'Margin %', 'Source', 'Cost is estimate', 'Flagged'],
      ...rows.map((r) => [r.date, r.ticket, r.item, r.qty, r.sale.toFixed(2), r.cost.toFixed(2), r.profit.toFixed(2), r.margin.toFixed(1), r.source, r.est ? 'Y' : 'N', r.flagged ? 'Y' : 'N']),
    ])
  }

  return (
    <>
      <PageHead title={NAV.find((n) => n.id === 'orders').title} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="Total orders" value={String(t.tickets)} />
        <Kpi label="Profit / new tire" value={fmtC(newProfit)} />
        <Kpi label="Profit / used tire" value={usedRows.length ? fmtC(usedProfit) : '—'} />
        <Kpi label="Best margin size" value={bestMargin ? bestMargin.size : '—'} sub={bestMargin ? pct(bestMargin.margin) : undefined} />
        <Kpi label="Est. profit" value={fmt0(t.profit)} color={C.green} />
      </div>

      <div className="rt-filters">
        <div style={{ display: 'flex', gap: 6 }}>
          {ORDER_PERIODS.map((p) => (
            <Pill key={p.id} on={period === p.id} onClick={() => setPeriod(p.id)}>
              {p.label}
            </Pill>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ticket or item"
          aria-label="Search orders"
          style={{ ...selectStyle, minWidth: 200, flex: '1 1 200px' }}
        />
        <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source" style={selectStyle}>
          <option value="all">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={size} onChange={(e) => setSize(e.target.value)} aria-label="Filter by size" style={selectStyle}>
          <option value="all">All sizes</option>
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Pill on={flaggedOnly} onClick={() => setFlaggedOnly((v) => !v)}>
          Flagged
        </Pill>
        <Pill on={hideEst} onClick={() => setHideEst((v) => !v)}>
          Hide est.
        </Pill>
        <span style={{ fontSize: 9, color: C.muted, letterSpacing: '0.12em' }}>SORT</span>
        {[
          ['date', 'Date'],
          ['profit', 'Profit'],
          ['margin', 'Margin'],
          ['sale', 'Sale'],
        ].map(([id, label]) => (
          <Pill key={id} on={sortKey === id} onClick={() => toggleSort(id)}>
            {label}
          </Pill>
        ))}
        {filtered ? (
          <button type="button" className="rt-linkbtn" onClick={reset}>
            Clear
          </button>
        ) : null}
        <button type="button" className="rt-pill" style={{ marginLeft: 'auto' }} onClick={exportCsv} disabled={!rows.length}>
          Export CSV
        </button>
      </div>

      {rows.length === 0 ? (
        <div style={{ ...panel, textAlign: 'center', color: C.muted, fontFamily: ui, fontSize: 13 }}>
          No tickets match these filters.{' '}
          <button type="button" className="rt-linkbtn" onClick={reset}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <OrderCards rows={rows} />
          <div className="rt-order-cards-total" style={{ fontFamily: mono, fontSize: 11, color: C.sub, padding: '4px 2px' }}>
            {t.tickets} tickets · {fmt0(t.sale)} sales · {fmt0(t.profit)} est. gross
          </div>
          <div className="rt-order-table" style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={hcell()}>Date</th>
                  <th style={hcell()}>Tire / Item</th>
                  <th style={hcell()}>Source</th>
                  <th style={hcell('right')}>Qty</th>
                  <th style={hcell('right')}>Sale</th>
                  <th style={hcell('right')}>Cost</th>
                  <th style={hcell('right')}>Profit</th>
                  <th style={hcell('right')}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.ticket} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                    <td style={cell('left', { fontFamily: mono, fontSize: 10, color: C.muted, whiteSpace: 'nowrap' })}>{fmtDate(r.date)}</td>
                    <td style={cell()}>{r.item}</td>
                    <td style={cell('left')}>
                      <SourcePill source={r.source} />
                    </td>
                    <td style={cell('right', { fontFamily: mono })}>{r.qty}</td>
                    <td style={cell('right', { fontFamily: mono, fontWeight: 500 })}>{fmtC(r.sale)}</td>
                    <td style={cell('right', { fontFamily: mono, color: C.sub })}>
                      {fmtC(r.cost)}
                      {r.est ? '*' : ''}
                    </td>
                    <td style={cell('right', { fontFamily: mono, fontWeight: 600, color: C.green })}>{fmtC(r.profit)}</td>
                    <td style={cell('right')}>
                      <MarginBadge margin={r.margin} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#ECE7DD' }}>
                  <td colSpan={8} style={cell('left', { fontWeight: 500, borderBottom: 'none', fontSize: 10, lineHeight: 1.5 })}>
                    {bySource.map((x) => `${x.source}: ${x.count}`).join(' · ')}
                    {flaggedCount ? ` · Flagged: ${flaggedCount}` : ''}
                    {estCount ? ` · * estimated cost (${estCount})` : ''}
                    {' · '}
                    <strong>Total est. profit {fmtC(t.profit)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </>
  )
}

/* ---------- Stock ---------- */

function StockTab() {
  const [asOf, setAsOf] = useState(STOCK_MONTH_IDS[STOCK_MONTH_IDS.length - 1])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('value')
  const [sortDir, setSortDir] = useState(-1)
  const snap = stockSnapFor(asOf)
  let rows = stockRowsFor(asOf).filter((r) => !q.trim() || `${r.size} ${r.desc}`.toLowerCase().includes(q.trim().toLowerCase()))
  rows = [...rows].sort((a, b) => {
    const dir = sortDir
    if (sort === 'value') return (a.value - b.value) * dir
    if (sort === 'onHand') return (a.onHand - b.onHand) * dir
    return a.size.localeCompare(b.size) * dir
  })
  const units = sumBy(stockRowsFor(asOf), 'onHand')
  const value = snap.inventory_value
  const bsInv = inventoryOnBs(asOf)
  const invTie = bsInv != null && value === bsInv

  const exportCsv = () => {
    downloadCsv(`riverside-tires-stock-${asOf}.csv`, [
      ['As of', 'Size', 'Description', 'On hand', 'Unit cost', 'Value'],
      ...rows.map((r) => [snap.label, r.size, r.desc, r.onHand, r.unitCost.toFixed(2), r.value.toFixed(2)]),
    ])
  }

  const toggleStockSort = (key) => {
    if (sort === key) setSortDir((d) => -d)
    else {
      setSort(key)
      setSortDir(-1)
    }
  }

  return (
    <>
      <PageHead title={NAV.find((n) => n.id === 'stock').title} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="On hand" value={String(units)} />
        <Kpi label="Stock value" value={fmt0(value)} tie={invTie} />
        <Kpi label="Sizes" value={String(stockRowsFor(asOf).length)} />
      </div>
      <div className="rt-filters">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: ui, fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          As of
          <select value={asOf} onChange={(e) => setAsOf(e.target.value)} style={selectStyle} aria-label="Stock as of">
            {STOCK_MONTH_IDS.map((id) => (
              <option key={id} value={id}>
                {stockSnapFor(id).label}
              </option>
            ))}
          </select>
        </label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stock" aria-label="Search stock" style={{ ...selectStyle, flex: '1 1 140px', minWidth: 0 }} />
        {[
          ['value', 'Value'],
          ['onHand', 'On hand'],
          ['size', 'Size'],
        ].map(([id, label]) => (
          <Pill key={id} on={sort === id} onClick={() => toggleStockSort(id)}>
            {label}
          </Pill>
        ))}
        <button type="button" className="rt-pill" style={{ marginLeft: 'auto' }} onClick={exportCsv}>
          Export CSV
        </button>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
          <thead>
            <tr>
              <th style={hcell()}>Size / Item</th>
              <th style={hcell('right')}>On hand</th>
              <th style={hcell('right')}>Unit cost</th>
              <th style={hcell('right')}>Stock value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.size} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                <td style={cell('left')}>
                  <div style={{ fontFamily: mono }}>{s.size}</div>
                  <div style={{ fontSize: 10, color: C.sub }}>{s.desc}</div>
                </td>
                <td style={cell('right', { fontFamily: mono, fontWeight: 600 })}>{s.onHand}</td>
                <td style={cell('right', { fontFamily: mono, color: C.sub })}>{fmtC(s.unitCost)}</td>
                <td style={cell('right', { fontFamily: mono })}>{fmtC(s.value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#ECE7DD' }}>
              <td style={cell('left', { fontWeight: 600, borderBottom: 'none' })}>{stockRowsFor(asOf).length} sizes</td>
              <td style={cell('right', { fontFamily: mono, fontWeight: 700, borderBottom: 'none' })}>{units}</td>
              <td style={cell('right', { borderBottom: 'none' })} />
              <td style={cell('right', { fontFamily: mono, fontWeight: 700, borderBottom: 'none' })}>{fmtC(value)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}

/* ---------- Ask ---------- */

const ASK_KEYS = ['best_month', 'cash', 'mix', 'sizes', 'month']
const ASK_FALLBACK =
  'I can answer questions about your best month, cash, sales mix, top tire sizes, and how this month is going. Try one of the suggestions above.'

function pickAnswerKey(text) {
  const q = text.toLowerCase()
  if (/this month|going|september|so far|register/.test(q)) return 'month'
  if (/best|strongest|top month|record/.test(q)) return 'best_month'
  if (/cash|bank|checking|balance/.test(q)) return 'cash'
  if (/driving|mix|service|repair|used/.test(q)) return 'mix'
  if (/size|sell|popular|units/.test(q)) return 'sizes'
  return null
}

function AskTab() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [messages])

  const send = (text, key) => {
    const t = text.trim()
    if (!t) return
    const k = key || pickAnswerKey(t)
    const answer = k ? DATA.ask.answers[k] : ASK_FALLBACK
    setMessages((m) => [...m, { role: 'user', text: t }, { role: 'ai', text: answer }])
    setInput('')
  }

  return (
    <>
      <PageHead title={NAV.find((n) => n.id === 'ai').title} />
      <div style={{ maxWidth: 680 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {DATA.ask.chips.map((chip, i) => (
            <button key={chip} type="button" className="rt-chip" onClick={() => send(chip, ASK_KEYS[i])}>
              {chip}
            </button>
          ))}
        </div>
        <div style={{ ...panel, padding: 0, marginBottom: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.hair}`, fontFamily: head, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Conversation</div>
          <div className="rt-convo" aria-live="polite">
            {messages.length === 0 ? (
              <div style={{ color: C.muted, fontFamily: ui, fontSize: 13, textAlign: 'center', margin: 'auto' }}>Start with a question</div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`rt-msg ${m.role}`}>
                  {m.text}
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            style={{ display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${C.hair}` }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about sales, cash, margins…"
              aria-label="Ask a question"
              style={{ flex: 1, padding: '10px 12px', border: `1px solid ${C.hair}`, fontFamily: ui, fontSize: 14, outline: 'none', background: C.card, minWidth: 0 }}
            />
            <button type="submit" disabled={!input.trim()} style={{ background: THEME.side, color: '#fff', border: 'none', padding: '10px 18px', fontFamily: mono, fontSize: 11, cursor: input.trim() ? 'pointer' : 'default', opacity: input.trim() ? 1 : 0.5 }}>
              Ask
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

/* ---------- Shell ---------- */

function Shell({ tab, setTab, embed, children }) {
  return (
    <div className={embed ? `rt-shell rt-embed ${DEMO_PORTAL_ROOT_CLASS}` : `rt-shell ${DEMO_PORTAL_ROOT_CLASS}`}>
      <div className="rt-mobilenav" aria-label="Sections">
        {NAV.map((n) => (
          <button key={n.id} type="button" className={tab === n.id ? 'on' : ''} onClick={() => setTab(n.id)}>
            {n.label}
          </button>
        ))}
      </div>
      <aside className="rt-side">
        <div style={{ padding: '2px 8px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                background: THEME.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 19,
                fontWeight: 700,
                color: '#fff',
                fontFamily: head,
              }}
            >
              R
            </span>
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.04em', fontFamily: head }}>RIVERSIDE</div>
              <div style={{ fontSize: 9, color: '#7C766B', letterSpacing: '0.3em', fontFamily: head, fontWeight: 500, marginTop: 3 }}>TIRE &amp; AUTO</div>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: THEME.border, margin: '16px 8px' }} />
        <nav className="rt-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className="rt-navbtn"
              onClick={() => setTab(n.id)}
              style={tab === n.id ? { background: 'rgba(176,40,28,.16)', color: '#fff', boxShadow: `inset 2px 0 0 ${THEME.accent}` } : undefined}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="rt-foot">
          <a href="https://jknojokes.com" style={{ fontFamily: mono, fontSize: 10, color: '#948D81', textDecoration: 'underline' }}>
            JK No Jokes Financials
          </a>
        </div>
      </aside>
      <main className="rt-main">
        <div className="rt-status">
          <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: '0.05em' }}>{DATA.meta.sample_header}</span>
        </div>
        <div className="rt-content">{children}</div>
      </main>
    </div>
  )
}

const PORTAL_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  ${DEMO_RENDER_HINTS}
  html.rt-phone-embed,body.rt-phone-embed{height:100%;overflow:hidden}
  body{background:${C.paper};color:${C.ink}}
  button:disabled{cursor:default}
  .rt-shell{display:flex;min-height:100vh;align-items:stretch;background:${C.paper}}
  .rt-side{width:214px;flex-shrink:0;background:${THEME.side};box-shadow:inset -3px 0 0 ${THEME.accent};display:flex;flex-direction:column;padding:20px 12px;position:sticky;top:0;height:100vh}
  .rt-nav{display:flex;flex-direction:column;gap:2px;flex:1}
  .rt-navbtn{display:block;width:100%;text-align:left;padding:10px 11px;border:none;border-left:2px solid transparent;background:transparent;color:#948D81;font-family:${head};font-size:13px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}
  .rt-navbtn:hover{background:rgba(255,255,255,.05);color:#EDEBE6}
  .rt-foot{padding:12px 8px 0;border-top:1px solid ${THEME.border};margin-top:8px}
  .rt-main{flex:1;min-width:0;background:${C.paper};overflow-x:hidden;max-width:100%}
  .rt-status{display:flex;align-items:center;border-bottom:1px solid ${C.hair};padding:12px 30px;gap:12px;flex-wrap:wrap}
  .rt-content{padding:26px 30px 56px;max-width:1160px}
  .rt-mobilenav{display:none}
  .rt-order-cards,.rt-order-cards-total{display:none}
  .rt-order-card{background:${C.card};border:1px solid ${C.hair};padding:14px 16px}
  .rt-order-card__top{display:flex;justify-content:space-between;gap:12px;margin-bottom:8px;font-family:${mono};font-size:11px;color:${C.muted}}
  .rt-order-card__ticket{color:${C.ink};font-weight:600;white-space:nowrap}
  .rt-order-card__date{white-space:nowrap}
  .rt-order-card__item{font-size:14px;line-height:1.4;margin:0 0 12px;color:${C.ink}}
  .rt-order-card__nums{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin:0}
  .rt-order-card__nums dt{font-family:${ui};font-size:10px;color:${C.muted};text-transform:uppercase;letter-spacing:.06em}
  .rt-order-card__nums dd{margin:2px 0 0;font-family:${mono};font-size:15px;font-weight:500;color:${C.ink}}
  .rt-order-card__profit{color:${C.green}!important;font-weight:600!important}
  .rt-order-card__match{margin:12px 0 0;font-size:11px;color:${C.sub}}
  .rt-fintabs{display:flex;gap:2px;border-bottom:1px solid ${C.hair};margin-bottom:18px;overflow-x:auto;-webkit-overflow-scrolling:touch}
  .rt-fintabs button{padding:8px 14px;font-size:10px;font-family:${ui};letter-spacing:.08em;text-transform:uppercase;background:none;border:none;cursor:pointer;color:${C.muted};border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap}
  .rt-fintabs button.on{color:${C.ink};border-bottom-color:${THEME.side}}
  .rt-fin-pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;align-items:center}
  .rt-fin-pills>span{font-size:9px;color:${C.muted};letter-spacing:.14em;font-weight:600;margin-right:2px;font-family:${ui}}
  .rt-filters{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
  .rt-pill{font-family:${mono};font-size:10px;padding:6px 10px;border:1px solid ${C.hair};background:${C.card};color:${C.sub};cursor:pointer;white-space:nowrap}
  .rt-pill.on{border-color:${THEME.side};background:${THEME.side};color:#fff}
  .rt-pill:disabled{opacity:.5}
  .rt-linkbtn{background:none;border:none;padding:0;font-family:${ui};font-size:11px;font-weight:600;color:${C.ink};text-decoration:underline;text-underline-offset:2px;cursor:pointer;letter-spacing:inherit;text-transform:inherit}
  .rt-chip{font-family:${ui};font-size:12px;padding:8px 12px;border:1px solid ${C.hair};background:${C.card};color:${C.ink};cursor:pointer;text-align:left}
  .rt-chip:hover{border-color:${THEME.side}}
  .rt-chartrow{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-bottom:16px}
  .rt-dash-main{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px;margin-bottom:16px}
  .rt-profit-row{display:grid;grid-template-columns:72px 1fr auto;gap:10px;width:100%;text-align:left;padding:10px 12px;border:none;border-bottom:1px solid ${C.line};background:${C.card};font-family:${ui};font-size:12px;cursor:pointer;color:${C.ink}}
  .rt-profit-row.total{cursor:default;background:#FAF8F4;font-weight:600}
  .rt-profit-row:hover:not(.total){background:#FAF8F4}
  .rt-acct-head{width:100%;text-align:left;padding:12px 14px;border:none;background:#ECE7DD;font-family:${head};font-size:11px;font-weight:700;letter-spacing:.12em;color:${C.ink};cursor:pointer}
  .rt-stmt{--cols:1fr 120px}
  .rt-stmt.cmp{--cols:1fr 104px 104px 92px}
  .rt-stmt__row{display:grid;grid-template-columns:var(--cols);gap:8px;padding:6px 8px;font-family:${ui};font-size:12px;align-items:baseline}
  .rt-stmt__row .num{text-align:right;font-family:${mono};font-variant-numeric:tabular-nums}
  .rt-stmt__row.total{border-top:1px solid ${C.hair};margin-top:2px;padding-top:9px}
  .rt-stmt__row.click{cursor:pointer}
  .rt-stmt__row.click:hover,.rt-clickrow:hover{background:#FAF8F4}
  .rt-clickrow{cursor:pointer}
  .rt-stmt__head{font-size:9px;color:${C.muted};letter-spacing:.1em;text-transform:uppercase;padding-top:10px}
  .rt-stmt__head span{text-align:right}
  .rt-modal{position:fixed;inset:0;background:rgba(27,24,21,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}
  .rt-modal__box{background:${C.card};border:1px solid ${C.hair};padding:18px 20px;width:100%;max-width:640px;max-height:90vh}
  .rt-convo{display:flex;flex-direction:column;gap:10px;padding:16px;min-height:220px;max-height:420px;overflow-y:auto}
  .rt-msg{max-width:86%;padding:10px 13px;font-family:${ui};font-size:14px;line-height:1.55}
  .rt-msg.user{align-self:flex-end;background:${THEME.side};color:#fff}
  .rt-msg.ai{align-self:flex-start;background:#FAF8F4;border:1px solid ${C.line};color:${C.ink}}
  @media(max-width:860px){
    .rt-shell{flex-direction:column}
    .rt-side{display:none}
    .rt-mobilenav{display:flex;overflow-x:auto;gap:4px;padding:8px 10px;background:${THEME.side};position:sticky;top:0;z-index:20;-webkit-overflow-scrolling:touch;box-shadow:inset 0 -3px 0 ${THEME.accent}}
    .rt-mobilenav button{flex-shrink:0;border:none;background:rgba(255,255,255,.06);color:#948D81;font-family:${head};font-size:11px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;padding:8px 12px;cursor:pointer;white-space:nowrap}
    .rt-mobilenav button.on{background:rgba(176,40,28,.2);color:#fff;box-shadow:inset 0 -2px 0 ${THEME.accent}}
    .rt-content{padding:18px 14px 48px}
    .rt-status{padding:10px 14px}
    .rt-order-table{display:none}
    .rt-order-cards{display:flex;flex-direction:column;gap:10px}
    .rt-order-cards-total{display:block}
    .rt-hero{font-size:56px!important}
    .rt-stmt{--cols:1fr 92px}
    .rt-stmt.cmp{--cols:1fr 80px 80px 72px}
  }
  .rt-embed.rt-shell{flex-direction:column;height:100vh;max-height:100vh;min-height:0;overflow:hidden}
  .rt-embed .rt-side{display:none!important}
  .rt-embed .rt-mobilenav{display:flex!important;overflow-x:auto;gap:4px;padding:8px 10px;background:${THEME.side};position:sticky;top:0;z-index:20;-webkit-overflow-scrolling:touch;box-shadow:inset 0 -3px 0 ${THEME.accent}}
  .rt-embed .rt-mobilenav button{flex-shrink:0;border:none;background:rgba(255,255,255,.06);color:#948D81;font-family:${head};font-size:11px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;padding:8px 12px;cursor:pointer;white-space:nowrap}
  .rt-embed .rt-mobilenav button.on{background:rgba(176,40,28,.2);color:#fff;box-shadow:inset 0 -2px 0 ${THEME.accent}}
  .rt-embed .rt-content{padding:14px 12px 28px;max-width:none;overflow-y:visible}
  .rt-embed .rt-status{padding:8px 12px}
  .rt-embed .rt-order-table{display:none}
  .rt-embed .rt-order-cards{display:flex;flex-direction:column;gap:10px}
  .rt-embed .rt-order-cards-total{display:block}
  .rt-embed .rt-foot{display:none}
  .rt-embed .rt-main{flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch}
  .rt-embed .rt-mobilenav{flex-shrink:0}
  @media(max-width:430px){
    .rt-shell{overflow-x:hidden;max-width:100vw}
    .rt-content{padding:16px 12px 40px;overflow-x:hidden}
    .rt-hero{font-size:46px!important}
    .rt-chartrow{grid-template-columns:1fr}
    .rt-dash-main{grid-template-columns:1fr}
    .rt-modal{padding:10px;align-items:flex-end}
    .rt-modal__box{max-width:min(100%,calc(100vw - 16px));padding:14px 12px;max-height:92vh}
    .rt-modal__box table{min-width:300px}
    .rt-stmt{--cols:1fr 72px}
    .rt-stmt.cmp{--cols:1fr 64px 64px 56px}
    .rt-status span{font-size:10px;line-height:1.35;word-break:break-word}
    .rt-content input,.rt-content select{font-size:16px!important}
  }
`

/* ---------- Portal ---------- */

export default function RiversideTiresPortal() {
  const router = useRouter()
  const embed = router.asPath.includes('embed=1') || isDemoEmbedQuery(router.query)
  const phoneDemo = isPhoneDemoUrl() || router.asPath.includes('phone=1') || router.query?.phone === '1'
  const [tab, setTab] = useState('dashboard')
  const [openPeriod, setOpenPeriod] = useState('7d')
  const [finTab, setFinTab] = useState('pl')
  const [plPeriod, setPlPeriod] = useState('all')
  const [phoneTourActive, setPhoneTourActive] = useState(false)
  const phoneTabTimerRef = useRef(null)
  const phoneScrollTimerRef = useRef(null)

  const stopPhoneDemoMotion = () => {
    setPhoneTourActive(false)
    if (phoneTabTimerRef.current) {
      window.clearTimeout(phoneTabTimerRef.current)
      phoneTabTimerRef.current = null
    }
    if (phoneScrollTimerRef.current) {
      window.clearInterval(phoneScrollTimerRef.current)
      phoneScrollTimerRef.current = null
    }
  }

  const startPhoneDemoMotion = () => {
    if (!phoneDemo) return
    stopPhoneDemoMotion()
    setPhoneTourActive(true)

    const visitTab = (index) => {
      if (index >= PHONE_DEMO_TABS.length) return
      setTab(PHONE_DEMO_TABS[index])
      if (index + 1 < PHONE_DEMO_TABS.length) {
        const dwell = PHONE_DEMO_TABS[index] === 'orders' ? PHONE_TAB_MS_ORDERS : PHONE_TAB_MS
        phoneTabTimerRef.current = window.setTimeout(() => visitTab(index + 1), dwell)
      }
    }
    visitTab(0)
  }

  useEffect(() => {
    if (!phoneDemo) return undefined
    const onMessage = (event) => {
      if (event.data?.type !== PHONE_DEMO_MSG) return
      if (event.data.cmd === 'start') startPhoneDemoMotion()
      if (event.data.cmd === 'stop') stopPhoneDemoMotion()
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      stopPhoneDemoMotion()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneDemo])

  useEffect(() => {
    if (!phoneDemo) return undefined
    document.documentElement.classList.add('rt-phone-embed')
    document.body.classList.add('rt-phone-embed')
    return () => {
      document.documentElement.classList.remove('rt-phone-embed')
      document.body.classList.remove('rt-phone-embed')
    }
  }, [phoneDemo])

  useEffect(() => {
    const onTourTab = phoneTourActive && PHONE_DEMO_TABS.includes(tab)
    if (!phoneDemo || !onTourTab) {
      if (phoneScrollTimerRef.current) {
        window.clearInterval(phoneScrollTimerRef.current)
        phoneScrollTimerRef.current = null
      }
      return undefined
    }
    const el = document.querySelector('.rt-main') || document.querySelector('.rt-content') || document.scrollingElement
    if (!el) return undefined
    el.scrollTop = 0
    if (phoneScrollTimerRef.current) window.clearInterval(phoneScrollTimerRef.current)
    const step = tab === 'orders' ? PHONE_SCROLL_STEP_ORDERS : PHONE_SCROLL_STEP
    phoneScrollTimerRef.current = window.setInterval(() => {
      const max = el.scrollHeight - el.clientHeight
      if (max <= 0) return
      if (el.scrollTop >= max - 10) el.scrollTop = 0
      else el.scrollTop += step
    }, PHONE_SCROLL_MS)
    return () => {
      if (phoneScrollTimerRef.current) {
        window.clearInterval(phoneScrollTimerRef.current)
        phoneScrollTimerRef.current = null
      }
    }
  }, [phoneDemo, phoneTourActive, tab])

  const navItem = NAV.find((n) => n.id === tab) || NAV[0]

  return (
    <>
      <Head>
        <title>{`${BIZ} — ${navItem.label}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <DemoFontLinks />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: PORTAL_CSS }} />

      <DemoLobby />

      <Shell embed={embed} tab={tab} setTab={setTab}>
        {tab === 'dashboard' && (
          <DashboardTab
            period={openPeriod}
            setPeriod={setOpenPeriod}
            onOpenOrders={() => setTab('orders')}
            onOpenFinancials={(p) => {
              setTab('financials')
              setFinTab('pl')
              setPlPeriod(p || 'all')
            }}
            onOpenSalesItems={() => setTab('inventory')}
          />
        )}
        {tab === 'financials' && <FinancialsTab fin={finTab} setFin={setFinTab} plPeriod={plPeriod} setPlPeriod={setPlPeriod} />}
        {tab === 'inventory' && <SalesItemsTab />}
        {tab === 'orders' && <OrdersTab initialPeriod={openPeriod} />}
        {tab === 'stock' && <StockTab />}
        {tab === 'ai' && <AskTab />}
      </Shell>
    </>
  )
}

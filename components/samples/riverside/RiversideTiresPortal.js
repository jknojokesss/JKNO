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

const CF_PERIOD_KEYS = [...MONTHS.map((m) => m.month), 'all']
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
  ...MONTHS.map((m, i) => ({
    id: m.month,
    label: m.label,
    full: monthYear(m),
    keys: [m.month],
    prior: i > 0 ? [MONTHS[i - 1].month] : null,
  })),
  {
    id: 'Q2',
    label: 'Q2',
    full: 'Q2 2026 (Apr–Jun)',
    keys: ['2026-04', '2026-05', '2026-06'],
    prior: ['2026-01', '2026-02', '2026-03'],
  },
  { id: 'YTD', label: 'YTD', full: `Jan–${monthShort(LAST_MONTH.label)} 2026`, keys: MONTHS.map((m) => m.month), prior: null },
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
  const [key, setKey] = useState(CF_PERIOD_KEYS[CF_PERIOD_KEYS.length - 1])
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
  const rows = MONTHS.map((m) => {
    const gross = m.revenue - m.cogs
    return { ...m, gross, margin: (m.profit / m.revenue) * 100 }
  })
  const ytd = {
    revenue: sumBy(rows, 'revenue'),
    cogs: sumBy(rows, 'cogs'),
    gross: sumBy(rows, 'gross'),
    opex: sumBy(rows, 'opex'),
    profit: sumBy(rows, 'profit'),
    tiresSold: sumBy(rows, 'tiresSold'),
  }
  ytd.margin = (ytd.profit / ytd.revenue) * 100
  const lines = [
    { label: 'Revenue', get: (r) => paren(r.revenue) },
    { label: 'Cost of goods sold', get: (r) => paren(-r.cogs) },
    { label: 'Gross profit', get: (r) => paren(r.gross), strong: true },
    { label: 'Operating expenses', get: (r) => paren(-r.opex) },
    { label: 'Net income', get: (r) => paren(r.profit), strong: true },
    { label: 'Net margin', get: (r) => pct(r.margin) },
    { label: 'Tires sold', get: (r) => String(r.tiresSold) },
  ]
  return (
    <div style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
        <thead>
          <tr>
            <th style={hcell()}>2026</th>
            {rows.map((m) => (
              <th key={m.month} style={hcell('right')}>
                <button type="button" className="rt-linkbtn" onClick={() => onPickMonth(m.month)} title={`Open ${monthYear(m)} P&L`}>
                  {m.label}
                </button>
              </th>
            ))}
            <th style={{ ...hcell('right'), color: C.ink }}>YTD</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.label}>
              <td style={cell('left', { fontWeight: l.strong ? 600 : 400, whiteSpace: 'nowrap' })}>{l.label}</td>
              {rows.map((m) => (
                <td key={m.month} style={cell('right', { fontFamily: mono, fontWeight: l.strong ? 600 : 400 })}>
                  {l.get(m)}
                </td>
              ))}
              <td style={cell('right', { fontFamily: mono, fontWeight: 700, background: '#FAF8F4' })}>
                {l.get(ytd)}
                {l.label === 'Revenue' ? <TieMark ok={ytd.revenue === DATA.ytd_revenue} /> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AccountBalancesView({ onDrill }) {
  const key = Object.keys(DATA.balance_sheet).slice(-1)[0]
  const bs = DATA.balance_sheet[key]
  const groups = [
    { type: 'Asset', rows: bs.assets },
    { type: 'Liability', rows: bs.liabilities },
    { type: 'Equity', rows: bs.equity },
  ]
  const assets = sumBy(bs.assets)
  const liab = sumBy(bs.liabilities)
  const eq = sumBy(bs.equity)
  return (
    <div style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto', maxWidth: 760 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
        <thead>
          <tr>
            <th style={hcell()}>Account</th>
            <th style={hcell()}>Type</th>
            <th style={hcell('right')}>Balance · {bs.label}</th>
          </tr>
        </thead>
        <tbody>
          {groups.flatMap((g) =>
            g.rows.map((l) => {
              const canDrill = !!l.drill?.length
              return (
                <tr
                  key={`${g.type}-${l.label}`}
                  className={canDrill ? 'rt-clickrow' : undefined}
                  tabIndex={canDrill ? 0 : undefined}
                  onClick={canDrill ? () => onDrill({ title: l.label, period: `As of ${bs.label}`, rows: l.drill, total: l.amount }) : undefined}
                  onKeyDown={canDrill ? (e) => e.key === 'Enter' && onDrill({ title: l.label, period: `As of ${bs.label}`, rows: l.drill, total: l.amount }) : undefined}
                >
                  <td style={cell()}>
                    {l.label}
                    {canDrill ? <span style={{ color: C.muted, marginLeft: 6 }}>›</span> : null}
                  </td>
                  <td style={cell('left', { color: C.sub })}>{g.type}</td>
                  <td style={cell('right', { fontFamily: mono })}>{paren(l.amount)}</td>
                </tr>
              )
            }),
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={cell('left', { fontWeight: 600, borderBottom: 'none' })}>
              Net worth (assets less liabilities)
            </td>
            <td style={cell('right', { fontFamily: mono, fontWeight: 700, borderBottom: 'none' })}>
              {paren(assets - liab)}
              <TieMark ok={Math.abs(assets - liab - eq) < 1} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

const FIN_TABS = [
  { id: 'pl', label: 'P&L' },
  { id: 'cf', label: 'Cash Flow' },
  { id: 'bs', label: 'Balance Sheet' },
  { id: 'monthly', label: 'Monthly Table' },
  { id: 'accounts', label: 'Account Balances' },
]

function FinancialsTab() {
  const [fin, setFin] = useState('pl')
  const [plPeriod, setPlPeriod] = useState(LAST_MONTH.month)
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

function DashboardTab({ period, setPeriod, onOpenOrders }) {
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
    topSixUnits < augTires.tires_sold_units

  const strip = [
    ['Revenue', fmt0(m.revenue)],
    ['COGS', fmt0(m.cogs)],
    ['Operating', fmt0(m.opex)],
    ['Net margin', pct((m.profit / m.revenue) * 100)],
    ['Tires sold', String(m.tiresSold)],
  ]

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
          <div key={l} style={{ ...panel, flex: '1 1 140px', marginBottom: 0 }}>
            <div style={{ fontFamily: ui, fontSize: 10, color: C.muted }}>{l}</div>
            <div style={{ fontFamily: mono, fontSize: 18, marginTop: 6, fontWeight: 500 }}>
              {v}
              {l === 'Tires sold' ? <TieMark ok={m.tiresSold === augTires.tires_sold_units} /> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="rt-chartrow">
        <div style={{ ...panel, marginBottom: 0 }}>
          <PanelTitle>Revenue by month</PanelTitle>
          <BarChart label="Revenue by month" items={MONTHS.map((x) => ({ label: x.label, value: x.revenue }))} fmt={(v) => `${(v / 1000).toFixed(1)}k`} />
        </div>
        <div style={{ ...panel, marginBottom: 0 }}>
          <PanelTitle>Net profit by month</PanelTitle>
          <BarChart label="Net profit by month" items={MONTHS.map((x) => ({ label: x.label, value: x.profit }))} fmt={(v) => `${(v / 1000).toFixed(1)}k`} />
        </div>
      </div>
      <div className="rt-chartrow">
        <div style={{ ...panel, marginBottom: 0 }}>
          <PanelTitle>Net margin</PanelTitle>
          <LineChart label="Net margin by month" items={MONTHS.map((x) => ({ label: x.label, value: (x.profit / x.revenue) * 100 }))} fmt={(v) => `${v.toFixed(1)}%`} />
        </div>
        <div style={{ ...panel, marginBottom: 0 }}>
          <PanelTitle>Tires sold</PanelTitle>
          <BarChart label="Tires sold by month" items={MONTHS.map((x) => ({ label: x.label, value: x.tiresSold }))} fmt={(v) => String(v)} />
        </div>
      </div>

      <div className="rt-chartrow">
        <div style={{ ...panel, marginBottom: 0 }}>
          <PanelTitle
            right={
              mixTie ? (
                <span style={{ fontFamily: mono, fontSize: 10, color: C.muted }}>
                  {fmt0(mixTotal)} total <TieMark ok />
                </span>
              ) : null
            }
          >
            Sales mix · {monthShort(m.label)}
          </PanelTitle>
          {DATA.sales_mix_aug.map((s) => (
            <div key={s.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: ui, fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: C.ink }}>{s.name}</span>
                <span style={{ fontFamily: mono, color: C.sub }}>
                  {fmt0(s.revenue)} · {pct(s.pct)}
                </span>
              </div>
              <div style={{ height: 6, background: C.line }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: THEME.side }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...panel, marginBottom: 0, overflow: 'auto' }}>
          <PanelTitle
            right={
              <span style={{ fontFamily: mono, fontSize: 10, color: C.muted }}>
                {fmt0(topSixRev)} · {topSixUnits} units <TieMark ok={topSixTie} />
              </span>
            }
          >
            Top sizes · {monthShort(m.label)}
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
          </table>
        </div>
      </div>
    </>
  )
}

/* ---------- Sales & Items ---------- */

function SalesItemsTab() {
  const [view, setView] = useState('ranked')
  const [sort, setSort] = useState('revenue')
  const m = LAST_MONTH
  const items = DATA.sales_items_aug
  const ranked = [...items].sort((a, b) => b[sort] - a[sort])
  const augTires = DATA.aug_tire_sales
  const newTireLines = items.filter((i) => i.category === 'New tire')
  const newRev = sumBy(newTireLines, 'revenue')
  const best = [...MONTHS].sort((a, b) => b.profit - a.profit)[0]
  return (
    <>
      <PageHead title={NAV.find((n) => n.id === 'inventory').title} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label={`${monthShort(m.label)} revenue`} value={fmt0(m.revenue)} tie={sumBy(items, 'revenue') === m.revenue} />
        <Kpi label={`Tires sold · ${monthShort(m.label)}`} value={String(m.tiresSold)} tie={m.tiresSold === augTires.tires_sold_units} />
        <Kpi label="New tire revenue" value={fmt0(augTires.new_tire_revenue)} tie={newRev === augTires.new_tire_revenue} />
        <Kpi label="YTD revenue" value={fmt0(DATA.ytd_revenue)} tie={sumBy(MONTHS, 'revenue') === DATA.ytd_revenue} />
        <Kpi label="Best month · net" value={`${monthShort(best.label)} · ${fmt0(best.profit)}`} />
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
            <span>RANK BY</span>
            <Pill on={sort === 'revenue'} onClick={() => setSort('revenue')}>
              Revenue
            </Pill>
            <Pill on={sort === 'units'} onClick={() => setSort('units')}>
              Units
            </Pill>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
              <thead>
                <tr>
                  <th style={hcell()}>#</th>
                  <th style={hcell()}>Item</th>
                  <th style={hcell()}>Category</th>
                  <th style={hcell('right')}>Units</th>
                  <th style={hcell('right')}>Revenue</th>
                  <th style={hcell('right')}>Per unit</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((t, i) => (
                  <tr key={t.item} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                    <td style={cell('left', { fontFamily: mono, color: C.muted })}>{i + 1}</td>
                    <td style={cell('left', { fontFamily: mono })}>{t.item}</td>
                    <td style={cell('left', { color: C.sub, fontSize: 11 })}>{t.category}</td>
                    <td style={cell('right', { fontFamily: mono })}>{t.units}</td>
                    <td style={cell('right', { fontFamily: mono, fontWeight: 600 })}>{fmt0(t.revenue)}</td>
                    <td style={cell('right', { fontFamily: mono, color: C.sub })}>{t.units ? fmtC(t.revenue / t.units) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {view === 'month' && (
        <div style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead>
              <tr>
                <th style={hcell()}>Month</th>
                <th style={hcell('right')}>Revenue</th>
                <th style={hcell('right')}>Tires sold</th>
                <th style={hcell('right')}>Net income</th>
                <th style={hcell('right')}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((x, i) => (
                <tr key={x.month} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                  <td style={cell('left', { fontFamily: mono })}>{monthYear(x)}</td>
                  <td style={cell('right', { fontFamily: mono })}>{fmt0(x.revenue)}</td>
                  <td style={cell('right', { fontFamily: mono })}>{x.tiresSold}</td>
                  <td style={cell('right', { fontFamily: mono, fontWeight: 600 })}>{fmt0(x.profit)}</td>
                  <td style={cell('right', { fontFamily: mono, color: C.sub })}>{pct((x.profit / x.revenue) * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  const [estOnly, setEstOnly] = useState(false)

  const rows = ORDERS.filter((o) => {
    if (!inPeriod(o, period)) return false
    if (source !== 'all' && o.source !== source) return false
    if (size !== 'all' && o.size !== size) return false
    if (flaggedOnly && !o.flagged) return false
    if (estOnly && !o.est) return false
    const needle = q.trim().toLowerCase()
    if (needle && !`${o.ticket} ${o.item} ${o.size} ${o.source}`.toLowerCase().includes(needle)) return false
    return true
  })
  const t = totalsOf(rows)
  const filtered = q.trim() || source !== 'all' || size !== 'all' || flaggedOnly || estOnly

  const reset = () => {
    setQ('')
    setSource('all')
    setSize('all')
    setFlaggedOnly(false)
    setEstOnly(false)
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
        <Kpi label="Tickets" value={String(t.tickets)} />
        <Kpi label="Sales" value={fmt0(t.sale)} />
        <Kpi label="Est. cost" value={fmt0(t.cost)} color={C.sub} />
        <Kpi label="Est. gross" value={fmt0(t.profit)} color={C.green} sub={`${pct(t.margin)} est. margin`} />
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
          Review only
        </Pill>
        <Pill on={estOnly} onClick={() => setEstOnly((v) => !v)}>
          Est. cost only
        </Pill>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead>
                <tr>
                  <th style={hcell()}>Date</th>
                  <th style={hcell()}>Ticket</th>
                  <th style={hcell()}>Line</th>
                  <th style={hcell('right')}>Sale</th>
                  <th style={hcell('right')}>Est. cost</th>
                  <th style={hcell('right')}>Est. profit</th>
                  <th style={hcell('right')}>Margin</th>
                  <th style={hcell()}>Match</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.ticket} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                    <td style={cell('left', { fontFamily: mono, fontSize: 10, color: C.muted, whiteSpace: 'nowrap' })}>{fmtDate(r.date)}</td>
                    <td style={cell('left', { fontFamily: mono, fontSize: 10 })}>{r.ticket}</td>
                    <td style={cell()}>
                      {r.item}
                      {r.flagged ? (
                        <span style={{ marginLeft: 8, fontFamily: mono, fontSize: 9, color: C.sub, border: `1px solid ${C.hair}`, padding: '1px 5px' }}>Review</span>
                      ) : null}
                    </td>
                    <td style={cell('right', { fontFamily: mono, fontWeight: 500 })}>{fmtC(r.sale)}</td>
                    <td style={cell('right', { fontFamily: mono, color: C.sub })}>{fmtC(r.cost)}</td>
                    <td style={cell('right', { fontFamily: mono, fontWeight: 600, color: C.green })}>{fmtC(r.profit)}</td>
                    <td style={cell('right', { fontFamily: mono, color: C.green })}>{pct(r.margin)}</td>
                    <td style={cell('left', { fontSize: 10, color: C.sub })}>{r.source}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#ECE7DD' }}>
                  <td colSpan={3} style={cell('left', { fontWeight: 600, borderBottom: 'none' })}>
                    {t.tickets} ticket{t.tickets === 1 ? '' : 's'}
                  </td>
                  <td style={cell('right', { fontFamily: mono, fontWeight: 700, borderBottom: 'none' })}>{fmtC(t.sale)}</td>
                  <td style={cell('right', { fontFamily: mono, fontWeight: 700, borderBottom: 'none' })}>{fmtC(t.cost)}</td>
                  <td style={cell('right', { fontFamily: mono, fontWeight: 700, color: C.green, borderBottom: 'none' })}>{fmtC(t.profit)}</td>
                  <td style={cell('right', { fontFamily: mono, fontWeight: 700, color: C.green, borderBottom: 'none' })}>{pct(t.margin)}</td>
                  <td style={cell('left', { borderBottom: 'none' })} />
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
  const snap = stockSnapFor(asOf)
  const rows = stockRowsFor(asOf)
  const units = sumBy(rows, 'onHand')
  const value = snap.inventory_value
  const bsInv = inventoryOnBs(asOf)
  const invTie = bsInv != null && value === bsInv

  const exportCsv = () => {
    downloadCsv(`riverside-tires-stock-${asOf}.csv`, [
      ['As of', 'Size', 'Description', 'On hand', 'Unit cost', 'Value'],
      ...rows.map((r) => [snap.label, r.size, r.desc, r.onHand, r.unitCost.toFixed(2), r.value.toFixed(2)]),
    ])
  }

  return (
    <>
      <PageHead title={NAV.find((n) => n.id === 'stock').title} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="Inventory value" value={fmt0(value)} tie={invTie} sub={snap.label} />
        <Kpi label="Units on hand" value={String(units)} />
        <Kpi label="Sizes stocked" value={String(rows.length)} />
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
        <button type="button" className="rt-pill" style={{ marginLeft: 'auto' }} onClick={exportCsv}>
          Export CSV
        </button>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.hair}`, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr>
              <th style={hcell()}>Size</th>
              <th style={hcell()}>Description</th>
              <th style={hcell('right')}>On hand</th>
              <th style={hcell('right')}>Unit cost</th>
              <th style={hcell('right')}>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.size} style={{ background: i % 2 ? '#FAF8F4' : C.card }}>
                <td style={cell('left', { fontFamily: mono })}>{s.size}</td>
                <td style={cell()}>{s.desc}</td>
                <td style={cell('right', { fontFamily: mono, fontWeight: 600 })}>{s.onHand}</td>
                <td style={cell('right', { fontFamily: mono, color: C.sub })}>{fmtC(s.unitCost)}</td>
                <td style={cell('right', { fontFamily: mono })}>{fmtC(s.value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#ECE7DD' }}>
              <td colSpan={2} style={cell('left', { fontWeight: 600, borderBottom: 'none' })}>
                Total
              </td>
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
          <div className="rt-convo" aria-live="polite">
            {messages.length === 0 ? (
              <div style={{ color: C.muted, fontFamily: ui, fontSize: 13, textAlign: 'center', margin: 'auto' }}>Pick a question or type your own.</div>
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
              placeholder="Ask about your books"
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
        {tab === 'dashboard' && <DashboardTab period={openPeriod} setPeriod={setOpenPeriod} onOpenOrders={() => setTab('orders')} />}
        {tab === 'financials' && <FinancialsTab />}
        {tab === 'inventory' && <SalesItemsTab />}
        {tab === 'orders' && <OrdersTab initialPeriod={openPeriod} />}
        {tab === 'stock' && <StockTab />}
        {tab === 'ai' && <AskTab />}
      </Shell>
    </>
  )
}

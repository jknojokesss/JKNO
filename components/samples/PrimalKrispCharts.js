import { useState, useCallback } from 'react'
import {
  BRICK,
  CHARCOAL,
  SAGE,
  BROWN,
  RED,
  STONE,
  MUTED,
  INK,
  MONO,
  UI,
  money,
  moneyK,
  CHANNEL_COLORS,
  AMBER,
} from './primalKrispUtils'

const sans = UI

function useChartTip() {
  const [tip, setTip] = useState(null)
  const show = useCallback((e, label, value) => {
    const pt = e.touches?.[0] || e
    setTip({ x: pt.clientX, y: pt.clientY, label, value })
  }, [])
  const hide = useCallback(() => setTip(null), [])
  const node = tip ? (
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        left: tip.x + 12,
        top: Math.max(8, tip.y - 36),
        zIndex: 9999,
        background: CHARCOAL,
        color: '#fff',
        padding: '8px 11px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: UI,
        pointerEvents: 'none',
        maxWidth: '240px',
        boxShadow: '0 4px 14px rgba(0,0,0,.18)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '2px' }}>{tip.label}</div>
      <div style={{ fontFamily: MONO }}>{typeof tip.value === 'number' ? money(tip.value) : tip.value}</div>
    </div>
  ) : null
  return { show, hide, node }
}

function ChartFrame({ tip, hide, children, style }) {
  return (
    <div style={{ position: 'relative', ...style }} onMouseLeave={hide}>
      {tip}
      {children}
    </div>
  )
}

function TipRect({ show, hide, x, y, width, height, fill, opacity, label, value, rx }) {
  if (width <= 0 || height <= 0) return null
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      opacity={opacity}
      rx={rx}
      onMouseEnter={(e) => show(e, label, value)}
      onMouseMove={(e) => show(e, label, value)}
      onTouchStart={(e) => {
        e.preventDefault()
        show(e, label, value)
      }}
      onTouchEnd={hide}
      style={{ cursor: 'pointer' }}
    />
  )
}

function ChartLegend({ items, yBase = 198 }) {
  return (
    <g fontFamily={sans} fontSize="9.5" fill={CHARCOAL}>
      {items.map((it, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        const x = 16 + col * 155
        const y = yBase + row * 15
        return (
          <g key={it.label} transform={`translate(${x}, ${y})`}>
            <rect width={10} height={10} fill={it.color} />
            <text x={14} y={9}>{it.label}</text>
          </g>
        )
      })}
    </g>
  )
}

export function StackedSalesByChannel({ months, channels, accent = BRICK }) {
  const { show, hide, node } = useChartTip()
  const totals = months.map((m) => channels.reduce((s, ch) => s + (m[ch] || 0), 0))
  const max = Math.max(...totals, 1)
  const w = 58
  const vbW = 16 + months.length * w
  const vbH = 248
  const legendItems = channels.map((ch) => ({ label: ch, color: CHANNEL_COLORS[ch] || accent }))
  return (
    <ChartFrame tip={node} hide={hide}>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: '100%', minWidth: '520px', display: 'block' }}>
        {months.map((m, i) => {
          const x = 16 + i * w
          let y = 148
          const total = totals[i] || 1
          return (
            <g key={m.month || m.label}>
              {channels.map((ch) => {
                const v = m[ch] || 0
                const h = (v / max) * 118
                y -= h
                return (
                  <TipRect
                    key={ch}
                    show={show}
                    hide={hide}
                    x={x}
                    y={y}
                    width={22}
                    height={h}
                    fill={CHANNEL_COLORS[ch] || accent}
                    label={`${m.label} · ${ch}`}
                    value={v}
                  />
                )
              })}
              <text x={x + 11} y={162} textAnchor="middle" fontSize="9.5" fill={MUTED} fontFamily={sans}>
                {m.label}
              </text>
              <text x={x + 11} y={176} textAnchor="middle" fontSize="9" fill={INK} fontWeight="600" fontFamily={sans}>
                {moneyK(total)}
              </text>
            </g>
          )
        })}
        <ChartLegend items={legendItems} yBase={208} />
      </svg>
    </ChartFrame>
  )
}

export function CashForecast13({ forecast, accent = BRICK }) {
  const { show, hide, node } = useChartTip()
  const weeks = forecast.weeks || []
  const wMax = Math.max(...weeks.map((w) => Math.max(w.cash_in, w.cash_out)), 1)
  const cumMin = Math.min(...weeks.map((w) => w.ending_cash), forecast.starting_cash)
  const cumMax = Math.max(...weeks.map((w) => w.ending_cash), forecast.starting_cash)
  const vbW = 20 + weeks.length * 58
  const vbH = 210
  return (
    <ChartFrame tip={node} hide={hide}>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: '100%', minWidth: '640px', display: 'block' }}>
        {weeks.map((w, i) => {
          const x = 20 + i * 58
          const inH = (w.cash_in / wMax) * 92
          const outH = (w.cash_out / wMax) * 92
          return (
            <g key={w.week_of}>
              <TipRect show={show} hide={hide} x={x} y={118 - inH} width={20} height={inH} fill={CHARCOAL} label={`${w.label} · Cash in`} value={w.cash_in} />
              <TipRect show={show} hide={hide} x={x + 23} y={118 - outH} width={20} height={outH} fill={STONE} label={`${w.label} · Cash out`} value={w.cash_out} />
              <TipRect
                show={show}
                hide={hide}
                x={x}
                y={158}
                width={44}
                height={12}
                fill="transparent"
                label={`${w.label} · Ending cash`}
                value={w.ending_cash}
              />
              <text x={x + 21} y={132} textAnchor="middle" fontSize="9.5" fill={MUTED} fontFamily={sans}>
                {w.label}
              </text>
              <text
                x={x + 21}
                y={146}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                fill={w.net < 0 ? accent : MUTED}
                fontFamily={sans}
              >
                {moneyK(w.net)}
              </text>
            </g>
          )
        })}
        <polyline
          fill="none"
          stroke={CHARCOAL}
          strokeWidth="1.6"
          points={weeks
            .map(
              (w, i) =>
                `${41 + i * 58},${168 - ((w.ending_cash - cumMin) / Math.max(1, cumMax - cumMin)) * 26}`,
            )
            .join(' ')}
        />
        {weeks.map((w, i) => (
          <circle
            key={w.week_of}
            cx={41 + i * 58}
            cy={168 - ((w.ending_cash - cumMin) / Math.max(1, cumMax - cumMin)) * 26}
            r="4"
            fill={CHARCOAL}
            onMouseEnter={(e) => show(e, `${w.label} · Ending cash`, w.ending_cash)}
            onTouchStart={(e) => show(e, `${w.label} · Ending cash`, w.ending_cash)}
            style={{ cursor: 'pointer' }}
          />
        ))}
        <ChartLegend
          items={[
            { label: 'Cash in', color: CHARCOAL },
            { label: 'Cash out', color: STONE },
          ]}
        />
      </svg>
    </ChartFrame>
  )
}

export function SubscriberLineChart({ monthly, accent = BRICK }) {
  const { show, hide, node } = useChartTip()
  const pts = monthly || []
  const maxA = Math.max(...pts.map((p) => p.active_end), 1)
  const w = 58
  const vbW = 30 + pts.length * w
  const vbH = 200
  const lineY = (v) => 110 - (v / maxA) * 85
  return (
    <ChartFrame tip={node} hide={hide}>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: '100%', minWidth: '520px', display: 'block' }}>
        <polyline
          fill="none"
          stroke={accent}
          strokeWidth="2"
          points={pts.map((p, i) => `${44 + i * w},${lineY(p.active_end)}`).join(' ')}
        />
        {pts.map((p, i) => (
          <g key={p.label}>
            <circle
              cx={44 + i * w}
              cy={lineY(p.active_end)}
              r="5"
              fill={accent}
              onMouseEnter={(e) => show(e, `${p.label} · Active`, p.active_end)}
              onTouchStart={(e) => show(e, `${p.label} · Active`, p.active_end)}
              style={{ cursor: 'pointer' }}
            />
            <text x={44 + i * w} y={128} textAnchor="middle" fontSize="9" fill={MUTED} fontFamily={sans}>
              {p.label}
            </text>
            <text x={44 + i * w} y={140} textAnchor="middle" fontSize="9.5" fontWeight="600" fill={INK} fontFamily={sans}>
              {p.active_end}
            </text>
          </g>
        ))}
        {pts.map((p, i) => {
          const x = 44 + i * w
          const newH = (p.new / Math.max(...pts.map((x) => x.new), 1)) * 16
          const canH = (p.cancelled / Math.max(...pts.map((x) => x.cancelled), 1)) * 16
          return (
            <g key={`bars-${p.label}`}>
              <TipRect show={show} hide={hide} x={x - 10} y={148 - newH} width={8} height={newH} fill={SAGE} label={`${p.label} · New`} value={p.new} />
              <TipRect show={show} hide={hide} x={x + 2} y={148 - canH} width={8} height={canH} fill={STONE} label={`${p.label} · Cancelled`} value={p.cancelled} />
            </g>
          )
        })}
        <ChartLegend
          items={[
            { label: 'Active', color: accent },
            { label: 'New', color: SAGE },
            { label: 'Cancelled', color: STONE },
          ]}
        />
      </svg>
    </ChartFrame>
  )
}

export function RenewalBars14({ days, accent = BRICK }) {
  const { show, hide, node } = useChartTip()
  const maxR = Math.max(...days.map((d) => d.renewals), 1)
  const w = 42
  const vbW = 20 + days.length * w
  return (
    <ChartFrame tip={node} hide={hide}>
      <svg viewBox={`0 0 ${vbW} 150`} style={{ width: '100%', minWidth: '480px', display: 'block' }}>
        {days.map((d, i) => {
          const x = 20 + i * w
          const h = (d.renewals / maxR) * 100
          return (
            <g key={d.date}>
              <TipRect show={show} hide={hide} x={x} y={118 - h} width={28} height={h} fill={accent} opacity={0.9} label={fmtShort(d.date)} value={d.renewals} />
              <text x={x + 14} y={130} textAnchor="middle" fontSize="8" fill={MUTED} fontFamily={sans}>
                {fmtShort(d.date)}
              </text>
              <text x={x + 14} y={142} textAnchor="middle" fontSize="8.5" fontWeight="600" fill={INK} fontFamily={sans}>
                {d.renewals}
              </text>
            </g>
          )
        })}
      </svg>
    </ChartFrame>
  )
}

function fmtShort(iso) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(`${iso}T12:00:00.000Z`))
}

export function TastingLiftChart({ tastings, accent = BRICK }) {
  const { show, hide, node } = useChartTip()
  const rows = (tastings || []).filter((t) => t.store_bags_4wk_before != null)
  const maxB = Math.max(...rows.flatMap((t) => [t.store_bags_4wk_before, t.store_bags_4wk_after]), 1)
  const rowH = 36
  const vbH = 44 + rows.length * rowH
  const vbW = 420
  return (
    <ChartFrame tip={node} hide={hide}>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: '100%', minWidth: '360px', display: 'block' }}>
        {rows.map((t, i) => {
          const y = 24 + i * rowH
          const bw = (v) => (v / maxB) * 120
          return (
            <g key={t.date + t.store}>
              <text x={0} y={y + 12} fontSize="10" fill={INK} fontFamily={sans}>
                {t.store.length > 22 ? t.store.slice(0, 20) + '…' : t.store}
              </text>
              <TipRect show={show} hide={hide} x={140} y={y} width={bw(t.store_bags_4wk_before)} height={12} fill={STONE} label={`${t.store} · 4 wk before`} value={t.store_bags_4wk_before} />
              <TipRect show={show} hide={hide} x={140} y={y + 14} width={bw(t.store_bags_4wk_after)} height={12} fill={accent} label={`${t.store} · 4 wk after`} value={t.store_bags_4wk_after} />
              <text x={270} y={y + 12} fontSize="10" fontWeight="600" fill={t.lift_pct >= 0 ? CHARCOAL : RED} fontFamily={sans}>
                {t.lift_pct > 0 ? '+' : ''}{t.lift_pct}%
              </text>
            </g>
          )
        })}
        <g transform={`translate(140, ${vbH - 14})`} fontFamily={sans} fontSize="9.5" fill={CHARCOAL}>
          <rect width={10} height={10} fill={STONE} />
          <text x={14} y={9}>4 wk before</text>
          <rect x={90} width={10} height={10} fill={accent} />
          <text x={104} y={9}>4 wk after</text>
        </g>
      </svg>
    </ChartFrame>
  )
}

export function MarginByChannelChart({ products, channels, accent = BRICK }) {
  const { show, hide, node } = useChartTip()
  const maxM = Math.max(
    ...products.flatMap((p) => channels.map((ch) => p.channels[ch]?.margin_per_bag || 0)),
    1,
  )
  const groups = products.length
  const gw = 72
  const vbW = 40 + groups * gw
  const chW = 8
  const seriesColors = [accent, CHARCOAL, SAGE, BROWN, STONE]
  return (
    <ChartFrame tip={node} hide={hide}>
      <svg viewBox={`0 0 ${vbW} 248`} style={{ width: '100%', minWidth: '520px', display: 'block' }}>
        {products.map((p, gi) => {
          const gx = 36 + gi * gw
          return (
            <g key={p.product}>
              {channels.map((ch, ci) => {
                const m = p.channels[ch]?.margin_per_bag || 0
                const h = (m / maxM) * 130
                return (
                  <TipRect
                    key={ch}
                    show={show}
                    hide={hide}
                    x={gx + ci * (chW + 2)}
                    y={150 - h}
                    width={chW}
                    height={h}
                    fill={seriesColors[ci % seriesColors.length]}
                    label={`${p.product} · ${ch}`}
                    value={m}
                  />
                )
              })}
              <text x={gx + (channels.length * (chW + 2)) / 2} y={168} textAnchor="middle" fontSize="8" fill={MUTED} fontFamily={sans}>
                {p.product.split(' ')[0]}
              </text>
            </g>
          )
        })}
        <ChartLegend items={channels.map((ch, i) => ({ label: ch, color: seriesColors[i % seriesColors.length] }))} yBase={208} />
      </svg>
    </ChartFrame>
  )
}

export function InventoryDaysChart({ rows, accent = BRICK, refDays = 21 }) {
  const { show, hide, node } = useChartTip()
  const maxD = Math.max(...rows.map((r) => r.days_of_stock), refDays + 5)
  const rowH = 28
  const vbH = 40 + rows.length * rowH
  const refX = 180 + (refDays / maxD) * 200
  return (
    <ChartFrame tip={node} hide={hide}>
      <svg viewBox={`0 0 400 ${vbH}`} style={{ width: '100%', maxWidth: '100%', display: 'block' }}>
        <line x1={refX} y1={20} x2={refX} y2={vbH - 20} stroke={AMBER} strokeWidth="1" strokeDasharray="4 3" />
        <text x={refX + 4} y={16} fontSize="9" fill={AMBER} fontFamily={sans}>{refDays}d</text>
        {rows.map((r, i) => {
          const y = 28 + i * rowH
          const w = (r.days_of_stock / maxD) * 200
          const short = r.days_of_stock < 14
          return (
            <g key={r.product}>
              <text x={0} y={y + 14} fontSize="11" fill={INK} fontFamily={sans}>{r.product}</text>
              <TipRect
                show={show}
                hide={hide}
                x={180}
                y={y + 2}
                width={Math.max(w, 4)}
                height={14}
                fill={short ? accent : SAGE}
                rx={2}
                label={r.product}
                value={`${r.days_of_stock.toFixed(1)} days`}
              />
              <text x={180 + w + 6} y={y + 14} fontSize="10" fill={INK} fontFamily={MONO}>{r.days_of_stock.toFixed(1)}d</text>
            </g>
          )
        })}
      </svg>
    </ChartFrame>
  )
}

const AGING_BAR_FILTER = { '0-30': 'aging_0_30', '31-60': 'aging_31_60', '61-90': 'aging_61_90' }

export function ArAgingBars({ aging, accent = BRICK, onBarClick }) {
  const { show, hide, node } = useChartTip()
  const keys = ['0-30', '31-60', '61-90']
  const vals = keys.map((k) => aging[k] || 0)
  const max = Math.max(...vals, 1)
  const TOP = 26
  const BASE = 96
  const BAR_MAX = 62
  const vbH = 112
  const activate = (k) => {
    const id = AGING_BAR_FILTER[k]
    if (id && onBarClick) onBarClick(id)
  }
  const onBarKey = (k) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      activate(k)
    }
  }
  return (
    <ChartFrame tip={node} hide={hide}>
      <svg viewBox={`0 0 360 ${vbH}`} style={{ width: '100%', maxWidth: '420px', display: 'block' }}>
        {keys.map((k, i) => {
          const x = 20 + i * 110
          const h = (vals[i] / max) * BAR_MAX
          const barY = BASE - h
          const labelY = barY - 6
          const clickable = !!onBarClick
          return (
            <g key={k}>
              {clickable ? (
                <>
                  <rect x={x} y={barY} width={80} height={h} fill={i === 2 ? accent : CHARCOAL} opacity={i === 0 ? 0.75 : 1} pointerEvents="none" />
                  <rect
                    x={x}
                    y={TOP}
                    width={80}
                    height={BASE - TOP}
                    fill="transparent"
                    role="button"
                    tabIndex={0}
                    aria-label={`${k} days open, ${moneyK(vals[i])}`}
                    onClick={() => activate(k)}
                    onKeyDown={onBarKey(k)}
                    onMouseEnter={(e) => show(e, `${k} days`, vals[i])}
                    onMouseMove={(e) => show(e, `${k} days`, vals[i])}
                    onMouseLeave={hide}
                    onTouchStart={(e) => {
                      e.preventDefault()
                      show(e, `${k} days`, vals[i])
                    }}
                    onTouchEnd={hide}
                    style={{ cursor: 'pointer' }}
                  />
                </>
              ) : (
                <TipRect show={show} hide={hide} x={x} y={barY} width={80} height={h} fill={i === 2 ? accent : CHARCOAL} opacity={i === 0 ? 0.75 : 1} label={`${k} days`} value={vals[i]} />
              )}
              <text x={x + 40} y={BASE + 12} textAnchor="middle" fontSize="10" fill={MUTED} fontFamily={sans} pointerEvents="none">{k} days</text>
              <text x={x + 40} y={labelY} textAnchor="middle" fontSize="10" fontWeight="600" fill={INK} fontFamily={sans} pointerEvents="none">
                {moneyK(vals[i])}
              </text>
            </g>
          )
        })}
      </svg>
    </ChartFrame>
  )
}

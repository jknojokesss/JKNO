import { useState, useCallback, useEffect, useRef } from 'react'
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
  fmtInt,
  CHANNEL_COLORS,
  AMBER,
} from './primalKrispUtils'

const sans = UI
const TXT = 11
const TXT_SM = 10
const TXT_LG = 12

function useMeasuredWidth(minWidth = 260) {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width)
      if (w > 0) setWidth(Math.max(minWidth, w))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [minWidth])
  return { ref, width }
}

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

function ChartLegend({ items, yBase = 198, vbW = 520 }) {
  return (
    <g fontFamily={sans} fontSize="9.5" fill={CHARCOAL}>
      {items.map((it, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        const colW = Math.max(120, (vbW - 32) / 3)
        const x = 16 + col * colW
        const y = yBase + row * 15
        return (
          <g key={it.label} transform={`translate(${x}, ${y})`}>
            <rect width={10} height={10} fill={it.color} />
            <text x={14} y={9} fill={CHARCOAL}>{it.label}</text>
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
  const legendItems = channels.map((ch) => ({ label: ch, color: CHANNEL_COLORS[ch] || accent }))
  const legendY = 208
  const vbH = legendY + 28
  return (
    <ChartFrame tip={node} hide={hide} style={{ width: '100%', maxWidth: '100%' }}>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', maxWidth: '100%', height: 'auto', display: 'block' }}>
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
        <ChartLegend items={legendItems} yBase={legendY} vbW={vbW} />
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
  const legendY = 188
  const vbH = legendY + 24
  return (
    <ChartFrame tip={node} hide={hide} style={{ width: '100%', maxWidth: '100%' }}>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', maxWidth: '100%', height: 'auto', display: 'block' }}>
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
          vbW={vbW}
          yBase={legendY}
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
  const { ref, width: W } = useMeasuredWidth(280)
  const pts = monthly || []
  if (!pts.length) return null
  const maxA = Math.max(...pts.map((p) => p.active_end), 1)
  const labelPadL = 36
  const labelPadR = 36
  const padT = 14
  const labelH = 34
  const plotH = 86
  const n = pts.length
  const plotBottom = padT + plotH
  const H = plotBottom + labelH
  const innerW = W > 0 ? W - labelPadL - labelPadR : 0
  const step = n > 1 ? innerW / (n - 1) : 0
  const xAt = (i) => labelPadL + (n <= 1 ? innerW / 2 : i * step)
  const labelAnchor = (i) => (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle')
  const yAt = (v) => plotBottom - (v / maxA) * (plotH - 6)
  return (
    <ChartFrame tip={node} hide={hide} style={{ width: '100%', maxWidth: '100%' }}>
      <div ref={ref} style={{ width: '100%' }}>
        {W > 0 ? (
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ display: 'block', maxWidth: '100%' }}
            role="img"
            aria-label="Active subscribers over 12 months"
          >
            <line x1={labelPadL} y1={plotBottom} x2={W - labelPadR} y2={plotBottom} stroke={STONE} strokeWidth="1" />
            <polyline
              fill="none"
              stroke={accent}
              strokeWidth="2"
              points={pts.map((p, i) => `${xAt(i)},${yAt(p.active_end)}`).join(' ')}
            />
            {pts.map((p, i) => (
              <g key={p.label}>
                <circle
                  cx={xAt(i)}
                  cy={yAt(p.active_end)}
                  r="4"
                  fill={accent}
                  onMouseEnter={(e) => show(e, `${p.label} active`, fmtInt(p.active_end))}
                  onMouseMove={(e) => show(e, `${p.label} active`, fmtInt(p.active_end))}
                  onTouchStart={(e) => show(e, `${p.label} active`, fmtInt(p.active_end))}
                  style={{ cursor: 'pointer' }}
                />
                <text x={xAt(i)} y={plotBottom + 14} textAnchor={labelAnchor(i)} fontSize={TXT_SM} fill={MUTED} fontFamily={sans}>
                  {p.label}
                </text>
                <text x={xAt(i)} y={plotBottom + 28} textAnchor={labelAnchor(i)} fontSize={TXT_LG} fontWeight="600" fill={INK} fontFamily={sans}>
                  {fmtInt(p.active_end)}
                </text>
              </g>
            ))}
          </svg>
        ) : null}
      </div>
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
      <svg viewBox={`0 0 ${vbW} 150`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', maxWidth: '100%', height: 'auto', display: 'block' }}>
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
  const rowH = 44
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
              <foreignObject x={0} y={y - 2} width={132} height={34}>
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  style={{
                    fontSize: 10,
                    lineHeight: 1.25,
                    color: INK,
                    fontFamily: sans,
                    wordBreak: 'break-word',
                  }}
                >
                  {t.store}
                </div>
              </foreignObject>
              <TipRect show={show} hide={hide} x={140} y={y} width={bw(t.store_bags_4wk_before)} height={12} fill={STONE} label={`${t.store} · 4 wk before`} value={`${fmtInt(t.store_bags_4wk_before)} bags`} />
              <TipRect show={show} hide={hide} x={140} y={y + 14} width={bw(t.store_bags_4wk_after)} height={12} fill={accent} label={`${t.store} · 4 wk after`} value={`${fmtInt(t.store_bags_4wk_after)} bags`} />
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
  const { ref, width: W } = useMeasuredWidth(320)
  const maxM = Math.max(
    ...products.flatMap((p) => channels.map((ch) => p.channels[ch]?.margin_per_bag || 0)),
    1,
  )
  const groups = products.length
  const H = 224
  const plotTop = 20
  const plotBottom = 162
  const plotH = plotBottom - plotTop
  const chW = 7
  const gap = 2
  const clusterW = channels.length * chW + (channels.length - 1) * gap
  const seriesColors = [accent, CHARCOAL, SAGE, BROWN, STONE]
  const slotW = W > 0 ? (W - 24) / Math.max(groups, 1) : 0
  return (
    <ChartFrame tip={node} hide={hide}>
      <div ref={ref} style={{ width: '100%' }}>
        {W > 0 ? (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', maxWidth: '100%' }}>
            {products.map((p, gi) => {
              const gx = 12 + gi * slotW + (slotW - clusterW) / 2
              return (
                <g key={p.product}>
                  {channels.map((ch, ci) => {
                    const m = p.channels[ch]?.margin_per_bag || 0
                    const h = (m / maxM) * plotH
                    return (
                      <TipRect
                        key={ch}
                        show={show}
                        hide={hide}
                        x={gx + ci * (chW + gap)}
                        y={plotBottom - h}
                        width={chW}
                        height={h}
                        fill={seriesColors[ci % seriesColors.length]}
                        label={`${p.product} · ${ch}`}
                        value={m}
                      />
                    )
                  })}
                  <text
                    x={12 + gi * slotW + slotW / 2}
                    y={plotBottom + 16}
                    textAnchor="middle"
                    fontSize={TXT_SM}
                    fill={MUTED}
                    fontFamily={sans}
                  >
                    {p.product.split(' ')[0]}
                  </text>
                </g>
              )
            })}
            <g fontFamily={sans} fontSize={TXT_SM} fill={CHARCOAL}>
              {channels.map((ch, i) => {
                const col = i % 3
                const row = Math.floor(i / 3)
                const colW = (W - 24) / 3
                const x = 12 + col * colW
                const y = 186 + row * 16
                return (
                  <g key={ch} transform={`translate(${x}, ${y})`}>
                    <rect width={9} height={9} fill={seriesColors[i % seriesColors.length]} />
                    <text x={13} y={9} fill={CHARCOAL}>{ch}</text>
                  </g>
                )
              })}
            </g>
          </svg>
        ) : null}
      </div>
    </ChartFrame>
  )
}

export function InventoryDaysChart({ rows, accent = BRICK, refDays = 21 }) {
  const { show, hide, node } = useChartTip()
  const { ref, width: W } = useMeasuredWidth(280)
  const maxD = Math.max(...rows.map((r) => r.days_of_stock), refDays + 5)
  const rowH = 22
  const valueCol = 44
  const topPad = 14
  const labelCol = W > 0 ? Math.min(108, Math.floor(W * 0.28)) : 108
  const barX = labelCol + 6
  const barMaxW = W > 0 ? Math.max(36, W - barX - valueCol - 4) : 36
  const H = topPad + rows.length * rowH + 6
  const refX = barX + (refDays / maxD) * barMaxW
  const valueX = W - valueCol
  return (
    <ChartFrame tip={node} hide={hide}>
      <div ref={ref} style={{ width: '100%' }}>
        {W > 0 ? (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', maxWidth: '100%' }}>
            <line x1={refX} y1={topPad - 2} x2={refX} y2={H - 4} stroke={AMBER} strokeWidth="1" strokeDasharray="4 3" />
            <text x={refX + 4} y={topPad - 4} fontSize={TXT_SM} fill={AMBER} fontFamily={sans}>{refDays}d</text>
            {rows.map((r, i) => {
              const y = topPad + i * rowH
              const w = (r.days_of_stock / maxD) * barMaxW
              const short = r.days_of_stock < 14
              const label = `${r.days_of_stock.toFixed(1)} d`
              return (
                <g key={r.product}>
                  <text x={0} y={y + 14} fontSize={TXT} fill={INK} fontFamily={sans}>{r.product}</text>
                  <TipRect
                    show={show}
                    hide={hide}
                    x={barX}
                    y={y + 3}
                    width={Math.max(w, 3)}
                    height={11}
                    fill={short ? accent : SAGE}
                    rx={2}
                    label={r.product}
                    value={`${r.days_of_stock.toFixed(1)} days`}
                  />
                  <text x={valueX} y={y + 14} fontSize={TXT} fill={INK} fontFamily={sans} textAnchor="start">{label}</text>
                </g>
              )
            })}
          </svg>
        ) : null}
      </div>
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

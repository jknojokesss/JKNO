import {
  BRICK,
  CHARCOAL,
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

export function StackedSalesByChannel({ months, channels, accent = BRICK }) {
  const totals = months.map((m) => channels.reduce((s, ch) => s + (m[ch] || 0), 0))
  const max = Math.max(...totals, 1)
  const w = 58
  const vbW = 16 + months.length * w
  return (
    <svg viewBox={`0 0 ${vbW} 190`} style={{ width: '100%', minWidth: '520px', display: 'block' }}>
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
              return <rect key={ch} x={x} y={y} width={22} height={h} fill={CHANNEL_COLORS[ch] || accent} />
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
      <g fontFamily={sans} fontSize="9.5" fill={CHARCOAL}>
        {channels.slice(0, 3).map((ch, i) => (
          <g key={ch} transform={`translate(${16 + i * 130}, 184)`}>
            <rect width={10} height={10} fill={CHANNEL_COLORS[ch]} />
            <text x={14} y={9}>{ch}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

export function CashForecast13({ forecast, accent = BRICK }) {
  const weeks = forecast.weeks || []
  const wMax = Math.max(...weeks.map((w) => Math.max(w.cash_in, w.cash_out)), 1)
  const cumMin = Math.min(...weeks.map((w) => w.ending_cash), forecast.starting_cash)
  const cumMax = Math.max(...weeks.map((w) => w.ending_cash), forecast.starting_cash)
  const lowest = forecast.lowest_week?.week_of
  const vbW = 20 + weeks.length * 58
  return (
    <svg viewBox={`0 0 ${vbW} 200`} style={{ width: '100%', minWidth: '640px', display: 'block' }}>
      {weeks.map((w, i) => {
        const x = 20 + i * 58
        const inH = (w.cash_in / wMax) * 92
        const outH = (w.cash_out / wMax) * 92
        const isLow = w.week_of === lowest
        return (
          <g key={w.week_of}>
            {isLow && <rect x={x - 4} y={12} width={51} height={142} fill="#FBEDE9" rx={2} />}
            <rect x={x} y={118 - inH} width={20} height={inH} fill={isLow ? accent : CHARCOAL} />
            <rect x={x + 23} y={118 - outH} width={20} height={outH} fill={STONE} />
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
              `${41 + i * 58},${182 - ((w.ending_cash - cumMin) / Math.max(1, cumMax - cumMin)) * 26}`,
          )
          .join(' ')}
      />
      {weeks.map((w, i) => (
        <circle
          key={w.week_of}
          cx={41 + i * 58}
          cy={182 - ((w.ending_cash - cumMin) / Math.max(1, cumMax - cumMin)) * 26}
          r={w.week_of === lowest ? 3.5 : 2}
          fill={w.week_of === lowest ? accent : CHARCOAL}
        />
      ))}
      <text x={20} y={170} fontSize="9.5" fill={MUTED} fontFamily={sans}>ending cash →</text>
    </svg>
  )
}

export function SubscriberLineChart({ monthly, accent = BRICK }) {
  const pts = monthly || []
  const maxA = Math.max(...pts.map((p) => p.active_end), 1)
  const w = 58
  const vbW = 30 + pts.length * w
  const lineY = (v) => 120 - (v / maxA) * 95
  return (
    <svg viewBox={`0 0 ${vbW} 175`} style={{ width: '100%', minWidth: '520px', display: 'block' }}>
      <polyline
        fill="none"
        stroke={accent}
        strokeWidth="2"
        points={pts.map((p, i) => `${44 + i * w},${lineY(p.active_end)}`).join(' ')}
      />
      {pts.map((p, i) => (
        <g key={p.label}>
          <circle cx={44 + i * w} cy={lineY(p.active_end)} r="2.5" fill={accent} />
          <text x={44 + i * w} y={138} textAnchor="middle" fontSize="9" fill={MUTED} fontFamily={sans}>
            {p.label}
          </text>
          <text x={44 + i * w} y={150} textAnchor="middle" fontSize="9.5" fontWeight="600" fill={INK} fontFamily={sans}>
            {p.active_end}
          </text>
        </g>
      ))}
      {pts.map((p, i) => {
        const x = 44 + i * w
        const newH = (p.new / Math.max(...pts.map((x) => x.new), 1)) * 18
        const canH = (p.cancelled / Math.max(...pts.map((x) => x.cancelled), 1)) * 18
        return (
          <g key={`bars-${p.label}`}>
            <rect x={x - 10} y={158 - newH} width={8} height={newH} fill={SAGE} />
            <rect x={x + 2} y={158 - canH} width={8} height={canH} fill={STONE} />
          </g>
        )
      })}
      <text x={30} y={168} fontSize="9" fill={MUTED} fontFamily={sans}>new / cancelled under line</text>
    </svg>
  )
}

export function RenewalBars14({ days, accent = BRICK }) {
  const maxR = Math.max(...days.map((d) => d.renewals), 1)
  const w = 42
  const vbW = 20 + days.length * w
  return (
    <svg viewBox={`0 0 ${vbW} 150`} style={{ width: '100%', minWidth: '480px', display: 'block' }}>
      {days.map((d, i) => {
        const x = 20 + i * w
        const h = (d.renewals / maxR) * 100
        return (
          <g key={d.date}>
            <rect x={x} y={118 - h} width={28} height={h} fill={accent} opacity={0.9} />
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
  )
}

function fmtShort(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
}

export function TastingLiftChart({ tastings, accent = BRICK }) {
  const rows = (tastings || []).filter((t) => t.store_bags_4wk_before != null)
  const maxB = Math.max(...rows.flatMap((t) => [t.store_bags_4wk_before, t.store_bags_4wk_after]), 1)
  const rowH = 36
  const vbH = 30 + rows.length * rowH
  const vbW = 420
  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: '100%', minWidth: '360px', display: 'block' }}>
      {rows.map((t, i) => {
        const y = 24 + i * rowH
        const bw = (v) => (v / maxB) * 120
        return (
          <g key={t.date + t.store}>
            <text x={0} y={y + 12} fontSize="10" fill={INK} fontFamily={sans}>
              {t.store.length > 22 ? t.store.slice(0, 20) + '…' : t.store}
            </text>
            <rect x={140} y={y} width={bw(t.store_bags_4wk_before)} height={12} fill={STONE} />
            <rect x={140} y={y + 14} width={bw(t.store_bags_4wk_after)} height={12} fill={accent} />
            <text x={270} y={y + 12} fontSize="10" fontWeight="600" fill={t.lift_pct >= 0 ? CHARCOAL : RED} fontFamily={sans}>
              {t.lift_pct > 0 ? '+' : ''}{t.lift_pct}%
            </text>
          </g>
        )
      })}
      <text x={140} y={vbH - 4} fontSize="9" fill={MUTED} fontFamily={sans}>stone = 4 wk before · brick = after</text>
    </svg>
  )
}

export function MarginByChannelChart({ products, channels, accent = BRICK }) {
  const names = products.map((p) => p.product)
  const maxM = Math.max(
    ...products.flatMap((p) => channels.map((ch) => p.channels[ch]?.margin_per_bag || 0)),
    1,
  )
  const groups = products.length
  const gw = 72
  const vbW = 40 + groups * gw
  const chW = 8
  return (
    <svg viewBox={`0 0 ${vbW} 200`} style={{ width: '100%', minWidth: '520px', display: 'block' }}>
      {products.map((p, gi) => {
        const gx = 36 + gi * gw
        return (
          <g key={p.product}>
            {channels.map((ch, ci) => {
              const m = p.channels[ch]?.margin_per_bag || 0
              const h = (m / maxM) * 130
              const colors = [accent, CHARCOAL, SAGE, BROWN, STONE]
              return (
                <rect
                  key={ch}
                  x={gx + ci * (chW + 2)}
                  y={150 - h}
                  width={chW}
                  height={h}
                  fill={colors[ci % colors.length]}
                />
              )
            })}
            <text x={gx + (channels.length * (chW + 2)) / 2} y={168} textAnchor="middle" fontSize="8" fill={MUTED} fontFamily={sans}>
              {p.product.split(' ')[0]}
            </text>
          </g>
        )
      })}
      <text x={4} y={12} fontSize="9" fill={MUTED} fontFamily={sans}>margin $/bag by channel</text>
    </svg>
  )
}

export function InventoryDaysChart({ rows, accent = BRICK, refDays = 21 }) {
  const maxD = Math.max(...rows.map((r) => r.days_of_stock), refDays + 5)
  const rowH = 28
  const vbH = 40 + rows.length * rowH
  const refX = 180 + (refDays / maxD) * 200
  return (
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
            <rect x={180} y={y + 2} width={w} height={14} fill={short ? accent : SAGE} rx={2} />
            <text x={180 + w + 6} y={y + 14} fontSize="10" fill={INK} fontFamily={MONO}>{r.days_of_stock.toFixed(1)}d</text>
          </g>
        )
      })}
    </svg>
  )
}

export function ArAgingBars({ aging, accent = BRICK }) {
  const keys = ['0-30', '31-60', '61-90']
  const vals = keys.map((k) => aging[k] || 0)
  const max = Math.max(...vals, 1)
  return (
    <svg viewBox="0 0 360 100" style={{ width: '100%', maxWidth: '420px', display: 'block' }}>
      {keys.map((k, i) => {
        const x = 20 + i * 110
        const h = (vals[i] / max) * 70
        return (
          <g key={k}>
            <rect x={x} y={78 - h} width={80} height={h} fill={i === 2 ? accent : CHARCOAL} opacity={i === 0 ? 0.75 : 1} />
            <text x={x + 40} y={90} textAnchor="middle" fontSize="10" fill={MUTED} fontFamily={sans}>{k} days</text>
            <text x={x + 40} y={78 - h - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill={INK} fontFamily={sans}>
              {moneyK(vals[i])}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

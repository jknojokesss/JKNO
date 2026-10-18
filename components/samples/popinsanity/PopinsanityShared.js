import {
  SPICE,
  CHAR,
  CREAM,
  CARDBG,
  INK,
  MUTED,
  BORDER,
  UI,
  MONO,
  money,
  money0,
  pct1,
  changeColor,
  changePct,
} from './popinsanityUtils'
import { allocateWholeDollars } from '../sampleWholeDollarDisplay.js'

export function useStyles() {
  const card = { background: CARDBG, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '20px' }
  const lbl = {
    fontFamily: UI,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    color: MUTED,
  }
  const big = { fontFamily: UI, fontWeight: 700, letterSpacing: '-0.4px' }
  const btn = { fontFamily: UI, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }
  return { card, lbl, big, btn }
}

export function KPI({ k, v, sub, subColor, accent, onClick, card, lbl, big }) {
  const inner = (
    <>
      <div style={lbl}>{k}</div>
      <div className="pop-kpi-val" style={{ ...big, fontSize: '29px', color: accent || INK, lineHeight: 1.15, marginTop: '4px' }}>{v}</div>
      {sub ? (
        <div
          style={{
            fontFamily: UI,
            fontSize: '12px',
            color: subColor || '#A2937A',
            marginTop: '3px',
            fontWeight: subColor ? 600 : 400,
          }}
        >
          {sub}
        </div>
      ) : null}
    </>
  )
  const base = { ...card, flex: 1, minWidth: '150px', padding: '15px 17px' }
  if (!onClick) return <div style={base}>{inner}</div>
  return (
    <button type="button" className="pop-click" onClick={onClick} style={{ ...base, textAlign: 'left', cursor: 'pointer', border: `1px solid ${BORDER}`, position: 'relative' }}>
      {inner}
    </button>
  )
}

export function BackButton({ onBack }) {
  return (
    <button type="button" className="pop-back" onClick={onBack}>
      Back
    </button>
  )
}

export function RankedBars({ title, rows, onRow, card, lbl, big, formatValue, preserveOrder = false, wholeDollarTotal = null }) {
  const sorted = preserveOrder ? rows : [...rows].sort((a, b) => b.value - a.value)
  const max = sorted[0]?.value || 1
  const wholeParts =
    wholeDollarTotal != null && !formatValue ? allocateWholeDollars(sorted.map((r) => r.value), wholeDollarTotal) : null
  const fmt = formatValue || ((v, i) => (wholeParts ? money0(wholeParts[i]) : money(v)))
  return (
    <div style={{ ...card, flex: 1, minWidth: 'min(100%,290px)' }}>
      <div style={{ ...lbl, marginBottom: '14px' }}>{title}</div>
      {sorted.map((r, i) => (
        <div
          key={r.key || r.label}
          role="button"
          tabIndex={0}
          className="pop-click"
          onClick={() => onRow?.(r)}
          onKeyDown={(e) => e.key === 'Enter' && onRow?.(r)}
          style={{ padding: '9px 0', borderTop: i ? `1px solid ${CREAM}` : 'none', borderRadius: 2 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: INK }}>{r.label}</span>
            <span style={{ ...big, fontSize: '15px', color: INK, fontFamily: MONO }}>{fmt(r.value, i)}{r.suffix || ''}</span>
          </div>
          <div style={{ height: '6px', background: CREAM, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.round((r.value / max) * 100)}%`, height: '100%', background: SPICE }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChangeCell({ thisVal, priorVal, cost = false }) {
  const delta = priorVal != null ? thisVal - priorVal : null
  const color = changeColor(delta, { cost })
  const pct = priorVal ? changePct(thisVal, priorVal) : null
  if (delta == null) return <span style={{ color: MUTED }}>—</span>
  return (
    <span style={{ fontFamily: MONO, fontSize: '12px', color }}>
      {money(delta)}
      {pct != null ? <span style={{ display: 'block', fontSize: '11px' }}>{pct >= 0 ? '+' : ''}{pct1(pct)}</span> : null}
    </span>
  )
}

export function ClickRow({ children, onClick, style }) {
  return (
    <tr
      className="pop-click"
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer', ...style }}
    >
      {children}
    </tr>
  )
}

export function DetailShell({ title, onBack, children, card, big }) {
  const close = onBack
  return (
    <div>
      <div className="pop-detail-nav">
        <BackButton onBack={onBack} />
        <button type="button" className="pop-back" onClick={close}>
          Close
        </button>
      </div>
      <div style={{ ...card }}>
        {title ? <div className="pop-client-name" style={{ ...big, fontSize: '20px', color: INK, marginBottom: '14px' }}>{title}</div> : null}
        {children}
      </div>
    </div>
  )
}

export function RowLine({ l, v, bold, mono = true }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderTop: bold ? `1px solid ${BORDER}` : 'none' }}>
      <span style={{ fontSize: '13px', color: bold ? INK : MUTED, fontWeight: bold ? 600 : 400 }}>{l}</span>
      <span style={{ fontFamily: mono ? MONO : UI, fontSize: '13px', fontWeight: bold ? 600 : 400, color: INK }}>{v}</span>
    </div>
  )
}

import { BORDER, CARDBG, INK, MUTED, SPICE, MONO, money, pct1 } from './mrDipzUtils'

export default function MrDipzDetail({ detail, onClose }) {
  if (!detail) return null

  const panel = {
    background: CARDBG,
    border: `1px solid ${BORDER}`,
    borderRadius: '2px',
    padding: '18px 20px',
    marginBottom: '16px',
  }
  const titleStyle = { fontWeight: 700, fontSize: '18px', color: INK, marginBottom: '4px' }
  const subStyle = { fontSize: '12px', color: MUTED, marginBottom: '14px' }

  const Close = () => (
    <button type="button" onClick={onClose} aria-label="Close detail" style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: MUTED }}>
      ×
    </button>
  )

  if (detail.type === 'area') {
    const a = detail.area
    return (
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={titleStyle}>{a.label}</div>
            <div style={subStyle}>{a.storeCount} stores · September</div>
          </div>
          <Close />
        </div>
        <Metric label="Sep gross sales" value={money(a.sepSales)} />
        <Metric label="Sep credits" value={money(a.sepCredits)} />
        <Metric label="Open balance" value={money(a.balanceOwed)} accent />
      </div>
    )
  }

  if (detail.type === 'store') {
    const st = detail.store
    return (
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={titleStyle}>{st.label}</div>
            <div style={subStyle}>{st.area?.label} · {st.terms}</div>
          </div>
          <Close />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
          <Metric label="Sep sales" value={money(st.sepSales)} />
          <Metric label="Sep credits" value={money(st.sepCredits)} sub={pct1(st.creditPctSep)} />
          <Metric label="Sep net" value={money(st.sepNet)} />
          <Metric label="Owed" value={money(st.balanceOwed)} accent />
        </div>
      </div>
    )
  }

  if (detail.type === 'product') {
    const p = detail.product
    return (
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={titleStyle}>{p.label}</div>
            <div style={subStyle}>Case {money(p.casePrice)}</div>
          </div>
          <Close />
        </div>
        <Metric label="Sep sales" value={money(p.sepSales)} />
        <Metric label="Sep credits" value={money(p.sepCredits)} />
        <Metric label="Sep net" value={money(p.sepNet)} />
      </div>
    )
  }

  if (detail.type === 'week') {
    const w = detail.week
    return (
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={titleStyle}>{w.label}</div>
            <div style={subStyle}>September week</div>
          </div>
          <Close />
        </div>
        <Metric label="Gross sales" value={money(w.sepSales)} />
        <Metric label="Credits" value={money(w.sepCredits)} />
        <Metric label="Net" value={money(w.sepNet)} />
      </div>
    )
  }

  if (detail.type === 'credit') {
    const c = detail.credit
    return (
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={titleStyle}>Credit</div>
            <div style={subStyle}>{c.store?.label} · {c.week?.label}</div>
          </div>
          <Close />
        </div>
        <Metric label="Amount" value={money(c.amount)} accent />
        <p style={{ marginTop: 12, fontSize: 14, color: INK }}>{c.reason}</p>
        <p style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{c.product?.label}</p>
      </div>
    )
  }

  if (detail.type === 'invoice') {
    const inv = detail.invoice
    return (
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={titleStyle}>{inv.id}</div>
            <div style={subStyle}>{inv.store?.label} · due {inv.due}</div>
          </div>
          <Close />
        </div>
        <Metric label="Open amount" value={money(inv.amount)} accent />
        <Metric label="Aging" value={inv.aging} />
        <Metric label="Days out" value={String(inv.daysOutstanding)} />
      </div>
    )
  }

  if (detail.type === 'pnl') {
    const { line, month, amount, prior } = detail
    return (
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={titleStyle}>{line.label}</div>
            <div style={subStyle}>{month === '2026-09' ? 'September 2026' : 'August 2026'}</div>
          </div>
          <Close />
        </div>
        <Metric label="This month" value={money(amount)} />
        {prior != null ? <Metric label="Prior month" value={money(prior)} /> : null}
      </div>
    )
  }

  return null
}

function Metric({ label, value, sub, accent }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: SPICE }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 17, fontWeight: 600, color: accent ? '#C98A2A' : INK, marginTop: 4 }}>{value}</div>
      {sub ? <div style={{ fontSize: 11, color: MUTED }}>{sub}</div> : null}
    </div>
  )
}

import { useState } from 'react'
import DATA from '../../data/primal-krisp.json'
import {
  SPICE,
  CHAR,
  CREAM,
  CARDBG,
  INK,
  MUTED,
  BORDER,
  GREEN,
  RED,
  UI,
  MONO,
  money,
  money0,
  TieMark,
} from './primalKrispUtils'

const PNL_SHEET_CSS = `
.pk-pnl-wrap{
  --pk-pnl-c1:5.5rem;--pk-pnl-c2:5.5rem;--pk-pnl-c3:5.5rem;--pk-pnl-gap:6px;
  --pk-pnl-fs:12px;--pk-pnl-fs-cur:13px;--pk-pnl-fs-head:10px;
}
@media(max-width:480px){
  .pk-pnl-wrap{
    --pk-pnl-c1:4.5rem;--pk-pnl-c2:4.5rem;--pk-pnl-c3:4rem;--pk-pnl-gap:8px;
    --pk-pnl-fs:10px;--pk-pnl-fs-cur:10px;--pk-pnl-fs-head:9px;
  }
  .pk-pnl-label{font-size:12px}
}
.pk-pnl-head,.pk-pnl-line{
  display:grid;grid-template-columns:minmax(0,1fr) var(--pk-pnl-c1) var(--pk-pnl-c2) var(--pk-pnl-c3);
  column-gap:var(--pk-pnl-gap);align-items:center;padding-right:6px;box-sizing:border-box;
}
.pk-pnl-line--solo{grid-template-columns:minmax(0,1fr) var(--pk-pnl-c1)}
.pk-pnl-head{padding:0 6px 8px;font-size:var(--pk-pnl-fs-head);color:${MUTED};text-transform:uppercase;letter-spacing:.6px}
.pk-pnl-line{padding:8px 6px;border-radius:2px}
.pk-pnl-line--indent{padding:4px 6px 4px 0}
.pk-pnl-line--indent .pk-pnl-label{padding-left:20px}
.pk-pnl-line--sub{border-top:1px solid ${BORDER}}
.pk-pnl-label{min-width:0;font-size:13px;line-height:1.35}
.pk-pnl-num{
  font-family:${MONO};font-size:var(--pk-pnl-fs);text-align:right;justify-self:stretch;
  width:100%;max-width:100%;box-sizing:border-box;white-space:nowrap;overflow:hidden;
  font-variant-numeric:tabular-nums;
}
.pk-pnl-num--cur{font-size:var(--pk-pnl-fs-cur)}
.pk-pnl-head .pk-pnl-num{font-size:var(--pk-pnl-fs-head);font-family:${UI};font-weight:600;overflow:visible}
`

export default function PrimalKrispFinancials({ card, lbl, big, btn, inp, KPI }) {
  const months = DATA.pnl_by_month || []
  const [pnlMonthIdx, setPnlMonthIdx] = useState(months.length - 1)
  const [pnlExpand, setPnlExpand] = useState({ revenue: true, cogs: true, opex: true })
  const [pnlDrill, setPnlDrill] = useState(null)

  const cur = months[pnlMonthIdx]
  const prev = pnlMonthIdx > 0 ? months[pnlMonthIdx - 1] : null
  const pnlMonthShort = (period) => (period ? String(period).split(' ')[0] : '')

  const openDrill = (title, ledgerKey, total) => {
    const rows = cur?.drill_ledgers?.[ledgerKey] || []
    setPnlDrill({ title, rows, total, period: cur?.period })
  }

  const PnlLine = ({ label, amount, priorAmount, ledgerKey, indent, bold, subtotal, cost }) => {
    const drillable = ledgerKey && cur?.drill_ledgers?.[ledgerKey]?.length
    const prior = priorAmount
    const delta = prior != null ? amount - prior : null
    const show = cost ? -amount : amount
    const showPrior = prior != null ? (cost ? -prior : prior) : null
    const changeColor =
      delta == null
        ? MUTED
        : delta > 0
          ? cost
            ? RED
            : GREEN
          : delta < 0
            ? cost
              ? GREEN
              : RED
            : MUTED
    const lineClass = [
      'pk-pnl-line',
      indent ? 'pk-pnl-line--indent' : '',
      subtotal || bold ? 'pk-pnl-line--sub' : '',
      !prev ? 'pk-pnl-line--solo' : '',
      drillable ? 'pk-click' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <div
        role={drillable ? 'button' : undefined}
        tabIndex={drillable ? 0 : undefined}
        className={lineClass}
        onClick={drillable ? () => openDrill(label, ledgerKey, amount) : undefined}
        onKeyDown={drillable ? (e) => e.key === 'Enter' && openDrill(label, ledgerKey, amount) : undefined}
        style={{ cursor: drillable ? 'pointer' : 'default' }}
      >
        <span className="pk-pnl-label" style={{ fontWeight: bold ? 700 : 400, color: indent ? MUTED : INK }}>
          {label}
        </span>
        <span className="pk-pnl-num pk-pnl-num--cur" style={{ fontWeight: bold ? 700 : 400, color: cost ? RED : INK }}>
          {money(show)}
        </span>
        {prev ? (
          <span className="pk-pnl-num" style={{ color: MUTED }}>{money(showPrior)}</span>
        ) : null}
        {prev ? (
          <span className="pk-pnl-num pk-pnl-num--delta" style={{ color: changeColor }}>
            {delta != null ? money(delta) : '—'}
          </span>
        ) : null}
      </div>
    )
  }

  const CatHeader = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setPnlExpand((e) => ({ ...e, [id]: !e[id] }))}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        border: 'none',
        background: 'transparent',
        padding: '10px 6px',
        cursor: 'pointer',
        fontFamily: UI,
        fontSize: 13,
        fontWeight: 700,
        color: INK,
        textAlign: 'left',
      }}
    >
      <span style={{ color: pnlExpand[id] ? SPICE : MUTED, fontWeight: pnlExpand[id] ? 700 : 600, textDecoration: pnlExpand[id] ? 'underline' : 'none', textUnderlineOffset: 3 }}>
        {label}
      </span>
    </button>
  )

  if (!cur) return null

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={lbl}>Month</span>
        <select
          value={pnlMonthIdx}
          onChange={(e) => setPnlMonthIdx(Number(e.target.value))}
          style={{ ...inp, cursor: 'pointer', minHeight: 40, borderRadius: 2 }}
        >
          {months.map((m, i) => (
            <option key={m.month} value={i}>
              {m.label} — {m.period}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <KPI k="Revenue" v={money(cur.revenue_total)} accent={GREEN} />
        <KPI k="Gross profit" v={money(cur.gross_profit)} />
        <KPI k="Net profit" v={money(cur.net_profit)} accent={SPICE} />
      </div>

      <div className="pk-pnl-wrap" style={{ ...card }}>
        <style dangerouslySetInnerHTML={{ __html: PNL_SHEET_CSS }} />
        <div style={{ ...lbl, marginBottom: 8 }}>Profit &amp; loss · {cur.period}</div>
        {prev && (
          <div className="pk-pnl-head">
            <span />
            <span className="pk-pnl-num">{pnlMonthShort(cur.period)}</span>
            <span className="pk-pnl-num">{pnlMonthShort(prev.period)}</span>
            <span className="pk-pnl-num">Change</span>
          </div>
        )}

        <CatHeader id="revenue" label="Revenue by channel" />
        {pnlExpand.revenue &&
          Object.entries(cur.revenue).map(([ch, v]) => (
            <PnlLine key={ch} label={ch} amount={v} priorAmount={prev?.revenue?.[ch]} ledgerKey={`rev_${ch}`} indent />
          ))}
        <PnlLine label="Total revenue" amount={cur.revenue_total} priorAmount={prev?.revenue_total} ledgerKey="revenue_total" bold subtotal />

        <CatHeader id="cogs" label="Cost of goods sold" />
        {pnlExpand.cogs &&
          cur.cogs_entries.map((e) => {
            const pe = prev?.cogs_entries?.find((x) => x.l === e.l)
            return <PnlLine key={e.l} label={e.l} amount={e.n} priorAmount={pe?.n} ledgerKey={`cogs_${e.l}`} indent cost />
          })}
        <PnlLine label="Total COGS" amount={cur.cogs} priorAmount={prev?.cogs} ledgerKey="cogs_total" bold subtotal cost />

        <PnlLine label="Gross profit" amount={cur.gross_profit} priorAmount={prev?.gross_profit} ledgerKey="gross_profit" bold subtotal />

        <CatHeader id="opex" label="Operating expenses" />
        {pnlExpand.opex &&
          cur.operating_expenses_entries.map((e) => {
            const pe = prev?.operating_expenses_entries?.find((x) => x.l === e.l)
            return <PnlLine key={e.l} label={e.l} amount={e.n} priorAmount={pe?.n} ledgerKey={`opex_${e.l}`} indent cost />
          })}
        <PnlLine label="Total operating expenses" amount={cur.operating_expenses_total} priorAmount={prev?.operating_expenses_total} ledgerKey="operating_expenses_total" bold subtotal cost />

        <PnlLine label="Net profit" amount={cur.net_profit} priorAmount={prev?.net_profit} ledgerKey="net_profit" bold subtotal />
      </div>

      {pnlDrill && (
        <div
          role="presentation"
          onClick={() => setPnlDrill(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(43,32,24,.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 9000, overflowY: 'auto' }}
        >
          <div
            role="dialog"
            aria-modal
            onClick={(e) => e.stopPropagation()}
            style={{ background: CARDBG, borderRadius: 2, maxWidth: 640, width: '100%', padding: 20, boxShadow: '0 12px 44px rgba(0,0,0,.28)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <div style={{ ...big, fontSize: 17 }}>{pnlDrill.title}</div>
              <button
                type="button"
                onClick={() => setPnlDrill(null)}
                style={{
                  background: 'none',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 2,
                  fontSize: 13,
                  fontWeight: 600,
                  color: MUTED,
                  cursor: 'pointer',
                  minHeight: 40,
                  padding: '8px 12px',
                }}
              >
                Close
              </button>
            </div>
            <div style={{ fontSize: 12, color: MUTED, margin: '6px 0 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>{pnlDrill.period}</span>
              <span style={{ fontFamily: MONO, color: INK }}>{money0(pnlDrill.total)}</span>
              <TieMark expected={pnlDrill.total} actual={pnlDrill.rows.reduce((s, r) => s + r.amount, 0)} />
            </div>
            <div style={{ maxHeight: '62vh', overflowY: 'auto' }}>
              {pnlDrill.rows.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${BORDER}` : 'none' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: INK }}>{r.description}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 1, fontFamily: MONO }}>{r.date}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 13, whiteSpace: 'nowrap' }}>{money(r.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

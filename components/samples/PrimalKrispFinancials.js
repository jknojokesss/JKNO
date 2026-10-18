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

export default function PrimalKrispFinancials({ card, lbl, big, btn, inp, KPI }) {
  const months = DATA.pnl_by_month || []
  const [pnlMonthIdx, setPnlMonthIdx] = useState(months.length - 1)
  const [pnlExpand, setPnlExpand] = useState({ revenue: true, cogs: true, opex: true })
  const [pnlDrill, setPnlDrill] = useState(null)

  const cur = months[pnlMonthIdx]
  const prev = pnlMonthIdx > 0 ? months[pnlMonthIdx - 1] : null

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
    return (
      <div
        role={drillable ? 'button' : undefined}
        tabIndex={drillable ? 0 : undefined}
        className={drillable ? 'pk-click' : undefined}
        onClick={drillable ? () => openDrill(label, ledgerKey, amount) : undefined}
        onKeyDown={drillable ? (e) => e.key === 'Enter' && openDrill(label, ledgerKey, amount) : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: indent ? '4px 6px 4px 20px' : '8px 6px',
          borderTop: subtotal || bold ? `1px solid ${BORDER}` : 'none',
          cursor: drillable ? 'pointer' : 'default',
          borderRadius: 2,
        }}
      >
        <span style={{ flex: 1, fontSize: 13, fontWeight: bold ? 700 : 400, color: indent ? MUTED : INK }}>
          {label}
          {drillable ? <span style={{ color: '#C9BBA0', fontSize: 11 }}> ›</span> : null}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: bold ? 700 : 400, color: cost ? RED : INK, width: 96, textAlign: 'right' }}>
          {money(show)}
        </span>
        {prev && (
          <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED, width: 88, textAlign: 'right' }}>{money(showPrior)}</span>
        )}
        {prev && (
          <span style={{ fontFamily: MONO, fontSize: 12, color: delta > 0 ? GREEN : delta < 0 ? RED : MUTED, width: 72, textAlign: 'right' }}>
            {delta != null ? money(delta) : '—'}
          </span>
        )}
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
      <span style={{ color: SPICE, fontSize: 10 }}>{pnlExpand[id] ? '▼' : '▶'}</span>
      {label}
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

      <div style={{ ...card }}>
        <div style={{ ...lbl, marginBottom: 8 }}>Profit &amp; loss · {cur.period}</div>
        {prev && (
          <div style={{ display: 'flex', padding: '0 6px 8px', gap: 8, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            <span style={{ flex: 1 }} />
            <span style={{ width: 96, textAlign: 'right' }}>This month</span>
            <span style={{ width: 88, textAlign: 'right' }}>Prior mo.</span>
            <span style={{ width: 72, textAlign: 'right' }}>Change</span>
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
              <button type="button" aria-label="Close" onClick={() => setPnlDrill(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: MUTED, cursor: 'pointer', minHeight: 40, minWidth: 40 }}>
                ×
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

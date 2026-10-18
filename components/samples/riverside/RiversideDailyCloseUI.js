import { useEffect } from 'react'
import { C, ui, head, fmtC, fmtDate, panel, hcell, cell } from './riversideUtils'
import { buildDailyCloseJournal } from './riversideDailyClose.js'

function Sheet({ title, subtitle, onBack, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && (onClose ? onClose() : onBack?.())
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack, onClose])

  return (
    <div className="rt-modal" onClick={onClose || onBack} role="presentation">
      <div className="rt-modal__box rt-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="rt-sheet-head">
          <div>
            <div style={{ fontFamily: head, fontSize: 15, fontWeight: 700, color: C.ink }}>{title}</div>
            {subtitle ? <div style={{ fontFamily: ui, fontSize: 12, color: C.sub, marginTop: 4 }}>{subtitle}</div> : null}
          </div>
          <div className="rt-sheet-actions">
            {onBack ? (
              <button type="button" className="rt-pill" onClick={onBack}>
                Back
              </button>
            ) : null}
            <button type="button" className="rt-pill on" onClick={onClose || onBack}>
              Close
            </button>
          </div>
        </div>
        <div className="rt-sheet-body">{children}</div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, valueStyle }) {
  return (
    <div className="rt-dclose-row">
      <span>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', ...valueStyle }}>{value}</span>
    </div>
  )
}

function statusColor(status) {
  if (status === 'Short') return { color: C.red }
  return { color: C.ink }
}

export function DailyCloseSection({ model, onSelectDay }) {
  if (!model?.days?.length) return null
  return (
    <div style={{ ...panel, marginTop: 24, marginBottom: 28 }}>
      <div style={{ fontFamily: head, fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Daily close
      </div>
      <div className="rt-dclose-table-wrap">
        <table className="rt-dclose-table">
          <thead>
            <tr>
              <th style={hcell()}>Date</th>
              <th style={hcell('right')}>Register</th>
              <th style={hcell('right')}>Cash</th>
              <th style={hcell('right')}>Card sales</th>
              <th style={hcell('right')}>Over / short</th>
              <th style={hcell()}>Status</th>
            </tr>
          </thead>
          <tbody>
            {model.days.map((day) => (
              <tr
                key={day.date}
                className="rt-clickrow"
                role="button"
                tabIndex={0}
                onClick={() => onSelectDay(day)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelectDay(day))}
              >
                <td style={cell('left')}>{fmtDate(day.date).replace(/, \d{4}$/, '')}</td>
                <td style={cell('right')}>{fmtC(day.registerSales)}</td>
                <td style={cell('right')}>{fmtC(day.cashDrawer.cashToDeposit)}</td>
                <td style={cell('right')}>{fmtC(day.cardBatch.batchTotal)}</td>
                <td style={cell('right')}>{fmtC(day.overShort)}</td>
                <td style={cell('left', statusColor(day.status))}>{day.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="rt-dclose-cards">
          {model.days.map((day) => (
            <button key={day.date} type="button" className="rt-dclose-card" onClick={() => onSelectDay(day)}>
              <div className="rt-dclose-card-top">
                <span>{fmtDate(day.date).replace(/, \d{4}$/, '')}</span>
                <span style={statusColor(day.status)}>{day.status}</span>
              </div>
              <div className="rt-dclose-card-grid">
                <span>Register</span>
                <span>{fmtC(day.registerSales)}</span>
                <span>Cash</span>
                <span>{fmtC(day.cashDrawer.cashToDeposit)}</span>
                <span>Card sales</span>
                <span>{fmtC(day.cardBatch.batchTotal)}</span>
                <span>Over / short</span>
                <span>{fmtC(day.overShort)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DailyCloseDayDetail({ day, onBack, onPreviewJe }) {
  if (!day) return null
  return (
    <Sheet title="Daily close" subtitle={fmtDate(day.date)} onBack={onBack}>
      <div style={{ fontFamily: ui, fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Register sales</div>
      <DetailRow label="Tires" value={fmtC(day.salesSplit.tires)} />
      <DetailRow label="Service" value={fmtC(day.salesSplit.service)} />
      <DetailRow label="Other" value={fmtC(day.salesSplit.other)} />
      <DetailRow label="Sales tax collected" value={fmtC(day.salesSplit.tax)} />
      <DetailRow label="Total register sales" value={fmtC(day.registerSales)} valueStyle={{ fontWeight: 600 }} />

      <div style={{ fontFamily: ui, fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '18px 0 8px' }}>Payments</div>
      <DetailRow label="Cash" value={fmtC(day.payments.cash)} />
      <DetailRow label="Card" value={fmtC(day.payments.card)} />

      <div style={{ fontFamily: ui, fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '18px 0 8px' }}>Cash drawer</div>
      <DetailRow label="Starting cash" value={fmtC(day.cashDrawer.startingCash)} />
      <DetailRow label="Cash sales" value={fmtC(day.cashDrawer.cashSales)} />
      <DetailRow label="Cash counted" value={fmtC(day.cashDrawer.cashCounted)} />
      <DetailRow label="Cash to deposit" value={fmtC(day.cashDrawer.cashToDeposit)} />

      <div style={{ fontFamily: ui, fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '18px 0 8px' }}>Card batch</div>
      <DetailRow label="Card sales" value={fmtC(day.cardBatch.batchTotal)} />
      <DetailRow label="Processing fee" value={fmtC(day.cardBatch.processingFee)} />
      <DetailRow label="Net deposit" value={fmtC(day.cardBatch.netDeposit)} />

      <div style={{ fontFamily: ui, fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '18px 0 8px' }}>Over / short</div>
      <DetailRow label="Variance" value={fmtC(day.overShort)} valueStyle={statusColor(day.status)} />

      <button type="button" className="rt-pill on" style={{ marginTop: 20 }} onClick={() => onPreviewJe(day)}>
        Post to QuickBooks
      </button>
    </Sheet>
  )
}

export function DailyCloseJePreview({ day, onClose }) {
  if (!day) return null
  const je = buildDailyCloseJournal(day)
  return (
    <Sheet title="Journal entry preview" subtitle={fmtDate(day.date)} onClose={onClose}>
      <p style={{ fontFamily: ui, fontSize: 12, color: C.sub, marginBottom: 16 }}>Goes into QuickBooks as a journal entry</p>
      <div className="rt-je-table-wrap">
        <table className="rt-je-table">
          <thead>
            <tr>
              <th style={hcell()}>Account</th>
              <th style={hcell('right')}>Debit</th>
              <th style={hcell('right')}>Credit</th>
            </tr>
          </thead>
          <tbody>
            {je.lines.map((line) => (
              <tr key={line.account}>
                <td style={cell('left')}>{line.account}</td>
                <td style={cell('right')}>{line.debit ? fmtC(line.debit) : ''}</td>
                <td style={cell('right')}>{line.credit ? fmtC(line.credit) : ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={cell('left', { fontWeight: 700, borderBottom: 'none' })}>Totals</td>
              <td style={cell('right', { fontWeight: 700, borderBottom: 'none' })}>{fmtC(je.debitTotal)}</td>
              <td style={cell('right', { fontWeight: 700, borderBottom: 'none' })}>{fmtC(je.creditTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Sheet>
  )
}

export function DashboardMetricSheet({ detail, onClose }) {
  if (!detail) return null
  const { title, subtitle, rows } = detail
  return (
    <Sheet title={title} subtitle={subtitle} onClose={onClose}>
      {rows.map((row) => (
        <DetailRow key={row.label} label={row.label} value={row.value} valueStyle={row.valueStyle} />
      ))}
    </Sheet>
  )
}

export const DAILY_CLOSE_CSS = `
  .rt-dclose-table-wrap{width:100%;overflow-x:auto}
  .rt-dclose-table{width:100%;border-collapse:collapse;min-width:0}
  .rt-dclose-cards{display:none}
  .rt-dclose-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid ${C.line};font-family:${ui};font-size:13px;color:${C.ink}}
  .rt-dclose-row span:first-child{color:${C.sub}}
  .rt-sheet-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px;flex-wrap:wrap}
  .rt-sheet-actions{display:flex;gap:8px;flex-wrap:wrap}
  .rt-sheet-body{max-height:min(70vh,640px);overflow-y:auto;padding-right:4px}
  .rt-je-table{width:100%;border-collapse:collapse}
  @media(max-width:640px){
    .rt-dclose-table{display:none}
    .rt-dclose-cards{display:flex;flex-direction:column;gap:10px}
    .rt-dclose-card{width:100%;text-align:left;border:1px solid ${C.hair};background:${C.card};padding:12px 14px;cursor:pointer;font-family:${ui}}
    .rt-dclose-card:hover{background:#FAF8F4}
    .rt-dclose-card-top{display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:10px}
    .rt-dclose-card-grid{display:grid;grid-template-columns:1fr auto;gap:6px 12px;font-size:12px;color:${C.sub}}
    .rt-dclose-card-grid span:nth-child(2n){color:${C.ink};font-variant-numeric:tabular-nums;text-align:right}
  }
`

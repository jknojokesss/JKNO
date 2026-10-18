import DATA from '../../../data/primal-krisp.json'
import { enrichPayouts, payoutTotals, aggregatePayoutTable } from './primalKrispDepositsData'
import { BORDER, CREAM, INK, MUTED, RED, UI, MONO, money, fmtD, fmtInt } from '../primalKrispUtils'

const DEPOSITS_CSS = `
.pk-dep-table{width:100%;border-collapse:collapse;font-size:13px}
.pk-dep-table th{font-size:10px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:#A9763A;padding:8px 6px;border-bottom:1px solid ${BORDER};text-align:left;white-space:nowrap}
.pk-dep-table th.pk-num{text-align:right}
.pk-dep-table td{padding:10px 6px;border-bottom:1px solid ${CREAM};vertical-align:top}
.pk-dep-table td.pk-num{text-align:right;font-variant-numeric:tabular-nums}
.pk-dep-table tr.pk-dep-total td{font-weight:700;border-top:1px solid ${BORDER};background:${CREAM}}
.pk-dep-row{width:100%;border:none;background:transparent;text-align:left;cursor:pointer;padding:0;font:inherit;color:inherit}
@media(max-width:640px){
.pk-dep-table thead{display:none}
.pk-dep-table,.pk-dep-table tbody,.pk-dep-table tr,.pk-dep-table td{display:block;width:100%}
.pk-dep-table tr{border-bottom:1px solid ${BORDER};padding:12px 0}
.pk-dep-table tr.pk-dep-total{border-top:2px solid ${BORDER};margin-top:8px;padding-top:14px}
.pk-dep-table td{border:none;padding:4px 0;display:flex;justify-content:space-between;gap:12px;align-items:baseline}
.pk-dep-table td::before{content:attr(data-label);color:${MUTED};font-size:12px;font-weight:500;flex-shrink:0}
.pk-dep-table td.pk-dep-head{display:block;font-weight:600;font-size:15px;color:${INK};padding-bottom:8px}
.pk-dep-table td.pk-dep-head::before{display:none}
}
`

function matchLabel(p) {
  const t = payoutTotals(p)
  if (p.matched) return 'Matched'
  return `Not matched ${money(-t.mismatch_amount)}`
}

function rowNotMatched(t) {
  return t.mismatch_amount || 0
}

export default function PrimalKrispDepositsTab({ KPI, card, lbl, onOpenDetail }) {
  const { payouts, summary } = enrichPayouts(DATA.deposits)
  const nm = summary.not_matched
  const totals = aggregatePayoutTable(payouts)
  const openDeposited = () => onOpenDetail({ kind: 'depDeposited' })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DEPOSITS_CSS }} />
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <KPI k="Deposited Oct 1-17" v={money(summary.deposited_this_month)} onClick={openDeposited} />
        <KPI k="Fees" v={money(summary.fees)} onClick={() => onOpenDetail({ kind: 'depFees' })} />
        <KPI k="Orders matched" v={fmtInt(summary.orders_matched)} onClick={() => onOpenDetail({ kind: 'depOrdersMatched' })} />
        <KPI
          k="Not matched"
          v={fmtInt(nm.order_count)}
          sub={money(-nm.dollars)}
          subColor={RED}
          onClick={() => onOpenDetail({ kind: 'depNotMatched' })}
        />
      </div>
      <div style={{ fontFamily: UI, fontSize: 12, color: MUTED, marginBottom: 16 }}>{DATA.deposits.qb_note}</div>

      <div style={{ ...card, padding: '12px 16px' }}>
        <div style={{ ...lbl, marginBottom: 10 }}>Payouts</div>
        <table className="pk-dep-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Source</th>
              <th className="pk-num">Deposit</th>
              <th className="pk-num">Orders</th>
              <th className="pk-num">Gross sales</th>
              <th className="pk-num">Delivery guarantee</th>
              <th className="pk-num">Fees</th>
              <th className="pk-num">Refunds</th>
              <th className="pk-num">Not matched</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => {
              const t = payoutTotals(p)
              const status = matchLabel(p)
              const nmAmt = rowNotMatched(t)
              return (
                <tr key={p.id} className="pk-click" role="button" tabIndex={0} onClick={() => onOpenDetail({ kind: 'depPayout', id: p.id })} onKeyDown={(e) => e.key === 'Enter' && onOpenDetail({ kind: 'depPayout', id: p.id })} style={{ cursor: 'pointer' }}>
                  <td className="pk-dep-head" data-label="Date">{fmtD(p.date)}</td>
                  <td data-label="Source">{p.source}</td>
                  <td className="pk-num" data-label="Deposit">{money(t.deposit)}</td>
                  <td className="pk-num" data-label="Orders">{fmtInt(t.order_count)}</td>
                  <td className="pk-num" data-label="Gross sales">{money(t.gross_sales)}</td>
                  <td className="pk-num" data-label="Delivery guarantee">{money(t.delivery_guarantee)}</td>
                  <td className="pk-num" data-label="Fees">{money(-t.fees)}</td>
                  <td className="pk-num" data-label="Refunds">{t.refunds ? money(-t.refunds) : money(0)}</td>
                  <td className="pk-num" data-label="Not matched">{nmAmt ? money(-nmAmt) : money(0)}</td>
                  <td data-label="Status" style={{ color: p.matched ? INK : RED, fontWeight: 600, fontSize: 12 }}>{status}</td>
                </tr>
              )
            })}
            <tr
              className="pk-dep-total pk-click"
              role="button"
              tabIndex={0}
              onClick={openDeposited}
              onKeyDown={(e) => e.key === 'Enter' && openDeposited()}
              style={{ cursor: 'pointer' }}
            >
              <td className="pk-dep-head" data-label="Date">Total</td>
              <td data-label="Source">October</td>
              <td className="pk-num" data-label="Deposit">{money(totals.deposit)}</td>
              <td className="pk-num" data-label="Orders">{fmtInt(totals.order_count)}</td>
              <td className="pk-num" data-label="Gross sales">{money(totals.gross_sales)}</td>
              <td className="pk-num" data-label="Delivery guarantee">{money(totals.delivery_guarantee)}</td>
              <td className="pk-num" data-label="Fees">{money(-totals.fees)}</td>
              <td className="pk-num" data-label="Refunds">{totals.refunds ? money(-totals.refunds) : money(0)}</td>
              <td className="pk-num" data-label="Not matched">{totals.not_matched ? money(-totals.not_matched) : money(0)}</td>
              <td data-label="Status" />
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

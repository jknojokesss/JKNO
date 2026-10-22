import {
  ACCENT,
  ACCENT_LIGHT,
  AMBER,
  GREEN,
  INK,
  MUTED,
  RED,
  STALE_BG,
  STALE_BORDER,
  fmtD,
  fmtMf,
  fmtPhone,
  money,
  stageLabel,
  vehicleLabel,
} from './leaseBrokerUtils'
import { dealerById, isQuoteStale, referrerById } from './leaseBrokerModel'

export default function LeaseBrokerDeal({
  deal,
  dealers,
  referrers,
  programMonth,
  onBack,
  onPickWinner,
  onAddQuote,
  onMarkFeePaid,
}) {
  if (!deal) {
    return (
      <div className="lb-card">
        <p style={{ color: MUTED }}>Deal not found.</p>
        <button type="button" className="lb-btn" onClick={onBack}>Back</button>
      </div>
    )
  }

  const ref = referrerById(referrers, deal.referrer_id)
  const quotes = [...deal.quotes].sort((a, b) => a.monthly - b.monthly)

  return (
    <div>
      <button type="button" className="lb-btn" style={{ marginBottom: 14 }} onClick={onBack}>
        Back
      </button>

      <div className="lb-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>{deal.client.name}</h2>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
              {fmtPhone(deal.client.phone)}
              {deal.client.email ? ` · ${deal.client.email}` : ''}
            </div>
            {ref ? (
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Referred by {ref.name}</div>
            ) : null}
          </div>
          <span className="lb-tag" style={{ background: ACCENT_LIGHT, color: ACCENT }}>{stageLabel(deal.stage)}</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 14 }}>
          <div className="lb-lbl" style={{ marginBottom: 4 }}>Car wanted</div>
          <div style={{ fontWeight: 600 }}>{vehicleLabel(deal.vehicle)}</div>
        </div>
        {deal.notes ? <p style={{ fontSize: 13, color: MUTED, marginTop: 12 }}>{deal.notes}</p> : null}
      </div>

      <div className="lb-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="lb-lbl">Dealer quotes</div>
          <button type="button" className="lb-btn lb-btn--primary" onClick={onAddQuote}>Add quote</button>
        </div>
        {quotes.length === 0 ? (
          <p style={{ fontSize: 14, color: MUTED }}>No quotes yet — text your dealers and log them here.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Dealer</th>
                  <th className="lb-num">Monthly</th>
                  <th className="lb-num">Due at signing</th>
                  <th className="lb-num">MF</th>
                  <th className="lb-num">Residual</th>
                  <th className="lb-num">Rebates</th>
                  <th>Quote date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const dlr = dealerById(dealers, q.dealer_id)
                  const stale = isQuoteStale(q.quote_date, programMonth)
                  return (
                    <tr key={q.id} style={stale ? { background: STALE_BG } : undefined}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{dlr?.name || '—'}</div>
                        {q.winner ? (
                          <span className="lb-tag" style={{ background: '#EAF3EC', color: GREEN, marginTop: 4 }}>Winner</span>
                        ) : null}
                      </td>
                      <td className="lb-num" style={{ fontWeight: 600 }}>{money(q.monthly)}</td>
                      <td className="lb-num">{money(q.due_at_signing)}</td>
                      <td className="lb-num">{fmtMf(q.money_factor)}</td>
                      <td className="lb-num">{q.residual_pct}%</td>
                      <td className="lb-num">{money(q.rebates)}</td>
                      <td>
                        {fmtD(q.quote_date)}
                        {stale ? (
                          <span className="lb-tag" style={{ background: STALE_BORDER, color: AMBER, marginLeft: 6 }}>Stale</span>
                        ) : null}
                      </td>
                      <td className="lb-num">
                        {!q.winner ? (
                          <button type="button" className="lb-btn" style={{ fontSize: 12, padding: '5px 8px', minHeight: 32 }} onClick={() => onPickWinner(deal.id, q.id)}>
                            Pick
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontSize: 11, color: MUTED, marginTop: 10 }}>
          Quotes before {programMonth} use last month&apos;s lender program and are flagged stale.
        </p>
      </div>

      <div className="lb-card">
        <div className="lb-lbl" style={{ marginBottom: 8 }}>Broker fee</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }} className="lb-num">{money(deal.fee.amount)}</span>
          {deal.fee.paid ? (
            <span style={{ color: GREEN, fontWeight: 600, fontSize: 14 }}>Paid {fmtD(deal.fee.paid_date)}</span>
          ) : (
            <button type="button" className="lb-btn lb-btn--primary" onClick={onMarkFeePaid}>Mark fee paid</button>
          )}
        </div>
      </div>
    </div>
  )
}

import { fmtD, fmtMf, fmtPhone, money, vehicleLabel } from './leaseBrokerUtils'
import { dealerById, isQuoteStale, referrerById } from './leaseBrokerModel'
import { canMarkFeePaid, feeStatusLabel } from './leaseBrokerFeeStatus'
import { StageStatus } from './leaseBrokerStatus'

function QuoteRow({ q, dlr, stale, winner, showWinner, onPick }) {
  return (
    <tr className={stale ? 'lb-quote-row--stale' : undefined} style={stale ? { background: '#FAF6EE' } : undefined}>
      <td>
        <div className="lb-card-title">{dlr?.name || '—'}</div>
        <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {stale ? <span className="lb-status lb-status--warn">Stale</span> : null}
          {showWinner && winner ? <span className="lb-status lb-status--ok">Winner</span> : null}
        </div>
      </td>
      <td className="lb-num">{money(q.monthly)}</td>
      <td className="lb-num">{money(q.due_at_signing)}</td>
      <td className="lb-num">{fmtMf(q.money_factor)}</td>
      <td className="lb-num">{q.residual_pct}%</td>
      <td className="lb-num">{money(q.rebates)}</td>
      <td className="lb-tabnum">{fmtD(q.quote_date)}</td>
      <td className="lb-num">
        {!winner ? (
          <button type="button" className="lb-btn lb-btn--quiet" onClick={onPick}>Pick</button>
        ) : null}
      </td>
    </tr>
  )
}

function QuoteCard({ q, dlr, stale, winner, showWinner, onPick }) {
  return (
    <div className={`lb-quote-card${stale ? ' lb-quote-card--stale' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <div className="lb-card-title">{dlr?.name || '—'}</div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {stale ? <span className="lb-status lb-status--warn">Stale</span> : null}
          {showWinner && winner ? <span className="lb-status lb-status--ok">Winner</span> : null}
        </div>
      </div>
      <dl className="lb-quote-grid">
        <dt>Monthly</dt>
        <dd className="lb-num">{money(q.monthly)}</dd>
        <dt>Due at signing</dt>
        <dd className="lb-num">{money(q.due_at_signing)}</dd>
        <dt>Money factor</dt>
        <dd className="lb-num">{fmtMf(q.money_factor)}</dd>
        <dt>Residual</dt>
        <dd className="lb-num">{q.residual_pct}%</dd>
        <dt>Rebates</dt>
        <dd className="lb-num">{money(q.rebates)}</dd>
        <dt>Quote date</dt>
        <dd className="lb-tabnum">{fmtD(q.quote_date)}</dd>
      </dl>
      {!winner ? (
        <button type="button" className="lb-btn lb-btn--quiet" style={{ marginTop: 8, width: '100%' }} onClick={onPick}>
          Pick
        </button>
      ) : null}
    </div>
  )
}

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
        <p className="lb-meta">Deal not found.</p>
        <button type="button" className="lb-btn" onClick={onBack}>Back</button>
      </div>
    )
  }

  const ref = referrerById(referrers, deal.referrer_id)
  const quotes = [...deal.quotes].sort((a, b) => a.monthly - b.monthly)
  const feeLabel = feeStatusLabel(deal)
  const showWinner = deal.stage !== 'lead' && deal.stage !== 'quoted'

  return (
    <div>
      <button type="button" className="lb-btn lb-btn--quiet" style={{ marginBottom: 16 }} onClick={onBack}>
        Back
      </button>

      <div className="lb-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
            <div className="lb-tabnum">
              {fmtPhone(deal.client.phone)}
              {deal.client.email ? ` · ${deal.client.email}` : ''}
            </div>
            {ref ? <div className="lb-meta" style={{ marginTop: 8 }}>Referred by {ref.name}</div> : null}
          </div>
          <StageStatus stage={deal.stage} />
        </div>
        <div style={{ marginTop: 16 }}>
          <h2 className="lb-section-h" style={{ fontSize: 16, marginBottom: 4 }}>Car wanted</h2>
          <div>{vehicleLabel(deal.vehicle)}</div>
        </div>
        {deal.notes ? <p className="lb-meta" style={{ marginTop: 12 }}>{deal.notes}</p> : null}
      </div>

      <div className="lb-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <h2 className="lb-section-h" style={{ margin: 0 }}>Dealer quotes</h2>
          <button type="button" className="lb-btn lb-btn--primary" onClick={onAddQuote}>Add quote</button>
        </div>
        {quotes.length === 0 ? (
          <p className="lb-meta">None</p>
        ) : (
          <>
            <div className="lb-show-desktop lb-scroll">
              <table className="lb-table lb-table--wide">
                <thead>
                  <tr>
                    <th>Dealer</th>
                    <th className="lb-num">Monthly</th>
                    <th className="lb-num">Due at signing</th>
                    <th className="lb-num">Money factor</th>
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
                      <QuoteRow
                        key={q.id}
                        q={q}
                        dlr={dlr}
                        stale={stale}
                        winner={q.winner}
                        showWinner={showWinner}
                        onPick={() => onPickWinner(deal.id, q.id)}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="lb-show-mobile lb-quote-stack">
              {quotes.map((q) => {
                const dlr = dealerById(dealers, q.dealer_id)
                const stale = isQuoteStale(q.quote_date, programMonth)
                return (
                  <QuoteCard
                    key={q.id}
                    q={q}
                    dlr={dlr}
                    stale={stale}
                    winner={q.winner}
                    showWinner={showWinner}
                    onPick={() => onPickWinner(deal.id, q.id)}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="lb-card">
        <h2 className="lb-section-h">Broker fee</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span className="lb-kpi-val lb-num">{money(deal.fee.amount)}</span>
          {deal.fee.paid ? (
            <span className="lb-meta">Paid <span className="lb-tabnum">{fmtD(deal.fee.paid_date)}</span></span>
          ) : canMarkFeePaid(deal) ? (
            <button type="button" className="lb-btn lb-btn--quiet" onClick={onMarkFeePaid}>Mark fee paid</button>
          ) : (
            <span className="lb-meta">{feeLabel}</span>
          )}
        </div>
      </div>
    </div>
  )
}

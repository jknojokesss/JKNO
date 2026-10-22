import { fmtDShort, fmtPhone, moneyOrDash, vehicleLabel, stageLabel } from './leaseBrokerUtils'
import { leasesEndingSoon, dealsInProgress, feesOwedCollectible, feesOwedCollectibleTotal } from './leaseBrokerModel'

export default function LeaseBrokerHome({ state, meta, ready, openDeal, startNewDealFromLease, goFees }) {
  const ending = leasesEndingSoon(state.deals, meta.as_of, 90)
  const progress = dealsInProgress(state.deals)
  const owed = feesOwedCollectible(state.deals)
  const owedTotal = feesOwedCollectibleTotal(state.deals)

  const progressSorted = [...progress]
    .filter((d) => !ending.find((e) => e.id === d.id) || d.stage !== 'fee_paid')
    .sort((a, b) => {
      const order = { lead: 0, quoted: 1, signed: 2, delivered: 3, fee_paid: 4 }
      return order[a.stage] - order[b.stage]
    })
    .slice(0, 8)

  return (
    <div>
      <section className="lb-card">
        <h2 className="lb-section-h">Leases ending in the next 90 days</h2>
        {ending.length === 0 ? (
          <p className="lb-meta">—</p>
        ) : (
          <>
            <div className="lb-show-desktop lb-scroll">
              <table className="lb-table lb-table--wide">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Vehicle</th>
                    <th className="lb-num">Ends</th>
                    <th>Phone</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {ending.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <button type="button" className="lb-link-btn lb-card-title" onClick={() => openDeal(d.id)}>
                          {d.client.name}
                        </button>
                      </td>
                      <td>{vehicleLabel(d.vehicle)}</td>
                      <td className="lb-num">{fmtDShort(d.lease_end)}</td>
                      <td className="lb-tabnum">{fmtPhone(d.client.phone)}</td>
                      <td className="lb-num">
                        <button type="button" className="lb-btn lb-btn--quiet" onClick={() => startNewDealFromLease(d)}>
                          Start deal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lb-show-mobile lb-stack">
              {ending.map((d) => (
                <div key={d.id} className="lb-stack-row">
                  <div className="lb-stack-line1">
                    <button type="button" className="lb-link-btn" onClick={() => openDeal(d.id)}>
                      {d.client.name}
                    </button>
                    <span className="lb-num lb-tabnum">{fmtDShort(d.lease_end)}</span>
                  </div>
                  <div className="lb-stack-line2">{vehicleLabel(d.vehicle)}</div>
                  <div className="lb-stack-line3">
                    <span className="lb-tabnum">{fmtPhone(d.client.phone)}</span>
                    <button type="button" className="lb-btn lb-btn--quiet" onClick={() => startNewDealFromLease(d)}>
                      Start deal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        <section className="lb-card">
          <h2 className="lb-section-h">Deals in progress</h2>
          <ul style={{ listStyle: 'none' }}>
            {progressSorted
              .filter((d) => d.stage !== 'fee_paid')
              .map((d) => (
                <li key={d.id} style={{ padding: '8px 0', borderTop: '1px solid #E5E7EB' }}>
                  <button type="button" className="lb-btn lb-btn--ghost" style={{ textAlign: 'left', width: '100%' }} onClick={() => openDeal(d.id)}>
                    <div className="lb-card-title">{d.client.name}</div>
                    <div className="lb-meta" style={{ marginTop: 4 }}>
                      {stageLabel(d.stage)}
                      {d.quotes.length ? ` · ${d.quotes.length} quote${d.quotes.length > 1 ? 's' : ''}` : ''}
                    </div>
                  </button>
                </li>
              ))}
          </ul>
        </section>

        <section className="lb-card">
          <h2 className="lb-section-h">Fees owed</h2>
          <div className="lb-kpi-val lb-num" style={{ marginBottom: 12 }}>{moneyOrDash(owedTotal, ready)}</div>
          {owed.length > 0 ? (
            <ul style={{ listStyle: 'none' }}>
              {owed.map((d) => (
                <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderTop: '1px solid #E5E7EB' }}>
                  <button type="button" className="lb-link-btn" onClick={() => openDeal(d.id)}>
                    {d.client.name}
                  </button>
                  <span className="lb-num">{moneyOrDash(d.fee.amount, ready)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" className="lb-btn lb-btn--quiet" style={{ marginTop: owed.length ? 12 : 0, width: '100%' }} onClick={goFees}>
            Fee tracker
          </button>
        </section>
      </div>
    </div>
  )
}

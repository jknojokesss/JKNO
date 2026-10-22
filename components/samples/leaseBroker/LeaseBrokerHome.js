import {
  INK,
  MUTED,
  fmtDShort,
  fmtPhone,
  moneyOrDash,
  vehicleLabel,
  stageLabel,
} from './leaseBrokerUtils'
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
        <div className="lb-lbl" style={{ marginBottom: 10 }}>Leases ending in the next 90 days</div>
        {ending.length === 0 ? (
          <p style={{ fontSize: 14, color: MUTED }}>—</p>
        ) : (
          <div className="lb-scroll">
            <table className="lb-table lb-table--wide">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Vehicle</th>
                  <th>Ends</th>
                  <th>Phone</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ending.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <button type="button" className="lb-btn lb-btn--ghost" style={{ padding: 0, minHeight: 0, border: 'none', fontWeight: 600, color: INK }} onClick={() => openDeal(d.id)}>
                        {d.client.name}
                      </button>
                    </td>
                    <td style={{ fontSize: 13 }}>{vehicleLabel(d.vehicle)}</td>
                    <td className="lb-num" style={{ fontWeight: 600 }}>{fmtDShort(d.lease_end)}</td>
                    <td>{fmtPhone(d.client.phone)}</td>
                    <td className="lb-num">
                      <button type="button" className="lb-btn lb-btn--primary" style={{ fontSize: 12, padding: '6px 10px', minHeight: 36 }} onClick={() => startNewDealFromLease(d)}>
                        Start new deal
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        <section className="lb-card">
          <div className="lb-lbl" style={{ marginBottom: 10 }}>Deals in progress</div>
          <ul style={{ listStyle: 'none', fontSize: 14 }}>
            {progressSorted
              .filter((d) => d.stage !== 'fee_paid')
              .map((d) => (
                <li key={d.id} style={{ padding: '8px 0', borderTop: '1px solid #E2E5EB' }}>
                  <button
                    type="button"
                    className="lb-btn lb-btn--ghost"
                    style={{ padding: 0, minHeight: 0, border: 'none', textAlign: 'left', width: '100%' }}
                    onClick={() => openDeal(d.id)}
                  >
                    <div style={{ fontWeight: 600, color: INK }}>{d.client.name}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                      {stageLabel(d.stage)}
                      {d.quotes.length ? ` · ${d.quotes.length} quote${d.quotes.length > 1 ? 's' : ''}` : ''}
                    </div>
                  </button>
                </li>
              ))}
          </ul>
        </section>

        <section className="lb-card">
          <div className="lb-lbl" style={{ marginBottom: 6 }}>Fees owed</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }} className="lb-num">
            {moneyOrDash(owedTotal, ready)}
          </div>
          {owed.length > 0 ? (
            <ul style={{ listStyle: 'none', fontSize: 14 }}>
              {owed.map((d) => (
                <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderTop: '1px solid #E2E5EB' }}>
                  <button type="button" className="lb-btn lb-btn--ghost" style={{ padding: 0, minHeight: 0, border: 'none', fontWeight: 500 }} onClick={() => openDeal(d.id)}>
                    {d.client.name}
                  </button>
                  <span className="lb-num" style={{ fontWeight: 600 }}>{moneyOrDash(d.fee.amount, ready)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" className="lb-btn" style={{ marginTop: owed.length ? 12 : 0, width: '100%' }} onClick={goFees}>
            Fee tracker
          </button>
        </section>
      </div>
    </div>
  )
}

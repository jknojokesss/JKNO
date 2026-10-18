import DATA from './aufschnittData'
import { INK, MUTED, BORDER, CREAM, MONO, money, money0, fmtAsOfLong, AGING_CSS } from './aufschnittUtils'

export default function AufschnittReceivablesTab({ card, lbl, onOpen }) {
  const { accounts } = DATA.receivables
  const totals = {
    current: accounts.reduce((s, a) => s + a.buckets.current, 0),
    d1_30: accounts.reduce((s, a) => s + a.buckets.d1_30, 0),
    d31_60: accounts.reduce((s, a) => s + a.buckets.d31_60, 0),
    d61_90: accounts.reduce((s, a) => s + a.buckets.d61_90, 0),
    d90p: accounts.reduce((s, a) => s + a.buckets.d90p, 0),
    total: accounts.reduce((s, a) => s + a.buckets.total, 0),
  }

  return (
    <div style={{ ...card }}>
      <style>{AGING_CSS}</style>
      <div style={{ ...lbl, marginBottom: 10 }}>Owed by stores</div>
      <table className="au-aging au-aging--full">
        <thead>
          <tr>
            <th>Account</th>
            <th>Current</th>
            <th>1-30</th>
            <th>31-60</th>
            <th>61-90</th>
            <th>90+</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr
              key={a.name}
              className="au-click"
              role="button"
              tabIndex={0}
              onClick={() => onOpen({ type: 'ar-account', account: a.name })}
              onKeyDown={(e) => e.key === 'Enter' && onOpen({ type: 'ar-account', account: a.name })}
              style={{ cursor: 'pointer' }}
            >
              <td className="au-aging-acct">{a.name}</td>
              <td>{money0(a.buckets.current)}</td>
              <td>{money0(a.buckets.d1_30)}</td>
              <td>{money0(a.buckets.d31_60)}</td>
              <td>{money0(a.buckets.d61_90)}</td>
              <td>{money0(a.buckets.d90p)}</td>
              <td style={{ fontWeight: 600 }}>{money0(a.buckets.total)}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700, borderTop: `2px solid ${BORDER}` }}>
            <td>Total</td>
            <td>{money0(totals.current)}</td>
            <td>{money0(totals.d1_30)}</td>
            <td>{money0(totals.d31_60)}</td>
            <td>{money0(totals.d61_90)}</td>
            <td>{money0(totals.d90p)}</td>
            <td>{money0(totals.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="au-aging-cards">
        {accounts.map((a) => {
          const over30 = a.buckets.d31_60 + a.buckets.d61_90 + a.buckets.d90p
          return (
            <button
              key={a.name}
              type="button"
              className="au-aging-card au-click"
              onClick={() => onOpen({ type: 'ar-account', account: a.name })}
              style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{a.name}</div>
              <div className="au-aging-card-row">
                <span>Total</span>
                <span style={{ fontFamily: MONO }}>{money0(a.buckets.total)}</span>
              </div>
              <div className="au-aging-card-row">
                <span>Over 30</span>
                <span style={{ fontFamily: MONO }}>{money0(over30)}</span>
              </div>
              <div className="au-aging-card-row">
                <span>Current</span>
                <span style={{ fontFamily: MONO }}>{money0(a.buckets.current)}</span>
              </div>
              <div className="au-aging-card-row">
                <span>1-30</span>
                <span style={{ fontFamily: MONO }}>{money0(a.buckets.d1_30)}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ReceivableAccountDetail({ detail, card, lbl, big, onBack }) {
  const acct = DATA.receivables.accounts.find((a) => a.name === detail.account)
  const invoices = DATA.receivables.invoices.filter((i) => i.account === detail.account)
  const payments = DATA.receivables.payments.filter((p) => p.account === detail.account)
  if (!acct) return null

  return (
    <div>
      <button type="button" className="au-detail-back" onClick={onBack}>← Back</button>
      <h2 style={{ ...big, fontSize: 20, marginBottom: 16 }}>{acct.name}</h2>

      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ ...lbl, marginBottom: 8 }}>Open invoices</div>
        {invoices.map((inv) => (
          <div key={inv.invoiceNo} style={{ padding: '10px 0', borderTop: `1px solid ${CREAM}`, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{inv.invoiceNo}</span>
              <span style={{ fontFamily: MONO }}>{money(inv.amount)}</span>
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
              {fmtAsOfLong(inv.date)} · due {fmtAsOfLong(inv.dueDate)} · {inv.daysPastDue} days past due
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{inv.brands.join(', ')}</div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontWeight: 700, borderTop: `1px solid ${BORDER}` }}>
          <span>Total</span>
          <span style={{ fontFamily: MONO }}>{money0(acct.buckets.total)}</span>
        </div>
      </div>

      <div style={{ ...card }}>
        <div style={{ ...lbl, marginBottom: 8 }}>Payments received · last 60 days</div>
        {payments.length === 0 ? (
          <div style={{ fontSize: 13, color: MUTED }}>None</div>
        ) : (
          payments.map((p) => (
            <div key={p.reference} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${CREAM}`, fontSize: 13 }}>
              <span>{fmtAsOfLong(p.date)} · {p.reference}</span>
              <span style={{ fontFamily: MONO }}>{money(p.amount)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

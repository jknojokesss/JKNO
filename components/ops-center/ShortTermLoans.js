import {
  formatMoney,
  stlTotal,
  stlOriginalTotal,
  stlMonthlyTotal,
  shortTermLoansByEntity,
  stlPaidPercent,
  fmtLoanDate,
  fmtLoanPayoff,
} from './utils'

const SLATE = '#4a6270'

function BalanceCell({ loan }) {
  const pct = stlPaidPercent(loan.original, loan.balance)
  return (
    <div className="min-w-[7rem]">
      <div className="text-right text-sm font-medium tabular-nums">{formatMoney(loan.balance)}</div>
      {pct != null && pct > 0 ? (
        <div className="mt-1.5">
          <div className="h-1 overflow-hidden rounded-full bg-[#e8eef1]">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: SLATE }} />
          </div>
          <p className="mt-0.5 text-right text-[10px] text-[#5c7280]">{pct}% paid</p>
        </div>
      ) : loan.balance < 0 ? (
        <div className="mt-1.5 h-1 rounded-full bg-[#e8eef1]" />
      ) : null}
    </div>
  )
}

function LoanRowMobile({ loan }) {
  const fields = [
    ['Original', formatMoney(loan.original)],
    ['Rate', loan.rate],
    ['Monthly', loan.monthly ? formatMoney(loan.monthly) : '—'],
    ['Next payment', fmtLoanDate(loan.nextPayment)],
    ['Payoff', fmtLoanPayoff(loan.payoff)],
  ]
  return (
    <div className="border-t border-[#c5d0d6]/40 px-3 py-3 lg:hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="ops-heading text-sm font-semibold text-[#2f4049]">{loan.lender}</p>
          <p className="text-xs text-[#5c7280]">{loan.type}</p>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <BalanceCell loan={loan} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#5c7280]">{label}</dt>
            <dd className="mt-0.5 tabular-nums text-[#2f4049]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function LoanRowDesktop({ loan }) {
  return (
    <tr className="border-t border-[#c5d0d6]/30">
      <td className="px-3 py-2.5 text-sm font-medium text-[#2f4049]">{loan.lender}</td>
      <td className="px-3 py-2.5 text-sm text-[#5c7280]">{loan.type}</td>
      <td className="px-3 py-2.5 text-right text-sm tabular-nums">{formatMoney(loan.original)}</td>
      <td className="px-3 py-2.5 align-top">
        <BalanceCell loan={loan} />
      </td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-[#5c7280]">{loan.rate}</td>
      <td className="px-3 py-2.5 text-right text-sm tabular-nums">
        {loan.monthly ? formatMoney(loan.monthly) : '—'}
      </td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-[#5c7280]">{fmtLoanDate(loan.nextPayment)}</td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-[#5c7280]">{fmtLoanPayoff(loan.payoff)}</td>
    </tr>
  )
}

export default function ShortTermLoansSection({ heroTotal }) {
  const groups = shortTermLoansByEntity()
  const balanceTotal = stlTotal()
  const originalTotal = stlOriginalTotal()
  const monthlyTotal = stlMonthlyTotal()
  const tiesHero = Math.abs(balanceTotal - heroTotal) < 0.01

  const th =
    'px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-[#5c7280] bg-white border-b border-[#c5d0d6]/50'

  return (
    <div className="border-t border-[#c5d0d6]/40 bg-[#f4f7f9] px-3 py-4 sm:px-4 sm:py-5">
      <div className="overflow-hidden rounded-xl border border-[#c5d0d6]/60 bg-white shadow-sm">
        <div className="border-b border-[#c5d0d6]/50 bg-white px-4 py-3 sm:px-5">
          <h3 className="ops-heading text-base font-semibold text-[#2f4049] sm:text-lg">Short-term loans</h3>
        </div>

        {groups.map((group) => (
          <div key={group.entity}>
            <div className="flex items-center justify-between gap-3 border-b border-[#c5d0d6]/40 bg-[#e8eef1]/45 px-3 py-2 sm:px-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#5c7280]">{group.entity}</span>
              <span className="text-sm font-semibold tabular-nums text-[#2f4049]">{formatMoney(group.balance)}</span>
            </div>

            <div className="max-w-full overflow-x-auto lg:overflow-visible">
              <table className="hidden w-full min-w-0 border-collapse lg:table">
                <thead>
                  <tr>
                    <th className={th}>Lender</th>
                    <th className={th}>Type</th>
                    <th className={`${th} text-right`}>Original</th>
                    <th className={`${th} text-right`}>Balance</th>
                    <th className={th}>Rate</th>
                    <th className={`${th} text-right`}>Monthly</th>
                    <th className={th}>Next payment</th>
                    <th className={th}>Payoff</th>
                  </tr>
                </thead>
                <tbody>
                  {group.loans.map((loan) => (
                    <LoanRowDesktop key={`${group.entity}-${loan.type}-${loan.lender}`} loan={loan} />
                  ))}
                </tbody>
              </table>
            </div>

            {group.loans.map((loan) => (
              <LoanRowMobile key={`m-${group.entity}-${loan.type}-${loan.lender}`} loan={loan} />
            ))}
          </div>
        ))}

        <div className="flex flex-col gap-3 border-t-2 border-[#c5d0d6]/50 bg-[#e8eef1]/35 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#5c7280]">Section totals</span>
          <dl className="grid grid-cols-3 gap-2 text-right text-xs sm:flex sm:flex-wrap sm:gap-8 sm:text-sm">
            <div>
              <dt className="text-[10px] uppercase text-[#5c7280]">Original</dt>
              <dd className="font-semibold tabular-nums">{formatMoney(originalTotal)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase text-[#5c7280]">Balance</dt>
              <dd className="flex items-center justify-end gap-1.5 font-semibold tabular-nums">
                {formatMoney(balanceTotal)}
                {tiesHero ? (
                  <span className="font-normal text-[#5c7280]" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase text-[#5c7280]">Monthly</dt>
              <dd className="font-semibold tabular-nums">{formatMoney(monthlyTotal)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useMemo } from 'react'
import { OPS_SAMPLE } from '../../data/ops-center-sample.js'
import { formatMoney, NAVY_GRADIENT, GOLD_ON_NAVY } from './utils'

export default function BankBalances({ onTotalChange }) {
  const total = useMemo(() => OPS_SAMPLE.banks.reduce((s, b) => s + b.balance, 0), [])

  useEffect(() => {
    if (onTotalChange) onTotalChange(total)
  }, [total, onTotalChange])

  return (
    <section className="ops-card mt-6 overflow-hidden">
      <div className="ops-navy-hd" style={{ background: NAVY_GRADIENT }}>
        <div className="flex flex-wrap items-end justify-between gap-4 px-4 py-4 sm:px-5">
          <div>
            <p className="ops-eyebrow-navy">CASH ON HAND</p>
            <h2 className="ops-heading mt-1 text-2xl text-white sm:text-3xl">Bank balances</h2>
          </div>
          <div className="text-right">
            <p className="ops-eyebrow-navy">TOTAL CASH</p>
            <p className="ops-heading mt-1 text-3xl tabular-nums text-[#e8c97a] sm:text-4xl" style={{ color: GOLD_ON_NAVY }}>
              {formatMoney(total)}
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-[#c5d0d6]/40 bg-[#e8eef1]/20 px-4 py-4 sm:px-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {OPS_SAMPLE.banks.map((bank) => (
            <div
              key={bank.name}
              className="rounded-lg border border-[#c5d0d6]/50 bg-white px-4 py-3"
            >
              <p className="text-xs font-semibold text-[#5c7280]">{bank.name}</p>
              <p className="ops-heading mt-1 text-lg font-semibold tabular-nums text-[#2f4049]">
                {formatMoney(bank.balance)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

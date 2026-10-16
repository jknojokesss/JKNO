import { useEffect, useMemo, useState } from 'react'
import { OPS_SAMPLE } from '../../data/ops-center-sample'
import { formatMoney, NAVY_GRADIENT, GOLD_ON_NAVY, useRefreshSpin } from './utils'
import { IconRefresh } from './icons'

export default function BankBalances({ onTotalChange }) {
  const [balances, setBalances] = useState(() => OPS_SAMPLE.banks.map((b) => b.balance))
  const [spinning, setSpinning] = useState(false)
  const [saving, setSaving] = useState(false)
  const refresh = useRefreshSpin(setSpinning)

  const total = useMemo(() => balances.reduce((s, v) => s + (Number(v) || 0), 0), [balances])

  useEffect(() => {
    if (onTotalChange) onTotalChange(total)
  }, [total, onTotalChange])

  const handleReload = () => {
    refresh()
    setBalances(OPS_SAMPLE.banks.map((b) => b.balance))
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    window.setTimeout(() => setSaving(false), 400)
  }

  return (
    <section className="ops-card mt-6 overflow-hidden">
      <div className="ops-navy-hd" style={{ background: NAVY_GRADIENT }}>
        <div className="flex flex-wrap items-end justify-between gap-4 px-4 py-4 sm:px-5">
          <div>
            <p className="ops-eyebrow-navy">CASH ON HAND</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <h2 className="ops-heading text-2xl text-white sm:text-3xl">Bank balances</h2>
              <button type="button" className="ops-text-btn text-white/80" onClick={handleReload}>
                <IconRefresh spinning={spinning} />
                Reload
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="ops-eyebrow-navy">TOTAL CASH</p>
            <p className="ops-heading mt-1 text-3xl tabular-nums text-[#e8c97a] sm:text-4xl" style={{ color: GOLD_ON_NAVY }}>
              {formatMoney(total)}
            </p>
          </div>
        </div>
      </div>
      <form className="border-t border-[#c5d0d6]/40 bg-[#e8eef1]/20 px-4 py-4 sm:px-5" onSubmit={handleSave}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {OPS_SAMPLE.banks.map((bank, i) => (
            <label key={bank.name} className="block">
              <span className="mb-1 block text-xs font-semibold text-[#5c7280]">{bank.name}</span>
              <input
                type="number"
                step="0.01"
                className="ops-input w-full tabular-nums"
                value={balances[i]}
                onChange={(e) => {
                  const next = [...balances]
                  next[i] = parseFloat(e.target.value) || 0
                  setBalances(next)
                }}
              />
            </label>
          ))}
        </div>
        <button type="submit" className="ops-btn-primary mt-4" disabled={saving}>
          {saving ? 'Saving…' : 'Save balances'}
        </button>
      </form>
    </section>
  )
}

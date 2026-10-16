import { fmtDueDisplay, fmtShortDate, payableMeta, payableTooltip, formatMoney, dueTheme, NOT_IN_QB } from './utils'

export function PayableMeta({ row }) {
  const meta = payableMeta(row)
  const notInQb = !row.inQb
  if (!notInQb) {
    return <p className="mt-0.5 text-[10px] leading-snug text-[#5c7280]">{meta}</p>
  }
  const base = meta.replace(' · NOT IN QB', '')
  return (
    <p className="mt-0.5 text-[10px] leading-snug text-[#5c7280]">
      {base}
      {base ? ' · ' : ''}
      <span className="font-semibold tracking-wide" style={{ color: NOT_IN_QB }}>NOT IN QB</span>
    </p>
  )
}

export function VendorCell({ row }) {
  return (
    <td className="ops-td align-top" title={payableTooltip(row)}>
      <div className="ops-heading text-xs font-semibold leading-snug text-[#2f4049] sm:text-sm">{row.vendor || '—'}</div>
      <PayableMeta row={row} />
    </td>
  )
}

export function DueCell({ row }) {
  const same = !row.bankDate || row.bankDate === row.due
  return (
    <td className="ops-td align-top tabular-nums">
      <div className="text-xs font-medium text-[#2f4049]">{fmtDueDisplay(row.due)}</div>
      {!same && row.bankDate ? (
        <div className="text-[10px] text-[#5c7280]">Bank {fmtShortDate(row.bankDate)}</div>
      ) : null}
    </td>
  )
}

export function MoneyCell({ value, strong }) {
  return (
    <td className={`ops-td text-right tabular-nums ${strong ? 'ops-heading font-semibold' : ''}`}>
      {formatMoney(value)}
    </td>
  )
}

export function PayableRow({ row, showDue = true, index }) {
  const theme = dueTheme(row.due)
  return (
    <tr
      key={`${row.vendor}-${row.due}-${index}`}
      style={{ background: theme.rowBg, borderLeft: `4px solid ${theme.stripe}` }}
    >
      <VendorCell row={row} />
      <MoneyCell value={row.bill} />
      <MoneyCell value={row.fees} />
      {showDue ? <DueCell row={row} /> : null}
      <MoneyCell value={row.total} strong />
    </tr>
  )
}

export function CompactPayableRow({ row, index }) {
  const theme = dueTheme(row.due)
  return (
    <div
      key={`c-${index}`}
      className="flex items-start justify-between gap-2 border-b border-[#c5d0d6]/30 py-2 last:border-0"
      style={{ borderLeft: `3px solid ${theme.stripe}`, paddingLeft: 8 }}
    >
      <div className="min-w-0 flex-1">
        <div className="ops-heading text-xs font-semibold text-[#2f4049]">{row.vendor}</div>
        <PayableMeta row={row} />
      </div>
      <div className="shrink-0 text-xs font-medium tabular-nums">{formatMoney(row.total)}</div>
    </div>
  )
}

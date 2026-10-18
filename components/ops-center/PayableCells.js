import {
  fmtDueDisplay,
  fmtDueCompact,
  payableMeta,
  payableTooltip,
  formatMoney,
  dueTheme,
} from './utils'

export function PayableMeta({ row, showDueInline }) {
  const meta = payableMeta(row)
  return (
    <p className="mt-0.5 text-[10px] leading-snug text-[#5c7280]">
      {showDueInline && row.due ? (
        <span className="font-medium text-[#2f4049]/80 sm:hidden">Due {fmtDueCompact(row.due)} · </span>
      ) : null}
      {meta}
    </p>
  )
}

export function VendorCell({ row, showDueInline }) {
  return (
    <td className="ops-td ops-vendor-col align-top" title={payableTooltip(row)}>
      <div className="ops-heading break-words text-xs font-semibold leading-snug text-[#2f4049] sm:text-sm">
        {row.vendor || '—'}
      </div>
      <PayableMeta row={row} showDueInline={showDueInline} />
    </td>
  )
}

export function DueCell({ row }) {
  return (
    <td className="ops-td ops-due-col hidden align-top tabular-nums sm:table-cell">
      <div className="text-xs font-medium text-[#2f4049]">{fmtDueDisplay(row.due)}</div>
    </td>
  )
}

export function MoneyCell({ value, strong }) {
  return (
    <td
      className={`ops-td ops-amount-col text-right tabular-nums whitespace-nowrap ${strong ? 'ops-heading font-semibold' : ''}`}
    >
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
      <VendorCell row={row} showDueInline={showDue} />
      {showDue ? <DueCell row={row} /> : null}
      <MoneyCell value={row.amount} strong />
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
        <div className="ops-heading break-words text-xs font-semibold text-[#2f4049]">{row.vendor}</div>
        <PayableMeta row={row} showDueInline={false} />
      </div>
      <div className="shrink-0 text-xs font-medium tabular-nums whitespace-nowrap">{formatMoney(row.amount)}</div>
    </div>
  )
}

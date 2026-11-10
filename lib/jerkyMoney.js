/** Jerky Munch USD display: `$0` for zero, otherwise always two decimals (`$1,207.50`). */
export function formatJerkyMoney(n) {
  const v = Math.round(Number(n) * 100) / 100
  if (!Number.isFinite(v) || Math.abs(v) < 1e-9) return '$0'
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

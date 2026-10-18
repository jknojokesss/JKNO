/**
 * Largest-remainder allocation for whole-dollar UI rows that must sum to a rounded total.
 * Underlying cent values stay untouched; only display integers are adjusted.
 */

export function wholeDollarTotal(preciseTotal) {
  return Math.round(preciseTotal)
}

/** @param {number[]} preciseParts @param {number|null} preciseTotal */
export function allocateWholeDollars(preciseParts, preciseTotal = null) {
  const parts = preciseParts.map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0))
  const target =
    preciseTotal != null && Number.isFinite(preciseTotal)
      ? Math.round(preciseTotal)
      : Math.round(parts.reduce((s, v) => s + v, 0))
  const floors = parts.map((v) => Math.floor(v))
  let rem = target - floors.reduce((s, v) => s + v, 0)
  const order = parts
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => (rem > 0 ? b.frac - a.frac : a.frac - b.frac) || a.i - b.i)
  const out = [...floors]
  const steps = Math.abs(rem)
  for (let k = 0; k < steps; k++) {
    out[order[k % order.length].i] += rem > 0 ? 1 : -1
  }
  return out
}

export function sumAllocatedWholeDollars(preciseParts, preciseTotal = null) {
  return allocateWholeDollars(preciseParts, preciseTotal).reduce((s, n) => s + n, 0)
}

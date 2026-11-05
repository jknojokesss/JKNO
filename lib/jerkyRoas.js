/** ROAS helpers — avoid NaN/Infinity when ad spend is zero. */
export const roasMultiplier = (spend, rev) => {
  const s = Number(spend) || 0
  const r = Number(rev) || 0
  if (!(s > 0)) return null
  return r / s
}

export const roasLabel = (spend, rev) => {
  const m = roasMultiplier(spend, rev)
  if (m == null) return 'enter spend to see return'
  return `${m.toFixed(1)}x overall`
}

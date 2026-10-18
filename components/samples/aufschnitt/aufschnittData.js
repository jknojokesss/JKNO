import {
  AS_OF,
  BUILT_BY,
  BIZ_NAME,
  BRANDS,
  CHANNELS,
  MONTHS,
  COGS_LINES,
  OPEX_LINES,
  SHARED_OPEX,
  PRODUCT_DEFS,
  STORE_ACCOUNTS,
  STOCK_LOCATIONS,
} from './aufschnittCatalog.js'
import { allocateByWeight, roundCents, sumCents } from './aufschnittUtils.js'

const MONTH_TOTAL = {
  '2026-04': 198_432.17,
  '2026-05': 207_891.44,
  '2026-06': 201_118.76,
  '2026-07': 228_104.33,
  '2026-08': 221_387.62,
  '2026-09': 236_148.91,
}

/** September brand revenue (≈55 / 30 / 15 %) */
const BRAND_SEP = {
  Aufschnitt: 129_881.9,
  "Abraham's": 70_844.67,
  Essiccata: 35_422.34,
}

const BRAND_AUG_GROWTH = { Aufschnitt: 1.098, "Abraham's": 1.041, Essiccata: 0.968 }

const CHANNEL_SHARE = {
  Aufschnitt: { Stores: 0.62, Amazon: 0.26, 'Own site': 0.12 },
  "Abraham's": { Stores: 0.6, Amazon: 0.25, 'Own site': 0.15 },
  Essiccata: { Stores: 0.4, Amazon: 0.45, 'Own site': 0.15 },
}

/** Combined channel mix shifts slightly month to month (Aug own site higher → Sep down) */
const COMBINED_CH_TILT = {
  '2026-04': { Stores: 0.57, Amazon: 0.285, 'Own site': 0.145 },
  '2026-05': { Stores: 0.575, Amazon: 0.288, 'Own site': 0.137 },
  '2026-06': { Stores: 0.56, Amazon: 0.292, 'Own site': 0.148 },
  '2026-07': { Stores: 0.582, Amazon: 0.29, 'Own site': 0.128 },
  '2026-08': { Stores: 0.566, Amazon: 0.284, 'Own site': 0.15 },
  '2026-09': { Stores: 0.58, Amazon: 0.29, 'Own site': 0.13 },
}

const COGS_BASE_SPLIT = {
  'Meat and fish': 0.548,
  Packaging: 0.162,
  'Co-packing': 0.118,
  'Kosher supervision': 0.092,
  'Inbound freight': 0.08,
}

/** Line mix vs prior month — Sep vs Aug: meat up, packaging & freight down, co-pack flat */
const COGS_LINE_TILT = {
  '2026-09': { 'Meat and fish': 1.034, Packaging: 0.972, 'Co-packing': 1.002, 'Kosher supervision': 1.008, 'Inbound freight': 0.961 },
  '2026-08': { 'Meat and fish': 0.991, Packaging: 1.014, 'Co-packing': 0.998, 'Kosher supervision': 1.0, 'Inbound freight': 1.012 },
  '2026-07': { 'Meat and fish': 1.018, Packaging: 0.988, 'Co-packing': 1.005, 'Kosher supervision': 1.002, 'Inbound freight': 0.995 },
  '2026-06': { 'Meat and fish': 1.022, Packaging: 1.006, 'Co-packing': 0.994, 'Kosher supervision': 1.001, 'Inbound freight': 1.008 },
  '2026-05': { 'Meat and fish': 0.996, Packaging: 1.01, 'Co-packing': 1.001, 'Kosher supervision': 0.999, 'Inbound freight': 1.003 },
  '2026-04': { 'Meat and fish': 1.0, Packaging: 1.0, 'Co-packing': 1.0, 'Kosher supervision': 1.0, 'Inbound freight': 1.0 },
}

const COGS_RATE = {
  Aufschnitt: { '2026-04': 0.594, '2026-05': 0.601, '2026-06': 0.608, '2026-07': 0.596, '2026-08': 0.599, '2026-09': 0.603 },
  "Abraham's": { '2026-04': 0.612, '2026-05': 0.618, '2026-06': 0.621, '2026-07': 0.609, '2026-08': 0.614, '2026-09': 0.617 },
  Essiccata: { '2026-04': 0.578, '2026-05': 0.584, '2026-06': 0.592, '2026-07': 0.586, '2026-08': 0.588, '2026-09': 0.624 },
}

const OPEX_RATE = {
  amazonFee: { '2026-04': 0.302, '2026-05': 0.308, '2026-06': 0.312, '2026-07': 0.315, '2026-08': 0.318, '2026-09': 0.321 },
  storePromo: { '2026-04': 0.038, '2026-05': 0.039, '2026-06': 0.041, '2026-07': 0.04, '2026-08': 0.042, '2026-09': 0.043 },
  shipping: { '2026-04': 0.132, '2026-05': 0.138, '2026-06': 0.145, '2026-07': 0.141, '2026-08': 0.148, '2026-09': 0.136 },
  cardProc: 0.03,
}

const ESSICCATA_SEP_NET = -612.4

const PRODUCT_CFG = {
  'auf-01': { unitPrice: 4.49, unitsPerCase: 12, costPerCase: 54.6, saleWeight: 24, weeks: 5.2, fbaShare: 0.26, ownSiteCaseShare: 0.34 },
  'auf-02': { unitPrice: 4.59, unitsPerCase: 12, costPerCase: 55.1, saleWeight: 21, weeks: 4.8, fbaShare: 0.24, ownSiteCaseShare: 0.32 },
  'auf-03': { unitPrice: 4.59, unitsPerCase: 12, costPerCase: 55.4, saleWeight: 19, weeks: 2.2, fbaShare: 0.25, ownSiteCaseShare: 0.3 },
  'auf-04': { unitPrice: 4.69, unitsPerCase: 12, costPerCase: 56.2, saleWeight: 17, weeks: 5.0, fbaShare: 0.27, ownSiteCaseShare: 0.28 },
  'auf-05': { unitPrice: 9.89, unitsPerCase: 12, costPerCase: 88.4, saleWeight: 4, weeks: 11.4, fbaShare: 0.22, ownSiteCaseShare: 0.42 },
  'auf-06': { unitPrice: 4.39, unitsPerCase: 12, costPerCase: 52.8, saleWeight: 11, weeks: 6.1, fbaShare: 0.23, ownSiteCaseShare: 0.36 },
  'auf-07': { unitPrice: 4.49, unitsPerCase: 12, costPerCase: 53.5, saleWeight: 10, weeks: 5.8, fbaShare: 0.24, ownSiteCaseShare: 0.33 },
  'auf-08': { unitPrice: 5.29, unitsPerCase: 10, costPerCase: 48.2, saleWeight: 9, weeks: 6.4, fbaShare: 0.29, ownSiteCaseShare: 0.38 },
  'auf-09': { unitPrice: 5.39, unitsPerCase: 10, costPerCase: 49.1, saleWeight: 8, weeks: 6.0, fbaShare: 0.28, ownSiteCaseShare: 0.35 },
  'auf-10': { unitPrice: 3.89, unitsPerCase: 24, costPerCase: 62.3, saleWeight: 22, weeks: 7.2, fbaShare: 0.3, ownSiteCaseShare: 0.26 },
  'abr-01': { unitPrice: 5.79, unitsPerCase: 12, costPerCase: 58.4, saleWeight: 16, weeks: 5.5, fbaShare: 0.32, ownSiteCaseShare: 0.3 },
  'abr-02': { unitPrice: 5.89, unitsPerCase: 12, costPerCase: 59.1, saleWeight: 12, weeks: 6.2, fbaShare: 0.31, ownSiteCaseShare: 0.28 },
  'abr-03': { unitPrice: 5.89, unitsPerCase: 12, costPerCase: 59.6, saleWeight: 10, weeks: 6.8, fbaShare: 0.33, ownSiteCaseShare: 0.27 },
  'abr-04': { unitPrice: 11.49, unitsPerCase: 12, costPerCase: 96.2, saleWeight: 5, weeks: 10.2, fbaShare: 0.35, ownSiteCaseShare: 0.44 },
  'abr-05': { unitPrice: 4.99, unitsPerCase: 10, costPerCase: 44.8, saleWeight: 13, weeks: 5.9, fbaShare: 0.34, ownSiteCaseShare: 0.32 },
  'abr-06': { unitPrice: 4.99, unitsPerCase: 10, costPerCase: 45.2, saleWeight: 13, weeks: 6.5, fbaShare: 0.33, ownSiteCaseShare: 0.31 },
  'abr-07': { unitPrice: 5.19, unitsPerCase: 10, costPerCase: 47.6, saleWeight: 12, weeks: 7.0, fbaShare: 0.36, ownSiteCaseShare: 0.29 },
  'abr-08': { unitPrice: 3.29, unitsPerCase: 24, costPerCase: 51.7, saleWeight: 14, weeks: 8.4, fbaShare: 0.37, ownSiteCaseShare: 0.22 },
  'ess-01': { unitPrice: 6.49, unitsPerCase: 12, costPerCase: 72.8, saleWeight: 10, weeks: 4.2, fbaShare: 0.58, ownSiteCaseShare: 0.4 },
  'ess-02': { unitPrice: 6.59, unitsPerCase: 12, costPerCase: 74.1, saleWeight: 10, weeks: 4.9, fbaShare: 0.56, ownSiteCaseShare: 0.38 },
  'ess-03': { unitPrice: 6.59, unitsPerCase: 12, costPerCase: 73.5, saleWeight: 10, weeks: 5.3, fbaShare: 0.55, ownSiteCaseShare: 0.36 },
  'ess-04': { unitPrice: 4.29, unitsPerCase: 24, costPerCase: 68.4, saleWeight: 10, weeks: 6.6, fbaShare: 0.62, ownSiteCaseShare: 0.34 },
  'ess-05': { unitPrice: 4.29, unitsPerCase: 24, costPerCase: 67.9, saleWeight: 10, weeks: 7.4, fbaShare: 0.6, ownSiteCaseShare: 0.33 },
  'ess-06': { unitPrice: 7.89, unitsPerCase: 12, costPerCase: 81.2, saleWeight: 10, weeks: 11.8, fbaShare: 0.52, ownSiteCaseShare: 0.45 },
}

const PRODUCT_META = {}
PRODUCT_DEFS.forEach((p) => {
  const c = PRODUCT_CFG[p.id]
  PRODUCT_META[p.id] = {
    unitPrice: c.unitPrice,
    velocity: c.saleWeight,
    ownSiteCaseShare: c.ownSiteCaseShare,
    costPerCase: c.costPerCase,
    unitsPerCase: c.unitsPerCase,
    weeksTarget: c.weeks,
    fbaShare: c.fbaShare,
  }
})

const WEEKLY_CASE_PATTERN = [0.82, 1.12, 0.91, 1.08, 0.86, 1.15, 0.94, 1.02]

/** Week-ending Saturdays for the 8 weeks before Sep 30, 2026 (oldest first). */
const STOCK_WEEK_ENDINGS = [
  '2026-08-08',
  '2026-08-15',
  '2026-08-22',
  '2026-08-29',
  '2026-09-05',
  '2026-09-12',
  '2026-09-19',
  '2026-09-26',
]

/** Relative store size for Stores channel splits (largest distributors / Lakewood). */
const STORE_SALES_WEIGHT = {
  'Pomegranate - Flatbush': 0.92,
  "Moisha's - Brooklyn": 0.88,
  'Breadberry - Brooklyn': 0.9,
  'KRM - Brooklyn': 0.86,
  'Rockland Kosher Supermarket': 0.94,
  'Shoprite Wesley Hills': 0.91,
  'Gourmet Glatt - Lakewood': 1.28,
  'Evergreen - Lakewood': 1.22,
  'Gourmet Glatt - Cedarhurst': 0.84,
  "Brach's - Lawrence": 0.68,
  'Cedar Market - Teaneck': 1.02,
  'Salt Market - Deal': 0.82,
  'Supersol - Lawrence': 0.87,
  'Evergreen - Monsey': 1.06,
  'Seven Mile Market - Baltimore': 1.08,
  'Market Maven - Baltimore': 0.85,
  "Aron's Kissena Farms - Queens": 0.66,
  'Bingo Wholesale': 1.32,
}

/** Share of Stores revenue for the three largest accounts (each under 12% at Sep scale). */
const TOP_STORE_SHARE = {
  'Gourmet Glatt - Lakewood': 0.11608,
  'Evergreen - Lakewood': 0.09997,
  'Bingo Wholesale': 0.11971,
}
const TOP_STORE_NAMES = ['Gourmet Glatt - Lakewood', 'Evergreen - Lakewood', 'Bingo Wholesale']

function roundCases(n) {
  const t = Math.round(n * 10) / 10
  return Math.abs(t - Math.round(t)) < 0.05 ? Math.round(t) : t
}

function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function buildBrandMonthTargets() {
  const augRaw = {}
  BRANDS.forEach((b) => {
    augRaw[b] = roundCents(BRAND_SEP[b] / BRAND_AUG_GROWTH[b])
  })
  const augSum = sumCents(Object.values(augRaw))
  const augScale = MONTH_TOTAL['2026-08'] / augSum
  const brandAug = {}
  BRANDS.forEach((b) => {
    brandAug[b] = roundCents(augRaw[b] * augScale)
  })
  let fix = roundCents(MONTH_TOTAL['2026-08'] - sumCents(Object.values(brandAug)))
  if (fix) brandAug.Aufschnitt = roundCents(brandAug.Aufschnitt + fix)

  const out = {
    '2026-08': brandAug,
    '2026-09': { ...BRAND_SEP },
  }

  const monthIds = MONTHS.map((m) => m.id)
  const iAug = monthIds.indexOf('2026-08')
  const iSep = monthIds.indexOf('2026-09')
  for (let i = 0; i < iAug; i++) {
    const id = monthIds[i]
    const t = MONTH_TOTAL[id]
    const wobble = { Aufschnitt: 0.54 + (i % 3) * 0.02, "Abraham's": 0.3 - (i % 2) * 0.01, Essiccata: 0.16 }
    const alloc = allocateByWeight(t, wobble)
    out[id] = alloc
  }
  for (let i = iSep + 1; i < monthIds.length; i++) {
    out[monthIds[i]] = out['2026-09']
  }
  const iJun = monthIds.indexOf('2026-06')
  if (out[monthIds[iJun]]) {
    out[monthIds[iJun]].Essiccata = roundCents(out[monthIds[iJun]].Essiccata * 0.94)
    out[monthIds[iJun]].Aufschnitt = roundCents(out[monthIds[iJun]].Aufschnitt * 1.012)
    const t = MONTH_TOTAL['2026-06']
    const s = sumCents(Object.values(out[monthIds[iJun]]))
    out[monthIds[iJun]].Aufschnitt = roundCents(out[monthIds[iJun]].Aufschnitt + (t - s))
  }
  return out
}

const BRAND_MONTH = buildBrandMonthTargets()

/** Product Sep vs Aug revenue multiplier (several down) */
function productMoM(productId, monthId) {
  if (monthId === '2026-09') {
    const h = hash(productId) % 10
    if (h === 0) return 0.962
    if (h === 1) return 0.978
    if (h === 2) return 0.988
    if (h >= 7) return 1.028
    return 1.004 + (h % 4) * 0.005
  }
  if (monthId === '2026-08') return 1
  const mi = MONTHS.findIndex((m) => m.id === monthId)
  return 0.94 + (hash(`${productId}-${monthId}`) % 13) / 100
}

function channelTargets(monthId, brand, brandRev) {
  const base = CHANNEL_SHARE[brand]
  const tilt = COMBINED_CH_TILT[monthId]
  const blended = {}
  CHANNELS.forEach((ch) => {
    blended[ch] = base[ch] * 0.72 + tilt[ch] * 0.28
  })
  const s = CHANNELS.reduce((a, ch) => a + blended[ch], 0)
  CHANNELS.forEach((ch) => {
    blended[ch] /= s
  })
  const alloc = allocateByWeight(brandRev, blended)
  return alloc
}

function enforceBrandProductCap(rows, maxShare = 0.18) {
  MONTHS.forEach((m) => {
    BRANDS.forEach((brand) => {
      const products = PRODUCT_DEFS.filter((p) => p.brand === brand)
      const brandRev = sumCents(
        rows.filter((r) => r.month === m.id && r.brand === brand),
        (r) => r.revenue
      )
      if (brandRev <= 0) return
      const cap = roundCents(brandRev * maxShare)
      for (let pass = 0; pass < 24; pass++) {
        const totals = {}
        products.forEach((p) => {
          totals[p.id] = sumCents(
            rows.filter((r) => r.month === m.id && r.brand === brand && r.productId === p.id),
            (r) => r.revenue
          )
        })
        const over = products.find((p) => totals[p.id] > cap + 0.004)
        if (!over) break
        const pid = over.id
        const excess = roundCents(totals[pid] - cap)
        const pidTotal = totals[pid]
        CHANNELS.forEach((ch) => {
          const chRows = rows.filter(
            (r) => r.month === m.id && r.brand === brand && r.channel === ch && r.productId === pid
          )
          const chPidRev = sumCents(chRows, (r) => r.revenue)
          if (chPidRev <= 0) return
          const chExcess = roundCents((excess * chPidRev) / pidTotal)
          chRows.forEach((r) => {
            const cut = roundCents((chExcess * r.revenue) / chPidRev)
            r.revenue = roundCents(r.revenue - cut)
            r.units = Math.max(1, Math.round(r.revenue / PRODUCT_META[r.productId].unitPrice))
          })
          const recipients = products.filter((p) => p.id !== pid)
          const weights = {}
          recipients.forEach((p) => {
            weights[p.id] = PRODUCT_META[p.id].velocity
          })
          const split = allocateByWeight(chExcess, weights)
          recipients.forEach((p) => {
            const add = split[p.id] || 0
            if (add <= 0) return
            let row = rows.find(
              (r) => r.month === m.id && r.brand === brand && r.channel === ch && r.productId === p.id
            )
            if (!row) {
              row = { month: m.id, productId: p.id, brand, channel: ch, units: 0, revenue: 0 }
              rows.push(row)
            }
            row.revenue = roundCents(row.revenue + add)
            row.units = Math.max(1, Math.round(row.revenue / PRODUCT_META[p.id].unitPrice))
          })
        })
      }
    })
  })
}

function shiftChannelRevenue(rows, monthId, shifts) {
  CHANNELS.forEach((ch) => {
    const delta = shifts[ch] || 0
    if (!delta) return
    const chRows = rows.filter((r) => r.month === monthId && r.channel === ch)
    const total = sumCents(chRows, (r) => r.revenue)
    if (total <= 0) return
    if (delta > 0) {
      chRows.forEach((r) => {
        r.revenue = roundCents(r.revenue + (delta * r.revenue) / total)
      })
    } else {
      chRows.forEach((r) => {
        r.revenue = roundCents(r.revenue + (delta * r.revenue) / total)
      })
    }
    const got = sumCents(chRows, (r) => r.revenue)
    const fix = roundCents(total + delta - got)
    if (fix && chRows[0]) chRows[0].revenue = roundCents(chRows[0].revenue + fix)
  })
}

function buildSalesRows() {
  const rows = []
  MONTHS.forEach((m) => {
    BRANDS.forEach((brand) => {
      const brandRev = BRAND_MONTH[m.id][brand]
      const chTargets = channelTargets(m.id, brand, brandRev)
      CHANNELS.forEach((ch) => {
        const chRev = chTargets[ch]
        const products = PRODUCT_DEFS.filter((p) => p.brand === brand)
        const weights = {}
        products.forEach((p) => {
          weights[p.id] = PRODUCT_META[p.id].velocity * productMoM(p.id, m.id)
        })
        const split = allocateByWeight(chRev, weights)
        products.forEach((p) => {
          const revenue = split[p.id] || 0
          if (revenue <= 0) return
          const units = Math.max(1, Math.round(revenue / PRODUCT_META[p.id].unitPrice))
          rows.push({
            month: m.id,
            productId: p.id,
            brand,
            channel: ch,
            units,
            revenue,
          })
        })
      })
    })
    const got = sumCents(rows.filter((r) => r.month === m.id), (r) => r.revenue)
    const diff = roundCents(MONTH_TOTAL[m.id] - got)
    if (diff) {
      const top = rows.filter((r) => r.month === m.id).sort((a, b) => b.revenue - a.revenue)[0]
      if (top) top.revenue = roundCents(top.revenue + diff)
    }
  })
  shiftChannelRevenue(rows, '2026-08', {
    Stores: -4_726.18,
    Amazon: 3_134.62,
    'Own site': 1_591.56,
  })
  dedupeChannelProductRevenues(rows)
  return rows
}

/** Nudge duplicate product revenues within the same month × brand × channel (totals unchanged). */
function dedupeChannelProductRevenues(rows) {
  const groups = new Map()
  rows.forEach((r) => {
    const k = `${r.month}|${r.brand}|${r.channel}`
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(r)
  })
  groups.forEach((grp) => {
    const target = sumCents(grp, (r) => r.revenue)
    const byVal = new Map()
    grp.forEach((r) => {
      const key = r.revenue.toFixed(2)
      if (!byVal.has(key)) byVal.set(key, [])
      byVal.get(key).push(r)
    })
    byVal.forEach((dupes) => {
      if (dupes.length < 2) return
      dupes.forEach((r, i) => {
        const nudge = roundCents((i - (dupes.length - 1) / 2) * 0.19 + ((hash(r.productId) % 5) - 2) * 0.03)
        if (nudge) r.revenue = roundCents(Math.max(0.01, r.revenue + nudge))
      })
    })
    let fix = roundCents(target - sumCents(grp, (r) => r.revenue))
    if (fix) {
      const anchor = [...grp].sort((a, b) => b.revenue - a.revenue)[0]
      if (anchor) anchor.revenue = roundCents(anchor.revenue + fix)
    }
  })
  MONTHS.forEach((m) => {
    const got = sumCents(rows.filter((r) => r.month === m.id), (r) => r.revenue)
    const diff = roundCents(MONTH_TOTAL[m.id] - got)
    if (diff) {
      const top = rows.filter((r) => r.month === m.id).sort((a, b) => b.revenue - a.revenue)[0]
      if (top) top.revenue = roundCents(top.revenue + diff)
    }
  })
}

function brandFilter(brand, row) {
  if (!brand || brand === 'All brands') return true
  return row.brand === brand
}

function sumSales(rows, opts = {}) {
  return sumCents(
    rows.filter(
      (r) =>
        (!opts.month || r.month === opts.month) &&
        (!opts.channel || r.channel === opts.channel) &&
        (!opts.productId || r.productId === opts.productId) &&
        brandFilter(opts.brand, r)
    ),
    (r) => r.revenue
  )
}

function sumUnits(rows, opts = {}) {
  return rows
    .filter(
      (r) =>
        (!opts.month || r.month === opts.month) &&
        (!opts.channel || r.channel === opts.channel) &&
        (!opts.productId || r.productId === opts.productId) &&
        brandFilter(opts.brand, r)
    )
    .reduce((s, r) => s + r.units, 0)
}

const SHARED_OPEX_MONTHLY = {
  '2026-04': { Payroll: 28_437.18, 'Warehouse rent': 6_200, Insurance: 1_847.33, Software: 892.41, Other: 1_104.27 },
  '2026-05': { Payroll: 28_437.18, 'Warehouse rent': 6_200, Insurance: 1_847.33, Software: 912.18, Other: 1_218.44 },
  '2026-06': { Payroll: 29_103.42, 'Warehouse rent': 6_200, Insurance: 1_891.05, Software: 912.18, Other: 1_156.88 },
  '2026-07': { Payroll: 29_103.42, 'Warehouse rent': 6_200, Insurance: 1_891.05, Software: 934.62, Other: 1_289.71 },
  '2026-08': { Payroll: 29_682.15, 'Warehouse rent': 6_350, Insurance: 1_934.88, Software: 934.62, Other: 1_342.19 },
  '2026-09': { Payroll: 30_148.73, 'Warehouse rent': 6_350, Insurance: 1_934.88, Software: 956.14, Other: 1_407.82 },
}

function buildBrandPnl(salesRows, monthId, brand) {
  const rev = {}
  CHANNELS.forEach((ch) => {
    rev[ch] = sumSales(salesRows, { month: monthId, brand, channel: ch })
  })
  const revenueTotal = sumCents(Object.values(rev))

  const rate = COGS_RATE[brand][monthId]
  const cogsTotal = roundCents(revenueTotal * rate)
  const tilt = COGS_LINE_TILT[monthId] || COGS_LINE_TILT['2026-04']
  const raw = COGS_LINES.map((l) => ({ l, w: COGS_BASE_SPLIT[l] * (tilt[l] || 1) }))
  const wSum = raw.reduce((s, x) => s + x.w, 0)
  let cogs_entries = raw.map((x) => ({ l: x.l, n: roundCents((cogsTotal * x.w) / wSum) }))
  let cogsFix = roundCents(cogsTotal - sumCents(cogs_entries, (e) => e.n))
  if (cogsFix) cogs_entries[0].n = roundCents(cogs_entries[0].n + cogsFix)

  const amazonFees = roundCents(rev.Amazon * OPEX_RATE.amazonFee[monthId])
  const storePromos = roundCents(rev.Stores * OPEX_RATE.storePromo[monthId])
  const shipping = roundCents(rev['Own site'] * OPEX_RATE.shipping[monthId])
  const cardProc = roundCents(rev['Own site'] * OPEX_RATE.cardProc)

  const shared = SHARED_OPEX_MONTHLY[monthId]
  const allBrandRev = {}
  BRANDS.forEach((b) => {
    allBrandRev[b] = sumSales(salesRows, { month: monthId, brand: b })
  })
  const allocatedShared = {}
  SHARED_OPEX.forEach((line) => {
    const split = allocateByWeight(shared[line], allBrandRev)
    allocatedShared[line] = split[brand] || 0
  })

  let operating_expenses_entries = [
    { l: 'Amazon fees', n: amazonFees },
    { l: 'Store promos and credits', n: storePromos },
    { l: 'Shipping to customers', n: shipping },
    { l: 'Card processing', n: cardProc },
    ...SHARED_OPEX.map((l) => ({ l, n: allocatedShared[l] })),
  ]
  let operating_expenses_total = sumCents(operating_expenses_entries, (e) => e.n)
  let gross_profit = roundCents(revenueTotal - cogsTotal)
  let net_profit = roundCents(gross_profit - operating_expenses_total)

  if (brand === 'Essiccata' && monthId === '2026-09') {
    const adj = roundCents(net_profit - ESSICCATA_SEP_NET)
    if (adj !== 0) {
      cogs_entries = cogs_entries.map((e, i) =>
        i === 0 ? { ...e, n: roundCents(e.n + adj) } : e
      )
      const cogs = sumCents(cogs_entries, (e) => e.n)
      gross_profit = roundCents(revenueTotal - cogs)
      net_profit = roundCents(gross_profit - operating_expenses_total)
      return {
        month: monthId,
        brand,
        revenue: rev,
        revenue_total: revenueTotal,
        cogs_entries,
        cogs,
        gross_profit,
        operating_expenses_entries,
        operating_expenses_total,
        net_profit,
      }
    }
  }

  return {
    month: monthId,
    brand,
    revenue: rev,
    revenue_total: revenueTotal,
    cogs_entries,
    cogs: cogsTotal,
    gross_profit,
    operating_expenses_entries,
    operating_expenses_total,
    net_profit,
  }
}

function buildCombinedPnl(salesRows, monthId) {
  const byBrand = BRANDS.map((b) => buildBrandPnl(salesRows, monthId, b))
  const revenue = {}
  CHANNELS.forEach((ch) => {
    revenue[ch] = sumSales(salesRows, { month: monthId, channel: ch })
  })
  const revenue_total = sumCents(Object.values(revenue))

  const cogs_entries = COGS_LINES.map((l) => ({
    l,
    n: sumCents(byBrand, (b) => b.cogs_entries.find((e) => e.l === l).n),
  }))
  const cogs = sumCents(cogs_entries, (e) => e.n)

  const operating_expenses_entries = OPEX_LINES.map((l) => {
    if (SHARED_OPEX.includes(l)) return { l, n: SHARED_OPEX_MONTHLY[monthId][l] }
    return { l, n: sumCents(byBrand, (b) => b.operating_expenses_entries.find((e) => e.l === l).n) }
  })
  const operating_expenses_total = sumCents(operating_expenses_entries, (e) => e.n)
  const gross_profit = roundCents(revenue_total - cogs)
  const net_profit = roundCents(gross_profit - operating_expenses_total)

  return {
    month: monthId,
    brand: 'All brands',
    revenue,
    revenue_total,
    cogs_entries,
    cogs,
    gross_profit,
    operating_expenses_entries,
    operating_expenses_total,
    net_profit,
    byBrand,
  }
}

function buildPnlDrills(salesRows, pnl, brandKey) {
  const drills = {}
  CHANNELS.forEach((ch) => {
    const key = `rev_${ch}`
    drills[key] = PRODUCT_DEFS
      .filter((p) => brandFilter(brandKey, p))
      .map((p) => ({
        description: p.name,
        date: p.brand,
        amount: sumSales(salesRows, { month: pnl.month, brand: p.brand, channel: ch, productId: p.id }),
      }))
      .filter((r) => r.amount !== 0)
  })

  COGS_LINES.forEach((line) => {
    const key = `cogs_${line}`
    drills[key] = MONTHS.map((m) => {
      const slice = brandKey === 'All brands' ? buildCombinedPnl(salesRows, m.id) : buildBrandPnl(salesRows, m.id, brandKey)
      const amt = slice.cogs_entries.find((e) => e.l === line).n
      return { description: m.period, date: m.id, amount: amt }
    })
    if (brandKey === 'All brands') {
      drills[`${key}_brands`] = BRANDS.map((b) => ({
        description: b,
        date: pnl.month,
        amount: buildBrandPnl(salesRows, pnl.month, b).cogs_entries.find((e) => e.l === line).n,
      }))
    }
  })

  OPEX_LINES.forEach((line) => {
    const key = `opex_${line}`
    drills[key] = MONTHS.map((m) => {
      const slice = brandKey === 'All brands' ? buildCombinedPnl(salesRows, m.id) : buildBrandPnl(salesRows, m.id, brandKey)
      const amt = slice.operating_expenses_entries.find((e) => e.l === line).n
      return { description: m.period, date: m.id, amount: amt }
    })
    if (brandKey === 'All brands' && SHARED_OPEX.includes(line)) {
      drills[`${key}_brands`] = BRANDS.map((b) => ({
        description: b,
        date: pnl.month,
        amount: buildBrandPnl(salesRows, pnl.month, b).operating_expenses_entries.find((e) => e.l === line).n,
      }))
    }
  })

  return drills
}

function avgWeeklyFromIntegerWeeks(weeklyCases) {
  return roundCases(weeklyCases.reduce((a, b) => a + b, 0) / weeklyCases.length)
}

/** Eight whole case counts; mean (one decimal) matches the table avg/wk. */
function weeklyCaseSeries(targetAvg) {
  let totalSum = Math.round(targetAvg * 8)
  const wSum = WEEKLY_CASE_PATTERN.reduce((a, b) => a + b, 0)
  const floats = WEEKLY_CASE_PATTERN.map((m) => (m / wSum) * totalSum)
  const weeks = floats.map((f) => Math.max(1, Math.floor(f)))
  let rem = totalSum - weeks.reduce((a, b) => a + b, 0)
  const order = floats
    .map((f, i) => ({ i, frac: f - Math.floor(f) }))
    .sort((a, b) => b.frac - a.frac)
  for (let j = 0; j < rem; j++) weeks[order[j % order.length].i]++
  let avg = avgWeeklyFromIntegerWeeks(weeks)
  let guard = 0
  while (avg !== roundCases(targetAvg) && guard < 16) {
    const diff = Math.round((roundCases(targetAvg) - avg) * 8)
    if (diff === 0) break
    const idx = diff > 0 ? order[guard % order.length].i : weeks.indexOf(Math.max(...weeks))
    weeks[idx] = Math.max(1, weeks[idx] + (diff > 0 ? 1 : -1))
    totalSum += diff > 0 ? 1 : -1
    avg = avgWeeklyFromIntegerWeeks(weeks)
    guard++
  }
  return weeks
}

function buildStock(salesRows, opts = {}) {
  const velocityMonth = opts.velocityMonth || '2026-09'
  const weeksScale = opts.weeksScale ?? 1
  let rows = PRODUCT_DEFS.map((p) => {
    const meta = PRODUCT_META[p.id]
    const monthUnits = sumUnits(salesRows, { productId: p.id, month: velocityMonth })
    const monthCases = monthUnits / meta.unitsPerCase
    const velocityAvg = roundCases(monthCases / 4.33)
    const weeklyCases = weeklyCaseSeries(velocityAvg)
    const avgWeeklyCases = avgWeeklyFromIntegerWeeks(weeklyCases)
    const weeklyUnits = weeklyCases.map((c) => Math.max(1, Math.round(c * meta.unitsPerCase)))
    const weeksTarget = meta.weeksTarget * weeksScale
    let onHandCases = Math.max(1, Math.round(avgWeeklyCases * weeksTarget))
    const fbaCases = Math.max(0, Math.round(onHandCases * meta.fbaShare))
    const owingsCases = Math.max(1, onHandCases - fbaCases)
    onHandCases = owingsCases + fbaCases
    let weeksSupply = avgWeeklyCases > 0 ? onHandCases / avgWeeklyCases : weeksTarget
    const valueAtCost = roundCents(onHandCases * meta.costPerCase)
    const incomingProducts = ['auf-03', 'auf-05', 'ess-01', 'abr-04', 'auf-08']
    const incomingDates = {
      'auf-03': '2026-10-11',
      'auf-05': '2026-10-18',
      'ess-01': '2026-10-09',
      'abr-04': '2026-10-22',
      'auf-08': '2026-10-14',
    }
    const incoming =
      incomingProducts.includes(p.id) && weeksSupply < 8
        ? { cases: Math.max(2, Math.round(avgWeeklyCases * (2.8 + (hash(p.id) % 4) * 0.4))), expected: incomingDates[p.id] || '2026-10-12' }
        : null
    return {
      productId: p.id,
      brand: p.brand,
      name: p.name,
      onHandCases,
      avgWeeklyCases,
      weeksSupply: Math.round(weeksSupply * 10) / 10,
      valueAtCost,
      costPerCase: meta.costPerCase,
      locations: [
        { location: STOCK_LOCATIONS[0], cases: owingsCases },
        { location: STOCK_LOCATIONS[1], cases: fbaCases },
      ],
      weeklyUnits,
      weeklyCases,
      weeklyWeekEndings: STOCK_WEEK_ENDINGS,
      incoming,
    }
  })

  let totalVal = sumCents(rows, (r) => r.valueAtCost)
  const targetVal = 208_400
  if (!opts.skipValueScale && (totalVal < 190_000 || totalVal > 230_000)) {
    const factor = targetVal / totalVal
    rows = rows.map((r) => {
      const onHandCases = Math.max(1, Math.round(r.onHandCases * factor))
      const meta = PRODUCT_META[r.productId]
      const fbaCases = Math.max(0, Math.round(onHandCases * meta.fbaShare))
      const owingsCases = Math.max(1, onHandCases - fbaCases)
      const onHand = owingsCases + fbaCases
      const weeksSupply = r.avgWeeklyCases > 0 ? onHand / r.avgWeeklyCases : r.weeksSupply
      return {
        ...r,
        onHandCases: onHand,
        weeksSupply: Math.round(weeksSupply * 10) / 10,
        valueAtCost: roundCents(onHand * meta.costPerCase),
        locations: [
          { location: STOCK_LOCATIONS[0], cases: owingsCases },
          { location: STOCK_LOCATIONS[1], cases: fbaCases },
        ],
      }
    })
  }
  return rows
}

function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(a, b) {
  const da = new Date(`${a}T12:00:00.000Z`)
  const db = new Date(`${b}T12:00:00.000Z`)
  return Math.round((db - da) / 86400000)
}

/** Bucket amounts per store — sums to ~94.8k; uneven sizes and aging mix. */
const AR_BUCKET_SPEC = {
  'Pomegranate - Flatbush': { current: 2142.33, d1_30: 1827.44, d31_60: 0, d61_90: 0, d90p: 0 },
  "Moisha's - Brooklyn": { current: 712.18, d1_30: 991.27, d31_60: 1638.92, d61_90: 0, d90p: 0 },
  'Breadberry - Brooklyn': { current: 1628.67, d1_30: 1384.22, d31_60: 0, d61_90: 0, d90p: 0 },
  'KRM - Brooklyn': { current: 484.11, d1_30: 612.44, d31_60: 2387.63, d61_90: 0, d90p: 0 },
  'Rockland Kosher Supermarket': { current: 824.56, d1_30: 1188.34, d31_60: 1742.87, d61_90: 0, d90p: 0 },
  'Shoprite Wesley Hills': { current: 598.22, d1_30: 976.41, d31_60: 2024.18, d61_90: 0, d90p: 0 },
  'Gourmet Glatt - Lakewood': { current: 3347.63, d1_30: 3784.22, d31_60: 0, d61_90: 2984.17, d90p: 0 },
  'Evergreen - Lakewood': { current: 3218.34, d1_30: 3876.18, d31_60: 0, d61_90: 0, d90p: 0 },
  'Gourmet Glatt - Cedarhurst': { current: 1187.44, d1_30: 1042.18, d31_60: 0, d61_90: 0, d90p: 0 },
  "Brach's - Lawrence": { current: 797.49, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0 },
  'Cedar Market - Teaneck': { current: 3511.1, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0 },
  'Salt Market - Deal': { current: 518.44, d1_30: 612.87, d31_60: 0, d61_90: 0, d90p: 1384.56 },
  'Supersol - Lawrence': { current: 642.18, d1_30: 787.44, d31_60: 1484.22, d61_90: 0, d90p: 0 },
  'Evergreen - Monsey': { current: 3313.0, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0 },
  'Seven Mile Market - Baltimore': { current: 4129.62, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0 },
  'Market Maven - Baltimore': { current: 528.67, d1_30: 712.33, d31_60: 1687.92, d61_90: 0, d90p: 0 },
  "Aron's Kissena Farms - Queens": { current: 900.07, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0 },
  'Bingo Wholesale': { current: 3284.22, d1_30: 3988.67, d31_60: 0, d61_90: 2947.44, d90p: 0 },
}

function bucketDueDate(bucket) {
  if (bucket === 'current') return '2026-10-12'
  if (bucket === 'd1_30') return '2026-09-18'
  if (bucket === 'd31_60') return '2026-08-22'
  if (bucket === 'd61_90') return '2026-07-19'
  return '2026-06-08'
}

function daysPastDueFromDue(dueDate) {
  return Math.max(0, daysBetween(dueDate, AS_OF))
}

function bucketFromDaysPastDue(dpd) {
  if (dpd === 0) return 'current'
  if (dpd <= 30) return 'd1_30'
  if (dpd <= 60) return 'd31_60'
  if (dpd <= 90) return 'd61_90'
  return 'd90p'
}

function reconcileStoreSplitTotal(split, total, cap) {
  let fix = roundCents(total - sumCents(STORE_ACCOUNTS.map((n) => split[n] || 0)))
  if (!fix) return
  const donor = STORE_ACCOUNTS.find(
    (n) => !TOP_STORE_NAMES.includes(n) && (split[n] || 0) > 2500 + Math.abs(fix)
  )
  if (donor) split[donor] = roundCents(split[donor] + fix)
  else split[STORE_ACCOUNTS[0]] = roundCents((split[STORE_ACCOUNTS[0]] || 0) + fix)
}

function enforceUniqueStoreRevenues(split, total, cap) {
  for (let pass = 0; pass < 120; pass++) {
    reconcileStoreSplitTotal(split, total, cap)
    const seen = new Map()
    let dupName = null
    STORE_ACCOUNTS.forEach((name) => {
      const key = (split[name] || 0).toFixed(2)
      if (seen.has(key)) dupName = name
      else seen.set(key, name)
    })
    if (!dupName) break
    const bump = roundCents(0.11 + (hash(`${dupName}-${pass}`) % 17) / 100)
    split[dupName] = roundCents(split[dupName] + bump)
    const peer = STORE_ACCOUNTS.find(
      (n) => n !== dupName && !TOP_STORE_NAMES.includes(n) && (split[n] || 0) > bump + 800
    )
    if (peer) split[peer] = roundCents(split[peer] - bump)
    TOP_STORE_NAMES.forEach((n) => {
      if ((split[n] || 0) > cap) split[n] = cap
    })
  }
  reconcileStoreSplitTotal(split, total, cap)
}

function buildStoreRevenueSplits(salesRows, arAccounts, monthId, brandKey) {
  const total =
    brandKey === 'All brands'
      ? sumSales(salesRows, { month: monthId, channel: 'Stores' })
      : sumSales(salesRows, { month: monthId, channel: 'Stores', brand: brandKey })
  const arByName = {}
  arAccounts.forEach((a) => {
    arByName[a.name] = a.buckets.total
  })
  const cap = roundCents(total * 0.12)
  const split = {}
  let pinned = 0
  TOP_STORE_NAMES.forEach((name) => {
    const jitter = ((hash(`${name}|${monthId}|${brandKey}`) % 97) - 48) / 100
    let amt = roundCents(total * TOP_STORE_SHARE[name] + jitter)
    amt = Math.min(cap, Math.max(roundCents(total * 0.022), amt))
    split[name] = amt
    pinned = roundCents(pinned + amt)
  })
  const remainder = roundCents(total - pinned)
  const others = STORE_ACCOUNTS.filter((n) => !TOP_STORE_NAMES.includes(n))
  const weights = {}
  others.forEach((name) => {
    const ar = arByName[name] || 5000
    weights[name] = (STORE_SALES_WEIGHT[name] || 1) * ar
  })
  const otherAlloc = allocateByWeight(Math.max(0, remainder), weights)
  others.forEach((name) => {
    split[name] = otherAlloc[name] || 0
  })
  enforceUniqueStoreRevenues(split, total, cap)
  return STORE_ACCOUNTS.map((name) => ({
    store: name,
    revenue: split[name] || 0,
  }))
}

function buildReceivables() {
  const raw = STORE_ACCOUNTS.map((name) => {
    const b = AR_BUCKET_SPEC[name]
    return {
      name,
      buckets: {
        current: roundCents(b.current),
        d1_30: roundCents(b.d1_30),
        d31_60: roundCents(b.d31_60),
        d61_90: roundCents(b.d61_90),
        d90p: roundCents(b.d90p),
        total: roundCents(b.current + b.d1_30 + b.d31_60 + b.d61_90 + b.d90p),
      },
    }
  })
  const rawTotal = sumCents(raw, (a) => a.buckets.total)
  const targetGoal = 94_827.63
  const scale = targetGoal / rawTotal
  const accounts = raw.map((a) => {
    const buckets = {
      current: roundCents(a.buckets.current * scale),
      d1_30: roundCents(a.buckets.d1_30 * scale),
      d31_60: roundCents(a.buckets.d31_60 * scale),
      d61_90: roundCents(a.buckets.d61_90 * scale),
      d90p: roundCents(a.buckets.d90p * scale),
      total: 0,
    }
    buckets.total = roundCents(buckets.current + buckets.d1_30 + buckets.d31_60 + buckets.d61_90 + buckets.d90p)
    return { name: a.name, buckets }
  })
  const fix = roundCents(targetGoal - sumCents(accounts, (a) => a.buckets.total))
  if (fix) {
    accounts.find((a) => a.name === 'Bingo Wholesale').buckets.d1_30 = roundCents(
      accounts.find((a) => a.name === 'Bingo Wholesale').buckets.d1_30 + fix
    )
    accounts.find((a) => a.name === 'Bingo Wholesale').buckets.total = roundCents(
      accounts.find((a) => a.name === 'Bingo Wholesale').buckets.total + fix
    )
  }
  const targetTotal = sumCents(accounts, (a) => a.buckets.total)

  const invoices = []
  const payments = []
  let invSeq = 10482
  accounts.forEach((acct, ai) => {
    const parts = [
      ['current', acct.buckets.current],
      ['d1_30', acct.buckets.d1_30],
      ['d31_60', acct.buckets.d31_60],
      ['d61_90', acct.buckets.d61_90],
      ['d90p', acct.buckets.d90p],
    ].filter(([, amt]) => amt > 0)
    parts.forEach(([bucket, amount], bi) => {
      const baseDue = bucketDueDate(bucket)
      const brandsOn = BRANDS.filter((_, idx) => (hash(acct.name + bucket) + idx) % 3 !== 0)
      if (brandsOn.length === 0) brandsOn.push(BRANDS[ai % 3])
      const splitAmt =
        amount > 2400 && bi === 0
          ? [roundCents(amount * 0.58), roundCents(amount * 0.42)]
          : [amount]
      splitAmt.forEach((amt, si) => {
        const dueDate = si ? addDays(baseDue, -si * 3) : baseDue
        const invDate = addDays(dueDate, -30)
        const due = addDays(invDate, 30)
        const daysPastDue = daysPastDueFromDue(due)
        invoices.push({
          account: acct.name,
          invoiceNo: `INV-${invSeq++}`,
          date: invDate,
          dueDate: due,
          daysPastDue,
          bucket: bucketFromDaysPastDue(daysPastDue),
          brands: brandsOn,
          amount: amt,
        })
      })
    })
    const payAmt = roundCents(acct.buckets.total * (0.14 + (hash(acct.name) % 17) / 100))
    if (payAmt > 80 && ai % 5 !== 2) {
      payments.push({
        account: acct.name,
        date: `2026-08-${String(6 + (ai % 21)).padStart(2, '0')}`,
        amount: payAmt,
        reference: `PMT-${2184 + ai * 3}`,
      })
    }
    if (ai % 7 === 1) {
      payments.push({
        account: acct.name,
        date: `2026-09-${String(4 + (ai % 12)).padStart(2, '0')}`,
        amount: roundCents(payAmt * 0.62),
        reference: `PMT-${3400 + ai}`,
      })
    }
  })

  accounts.forEach((acct) => {
    const invSum = sumCents(invoices.filter((i) => i.account === acct.name), (i) => i.amount)
    const diff = roundCents(acct.buckets.total - invSum)
    if (diff && invoices.length) {
      const last = invoices.filter((i) => i.account === acct.name).pop()
      if (last) last.amount = roundCents(last.amount + diff)
    }
  })

  return {
    accounts,
    invoices,
    payments,
    targetTotal,
    priorTotal: roundCents(targetTotal * 0.971),
  }
}

function buildChannelDetails(salesRows, arAccounts) {
  const storeSplits = {}
  ;['2026-09', '2026-08'].forEach((monthId) => {
    storeSplits[monthId] = {}
    storeSplits[monthId]['All brands'] = buildStoreRevenueSplits(salesRows, arAccounts, monthId, 'All brands')
    BRANDS.forEach((b) => {
      storeSplits[monthId][b] = buildStoreRevenueSplits(salesRows, arAccounts, monthId, b)
    })
  })
  return CHANNELS.map((ch) => {
    const sep = '2026-09'
    const aug = '2026-08'
    const curRev = sumSales(salesRows, { month: sep, channel: ch })
    const priorRev = sumSales(salesRows, { month: aug, channel: ch })
    const curUnits = sumUnits(salesRows, { month: sep, channel: ch })
    const priorUnits = sumUnits(salesRows, { month: aug, channel: ch })
    const byBrand = BRANDS.map((b) => ({
      brand: b,
      revenue: sumSales(salesRows, { month: sep, channel: ch, brand: b }),
      units: sumUnits(salesRows, { month: sep, channel: ch, brand: b }),
    }))
    const byProduct = PRODUCT_DEFS.map((p) => ({
      productId: p.id,
      name: p.name,
      brand: p.brand,
      revenue: sumSales(salesRows, { month: sep, channel: ch, productId: p.id }),
      units: sumUnits(salesRows, { month: sep, channel: ch, productId: p.id }),
    })).filter((r) => r.revenue > 0)
    const trend = MONTHS.map((m) => ({
      month: m.id,
      label: m.label,
      revenue: sumSales(salesRows, { month: m.id, channel: ch }),
    }))
    const extra = {}
    if (ch === 'Amazon') {
      const sepPnl = buildCombinedPnl(salesRows, sep)
      const fees = sepPnl.operating_expenses_entries.find((e) => e.l === 'Amazon fees').n
      extra.amazon = { grossSales: curRev, fees, netPayout: roundCents(curRev - fees) }
    }
    if (ch === 'Own site') {
      let bags = 0
      let cases = 0
      PRODUCT_DEFS.forEach((p) => {
        const rev = sumSales(salesRows, { month: sep, channel: ch, productId: p.id })
        const share = PRODUCT_META[p.id].ownSiteCaseShare
        cases += rev * share
        bags += rev * (1 - share)
      })
      extra.ownSite = { singleBags: roundCents(bags), casePacks: roundCents(cases) }
    }
    if (ch === 'Stores') {
      extra.stores = storeSplits[sep]['All brands']
      extra.storeSplits = storeSplits
    }
    return {
      channel: ch,
      curRev,
      priorRev,
      curUnits,
      priorUnits,
      byBrand,
      byProduct,
      trend,
      extra,
    }
  })
}

function buildModel() {
  const salesRows = buildSalesRows()
  const pnlByMonth = {}
  const pnlByBrandMonth = {}
  MONTHS.forEach((m) => {
    pnlByMonth[m.id] = buildCombinedPnl(salesRows, m.id)
    BRANDS.forEach((b) => {
      pnlByBrandMonth[`${m.id}:${b}`] = buildBrandPnl(salesRows, m.id, b)
    })
  })

  const pnlViews = {}
  const addPnlView = (key, getter) => {
    pnlViews[key] = MONTHS.map((m) => {
      const base = getter(m.id)
      const meta = MONTHS.find((x) => x.id === m.id)
      return {
        ...base,
        label: meta.label,
        period: meta.period,
        drill_ledgers: buildPnlDrills(salesRows, base, key === 'All brands' ? 'All brands' : key),
      }
    })
  }
  addPnlView('All brands', (id) => pnlByMonth[id])
  BRANDS.forEach((b) => addPnlView(b, (id) => pnlByBrandMonth[`${id}:${b}`]))

  const stock = buildStock(salesRows)
  const stockAug = buildStock(salesRows, { velocityMonth: '2026-08', weeksScale: 0.96, skipValueScale: true })
  const receivables = buildReceivables()
  const channels = buildChannelDetails(salesRows, receivables.accounts)

  const sep = '2026-09'
  const aug = '2026-08'
  const combinedSep = pnlByMonth[sep]
  const combinedAug = pnlByMonth[aug]

  const brandSummary = BRANDS.map((b) => {
    const s = pnlByBrandMonth[`${sep}:${b}`]
    const p = pnlByBrandMonth[`${aug}:${b}`]
    return {
      brand: b,
      sales: s.revenue_total,
      priorSales: p.revenue_total,
      netProfit: s.net_profit,
      priorNet: p.net_profit,
      channels: CHANNELS.map((ch) => ({
        channel: ch,
        revenue: sumSales(salesRows, { month: sep, brand: b, channel: ch }),
      })),
      topProducts: PRODUCT_DEFS
        .filter((pr) => pr.brand === b)
        .map((pr) => ({
          name: pr.name,
          revenue: sumSales(salesRows, { month: sep, brand: b, productId: pr.id }),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    }
  })

  const stockValueSep = sumCents(stock, (r) => r.valueAtCost)
  const stockValueAug = sumCents(stockAug, (r) => r.valueAtCost)

  return {
    meta: { as_of: AS_OF, built_by: BUILT_BY, name: BIZ_NAME },
    salesRows,
    pnlViews,
    stock,
    receivables,
    channels,
    brandSummary,
    overview: {
      sepSales: combinedSep.revenue_total,
      augSales: combinedAug.revenue_total,
      grossMarginPct: combinedSep.revenue_total > 0 ? (combinedSep.gross_profit / combinedSep.revenue_total) * 100 : 0,
      priorGrossMarginPct: combinedAug.revenue_total > 0 ? (combinedAug.gross_profit / combinedAug.revenue_total) * 100 : 0,
      netProfitSep: combinedSep.net_profit,
      priorNetProfit: combinedAug.net_profit,
      stockValue: stockValueSep,
      priorStockValue: stockValueAug,
      stockWeeks: (() => {
        const w = stock.reduce((s, r) => s + r.weeksSupply, 0) / stock.length
        return Math.round(w * 10) / 10
      })(),
      owedTotal: receivables.targetTotal,
      priorOwedTotal: receivables.priorTotal,
      owedOver60: sumCents(receivables.accounts, (a) => a.buckets.d61_90 + a.buckets.d90p),
      channelSalesSep: CHANNELS.map((ch) => ({
        channel: ch,
        revenue: sumSales(salesRows, { month: sep, channel: ch }),
        prior: sumSales(salesRows, { month: aug, channel: ch }),
      })),
      chartMonths: MONTHS.map((m) => ({
        name: m.label.slice(0, 3),
        revenue: pnlByMonth[m.id].revenue_total,
        net: pnlByMonth[m.id].net_profit,
      })),
    },
  }
}

const DATA = buildModel()

export default DATA
export { buildModel, PRODUCT_META, BRAND_MONTH, MONTH_TOTAL }

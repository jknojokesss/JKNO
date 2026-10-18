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

const PRODUCT_META = {}
PRODUCT_DEFS.forEach((p, i) => {
  const base = 4.25 + (i % 7) * 0.37 + (p.brand === 'Essiccata' ? 1.1 : 0)
  PRODUCT_META[p.id] = {
    unitPrice: roundCents(base + (i % 3) * 0.19),
    velocity: 0.72 + (i % 11) * 0.11 + (p.name.includes('8 oz') ? 0.35 : 0),
    ownSiteCaseShare: 0.28 + (i % 5) * 0.08,
    costPerCase: roundCents(18.4 + (i % 9) * 2.17 + (p.brand === 'Essiccata' ? 4.2 : 0)),
    unitsPerCase: p.name.includes('10 ct') ? 1 : p.name.includes('8 oz') ? 12 : 24,
  }
})

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
    if (h === 0) return 0.912
    if (h === 1) return 0.945
    if (h === 2) return 0.968
    if (h >= 7) return 1.082
    return 1.018 + (h % 4) * 0.011
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
  return rows
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

function buildStock(salesRows) {
  const endMonth = '2026-09'
  const rows = PRODUCT_DEFS.map((p) => {
    const meta = PRODUCT_META[p.id]
    const monthUnits = sumUnits(salesRows, { productId: p.id, month: endMonth })
    const avgWeeklyUnits = monthUnits / 4.33
    const weeklyUnits = []
    for (let w = 0; w < 8; w++) {
      const u = Math.max(1, Math.round(avgWeeklyUnits * (0.92 + (hash(`${p.id}-w${w}`) % 17) / 100)))
      weeklyUnits.push(u)
    }
    const avgFromWeeks = weeklyUnits.reduce((a, b) => a + b, 0) / 8
    const avgWeeklyCases = roundCents(avgFromWeeks / meta.unitsPerCase)
    const owingsCases = Math.max(2, Math.round(avgWeeklyCases * (2.1 + (hash(p.id) % 18) / 10)))
    const fbaCases = Math.max(1, Math.round(avgWeeklyCases * (1.4 + (hash(p.id + 'fba') % 12) / 10)))
    const onHandCases = owingsCases + fbaCases
    const weeksSupply = avgWeeklyCases > 0 ? onHandCases / avgWeeklyCases : 99
    const valueAtCost = roundCents(onHandCases * meta.costPerCase)
    const incoming =
      weeksSupply < 4 && hash(p.id) % 3 !== 0
        ? { cases: Math.round(avgWeeklyCases * 3.2), expected: '2026-10-14' }
        : weeksSupply < 2.5
          ? { cases: Math.round(avgWeeklyCases * 5), expected: '2026-10-08' }
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
      incoming,
    }
  })
  return rows
}

function buildReceivables() {
  const targetTotal = 96_118.54
  const weights = STORE_ACCOUNTS.map((name, i) => 0.55 + (hash(name) % 45) / 100 + (i % 4) * 0.08)
  const wSum = weights.reduce((a, b) => a + b, 0)
  const accounts = STORE_ACCOUNTS.map((name, i) => {
    const total = roundCents((targetTotal * weights[i]) / wSum)
    let cur = Math.round(total * (0.42 + (hash(name + 'c') % 20) / 100) * 100)
    let d1 = Math.round(total * (0.28 + (hash(name + '1') % 12) / 100) * 100)
    let d31 = Math.round(total * (0.14 + (hash(name + '31') % 8) / 100) * 100)
    let d61 = Math.round(total * (0.06 + (hash(name + '61') % 5) / 100) * 100)
    let d90 = Math.round(total * 100) - cur - d1 - d31 - d61
    if (d90 < 0) {
      d61 += d90
      d90 = 0
    }
    if (d61 < 0) {
      d31 += d61
      d61 = 0
    }
    const buckets = {
      current: cur / 100,
      d1_30: d1 / 100,
      d31_60: d31 / 100,
      d61_90: d61 / 100,
      d90p: d90 / 100,
      total: roundCents((cur + d1 + d31 + d61 + d90) / 100),
    }
    return { name, buckets }
  })
  const fix = roundCents(targetTotal - sumCents(accounts, (a) => a.buckets.total))
  if (fix) {
    accounts[0].buckets.total = roundCents(accounts[0].buckets.total + fix)
    accounts[0].buckets.current = roundCents(accounts[0].buckets.current + fix)
  }

  accounts[4].buckets.d61_90 = roundCents(accounts[4].buckets.d61_90 + 842.19)
  accounts[4].buckets.total = roundCents(accounts[4].buckets.total + 842.19)
  accounts[11].buckets.d90p = roundCents(accounts[11].buckets.d90p + 1_284.56)
  accounts[11].buckets.total = roundCents(accounts[11].buckets.total + 1_284.56)
  const moveFrom = Math.min(accounts[11].buckets.current, 1_284.56)
  accounts[11].buckets.current = roundCents(accounts[11].buckets.current - moveFrom)
  accounts[11].buckets.d1_30 = roundCents(accounts[11].buckets.d1_30 + (1_284.56 - moveFrom))

  accounts.forEach((a) => {
    const b = a.buckets
    const s = roundCents(b.current + b.d1_30 + b.d31_60 + b.d61_90 + b.d90p)
    const diff = roundCents(b.total - s)
    if (diff) b.current = roundCents(b.current + diff)
  })

  const invoices = []
  const payments = []
  accounts.forEach((acct, ai) => {
    let remaining = acct.buckets.total
    const invCount = 2 + (hash(acct.name) % 3)
    for (let i = 0; i < invCount; i++) {
      const amt =
        i === invCount - 1
          ? roundCents(remaining)
          : roundCents(remaining * (0.35 + (hash(acct.name + i) % 25) / 100))
      remaining = roundCents(remaining - amt)
      const daysPast = i === 0 && acct.buckets.d90p > 0 ? 94 : i === 0 && acct.buckets.d61_90 > 500 ? 67 : 12 + (hash(acct.name + 'd' + i) % 40)
      const invNo = `INV-${10480 + ai * 3 + i}`
      const brandsOn = BRANDS.filter((_, bi) => hash(acct.name + bi) % 2 === 0)
      if (brandsOn.length === 0) brandsOn.push(BRANDS[ai % 3])
      invoices.push({
        account: acct.name,
        invoiceNo: invNo,
        date: '2026-09-' + String(28 - i * 4).padStart(2, '0'),
        dueDate: '2026-10-' + String(15 - i).padStart(2, '0'),
        daysPastDue: Math.max(0, daysPast - 30),
        brands: brandsOn,
        amount: amt,
      })
    }
    if (hash(acct.name) % 3 !== 1) {
      payments.push({
        account: acct.name,
        date: '2026-08-' + String(10 + (ai % 18)).padStart(2, '0'),
        amount: roundCents(acct.buckets.total * 0.22),
        reference: `PMT-${2200 + ai}`,
      })
    }
  })

  return { accounts, invoices, payments, targetTotal: sumCents(accounts, (a) => a.buckets.total), priorTotal: roundCents(sumCents(accounts, (a) => a.buckets.total) * 0.968) }
}

function buildChannelDetails(salesRows) {
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
      extra.stores = STORE_ACCOUNTS.map((name, i) => ({
        store: name,
        revenue: roundCents((curRev * (0.4 + (hash(name) % 35) / 100)) / (18 + (i % 3))),
      }))
      const storeSum = sumCents(extra.stores, (s) => s.revenue)
      const adj = roundCents(curRev - storeSum)
      extra.stores[0].revenue = roundCents(extra.stores[0].revenue + adj)
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
  const receivables = buildReceivables()
  const channels = buildChannelDetails(salesRows)

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
  const stockValueAug = roundCents(stockValueSep * 0.972)

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

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

const COGS_SPLIT = {
  'Meat and fish': 0.548,
  Packaging: 0.162,
  'Co-packing': 0.118,
  'Kosher supervision': 0.092,
  'Inbound freight': 0.08,
}

const MONTH_TARGETS = {
  '2026-04': 198_432.17,
  '2026-05': 207_891.44,
  '2026-06': 214_556.88,
  '2026-07': 228_104.33,
  '2026-08': 221_387.62,
  '2026-09': 236_148.91,
}

const BRAND_SHARE_SEP = { Aufschnitt: 0.548, "Abraham's": 0.297, Essiccata: 0.155 }

const CHANNEL_SHARE = {
  Aufschnitt: { Stores: 0.58, Amazon: 0.29, 'Own site': 0.13 },
  "Abraham's": { Stores: 0.57, Amazon: 0.3, 'Own site': 0.13 },
  Essiccata: { Stores: 0.42, Amazon: 0.43, 'Own site': 0.15 },
}

const COGS_RATE = { Aufschnitt: 0.638, "Abraham's": 0.662, Essiccata: 0.604 }

/** Per-product unit price (wholesale-weighted avg) and relative velocity */
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

function monthIndex(id) {
  return MONTHS.findIndex((m) => m.id === id)
}

/** Raw unit weights before scaling to revenue target */
function rawUnits(productId, channel, monthId) {
  const mi = monthIndex(monthId)
  const meta = PRODUCT_META[productId]
  const season = [0.91, 0.95, 0.98, 1.04, 1.0, 1.07][mi] || 1
  const chBump = channel === 'Amazon' ? 1.04 : channel === 'Own site' ? 0.96 : 1
  const wobble = 0.88 + (hash(`${productId}-${channel}-${monthId}`) % 24) / 100
  return meta.velocity * season * chBump * wobble * 420
}

function buildSalesRows() {
  const rows = []
  MONTHS.forEach((m) => {
    const target = MONTH_TARGETS[m.id]
    const raw = []
    let rawRev = 0
    PRODUCT_DEFS.forEach((p) => {
      CHANNELS.forEach((ch) => {
        const units = Math.max(1, Math.round(rawUnits(p.id, ch, m.id)))
        const rev = roundCents(units * PRODUCT_META[p.id].unitPrice)
        raw.push({ month: m.id, productId: p.id, brand: p.brand, channel: ch, units, revenue: rev })
        rawRev += rev
      })
    })
    const scale = target / rawRev
    raw.forEach((r) => {
      const revenue = roundCents(r.revenue * scale)
      const units = Math.max(1, Math.round(r.units * scale))
      rows.push({ ...r, units, revenue })
    })
    // fix cent drift on month total
    const got = sumCents(rows.filter((x) => x.month === m.id), (x) => x.revenue)
    const diff = roundCents(target - got)
    if (diff !== 0) {
      const last = rows.filter((x) => x.month === m.id).sort((a, b) => b.revenue - a.revenue)[0]
      if (last) last.revenue = roundCents(last.revenue + diff)
    }
  })
  return rows
}

function brandFilter(brand, row) {
  if (!brand || brand === 'All brands') return true
  return row.brand === brand
}

function sumSales(rows, { month, brand, channel, productId } = {}) {
  return sumCents(
    rows.filter(
      (r) =>
        (!month || r.month === month) &&
        (!channel || r.channel === channel) &&
        (!productId || r.productId === productId) &&
        brandFilter(brand, r)
    ),
    (r) => r.revenue
  )
}

function sumUnits(rows, opts) {
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

  const cogsTotal = roundCents(revenueTotal * COGS_RATE[brand])
  const cogs_entries = COGS_LINES.map((l) => ({ l, n: roundCents(cogsTotal * COGS_SPLIT[l]) }))
  let cogsFix = roundCents(cogsTotal - sumCents(cogs_entries, (e) => e.n))
  if (cogsFix) cogs_entries[0].n = roundCents(cogs_entries[0].n + cogsFix)

  const amazonFees = roundCents(rev.Amazon * 0.1532)
  const storePromos = roundCents(rev.Stores * 0.0247)
  const shipping = roundCents(rev['Own site'] * 0.1184)
  const cardProc = roundCents((rev.Amazon + rev['Own site']) * 0.0291)

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

  const operating_expenses_entries = [
    { l: 'Amazon fees', n: amazonFees },
    { l: 'Store promos and credits', n: storePromos },
    { l: 'Shipping to customers', n: shipping },
    { l: 'Card processing', n: cardProc },
    ...SHARED_OPEX.map((l) => ({ l, n: allocatedShared[l] })),
  ]
  const operating_expenses_total = sumCents(operating_expenses_entries, (e) => e.n)
  const gross_profit = roundCents(revenueTotal - cogsTotal)
  const net_profit = roundCents(gross_profit - operating_expenses_total)

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

  const variableLines = ['Amazon fees', 'Store promos and credits', 'Shipping to customers', 'Card processing']
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
    const weeklyUnits = []
    for (let w = 0; w < 8; w++) {
      const u = Math.max(
        1,
        Math.round(
          sumUnits(salesRows, { productId: p.id, month: endMonth }) / 4.33 * (0.86 + (hash(`${p.id}-w${w}`) % 28) / 100)
        )
      )
      weeklyUnits.push(u)
    }
    const avgWeeklyCases = roundCents((weeklyUnits.reduce((a, b) => a + b, 0) / 8) / meta.unitsPerCase)
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

function buildReceivables(salesRows) {
  const storesSep = sumSales(salesRows, { month: '2026-09', channel: 'Stores' })
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
  let t = sumCents(accounts, (a) => a.buckets.total)
  const fix = roundCents(targetTotal - t)
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
    const parts = [b.current, b.d1_30, b.d31_60, b.d61_90, b.d90p]
    const s = roundCents(parts.reduce((x, y) => x + y, 0))
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

  return { accounts, invoices, payments, targetTotal: sumCents(accounts, (a) => a.buckets.total) }
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
      const fees = roundCents(curRev * 0.1532)
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
  const receivables = buildReceivables(salesRows)
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
      netProfitSep: combinedSep.net_profit,
      stockValue: sumCents(stock, (r) => r.valueAtCost),
      stockWeeks: (() => {
        const w = stock.reduce((s, r) => s + r.weeksSupply, 0) / stock.length
        return Math.round(w * 10) / 10
      })(),
      owedTotal: receivables.targetTotal,
      owedOver60: sumCents(
        receivables.accounts,
        (a) => a.buckets.d61_90 + a.buckets.d90p
      ),
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
export { buildModel, PRODUCT_META }

/**
 * One-shot deterministic enrichments for data/primal-krisp.json (run from repo root).
 */
import fs from 'fs'
import path from 'path'

const file = path.join(process.cwd(), 'data/primal-krisp.json')
const DATA = JSON.parse(fs.readFileSync(file, 'utf8'))
const CHANNELS = DATA.channels

const round2 = (n) => Math.round(n * 100) / 100

function splitProportional(total, weights) {
  const wSum = weights.reduce((a, b) => a + b, 0) || 1
  const raw = weights.map((w) => (total * w) / wSum)
  const cents = raw.map((v) => Math.round(v * 100))
  let diff = Math.round(total * 100) - cents.reduce((a, b) => a + b, 0)
  let i = 0
  while (diff !== 0 && cents.length) {
    const j = i % cents.length
    cents[j] += diff > 0 ? 1 : -1
    diff += diff > 0 ? -1 : 1
    i++
  }
  return cents.map((c) => c / 100)
}

const septMonth = DATA.monthly_sales_by_channel.find((m) => m.month === '2026-09')
const weekWeights = [0.22, 0.24, 0.26, 0.28]
const weekLabels = [
  { week_of: '2026-09-07', label: 'Sep 1–7' },
  { week_of: '2026-09-14', label: 'Sep 8–14' },
  { week_of: '2026-09-21', label: 'Sep 15–21' },
  { week_of: '2026-09-28', label: 'Sep 22–28' },
]

const weeklyInSeptember = weekLabels.map((w, wi) => {
  const share = weekWeights[wi]
  const chSales = splitProportional(
    septMonth.Total * share,
    CHANNELS.map((ch) => septMonth[ch] || 0),
  )
  const row = { ...w, month: '2026-09' }
  CHANNELS.forEach((ch, ci) => {
    row[ch] = chSales[ci]
  })
  row.Total = round2(chSales.reduce((a, b) => a + b, 0))
  return row
})

// Fix weekly totals to sum exactly to September
const weekSum = weeklyInSeptember.reduce((s, w) => s + w.Total, 0)
const adj = round2(septMonth.Total - weekSum)
weeklyInSeptember[3].Total = round2(weeklyInSeptember[3].Total + adj)
const lastCh = CHANNELS[CHANNELS.length - 1]
weeklyInSeptember[3][lastCh] = round2(weeklyInSeptember[3][lastCh] + adj)

const thisWeek = weeklyInSeptember[3]
const prevWeek = weeklyInSeptember[2]

const weekChannelRows = CHANNELS.map((ch, i) => ({
  channel: ch,
  sales: thisWeek[ch],
  bags: Math.round((DATA.overview.sales_by_channel.find((c) => c.channel === ch)?.bags || 0) * (thisWeek[ch] / (septMonth[ch] || 1))),
}))

const weekBags = weekChannelRows.reduce((s, c) => s + c.bags, 0)

DATA.weekly_in_september = weeklyInSeptember
DATA.period_slices = {
  week_ending: thisWeek.week_of,
  week_label: thisWeek.label,
  overview: {
    sales: thisWeek.Total,
    sales_prior_week: prevWeek.Total,
    bags_sold: weekBags,
    sales_by_channel: weekChannelRows,
    open_store_balance: DATA.overview.open_store_balance,
    active_subscriptions: DATA.overview.active_subscriptions,
    cash_on_hand: DATA.overview.cash_on_hand,
  },
}

// P&L by month Apr–Sep
const pnlTemplate = DATA.pnl
const cogsRatio = pnlTemplate.cogs / pnlTemplate.revenue_total
const opexRatio = pnlTemplate.operating_expenses_total / pnlTemplate.revenue_total

const monthNames = {
  '2026-04': 'April 2026',
  '2026-05': 'May 2026',
  '2026-06': 'June 2026',
  '2026-07': 'July 2026',
  '2026-08': 'August 2026',
  '2026-09': 'September 2026',
}

const pnlByMonth = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'].map((monthKey) => {
  const mRow = DATA.monthly_sales_by_channel.find((m) => m.month === monthKey)
  const revenue = {}
  CHANNELS.forEach((ch) => {
    revenue[ch] = mRow[ch] || 0
  })
  const revenue_total = round2(mRow.Total)

  if (monthKey === '2026-09') {
    const cogs_entries = DATA.product_margins_by_channel.map((p) => ({
      l: p.product,
      n: round2(p.bags_sold_sept_all_channels * p.cost_per_bag),
    }))
    const operating_expenses_entries = Object.entries(pnlTemplate.operating_expenses).map(([k, v]) => ({
      l: k,
      n: v,
    }))
    return buildPnlMonth({
      monthKey,
      mRow,
      revenue: { ...pnlTemplate.revenue },
      revenue_total: pnlTemplate.revenue_total,
      cogs: pnlTemplate.cogs,
      gross_profit: pnlTemplate.gross_profit,
      operating_expenses: { ...pnlTemplate.operating_expenses },
      operating_expenses_total: pnlTemplate.operating_expenses_total,
      net_profit: pnlTemplate.net_profit,
      cogs_entries,
      operating_expenses_entries,
      basis: pnlTemplate.basis,
    })
  }

  const scale = revenue_total / pnlTemplate.revenue_total
  const cogs = round2(revenue_total * cogsRatio)
  const operating_expenses = {}
  Object.entries(pnlTemplate.operating_expenses).forEach(([k, v]) => {
    operating_expenses[k] = round2(v * scale)
  })
  let opexTotal = round2(Object.values(operating_expenses).reduce((a, b) => a + b, 0))
  const gross_profit = round2(revenue_total - cogs)
  let net_profit = round2(gross_profit - opexTotal)

  const cogs_entries = DATA.product_margins_by_channel.map((p) => ({
    l: p.product,
    n: round2(p.bags_sold_sept_all_channels * p.cost_per_bag * scale),
  }))
  let cogsSum = round2(cogs_entries.reduce((s, e) => s + e.n, 0))
  if (cogsSum !== cogs) {
    cogs_entries[cogs_entries.length - 1].n = round2(cogs_entries[cogs_entries.length - 1].n + (cogs - cogsSum))
  }

  const operating_expenses_entries = Object.entries(operating_expenses).map(([k, v]) => ({ l: k, n: v }))

  return buildPnlMonth({
    monthKey,
    mRow,
    revenue,
    revenue_total,
    cogs,
    gross_profit,
    operating_expenses,
    operating_expenses_total: opexTotal,
    net_profit,
    cogs_entries,
    operating_expenses_entries,
    basis: pnlTemplate.basis,
  })
})

function buildPnlMonth(row) {
  const days = [3, 8, 12, 17, 22, 26]
  const mkLedger = (parts, prefix) =>
    parts.map((p, i) => ({
      date: `${row.monthKey}-${String(days[i % days.length]).padStart(2, '0')}`,
      description: `${prefix}${p.l}`,
      amount: round2(p.n),
    }))

  const revParts = Object.entries(row.revenue).map(([l, n]) => ({ l, n }))
  const revLedger = mkLedger(revParts, '')
  const cogsLedger = mkLedger(row.cogs_entries, 'COGS · ')
  const opexLedger = mkLedger(row.operating_expenses_entries, '')
  const grossLedger = [
    { date: `${row.monthKey}-28`, description: 'Gross profit (revenue − COGS)', amount: row.gross_profit },
  ]
  const netLedger = [
    { date: `${row.monthKey}-28`, description: 'Net profit after operating expenses', amount: row.net_profit },
  ]

  return {
    month: row.monthKey,
    label: row.mRow.label,
    period: monthNames[row.monthKey],
    basis: row.basis,
    revenue: row.revenue,
    revenue_total: row.revenue_total,
    cogs: row.cogs,
    gross_profit: row.gross_profit,
    operating_expenses: row.operating_expenses,
    operating_expenses_total: row.operating_expenses_total,
    net_profit: row.net_profit,
    cogs_entries: row.cogs_entries,
    operating_expenses_entries: row.operating_expenses_entries,
    drill_ledgers: {
      revenue_total: revLedger,
      cogs_total: cogsLedger,
      gross_profit: grossLedger,
      operating_expenses_total: opexLedger,
      net_profit: netLedger,
      ...Object.fromEntries(revParts.map((p) => [`rev_${p.l}`, mkLedger([p], '')])),
      ...Object.fromEntries(row.cogs_entries.map((p) => [`cogs_${p.l}`, mkLedger([p], 'COGS · ')])),
      ...Object.fromEntries(row.operating_expenses_entries.map((p) => [`opex_${p.l}`, mkLedger([p], '')])),
    },
  }
}

DATA.pnl_by_month = pnlByMonth

// Store invoices: status + paid history; week fields
const weekStoreSales = thisWeek.Stores
const monthStoreSales = septMonth.Stores
const weekShareStore = weekStoreSales / monthStoreSales

let storeBagsWeekSum = 0
DATA.stores.list.forEach((st, idx) => {
  const s = st.sample
  const openInv = (s.open_invoices || []).map((inv) => ({ ...inv, status: 'Open' }))
  const paidSeed = (idx % 5) + 1
  const paid = [
    {
      invoice: `PK-P${1000 + idx}`,
      issued: '2026-08-15',
      amount: round2(s.price_per_bag * paidSeed * 12),
      days_outstanding: 0,
      status: 'Paid',
    },
  ]
  s.invoices = [...openInv, ...paid].sort((a, b) => (a.issued < b.issued ? 1 : -1))
  s.bags_sold_week = Math.max(0, Math.round((s.bags_sold_sept || 0) * weekShareStore))
  storeBagsWeekSum += s.bags_sold_week
})

// Adjust last store bags to match week channel store bags target
const targetStoreBags = weekChannelRows.find((c) => c.channel === 'Stores')?.bags || storeBagsWeekSum
const diffBags = targetStoreBags - storeBagsWeekSum
if (diffBags !== 0 && DATA.stores.list.length) {
  DATA.stores.list[0].sample.bags_sold_week += diffBags
}

// Product store breakdown (Stores channel only)
const storeRows = DATA.stores.list.filter((st) => (st.sample.bags_sold_sept || 0) > 0)
DATA.product_store_breakdown = DATA.product_margins_by_channel.map((p) => {
  const storeUnits = p.channels.Stores?.bags_sold_sept || 0
  const storePrice = p.channels.Stores?.net_price_per_bag || 9.5
  const weights = storeRows.map((st) => {
    const base = st.sample.bags_sold_sept || 0
    const boost = st.sample.best_seller_here === p.product ? 1.35 : 1
    return base * boost
  })
  const unitsArr = splitProportional(storeUnits, weights).map((u) => Math.round(u))
  let uSum = unitsArr.reduce((a, b) => a + b, 0)
  if (uSum !== storeUnits && unitsArr.length) {
    unitsArr[0] += storeUnits - uSum
  }
  const stores = storeRows
    .map((st, i) => ({
      store: st.name,
      city: st.city,
      units: unitsArr[i],
      dollars: round2(unitsArr[i] * storePrice),
    }))
    .filter((r) => r.units > 0)
    .sort((a, b) => b.units - a.units)

  const total_units = stores.reduce((s, r) => s + r.units, 0)
  const total_dollars = round2(stores.reduce((s, r) => s + r.dollars, 0))
  return {
    product: p.product,
    store_channel_units: storeUnits,
    store_channel_dollars: round2(storeUnits * storePrice),
    stores,
    total_units,
    total_dollars,
  }
})

fs.writeFileSync(file, JSON.stringify(DATA, null, 1) + '\n')
console.log('Enriched', file)
console.log('Week total', thisWeek.Total, 'sum weeks', round2(weeklyInSeptember.reduce((s, w) => s + w.Total, 0)))

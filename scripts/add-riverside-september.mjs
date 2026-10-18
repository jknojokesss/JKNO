/**
 * One-off: add closed September 2026 to data/riverside-tires.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const file = path.join(root, 'data/riverside-tires.json')
const data = JSON.parse(fs.readFileSync(file, 'utf8'))

const round = (n) => Math.round(n * 100) / 100
const scaleObj = (obj, factor, keys = null) => {
  const out = JSON.parse(JSON.stringify(obj))
  const walk = (o) => {
    if (Array.isArray(o)) o.forEach(walk)
    else if (o && typeof o === 'object') {
      for (const k of Object.keys(o)) {
        if (keys && keys.includes(k) && typeof o[k] === 'number') o[k] = round(o[k] * factor)
        else if (!keys && typeof o[k] === 'number' && k !== 'rank' && k !== 'pct') o[k] = round(o[k] * factor)
        else walk(o[k])
      }
    }
  }
  walk(out)
  return out
}

const aug = data.monthly.find((m) => m.month === '2026-08')
const sep = {
  month: '2026-09',
  label: 'SEP',
  revenue: 37500,
  cogs: 14550,
  opex: 9200,
  profit: 13750,
  tiresSold: 266,
  newTireUnits: 187,
  usedTireUnits: 79,
  ticketCount: 107,
}
data.monthly.push(sep)

const f = sep.revenue / aug.revenue

if (data.pl_by_month['2026-08']) {
  const plAug = data.pl_by_month['2026-08']
  const plSep = JSON.parse(JSON.stringify(plAug))
  const scaleLine = (lines) =>
    lines.map((l) => ({
      ...l,
      amount: round(l.amount * f),
      drill: l.drill?.map((d) => ({ ...d, amount: round(d.amount * f) })),
    }))
  plSep.income = scaleLine(plSep.income)
  plSep.cogs = scaleLine(plSep.cogs)
  plSep.expense = scaleLine(plSep.expense)
  plSep.gross = round(plSep.income.reduce((s, l) => s + l.amount, 0) - plSep.cogs.reduce((s, l) => s + l.amount, 0))
  plSep.net = sep.profit
  data.pl_by_month['2026-09'] = plSep
}

if (data.balance_sheet?.['2026-08']) {
  const bs = JSON.parse(JSON.stringify(data.balance_sheet['2026-08']))
  bs.label = 'Sep 30, 2026'
  bs.assets = bs.assets.map((a) => ({ ...a, amount: round(a.amount * (1 + (f - 1) * 0.3)) }))
  bs.liabilities = bs.liabilities.map((a) => ({ ...a, amount: round(a.amount * (1 + (f - 1) * 0.2)) }))
  bs.equity = bs.equity.map((a) => ({ ...a, amount: round(a.amount * (1 + (f - 1) * 0.25)) }))
  data.balance_sheet['2026-09'] = bs
}

if (data.cash_flow?.['2026-08']) {
  const cf = JSON.parse(JSON.stringify(data.cash_flow['2026-08']))
  cf.operating = cf.operating.map((l) =>
    l.label === 'Net income' ? { ...l, amount: sep.profit } : { ...l, amount: round(l.amount * f * 0.9) },
  )
  cf.cashEnd = round(cf.cashEnd + (sep.profit - aug.profit))
  cf.netChange = round(cf.cashEnd - cf.cashStart)
  data.cash_flow['2026-09'] = cf
}

if (data.stock_by_month?.['2026-08']) {
  const st = JSON.parse(JSON.stringify(data.stock_by_month['2026-08']))
  st.label = 'Sep 30, 2026'
  data.stock_by_month['2026-09'] = st
}

if (data.items_by_month?.['2026-08']) {
  data.items_by_month['2026-09'] = data.items_by_month['2026-08'].map((row) => ({
    ...row,
    revenue: round(row.revenue * f),
    units: Math.round(row.units * f),
  }))
}

const mixAug = data.sales_mix_aug
const mixSep = mixAug.map((s) => {
  const revenue = round(s.revenue * f)
  return { ...s, revenue, pct: round((revenue / sep.revenue) * 1000) / 10 }
})
let mixFix = sep.revenue - mixSep.reduce((s, x) => s + x.revenue, 0)
if (mixFix) mixSep[0].revenue = round(mixSep[0].revenue + mixFix)
data.sales_mix_sep = mixSep

const topAug = data.top_tire_sizes_aug
const topSep = topAug.map((t) => ({
  ...t,
  units: Math.max(1, Math.round(t.units * f)),
  revenue: round(t.revenue * f),
}))
let topRevFix = 0
const topSixTarget = round(data.aug_tire_sales.top_six_revenue * f)
let topRev = topSep.reduce((s, x) => s + x.revenue, 0)
topRevFix = round(topSixTarget - topRev)
if (topRevFix) topSep[0].revenue = round(topSep[0].revenue + topRevFix)
data.top_tire_sizes_sep = topSep

const augT = data.aug_tire_sales
data.sep_tire_sales = {
  new_tire_revenue: round(augT.new_tire_revenue * f),
  used_tire_revenue: round(augT.used_tire_revenue * f),
  new_tire_units: sep.newTireUnits,
  used_tire_units: sep.usedTireUnits,
  tire_revenue_total: round(augT.tire_revenue_total * f),
  tires_sold_units: sep.tiresSold,
  top_six_revenue: topSep.reduce((s, x) => s + x.revenue, 0),
  top_six_units: topSep.reduce((s, x) => s + x.units, 0),
}

data.ytd_revenue = data.monthly.reduce((s, m) => s + m.revenue, 0)

data.period_stats['2026-09'] = {
  revenue: sep.revenue,
  unitsSold: Math.round(data.period_stats['2026-08'].unitsSold * f),
  uniqueItems: 13,
  ticketCount: sep.ticketCount,
}
const all = data.period_stats.all
data.period_stats.all = {
  revenue: data.ytd_revenue,
  unitsSold: all.unitsSold + data.period_stats['2026-09'].unitsSold - Math.round(data.period_stats['2026-08'].unitsSold * (f - 1)),
  uniqueItems: 13,
  ticketCount: all.ticketCount + sep.ticketCount - aug.ticketCount,
}
data.period_stats.all.unitsSold = data.monthly.reduce((s, m) => s + (data.period_stats[m.month]?.unitsSold || 0), 0)
data.period_stats.all.ticketCount = data.monthly.reduce((s, m) => s + m.ticketCount, 0)

if (data.equity_summary_aug) {
  data.equity_summary_sep = {
    ...data.equity_summary_aug,
    net_income_ytd: round(data.equity_summary_aug.net_income_ytd + sep.profit),
    total: round(data.equity_summary_aug.total + (sep.profit - aug.profit)),
  }
}

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
console.log('Added September 2026', { ytd: data.ytd_revenue, profit: sep.profit, mixSum: mixSep.reduce((s, x) => s + x.revenue, 0) })

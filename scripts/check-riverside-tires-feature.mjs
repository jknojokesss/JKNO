#!/usr/bin/env node
/**
 * Riverside /riverside-tires — daily close + open-period ties.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  buildDailyCloseModel,
  buildDailyCloseJournal,
  assertDailyCloseTies,
} from '../components/samples/riverside/riversideDailyClose.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(root, '../data/riverside-tires.json')
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

const round2 = (n) => Math.round(n * 100) / 100

const failures = []
const ok = (label, cond) => {
  if (!cond) failures.push(label)
  else console.log('ok', label)
}

const AS_OF = data.meta.as_of
const WEEK_START = data.meta.week_start
const orders = data.orders.map((o) => ({ ...o, profit: o.sale - o.cost }))

const inPeriod = (o, period) => {
  if (period === '7d') return o.date >= WEEK_START && o.date <= AS_OF
  if (period === 'month') return o.date.slice(0, 7) === AS_OF.slice(0, 7) && o.date <= AS_OF
  return true
}

const totalsOf = (rows) => ({
  sale: rows.reduce((s, o) => s + o.sale, 0),
  tickets: rows.length,
})

const monthTotals = totalsOf(orders.filter((o) => inPeriod(o, 'month')))
const weekTotals = totalsOf(orders.filter((o) => inPeriod(o, '7d')))

ok('header Oct 2026', data.meta.sample_header === 'Sample — fictitious numbers · as of Oct 2026')
ok('as of Oct 17', AS_OF === '2026-10-17')
ok('no order after as_of', orders.every((o) => o.date <= AS_OF))
ok('open month sales 7037', Math.abs(monthTotals.sale - 7037) < 0.01)
ok('open month tickets 22', monthTotals.tickets === 22)
ok('last 7d matches month sales', Math.abs(weekTotals.sale - monthTotals.sale) < 0.01)
ok('last 7d matches month tickets', weekTotals.tickets === monthTotals.tickets)

const { model, errors } = assertDailyCloseTies(data, orders, monthTotals)
ok('daily close Oct 12-17', model.days.length === 6 && model.days[0].date === '2026-10-12' && model.days[5].date === '2026-10-17')
ok('daily close assert bundle', errors.length === 0)
if (errors.length) console.error(errors)

ok('daily register sum', Math.abs(model.totalRegister - monthTotals.sale) < 0.02)
ok('daily ticket sum', model.totalTickets === monthTotals.tickets)

const shorts = model.days.filter((d) => d.status === 'Short')
const overs = model.days.filter((d) => d.status === 'Over')
ok('has short day', shorts.length >= 1)
ok('has over day', overs.length >= 1)
ok('mostly balanced', model.days.filter((d) => d.status === 'Balanced').length >= model.days.length - 2)

model.days.forEach((day) => {
  const je = buildDailyCloseJournal(day)
  ok(`JE balanced ${day.date}`, Math.abs(je.debitTotal - je.creditTotal) < 0.02)
  ok(`JE sales ${day.date}`, Math.abs(je.salesCredits - je.registerSales) < 0.05)
  const visibleOs = Math.round((day.cashDrawer.cashToDeposit + day.cardBatch.batchTotal - day.registerSales) * 100) / 100
  ok(`visible over/short ${day.date}`, Math.abs(visibleOs - day.overShort) < 0.02)
  ok(`list cash is deposit ${day.date}`, Math.abs(day.cashDrawer.cashToDeposit - (day.cashDrawer.cashCounted - day.cashDrawer.startingCash)) < 0.02)
  const { tires, service, other, tax } = day.salesSplit
  const taxable = round2(tires + service + other)
  ok(`split sums ${day.date}`, Math.abs(taxable + tax - day.registerSales) < 0.02)
  ok(`tax is 7% ${day.date}`, tax === round2(taxable * 0.07))
  const osLine = je.lines.find((l) => l.account === 'Cash over / short')
  if (day.status === 'Short') ok(`JE short line ${day.date}`, osLine && osLine.debit > 0)
  if (day.status === 'Over') ok(`JE over line ${day.date}`, osLine && osLine.credit > 0)
  if (day.status === 'Balanced') ok(`JE no os line ${day.date}`, !osLine)
})

const buildPlNet = (keys) => {
  const sections = { income: [], cogs: [], expense: [] }
  keys.forEach((k) => {
    ;['income', 'cogs', 'expense'].forEach((sec) => {
      ;(data.pl_by_month[k]?.[sec] || []).forEach((l) => {
        const hit = sections[sec].find((x) => x.label === l.label)
        if (hit) hit.amount += l.amount
        else sections[sec].push({ label: l.label, amount: l.amount })
      })
    })
  })
  const inc = round2(sections.income.reduce((s, l) => s + l.amount, 0))
  const cogs = round2(sections.cogs.reduce((s, l) => s + l.amount, 0))
  const exp = round2(sections.expense.reduce((s, l) => s + l.amount, 0))
  return round2(inc - cogs - exp)
}

const closedKeys = data.monthly.map((m) => m.month)
const profitByMonthTotal = round2(data.monthly.reduce((s, m) => s + m.profit, 0))
const plJanSepNet = buildPlNet(closedKeys)
ok('P&L net Jan-Sep = profit-by-month total', plJanSepNet === profitByMonthTotal)

const portalSrc = fs.readFileSync(path.join(root, '../components/samples/riverside/RiversideTiresPortal.js'), 'utf8')
const utilsSrc = fs.readFileSync(path.join(root, '../components/samples/riverside/riversideUtils.js'), 'utf8')
const portalNoTemplates = portalSrc.replace(/\$\{[^}]+\}/g, '')
ok('Riverside no accounting paren ($', !/\(\$/.test(portalNoTemplates))
ok('Riverside paren helper uses minus', /-\$\{fmt0\(-n\)\}/.test(utilsSrc))

const augTop = data.top_tire_sizes_aug.map((t) => t.units).join(',')
const sepTop = data.top_tire_sizes_sep.map((t) => t.units).join(',')
ok('Sep top sizes differ from Aug', augTop !== sepTop)
ok('Sep sales items month present', Array.isArray(data.sales_items_by_month?.['2026-09']))
const sepItemsRev = round2(data.sales_items_by_month['2026-09'].reduce((s, i) => s + i.revenue, 0))
ok('Sep items revenue = Sep month', sepItemsRev === data.monthly.find((m) => m.month === '2026-09').revenue)

if (failures.length) {
  console.error('FAILED:', failures)
  process.exit(1)
}
console.log('riverside-tires feature checks passed.', {
  days: model.days.length,
  register: model.totalRegister,
  tickets: model.totalTickets,
  plJanSepNet,
  profitByMonthTotal,
})

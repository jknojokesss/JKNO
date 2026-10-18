import {
  AS_OF_DATE,
  AREAS,
  STORES,
  PRODUCTS,
  WEEKS,
  PRIOR_WEEKS,
  SOLD,
  EXPIRED,
  PRIOR_MONTH,
  INVOICES,
  PNL_LINES,
  PNL_ENTRIES,
} from './mrDipzData.js'
import { DISTRIBUTOR_DEDUCTIONS, DEDUCTION_AS_OF } from './mrDipzDeductionsData.js'

/** Mr. Dipz sample tokens, copied from the Primal Krisp sample so neither file depends on the other. */
export const CHAR = '#2B2018'
export const SPICE = '#C8462C'
export const KRAFT = '#A9763A'
export const CREAM = '#F6F0E6'
export const CARDBG = '#FFFDF9'
export const INK = '#2B2018'
export const MUTED = '#8A7A66'
export const BORDER = '#E6DBC8'
export const GREEN = '#3E7C4F'
export const RED = '#C03A22'
export const UI = "'DM Sans', system-ui, sans-serif"
export const MONO = UI

const LOCALE = 'en-US'
const intFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const moneyFormatter = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const fmtInt = (n) => intFormatter.format(Math.round(n))

/** Every amount in the model is integer cents; format only here. */
export const money = (cents) => {
  const v = Math.round(cents)
  if (v < 0) return '-$' + moneyFormatter.format(Math.abs(v) / 100)
  return '$' + moneyFormatter.format(v / 100)
}

export const moneySigned = (cents) => (Math.round(cents) > 0 ? '+' : '') + money(cents)

export const pct1 = (n) => (Math.round(n * 10) / 10).toFixed(1) + '%'

export const pctOf = (part, whole) => (whole ? (part / whole) * 100 : 0)

export const fmtD = (iso) => {
  if (!iso) return '—'
  const [, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}

export const deltaColor = (delta, { cost = false } = {}) => {
  if (!delta) return MUTED
  if (cost) return delta > 0 ? RED : GREEN
  return delta > 0 ? GREEN : RED
}

const cents = (dollars) => Math.round(dollars * 100)
const sum = (arr, f = (x) => x) => arr.reduce((t, x) => t + f(x), 0)
const DAY_MS = 86400000
const PRIOR_WEEK_IDS = new Set(PRIOR_WEEKS.map((w) => w.id))
const priorWeekLabel = Object.fromEntries(PRIOR_WEEKS.map((w) => [w.id, w.label]))

const round2 = (n) => Math.round(n * 100) / 100

const DEDUCTION_STATUS_LABEL = {
  matched: 'Matched',
  'needs-backup': 'Needs backup',
  dispute: 'Dispute',
}

function buildDeductions(productById) {
  const rows = DISTRIBUTOR_DEDUCTIONS.map((d) => {
    const invoiceAmount = cents(d.invoiceAmount)
    const paidAmount = cents(d.paidAmount)
    const amount = invoiceAmount - paidAmount
    const daysLeft = Math.max(0, 90 - daysBetween(d.remittanceDate, DEDUCTION_AS_OF))
    const product = d.memoProductId ? productById[d.memoProductId] : null
    return {
      id: d.id,
      ref: d.ref,
      remittanceDate: d.remittanceDate,
      invoiceNo: d.invoiceNo,
      invoiceDate: d.invoiceDate,
      invoiceAmount,
      paidAmount,
      amount,
      code: d.code,
      status: d.status,
      statusLabel: DEDUCTION_STATUS_LABEL[d.status],
      daysLeft,
      backup: d.backup,
      memoProductId: d.memoProductId,
      memoDesc: d.memoDesc,
      memoProductName: product?.name || null,
    }
  })
  const summary = {
    total: sum(rows, (r) => r.amount),
    matched: sum(rows.filter((r) => r.status === 'matched'), (r) => r.amount),
    needsBackup: sum(rows.filter((r) => r.status === 'needs-backup'), (r) => r.amount),
    dispute: sum(rows.filter((r) => r.status === 'dispute'), (r) => r.amount),
  }
  const sepExpired = sum(
    rows.filter((r) => r.code === 'Expired' && r.invoiceDate.startsWith('2026-09')),
    (r) => r.amount,
  )
  const openReview = summary.needsBackup + summary.dispute
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]))
  return { rows, byId, summary, sepExpired, openReview, asOf: DEDUCTION_AS_OF }
}

/** Split August store totals into four delivery weeks (fictitious; used for open August invoices). */
function priorWeekNets(priorSales, priorCredits) {
  const weights = [0.24, 0.25, 0.24, 0.27]
  const ids = PRIOR_WEEKS.map((w) => w.id)
  const nets = {}
  let salesRun = 0
  let creditsRun = 0
  ids.forEach((id, i) => {
    const sales = round2(priorSales * weights[i])
    const credits = round2(priorCredits * weights[i])
    nets[id] = { sales, credits }
    salesRun += sales
    creditsRun += credits
  })
  nets.pw4.sales = round2(priorSales - salesRun + nets.pw4.sales)
  nets.pw4.credits = round2(priorCredits - creditsRun + nets.pw4.credits)
  return nets
}

export const BUCKETS = [
  { id: 'b0', label: '0–30 days', short: '0–30' },
  { id: 'b1', label: '31–60 days', short: '31–60' },
  { id: 'b2', label: '61–90 days', short: '61–90' },
  { id: 'b3', label: 'Over 90 days', short: 'Over 90' },
]

export const daysBetween = (fromIso, toIso) =>
  Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS)

export const bucketOf = (days) => (days <= 30 ? 'b0' : days <= 60 ? 'b1' : days <= 90 ? 'b2' : 'b3')

const zeroAging = () => ({ b0: 0, b1: 0, b2: 0, b3: 0, total: 0 })
const zeroWeeks = () => WEEKS.map(() => 0)

export function buildMrDipzModel() {
  const productById = Object.fromEntries(
    PRODUCTS.map((p) => [p.id, { ...p, priceC: cents(p.price) }]),
  )
  const weekIndex = Object.fromEntries(WEEKS.map((w, i) => [w.id, i]))

  const stores = STORES.map((s) => {
    const sold = SOLD[s.id] || {}
    const expired = EXPIRED[s.id] || {}
    const productIds = PRODUCTS.map((p) => p.id).filter((id) => sold[id] || expired[id])
    const byProduct = productIds.map((pid) => {
      const p = productById[pid]
      const delivered = sold[pid] || zeroWeeks()
      const exp = expired[pid] || zeroWeeks()
      const salesW = delivered.map((u) => u * p.priceC)
      const creditsW = exp.map((u) => u * p.priceC)
      return {
        productId: pid,
        name: p.name,
        delivered,
        expired: exp,
        units: sum(delivered),
        expUnits: sum(exp),
        salesW,
        creditsW,
        sales: sum(salesW),
        credits: sum(creditsW),
      }
    })
    const byWeek = WEEKS.map((w, i) => {
      const sales = sum(byProduct, (r) => r.salesW[i])
      const credits = sum(byProduct, (r) => r.creditsW[i])
      return {
        weekId: w.id,
        label: w.label,
        units: sum(byProduct, (r) => r.delivered[i]),
        expUnits: sum(byProduct, (r) => r.expired[i]),
        sales,
        credits,
        net: sales - credits,
      }
    })
    const expiredEntries = []
    WEEKS.forEach((w, i) => {
      byProduct.forEach((r) => {
        if (r.expired[i]) {
          expiredEntries.push({
            weekId: w.id,
            weekLabel: w.label,
            productId: r.productId,
            name: r.name,
            units: r.expired[i],
            amount: r.creditsW[i],
          })
        }
      })
    })

    const prior = PRIOR_MONTH[s.id] || { sales: 0, credits: 0 }
    const aging = zeroAging()
    const augustWeeks = priorWeekNets(prior.sales, prior.credits)
    const invoices = (INVOICES[s.id] || []).map((inv) => {
      const days = daysBetween(inv.date, AS_OF_DATE)
      const bucket = bucketOf(days)
      const amount = cents(inv.amount)
      const status = String(inv.status).toLowerCase()
      let weekId = inv.week
      let weekLabel = null
      let weekSales = null
      let weekCredits = null
      if (weekId && PRIOR_WEEK_IDS.has(weekId)) {
        const pw = augustWeeks[weekId]
        weekLabel = priorWeekLabel[weekId]
        weekSales = cents(pw.sales)
        weekCredits = cents(pw.credits)
      } else if (weekId != null) {
        const wk = byWeek[weekIndex[weekId]]
        if (wk) {
          weekLabel = wk.label
          weekSales = wk.sales
          weekCredits = wk.credits
        }
      }
      if (status === 'open') {
        aging[bucket] += amount
        aging.total += amount
      }
      return {
        no: inv.no,
        date: inv.date,
        storeId: s.id,
        storeName: s.name,
        amount,
        status,
        days,
        bucket,
        weekId,
        weekLabel,
        weekSales,
        weekCredits,
      }
    })

    const sales = sum(byProduct, (r) => r.sales)
    const credits = sum(byProduct, (r) => r.credits)
    const priorSales = cents(prior.sales)
    const priorCredits = cents(prior.credits)
    return {
      id: s.id,
      name: s.name,
      areaId: s.area,
      byProduct,
      byWeek,
      expiredEntries,
      invoices,
      openInvoices: invoices.filter((i) => i.status === 'open'),
      paidInvoices: invoices.filter((i) => i.status === 'paid'),
      aging,
      owed: aging.total,
      units: sum(byProduct, (r) => r.units),
      expUnits: sum(byProduct, (r) => r.expUnits),
      sales,
      credits,
      net: sales - credits,
      pct: pctOf(credits, sales),
      priorSales,
      priorCredits,
      priorPct: pctOf(priorCredits, priorSales),
    }
  })
  const storeById = Object.fromEntries(stores.map((s) => [s.id, s]))

  const products = PRODUCTS.map((p) => {
    const rows = stores.flatMap((s) =>
      s.byProduct.filter((r) => r.productId === p.id).map((r) => ({ ...r, storeId: s.id, storeName: s.name, areaId: s.areaId })),
    )
    const byWeek = WEEKS.map((w, i) => ({
      weekId: w.id,
      label: w.label,
      units: sum(rows, (r) => r.delivered[i]),
      expUnits: sum(rows, (r) => r.expired[i]),
      sales: sum(rows, (r) => r.salesW[i]),
      credits: sum(rows, (r) => r.creditsW[i]),
    }))
    const byArea = AREAS.map((a) => {
      const ar = rows.filter((r) => r.areaId === a.id)
      return {
        areaId: a.id,
        name: a.name,
        units: sum(ar, (r) => r.units),
        expUnits: sum(ar, (r) => r.expUnits),
        sales: sum(ar, (r) => r.sales),
        credits: sum(ar, (r) => r.credits),
      }
    }).filter((r) => r.units || r.expUnits)
    const sales = sum(rows, (r) => r.sales)
    const credits = sum(rows, (r) => r.credits)
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      size: p.size,
      priceC: cents(p.price),
      units: sum(rows, (r) => r.units),
      expUnits: sum(rows, (r) => r.expUnits),
      sales,
      credits,
      net: sales - credits,
      pct: pctOf(credits, sales),
      byWeek,
      byArea,
      topStores: rows
        .filter((r) => r.expUnits > 0)
        .sort((a, b) => b.expUnits - a.expUnits || b.credits - a.credits)
        .slice(0, 5),
    }
  }).filter((p) => p.units || p.expUnits)
  const productAgg = Object.fromEntries(products.map((p) => [p.id, p]))

  const areas = AREAS.map((a) => {
    const list = stores.filter((s) => s.areaId === a.id)
    const aging = zeroAging()
    list.forEach((s) => {
      Object.keys(aging).forEach((k) => {
        aging[k] += s.aging[k]
      })
    })
    const sales = sum(list, (s) => s.sales)
    const credits = sum(list, (s) => s.credits)
    const priorSales = sum(list, (s) => s.priorSales)
    const priorCredits = sum(list, (s) => s.priorCredits)
    const creditsByProduct = products
      .map((p) => {
        const rs = list.flatMap((s) => s.byProduct.filter((r) => r.productId === p.id))
        return {
          productId: p.id,
          name: p.name,
          expUnits: sum(rs, (r) => r.expUnits),
          credits: sum(rs, (r) => r.credits),
          sales: sum(rs, (r) => r.sales),
        }
      })
      .filter((r) => r.expUnits)
    const byWeek = WEEKS.map((w, i) => ({
      weekId: w.id,
      label: w.label,
      expUnits: sum(list, (s) => s.byWeek[i].expUnits),
      sales: sum(list, (s) => s.byWeek[i].sales),
      credits: sum(list, (s) => s.byWeek[i].credits),
    }))
    return {
      id: a.id,
      name: a.name,
      storeIds: list.map((s) => s.id),
      sales,
      credits,
      net: sales - credits,
      pct: pctOf(credits, sales),
      priorSales,
      priorCredits,
      priorPct: pctOf(priorCredits, priorSales),
      owed: aging.total,
      aging,
      creditsByProduct,
      byWeek,
    }
  })
  const areaById = Object.fromEntries(areas.map((a) => [a.id, a]))

  const weeks = WEEKS.map((w, i) => {
    const byStore = stores
      .map((s) => ({
        storeId: s.id,
        name: s.name,
        expUnits: s.byWeek[i].expUnits,
        credits: s.byWeek[i].credits,
        sales: s.byWeek[i].sales,
      }))
      .filter((r) => r.expUnits)
      .sort((a, b) => b.credits - a.credits)
    const byProduct = products
      .map((p) => ({ productId: p.id, name: p.name, expUnits: p.byWeek[i].expUnits, credits: p.byWeek[i].credits }))
      .filter((r) => r.expUnits)
      .sort((a, b) => b.credits - a.credits)
    const sales = sum(stores, (s) => s.byWeek[i].sales)
    const credits = sum(stores, (s) => s.byWeek[i].credits)
    return {
      id: w.id,
      label: w.label,
      sales,
      credits,
      expUnits: sum(stores, (s) => s.byWeek[i].expUnits),
      pct: pctOf(credits, sales),
      byStore,
      byProduct,
    }
  })
  const weekById = Object.fromEntries(weeks.map((w) => [w.id, w]))

  const aging = zeroAging()
  areas.forEach((a) => {
    Object.keys(aging).forEach((k) => {
      aging[k] += a.aging[k]
    })
  })
  const openInvoices = stores
    .flatMap((s) => s.openInvoices)
    .sort((a, b) => b.days - a.days || a.storeName.localeCompare(b.storeName))

  const sales = sum(stores, (s) => s.sales)
  const credits = sum(stores, (s) => s.credits)
  const priorSales = sum(stores, (s) => s.priorSales)
  const priorCredits = sum(stores, (s) => s.priorCredits)
  const totals = {
    sales,
    credits,
    net: sales - credits,
    pct: pctOf(credits, sales),
    units: sum(stores, (s) => s.units),
    expUnits: sum(stores, (s) => s.expUnits),
    priorSales,
    priorCredits,
    priorNet: priorSales - priorCredits,
    priorPct: pctOf(priorCredits, priorSales),
    salesChangePct: pctOf(sales - priorSales, priorSales),
    owed: aging.total,
    aging,
  }

  const pnl = buildPnl({ sep: { sales, credits }, aug: { sales: priorSales, credits: priorCredits } })

  const deductions = buildDeductions(productById)
  const expiredByFlavor = products
    .filter((p) => p.units > 0)
    .map((p) => ({
      productId: p.id,
      name: p.name,
      sold: p.units,
      expired: p.expUnits,
      expiredPct: pctOf(p.expUnits, p.units),
      credits: p.credits,
    }))
    .sort((a, b) => b.expired - a.expired || b.credits - a.credits)

  return {
    stores,
    storeById,
    areas,
    areaById,
    products,
    productAgg,
    weeks,
    weekById,
    openInvoices,
    totals,
    pnl,
    deductions,
    expiredByFlavor,
  }
}

function buildPnl(revenue) {
  const month = (key) => {
    const lines = PNL_LINES.map((l) => {
      const entries = (PNL_ENTRIES[key][l.id] || []).map(([description, amount]) => ({ description, amount: cents(amount) }))
      return { id: l.id, label: l.label, group: l.group, entries, amount: sum(entries, (e) => e.amount) }
    })
    const cogs = sum(lines.filter((l) => l.group === 'cogs'), (l) => l.amount)
    const opex = sum(lines.filter((l) => l.group === 'opex'), (l) => l.amount)
    const gross = revenue[key].sales
    const credits = -revenue[key].credits
    const netSales = gross + credits
    const grossProfit = netSales - cogs
    return {
      lines: Object.fromEntries(lines.map((l) => [l.id, l])),
      gross,
      credits,
      netSales,
      cogs,
      grossProfit,
      opex,
      netProfit: grossProfit - opex,
    }
  }
  return {
    sep: month('sep'),
    aug: month('aug'),
    cogsLines: PNL_LINES.filter((l) => l.group === 'cogs'),
    opexLines: PNL_LINES.filter((l) => l.group === 'opex'),
  }
}

/** Reference totals from the spec; every check must read OK. */
export function verifyMrDipzTotals() {
  const m = buildMrDipzModel()
  const t = m.totals
  const expect = {
    'September gross sales': [t.sales, 9179975],
    'September credits': [t.credits, 850500],
    'September net after credits': [t.net, 8329475],
    'August sales': [t.priorSales, 7831900],
    'August credits': [t.priorCredits, 694875],
    'Owed by stores': [t.owed, 5309325],
    '0–30 days': [t.aging.b0, 4590225],
    '31–60 days': [t.aging.b1, 501150],
    '61–90 days': [t.aging.b2, 146050],
    'Over 90 days': [t.aging.b3, 71900],
    'September net profit': [m.pnl.sep.netProfit, 576523],
    'August net profit': [m.pnl.aug.netProfit, -24253],
  }
  const out = {}
  Object.entries(expect).forEach(([k, [got, want]]) => {
    out[k] = got === want ? `OK ${money(got)}` : `MISMATCH ${money(got)} expected ${money(want)}`
  })
  out['Credit % September'] = pct1(t.pct) === '9.3%' ? 'OK 9.3%' : `MISMATCH ${pct1(t.pct)}`
  out['Credit % August'] = pct1(t.priorPct) === '8.9%' ? 'OK 8.9%' : `MISMATCH ${pct1(t.priorPct)}`
  out['Sales vs last month'] = pct1(t.salesChangePct) === '17.2%' ? 'OK +17.2%' : `MISMATCH ${pct1(t.salesChangePct)}`

  const badInvoices = m.stores.flatMap((s) =>
    s.invoices
      .filter(
        (i) =>
          i.weekId
          && !PRIOR_WEEK_IDS.has(i.weekId)
          && i.weekSales - i.weekCredits !== i.amount,
      )
      .map((i) => i.no),
  )
  out['September invoices = week sales − credits'] = badInvoices.length ? `MISMATCH ${badInvoices.join(', ')}` : 'OK'
  const areaSum = sum(m.areas, (a) => a.sales) === t.sales && sum(m.areas, (a) => a.credits) === t.credits
  out['Areas sum to totals'] = areaSum ? 'OK' : 'MISMATCH'
  const prodSum = sum(m.products, (p) => p.sales) === t.sales && sum(m.products, (p) => p.credits) === t.credits
  out['Products sum to totals'] = prodSum ? 'OK' : 'MISMATCH'
  const weekSum = sum(m.weeks, (w) => w.credits) === t.credits
  out['Weeks sum to credits'] = weekSum ? 'OK' : 'MISMATCH'
  out.allOk = Object.values(out).every((v) => String(v).startsWith('OK'))
  return out
}

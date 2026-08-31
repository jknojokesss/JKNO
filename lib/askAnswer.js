// Reydel Ask — answers from the portal's own numbers. No model, no API bill.
// If the question isn't one of these, say so instead of guessing.

const MONTHS = { '01': 'January', '02': 'February', '03': 'March', '04': 'April', '05': 'May', '06': 'June', '07': 'July', '08': 'August', '09': 'September', '10': 'October', '11': 'November', '12': 'December' }
const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(n || 0))
const pct = (n) => `${Math.round(n)}%`
const monthName = (key) => MONTHS[String(key).slice(5, 7)] || key

export const STARTERS = [
  'What was my best month this year?',
  'How’s my cash looking?',
  'What’s driving the business — tires or service?',
  'Which tire sizes sell best?',
  'How’s this month going?',
]

const CASH_ACCTS = ['TOTAL CHECKING (8059) - 1', 'BUS COMPLETE CHK (5998) - 1', 'Bank of America 7875', 'BOA Savings', 'Savings 1651']
const SERVICE_RE = /align|mount|balance|patch|plug|rotat|labor|install|valve|tpms|service|repair|brake|sensor|wiper|batter|light|bulb|\bair\b|spare|lug|rim|stud|seal|oil|filter|fix|swap|band/

export function saleCategory(name) {
  const n = (name || '').toLowerCase().trim()
  if (!n) return 'other'
  if (n.length <= 5 && /tip/.test(n)) return 'tips'
  if (/\d{3}[\s/\\-]?\d{2}[\s/\\-]?r?\d{2}/.test(n)) return 'new_tire'
  if (/used/.test(n)) return 'used_tire'
  if (SERVICE_RE.test(n)) return 'service'
  return 'other'
}

export function normalizeItemName(name) {
  if (!name) return 'Unknown'
  return name.replace(/(\d{3})[\s/\-]?(\d{2})[\s/\-]?R(\d{2})/gi, '$1/$2/$3').replace(/(\d{3})\s(\d{2})\s(\d{2})/g, '$1/$2/$3').trim()
}

export function buildFacts({ monthly = [], bs = [], clover = [], today = new Date() } = {}) {
  const curKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const closed = (monthly || []).filter((m) => m.month < curKey)
  const last = closed[closed.length - 1] || null
  const bestSales = closed.reduce((b, m) => (!b || m.revenue > b.revenue ? m : b), null)
  const bestProfit = closed.reduce((b, m) => (!b || m.profit > b.profit ? m : b), null)
  const ytd = closed.filter((m) => m.month.slice(0, 4) === curKey.slice(0, 4))
  const cash = (bs || []).filter((r) => CASH_ACCTS.includes(r.account)).reduce((s, r) => s + Number(r.amount || 0), 0)

  const lastRows = last ? clover.filter((r) => r.date && r.date.slice(0, 7) === last.month) : []
  const mix = { new_tire: 0, service: 0, used_tire: 0, other: 0 }
  lastRows.forEach((r) => {
    const c = saleCategory(r.item_name)
    if (c === 'tips') return
    mix[mix[c] != null ? c : 'other'] += Number(r.revenue || 0)
  })
  const mixTotal = Object.values(mix).reduce((s, v) => s + v, 0)

  const sizes = {}
  lastRows.forEach((r) => {
    if (saleCategory(r.item_name) !== 'new_tire') return
    const k = normalizeItemName(r.item_name)
    if (!sizes[k]) sizes[k] = { name: k, revenue: 0, units: 0 }
    sizes[k].revenue += Number(r.revenue || 0)
    sizes[k].units += Number(r.quantity || 1)
  })
  const topSizes = Object.values(sizes).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const openRows = clover.filter((r) => r.date && r.date.slice(0, 7) === curKey)
  const openSales = openRows.reduce((s, r) => s + Number(r.revenue || 0), 0)

  return {
    today: today.toISOString().slice(0, 10),
    openMonth: curKey,
    openMonthName: monthName(curKey),
    booksThrough: last ? last.month : null,
    booksThroughName: last ? monthName(last.month) : null,
    closed: closed.map((m) => ({
      month: m.month,
      name: monthName(m.month),
      revenue: m.revenue,
      profit: m.profit,
      margin: m.revenue ? (m.profit / m.revenue) * 100 : 0,
    })),
    last,
    bestSales,
    bestProfit,
    ytdRevenue: ytd.reduce((s, m) => s + m.revenue, 0),
    ytdProfit: ytd.reduce((s, m) => s + m.profit, 0),
    cash,
    mix,
    mixTotal,
    topSizes,
    openSales,
    openTickets: new Set(openRows.map((r) => r.order_id).filter(Boolean)).size,
  }
}

function bestMonth(f) {
  if (!f.bestSales) return 'I don’t have a closed month on the books yet.'
  const s = f.bestSales
  const p = f.bestProfit
  const salesBit = `${monthName(s.month)} was your best sales month — ${usd(s.revenue)}.`
  if (p && p.month !== s.month) {
    return `${salesBit} ${monthName(p.month)} made more profit though: ${usd(p.profit)} on ${usd(p.revenue)} in sales (${pct(p.revenue ? (p.profit / p.revenue) * 100 : 0)} net). Books are through ${f.booksThroughName}.`
  }
  return `${salesBit} Net profit that month was ${usd(s.profit)} (${pct(s.revenue ? (s.profit / s.revenue) * 100 : 0)}). Books are through ${f.booksThroughName}.`
}

function lastDayLabel(key) {
  if (!key) return ''
  const y = Number(key.slice(0, 4)), mo = Number(key.slice(5, 7))
  const d = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  return `${monthName(key)} ${d}`
}

function cash(f) {
  if (!f.booksThrough) return 'I don’t have a closed month on the books yet.'
  return `As of ${lastDayLabel(f.booksThrough)} (last closed month) checking and savings were about ${usd(f.cash)}. That’s QuickBooks, not the register. ${f.openMonthName} isn’t closed yet. Clover Clearing and the drawer are not in that number.`
}

function mix(f) {
  if (!f.mixTotal) return `I don’t have Clover mix for ${f.booksThroughName || 'the last closed month'} yet.`
  const share = (k) => pct((f.mix[k] / f.mixTotal) * 100)
  return `In ${f.booksThroughName}, new tires were ${share('new_tire')} of register sales, service & repair ${share('service')}, used tires ${share('used_tire')}. So it’s mostly a tire shop, with a real service arm.`
}

function sizes(f) {
  if (!f.topSizes.length) return `I don’t have tire-size sales for ${f.booksThroughName || 'the last closed month'} yet.`
  const lead = f.topSizes.slice(0, 3).map((s) => s.name).join(', ')
  const topRev = f.topSizes.reduce((s, x) => s + x.revenue, 0)
  const tireRev = f.mix.new_tire || topRev
  const half = tireRev ? Math.round((topRev / tireRev) * 100) : 0
  return `${lead} led in ${f.booksThroughName}. Your top five sizes were ${pct(half)} of new-tire sales that month.`
}

function thisMonth(f) {
  return `${f.openMonthName} at the register is about ${usd(f.openSales)} in Clover tickets so far${f.openTickets ? ` across ${f.openTickets.toLocaleString()} ticket${f.openTickets === 1 ? '' : 's'}` : ''}. That’s not closed books — cost isn’t in QuickBooks yet.`
}

function lastClosed(f) {
  if (!f.last) return 'I don’t have a closed month on the books yet.'
  const m = f.last
  return `${monthName(m.month)} (closed): ${usd(m.revenue)} sales, ${usd(m.profit)} net (${pct(m.revenue ? (m.profit / m.revenue) * 100 : 0)}). Year to date through that month: ${usd(f.ytdRevenue)} sales, ${usd(f.ytdProfit)} profit.`
}

export function answerAsk(question, facts) {
  const t = String(question || '').toLowerCase().trim()
  if (!t) return { unmatched: true, answer: 'Ask about sales, cash, what sold, or this month at the register.' }

  if (/this month|so far|august|register|today|tonight/.test(t) && !/best month|july|last month|closed/.test(t)) {
    return { unmatched: false, answer: thisMonth(facts) }
  }
  if (/cash|bank|checking|savings|in the bank/.test(t)) return { unmatched: false, answer: cash(facts) }
  if (/size|sizes|popular|what sells|selling best/.test(t)) return { unmatched: false, answer: sizes(facts) }
  if (/tire|service|mix|driving|what.?s selling/.test(t) && !/size/.test(t)) return { unmatched: false, answer: mix(facts) }
  if (/best month|strongest|record|highest sales/.test(t)) return { unmatched: false, answer: bestMonth(facts) }
  if (/july|last month|closed|profit|margin|year to date|\bytd\b|how.?d i do/.test(t)) {
    return { unmatched: false, answer: lastClosed(facts) }
  }

  return {
    unmatched: true,
    answer: 'I can answer from your books about sales, cash, tires vs service, sizes, and this month at the register. Try one of those, or pick a question below.',
  }
}

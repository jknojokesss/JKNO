import { requireAdmin } from '../../../lib/requireAdmin'
import { getLiveToken, QboAuthError } from '../../../lib/qboAuth'
import { fetchAccountRefs } from '../../../lib/qboWrite'

// ── Prepare the monthly inventory-relief journal entry ───────────────────
//
//   POST /api/qbo/prepare-close  { client: 'reydel', month: '2026-07' }
//
// Runs the existing inventory-COGS report (the same engine as the live
// orders tab), takes that month's relief figures, and guesses the two
// accounts off the client's real chart. Returns journal entry lines ready
// to drop into /admin/qbo-push.
//
// It prepares. It does not post. Preview and confirm still apply.
//
// The report endpoint guards itself with WELDON_IMPORT_TOKEN; we hold that
// server-side and call ourselves, so the token never reaches the browser.

// The inventory report is slow — it pages every Clover line and runs the FIFO
// layers. It declares maxDuration 60, and this route waits on it, so it needs
// at least as long. Without this the default cut it off and Vercel returned
// its HTML timeout page, which the browser then tried to parse as JSON.
export const config = { maxDuration: 60 }

function baseUrl(req) {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const proto = req.headers['x-forwarded-proto'] || 'http'
  return `${proto}://${req.headers.host}`
}

// The report hardcodes a relief block per month it knows how to close.
const RELIEF_KEY = { '2026-06': 'june_relief', '2026-07': 'july_relief' }

const pick = (accounts, tests) => {
  for (const t of tests) {
    const hit = accounts.filter((a) => a.active && t(a))
    if (hit.length === 1) return hit[0]
    if (hit.length > 1) return hit.sort((a, b) => a.fullName.length - b.fullName.length)[0]
  }
  return null
}
const has = (a, s) => a.fullName.toLowerCase().includes(s)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const gate = await requireAdmin(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  const client = String((req.body && req.body.client) || 'reydel').toLowerCase().replace(/[^a-z0-9-]/g, '')
  const month = String((req.body && req.body.month) || '')
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'month must be YYYY-MM.' })

  const key = RELIEF_KEY[month]
  if (!key) {
    return res.status(400).json({
      error: `The inventory report only closes ${Object.keys(RELIEF_KEY).join(' and ')} so far. A new month needs its stock layers added to pages/api/inventory-cogs.js first.`,
    })
  }

  const token = process.env.WELDON_IMPORT_TOKEN
  if (!token) return res.status(500).json({ error: 'WELDON_IMPORT_TOKEN is not set, so the inventory report cannot be read.' })

  try {
    // The report and the chart of accounts have nothing to do with each
    // other, so do not make the second wait on the first — this route is
    // already close to the function time limit because the report is slow.
    const reportP = (async () => {
      const r = await fetch(`${baseUrl(req)}/api/inventory-cogs?token=${encodeURIComponent(token)}`)
      const text = await r.text()
      let j
      try { j = JSON.parse(text) } catch (e) {
        throw new Error(`The inventory report did not return data (HTTP ${r.status}). It may have timed out.`)
      }
      if (!r.ok || j.error) throw new Error(j.error || `inventory-cogs returned ${r.status}`)
      return j
    })()

    const accountsP = (async () => {
      const { env, token: qboToken, realmId } = await getLiveToken(client)
      return { env, accounts: await fetchAccountRefs(env, qboToken, realmId) }
    })()

    const [report, acctBundle] = await Promise.all([reportP, accountsP])
    const { env, accounts } = acctBundle

    const relief = report[key]
    if (!relief) throw new Error(`The report had no ${key}.`)

    // Last day of the month — the entry belongs at period end.
    const [y, mm] = month.split('-').map(Number)
    const txnDate = new Date(Date.UTC(y, mm, 0)).toISOString().slice(0, 10)

    const cogs = pick(accounts, [
      (a) => a.type === 'Cost of Goods Sold' && !has(a, 'used'),
      (a) => has(a, 'cost of goods') && !has(a, 'used'),
      (a) => has(a, 'cogs') && !has(a, 'used'),
    ])
    const usedCogs = pick(accounts, [
      (a) => a.type === 'Cost of Goods Sold' && has(a, 'used'),
      (a) => has(a, 'used') && (has(a, 'cogs') || has(a, 'cost')),
    ]) || cogs
    const inventory = pick(accounts, [
      (a) => a.subType === 'Inventory',
      (a) => has(a, 'inventory asset'),
      (a) => has(a, 'inventory'),
    ])

    const invSales = Number(relief.inventory_sales) || 0
    const used = Number(relief.used_tires) || 0
    const total = Math.round((invSales + used) * 100) / 100

    const lines = []
    if (invSales) lines.push({ account: cogs ? cogs.fullName : 'Cost of Goods Sold', debit: invSales, credit: 0, description: `Inventory sold in ${month}` })
    if (used) lines.push({ account: usedCogs ? usedCogs.fullName : 'Cost of Goods Sold', debit: used, credit: 0, description: `Used tires sold in ${month} (${Math.round(used / 18)} @ $18)` })
    if (total) lines.push({ account: inventory ? inventory.fullName : 'Inventory Asset', debit: 0, credit: total, description: 'Relieve inventory' })

    const drift = Math.round((invSales - (Number(relief.cross_check_sale_ledger) || 0)) * 100) / 100

    res.json({
      ok: true,
      txnDate,
      docNumber: `JK-${client.toUpperCase()}-${month}-INV`,
      memo: `Inventory relief ${month} — stock movement method`,
      lines,
      guessed: {
        cogs: cogs ? cogs.fullName : null,
        usedCogs: usedCogs ? usedCogs.fullName : null,
        inventory: inventory ? inventory.fullName : null,
        allMatched: !!(cogs && inventory),
      },
      workings: {
        opening_stock: relief.begin_5_31 != null ? relief.begin_5_31 : relief.begin_6_30,
        stock_purchased: relief.june_stock_purchases != null ? relief.june_stock_purchases : relief.july_stock_purchases,
        closing_stock: relief.end_6_30 != null && key === 'june_relief' ? relief.end_6_30 : relief.end_7_31,
        inventory_sold: invSales,
        used_tires: used,
        total_relief: total,
        sale_ledger_cross_check: relief.cross_check_sale_ledger,
        drift_vs_cross_check: drift,
      },
      company: env.sandbox ? 'SANDBOX' : 'PRODUCTION',
    })
  } catch (e) {
    if (e instanceof QboAuthError) return res.status(409).json({ error: e.message, needsReconnect: e.needsReconnect })
    res.status(500).json({ error: String(e.message || e) })
  }
}

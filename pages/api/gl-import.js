import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { rebuildFinancials } from '../../lib/rebuildFinancials'

// Reydel's client_id
const CLIENT_ID = 'dc442b88-5ed1-44be-a908-dcbc945827b3'

const round2 = (n) => Math.round(n * 100) / 100
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '')

function cleanRows(rows) {
  const out = []
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!isDate(r?.date)) continue
    const account = String(r.account || '').trim()
    if (!account) continue
    const amount = Number(r.amount)
    if (!Number.isFinite(amount)) continue
    out.push({
      client_id: CLIENT_ID,
      date: r.date,
      account,
      type: String(r.type || '').slice(0, 120),
      description: String(r.description || '').slice(0, 400),
      split_account: String(r.split_account || '').slice(0, 200),
      amount: round2(amount),
      source: 'quickbooks',
    })
  }
  return out
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  // Admins only — verify the caller's Supabase session, then the admins table.
  const jwt = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const { data: { user } = {} } = await supabaseAdmin.auth.getUser(jwt)
  if (!user) return res.status(401).json({ error: 'Not signed in' })
  const { data: admin } = await supabaseAdmin
    .from('admins').select('email').eq('email', user.email).maybeSingle()
  if (!admin) return res.status(403).json({ error: 'Admins only' })

  const rows = cleanRows(req.body?.rows)
  if (rows.length < 10) {
    return res.status(400).json({ error: `Only ${rows.length} valid GL rows parsed — refusing to wipe the ledger. Check the file.` })
  }

  try {
    // ----- replace the general ledger -----
    const del = await supabaseAdmin.from('gl_transactions').delete().eq('client_id', CLIENT_ID)
    if (del.error) throw new Error(`clearing GL: ${del.error.message}`)

    const CH = 500
    for (let i = 0; i < rows.length; i += CH) {
      const ins = await supabaseAdmin.from('gl_transactions').insert(rows.slice(i, i + CH))
      if (ins.error) throw new Error(`inserting GL: ${ins.error.message}`)
    }

    // ----- rebuild P&L + monthly + balance sheet from the new ledger -----
    const summary = await rebuildFinancials(CLIENT_ID)

    return res.status(200).json({ ok: true, glRows: rows.length, ...summary })
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }
}

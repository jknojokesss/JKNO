// POST /api/jerky/invoice-send  Body: { id: <store_invoices uuid>, email? }
// Asks QuickBooks to email an already-created invoice to the store.
import { getLiveToken } from '../../../lib/qboAuth'
import { sendInvoice } from '../../../lib/qboWrite'
import { requireJerkyUser } from '../../../lib/requireJerkyUser'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  const b = req.body || {}
  const id = b.id ? String(b.id) : null
  if (!id) return res.status(400).json({ error: 'Pass an invoice id.' })

  try {
    const { data: row } = await gate.db.from('store_invoices')
      .select('qb_invoice_id').eq('id', id).maybeSingle()
    if (!row || !row.qb_invoice_id) return res.status(404).json({ error: 'No QuickBooks invoice on this record.' })

    const { env, token, realmId } = await getLiveToken('jerky')
    await sendInvoice(env, token, realmId, row.qb_invoice_id, b.email || null)

    await gate.db.from('store_invoices').update({ sent_at: new Date().toISOString() }).eq('id', id)
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(e.needsReconnect ? 409 : 500).json({ error: String(e.message || e) })
  }
}

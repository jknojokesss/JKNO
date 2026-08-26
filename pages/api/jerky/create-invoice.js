// POST /api/jerky/create-invoice
// Body: { partnerId, storeName, customerId?, txnDate, dueDate?, memo?, send?, email?,
//         lines: [{ itemId, item?, qty, unitPrice, description? }] }
// Creates a real invoice in Efraim's QuickBooks, optionally emails it, and
// records it in Jerky's store_invoices so the portal's A/R view stays in sync.
import { getLiveToken } from '../../../lib/qboAuth'
import { fetchCustomerRefs, resolveCustomer, buildInvoice, postInvoice, fetchInvoicePdf, fetchInvoiceEmailPrefs, nextInvoiceNumber } from '../../../lib/qboWrite'
import { requireJerkyUser } from '../../../lib/requireJerkyUser'
import { sendInvoiceEmail, jerkyMailerConfigured } from '../../../lib/jerkyMailer'

const round2 = (n) => Math.round(Number(n) * 100) / 100

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const gate = await requireJerkyUser(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

  const b = req.body || {}
  const lines = Array.isArray(b.lines) ? b.lines.filter((l) => l && l.itemId && Number(l.qty) > 0) : []
  if (!lines.length) return res.status(400).json({ error: 'Add at least one line with an item and quantity.' })
  const txnDate = b.txnDate || new Date().toISOString().slice(0, 10)

  try {
    const { env, token, realmId } = await getLiveToken('jerky')
    const customers = await fetchCustomerRefs(env, token, realmId)

    let customer = b.customerId ? customers.find((c) => c.id === b.customerId) : null
    if (!customer && b.storeName) { const r = resolveCustomer(customers, b.storeName); if (r.customer) customer = r.customer }
    if (!customer) return res.status(400).json({ error: `No QuickBooks customer for "${b.storeName || b.customerId}". Set one up in QuickBooks first.` })

    // If QB has "Custom transaction numbers" on, it will NOT auto-number an
    // API invoice — supply the next sequential number ourselves. (Off = omit,
    // and QuickBooks numbers it.)
    const prefs = await fetchInvoiceEmailPrefs(env, token, realmId).catch(() => null)
    let docNumber = null
    if (prefs && prefs.customTxnNumbers) docNumber = await nextInvoiceNumber(env, token, realmId).catch(() => null)

    // record the store's email on the invoice for the record, but delivery is
    // via our own SMTP (from accounting@jerkymunch.com), not Intuit's mailer
    const recipient = b.email || customer.email || null
    const built = buildInvoice({
      customerId: customer.id, customerName: customer.name, txnDate, dueDate: b.dueDate || null,
      memo: b.memo || null, billEmail: recipient, lines, docNumber,
    })
    if (built.errors.length) return res.status(400).json({ error: built.errors.join(' ') })

    // requestid makes an accidental double-submit idempotent on Intuit's side
    const requestId = `jm-${(b.partnerId || 'x').slice(0, 8)}-${Date.now()}`
    const posted = await postInvoice(env, token, realmId, built.payload, requestId)
    const inv = posted.Invoice || {}

    let sent = false, sendError = null
    if (b.send) {
      try {
        if (!jerkyMailerConfigured()) throw new Error("Email isn't set up yet — add the SMTP credentials.")
        if (!recipient) throw new Error('No email address on file for this store.')
        const pdf = await fetchInvoicePdf(env, token, realmId, inv.Id)
        await sendInvoiceEmail({ to: recipient, storeName: customer.name, docNumber: inv.DocNumber, total: built.total, dueDate: b.dueDate || null, pdf, subject: prefs && prefs.subject, message: prefs && prefs.message })
        sent = true
      } catch (e) { sendError = String(e.message || e) }
    }

    // record locally for the portal's A/R view (service-role, bypasses RLS)
    const totalQty = round2(lines.reduce((s, l) => s + Number(l.qty || 0), 0))
    const single = lines.length === 1 ? lines[0] : null
    const row = {
      partner_id: b.partnerId || null,
      inv_date: txnDate,
      units: single ? Math.round(Number(single.qty)) : Math.round(totalQty),
      unit_price: single ? round2(single.unitPrice) : null,
      amount: built.total,
      description: b.memo || lines.map((l) => `${l.qty}× ${l.item || 'item'}`).join(', '),
      due_date: b.dueDate || null,
      status: 'unpaid',
      qb_invoice_id: inv.Id || null,
      qb_doc_number: inv.DocNumber || null,
      qb_sync_token: inv.SyncToken != null ? String(inv.SyncToken) : null,
      line_item: single ? (single.item || null) : `${lines.length} items`,
      sent_at: sent ? new Date().toISOString() : null,
      source: 'app',
    }
    const { data: saved, error: saveErr } = await gate.db.from('store_invoices').insert(row).select('id').maybeSingle()

    return res.status(200).json({
      ok: true,
      docNumber: inv.DocNumber || null,
      qbId: inv.Id || null,
      total: built.total,
      customer: customer.name,
      sent, sendError,
      invoiceId: saved ? saved.id : null,
      saveError: saveErr ? saveErr.message : null,
    })
  } catch (e) {
    return res.status(e.needsReconnect ? 409 : 500).json({ error: String(e.message || e) })
  }
}

import { qboGet } from './qbo'

// ── Live AR reads from a client's QuickBooks ─────────────────────────────
// SERVER-SIDE ONLY. Open invoices via the entity query endpoint, and the
// invoice PDF exactly as QuickBooks generates it — the same file QBO itself
// would email, template and logo included.

export async function fetchOpenInvoices(env, accessToken, realmId) {
  const out = []
  for (let start = 1; ; start += 1000) {
    const q = `select * from Invoice where Balance > '0' startposition ${start} maxresults 1000`
    const json = await qboGet(env, accessToken, `/v3/company/${realmId}/query?query=${encodeURIComponent(q)}`)
    const batch = (json.QueryResponse && json.QueryResponse.Invoice) || []
    out.push(...batch)
    if (batch.length < 1000) break
  }
  return out
    .map((i) => ({
      id: i.Id,
      doc: i.DocNumber || i.Id,
      date: i.TxnDate || null,
      due: i.DueDate || null,
      total: Number(i.TotalAmt || 0),
      balance: Number(i.Balance || 0),
      customer: (i.CustomerRef && i.CustomerRef.name) || '—',
      email: (i.BillEmail && i.BillEmail.Address) || null,
      emailStatus: i.EmailStatus || null, // EmailSent / NeedToSend / NotSet
    }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

export async function fetchInvoice(env, accessToken, realmId, invoiceId) {
  const json = await qboGet(env, accessToken, `/v3/company/${realmId}/invoice/${invoiceId}`)
  return json.Invoice
}

export async function fetchInvoicePdf(env, accessToken, realmId, invoiceId) {
  const res = await fetch(`${env.apiBase}/v3/company/${realmId}/invoice/${invoiceId}/pdf`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/pdf' },
  })
  if (!res.ok) {
    const tid = res.headers.get('intuit_tid')
    const body = await res.text().catch(() => '')
    const err = new Error(`QBO PDF ${res.status} for invoice ${invoiceId}${tid ? ` [tid ${tid}]` : ''}: ${body.slice(0, 300)}`)
    err.status = res.status
    err.intuitTid = tid
    throw err
  }
  return Buffer.from(await res.arrayBuffer())
}

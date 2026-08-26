import { qboGet } from './qbo'
import { qboPost } from './qboWrite'

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

// Customers and sellable items, for the create-invoice pickers.
export async function fetchArRefs(env, accessToken, realmId) {
  // select * — Intuit's field-list projection can drop nested objects like
  // PrimaryEmailAddr, and the read costs the same either way.
  const page = async (entity) => {
    const out = []
    for (let start = 1; ; start += 1000) {
      const q = `select * from ${entity} where Active = true startposition ${start} maxresults 1000`
      const json = await qboGet(env, accessToken, `/v3/company/${realmId}/query?query=${encodeURIComponent(q)}`)
      const batch = (json.QueryResponse && json.QueryResponse[entity]) || []
      out.push(...batch)
      if (batch.length < 1000) break
    }
    return out
  }
  const [customers, items] = await Promise.all([page('Customer'), page('Item')])
  return {
    customers: customers.map((c) => ({
      id: c.Id, name: c.DisplayName,
      email: (c.PrimaryEmailAddr && c.PrimaryEmailAddr.Address) || null,
    })),
    // Category rows aren't sellable and QBO rejects them on a line.
    items: items.filter((i) => i.Type !== 'Category').map((i) => ({
      id: i.Id, name: i.Name, type: i.Type, rate: i.UnitPrice != null ? Number(i.UnitPrice) : null,
    })),
  }
}

// Next invoice number. With QBO's "custom transaction numbers" on, the API
// does NOT auto-number — an invoice posted without a DocNumber lands blank —
// so we assign max(numeric DocNumbers) + 1 ourselves.
export async function nextDocNumber(env, accessToken, realmId) {
  const docs = []
  for (let start = 1; ; start += 1000) {
    const q = `select Id, DocNumber from Invoice startposition ${start} maxresults 1000`
    const json = await qboGet(env, accessToken, `/v3/company/${realmId}/query?query=${encodeURIComponent(q)}`)
    const batch = (json.QueryResponse && json.QueryResponse.Invoice) || []
    docs.push(...batch.map((i) => i.DocNumber))
    if (batch.length < 1000) break
  }
  const nums = docs.filter((d) => /^\d+$/.test(String(d || ''))).map(Number)
  return String((nums.length ? Math.max(...nums) : 1000) + 1)
}

const round2 = (n) => Math.round(Number(n) * 100) / 100

/**
 * Plain fields → a QBO Invoice payload. Validates before anything is sent.
 * lines: [{ itemId, description?, qty, rate }]
 * Returns { payload, errors, total, summary }.
 */
export function buildInvoice({ customerId, txnDate, dueDate, emailTo, lines, docNumber }, refs) {
  const errors = []
  const cust = refs.customers.find((c) => String(c.id) === String(customerId))
  if (!cust) errors.push('Pick a customer.')
  if (txnDate && !/^\d{4}-\d{2}-\d{2}$/.test(txnDate)) errors.push('Invoice date must be YYYY-MM-DD.')
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) errors.push('Due date must be YYYY-MM-DD.')
  if (emailTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo)) errors.push('The email address does not look valid.')
  if (!Array.isArray(lines) || lines.length === 0) errors.push('Add at least one line.')

  let total = 0
  const Line = (lines || []).map((l, i) => {
    const n = i + 1
    const item = refs.items.find((x) => String(x.id) === String(l.itemId))
    if (!item) errors.push(`Line ${n}: pick a product/service.`)
    const qty = round2(l.qty || 0)
    const rate = round2(l.rate || 0)
    if (qty <= 0) errors.push(`Line ${n}: quantity must be positive.`)
    if (rate <= 0) errors.push(`Line ${n}: rate must be positive.`)
    const amount = round2(qty * rate)
    total = round2(total + amount)
    return {
      DetailType: 'SalesItemLineDetail',
      Amount: amount,
      Description: l.description || undefined,
      SalesItemLineDetail: {
        ItemRef: item ? { value: item.id, name: item.name } : undefined,
        Qty: qty,
        UnitPrice: rate,
      },
    }
  })
  if (total <= 0) errors.push('The invoice total is zero.')

  if (docNumber && String(docNumber).length > 21) errors.push('Invoice number is longer than the 21 characters QuickBooks allows.')

  const payload = { CustomerRef: cust ? { value: cust.id, name: cust.name } : undefined, Line }
  if (docNumber) payload.DocNumber = String(docNumber)
  if (txnDate) payload.TxnDate = txnDate
  if (dueDate) payload.DueDate = dueDate
  const email = emailTo || (cust && cust.email)
  if (email) payload.BillEmail = { Address: email }

  return { payload, errors, total, summary: { customer: cust ? cust.name : null, email: email || null, total, doc: docNumber ? String(docNumber) : null } }
}

export function postInvoice(env, accessToken, realmId, payload, requestId) {
  return qboPost(env, accessToken, realmId, 'invoice', payload, { requestId })
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

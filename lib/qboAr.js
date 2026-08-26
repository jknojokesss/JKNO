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
      doc: i.DocNumber || null, // null = blank number (custom txn numbers + API create)
      date: i.TxnDate || null,
      due: i.DueDate || null,
      total: Number(i.TotalAmt || 0),
      balance: Number(i.Balance || 0),
      customer: (i.CustomerRef && i.CustomerRef.name) || '—',
      customerId: (i.CustomerRef && i.CustomerRef.value) || null,
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

export async function fetchRecentPayments(env, accessToken, realmId, sinceISO) {
  const out = []
  for (let start = 1; ; start += 1000) {
    const q = `select * from Payment where TxnDate >= '${sinceISO}' startposition ${start} maxresults 1000`
    const json = await qboGet(env, accessToken, `/v3/company/${realmId}/query?query=${encodeURIComponent(q)}`)
    const batch = (json.QueryResponse && json.QueryResponse.Payment) || []
    out.push(...batch)
    if (batch.length < 1000) break
  }
  return out.map((p) => ({
    id: p.Id,
    date: p.TxnDate || null,
    amount: Number(p.TotalAmt || 0),
    ref: p.PaymentRefNum || null,
    customerId: (p.CustomerRef && p.CustomerRef.value) || null,
  }))
}

// ── The statement itself ─────────────────────────────────────────────────
// QuickBooks has no statement API, so this is our document: open items,
// recent payments, aging strip. Email-safe HTML — tables and inline styles
// only, no external assets — so it renders in Gmail/Outlook as sent.
const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (s) => s ? new Date(s + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '—'
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function buildStatementHtml({ companyName, fromEmail, customerName, invoices, payments, asOf }) {
  const DAY = 86400000
  const asOfMs = new Date(asOf + 'T00:00:00Z').getTime()
  const total = invoices.reduce((s, i) => s + i.balance, 0)
  const buckets = [0, 0, 0, 0, 0]
  const labels = ['Current', '1–30 days', '31–60 days', '61–90 days', '90+ days']
  for (const i of invoices) {
    const dpd = i.due ? Math.round((asOfMs - new Date(i.due + 'T00:00:00Z').getTime()) / DAY) : 0
    buckets[dpd <= 0 ? 0 : dpd <= 30 ? 1 : dpd <= 60 ? 2 : dpd <= 90 ? 3 : 4] += i.balance
  }
  const rows = [...invoices].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((i) => {
    const dpd = i.due ? Math.round((asOfMs - new Date(i.due + 'T00:00:00Z').getTime()) / DAY) : 0
    return `<tr>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E2DA;font-size:13px;color:#4A5158">${fmtDate(i.date)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E2DA;font-size:13px;color:#1B2027;font-weight:600">${i.doc ? '#' + esc(i.doc) : '—'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E2DA;font-size:13px;color:${dpd > 0 ? '#1B2027' : '#4A5158'};font-weight:${dpd > 0 ? 700 : 400}">${fmtDate(i.due)}${dpd > 0 ? ` · ${dpd}d past due` : ''}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E2DA;font-size:13px;color:#4A5158;text-align:right">${fmtMoney(i.total)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E2DA;font-size:13px;color:#1B2027;font-weight:700;text-align:right">${fmtMoney(i.balance)}</td>
    </tr>`
  }).join('')
  const payRows = payments.map((p) => `<tr>
      <td style="padding:6px 10px;border-bottom:1px solid #E5E2DA;font-size:12.5px;color:#4A5158">${fmtDate(p.date)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #E5E2DA;font-size:12.5px;color:#4A5158">Payment${p.ref ? ' #' + esc(p.ref) : ''}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #E5E2DA;font-size:12.5px;color:#4A5158;text-align:right">${fmtMoney(p.amount)}</td>
    </tr>`).join('')
  const agingCells = labels.map((l, k) => `<td style="padding:8px 10px;background:#F6F5F1;border-top:2px solid ${k >= 3 && buckets[k] > 0 ? '#1B2027' : '#C7C3B8'};font-size:11px">
      <div style="font-size:9px;letter-spacing:.08em;color:#7C838C;font-weight:700;text-transform:uppercase">${l}</div>
      <div style="font-size:13px;font-weight:700;color:${buckets[k] > 0 ? '#1B2027' : '#9AA0A8'}">${buckets[k] > 0 ? fmtMoney(buckets[k]) : '—'}</div>
    </td>`).join('')

  return `<div style="max-width:640px;margin:0 auto;font-family:-apple-system,'Segoe UI',Arial,sans-serif;background:#FFFFFF;border:1px solid #E5E2DA;border-radius:4px;padding:28px">
    <table style="width:100%;border-collapse:collapse"><tr>
      <td><div style="font-size:19px;font-weight:700;color:#1B2027">${esc(companyName)}</div>
        <div style="font-size:11px;color:#7C838C;line-height:1.6;margin-top:4px">${esc(fromEmail)}</div></td>
      <td style="text-align:right;vertical-align:top"><div style="font-size:16px;letter-spacing:.14em;color:#4A5158">STATEMENT</div>
        <div style="font-size:11.5px;color:#4A5158;margin-top:4px">as of ${fmtDate(asOf)}</div></td>
    </tr></table>
    <table style="width:100%;border-collapse:collapse;margin:18px 0 14px"><tr>
      <td><div style="font-size:9.5px;letter-spacing:.1em;color:#7C838C;font-weight:700">FOR</div>
        <div style="font-size:13px;color:#1B2027;font-weight:600;margin-top:2px">${esc(customerName)}</div></td>
      <td style="text-align:right"><div style="font-size:10px;letter-spacing:.1em;color:#7C838C;font-weight:700">AMOUNT DUE</div>
        <div style="font-size:24px;font-weight:700;color:#1B2027">${fmtMoney(total)}</div></td>
    </tr></table>
    <div style="font-size:10px;letter-spacing:.1em;color:#7C838C;font-weight:700;margin:0 0 4px">OPEN INVOICES</div>
    <table style="width:100%;border-collapse:collapse">
      <tr>${['Date', 'Invoice', 'Due', 'Amount', 'Open balance'].map((h, k) => `<th style="text-align:${k >= 3 ? 'right' : 'left'};padding:6px 10px;border-bottom:1px solid #4A5158;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:#7C838C">${h}</th>`).join('')}</tr>
      ${rows}
      <tr><td colspan="4" style="padding:8px 10px;background:#EEEBE3;font-size:13px;font-weight:700;color:#1B2027">Total due</td>
      <td style="padding:8px 10px;background:#EEEBE3;font-size:14px;font-weight:700;color:#1B2027;text-align:right">${fmtMoney(total)}</td></tr>
    </table>
    ${payments.length ? `<div style="font-size:10px;letter-spacing:.1em;color:#7C838C;font-weight:700;margin:16px 0 4px">PAYMENTS RECEIVED — LAST 60 DAYS. THANK YOU.</div>
    <table style="width:100%;border-collapse:collapse">${payRows}</table>` : ''}
    <table style="width:100%;border-collapse:separate;border-spacing:2px;margin-top:16px"><tr>${agingCells}</tr></table>
    <div style="font-size:10.5px;color:#7C838C;margin-top:14px;line-height:1.6">Questions about this statement? Just reply to this email — it comes straight back to ${esc(fromEmail)}.</div>
  </div>`
}

/** Stamp a DocNumber onto an existing invoice (sparse update — touches nothing else). */
export async function setInvoiceDocNumber(env, accessToken, realmId, invoiceId, docNumber) {
  const inv = await fetchInvoice(env, accessToken, realmId, invoiceId)
  if (!inv) throw new Error(`No invoice ${invoiceId} in QuickBooks.`)
  const out = await qboPost(env, accessToken, realmId, 'invoice', {
    Id: inv.Id, SyncToken: String(inv.SyncToken), sparse: true, DocNumber: String(docNumber),
  })
  return out.Invoice
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

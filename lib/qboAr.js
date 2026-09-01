import { qboGet } from './qbo'
import { qboPost } from './qboWrite'

// ── Live AR reads from a client's QuickBooks ─────────────────────────────
// SERVER-SIDE ONLY. Open invoices via the entity query endpoint, and the
// invoice PDF exactly as QuickBooks generates it — the same file QBO itself
// would email, template and logo included.

const PAGE = 1000
const CONCURRENCY = 6
const MAX_PAGES = 60   // 60,000 rows; a runaway loop is worse than a truncation

/**
 * Retry the transient failures. Intuit returns 504 on queries it decides are
 * taking too long — including, seen in the wild, `select count(*)` against a
 * company with a dozen invoices — and 429 when several pages land at once.
 * Neither says anything about our request, so both are worth one more go.
 */
async function withRetry(fn, what) {
  let last
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await fn() } catch (e) {
      const transient = e.status === 429 || (e.status >= 500 && e.status <= 599)
      if (!transient || attempt === 2) throw e
      last = e
      await new Promise((r) => setTimeout(r, 400 * Math.pow(3, attempt)))
    }
  }
  throw last
}

/**
 * Every row of an entity, fetched in parallel.
 *
 * Paging used to walk startposition serially, so a 7,000-row read was seven
 * round trips end to end and felt like it. Asking Intuit for the count first
 * made the pages parallel — but that count is the one call Intuit reliably
 * 504s on, and it sat in front of everything, so a book of twelve invoices
 * could fail to load at all.
 *
 * So: no count. Fetch the first page, and stop there if it comes back short,
 * which is the common case and now costs ONE call instead of two. Only a book
 * big enough to fill a page goes on, reading ahead in parallel batches and
 * stopping at the first short page.
 */
async function pagedQuery(env, token, realmId, entity, where) {
  const w = where ? ` where ${where}` : ''
  // No explicit orderby: QBO returns entity queries ordered by Id, which is
  // the stable key paging needs. Adding one costs query time for nothing.
  const ask = (start) => withRetry(
    () => qboGet(env, token, `/v3/company/${realmId}/query?query=${encodeURIComponent(
      `select * from ${entity}${w} startposition ${start} maxresults ${PAGE}`)}`),
    `${entity} page at ${start}`,
  ).then((json) => (json.QueryResponse && json.QueryResponse[entity]) || [])

  const out = await ask(1)
  if (out.length < PAGE) return out

  for (let page = 1; page < MAX_PAGES;) {
    const batch = []
    for (let k = 0; k < CONCURRENCY && page + k < MAX_PAGES; k++) {
      batch.push(ask((page + k) * PAGE + 1))
    }
    const rows = await Promise.all(batch)
    for (const r of rows) out.push(...r)
    // A short page is the end of the results; anything read past it in this
    // batch came back empty and cost nothing but the call.
    if (rows.some((r) => r.length < PAGE)) break
    page += batch.length
  }
  return out
}

export function fetchOpenInvoices(env, accessToken, realmId, { fresh = false } = {}) {
  return cachedRead(realmId, 'open-invoices', () => fetchOpenInvoicesUncached(env, accessToken, realmId), fresh)
}

async function fetchOpenInvoicesUncached(env, accessToken, realmId) {
  const out = await pagedQuery(env, accessToken, realmId, 'Invoice', "Balance > '0'")
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

/** One invoice by the number a customer sees, not the internal id. */
export async function fetchInvoiceByDoc(env, accessToken, realmId, docNumber) {
  const safe = String(docNumber).replace(/'/g, "''").slice(0, 40)
  const json = await qboGet(env, accessToken,
    `/v3/company/${realmId}/query?query=${encodeURIComponent(`select * from Invoice where DocNumber = '${safe}'`)}`)
  const rows = (json.QueryResponse && json.QueryResponse.Invoice) || []
  return rows[0] || null
}

export async function fetchInvoice(env, accessToken, realmId, invoiceId) {
  const json = await qboGet(env, accessToken, `/v3/company/${realmId}/invoice/${invoiceId}`)
  return json.Invoice
}

// ── A short-lived read cache ─────────────────────────────────────────────
// A 7,000-invoice book is several calls to Intuit even fetched in parallel,
// and Intuit meters reads. Opening a statement, printing a run and refreshing
// the list would each pay that again. Cached per realm for a couple of minutes;
// `fresh` (the Refresh button) always bypasses it. Per-instance and
// best-effort by design — a stale read here costs nothing, so it is not
// worth a shared cache.
const readCache = new Map()
const READ_TTL_MS = 2 * 60 * 1000

export function invalidateAr(realmId) {
  for (const k of [...readCache.keys()]) if (k.startsWith(`${realmId}:`)) readCache.delete(k)
}

async function cachedRead(realmId, name, fn, fresh) {
  const key = `${realmId}:${name}`
  if (!fresh) {
    const hit = readCache.get(key)
    if (hit && Date.now() - hit.at < READ_TTL_MS) return hit.value
  }
  const value = await fn()
  readCache.set(key, { at: Date.now(), value })
  return value
}

// Customers and sellable items, for the create-invoice pickers.
export async function fetchArRefs(env, accessToken, realmId) {
  // select * — Intuit's field-list projection can drop nested objects like
  // PrimaryEmailAddr, and the read costs the same either way.
  const page = (entity) => pagedQuery(env, accessToken, realmId, entity, 'Active = true')
  // Fetched independently: if one list fails or comes back empty, the other
  // still reaches the form, so a picker is never mysteriously blank.
  const [cRes, iRes] = await Promise.allSettled([page('Customer'), page('Item')])
  if (cRes.status === 'rejected' && iRes.status === 'rejected') throw cRes.reason
  const customers = cRes.status === 'fulfilled' ? cRes.value : []
  const items = iRes.status === 'fulfilled' ? iRes.value : []
  return {
    warnings: [
      cRes.status === 'rejected' ? `Customers could not be read: ${cRes.reason.message}` : null,
      iRes.status === 'rejected' ? `Products/services could not be read: ${iRes.reason.message}` : null,
    ].filter(Boolean),
    customers: customers.map((c) => ({
      id: c.Id, name: c.DisplayName,
      email: (c.PrimaryEmailAddr && c.PrimaryEmailAddr.Address) || null,
    })),
    // Category rows aren't sellable and QBO rejects them on a line.
    // Description matters as much as the price: in QuickBooks, choosing a
    // product/service fills the invoice line's description from the item.
    items: items.filter((i) => i.Type !== 'Category').map((i) => ({
      id: i.Id, name: i.Name, type: i.Type,
      rate: i.UnitPrice != null ? Number(i.UnitPrice) : null,
      description: i.Description || '',
    })),
  }
}

// Next invoice number. With QBO's "custom transaction numbers" on, the API
// does NOT auto-number — an invoice posted without a DocNumber lands blank —
// so we assign max(numeric DocNumbers) + 1 ourselves.
export async function nextDocNumber(env, accessToken, realmId) {
  // This used to read EVERY invoice the company has ever written, unfiltered
  // and one page at a time — on a book whose numbers are past 100,000 that is
  // a hundred round trips before a preview can even appear. Numbering is
  // sequential, so the most recently created invoices carry the highest
  // number: ask for those, in a single call.
  const recent = await qboGet(env, accessToken,
    `/v3/company/${realmId}/query?query=${encodeURIComponent('select Id, DocNumber from Invoice orderby MetaData.CreateTime desc maxresults 200')}`)
  const rows = (recent.QueryResponse && recent.QueryResponse.Invoice) || []
  const nums = rows.map((i) => i.DocNumber).filter((d) => /^\d+$/.test(String(d || ''))).map(Number)
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
    // A negative rate is legitimate and common — consignment credits,
    // discounts, returns all ride on the invoice as a negative line. Only a
    // zero line is meaningless, and the invoice total is checked below.
    if (rate === 0) errors.push(`Line ${n}: needs a rate.`)
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
  if (total <= 0) errors.push('The invoice total has to be more than zero — the credits cancel out the charges.')

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
  const out = await pagedQuery(env, accessToken, realmId, 'Payment', `TxnDate >= '${sinceISO}'`)
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
// Dashes as entities everywhere in this document: it travels as email HTML
// and gets previewed from blob URLs, both places where a missing charset
// declaration turns literal UTF-8 dashes into mojibake.
const MDASH = '&mdash;'
const fmtDate = (s) => s ? new Date(s + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : MDASH
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function buildStatementHtml({ companyName, fromEmail, customerName, invoices, payments, asOf }) {
  const DAY = 86400000
  const asOfMs = new Date(asOf + 'T00:00:00Z').getTime()
  const total = invoices.reduce((s, i) => s + i.balance, 0)
  const buckets = [0, 0, 0, 0, 0]
  const labels = ['Current', '1&ndash;30 days', '31&ndash;60 days', '61&ndash;90 days', '90+ days']
  for (const i of invoices) {
    const dpd = i.due ? Math.round((asOfMs - new Date(i.due + 'T00:00:00Z').getTime()) / DAY) : 0
    buckets[dpd <= 0 ? 0 : dpd <= 30 ? 1 : dpd <= 60 ? 2 : dpd <= 90 ? 3 : 4] += i.balance
  }
  const rows = [...invoices].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((i) => {
    const dpd = i.due ? Math.round((asOfMs - new Date(i.due + 'T00:00:00Z').getTime()) / DAY) : 0
    return `<tr>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E2DA;font-size:13px;color:#4A5158">${fmtDate(i.date)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E2DA;font-size:13px;color:#1B2027;font-weight:600">${i.doc ? '#' + esc(i.doc) : MDASH}</td>
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
      <div style="font-size:13px;font-weight:700;color:${buckets[k] > 0 ? '#1B2027' : '#9AA0A8'}">${buckets[k] > 0 ? fmtMoney(buckets[k]) : MDASH}</div>
    </td>`).join('')

  return `<div style="max-width:640px;margin:0 auto;font-family:-apple-system,'Segoe UI',Arial,sans-serif;background:#FFFFFF;border:1px solid #E5E2DA;border-radius:4px;padding:28px">
    <table style="width:100%;border-collapse:collapse"><tr>
      <td><div style="font-size:19px;font-weight:700;color:#1B2027">${esc(companyName)}</div>
        ${fromEmail ? `<div style="font-size:11px;color:#7C838C;line-height:1.6;margin-top:4px">${esc(fromEmail)}</div>` : ''}</td>
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
    ${payments.length ? `<div style="font-size:10px;letter-spacing:.1em;color:#7C838C;font-weight:700;margin:16px 0 4px">PAYMENTS RECEIVED &mdash; LAST 60 DAYS. THANK YOU.</div>
    <table style="width:100%;border-collapse:collapse">${payRows}</table>` : ''}
    <table style="width:100%;border-collapse:separate;border-spacing:2px;margin-top:16px"><tr>${agingCells}</tr></table>
    <div style="font-size:10.5px;color:#7C838C;margin-top:14px;line-height:1.6">Questions about this statement? Just reply to this email${fromEmail ? ` &mdash; it comes straight back to ${esc(fromEmail)}` : ''}.</div>
  </div>`
}

// One read of the books, reused by every statement built from it. A batch
// run must not re-query Intuit per customer — reads are metered, and a
// 30-customer run would otherwise cost 60 report calls.
function arSnapshot(env, token, realmId, fresh) {
  return cachedRead(realmId, 'ar-snapshot', async () => {
    const asOf = new Date().toISOString().slice(0, 10)
    const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10)
    const [invoices, payments] = await Promise.all([
      fetchOpenInvoices(env, token, realmId, { fresh }),
      fetchRecentPayments(env, token, realmId, since),
    ])
    return { asOf, invoices, payments }
  }, fresh)
}

// One customer's statement, from live QBO: their open invoices + their
// payments over the last 60 days, rendered as email-safe HTML. Shared by
// the admin AR endpoint, the client portal, and the public doc links.
export async function statementFor(env, token, realmId, { companyName, fromEmail }, customerId) {
  const snap = await arSnapshot(env, token, realmId)
  const invoices = snap.invoices.filter((i) => String(i.customerId) === String(customerId))
  if (!invoices.length) throw new Error('That customer has no open invoices — nothing to put on a statement.')
  const payments = snap.payments.filter((p) => String(p.customerId) === String(customerId))
  const customerName = invoices[0].customer
  const html = buildStatementHtml({ companyName, fromEmail, customerName, invoices, payments, asOf: snap.asOf })
  const total = invoices.reduce((s, i) => s + i.balance, 0)
  // invoices/payments come back too: the PDF draws from the same numbers
  // rather than re-querying or scraping the HTML.
  return { html, customerName, total, invoices, payments, email: invoices.find((i) => i.email)?.email || null, asOf: snap.asOf }
}

/** Every customer with a balance, biggest first — one pass over the books. */
export async function statementsForAll(env, token, realmId, { companyName, fromEmail }) {
  const snap = await arSnapshot(env, token, realmId)
  const byCust = new Map()
  for (const i of snap.invoices) {
    if (!i.customerId) continue
    if (!byCust.has(i.customerId)) byCust.set(i.customerId, [])
    byCust.get(i.customerId).push(i)
  }
  return [...byCust.entries()]
    .map(([customerId, invoices]) => ({
      customerId,
      customerName: invoices[0].customer,
      total: invoices.reduce((s, i) => s + i.balance, 0),
      email: invoices.find((i) => i.email)?.email || null,
      html: buildStatementHtml({
        companyName, fromEmail, customerName: invoices[0].customer, invoices,
        payments: snap.payments.filter((p) => String(p.customerId) === String(customerId)),
        asOf: snap.asOf,
      }),
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Wrap statement HTML as a page a person can actually print: a toolbar that
 * disappears on paper, a white ground, and a hard page break between
 * statements so a batch run comes off the printer one customer per sheet.
 */
export function statementPage(inner, { title = 'Statement', bar = '' } = {}) {
  return `<!doctype html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
  <style>
    body { background:#F6F5F1; margin:0; padding:0 12px 32px; }
    .bar { position:sticky; top:0; background:#fff; border-bottom:1px solid #E5E2DA;
           padding:10px 14px; margin:0 -12px 18px; display:flex; gap:10px; align-items:center;
           flex-wrap:wrap; font-family:-apple-system,'Segoe UI',Arial,sans-serif; }
    .bar b { font-size:13px; color:#1B2027; }
    .bar span { font-size:12px; color:#7C838C; }
    .bar button { font-family:inherit; font-size:12px; font-weight:600; padding:7px 14px;
                  border:none; border-radius:4px; background:#1B2027; color:#fff; cursor:pointer; }
    .stmt { margin:0 auto 22px; }
    @page { margin:14mm; }
    @media print {
      body { background:#fff; padding:0; }
      .bar { display:none !important; }
      .stmt { margin:0; page-break-after:always; break-after:page; }
      .stmt:last-child { page-break-after:auto; break-after:auto; }
      .stmt > div { border:none !important; }
    }
  </style></head><body>
  ${bar ? `<div class="bar">${bar}<span style="flex:1"></span><button onclick="window.print()">Print</button></div>` : ''}
  ${inner}
  </body></html>`
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

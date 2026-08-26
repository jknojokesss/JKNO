// ── QuickBooks Online write pipe ─────────────────────────────────────────
// SERVER-SIDE ONLY. The counterpart to the read pipe in lib/qbo.js.
//
// Scope note: com.intuit.quickbooks.accounting (already requested at
// lib/qbo.js) covers reads AND writes. There is no separate read-only scope
// in QBO OAuth2, so no client has to re-authorize for this to work.
//
// Cost note: since July 2025 Intuit meters READS under the App Partner
// Program. Writes are not metered. Posting journal entries is free; looking
// up the chart of accounts to build them is not, so that is cached.

import { qboGet } from './qbo'

const MINOR_VERSION = '75'

// Intuit's field limits. Exceeding one returns a 400 "String length is either
// shorter or longer than supported by specification (2050)" that never names
// the offending field, so check them before sending.
const DOCNUMBER_MAX = 21
const PRIVATENOTE_MAX = 4000
const DESCRIPTION_MAX = 4000

/** POST an entity to QBO. `requestId` makes retries idempotent on Intuit's side. */
export async function qboPost(env, accessToken, realmId, entity, body, { requestId, operation } = {}) {
  const p = new URLSearchParams({ minorversion: MINOR_VERSION })
  if (requestId) p.set('requestid', requestId)
  if (operation) p.set('operation', operation)
  const url = `${env.apiBase}/v3/company/${realmId}/${entity}?${p}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const tid = res.headers.get('intuit_tid')
    const fault = json.Fault && json.Fault.Error && json.Fault.Error[0]
    const err = new Error(
      `QBO ${entity} POST ${res.status}${tid ? ` [tid ${tid}]` : ''}: ` +
      (fault ? `${fault.Message} (${fault.code}${fault.Detail ? ` — ${fault.Detail}` : ''})` : JSON.stringify(json).slice(0, 400))
    )
    err.status = res.status
    err.intuitTid = tid
    err.faultCode = fault && fault.code
    throw err
  }
  return json
}

/* ── Chart of accounts, WITH the Ids ──────────────────────────────────────
   lib/qbo.js#fetchAccounts drops a.Id because the read pipe only needs
   names. A journal entry line needs AccountRef.value = the QBO Account Id,
   so this keeps it. Cached per realm for the life of the lambda. */

const acctCache = new Map() // realmId -> { at, accounts }
const ACCT_TTL_MS = 10 * 60 * 1000

export async function fetchAccountRefs(env, accessToken, realmId, { force = false } = {}) {
  const hit = acctCache.get(realmId)
  if (!force && hit && Date.now() - hit.at < ACCT_TTL_MS) return hit.accounts

  const out = []
  for (let start = 1; ; start += 1000) {
    const q = `select * from Account startposition ${start} maxresults 1000`
    const json = await qboGet(env, accessToken, `/v3/company/${realmId}/query?query=${encodeURIComponent(q)}&minorversion=${MINOR_VERSION}`)
    const batch = (json.QueryResponse && json.QueryResponse.Account) || []
    out.push(...batch)
    if (batch.length < 1000) break
  }
  const accounts = out.map((a) => ({
    id: a.Id,
    name: a.Name,
    fullName: a.FullyQualifiedName || a.Name,
    type: a.AccountType || null,
    subType: a.AccountSubType || null,
    active: a.Active !== false,
  }))
  acctCache.set(realmId, { at: Date.now(), accounts })
  return accounts
}

const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')

/** Resolve a written account name to a QBO account. Exact, then leaf, then unique prefix. */
export function resolveAccount(accounts, wanted) {
  const w = norm(wanted)
  if (!w) return { error: 'Account name is blank.' }
  const live = accounts.filter((a) => a.active)

  let hits = live.filter((a) => norm(a.fullName) === w)
  if (hits.length === 1) return { account: hits[0] }

  hits = live.filter((a) => norm(a.name) === w)
  if (hits.length === 1) return { account: hits[0] }
  if (hits.length > 1) {
    return { error: `"${wanted}" matches ${hits.length} accounts (${hits.map((h) => h.fullName).join(', ')}). Use the full name with the colon.` }
  }

  hits = live.filter((a) => norm(a.fullName).includes(w))
  if (hits.length === 1) return { account: hits[0] }
  if (hits.length > 1) {
    return { error: `"${wanted}" is ambiguous — could be ${hits.slice(0, 4).map((h) => h.fullName).join(', ')}${hits.length > 4 ? '…' : ''}.` }
  }
  return { error: `No active account in QuickBooks named "${wanted}".` }
}

const round2 = (n) => Math.round(Number(n) * 100) / 100

/**
 * Turn plain lines into a QBO JournalEntry, resolving account names to Ids.
 * lines: [{ account, debit|credit, description?, customer? }]
 * Returns { payload, resolved, errors, totals }.
 */
export function buildJournalEntry({ txnDate, docNumber, memo, lines }, accounts, customers = []) {
  const errors = []
  const resolved = []
  let debits = 0, credits = 0

  if (!txnDate || !/^\d{4}-\d{2}-\d{2}$/.test(txnDate)) errors.push('Date must be YYYY-MM-DD.')
  if (!Array.isArray(lines) || lines.length < 2) errors.push('A journal entry needs at least two lines.')
  // QBO caps DocNumber at 21 characters and rejects a longer one with a 400
  // (error 2050) that does not say which field it means. Catch it here.
  if (docNumber && String(docNumber).length > DOCNUMBER_MAX) {
    errors.push(`Doc number "${docNumber}" is ${String(docNumber).length} characters — QuickBooks allows ${DOCNUMBER_MAX}.`)
  }
  if (memo && String(memo).length > PRIVATENOTE_MAX) {
    errors.push(`Memo is ${String(memo).length} characters — QuickBooks allows ${PRIVATENOTE_MAX}.`)
  }

  const Line = (lines || []).map((l, i) => {
    const n = i + 1
    const debit = round2(l.debit || 0)
    const credit = round2(l.credit || 0)
    if (debit && credit) errors.push(`Line ${n}: has both a debit and a credit — pick one.`)
    if (!debit && !credit) errors.push(`Line ${n}: needs a debit or a credit.`)
    if (debit < 0 || credit < 0) errors.push(`Line ${n}: amounts must be positive. Flip the side instead.`)

    const r = resolveAccount(accounts, l.account)
    if (r.error) errors.push(`Line ${n}: ${r.error}`)
    if (l.description && String(l.description).length > DESCRIPTION_MAX) {
      errors.push(`Line ${n}: description is ${String(l.description).length} characters — QuickBooks allows ${DESCRIPTION_MAX}.`)
    }

    const amount = debit || credit
    if (debit) debits += debit; else credits += credit
    resolved.push({ line: n, wrote: l.account, matched: r.account ? r.account.fullName : null, id: r.account ? r.account.id : null, debit, credit })

    const detail = {
      PostingType: debit ? 'Debit' : 'Credit',
      AccountRef: r.account ? { value: r.account.id, name: r.account.fullName } : undefined,
    }
    // Putting the customer on the line is what makes it show up in job costing.
    if (l.customer) {
      const c = customers.find((x) => norm(x.name) === norm(l.customer))
      if (!c) errors.push(`Line ${n}: no customer named "${l.customer}" in QuickBooks.`)
      else detail.Entity = { Type: 'Customer', EntityRef: { value: c.id, name: c.name } }
    }
    return {
      DetailType: 'JournalEntryLineDetail',
      Amount: amount,
      Description: l.description || memo || undefined,
      JournalEntryLineDetail: detail,
    }
  })

  debits = round2(debits); credits = round2(credits)
  if (debits !== credits) {
    errors.push(`Out of balance by ${(debits - credits).toFixed(2)} — debits ${debits.toFixed(2)}, credits ${credits.toFixed(2)}.`)
  }
  if (debits === 0) errors.push('The entry is for zero.')

  const payload = { TxnDate: txnDate, Line }
  if (docNumber) payload.DocNumber = docNumber
  if (memo) payload.PrivateNote = memo

  return { payload, resolved, errors, totals: { debits, credits } }
}

export async function fetchCustomerRefs(env, accessToken, realmId) {
  const out = []
  for (let start = 1; ; start += 1000) {
    const q = `select Id, DisplayName, PrimaryEmailAddr from Customer startposition ${start} maxresults 1000`
    const json = await qboGet(env, accessToken, `/v3/company/${realmId}/query?query=${encodeURIComponent(q)}&minorversion=${MINOR_VERSION}`)
    const batch = (json.QueryResponse && json.QueryResponse.Customer) || []
    out.push(...batch)
    if (batch.length < 1000) break
  }
  return out.map((c) => ({ id: c.Id, name: c.DisplayName, email: (c.PrimaryEmailAddr && c.PrimaryEmailAddr.Address) || null }))
}

/** Resolve a store name to a QBO customer. Exact, then substring either way. */
export function resolveCustomer(customers, wanted) {
  const w = norm(wanted)
  if (!w) return { error: 'Store name is blank.' }
  let hits = customers.filter((c) => norm(c.name) === w)
  if (hits.length === 1) return { customer: hits[0] }
  hits = customers.filter((c) => norm(c.name).includes(w) || w.includes(norm(c.name)))
  if (hits.length === 1) return { customer: hits[0] }
  if (hits.length > 1) return { error: `"${wanted}" matches ${hits.length} QuickBooks customers (${hits.slice(0, 4).map((h) => h.name).join(', ')}).`, candidates: hits }
  return { error: `No QuickBooks customer matching "${wanted}".`, candidates: [] }
}

export function postJournalEntry(env, accessToken, realmId, payload, requestId) {
  return qboPost(env, accessToken, realmId, 'journalentry', payload, { requestId })
}

/** Journal entries delete cleanly, which is the undo for a bad push. */
export function deleteJournalEntry(env, accessToken, realmId, id, syncToken) {
  return qboPost(env, accessToken, realmId, 'journalentry', { Id: id, SyncToken: String(syncToken) }, { operation: 'delete' })
}

/* ── Invoices ─────────────────────────────────────────────────────────────
   Sales items (products/services) with their default price, so a wholesale
   invoice line can carry ItemRef + UnitPrice. Cached per realm. */
const itemCache = new Map()
export async function fetchItemRefs(env, accessToken, realmId, { force = false } = {}) {
  const hit = itemCache.get(realmId)
  if (!force && hit && Date.now() - hit.at < ACCT_TTL_MS) return hit.items
  const out = []
  for (let start = 1; ; start += 1000) {
    const q = `select Id, Name, FullyQualifiedName, UnitPrice, Type, Active from Item startposition ${start} maxresults 1000`
    const json = await qboGet(env, accessToken, `/v3/company/${realmId}/query?query=${encodeURIComponent(q)}&minorversion=${MINOR_VERSION}`)
    const batch = (json.QueryResponse && json.QueryResponse.Item) || []
    out.push(...batch)
    if (batch.length < 1000) break
  }
  const items = out.map((i) => ({
    id: i.Id, name: i.Name, fullName: i.FullyQualifiedName || i.Name,
    unitPrice: i.UnitPrice != null ? Number(i.UnitPrice) : null, type: i.Type, active: i.Active !== false,
  }))
  itemCache.set(realmId, { at: Date.now(), items })
  return items
}

export function resolveItem(items, wanted) {
  const w = norm(wanted)
  if (!w) return { error: 'Item name is blank.' }
  const live = items.filter((i) => i.active)
  let hits = live.filter((i) => norm(i.fullName) === w || norm(i.name) === w)
  if (hits.length === 1) return { item: hits[0] }
  hits = live.filter((i) => norm(i.fullName).includes(w))
  if (hits.length === 1) return { item: hits[0] }
  if (hits.length > 1) return { error: `"${wanted}" matches ${hits.length} items.`, candidates: hits }
  return { error: `No active QuickBooks item named "${wanted}".`, candidates: [] }
}

/** The customer's most recent invoice, with its sales-item lines. null if none. */
export async function fetchLastInvoiceForCustomer(env, accessToken, realmId, customerId) {
  const q = `select * from Invoice where CustomerRef = '${customerId}' orderby TxnDate desc maxresults 1`
  const json = await qboGet(env, accessToken, `/v3/company/${realmId}/query?query=${encodeURIComponent(q)}&minorversion=${MINOR_VERSION}`)
  const inv = (json.QueryResponse && json.QueryResponse.Invoice && json.QueryResponse.Invoice[0]) || null
  if (!inv) return null
  const lines = (inv.Line || [])
    .filter((l) => l.DetailType === 'SalesItemLineDetail')
    .map((l) => {
      const d = l.SalesItemLineDetail || {}
      return {
        item: d.ItemRef && d.ItemRef.name, itemId: d.ItemRef && d.ItemRef.value,
        qty: d.Qty != null ? Number(d.Qty) : null,
        unitPrice: d.UnitPrice != null ? Number(d.UnitPrice) : null,
        description: l.Description || '',
      }
    })
  return { id: inv.Id, docNumber: inv.DocNumber || null, txnDate: inv.TxnDate, total: Number(inv.TotalAmt) || 0, lines }
}

/**
 * Build a QBO Invoice. lines: [{ itemId, item?, qty, unitPrice, description? }].
 * DocNumber is intentionally omitted so QuickBooks assigns its own next number.
 */
export function buildInvoice({ customerId, customerName, txnDate, dueDate, memo, billEmail, lines }) {
  const errors = []
  if (!customerId) errors.push('No QuickBooks customer.')
  if (!txnDate || !/^\d{4}-\d{2}-\d{2}$/.test(txnDate)) errors.push('Date must be YYYY-MM-DD.')
  const Line = (lines || []).map((l, i) => {
    const qty = round2(l.qty || 0), price = round2(l.unitPrice || 0)
    if (!l.itemId) errors.push(`Line ${i + 1}: no item selected.`)
    if (qty <= 0) errors.push(`Line ${i + 1}: quantity must be greater than zero.`)
    if (price < 0) errors.push(`Line ${i + 1}: price can't be negative.`)
    if (l.description && String(l.description).length > DESCRIPTION_MAX) errors.push(`Line ${i + 1}: description too long.`)
    return {
      DetailType: 'SalesItemLineDetail',
      Amount: round2(qty * price),
      Description: l.description || undefined,
      SalesItemLineDetail: { ItemRef: { value: l.itemId, name: l.item || undefined }, Qty: qty, UnitPrice: price },
    }
  })
  if (!Line.length) errors.push('Add at least one line.')
  const payload = { CustomerRef: { value: customerId, name: customerName || undefined }, TxnDate: txnDate, Line }
  if (dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) payload.DueDate = dueDate
  if (memo) payload.CustomerMemo = { value: String(memo).slice(0, 1000) }
  if (billEmail) payload.BillEmail = { Address: billEmail }
  const total = round2(Line.reduce((s, x) => s + x.Amount, 0))
  return { payload, errors, total }
}

export function postInvoice(env, accessToken, realmId, payload, requestId) {
  return qboPost(env, accessToken, realmId, 'invoice', payload, { requestId })
}

export function deleteInvoice(env, accessToken, realmId, id, syncToken) {
  return qboPost(env, accessToken, realmId, 'invoice', { Id: id, SyncToken: String(syncToken) }, { operation: 'delete' })
}

/** The QuickBooks-rendered PDF of an invoice, as a Buffer. */
export async function fetchInvoicePdf(env, accessToken, realmId, id) {
  const url = `${env.apiBase}/v3/company/${realmId}/invoice/${id}/pdf?minorversion=${MINOR_VERSION}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/pdf' } })
  if (!res.ok) { const t = await res.text().catch(() => ''); const e = new Error(`QBO invoice pdf ${res.status}: ${t.slice(0, 200)}`); e.status = res.status; throw e }
  return Buffer.from(await res.arrayBuffer())
}

/** Ask QuickBooks to email the invoice. sendTo overrides the customer's email on file. */
export async function sendInvoice(env, accessToken, realmId, id, sendTo) {
  const p = new URLSearchParams({ minorversion: MINOR_VERSION })
  if (sendTo) p.set('sendTo', sendTo)
  const url = `${env.apiBase}/v3/company/${realmId}/invoice/${id}/send?${p}`
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/octet-stream', Accept: 'application/json' } })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) { const e = new Error(`QBO invoice send ${res.status}: ${JSON.stringify(json).slice(0, 200)}`); e.status = res.status; throw e }
  return json
}

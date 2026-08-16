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

  const Line = (lines || []).map((l, i) => {
    const n = i + 1
    const debit = round2(l.debit || 0)
    const credit = round2(l.credit || 0)
    if (debit && credit) errors.push(`Line ${n}: has both a debit and a credit — pick one.`)
    if (!debit && !credit) errors.push(`Line ${n}: needs a debit or a credit.`)
    if (debit < 0 || credit < 0) errors.push(`Line ${n}: amounts must be positive. Flip the side instead.`)

    const r = resolveAccount(accounts, l.account)
    if (r.error) errors.push(`Line ${n}: ${r.error}`)

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
    const q = `select Id, DisplayName from Customer startposition ${start} maxresults 1000`
    const json = await qboGet(env, accessToken, `/v3/company/${realmId}/query?query=${encodeURIComponent(q)}&minorversion=${MINOR_VERSION}`)
    const batch = (json.QueryResponse && json.QueryResponse.Customer) || []
    out.push(...batch)
    if (batch.length < 1000) break
  }
  return out.map((c) => ({ id: c.Id, name: c.DisplayName }))
}

export function postJournalEntry(env, accessToken, realmId, payload, requestId) {
  return qboPost(env, accessToken, realmId, 'journalentry', payload, { requestId })
}

/** Journal entries delete cleanly, which is the undo for a bad push. */
export function deleteJournalEntry(env, accessToken, realmId, id, syncToken) {
  return qboPost(env, accessToken, realmId, 'journalentry', { Id: id, SyncToken: String(syncToken) }, { operation: 'delete' })
}

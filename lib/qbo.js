// ── QuickBooks Online read pipe ──────────────────────────────────────────
// SERVER-SIDE ONLY. One Intuit app ("PL Pull") serves every client; each
// client's QBO company is a row in qbo_connections (realm id + tokens),
// created by /api/qbo/connect → /api/qbo/callback and read nightly by
// /api/cron/qbo-sync. Read-only: accounting scope, no writes to QuickBooks.
//
// Env (Vercel): QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_ENV (sandbox|production),
// QBO_REDIRECT_URI (defaults to https://jknojokes.com/api/qbo/callback).
//
// Endpoints per Intuit's OAuth 2.0 docs:
//   authorize  https://appcenter.intuit.com/connect/oauth2
//   token      https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer
//   API base   https://sandbox-quickbooks.api.intuit.com | https://quickbooks.api.intuit.com


// Node's fetch has no default timeout: a stalled connection to Intuit hangs
// until the platform kills the whole function, and the caller sees a page
// that never finishes loading rather than an error it can act on. Every call
// out to Intuit gets a deadline. Reports are the slow ones (a General Ledger
// month on a big company is tens of seconds), so the cap is generous —
// the point is to fail eventually, not quickly.
const CALL_TIMEOUT_MS = 90 * 1000
function deadline(ms = CALL_TIMEOUT_MS) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), ms)
  return { signal: ctl.signal, done: () => clearTimeout(timer) }
}
function timedOut(e, what) {
  if (e && (e.name === 'AbortError' || e.name === 'TimeoutError')) {
    const err = new Error(`QuickBooks did not respond within ${CALL_TIMEOUT_MS / 1000}s (${what}).`)
    err.status = 504
    return err
  }
  return e
}

const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
const AUTHORIZE_URL = 'https://appcenter.intuit.com/connect/oauth2'
const SCOPE = 'com.intuit.quickbooks.accounting'

export function qboEnv() {
  const clientId = process.env.QBO_CLIENT_ID
  const clientSecret = process.env.QBO_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  const sandbox = (process.env.QBO_ENV || 'sandbox') !== 'production'
  return {
    clientId,
    clientSecret,
    sandbox,
    apiBase: sandbox ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com',
    redirectUri: process.env.QBO_REDIRECT_URI || 'https://jknojokes.com/api/qbo/callback',
  }
}

export function authorizeUrl(env, state) {
  const p = new URLSearchParams({
    client_id: env.clientId,
    response_type: 'code',
    scope: SCOPE,
    redirect_uri: env.redirectUri,
    state,
  })
  return `${AUTHORIZE_URL}?${p}`
}

async function tokenRequest(env, body) {
  const basic = Buffer.from(`${env.clientId}:${env.clientSecret}`).toString('base64')
  const d = deadline(30 * 1000)
  let res
  try {
    res = await fetch(TOKEN_URL, {
      method: 'POST',
      signal: d.signal,
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams(body).toString(),
    })
  } catch (e) { throw timedOut(e, 'sign-in token') } finally { d.done() }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    // intuit_tid is Intuit's request trace id — capture it on every failure,
    // it's the first thing their support asks for.
    const tid = res.headers.get('intuit_tid')
    const err = new Error(`QBO token endpoint ${res.status}${tid ? ` [tid ${tid}]` : ''}: ${json.error || JSON.stringify(json)}`)
    err.status = res.status
    err.code = json.error
    err.intuitTid = tid
    throw err
  }
  return json
}

export function exchangeCode(env, code) {
  return tokenRequest(env, { grant_type: 'authorization_code', code, redirect_uri: env.redirectUri })
}

// NOTE: Intuit ROTATES the refresh token — every refresh response may carry a
// new refresh_token that invalidates the old one. Callers must persist what
// this returns or the connection dies within 100 days.
export function refreshTokens(env, refreshToken) {
  return tokenRequest(env, { grant_type: 'refresh_token', refresh_token: refreshToken })
}

export async function qboGet(env, accessToken, path) {
  const d = deadline()
  let res
  try {
    res = await fetch(`${env.apiBase}${path}`, {
      signal: d.signal,
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
  } catch (e) { throw timedOut(e, path.split('?')[0]) } finally { d.done() }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const tid = res.headers.get('intuit_tid')
    const fault = json.Fault && json.Fault.Error && json.Fault.Error[0]
    const err = new Error(`QBO API ${res.status} on ${path}${tid ? ` [tid ${tid}]` : ''}: ${fault ? `${fault.Message} (${fault.code}${fault.Detail ? ` — ${fault.Detail}` : ''})` : JSON.stringify(json).slice(0, 300)}`)
    err.status = res.status
    err.intuitTid = tid
    throw err
  }
  return json
}

// Chart of accounts, via the entity query endpoint (paged — QBO caps a query
// at 1000 rows). This is what replaces the hand-uploaded CoA CSV.
export async function fetchAccounts(env, accessToken, realmId) {
  const out = []
  for (let start = 1; ; start += 1000) {
    const q = `select * from Account startposition ${start} maxresults 1000`
    const json = await qboGet(env, accessToken, `/v3/company/${realmId}/query?query=${encodeURIComponent(q)}`)
    const batch = (json.QueryResponse && json.QueryResponse.Account) || []
    out.push(...batch)
    if (batch.length < 1000) break
  }
  return out.map((a) => ({
    account: a.FullyQualifiedName || a.Name,
    leaf: a.Name,
    account_type: a.AccountType || null,
    detail_type: a.AccountSubType || null,
    active: a.Active !== false,
  }))
}

export async function fetchCompanyName(env, accessToken, realmId) {
  const json = await qboGet(env, accessToken, `/v3/company/${realmId}/companyinfo/${realmId}`)
  return (json.CompanyInfo && json.CompanyInfo.CompanyName) || null
}

const fmtDate = (d) => d.toISOString().slice(0, 10)
export function monthWindow(months) {
  const now = new Date()
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1)),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)),
  }
}

// Monthly summary report (ProfitAndLoss / BalanceSheet) → flat rows
// {month, account, group, subgroup, amount}. The JSON is a tree of Sections;
// we keep the top-level section title as `group` (Income / Expenses, or
// ASSETS / LIABILITIES AND EQUITY) and the nearest enclosing header as
// `subgroup` (Bank Accounts, Current Liabilities, …).
export async function fetchSummaryReportRows(env, accessToken, realmId, reportName, { months = 24 } = {}) {
  const { start, end } = monthWindow(months)
  const p = new URLSearchParams({
    start_date: fmtDate(start),
    end_date: fmtDate(end),
    summarize_column_by: 'Month',
    accounting_method: 'Accrual',
  })
  const report = await qboGet(env, accessToken, `/v3/company/${realmId}/reports/${reportName}?${p}`)

  // Column k (k>0) → first day of that month, from Column MetaData when
  // present, else parsed from the "Jan 2026"-style title. The report's final
  // Total column carries no StartDate and must NOT be parsed as a date —
  // Date.parse() happily turns "Total 1" into a bogus date, which lands the
  // whole-period total in a phantom month.
  const MONTH_TITLE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}$/i
  const cols = (report.Columns && report.Columns.Column) || []
  const monthOfCol = []
  for (let k = 1; k < cols.length; k++) {
    const c = cols[k]
    const meta = (c.MetaData || []).find((m) => m.Name === 'StartDate')
    if (meta) { monthOfCol[k] = meta.Value.slice(0, 7) + '-01'; continue }
    const title = (c.ColTitle || '').trim()
    if (!MONTH_TITLE.test(title)) { monthOfCol[k] = null; continue }
    const t = Date.parse(title.replace(/\./, '') + ' 1')
    monthOfCol[k] = isNaN(t) ? null : new Date(t).toISOString().slice(0, 7) + '-01'
  }

  const rows = []
  const walk = (list, group, subgroup) => {
    for (const row of list || []) {
      const header = row.Header && row.Header.ColData && row.Header.ColData[0].value
      const g = group || header || null
      const sg = group && header ? header : subgroup
      if (row.Rows && row.Rows.Row) walk(row.Rows.Row, g, sg)
      if (row.type === 'Data' && row.ColData) {
        const account = row.ColData[0].value
        if (!account) continue
        for (let k = 1; k < row.ColData.length; k++) {
          if (!monthOfCol[k]) continue
          const v = parseFloat(row.ColData[k].value)
          if (!v) continue
          rows.push({ month: monthOfCol[k], account, group: g || 'Other', subgroup: sg || null, amount: v })
        }
      }
    }
  }
  walk(report.Rows && report.Rows.Row, null, null)
  return rows
}

export function fetchProfitAndLossRows(env, accessToken, realmId, opts) {
  return fetchSummaryReportRows(env, accessToken, realmId, 'ProfitAndLoss', opts)
}
export function fetchBalanceSheetRows(env, accessToken, realmId, opts) {
  return fetchSummaryReportRows(env, accessToken, realmId, 'BalanceSheet', opts)
}

// General Ledger detail — the transaction-level book. Pulled one month at a
// time: the GL report over a long range is the classic way to hit Intuit's
// report timeout, and per-month windows also make partial failures cheap to
// retry. Columns are located by ColKey rather than position, since the set
// varies by company configuration.
// Column identity varies by company AND by report: some responses carry
// MetaData ColKey, some only ColType, some only a human ColTitle. Match on
// all three, with title synonyms, rather than trusting one shape.
const GL_COLUMNS = {
  tx_date: ['tx_date', 'date'],
  txn_type: ['txn_type', 'transaction type', 'type'],
  doc_num: ['doc_num', 'num', 'no.', 'number'],
  name: ['name', 'payee', 'customer', 'vendor'],
  memo: ['memo', 'memo/description', 'description'],
  split_acc: ['split_acc', 'split', 'split account'],
  subt_nat_amount: ['subt_nat_amount', 'amount'],
}
function locateColumns(cols) {
  const idx = {}
  for (const [field, names] of Object.entries(GL_COLUMNS)) {
    idx[field] = cols.findIndex((c) => {
      const key = (c.MetaData || []).find((md) => md.Name === 'ColKey')
      const candidates = [key && key.Value, c.ColType, c.ColTitle]
        .filter(Boolean).map((s) => String(s).trim().toLowerCase())
      return candidates.some((v) => names.includes(v))
    })
  }
  return idx
}
export function describeColumns(cols) {
  return (cols || []).map((c, i) => {
    const key = (c.MetaData || []).find((md) => md.Name === 'ColKey')
    return `${i}:${c.ColTitle || ''}|type=${c.ColType || ''}|key=${key ? key.Value : ''}`
  })
}

export async function fetchGeneralLedgerRows(env, accessToken, realmId, { months = 3 } = {}) {
  const { start } = monthWindow(months)
  const out = []
  let sawColumns = null
  const monthsList = []
  for (let i = 0; i < months; i++) {
    const s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1))
    const e = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 1, 0))
    monthsList.push({ s, e, key: fmtDate(s) })
  }

  for (const m of monthsList) {
    const p = new URLSearchParams({
      start_date: fmtDate(m.s),
      end_date: fmtDate(m.e),
      accounting_method: 'Accrual',
      // Ask for the columns explicitly; the default set varies by company.
      columns: 'tx_date,txn_type,doc_num,name,memo,split_acc,subt_nat_amount',
    })
    const report = await qboGet(env, accessToken, `/v3/company/${realmId}/reports/GeneralLedger?${p}`)
    const cols = (report.Columns && report.Columns.Column) || []
    if (!sawColumns && cols.length) sawColumns = describeColumns(cols)
    const idx = locateColumns(cols)
    const { tx_date: iDate, txn_type: iType, doc_num: iDoc, name: iName, memo: iMemo, split_acc: iSplit, subt_nat_amount: iAmt } = idx
    const val = (cd, i) => (i >= 0 && cd[i] ? cd[i].value : null)

    // Data rows sit under a Section header naming the account they belong to.
    const walk = (list, account) => {
      for (const row of list || []) {
        const header = row.Header && row.Header.ColData && row.Header.ColData[0].value
        const acct = header || account
        if (row.Rows && row.Rows.Row) walk(row.Rows.Row, acct)
        if (row.type === 'Data' && row.ColData) {
          const cd = row.ColData
          // Fall back to positional reads when a column couldn't be located:
          // GL rows are conventionally date-first and amount-last.
          const amount = parseFloat(iAmt >= 0 ? val(cd, iAmt) : (cd[cd.length - 2] || cd[cd.length - 1] || {}).value)
          const txnDate = iDate >= 0 ? val(cd, iDate) : (cd[0] || {}).value
          // beginning-balance / subtotal rows carry no date or no amount
          if (!txnDate || !/^\d{4}-\d{2}-\d{2}/.test(txnDate) || isNaN(amount)) continue
          out.push({
            month: m.key,
            txn_date: txnDate,
            txn_type: val(cd, iType),
            doc_num: val(cd, iDoc),
            name: val(cd, iName),
            memo: val(cd, iMemo),
            split_account: val(cd, iSplit),
            account: acct || null,
            amount,
          })
        }
      }
    }
    walk(report.Rows && report.Rows.Row, null)
  }
  // sawColumns is returned so a zero-row pull can report what the response
  // actually looked like instead of just saying "0".
  return { rows: out, months: monthsList.map((m) => m.key), columns: sawColumns }
}

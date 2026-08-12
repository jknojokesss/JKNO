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
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(body).toString(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`QBO token endpoint ${res.status}: ${json.error || JSON.stringify(json)}`)
    err.status = res.status
    err.code = json.error
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
  const res = await fetch(`${env.apiBase}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const fault = json.Fault && json.Fault.Error && json.Fault.Error[0]
    const err = new Error(`QBO API ${res.status} on ${path}: ${fault ? `${fault.Message} (${fault.code})` : JSON.stringify(json).slice(0, 300)}`)
    err.status = res.status
    throw err
  }
  return json
}

export async function fetchCompanyName(env, accessToken, realmId) {
  const json = await qboGet(env, accessToken, `/v3/company/${realmId}/companyinfo/${realmId}`)
  return (json.CompanyInfo && json.CompanyInfo.CompanyName) || null
}

// Trailing P&L summarized by month → flat rows {month, account, group, amount}.
// The report JSON is a tree of Sections; we walk it keeping the top-level
// section title (Income / COGS / Expenses / …) as the group.
export async function fetchProfitAndLossRows(env, accessToken, realmId, { months = 24 } = {}) {
  const now = new Date()
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1))
  const fmt = (d) => d.toISOString().slice(0, 10)
  const p = new URLSearchParams({
    start_date: fmt(start),
    end_date: fmt(end),
    summarize_column_by: 'Month',
    accounting_method: 'Accrual',
  })
  const report = await qboGet(env, accessToken, `/v3/company/${realmId}/reports/ProfitAndLoss?${p}`)

  // Column k (k>0) → first day of that month, from Column MetaData when
  // present, else parsed from the "Jan 2026"-style title. Last column is the
  // report Total — dropped.
  const cols = (report.Columns && report.Columns.Column) || []
  const monthOfCol = []
  for (let k = 1; k < cols.length; k++) {
    const c = cols[k]
    const meta = (c.MetaData || []).find((m) => m.Name === 'StartDate')
    if (meta) { monthOfCol[k] = meta.Value.slice(0, 7) + '-01'; continue }
    const t = Date.parse(c.ColTitle + ' 1')
    monthOfCol[k] = isNaN(t) ? null : new Date(t).toISOString().slice(0, 10).slice(0, 7) + '-01'
  }

  const rows = []
  const walk = (list, group) => {
    for (const row of list || []) {
      const isTopSection = !group && row.Header && row.Header.ColData
      const g = isTopSection ? row.Header.ColData[0].value : group
      if (row.Rows && row.Rows.Row) walk(row.Rows.Row, g)
      if (row.type === 'Data' && row.ColData) {
        const account = row.ColData[0].value
        for (let k = 1; k < row.ColData.length; k++) {
          if (!monthOfCol[k]) continue
          const v = parseFloat(row.ColData[k].value)
          if (!v) continue
          rows.push({ month: monthOfCol[k], account, group: g || 'Other', amount: v })
        }
      }
    }
  }
  walk(report.Rows && report.Rows.Row, null)
  return rows
}

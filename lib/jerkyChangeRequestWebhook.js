// SERVER-SIDE ONLY — outbound webhook for Jerky change requests.

const DEFAULT_HEADER = 'Authorization'
const WEBHOOK_TIMEOUT_MS = 6500

/**
 * Parse JERKY_CHANGE_REQUEST_WEBHOOK_HEADER defensively.
 * Accepts a bare header name ("Authorization") or a combined "Name: value" line.
 * When only the name is given, `secret` env is used as the header value.
 */
export function parseJerkyChangeRequestWebhookHeader(rawHeader, secret) {
  const trimmed = String(rawHeader || '').trim()
  const nameOnly = trimmed || DEFAULT_HEADER
  const sec = String(secret || '').trim()

  if (trimmed.includes(':')) {
    const idx = trimmed.indexOf(':')
    const name = trimmed.slice(0, idx).trim() || DEFAULT_HEADER
    const value = trimmed.slice(idx + 1).trim()
    if (value) return { headerName: name, headerValue: value }
    if (sec) return { headerName: name, headerValue: sec }
    return { headerName: name, headerValue: '' }
  }

  return {
    headerName: nameOnly,
    headerValue: sec,
  }
}

export function jerkyChangeRequestPortalUrl() {
  const explicit = String(process.env.JERKY_PORTAL_URL || '').trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = String(process.env.VERCEL_URL || '').trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}/jerky-munch`
  return 'https://www.jknojokes.com/jerky-munch'
}

function webhookPayload(row) {
  return {
    id: row.id,
    text: row.request_text,
    page: row.page_label,
    submitter: { user_id: row.user_id, email: row.submitter_email },
    status: row.status,
    created_at: row.created_at,
    reply_note: row.reply_note || null,
    portalUrl: jerkyChangeRequestPortalUrl(),
  }
}

/**
 * POST webhook; logs failures without throwing (unless caller wants throw).
 * Returns { skipped?, ok?, status?, error? }
 */
export async function postJerkyChangeRequestWebhook(row, { logTag = 'jerky-change-request' } = {}) {
  const url = String(process.env.JERKY_CHANGE_REQUEST_WEBHOOK_URL || '').trim()
  if (!url) return { skipped: true, reason: 'no_url' }

  const { headerName, headerValue } = parseJerkyChangeRequestWebhookHeader(
    process.env.JERKY_CHANGE_REQUEST_WEBHOOK_HEADER,
    process.env.JERKY_CHANGE_REQUEST_WEBHOOK_SECRET,
  )

  const headers = { 'Content-Type': 'application/json' }
  if (headerName && headerValue) headers[headerName] = headerValue

  const body = JSON.stringify(webhookPayload(row))
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

  try {
    const res = await fetch(url, { method: 'POST', headers, body, signal: controller.signal })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`[${logTag}] webhook HTTP ${res.status}`, text.slice(0, 500))
      return { ok: false, status: res.status, error: `HTTP ${res.status}` }
    }
    return { ok: true, status: res.status }
  } catch (e) {
    const msg = e && e.name === 'AbortError' ? 'timeout' : String(e.message || e)
    console.error(`[${logTag}] webhook failed:`, msg)
    return { ok: false, error: msg }
  } finally {
    clearTimeout(timer)
  }
}

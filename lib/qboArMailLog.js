// ── Durable log for /admin/ar invoice emails ─────────────────────────────
// SERVER-SIDE ONLY. Initial sends and reminders land here so the admin UI
// can show "Reminder sent …" and prefill the original sent date. If the
// table is missing (migration not applied yet), reads return empty and
// writes are skipped — send still works.

import { supabaseAdmin } from './supabaseAdmin'

const TABLE = 'qbo_ar_mail_log'

function missingTable(err) {
  const msg = String((err && err.message) || err || '')
  return msg.includes('qbo_ar_mail_log') && (msg.includes('does not exist') || msg.includes('schema cache'))
}

/** @returns {Promise<Map<string, { sends: object[], reminders: object[] }>>} */
export async function fetchMailLogsForInvoices(clientSlug, invoiceIds) {
  const map = new Map()
  if (!invoiceIds.length) return map
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('invoice_id, kind, sent_at, to_email, cc_email, subject')
    .eq('client_slug', clientSlug)
    .in('invoice_id', invoiceIds)
    .order('sent_at', { ascending: true })
  if (error) {
    if (missingTable(error)) return map
    throw error
  }
  for (const row of data || []) {
    const id = String(row.invoice_id)
    const g = map.get(id) || { sends: [], reminders: [] }
    const entry = {
      sentAt: row.sent_at,
      to: row.to_email,
      cc: row.cc_email || null,
      subject: row.subject || null,
    }
    if (row.kind === 'reminder') g.reminders.push(entry)
    else g.sends.push(entry)
    map.set(id, g)
  }
  return map
}

export function summarizeMailLog(groups) {
  const sends = (groups && groups.sends) || []
  const reminders = (groups && groups.reminders) || []
  const firstSend = sends[0] || null
  const lastReminder = reminders.length ? reminders[reminders.length - 1] : null
  return {
    sendCount: sends.length,
    reminderCount: reminders.length,
    firstSendAt: firstSend ? firstSend.sentAt : null,
    firstSendTo: firstSend ? firstSend.to : null,
    lastReminderAt: lastReminder ? lastReminder.sentAt : null,
    lastReminderTo: lastReminder ? lastReminder.to : null,
  }
}

export async function insertMailLog(row) {
  const { error } = await supabaseAdmin.from(TABLE).insert({
    client_slug: row.clientSlug,
    invoice_id: String(row.invoiceId),
    doc_number: row.docNumber || null,
    kind: row.kind,
    to_email: row.to,
    cc_email: row.cc || null,
    subject: row.subject || null,
  })
  if (error) {
    if (missingTable(error)) return { ok: false, skipped: true, reason: 'qbo_ar_mail_log table is not in the database yet — run supabase/migration/20261020140000_qbo_ar_mail_log.sql' }
    throw error
  }
  return { ok: true }
}

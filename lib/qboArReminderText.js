// ── Reminder email copy helpers (client + server safe) ─────────────────────
// No nodemailer or Supabase — safe to import from pages/admin/ar.js.

export function formatLongDate(isoOrTs) {
  if (!isoOrTs) return null
  const s = String(isoOrTs)
  const datePart = s.includes('T') ? s.slice(0, 10) : s.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}/.test(datePart)) return null
  return new Date(datePart + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

/**
 * Pick the reference date for reminder body copy.
 * @returns {{ phrase: 'sent on' | 'dated', label: string } | null}
 */
export function resolveReminderDateContext({ mailSummary, invoice }) {
  const lastSendAt = mailSummary && mailSummary.lastSendAt
  if (lastSendAt) {
    const label = formatLongDate(lastSendAt)
    if (label) return { phrase: 'sent on', label }
  }

  const deliveryTime = invoice && invoice.deliveryTime
  const emailStatus = invoice && invoice.emailStatus
  if (deliveryTime && emailStatus === 'EmailSent') {
    const label = formatLongDate(deliveryTime)
    if (label) return { phrase: 'sent on', label }
  }

  const txnDate = invoice && invoice.date
  if (txnDate) {
    const label = formatLongDate(txnDate)
    if (label) return { phrase: 'dated', label }
  }

  return null
}

export function defaultReminderBody({ mailSummary, invoice }) {
  const ctx = resolveReminderDateContext({ mailSummary, invoice })
  if (!ctx) {
    return `Just a friendly reminder that the invoice below is still open. Let me know if you didn't receive it or have any questions.`
  }
  return `Just a friendly reminder that the invoice below, ${ctx.phrase} ${ctx.label}, is still open. Let me know if you didn't receive it or have any questions.`
}

export function defaultReminderSubject({ doc, dueDate, companyName }) {
  const co = companyName || 'JK No Jokes Financials'
  const due = formatLongDate(dueDate)
  return due
    ? `Reminder: Invoice #${doc} from ${co}, due ${due}`
    : `Reminder: Invoice #${doc} from ${co}`
}

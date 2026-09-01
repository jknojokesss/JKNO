// ── The invoice email, as a customer sees it ─────────────────────────────
// SERVER-SIDE ONLY. Email HTML is not web HTML: no flexbox, no grid, no
// external stylesheets, and Outlook still renders through Word. So this is
// tables and inline styles only, and the button is a padded table cell
// rather than a styled <a> — the one shape that survives everywhere.
//
// Plain text is built alongside it, because a text part is what shows in
// notification previews and in clients that refuse HTML.

const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const nice = (iso) => iso
  ? new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  : null
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const INK = '#1B2027', MUTED = '#6B7280', RULE = '#E5E2DA', GROUND = '#F6F5F1', ACCENT = '#1B2027'

export function buildInvoiceEmail({ companyName, doc, balance, dueDate, payUrl, zelle, replyTo, intro }) {
  const due = nice(dueDate)
  const amount = balance != null ? money(balance) : null

  // ── plain text ─────────────────────────────────────────────────────────
  const text = ['Hi,', '']
    .concat([`${intro || `Invoice ${doc} is attached`}${amount ? ` — ${amount}` : ''}${due ? `, due ${due}` : ''}.`, ''])
    .concat(payUrl ? [`Pay by card or bank: ${payUrl}`, ''] : [])
    .concat(zelle ? [`Or send Zelle to: ${zelle}`, ''] : [])
    .concat(['Any questions, just reply to this email.', '', companyName])
    .join('\n')

  // ── html ───────────────────────────────────────────────────────────────
  const button = payUrl ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 8px">
      <tr><td align="center" bgcolor="${ACCENT}" style="border-radius:5px">
        <a href="${esc(payUrl)}" style="display:inline-block;padding:14px 32px;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:5px">
          Pay ${amount ? esc(amount) : 'now'}
        </a>
      </td></tr>
    </table>
    <div style="font-size:12px;color:${MUTED};font-family:-apple-system,'Segoe UI',Arial,sans-serif">
      Secure checkout by Stripe. No account needed.
    </div>` : ''

  const zelleRow = zelle ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px">
      <tr><td style="padding:12px 14px;background:${GROUND};border-radius:5px;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:13px;color:${INK}">
        <b>Prefer Zelle?</b> <span style="color:${MUTED}">Send to</span> ${esc(zelle)}
      </td></tr>
    </table>` : ''

  const amountBlock = amount ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0 0">
      <tr>
        <td style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:12px;letter-spacing:.08em;color:${MUTED};text-transform:uppercase;padding-bottom:4px">Amount due</td>
      </tr>
      <tr>
        <td style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:30px;font-weight:700;color:${INK};line-height:1.1">${esc(amount)}</td>
      </tr>
      ${due ? `<tr><td style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:13px;color:${MUTED};padding-top:5px">Due ${esc(due)}</td></tr>` : ''}
    </table>` : ''

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice ${esc(doc)}</title></head>
<body style="margin:0;padding:0;background:${GROUND};-webkit-text-size-adjust:100%">
  <!-- Preview text: what the inbox shows before the message is opened. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Invoice ${esc(doc)}${amount ? ` — ${esc(amount)}` : ''}${due ? `, due ${esc(due)}` : ''}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${GROUND}">
    <tr><td align="center" style="padding:28px 12px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid ${RULE};border-radius:7px">
        <tr><td style="padding:28px 30px">

          <div style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:17px;font-weight:700;color:${INK}">${esc(companyName)}</div>
          <div style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:13px;color:${MUTED};padding-top:2px">Invoice ${esc(doc)}</div>

          <div style="height:1px;background:${RULE};margin:18px 0 0"></div>

          <div style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:15px;color:${INK};line-height:1.65;padding-top:18px">
            Hi,<br><br>${esc(intro || `Invoice ${doc} is attached.`)}
          </div>

          ${amountBlock}
          ${button}
          ${zelleRow}

          <div style="height:1px;background:${RULE};margin:22px 0 0"></div>
          <div style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:13px;color:${MUTED};line-height:1.6;padding-top:16px">
            The invoice is attached as a PDF. Any questions, just reply${replyTo ? ` — this goes straight to ${esc(replyTo)}` : ' to this email'}.
          </div>

        </td></tr>
      </table>
      <div style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:12px;color:${MUTED};padding-top:14px">${esc(companyName)}</div>
    </td></tr>
  </table>
</body></html>`

  return { text, html }
}

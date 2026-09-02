import nodemailer from 'nodemailer'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

// Daily "what's open" email to the shop owner (vercel.json cron).
// Pulls every unfinished alteration and to-do across all orders, plus the
// standalone task list, and sends one plain summary sorted by due date.
// ?key=CRON_SECRET is the manual escape hatch for testing from a browser.

const OWNER_EMAIL = process.env.GOWN_OWNER_EMAIL || 'Info@lewimports.com'
const BIZ = 'LEW Imports'

const fmtShort = (d) => {
  if (!d) return ''
  const [y, m, day] = String(d).split('-')
  return m && day ? `${parseInt(m, 10)}/${parseInt(day, 10)}` : String(d)
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.authorization || ''
  const ok = secret && (auth === `Bearer ${secret}` || req.query.key === secret)
  if (!ok) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const [{ data: orders, error: oErr }, { data: tasks }] = await Promise.all([
      supabaseAdmin.from('gown_orders').select('*'),
      supabaseAdmin.from('gown_tasks').select('*'),
    ])
    if (oErr) return res.status(500).json({ error: oErr.message })

    const nameOf = (o) => `${o.first_name || ''} ${o.last_name || ''}`.trim()
    const rows = []
    for (const o of orders || []) {
      for (const a of (o.alterations_list || [])) {
        if (a.done) continue
        rows.push({
          date: a.due || '', garment: (a.garment || '').trim(),
          text: (a.note || '').trim() || 'Alteration',
          hours: a.hours || '', who: a.assignee || '',
          orderNo: o.order_no, customer: nameOf(o),
        })
      }
      for (const t of (o.todos || [])) {
        if (t.done) continue
        rows.push({ date: t.date || '', garment: '', text: t.text || 'Task', hours: '', who: t.assignedTo || '', orderNo: o.order_no, customer: nameOf(o) })
      }
    }
    for (const t of (tasks || [])) {
      if (t.done) continue
      const o = (orders || []).find(x => x.id === t.order_id)
      rows.push({ date: t.due_date || '', garment: '', text: t.text || 'Task', hours: '', who: t.assignee || '', orderNo: o ? o.order_no : null, customer: o ? nameOf(o) : '' })
    }
    // Undated work sorts last; everything else soonest first.
    rows.sort((a, b) => (a.date || '9999-99-99').localeCompare(b.date || '9999-99-99'))

    const today = new Date().toISOString().slice(0, 10)
    const overdue = rows.filter(r => r.date && r.date < today).length
    const dueToday = rows.filter(r => r.date === today).length

    const GMAIL_USER = process.env.GMAIL_USER
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
    const ZOHO_EMAIL = process.env.ZOHO_EMAIL
    const ZOHO_PASSWORD = process.env.ZOHO_PASSWORD
    // Prefer the shop's own Gmail; fall back to the Zoho account already wired
    // up for outreach so this works without new credentials.
    const mail = GMAIL_USER && GMAIL_APP_PASSWORD
      ? { host: 'smtp.gmail.com', user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
      : ZOHO_EMAIL && ZOHO_PASSWORD
        ? { host: 'smtp.zoho.com', user: ZOHO_EMAIL, pass: ZOHO_PASSWORD }
        : null
    if (!mail) return res.status(503).json({ error: 'No email credentials configured (GMAIL_USER/GMAIL_APP_PASSWORD or ZOHO_EMAIL/ZOHO_PASSWORD).' })

    const table = rows.length
      ? `<table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="background:#F0F4FF;">
            <th style="text-align:left;padding:7px 8px;color:#2A4C9C;font-size:11px;text-transform:uppercase;">Due</th>
            <th style="text-align:left;padding:7px 8px;color:#2A4C9C;font-size:11px;text-transform:uppercase;">What's needed</th>
            <th style="text-align:left;padding:7px 8px;color:#2A4C9C;font-size:11px;text-transform:uppercase;">Who</th>
            <th style="text-align:left;padding:7px 8px;color:#2A4C9C;font-size:11px;text-transform:uppercase;">Order</th>
          </tr>
          ${rows.map(r => {
            const late = r.date && r.date < today
            return `<tr style="border-bottom:1px solid #eee;">
              <td style="padding:7px 8px;white-space:nowrap;color:${late ? '#C0504C' : '#666'};font-weight:${late ? 700 : 400};">${r.date ? (late ? '⚠ ' : '') + fmtShort(r.date) : '—'}</td>
              <td style="padding:7px 8px;">${r.garment ? `<b>${r.garment}</b> — ` : ''}${r.text}${r.hours ? ` <span style="color:#888;">(${r.hours}h)</span>` : ''}</td>
              <td style="padding:7px 8px;color:#666;">${r.who || 'unassigned'}</td>
              <td style="padding:7px 8px;white-space:nowrap;"><span style="color:#C8322B;font-weight:600;">${r.orderNo != null ? 'No. ' + r.orderNo : 'General'}</span>${r.customer ? ` <span style="color:#666;">${r.customer}</span>` : ''}</td>
            </tr>`
          }).join('')}
        </table>`
      : '<div style="font-size:15px;color:#2E7D46;">Nothing open — all caught up ✓</div>'

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:660px;margin:0 auto;color:#23262E;">
        <div style="border-bottom:2px solid #2A4C9C;padding-bottom:10px;margin-bottom:16px;">
          <div style="font-size:22px;font-weight:800;color:#2A4C9C;">${BIZ} — What's Open</div>
          <div style="font-size:13px;color:#777;margin-top:3px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
        <div style="font-size:14px;margin-bottom:14px;">
          <b>${rows.length}</b> open${overdue ? ` · <span style="color:#C0504C;font-weight:700;">${overdue} overdue</span>` : ''}${dueToday ? ` · <b>${dueToday} due today</b>` : ''}
        </div>
        ${table}
        <div style="margin-top:20px;font-size:12px;color:#888;">Sent every morning by JK No Jokes Financials.</div>
      </div>`

    const transporter = nodemailer.createTransport({ host: mail.host, port: 465, secure: true, auth: { user: mail.user, pass: mail.pass } })
    await transporter.sendMail({
      from: `${BIZ} <${mail.user}>`,
      to: OWNER_EMAIL,
      subject: `${BIZ} — ${rows.length} open${overdue ? `, ${overdue} overdue` : ''}`,
      html,
    })

    return res.status(200).json({ ok: true, sent_to: OWNER_EMAIL, open: rows.length, overdue, due_today: dueToday })
  } catch (err) {
    console.error('gown-tasks cron error:', err)
    return res.status(500).json({ error: err.message || 'Failed' })
  }
}

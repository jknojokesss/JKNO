import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { getLiveToken, QboAuthError } from '../../../lib/qboAuth'
import {
  fetchAccountRefs, fetchCustomerRefs, buildJournalEntry,
  postJournalEntry, deleteJournalEntry,
} from '../../../lib/qboWrite'

// ── Push a journal entry into a client's QuickBooks ──────────────────────
//
//   POST /api/qbo/push-je
//     { action: 'preview', client, txnDate, docNumber, memo, lines }
//        → resolves account names to QBO Ids, checks the entry balances,
//          returns the exact payload. Touches nothing.
//     { action: 'save',    ...same }           → stores a draft, returns id
//     { action: 'post',    id, confirm: true } → actually posts it
//     { action: 'undo',    id, confirm: true } → deletes it back out of QBO
//     { action: 'list',    client }
//
// Posting is deliberately a separate call from previewing, and requires the
// draft to already exist plus confirm:true. Nothing here posts on a first
// request, and nothing posts a row that already carries a qbo_id.
//
// lines: [{ account, debit | credit, description?, customer? }]

const ADMIN_HEADER = 'x-admin-key'

function authed(req) {
  const key = process.env.ADMIN_API_KEY
  if (!key) return true // not configured — the page is behind the admin login
  return req.headers[ADMIN_HEADER] === key
}

const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '')

async function refsFor(env, token, realmId, lines) {
  const needsCustomers = (lines || []).some((l) => l && l.customer)
  const [accounts, customers] = await Promise.all([
    fetchAccountRefs(env, token, realmId),
    needsCustomers ? fetchCustomerRefs(env, token, realmId) : Promise.resolve([]),
  ])
  return { accounts, customers }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  if (!authed(req)) return res.status(401).json({ error: 'Unauthorized' })

  const body = req.body || {}
  const action = String(body.action || 'preview')

  try {
    if (action === 'list') {
      const { data, error } = await supabaseAdmin
        .from('qbo_journal_entries').select('*')
        .eq('client_slug', clean(body.client))
        .order('created_at', { ascending: false }).limit(50)
      if (error) throw new Error(error.message)
      return res.json({ ok: true, entries: data })
    }

    if (action === 'preview' || action === 'save') {
      const client = clean(body.client)
      if (!client) return res.status(400).json({ error: 'Missing client slug.' })

      const { env, token, realmId } = await getLiveToken(client)
      const { accounts, customers } = await refsFor(env, token, realmId, body.lines)
      const built = buildJournalEntry({
        txnDate: body.txnDate, docNumber: body.docNumber, memo: body.memo, lines: body.lines,
      }, accounts, customers)

      // Say "this doc number already went in" before they click, not after.
      let duplicate = null
      if (body.docNumber) {
        const { data: dup } = await supabaseAdmin
          .from('qbo_journal_entries').select('id, qbo_id, posted_at')
          .eq('client_slug', client).eq('doc_number', body.docNumber)
          .not('qbo_id', 'is', null).maybeSingle()
        duplicate = dup || null
      }

      if (action === 'preview') {
        return res.json({
          ok: built.errors.length === 0,
          realmId, company: env.sandbox ? 'SANDBOX' : 'PRODUCTION',
          payload: built.payload, resolved: built.resolved, totals: built.totals,
          errors: built.errors, duplicate, accountCount: accounts.length,
        })
      }

      if (built.errors.length) return res.status(400).json({ error: 'Entry is not valid.', errors: built.errors })
      if (duplicate) return res.status(409).json({ error: `Doc number ${body.docNumber} already posted as QBO id ${duplicate.qbo_id}.` })

      const { data, error } = await supabaseAdmin.from('qbo_journal_entries').insert({
        client_slug: client, txn_date: body.txnDate, doc_number: body.docNumber || null,
        memo: body.memo || null, lines: body.lines, status: 'draft',
      }).select().single()
      if (error) throw new Error(error.message)
      return res.json({ ok: true, id: data.id, payload: built.payload, totals: built.totals })
    }

    if (action === 'post') {
      if (body.confirm !== true) return res.status(400).json({ error: 'Posting requires confirm: true.' })
      const { data: row, error: selErr } = await supabaseAdmin
        .from('qbo_journal_entries').select('*').eq('id', body.id).maybeSingle()
      if (selErr) throw new Error(selErr.message)
      if (!row) return res.status(404).json({ error: 'No such draft.' })

      // The guard that matters: a row with an Id is already in the books.
      if (row.qbo_id) {
        return res.status(409).json({ error: `Already in QuickBooks as id ${row.qbo_id}, posted ${row.posted_at}. Not posting again.` })
      }

      const { env, token, realmId } = await getLiveToken(row.client_slug)
      const { accounts, customers } = await refsFor(env, token, realmId, row.lines)
      const built = buildJournalEntry({
        txnDate: row.txn_date, docNumber: row.doc_number, memo: row.memo, lines: row.lines,
      }, accounts, customers)
      if (built.errors.length) return res.status(400).json({ error: 'Entry is not valid.', errors: built.errors })

      try {
        // request_id is Intuit's own idempotency key: if this call times out
        // but actually landed, retrying with the same id returns that entry
        // instead of creating a second one.
        const out = await postJournalEntry(env, token, realmId, built.payload, row.request_id)
        const je = out.JournalEntry || {}
        await supabaseAdmin.from('qbo_journal_entries').update({
          status: 'posted', qbo_id: je.Id, qbo_sync_token: je.SyncToken,
          posted_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString(),
        }).eq('id', row.id)
        return res.json({
          ok: true, qboId: je.Id, syncToken: je.SyncToken, docNumber: je.DocNumber,
          company: env.sandbox ? 'SANDBOX' : 'PRODUCTION', realmId,
        })
      } catch (e) {
        await supabaseAdmin.from('qbo_journal_entries').update({
          status: 'error', last_error: String(e.message || e).slice(0, 800),
          last_intuit_tid: e.intuitTid || null, updated_at: new Date().toISOString(),
        }).eq('id', row.id)
        return res.status(502).json({ error: String(e.message || e), intuitTid: e.intuitTid || null })
      }
    }

    if (action === 'undo') {
      if (body.confirm !== true) return res.status(400).json({ error: 'Undo requires confirm: true.' })
      const { data: row } = await supabaseAdmin
        .from('qbo_journal_entries').select('*').eq('id', body.id).maybeSingle()
      if (!row) return res.status(404).json({ error: 'No such entry.' })
      if (!row.qbo_id) return res.status(400).json({ error: 'That entry was never posted.' })

      const { env, token, realmId } = await getLiveToken(row.client_slug)
      await deleteJournalEntry(env, token, realmId, row.qbo_id, row.qbo_sync_token)
      await supabaseAdmin.from('qbo_journal_entries').update({
        status: 'deleted', updated_at: new Date().toISOString(),
      }).eq('id', row.id)
      return res.json({ ok: true, deleted: row.qbo_id })
    }

    return res.status(400).json({ error: `Unknown action "${action}".` })
  } catch (e) {
    if (e instanceof QboAuthError) {
      return res.status(e.needsReconnect ? 409 : 500).json({ error: e.message, needsReconnect: e.needsReconnect })
    }
    return res.status(500).json({ error: String(e.message || e) })
  }
}

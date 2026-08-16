import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { requireAdmin } from '../../../lib/requireAdmin'
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

const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '')

/* Post one saved draft. Shared by the single and batch paths so both get the
   same guards: never post a row that already carries a qbo_id, and always
   send Intuit the row's own requestid so a retried timeout cannot duplicate. */
async function postOne(id) {
  const { data: row, error: selErr } = await supabaseAdmin
    .from('qbo_journal_entries').select('*').eq('id', id).maybeSingle()
  if (selErr) throw new Error(selErr.message)
  if (!row) throw new Error('No such draft.')
  if (row.qbo_id) throw new Error(`Already in QuickBooks as id ${row.qbo_id}, posted ${row.posted_at}. Not posting again.`)

  const { env, token, realmId } = await getLiveToken(row.client_slug)
  const { accounts, customers } = await refsFor(env, token, realmId, row.lines)
  const built = buildJournalEntry({
    txnDate: row.txn_date, docNumber: row.doc_number, memo: row.memo, lines: row.lines,
  }, accounts, customers)
  if (built.errors.length) throw new Error(built.errors.join(' · '))

  try {
    const out = await postJournalEntry(env, token, realmId, built.payload, row.request_id)
    const je = out.JournalEntry || {}
    await supabaseAdmin.from('qbo_journal_entries').update({
      status: 'posted', qbo_id: je.Id, qbo_sync_token: je.SyncToken,
      posted_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString(),
    }).eq('id', row.id)
    return {
      qboId: je.Id, syncToken: je.SyncToken, docNumber: je.DocNumber,
      company: env.sandbox ? 'SANDBOX' : 'PRODUCTION', realmId,
    }
  } catch (e) {
    await supabaseAdmin.from('qbo_journal_entries').update({
      status: 'error', last_error: String(e.message || e).slice(0, 800),
      last_intuit_tid: e.intuitTid || null, updated_at: new Date().toISOString(),
    }).eq('id', row.id)
    throw e
  }
}

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
  const gate = await requireAdmin(req)
  if (!gate.ok) return res.status(401).json({ error: gate.reason })

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

    // Several entries in one call. Each is validated and saved as its own
    // draft; nothing posts here. Returns a row per entry so a bad one can be
    // fixed without losing the good ones.
    if (action === 'saveMany') {
      const client = clean(body.client)
      if (!client) return res.status(400).json({ error: 'Missing client slug.' })
      const entries = Array.isArray(body.entries) ? body.entries : []
      if (!entries.length) return res.status(400).json({ error: 'No entries given.' })
      if (entries.length > 50) return res.status(400).json({ error: 'Fifty entries at a time, maximum.' })

      const { env, token, realmId } = await getLiveToken(client)
      const allLines = entries.flatMap((e) => e.lines || [])
      const { accounts, customers } = await refsFor(env, token, realmId, allLines)

      const out = []
      for (const [i, e] of entries.entries()) {
        const built = buildJournalEntry({
          txnDate: e.txnDate, docNumber: e.docNumber, memo: e.memo, lines: e.lines,
        }, accounts, customers)
        if (built.errors.length) { out.push({ index: i, ok: false, docNumber: e.docNumber, errors: built.errors }); continue }

        if (e.docNumber) {
          const { data: dup } = await supabaseAdmin
            .from('qbo_journal_entries').select('id, qbo_id')
            .eq('client_slug', client).eq('doc_number', e.docNumber)
            .not('qbo_id', 'is', null).maybeSingle()
          if (dup) { out.push({ index: i, ok: false, docNumber: e.docNumber, errors: [`Already posted as QBO id ${dup.qbo_id}.`] }); continue }
        }

        const { data, error } = await supabaseAdmin.from('qbo_journal_entries').insert({
          client_slug: client, txn_date: e.txnDate, doc_number: e.docNumber || null,
          memo: e.memo || null, lines: e.lines, status: 'draft',
        }).select().single()
        if (error) { out.push({ index: i, ok: false, docNumber: e.docNumber, errors: [error.message] }); continue }
        out.push({
          index: i, ok: true, id: data.id, docNumber: e.docNumber, memo: e.memo, txnDate: e.txnDate,
          totals: built.totals, payload: built.payload,
          resolved: built.resolved, // what each written name matched in the real chart
        })
      }
      const bad = out.filter((o) => !o.ok).length
      return res.json({ ok: bad === 0, saved: out.length - bad, failed: bad, results: out })
    }

    // Post a set of already-saved drafts, one at a time so a failure part way
    // through leaves the earlier ones correctly recorded as posted.
    if (action === 'postMany') {
      if (body.confirm !== true) return res.status(400).json({ error: 'Posting requires confirm: true.' })
      const ids = Array.isArray(body.ids) ? body.ids : []
      if (!ids.length) return res.status(400).json({ error: 'No ids given.' })

      const out = []
      for (const id of ids) {
        try {
          const r = await postOne(id)
          out.push({ id, ok: true, qboId: r.qboId, docNumber: r.docNumber })
        } catch (e) {
          out.push({ id, ok: false, error: String(e.message || e) })
        }
      }
      const bad = out.filter((o) => !o.ok).length
      return res.json({ ok: bad === 0, posted: out.length - bad, failed: bad, results: out })
    }

    if (action === 'post') {
      if (body.confirm !== true) return res.status(400).json({ error: 'Posting requires confirm: true.' })
      try {
        const r = await postOne(body.id)
        return res.json({ ok: true, ...r })
      } catch (e) {
        const already = /Already in QuickBooks/.test(String(e.message))
        return res.status(already ? 409 : 502).json({ error: String(e.message || e), intuitTid: e.intuitTid || null })
      }
    }

    if (action === 'undo') {
      if (body.confirm !== true) return res.status(400).json({ error: 'Undo requires confirm: true.' })
      const { data: row } = await supabaseAdmin
        .from('qbo_journal_entries').select('*').eq('id', body.id).maybeSingle()
      if (!row) return res.status(404).json({ error: 'No such entry.' })
      if (!row.qbo_id) return res.status(400).json({ error: 'That entry was never posted.' })

      const { env, token, realmId } = await getLiveToken(row.client_slug)
      try {
        await deleteJournalEntry(env, token, realmId, row.qbo_id, row.qbo_sync_token)
      } catch (e) {
        // Somebody may have deleted it inside QuickBooks already. That is the
        // outcome we wanted, so record it instead of failing.
        const gone = e.faultCode === '610' || /not found|deleted|stale/i.test(String(e.message))
        if (!gone) throw e
        await supabaseAdmin.from('qbo_journal_entries').update({
          status: 'deleted', last_error: 'Already gone from QuickBooks when undo ran.',
          updated_at: new Date().toISOString(),
        }).eq('id', row.id)
        return res.json({ ok: true, deleted: row.qbo_id, note: 'It was already deleted in QuickBooks — marked it here to match.' })
      }
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

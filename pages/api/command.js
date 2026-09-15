// JK Command Center — passcode-gated. Reads/writes the jk_projects / jk_tasks / jk_prospects
// tables (Supabase). Private to JK; server-only via service role.
import { supabaseAdmin } from '../../lib/supabaseAdmin'

const CODE = process.env.JK_ADMIN_CODE

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const b = req.body || {}
  if (!CODE || b.passcode !== CODE) return res.status(401).json({ error: 'Wrong passcode.' })

  try {
    const action = b.action
    if (action === 'add_task') {
      if (!b.title || !b.title.trim()) return res.status(400).json({ error: 'Task needs a title.' })
      await supabaseAdmin.from('jk_tasks').insert({ title: b.title.trim(), project: b.project || null, priority: b.priority || 'med', due_date: b.due_date || null, source: 'jk' })
    } else if (action === 'toggle_task') {
      const { data: t } = await supabaseAdmin.from('jk_tasks').select('status').eq('id', b.id).single()
      const done = t && t.status === 'done'
      await supabaseAdmin.from('jk_tasks').update({ status: done ? 'open' : 'done', done_at: done ? null : new Date().toISOString() }).eq('id', b.id)
    } else if (action === 'set_task') {
      const patch = {}
      if (b.priority) patch.priority = b.priority
      if (b.status) patch.status = b.status
      if ('due_date' in b) patch.due_date = b.due_date || null
      if (Object.keys(patch).length) await supabaseAdmin.from('jk_tasks').update(patch).eq('id', b.id)
    } else if (action === 'del_task') {
      await supabaseAdmin.from('jk_tasks').delete().eq('id', b.id)
    } else if (action === 'set_project') {
      const patch = { updated_at: new Date().toISOString() }
      if (b.status) patch.status = b.status
      await supabaseAdmin.from('jk_projects').update(patch).eq('id', b.id)
    } else if (action === 'add_prospect') {
      if (!b.name || !b.name.trim()) return res.status(400).json({ error: 'Prospect needs a name.' })
      await supabaseAdmin.from('jk_prospects').insert({ name: b.name.trim(), company: b.company || null, source: b.source || 'linkedin', stage: b.stage || 'lead', demo_industry: b.demo_industry || null, next_followup: b.next_followup || null, notes: b.notes || null })
    } else if (action === 'set_prospect') {
      const patch = {}
      if (b.stage) patch.stage = b.stage
      if ('next_followup' in b) patch.next_followup = b.next_followup || null
      if (Object.keys(patch).length) await supabaseAdmin.from('jk_prospects').update(patch).eq('id', b.id)
    } else if (action === 'del_prospect') {
      await supabaseAdmin.from('jk_prospects').delete().eq('id', b.id)
    }

    const [{ data: projects }, { data: tasks }, { data: prospects }] = await Promise.all([
      supabaseAdmin.from('jk_projects').select('*').order('sort'),
      supabaseAdmin.from('jk_tasks').select('*').order('created_at', { ascending: true }),
      supabaseAdmin.from('jk_prospects').select('*').order('created_at', { ascending: true }),
    ])
    const open = (tasks || []).filter((t) => t.status !== 'done')
    const byProject = {}
    open.forEach((t) => { if (t.project) byProject[t.project] = (byProject[t.project] || 0) + 1 })
    const stats = {
      openTasks: open.length,
      highOpen: open.filter((t) => t.priority === 'high').length,
      doneTasks: (tasks || []).length - open.length,
      live: (projects || []).filter((p) => p.status === 'live').length,
      building: (projects || []).filter((p) => p.status === 'building' || p.status === 'onboarding').length,
      clients: (projects || []).filter((p) => p.kind === 'client').length,
      prospects: (prospects || []).length,
      openProspects: (prospects || []).filter((p) => p.stage !== 'won' && p.stage !== 'lost').length,
    }
    return res.status(200).json({ projects: projects || [], tasks: tasks || [], prospects: prospects || [], stats, byProject })
  } catch (e) {
    return res.status(500).json({ error: 'Command center request failed.' })
  }
}

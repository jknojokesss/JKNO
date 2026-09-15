// TEMP: create JK's monthly client invoices in his own QuickBooks ("jkno").
// Creates missing customers, then posts one draft (UNSENT) invoice each,
// dated the last day of the month, line = the "Services" item described as the
// month's services. Passcode-gated. Idempotent per invoice via requestId.
//   POST { passcode, dryRun:true }  -> resolves everything, writes NOTHING
//   POST { passcode }               -> creates customers + posts invoices
import { getLiveToken } from '../../../lib/qboAuth'
import { qboPost } from '../../../lib/qboWrite'
import { fetchArRefs, buildInvoice, postInvoice } from '../../../lib/qboAr'

const TXN_DATE = '2026-08-31'
const ITEM_DESC = 'August 2026 services'
const PLAN = [
  { customer: 'REYDEL SUPPLY NJ LLC', amount: 400, rid: 'svc-2026-08-reydel' },
  { customer: 'MNE Trading', amount: 500, rid: 'svc-2026-08-mne' },
  { customer: 'LEW Imports', amount: 25, rid: 'svc-2026-08-lew' },
]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.JK_ADMIN_CODE || req.body?.passcode !== process.env.JK_ADMIN_CODE) {
    return res.status(401).json({ error: 'Wrong passcode.' })
  }
  const dryRun = req.body?.dryRun === true
  try {
    const { env, token, realmId } = await getLiveToken('jkno')
    const refs = await fetchArRefs(env, token, realmId)
    const item = refs.items.find((i) => i.name.toLowerCase() === 'services') || refs.items.find((i) => i.type === 'Service')
    if (!item) return res.status(400).json({ error: 'No "Services" item found in the QBO item list.' })

    const results = []
    for (const p of PLAN) {
      let cust = refs.customers.find((c) => c.name.toLowerCase() === p.customer.toLowerCase())
      let createdCustomer = false
      if (!cust) {
        if (dryRun) { results.push({ customer: p.customer, amount: p.amount, plan: 'CREATE customer + draft invoice', item: item.name, desc: ITEM_DESC, date: TXN_DATE }); continue }
        const cr = await qboPost(env, token, realmId, 'customer', { DisplayName: p.customer })
        cust = { id: cr.Customer.Id, name: cr.Customer.DisplayName, email: null }
        createdCustomer = true
        refs.customers.push(cust)
      }
      if (dryRun) { results.push({ customer: cust.name, customerId: cust.id, amount: p.amount, plan: 'draft invoice (customer exists)', item: item.name, desc: ITEM_DESC, date: TXN_DATE }); continue }
      const built = buildInvoice({ customerId: cust.id, txnDate: TXN_DATE, lines: [{ itemId: item.id, qty: 1, rate: p.amount, description: ITEM_DESC }] }, refs)
      if (built.errors.length) { results.push({ customer: cust.name, error: built.errors.join('; ') }); continue }
      const posted = await postInvoice(env, token, realmId, built.payload, p.rid)
      const inv = posted.Invoice || {}
      results.push({ customer: cust.name, createdCustomer, amount: p.amount, docNumber: inv.DocNumber || null, invoiceId: inv.Id || null, total: inv.TotalAmt, date: TXN_DATE, sent: false })
    }
    return res.status(200).json({ dryRun, company: 'JK No Jokes Financials', item: item.name, txnDate: TXN_DATE, results })
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) })
  }
}

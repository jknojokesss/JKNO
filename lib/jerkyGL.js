// ============================================================
//  Jerky Munch — QuickBooks parser + P&L builder
//
//  Mirrors Reydel's books import (Chart of Accounts + General
//  Ledger -> store -> derive real P&L), adapted for Jerky's
//  own Supabase (client-side, RLS).
//
//    parseCoA(csv)          -> { rows, error }   coa_accounts columns
//    parseGL(csv)           -> { rows, error }   gl_transactions columns
//    buildPnl(glRows, coa)  -> monthly P&L, channel mix, expenses
//
//  Account classification is driven by the imported Chart of
//  Accounts (each account's QuickBooks type). If no CoA is
//  loaded, a name-based fallback is used and anything it can't
//  place is surfaced as "unclassified" rather than miscounted.
// ============================================================

const TITLE = new Set(['Jerky Munch', 'General Ledger'])
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// leaf of a QuickBooks colon-nested account name ("A:B:C" -> "C")
const leafOf = (n) => String(n || '').split(':').pop().trim()

// QuickBooks account type -> P&L bucket
export function classifyType(t) {
  const s = String(t || '').trim().toLowerCase()
  if (s === 'income' || s === 'other income') return 'income'
  if (s === 'cost of goods sold') return 'cogs'
  if (s === 'expenses' || s === 'other expense') return 'expense'
  return 'balance' // bank, A/R, assets, credit card, liabilities, equity
}

// ---- name-based fallback (used only when no CoA is loaded) --
const FALLBACK_COGS = new Set(['Cost of Goods Sold', 'Add ons', 'Meat/Ingredients', 'Packaging', 'Sauces', 'Spices', 'Vegetables', 'Shopify Selling Fees', 'Shopify Other Adjustments'])
const FALLBACK_BALANCE = new Set(['Jerky Munch (8851) - 1', 'Accounts Receivable (A/R)', 'Shopify - 9arpfq-xh Clearing Account', 'Shopify - 9arpfq-xh Other Payment Gateway Clearing Account', 'Small Equipment', 'Jerky Munch Chase Card Card', 'E Rutta - (6741)', 'R. RUTTA (6758) - 1', 'Shopify Sales Tax', 'Channel Sales Tax Payable', 'Owners Contribution', 'Retained Earnings', 'Expense Reimbursement', 'Opening Balance Equity', 'Charitable Contributions'])
function classifyByName(account) {
  const a = String(account || '').trim()
  if (!a) return 'unknown'
  if (FALLBACK_BALANCE.has(a)) return 'balance'
  if (FALLBACK_COGS.has(a)) return 'cogs'
  const l = a.toLowerCase()
  if (l.includes('cost of goods') || l === 'cogs') return 'cogs'
  if (l.includes('income') || l.includes('sales') || l.includes('discount')) return 'income'
  if (/(expense|fee|fees|advertis|marketing|payroll|shipping|labor|insurance|supplies|utilit|software|website|design|photograph|consult|kashrut|kitchen|meals|professional|repairs|gifts|bonus|education|organizer|improvement|bank service|merchant)/.test(l)) return 'expense'
  return 'unknown'
}

// classify one GL account, preferring the CoA map (leaf + full name)
export function classify(account, coaMap) {
  const a = String(account || '').trim()
  if (!a) return 'unknown'
  if (coaMap) {
    if (coaMap[a]) return coaMap[a]
    const lf = leafOf(a); if (coaMap[lf]) return coaMap[lf]
  }
  return classifyByName(a)
}

// ---- CSV helpers -------------------------------------------
function parseCSV(t) {
  const rows = []
  let row = [], cur = '', q = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (q) {
      if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++ } else q = false }
      else cur += ch
    } else {
      if (ch === '"') q = true
      else if (ch === ',') { row.push(cur); cur = '' }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
      else if (ch === '\r') { /* skip */ }
      else cur += ch
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row) }
  return rows
}
const num = (s) => {
  s = String(s || '').replace(/[$,]/g, '').trim()
  if (s === '' || s === '-') return 0
  const neg = s.startsWith('(') && s.endsWith(')')
  s = s.replace(/[()]/g, '')
  const v = parseFloat(s)
  return Number.isFinite(v) ? (neg ? -v : v) : 0
}
const toISO = (s) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s || '').trim())
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : ''
}
const round2 = (n) => Math.round(n * 100) / 100

// ---- Chart of Accounts export ------------------------------
export function parseCoA(csvText) {
  const grid = parseCSV(String(csvText || '').replace(/^﻿/, ''))
  const out = []
  for (const r of grid) {
    const name = String(r[0] || '').trim()
    if (!name || /^account name$/i.test(name)) continue
    out.push({
      account: name.slice(0, 300),
      leaf: leafOf(name).slice(0, 200),
      account_type: String(r[1] || '').trim().slice(0, 80),
      detail_type: String(r[2] || '').trim().slice(0, 120),
    })
  }
  if (out.length < 5) return { rows: [], error: `Only ${out.length} accounts parsed — check the Chart of Accounts export.` }
  return { rows: out, error: null }
}

// leaf/full-name -> bucket map from stored coa_accounts rows
export function coaMapFrom(coaRows) {
  const map = {}
  for (const c of (Array.isArray(coaRows) ? coaRows : [])) {
    const b = classifyType(c.account_type)
    map[c.leaf || leafOf(c.account)] = b
    if (c.account) map[c.account] = b
  }
  return map
}

// ---- General Ledger export ---------------------------------
export function parseGL(csvText) {
  const grid = parseCSV(String(csvText || '').replace(/^﻿/, ''))
  const out = []
  let section = null
  for (let r of grid) {
    r = [...r, '', '', '', '', '', '', '', '', '', ''].slice(0, 10)
    const [c0, , date, ttype, n, name, desc, split, amt] = r
    if (c0.trim() && !TITLE.has(c0.trim()) && !toISO(date) && !/,\s*20\d\d|January|December/.test(c0)) {
      section = c0.trim(); continue
    }
    const iso = toISO(date)
    if (iso && section) {
      out.push({
        txn_date: iso, account: section,
        txn_type: String(ttype || '').slice(0, 120), num: String(n || '').slice(0, 60),
        name: String(name || '').slice(0, 200), description: String(desc || '').slice(0, 400),
        split_account: String(split || '').slice(0, 200), amount: round2(num(amt)), source: 'quickbooks',
      })
    }
  }
  if (out.length < 10) return { rows: [], error: `Only ${out.length} valid GL rows parsed — check the file (expecting a QuickBooks General Ledger export).` }
  return { rows: out, error: null }
}

// ---- build the P&L -----------------------------------------
// glRows use gl_transactions columns; coaRows (optional) use coa_accounts columns.
export function buildPnl(glRows, coaRows) {
  glRows = Array.isArray(glRows) ? glRows : []
  const coaMap = (coaRows && coaRows.length) ? coaMapFrom(coaRows) : null

  // consignment store leaves — from CoA if available, else the known set
  let consignLeaves
  if (coaRows && coaRows.length) {
    consignLeaves = new Set(coaRows.filter(c => /^Consignment Sales:/.test(c.account)).map(c => c.leaf || leafOf(c.account)))
  } else {
    consignLeaves = new Set(['Aisle 9 Jackson', 'Aisle 9 Lakewood', 'Chick Chock', 'Evergreen Lakewood', 'Evergreen Monsey - 59', 'Evergreen Pomona', 'Gourmet Glatt Jackson', 'Gourmet Glatt South', "Khasky's - Snackify Deal", 'Nutmeg', 'The Cookie Corner', 'The Fishing Line', 'Vineyard North - Madison'])
  }

  const income = {}, cogs = {}, exp = {}, unknown = {}, acctTot = {}
  const add = (map, k, v) => { map[k] = (map[k] || 0) + v }
  const monthKeys = new Set()
  let firstDate = null, lastDate = null
  for (const r of glRows) {
    const acct = r.account
    const amt = Number(r.amount) || 0
    const iso = String(r.txn_date || r.date || '')
    const mk = iso.slice(0, 7)
    if (mk) monthKeys.add(mk)
    if (iso) { if (!firstDate || iso < firstDate) firstDate = iso; if (!lastDate || iso > lastDate) lastDate = iso }
    acctTot[acct] = (acctTot[acct] || 0) + amt
    const cls = classify(acct, coaMap)
    if (cls === 'income') add(income, mk, amt)
    else if (cls === 'cogs') add(cogs, mk, amt)
    else if (cls === 'expense') add(exp, mk, amt)
    else if (cls === 'unknown') add(unknown, mk, amt)
  }

  const months = [...monthKeys].sort().map((mk) => {
    const [y, m] = mk.split('-')
    const i = round2(income[mk] || 0), c = round2(cogs[mk] || 0), e = round2(exp[mk] || 0)
    return { key: mk, label: `${MONTHS[parseInt(m, 10)]} ${y}`, income: i, cogs: c, gross: round2(i - c), opex: e, net: round2(i - c - e) }
  })
  const sum = (o) => round2(Object.values(o).reduce((s, v) => s + v, 0))
  const I = sum(income), C = sum(cogs), E = sum(exp)
  const annual = { income: I, cogs: C, gross: round2(I - C), opex: E, net: round2(I - C - E) }

  const t = (a) => round2(acctTot[a] || 0)
  const channels = {
    invoiced: t('Sales'),
    deposits: t('Sales of Product Income'),
    private: round2(t('Private Sales') + t('Delivery Fee')),
    shopify: round2(t('Shopify Sales') + t('Shopify Shipping Income') + t('Shopify Discount')),
    consignment: round2([...consignLeaves].reduce((s, a) => s + t(a), 0)),
  }
  const byAcct = (cls) => Object.keys(acctTot).filter(a => classify(a, coaMap) === cls).map(a => ({ account: a, amount: t(a) })).sort((x, y) => y.amount - x.amount)
  return {
    months, annual, channels,
    topExpenses: byAcct('expense').slice(0, 8),
    cogsDetail: byAcct('cogs'),
    unclassified: byAcct('unknown'),
    rowCount: glRows.length,
    usedCoA: !!(coaRows && coaRows.length),
    firstDate, lastDate,
  }
}

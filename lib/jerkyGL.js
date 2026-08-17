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
  if (s.includes('expense')) return 'expense' // "Expense" (QBO), "Expenses" (manual), "Other Expense"
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
  let dated = 0
  for (let r of grid) {
    r = [...r, '', '', '', '', '', '', '', '', '', ''].slice(0, 10)
    const [c0, dist, date, ttype, n, name, desc, split, amt, bal] = r
    if (c0.trim() && !TITLE.has(c0.trim()) && !toISO(date) && !/,\s*20\d\d|January|December/.test(c0)) {
      section = c0.trim(); continue
    }
    // per-account opening balance (undated) — needed for the Balance Sheet
    if (String(dist || '').trim() === 'Beginning Balance' && section) {
      out.push({
        txn_date: null, account: section, txn_type: 'Beginning Balance',
        num: '', name: '', description: '', split_account: '',
        amount: round2(num(bal)), source: 'quickbooks',
      })
      continue
    }
    const iso = toISO(date)
    if (iso && section) {
      dated++
      out.push({
        txn_date: iso, account: section,
        txn_type: String(ttype || '').slice(0, 120), num: String(n || '').slice(0, 60),
        name: String(name || '').slice(0, 200), description: String(desc || '').slice(0, 400),
        split_account: String(split || '').slice(0, 200), amount: round2(num(amt)), source: 'quickbooks',
      })
    }
  }
  if (dated < 10) return { rows: [], error: `Only ${dated} valid GL rows parsed — check the file (expecting a QuickBooks General Ledger export).` }
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
    expenseDetail: byAcct('expense'),
    incomeDetail: byAcct('income'),
    cogsDetail: byAcct('cogs'),
    unclassified: byAcct('unknown').filter(x => Math.abs(x.amount) > 0.005),
    rowCount: glRows.length,
    usedCoA: !!(coaRows && coaRows.length),
    firstDate, lastDate,
  }
}

// ---- P&L statement for a single period (month or full year) --
// fromKey/toKey are 'YYYY-MM' inclusive; null/undefined = whole ledger (YTD).
export function periodPnl(glRows, coaRows, fromKey, toKey) {
  glRows = Array.isArray(glRows) ? glRows : []
  const coaMap = (coaRows && coaRows.length) ? coaMapFrom(coaRows) : null
  let consignLeaves
  if (coaRows && coaRows.length) {
    consignLeaves = new Set(coaRows.filter(c => /^Consignment Sales:/.test(c.account)).map(c => c.leaf || leafOf(c.account)))
  } else {
    consignLeaves = new Set(['Aisle 9 Jackson', 'Aisle 9 Lakewood', 'Chick Chock', 'Evergreen Lakewood', 'Evergreen Monsey - 59', 'Evergreen Pomona', 'Gourmet Glatt Jackson', 'Gourmet Glatt South', "Khasky's - Snackify Deal", 'Nutmeg', 'The Cookie Corner', 'The Fishing Line', 'Vineyard North - Madison'])
  }
  const inRange = (mk) => (!fromKey || mk >= fromKey) && (!toKey || mk <= toKey)
  const acctTot = {}
  let income = 0, cogs = 0, expense = 0
  for (const r of glRows) {
    const iso = String(r.txn_date || r.date || '')
    if (!iso) continue
    if (!inRange(iso.slice(0, 7))) continue
    const amt = Number(r.amount) || 0
    acctTot[r.account] = (acctTot[r.account] || 0) + amt
    const cls = classify(r.account, coaMap)
    if (cls === 'income') income += amt
    else if (cls === 'cogs') cogs += amt
    else if (cls === 'expense') expense += amt
  }
  const t = (a) => round2(acctTot[a] || 0)
  const channels = {
    invoiced: t('Sales'), deposits: t('Sales of Product Income'),
    private: round2(t('Private Sales') + t('Delivery Fee')),
    shopify: round2(t('Shopify Sales') + t('Shopify Shipping Income') + t('Shopify Discount')),
    consignment: round2([...consignLeaves].reduce((s, a) => s + t(a), 0)),
  }
  const mapOf = (cls) => {
    const m = {}
    for (const a of Object.keys(acctTot)) if (classify(a, coaMap) === cls && Math.abs(acctTot[a]) > 0.005) m[a] = round2(acctTot[a])
    return m
  }
  const I = round2(income), C = round2(cogs), E = round2(expense)
  return { income: { total: I, channels }, cogs: { total: C, map: mapOf('cogs') }, gross: round2(I - C), expenses: { total: E, map: mapOf('expense') }, net: round2(I - C - E) }
}

// ---- account-type helpers (for Balance Sheet / Cash Flow) --
export function accountTypeMap(coaRows) {
  const map = {}
  for (const c of (Array.isArray(coaRows) ? coaRows : [])) {
    if (!c.account_type) continue
    map[c.leaf || leafOf(c.account)] = c.account_type
    if (c.account) map[c.account] = c.account_type
  }
  return map
}
// QuickBooks account type -> balance-sheet section
const bsBucket = (t) => {
  const s = String(t || '').toLowerCase()
  if (s === 'bank' || s.includes('receivable') || s.includes('asset')) return 'asset'
  if (s.includes('credit card') || s.includes('liabilit') || s.includes('payable')) return 'liability'
  if (s === 'equity') return 'equity'
  if (s === 'income' || s === 'other income') return 'income'
  if (s === 'cost of goods sold') return 'cogs'
  if (s.includes('expense')) return 'expense'
  return 'other'
}

// ---- Balance Sheet (as of the latest transaction) ----------
// Ending balance per account = beginning balance + all activity.
export function buildBalanceSheet(glRows, coaRows) {
  glRows = Array.isArray(glRows) ? glRows : []
  const tmap = accountTypeMap(coaRows)
  const coaMap = (coaRows && coaRows.length) ? coaMapFrom(coaRows) : null
  const typeOf = (a) => tmap[a] || tmap[leafOf(a)] || ''

  const bal = {}
  let lastDate = null
  for (const r of glRows) {
    bal[r.account] = (bal[r.account] || 0) + (Number(r.amount) || 0)
    const iso = String(r.txn_date || r.date || '')
    if (iso && (!lastDate || iso > lastDate)) lastDate = iso
  }

  const assets = [], liabilities = [], equity = []
  let income = 0, cogs = 0, expense = 0
  for (const acc of Object.keys(bal)) {
    const v = round2(bal[acc])
    const b = bsBucket(typeOf(acc))
    if (b === 'asset') { if (Math.abs(v) > 0.005) assets.push({ account: acc, amount: v }) }
    else if (b === 'liability') { if (Math.abs(v) > 0.005) liabilities.push({ account: acc, amount: v }) }
    else if (b === 'equity') { if (Math.abs(v) > 0.005) equity.push({ account: acc, amount: v }) }
    else {
      const c = classify(acc, coaMap)
      if (c === 'income') income += v
      else if (c === 'cogs') cogs += v
      else if (c === 'expense') expense += v
    }
  }
  const byMag = (arr) => arr.sort((x, y) => Math.abs(y.amount) - Math.abs(x.amount))
  byMag(assets); byMag(liabilities); byMag(equity)
  const sum = (arr) => round2(arr.reduce((s, r) => s + r.amount, 0))
  const totalAssets = sum(assets)
  const totalLiab = sum(liabilities)
  const equityAccounts = sum(equity)
  const netIncome = round2(income - cogs - expense)
  const totalEquity = round2(equityAccounts + netIncome)
  const totalLiabEquity = round2(totalLiab + totalEquity)
  return {
    assets, liabilities, equity,
    totalAssets, totalLiab, equityAccounts, netIncome, totalEquity, totalLiabEquity,
    check: round2(totalAssets - totalLiabEquity),
    balanced: Math.abs(totalAssets - totalLiabEquity) < 0.5,
    lastDate, usedCoA: !!(coaRows && coaRows.length),
  }
}

// ---- Cash Flow (direct, from the bank account activity) ----
export function buildCashFlow(glRows, coaRows) {
  glRows = Array.isArray(glRows) ? glRows : []
  const tmap = accountTypeMap(coaRows)
  const typeOf = (a) => tmap[a] || tmap[leafOf(a)] || ''

  const bankAccts = new Set()
  for (const c of (coaRows || [])) {
    if (String(c.account_type).toLowerCase() === 'bank') bankAccts.add(c.leaf || leafOf(c.account))
  }
  if (!bankAccts.size) bankAccts.add('Jerky Munch (8851) - 1')
  const isBank = (a) => bankAccts.has(a) || bankAccts.has(leafOf(a))

  // category of a cash movement, by the OTHER side (split) of the entry
  const cat = (split) => {
    if (/clearing|pending|reserve/i.test(split)) return 'operating' // Shopify payouts = sales
    const t = String(typeOf(split) || '').toLowerCase()
    if (t === 'income' || t === 'other income' || t === 'cost of goods sold' || t.includes('expense')) return 'operating'
    if (t.includes('receivable') || t.includes('payable')) return 'operating'
    if (t === 'equity') return 'financing'
    if (t.includes('credit card') || t.includes('liabilit')) return 'financing'
    if (t === 'bank') return 'transfer'
    if (t.includes('asset')) return 'investing'
    return 'operating'
  }

  let beginningCash = 0, lastDate = null
  const b = { operating: 0, investing: 0, financing: 0, transfer: 0 }
  for (const r of glRows) {
    if (!isBank(r.account)) continue
    const amt = Number(r.amount) || 0
    if (r.txn_type === 'Beginning Balance' || !r.txn_date) { beginningCash += amt; continue }
    const c = cat(r.split_account)
    b[c] += amt
    const iso = String(r.txn_date || '')
    if (iso && (!lastDate || iso > lastDate)) lastDate = iso
  }
  beginningCash = round2(beginningCash)
  const operating = round2(b.operating), investing = round2(b.investing), financing = round2(b.financing), transfer = round2(b.transfer)
  const netChange = round2(operating + investing + financing + transfer)
  return {
    beginningCash, operating, investing, financing, transfer,
    netChange, endingCash: round2(beginningCash + netChange),
    lastDate, usedCoA: !!(coaRows && coaRows.length),
  }
}

// Canonical advertiser names — fold obvious variants of the SAME vendor
// together (display-only; QuickBooks is never touched). Keys are lowercased.
const AD_ALIAS = {
  'bp weekly': 'BP', 'bp': 'BP',
  'wmdi/aije': 'WMDI', 'wmdi': 'WMDI', 'aije': 'WMDI',
  'efraim feder status': 'Efraim Feder',
  'township of lake': 'Township of Lakewood', 'township of lakewood': 'Township of Lakewood',
  'jxt group': 'JXT Group',
}
function titleCase(s) { return s.toLowerCase().replace(/\b([a-z])/g, (m, c) => c.toUpperCase()) }
// tidy a raw payee string and map it to its canonical name
function cleanVendor(raw) {
  // strip a trailing confirmation/trace code (a 5+ char token containing a digit),
  // but never a real word like "SHOPPER" or "GRAPHICS"
  let s = String(raw || '').replace(/\s+\S{4,}$/, (t) => /\d/.test(t) ? '' : t).replace(/\s{2,}/g, ' ').trim()
  if (!s) return 'Other / uncategorized'
  // title-case multi-word ALL-CAPS memos ("LAKEWOOD SHOPPER" -> "Lakewood Shopper");
  // leave single-token all-caps alone so acronyms (BP, WMDI, CBN) survive
  if (/\s/.test(s) && s === s.toUpperCase()) s = titleCase(s)
  const key = s.toLowerCase().replace(/[.,]/g, '').trim()
  return AD_ALIAS[key] || s
}

// ---- Real ad spend by advertiser (from the GL) -------------
export function buildAdSpend(glRows, coaRows) {
  glRows = Array.isArray(glRows) ? glRows : []
  // advertising spend = the main "Advertising/Marketing" account only
  // (Graphics Design & Photography excluded for now, per JK)
  let adLeaves = new Set()
  for (const c of (coaRows || [])) {
    if (c.account === 'Advertising/Marketing') adLeaves.add(c.leaf || leafOf(c.account))
  }
  if (!adLeaves.size) adLeaves = new Set(['Advertising/Marketing'])
  const isAd = (a) => adLeaves.has(a) || adLeaves.has(leafOf(a))
  // best-effort payee from name, else parsed out of the bank memo
  const payee = (name, desc) => {
    if (name && name.trim()) return cleanVendor(name)
    const d = String(desc || '').trim()
    if (!d) return 'Other / uncategorized'
    let m = /payment (?:to|from) (.+)$/i.exec(d)
    if (m && m[1]) return cleanVendor(m[1])
    m = /ORIG CO NAME:\s*([A-Za-z][A-Za-z .&'\-]+?)(?:\s+ORIG|\s{2,}|$)/.exec(d)
    if (m) return cleanVendor(m[1])
    // unparseable bank/ACH strings — leave uncategorized
    if (/TRACE#|IND ID:|EED:|CO ENTRY|ORIG ID:/.test(d)) return 'Other / uncategorized'
    // card-processor prefixes: "SQ *NAME", "PAYPAL *NAME", "TST* NAME"
    m = /^(?:SQ|SP|TST|PAYPAL|PP|CKO|WPY|SQU|IN)\s*\*\s*(.+)$/i.exec(d)
    if (m) return cleanVendor(m[1])
    // doubled card swipe "NAME* NAME ..." — take the text before the star
    if (d.includes('*')) return cleanVendor(d.split('*')[0])
    // a short, name-like memo (no long digit runs) is itself the vendor
    if (d.length <= 40 && !/\d{4,}/.test(d)) return cleanVendor(d)
    return 'Other / uncategorized'
  }
  const byCat = {}, byVendor = {}
  const monthSet = new Set()
  const cell = {} // vendor -> monthKey -> { amt, rows:[] }
  let total = 0, lastDate = null
  for (const r of glRows) {
    if (!r.txn_date || !isAd(r.account)) continue
    const amt = Number(r.amount) || 0
    total += amt
    byCat[r.account] = round2((byCat[r.account] || 0) + amt)
    const p = payee(r.name, r.description)
    byVendor[p] = round2((byVendor[p] || 0) + amt)
    const mk = String(r.txn_date).slice(0, 7)
    monthSet.add(mk)
    cell[p] = cell[p] || {}
    cell[p][mk] = cell[p][mk] || { amt: 0, rows: [] }
    cell[p][mk].amt = round2(cell[p][mk].amt + amt)
    cell[p][mk].rows.push({ name: r.name, txn_type: r.txn_type, txn_date: r.txn_date, description: r.description, amount: amt })
    if (String(r.txn_date) > (lastDate || '')) lastDate = r.txn_date
  }
  const toArr = (o) => Object.keys(o).map(k => ({ name: k, amount: o[k] })).sort((a, b) => b.amount - a.amount)
  const months = [...monthSet].sort().map((mk) => ({ key: mk, label: `${MONTHS[parseInt(mk.slice(5, 7), 10)]} ${mk.slice(2, 4)}` }))
  const vendorsArr = toArr(byVendor)
  const monthTotals = {}
  for (const mk of monthSet) monthTotals[mk] = round2(vendorsArr.reduce((s, v) => s + ((cell[v.name] && cell[v.name][mk] && cell[v.name][mk].amt) || 0), 0))
  // per-vendor spread: how much the monthly amount varies (for vendors seen 2+ months)
  const matrix = vendorsArr.map((v) => {
    const bm = cell[v.name] || {}
    const vals = months.map(m => bm[m.key] ? bm[m.key].amt : null)
    const present = vals.filter(x => x != null && x > 0.005)
    const lo = present.length ? Math.min(...present) : 0
    const hi = present.length ? Math.max(...present) : 0
    return { name: v.name, total: v.amount, byMonth: bm, monthsActive: present.length, spread: round2(hi - lo), steady: present.length >= 2 && (hi - lo) <= 0.01 }
  })
  return { total: round2(total), byCategory: toArr(byCat), vendors: vendorsArr, months, matrix, monthTotals, lastDate }
}

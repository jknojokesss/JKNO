/** Local store billing state for Primal Krisp sample (no persistence). */

export const AS_OF = '2026-09-30'

const round2 = (n) => Math.round(n * 100) / 100

export function isConsignmentStore(store) {
  return (store.sample?.terms || '').includes('Consignment')
}

export function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function addDays(iso, days) {
  const d = parseIso(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(fromIso, toIso) {
  const a = parseIso(fromIso).getTime()
  const b = parseIso(toIso).getTime()
  return Math.round((b - a) / 86400000)
}

function maxInvoiceNum(stores) {
  let max = 1042
  stores.forEach((st) => {
    ;(st.sample.invoices || []).forEach((inv) => {
      const m = String(inv.invoice).match(/^PK-(\d+)$/)
      if (m) max = Math.max(max, Number(m[1]))
    })
  })
  return max
}

function shelfSent(sample) {
  if (sample.shelf_sent != null) return sample.shelf_sent
  return (sample.cases_sent_sept || 0) * (sample.bags_per_case || 12)
}

function normalizeInvoices(sample, price) {
  const list = (sample.invoices || []).map((inv) => ({
    ...inv,
    bags: inv.bags ?? round2(inv.amount / price),
    due: inv.due || addDays(inv.issued, 30),
    terms: inv.terms || 'Net 30',
    status: inv.status || (inv.days_outstanding === 0 ? 'Paid' : 'Open'),
    paid_date: inv.paid_date || (inv.status === 'Paid' ? inv.issued : null),
  }))
  return list
}

function bagsBilledFromInvoices(invoices) {
  return invoices.reduce((s, inv) => s + (inv.bags || 0), 0)
}

export function initBillingFromData(DATA) {
  const stores = DATA.stores.list.map((st) => {
    const price = st.sample.price_per_bag
    const invoices = normalizeInvoices(st.sample, price)
    const sent = shelfSent(st.sample)
    const returned = st.sample.shelf_returned ?? st.sample.bags_unaccounted ?? 0
    const onShelf = st.sample.shelf_on_shelf ?? st.sample.on_shelf_last_count ?? 0
    const sold = Math.max(0, sent - onShelf - returned)
    let bagsBilled = st.sample.bags_billed
    if (bagsBilled == null) bagsBilled = bagsBilledFromInvoices(invoices)
    const openBalance = round2(
      invoices.filter((i) => i.status === 'Open').reduce((a, i) => a + i.amount, 0),
    )
    return {
      ...st,
      sample: {
        ...st.sample,
        invoices,
        shelf_sent: sent,
        shelf_on_shelf: onShelf,
        shelf_returned: returned,
        bags_billed: bagsBilled,
        open_balance: openBalance,
        open_invoices: invoices.filter((i) => i.status === 'Open'),
      },
    }
  })
  return {
    stores,
    nextInvoiceNum: maxInvoiceNum(stores) + 1,
  }
}

export function shelfSold(sample) {
  const sent = sample.shelf_sent ?? 0
  const on = sample.shelf_on_shelf ?? 0
  const ret = sample.shelf_returned ?? 0
  return Math.max(0, sent - on - ret)
}

export function unbilledBags(sample) {
  return Math.max(0, shelfSold(sample) - (sample.bags_billed || 0))
}

export function invoiceStatus(inv, asOf = AS_OF) {
  if (inv.status === 'Paid') return 'Paid'
  if (inv.due && inv.due < asOf) return 'Overdue'
  return 'Open'
}

export function openInvoiceTotal(store) {
  return round2(
    (store.sample.invoices || [])
      .filter((i) => i.status === 'Open')
      .reduce((a, i) => a + i.amount, 0),
  )
}

export function computeAging(stores, asOf = AS_OF) {
  const aging = { '0-30': 0, '31-60': 0, '61-90': 0 }
  stores.forEach((st) => {
    ;(st.sample.invoices || []).forEach((inv) => {
      if (inv.status !== 'Open') return
      const days = daysBetween(inv.issued, asOf)
      if (days <= 30) aging['0-30'] += inv.amount
      else if (days <= 60) aging['31-60'] += inv.amount
      else aging['61-90'] += inv.amount
    })
  })
  Object.keys(aging).forEach((k) => {
    aging[k] = round2(aging[k])
  })
  return aging
}

export function totalOwed(stores) {
  return round2(stores.reduce((s, st) => s + openInvoiceTotal(st), 0))
}

export function subtotalOwed(stores, consignment) {
  return round2(
    stores
      .filter((st) => isConsignmentStore(st) === consignment)
      .reduce((s, st) => s + openInvoiceTotal(st), 0),
  )
}

function syncStoreBalances(store) {
  const open = openInvoiceTotal(store)
  store.sample.open_balance = open
  store.sample.open_invoices = (store.sample.invoices || []).filter((i) => i.status === 'Open')
  return store
}

export function billingReducer(state, action) {
  switch (action.type) {
    case 'SAVE_COUNT': {
      const onShelf = Math.max(0, Number(action.onShelf))
      const stores = state.stores.map((st) => {
        if (st.name !== action.storeName) return st
        const sample = { ...st.sample, shelf_on_shelf: onShelf }
        return syncStoreBalances({ ...st, sample })
      })
      return { ...state, stores }
    }
    case 'BILL_SOLD': {
      const stores = state.stores.map((st) => {
        if (st.name !== action.storeName) return st
        const sample = { ...st.sample }
        const unbilled = unbilledBags(sample)
        if (unbilled <= 0) return st
        const amount = round2(unbilled * sample.price_per_bag)
        const num = state.nextInvoiceNum
        const inv = {
          invoice: `PK-${num}`,
          issued: AS_OF,
          due: addDays(AS_OF, 30),
          terms: 'Net 30',
          amount,
          bags: unbilled,
          days_outstanding: 0,
          status: 'Open',
        }
        sample.invoices = [inv, ...sample.invoices]
        sample.bags_billed = (sample.bags_billed || 0) + unbilled
        return syncStoreBalances({ ...st, sample })
      })
      return { ...state, stores, nextInvoiceNum: state.nextInvoiceNum + 1 }
    }
    case 'CREATE_INVOICE': {
      const { storeName, bags, price, terms, issued } = action
      const stores = state.stores.map((st) => {
        if (st.name !== storeName) return st
        const sample = { ...st.sample }
        const days = terms === 'Net 15' ? 15 : 30
        const amount = round2(bags * price)
        const num = state.nextInvoiceNum
        const inv = {
          invoice: `PK-${num}`,
          issued,
          due: addDays(issued, days),
          terms,
          amount,
          bags,
          days_outstanding: daysBetween(issued, AS_OF),
          status: 'Open',
        }
        sample.invoices = [inv, ...sample.invoices]
        return syncStoreBalances({ ...st, sample })
      })
      return { ...state, stores, nextInvoiceNum: state.nextInvoiceNum + 1 }
    }
    case 'MARK_PAID': {
      const stores = state.stores.map((st) => {
        if (st.name !== action.storeName) return st
        const sample = {
          ...st.sample,
          invoices: st.sample.invoices.map((inv) =>
            inv.invoice === action.invoiceId
              ? { ...inv, status: 'Paid', paid_date: AS_OF, days_outstanding: 0 }
              : inv,
          ),
        }
        return syncStoreBalances({ ...st, sample })
      })
      return { ...state, stores }
    }
    case 'MARK_UNPAID': {
      const stores = state.stores.map((st) => {
        if (st.name !== action.storeName) return st
        const sample = {
          ...st.sample,
          invoices: st.sample.invoices.map((inv) =>
            inv.invoice === action.invoiceId
              ? {
                  ...inv,
                  status: 'Open',
                  paid_date: null,
                  days_outstanding: daysBetween(inv.issued, AS_OF),
                }
              : inv,
          ),
        }
        return syncStoreBalances({ ...st, sample })
      })
      return { ...state, stores }
    }
    default:
      return state
  }
}

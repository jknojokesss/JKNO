import { useState, useMemo, useEffect, useRef, Fragment } from 'react'
import {
  AS_OF,
  isConsignmentStore,
  shelfSold,
  unbilledBags,
  invoiceStatus,
  openInvoiceTotal,
  computeAging,
  totalOwed,
  subtotalOwed,
  addDays,
  daysBetween,
} from './primalKrispStoreBilling'
import { SPICE, CHAR, KRAFT, CREAM, CARDBG, INK, MUTED, BORDER, AMBER, RED, GREEN, UI, MONO, money, fmtAsOfLong, fmtInt, TieMark } from './primalKrispUtils'
import { ArAgingBars } from './PrimalKrispCharts'
import PrimalKrispDueToReorder from './primal-krisp/PrimalKrispDueToReorder'

const AGING_FILTERS = {
  aging_0_30: { bucket: '0-30', label: '0-30 days open' },
  aging_31_60: { bucket: '31-60', label: '31-60 days open' },
  aging_61_90: { bucket: '61-90', label: '61-90 days open' },
}

function bucketAmountForInvoice(inv, bucket, asOf = AS_OF) {
  if (inv.status !== 'Open') return 0
  const days = daysBetween(inv.issued, asOf)
  if (bucket === '0-30') return days <= 30 ? inv.amount : 0
  if (bucket === '31-60') return days > 30 && days <= 60 ? inv.amount : 0
  return days > 60 ? inv.amount : 0
}

const round2 = (n) => Math.round(n * 100) / 100

function storeBucketOpenTotal(store, filterKey) {
  const bucket = AGING_FILTERS[filterKey]?.bucket
  if (!bucket) return 0
  return round2((store.sample.invoices || []).reduce((s, inv) => s + bucketAmountForInvoice(inv, bucket), 0))
}

const PRINT_CSS = `@media print{
body{background:#fff!important}
.pk-shell,.pk-side,.DemoLobby,.pk-stores-ui{display:none!important}
.pk-invoice-print{display:block!important;position:static!important;padding:24px!important}
}`

function Seg({ options, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden', flexWrap: 'wrap' }}>
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          style={{
            padding: '8px 14px',
            minHeight: 40,
            border: 'none',
            background: value === id ? CHAR : 'transparent',
            color: value === id ? CREAM : MUTED,
            fontFamily: UI,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function StatusPill({ status }) {
  const c = status === 'Paid' ? GREEN : status === 'Overdue' ? RED : AMBER
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: c, padding: '4px 10px', borderRadius: 12 }}>
      {status}
    </span>
  )
}

function InvoiceSheet({ inv, store, onClose, onPrint }) {
  return (
    <div className="pk-invoice-print" style={{ background: CARDBG, border: `1px solid ${BORDER}`, borderRadius: 2, padding: 20, maxWidth: 640, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 22, color: INK }}>Primal Krisp</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4, letterSpacing: '0.6px' }}>INVOICE</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: MUTED, fontFamily: MONO }}>
          <div>{inv.invoice}</div>
          <div>Date {fmtAsOfLong(inv.issued)}</div>
          <div>Due {inv.due ? fmtAsOfLong(inv.due) : '—'}</div>
          <div>{inv.terms}</div>
        </div>
      </div>
      <div style={{ marginTop: 18, fontSize: 13 }}>
        <div style={{ ...{ fontSize: 11, fontWeight: 600, color: KRAFT, textTransform: 'uppercase' } }}>Bill to</div>
        <div style={{ fontWeight: 600, color: INK, marginTop: 4 }}>{store.name}</div>
        <div style={{ color: MUTED }}>{store.region}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20, fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
            {['Item', 'Bags', 'Price', 'Amount'].map((h) => (
              <th key={h} style={{ textAlign: h === 'Item' ? 'left' : 'right', padding: '8px 4px', fontSize: 10, color: KRAFT, textTransform: 'uppercase' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px 4px' }}>Primal Krisp, assorted flavors</td>
            <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO }}>{fmtInt(inv.bags)}</td>
            <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO }}>{money(store.sample.price_per_bag)}</td>
            <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO }}>{money(inv.amount)}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, fontFamily: MONO, fontWeight: 700, fontSize: 15 }}>
        Total due {money(inv.amount)}
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: MUTED }}>Sample invoice. Fictitious.</div>
      <div className="pk-stores-ui" style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button type="button" onClick={onPrint} style={{ flex: 1, minHeight: 40, background: SPICE, color: '#fff', border: 'none', borderRadius: 2, fontWeight: 600, cursor: 'pointer' }}>
          Print / PDF
        </button>
        <button type="button" onClick={onClose} style={{ flex: 1, minHeight: 40, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 2, fontWeight: 600, cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  )
}

export default function PrimalKrispStoresTab({
  billingState,
  dispatch,
  card,
  lbl,
  big,
  btn,
  inp,
  KPI,
  Row,
  period,
  storeKpis,
  listFilter,
  setListFilter,
  listFilterLabel,
  FilterChip,
  regions,
  regionFilter,
  setRegionFilter,
  storeSearch,
  setStoreSearch,
  storeSort,
  setStoreSort,
  SortBtn,
  reorderFocus,
}) {
  const [side, setSide] = useState('consignment')
  const [reorderDetail, setReorderDetail] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [preview, setPreview] = useState(null)
  const [countDraft, setCountDraft] = useState({})
  const [forms, setForms] = useState({})
  const listAnchorRef = useRef(null)

  const stores = billingState.stores
  const owedTotal = totalOwed(stores)
  const aging = useMemo(() => computeAging(stores), [stores])
  const agingSum = Object.values(aging).reduce((a, b) => a + b, 0)
  const consignmentCount = stores.filter(isConsignmentStore).length
  const invoiceCount = stores.length - consignmentCount
  const consignmentOwed = subtotalOwed(stores, true)
  const invoiceOwed = subtotalOwed(stores, false)

  const agingFilterActive = listFilter && AGING_FILTERS[listFilter]

  useEffect(() => {
    if (!agingFilterActive) return
    const id = requestAnimationFrame(() => {
      listAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(id)
  }, [listFilter, agingFilterActive])

  const filtered = useMemo(() => {
    const q = storeSearch.trim().toLowerCase()
    let rows = stores.filter((s) => {
      if (!agingFilterActive && isConsignmentStore(s) !== (side === 'consignment')) return false
      if (regionFilter !== 'All' && s.region !== regionFilter) return false
      if (listFilter === 'open_balance' && !(openInvoiceTotal(s) > 0)) return false
      if (listFilter === 'past60') {
        const has = (s.sample.invoices || []).some((inv) => invoiceStatus(inv) === 'Overdue' || (inv.status === 'Open' && inv.days_outstanding > 60))
        if (!has) return false
      }
      if (agingFilterActive && storeBucketOpenTotal(s, listFilter) <= 0) return false
      if (listFilter === 'unaccounted' && !(s.sample.bags_unaccounted > 0)) return false
      if (q && !(`${s.name} ${s.city}`.toLowerCase().includes(q))) return false
      return true
    })
    const dir = storeSort.dir === 'asc' ? 1 : -1
    rows = [...rows].sort((a, b) => {
      const sa = a.sample
      const sb = b.sample
      if (storeSort.key === 'name') return a.name.localeCompare(b.name) * dir
      if (storeSort.key === 'bags') {
        const va = period === 'week' ? sa.bags_sold_week || 0 : sa.bags_sold_sept || 0
        const vb = period === 'week' ? sb.bags_sold_week || 0 : sb.bags_sold_sept || 0
        return (va - vb) * dir
      }
      return (openInvoiceTotal(a) - openInvoiceTotal(b)) * dir
    })
    return rows
  }, [stores, side, regionFilter, listFilter, storeSearch, storeSort, period, agingFilterActive])

  const filterChipLabel = useMemo(() => {
    if (!agingFilterActive) return listFilterLabel
    const bucket = AGING_FILTERS[listFilter].bucket
    const expected = aging[bucket] || 0
    const actual = round2(filtered.reduce((s, st) => s + storeBucketOpenTotal(st, listFilter), 0))
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span>{AGING_FILTERS[listFilter].label} · {money(actual)}</span>
        <TieMark expected={expected} actual={actual} />
      </span>
    )
  }, [agingFilterActive, listFilter, listFilterLabel, aging, filtered])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach((st) => {
      if (!map[st.region]) map[st.region] = []
      map[st.region].push(st)
    })
    return map
  }, [filtered])

  const getForm = (name, price) => {
    if (!forms[name]) {
      return { bags: '', price: String(price), terms: 'Net 30', issued: AS_OF }
    }
    return forms[name]
  }

  const setForm = (name, defaultPrice, patch) =>
    setForms((f) => ({ ...f, [name]: { ...getForm(name, defaultPrice), ...patch } }))

  const openPreview = (store, inv) => setPreview({ store, inv })

  const renderInvoiceList = (st) => (
    <div style={{ marginTop: 14 }}>
      <div style={{ ...lbl, marginBottom: 8 }}>Invoices</div>
      {(st.sample.invoices || []).map((inv) => {
        const stLabel = invoiceStatus(inv)
        return (
          <div key={inv.invoice} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${CREAM}` }}>
            <span style={{ fontFamily: MONO, fontWeight: 600, minWidth: 72 }}>{inv.invoice}</span>
            <span style={{ fontSize: 12, color: MUTED }}>{fmtAsOfLong(inv.issued)}</span>
            <span style={{ fontSize: 12, color: MUTED }}>Due {inv.due ? fmtAsOfLong(inv.due) : '—'}</span>
            <span style={{ fontFamily: MONO }}>{money(inv.amount)}</span>
            <StatusPill status={stLabel} />
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => openPreview(st, inv)} style={{ ...btn, minHeight: 40, padding: '6px 12px', border: `1px solid ${BORDER}`, borderRadius: 2, background: CARDBG }}>
                View
              </button>
              {stLabel !== 'Paid' ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'MARK_PAID', storeName: st.name, invoiceId: inv.invoice })}
                  style={{ ...btn, minHeight: 40, padding: '6px 12px', border: 'none', borderRadius: 2, background: CHAR, color: CREAM }}
                >
                  Mark paid
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'MARK_UNPAID', storeName: st.name, invoiceId: inv.invoice })}
                  style={{ ...btn, minHeight: 40, padding: '6px 12px', border: `1px solid ${BORDER}`, borderRadius: 2, background: CARDBG }}
                >
                  Mark unpaid
                </button>
              )}
            </div>
          </div>
        )
      })}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTop: `1px solid ${BORDER}`, fontWeight: 600 }}>
        <span>Balance owed</span>
        <span style={{ fontFamily: MONO, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <TieMark expected={openInvoiceTotal(st)} actual={(st.sample.invoices || []).filter((i) => i.status === 'Open').reduce((a, i) => a + i.amount, 0)} />
          {money(openInvoiceTotal(st))}
        </span>
      </div>
    </div>
  )

  return (
    <div className="pk-stores-ui">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <PrimalKrispDueToReorder
        card={card}
        lbl={lbl}
        btn={btn}
        focusScroll={reorderFocus}
        onDetailChange={setReorderDetail}
      />
      {!reorderDetail && (
      <>
      <div style={{ marginBottom: 16 }}>
        <Seg
          value={side}
          onChange={setSide}
          options={[
            ['consignment', `Consignment (${consignmentCount})`],
            ['invoice', `Invoice (${invoiceCount})`],
          ]}
        />
      </div>

      <FilterChip label={filterChipLabel} onClear={() => setListFilter(null)} />

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <KPI k="Owed by stores" v={money(owedTotal)} accent={AMBER} onClick={() => setListFilter('open_balance')} />
        <KPI
          k={side === 'consignment' ? 'Consignment owed' : 'Invoice owed'}
          v={money(side === 'consignment' ? consignmentOwed : invoiceOwed)}
        />
        <KPI
          k={period === 'week' ? 'Bags sold this week' : 'Bags sold to stores'}
          v={fmtInt(storeKpis.bagsSold)}
        />
        <KPI k="Past 60 days" v={money(aging['61-90'])} accent={aging['61-90'] ? RED : INK} onClick={() => setListFilter('past60')} />
      </div>

      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ ...lbl, marginBottom: '10px' }}>AR aging — open store balances</div>
        <ArAgingBars aging={aging} onBarClick={setListFilter} />
        <Row l="Total" v={money(owedTotal)} bold top tieExpected={owedTotal} tieActual={agingSum} />
      </div>

      <div ref={listAnchorRef} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center', scrollMarginTop: 72 }}>
        <input
          type="search"
          placeholder="Search store or city"
          value={storeSearch}
          onChange={(e) => setStoreSearch(e.target.value)}
          style={{ ...inp, flex: '1 1 200px', minHeight: 40, width: '100%', maxWidth: '100%' }}
          aria-label="Search stores"
        />
        <SortBtn label="Balance" sortKey="balance" current={storeSort} onSort={setStoreSort} />
        <SortBtn label="Name" sortKey="name" current={storeSort} onSort={setStoreSort} />
        <SortBtn label="Bags sold" sortKey="bags" current={storeSort} onSort={setStoreSort} />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {regions.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegionFilter(r)}
            style={{
              padding: '6px 14px',
              borderRadius: 18,
              border: `1px solid ${regionFilter === r ? CHAR : BORDER}`,
              background: regionFilter === r ? CHAR : CARDBG,
              color: regionFilter === r ? CREAM : MUTED,
              ...btn,
              fontSize: 12,
              minHeight: 40,
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([region, list]) => (
        <Fragment key={region}>
          <div style={{ ...lbl, margin: '8px 0 10px', color: KRAFT }}>{region}</div>
          {list.map((st) => {
            const s = st.sample
            const open = openInvoiceTotal(st)
            const displayOpen = agingFilterActive ? storeBucketOpenTotal(st, listFilter) : open
            const isOpen = expanded === st.name
            const consignment = isConsignmentStore(st)
            const sold = shelfSold(s)
            const unbilled = unbilledBags(s)
            const openCount = (s.invoices || []).filter((i) => i.status === 'Open').length
            const hasOverdue = (s.invoices || []).some((inv) => invoiceStatus(inv) === 'Overdue')
            const form = getForm(st.name, s.price_per_bag)
            const bagsN = Number(form.bags) || 0
            const priceN = Number(form.price) || s.price_per_bag
            const dueRead = form.terms === 'Net 15' ? addDays(form.issued, 15) : addDays(form.issued, 30)
            const draftInv = {
              invoice: `PK-${billingState.nextInvoiceNum}`,
              issued: form.issued,
              due: dueRead,
              terms: form.terms,
              bags: bagsN,
              amount: Math.round(bagsN * priceN * 100) / 100,
            }

            return (
              <div
                key={st.name}
                style={{
                  ...card,
                  marginBottom: 12,
                  borderColor: isOpen ? CHAR : hasOverdue ? '#E7C3B8' : BORDER,
                  padding: '14px 16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : st.name)}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: 0,
                    minHeight: 44,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ ...big, fontSize: 20, color: INK }}>{st.name}</div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                        {st.region} · {money(s.price_per_bag)}/bag
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {!consignment && openCount > 0 && <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>{openCount} open</div>}
                      <span style={{ ...big, fontSize: 16, fontFamily: MONO }}>{money(displayOpen)}</span>
                    </div>
                  </div>
                </button>

                {isOpen && consignment && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                    <div style={{ ...lbl, marginBottom: 8 }}>Shelf count</div>
                    <Row l="Sent" v={fmtInt(s.shelf_sent)} />
                    <Row l="On shelf" v={fmtInt(s.shelf_on_shelf)} />
                    <Row l="Returned" v={fmtInt(s.shelf_returned || 0)} />
                    <Row l="Sold" v={fmtInt(sold)} bold />
                    <Row l="Billed" v={fmtInt(s.bags_billed || 0)} />
                    <Row l="Not billed yet" v={fmtInt(unbilled)} />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
                      <label style={{ fontSize: 12, color: MUTED, flex: '1 1 120px' }}>
                        Count on shelf
                        <input
                          type="number"
                          min={0}
                          value={countDraft[st.name] ?? s.shelf_on_shelf}
                          onChange={(e) => setCountDraft((d) => ({ ...d, [st.name]: e.target.value }))}
                          style={{ ...inp, display: 'block', width: '100%', marginTop: 4, minHeight: 40 }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const v = Number(countDraft[st.name] ?? s.shelf_on_shelf)
                          dispatch({ type: 'SAVE_COUNT', storeName: st.name, onShelf: v })
                        }}
                        style={{ ...btn, minHeight: 40, padding: '10px 16px', border: `1px solid ${BORDER}`, borderRadius: 2, background: CARDBG }}
                      >
                        Save count
                      </button>
                      <button
                        type="button"
                        disabled={unbilled <= 0}
                        onClick={() => dispatch({ type: 'BILL_SOLD', storeName: st.name })}
                        style={{
                          ...btn,
                          minHeight: 40,
                          padding: '10px 16px',
                          border: 'none',
                          borderRadius: 2,
                          background: unbilled > 0 ? SPICE : BORDER,
                          color: unbilled > 0 ? '#fff' : MUTED,
                          cursor: unbilled > 0 ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Bill sold bags
                      </button>
                    </div>
                    {renderInvoiceList(st)}
                  </div>
                )}

                {isOpen && !consignment && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                    <div style={{ ...lbl, marginBottom: 10 }}>Create invoice</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                      <label style={{ fontSize: 12, color: MUTED }}>
                        Bags
                        <input
                          type="number"
                          min={1}
                          value={form.bags}
                          onChange={(e) => setForm(st.name, s.price_per_bag, { bags: e.target.value })}
                          style={{ ...inp, display: 'block', width: '100%', marginTop: 4, minHeight: 40 }}
                        />
                      </label>
                      <label style={{ fontSize: 12, color: MUTED }}>
                        Price per bag
                        <input
                          type="number"
                          step="0.01"
                          value={form.price}
                          onChange={(e) => setForm(st.name, s.price_per_bag, { price: e.target.value })}
                          style={{ ...inp, display: 'block', width: '100%', marginTop: 4, minHeight: 40 }}
                        />
                      </label>
                      <label style={{ fontSize: 12, color: MUTED }}>
                        Terms
                        <select
                          value={form.terms}
                          onChange={(e) => setForm(st.name, s.price_per_bag, { terms: e.target.value })}
                          style={{ ...inp, display: 'block', width: '100%', marginTop: 4, minHeight: 40 }}
                        >
                          <option value="Net 15">Net 15</option>
                          <option value="Net 30">Net 30</option>
                        </select>
                      </label>
                      <label style={{ fontSize: 12, color: MUTED }}>
                        Invoice date
                        <input
                          type="date"
                          value={form.issued}
                          onChange={(e) => setForm(st.name, s.price_per_bag, { issued: e.target.value })}
                          style={{ ...inp, display: 'block', width: '100%', marginTop: 4, minHeight: 40 }}
                        />
                      </label>
                      <label style={{ fontSize: 12, color: MUTED }}>
                        Due date
                        <input readOnly value={dueRead} style={{ ...inp, display: 'block', width: '100%', marginTop: 4, minHeight: 40, color: MUTED }} />
                      </label>
                      <label style={{ fontSize: 12, color: MUTED }}>
                        Invoice #
                        <input readOnly value={draftInv.invoice} style={{ ...inp, display: 'block', width: '100%', marginTop: 4, minHeight: 40, color: MUTED }} />
                      </label>
                    </div>
                    <div style={{ marginTop: 10, fontFamily: MONO, fontWeight: 600 }}>
                      Total {money(draftInv.amount)}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      <button
                        type="button"
                        disabled={bagsN <= 0}
                        onClick={() => openPreview(st, draftInv)}
                        style={{ ...btn, minHeight: 40, flex: 1, minWidth: 120, border: `1px solid ${BORDER}`, borderRadius: 2, background: CARDBG }}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        disabled={bagsN <= 0}
                        onClick={() => {
                          dispatch({
                            type: 'CREATE_INVOICE',
                            storeName: st.name,
                            bags: bagsN,
                            price: priceN,
                            terms: form.terms,
                            issued: form.issued,
                          })
                          setForm(st.name, s.price_per_bag, { bags: '' })
                        }}
                        style={{ ...btn, minHeight: 40, flex: 1, minWidth: 120, border: 'none', borderRadius: 2, background: SPICE, color: '#fff' }}
                      >
                        Create invoice
                      </button>
                    </div>
                    {renderInvoiceList(st)}
                  </div>
                )}
              </div>
            )
          })}
        </Fragment>
      ))}
      </>
      )}

      {preview && (
        <div
          role="presentation"
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(43,32,24,.45)',
            zIndex: 9000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '24px 12px',
            overflowY: 'auto',
          }}
        >
          <div role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <InvoiceSheet
              inv={preview.inv}
              store={preview.store}
              onClose={() => setPreview(null)}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

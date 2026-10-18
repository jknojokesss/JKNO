import { useEffect, useMemo, useRef, useState } from 'react'
import DATA from '../../../data/primal-krisp.json'
import { getDueToReorderStores, lineItemsTotal, reorderAsOf } from './primalKrispReorderData'

const PK_REORDER_AS_OF = reorderAsOf(DATA)
import { SPICE, CHAR, KRAFT, CREAM, CARDBG, INK, MUTED, BORDER, UI, money, fmtAsOfLong, fmtInt } from '../primalKrispUtils'

const REORDER_CSS = `
.pk-reorder-table{width:100%;border-collapse:collapse;font-size:13px}
.pk-reorder-table th{font-size:10px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:${KRAFT};padding:8px 6px;border-bottom:1px solid ${BORDER};text-align:left}
.pk-reorder-table th.pk-num{text-align:right;font-weight:600}
.pk-reorder-table td{padding:10px 6px;border-bottom:1px solid ${CREAM};vertical-align:top}
.pk-reorder-table td.pk-num{text-align:right;font-weight:400;font-variant-numeric:tabular-nums}
.pk-reorder-row{width:100%;border:none;background:transparent;text-align:left;cursor:pointer;padding:0;font:inherit;color:inherit}
.pk-reorder-cards{display:none}
@media(max-width:640px){
.pk-reorder-table thead{display:none}
.pk-reorder-table,.pk-reorder-table tbody,.pk-reorder-table tr,.pk-reorder-table td{display:block;width:100%}
.pk-reorder-table tr{border-bottom:1px solid ${BORDER};padding:12px 0}
.pk-reorder-table td{border:none;padding:4px 0;display:flex;justify-content:space-between;gap:12px}
.pk-reorder-table td::before{content:attr(data-label);color:${MUTED};font-size:12px;font-weight:500;flex-shrink:0}
.pk-reorder-table td.pk-reorder-name{display:block;font-weight:600;font-size:15px;color:${INK}}
.pk-reorder-table td.pk-reorder-name::before{display:none}
}
`

function BackBar({ onBack, label }) {
  return (
    <button
      type="button"
      onClick={onBack}
      style={{
        border: 'none',
        background: 'transparent',
        color: SPICE,
        fontFamily: UI,
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
        padding: '4px 0 14px',
        minHeight: 40,
      }}
    >
      {label}
    </button>
  )
}

function InvoicePreview({ store, onClose }) {
  const lines = store.usual_order_lines || []
  const subtotal = lineItemsTotal(lines)
  const total = store.usual_order?.amount ?? subtotal
  return (
    <div style={{ background: CARDBG, border: `1px solid ${BORDER}`, borderRadius: 2, padding: 20, maxWidth: 640, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 20, color: INK }}>Primal Krisp</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4, letterSpacing: '0.6px', textTransform: 'uppercase' }}>Invoice preview</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: MUTED }}>
          <div>Date {fmtAsOfLong(PK_REORDER_AS_OF)}</div>
        </div>
      </div>
      <div style={{ marginTop: 18, fontSize: 13 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: KRAFT, textTransform: 'uppercase' }}>Bill to</div>
        <div style={{ fontWeight: 600, color: INK, marginTop: 4 }}>{store.store_name}</div>
        <div style={{ color: MUTED }}>{store.region}</div>
      </div>
      <table className="pk-reorder-table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Flavor</th>
            <th className="pk-num">Qty</th>
            <th className="pk-num">Unit</th>
            <th className="pk-num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((ln) => (
            <tr key={ln.flavor}>
              <td data-label="Flavor">{ln.flavor}</td>
              <td className="pk-num" data-label="Qty">
                {ln.cases} cs ({fmtInt(ln.bags)} bags)
              </td>
              <td className="pk-num" data-label="Unit">{money(ln.unit_price)}</td>
              <td className="pk-num" data-label="Amount">{money(ln.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, fontSize: 14, gap: 24 }}>
        <span style={{ color: MUTED }}>Subtotal</span>
        <span style={{ fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>{money(subtotal)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: 16, gap: 24 }}>
        <span style={{ fontWeight: 600 }}>Total</span>
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{money(total)}</span>
      </div>
      <div style={{ marginTop: 14, fontSize: 12, color: MUTED }}>Goes into QuickBooks as an invoice</div>
      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 16,
          width: '100%',
          minHeight: 40,
          border: `1px solid ${BORDER}`,
          borderRadius: 2,
          background: CARDBG,
          fontFamily: UI,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Close
      </button>
    </div>
  )
}

function StoreDetail({ store, card, lbl, btn, onBack, onPreview }) {
  const u = store.usual_order
  return (
    <div>
      <BackBar onBack={onBack} label="Due to reorder" />
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 22, color: INK }}>{store.store_name}</div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{store.region}</div>
        <div style={{ marginTop: 14, fontSize: 13, color: INK, lineHeight: 1.6 }}>
          <div>Usually every {store.usual_gap_days} days</div>
          <div>Last order {fmtAsOfLong(store.last_order_date)} ({store.last_order_days_ago} days ago)</div>
          <div>
            Usual order {u.cases} cases / {fmtInt(u.bags)} bags · {money(u.amount)}
          </div>
        </div>
        <button
          type="button"
          onClick={onPreview}
          style={{
            ...btn,
            marginTop: 16,
            minHeight: 40,
            padding: '10px 18px',
            border: 'none',
            borderRadius: 2,
            background: SPICE,
            color: '#fff',
            width: '100%',
            maxWidth: 280,
          }}
        >
          Create invoice
        </button>
      </div>
      <div style={card}>
        <div style={{ ...lbl, marginBottom: 10 }}>Order history</div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>Average gap {store.avg_gap_days} days</div>
        <table className="pk-reorder-table">
          <thead>
            <tr>
              <th>Date</th>
              <th className="pk-num">Cases</th>
              <th className="pk-num">Bags</th>
              <th className="pk-num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {store.order_history.map((o) => (
              <tr key={o.date}>
                <td data-label="Date">{fmtAsOfLong(o.date)}</td>
                <td className="pk-num" data-label="Cases">{o.cases}</td>
                <td className="pk-num" data-label="Bags">{fmtInt(o.bags)}</td>
                <td className="pk-num" data-label="Amount">{money(o.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PrimalKrispDueToReorder({ card, lbl, btn, focusScroll, onDetailChange }) {
  const rows = useMemo(() => getDueToReorderStores(DATA), [])
  const [selected, setSelected] = useState(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const anchorRef = useRef(null)

  useEffect(() => {
    onDetailChange?.(Boolean(selected))
  }, [selected, onDetailChange])

  useEffect(() => {
    if (!focusScroll) return
    const id = requestAnimationFrame(() => {
      anchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(id)
  }, [focusScroll])

  useEffect(() => {
    if (!selected) setInvoiceOpen(false)
  }, [selected])

  if (selected) {
    if (invoiceOpen) {
      return (
        <>
          <style dangerouslySetInnerHTML={{ __html: REORDER_CSS }} />
          <BackBar
            onBack={() => setInvoiceOpen(false)}
            label={selected.store_name}
          />
          <InvoicePreview store={selected} onClose={() => setInvoiceOpen(false)} />
        </>
      )
    }
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: REORDER_CSS }} />
        <StoreDetail
          store={selected}
          card={card}
          lbl={lbl}
          btn={btn}
          onBack={() => setSelected(null)}
          onPreview={() => setInvoiceOpen(true)}
        />
      </>
    )
  }

  return (
    <div ref={anchorRef} style={{ marginBottom: 20, scrollMarginTop: 72 }}>
      <style dangerouslySetInnerHTML={{ __html: REORDER_CSS }} />
      <div style={{ ...lbl, marginBottom: 10 }}>Due to reorder</div>
      <div style={{ ...card, padding: '12px 16px 16px' }}>
        <table className="pk-reorder-table">
          <thead>
            <tr>
              <th>Store</th>
              <th>Area</th>
              <th className="pk-num">Usually</th>
              <th className="pk-num">Last order</th>
              <th className="pk-num">Usual order</th>
              <th className="pk-num">Usual $</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((st) => {
              const u = st.usual_order
              return (
                <tr key={st.store_name}>
                  <td className="pk-reorder-name" data-label="Store">
                    <button type="button" className="pk-reorder-row" onClick={() => setSelected(st)}>
                      <span style={{ fontWeight: 600 }}>{st.store_name}</span>
                    </button>
                  </td>
                  <td data-label="Area">{st.region}</td>
                  <td className="pk-num" data-label="Usually">Every {st.usual_gap_days} days</td>
                  <td className="pk-num" data-label="Last order">{st.last_order_days_ago} days ago</td>
                  <td className="pk-num" data-label="Usual order">
                    {u.cases} cases / {fmtInt(u.bags)} bags
                  </td>
                  <td className="pk-num" data-label="Usual $">{money(u.amount)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function dueToReorderCount(data = DATA) {
  return getDueToReorderStores(data).length
}

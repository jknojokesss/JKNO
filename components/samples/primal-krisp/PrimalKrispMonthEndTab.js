import DATA from '../../../data/primal-krisp.json'
import { BORDER, CREAM, INK, MUTED, MONO, money } from '../primalKrispUtils'

const mc = DATA.monthly_close

function ClickRow({ label, value, onOpen, bold, top }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="pk-click"
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 0',
        borderTop: top ? `1px solid ${BORDER}` : 'none',
        cursor: 'pointer',
        fontSize: 13,
      }}
    >
      <span style={{ color: bold ? INK : MUTED, fontWeight: bold ? 600 : 400, flex: 1, minWidth: 0, lineHeight: 1.35 }}>
        {label}
      </span>
      <span style={{ fontFamily: MONO, color: INK, fontWeight: bold ? 600 : 400, flexShrink: 0 }}>{value}</span>
    </div>
  )
}

export default function PrimalKrispMonthEndTab({ card, lbl, onOpenDetail, storeOwed }) {
  const sources = mc.september_sales_sources || []
  const owed = storeOwed ?? mc.store_owed_at_month_end ?? mc.ar_open_at_month_end

  const sectionLbl = { ...lbl, color: MUTED, textTransform: 'none', letterSpacing: 0, fontSize: 12, marginBottom: 8 }

  return (
    <div className="pk-month-end">
      {owed != null ? (
        <div style={{ ...card, marginBottom: 16, padding: '15px 17px' }}>
          <ClickRow
            label="Owed by stores at month end"
            value={money(owed)}
            bold
            onOpen={() => onOpenDetail({ kind: 'monthEndStoreOwed' })}
          />
        </div>
      ) : null}

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={sectionLbl}>Where September&apos;s sales came from</div>
        <div style={{ padding: '4px 14px' }}>
          {sources.map((row, i) => (
            <ClickRow
              key={row.id}
              label={`${row.label} from ${row.from}`}
              value={money(row.amount)}
              top={i > 0}
              onOpen={() => onOpenDetail({ kind: 'monthEndSource', id: row.id })}
            />
          ))}
          <ClickRow
            label="Total"
            value={money(mc.total_sales)}
            bold
            top
            onOpen={() => onOpenDetail({ kind: 'monthEndSalesTotal' })}
          />
        </div>
      </div>

      <div style={{ ...card }}>
        <div style={sectionLbl}>September in QuickBooks</div>
        <div style={{ padding: '4px 14px' }}>
          <ClickRow
            label="Total sales"
            value={money(mc.total_sales)}
            onOpen={() => onOpenDetail({ kind: 'monthEndSalesTotal' })}
          />
          <ClickRow
            label="Cost of goods"
            value={money(mc.cost_of_goods)}
            top
            onOpen={() => onOpenDetail({ kind: 'monthEndCogs' })}
          />
          <ClickRow
            label="Gross profit"
            value={money(mc.gross_profit)}
            bold
            top
            onOpen={() => onOpenDetail({ kind: 'monthEndGrossProfit' })}
          />
        </div>
        <div style={{ fontSize: 12, color: MUTED, padding: '8px 14px 12px', borderTop: `1px solid ${CREAM}` }}>
          Gross profit is total sales minus cost of goods. All lines above sync from Shopify, the store app, and Square.
        </div>
      </div>
    </div>
  )
}

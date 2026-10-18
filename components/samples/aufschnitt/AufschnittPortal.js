import { useState, useCallback, useEffect } from 'react'
import AufschnittSampleBar from './AufschnittSampleBar'
import DATA from './aufschnittData'
import { BRAND_ALL, BRANDS } from './aufschnittCatalog'
import AufschnittOverview from './AufschnittOverview'
import AufschnittFinancials from './AufschnittFinancials'
import AufschnittChannelsTab, { ChannelDetail } from './AufschnittChannelsTab'
import AufschnittStockTab, { StockDetail } from './AufschnittStockTab'
import AufschnittProfitTab, {
  ProfitChannelDetail,
  ProfitOrderDetail,
  ProfitShippingLossDetail,
} from './AufschnittProfitTab'
import {
  SPICE,
  CHAR,
  KRAFT,
  CREAM,
  CARDBG,
  INK,
  MUTED,
  BORDER,
  RED,
  UI,
  MONO,
  SHELL_CSS,
  money,
  money0,
} from './aufschnittUtils'

const BIZ = DATA.meta.name
const SAMPLE_HEADER = 'Sample — fictitious numbers · as of Oct 2026'

const TABS = [
  ['overview', 'Overview', 'Overview'],
  ['pnl', 'P&L', 'P&L'],
  ['channels', 'Sales by channel', 'Channels'],
  ['stock', 'Stock', 'Stock'],
  ['profit', 'Profit per order', 'Profit'],
]

export default function AufschnittPortal() {
  const [tab, setTab] = useState('overview')
  const [brand, setBrand] = useState(BRAND_ALL)
  const [detail, setDetail] = useState(null)
  const [pnlMonthIdx, setPnlMonthIdx] = useState(5)
  const [pnlExpand, setPnlExpand] = useState({ revenue: true, cogs: true, opex: true })
  const [stockSort, setStockSort] = useState({ key: 'weeksSupply', dir: 'asc' })
  const [narrowNav, setNarrowNav] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)')
    const sync = () => setNarrowNav(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const card = { background: CARDBG, border: `1px solid ${BORDER}`, borderRadius: '2px', padding: '20px' }
  const lbl = {
    fontFamily: UI,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    color: KRAFT,
  }
  const big = { fontFamily: UI, fontWeight: 700, letterSpacing: '-0.4px' }
  const inp = {
    padding: '10px 12px',
    fontSize: '14px',
    border: `1px solid ${BORDER}`,
    borderRadius: '2px',
    background: CREAM,
    color: INK,
    outline: 'none',
    fontFamily: 'inherit',
  }

  const snapshot = () => ({ tab, brand, pnlMonthIdx, pnlExpand, stockSort })

  const openDetail = useCallback(
    (payload) => {
      setDetail({ ...payload, _restore: snapshot() })
    },
    [tab, brand, pnlMonthIdx, pnlExpand, stockSort]
  )

  const onBack = () => {
    if (detail?._parent) {
      setDetail(detail._parent)
      return
    }
    if (detail?._restore) {
      const r = detail._restore
      setTab(r.tab)
      setBrand(r.brand)
      setPnlMonthIdx(r.pnlMonthIdx)
      setPnlExpand(r.pnlExpand)
      setStockSort(r.stockSort)
    }
    setDetail(null)
  }

  const KPI = ({ k, v, sub, subColor, accent, onClick }) => {
    const inner = (
      <>
        <div style={lbl}>{k}</div>
        <div style={{ ...big, fontSize: '29px', color: accent || INK, lineHeight: 1.15, marginTop: '4px' }}>{v}</div>
        {sub ? <div style={{ fontFamily: UI, fontSize: '12px', color: subColor || '#A2937A', marginTop: '3px' }}>{sub}</div> : null}
      </>
    )
    if (!onClick) return <div style={{ ...card, flex: 1, minWidth: '150px', padding: '15px 17px' }}>{inner}</div>
    return (
      <button
        type="button"
        className="au-click"
        onClick={onClick}
        style={{
          ...card,
          flex: 1,
          minWidth: '150px',
          padding: '15px 17px',
          textAlign: 'left',
          cursor: 'pointer',
          border: `1px solid ${BORDER}`,
          position: 'relative',
        }}
      >
        {inner}
        <span style={{ position: 'absolute', top: 11, right: 13, color: '#C6B79A', fontSize: 15 }}>›</span>
      </button>
    )
  }

  const onOverviewOpen = (d) => {
    if (d.type === 'goto-profit') {
      setTab('profit')
      return
    }
    if (d.type === 'channel') {
      openDetail({ type: 'channel-detail', channel: d.channel, brand })
      return
    }
    openDetail(d)
  }

  const currentLabel = TABS.find((t) => t[0] === tab)?.[1] || ''

  const brandPills = tab !== 'profit' && (
    <div className="au-brand-pills">
      {[BRAND_ALL, ...BRANDS].map((b) => (
        <button
          key={b}
          type="button"
          className={`au-pill${brand === b ? ' au-pill--on' : ''}`}
          onClick={() => setBrand(b)}
        >
          {b}
        </button>
      ))}
    </div>
  )

  const portalStyles = SHELL_CSS({ CHAR, CREAM, INK, SPICE })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: portalStyles }} />
      <AufschnittSampleBar />

      <div className="au-shell">
        <aside className="au-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <div style={{ fontSize: 12, color: '#B6A78C' }}>Owings Mills, MD</div>
          </div>
          <nav className="au-nav au-nav--main" aria-label="Sections">
            {TABS.map(([id, longLabel, shortLabel]) => {
              const active = tab === id
              const navLabel = narrowNav ? shortLabel : longLabel
              return (
                <button
                  key={id}
                  type="button"
                  data-tab={id}
                  className="au-navbtn"
                  onClick={() => {
                    setTab(id)
                    setDetail(null)
                  }}
                  style={
                    active
                      ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${SPICE}` }
                      : undefined
                  }
                >
                  {navLabel}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="au-main">
          <div style={{ marginBottom: '22px' }}>
            <div style={{ ...lbl, color: SPICE }}>{BIZ}</div>
            <h1 style={{ ...big, fontSize: '28px', color: INK, letterSpacing: '0.3px', lineHeight: 1.1, marginTop: '4px' }}>
              {detail ? 'Detail' : currentLabel}
            </h1>
            <div style={{ fontSize: '12px', color: MUTED, marginTop: '6px' }}>{SAMPLE_HEADER}</div>
          </div>

          {!detail && brandPills}

          {detail ? (
            <DetailView detail={detail} card={card} lbl={lbl} big={big} onBack={onBack} onOpen={openDetail} />
          ) : (
            <>
              {tab === 'overview' && (
                <AufschnittOverview card={card} lbl={lbl} big={big} KPI={KPI} brand={brand} onOpen={onOverviewOpen} />
              )}
              {tab === 'pnl' && (
                <AufschnittFinancials
                  card={card}
                  lbl={lbl}
                  big={big}
                  inp={inp}
                  KPI={KPI}
                  brand={brand}
                  onDrill={openDetail}
                  pnlMonthIdx={pnlMonthIdx}
                  setPnlMonthIdx={setPnlMonthIdx}
                  pnlExpand={pnlExpand}
                  setPnlExpand={setPnlExpand}
                />
              )}
              {tab === 'channels' && (
                <AufschnittChannelsTab card={card} lbl={lbl} brand={brand} onOpen={openDetail} />
              )}
              {tab === 'stock' && (
                <AufschnittStockTab
                  card={card}
                  lbl={lbl}
                  brand={brand}
                  onOpen={openDetail}
                  sort={stockSort}
                  setSort={setStockSort}
                />
              )}
              {tab === 'profit' && <AufschnittProfitTab card={card} lbl={lbl} onOpen={openDetail} />}
            </>
          )}
        </main>
      </div>
    </>
  )
}

function DetailView({ detail, card, lbl, big, onBack, onOpen }) {
  const openChild = (payload) => onOpen({ ...payload, _parent: detail })

  if (detail.type === 'channel-detail') {
    return <ChannelDetail detail={detail} card={card} lbl={lbl} big={big} onBack={onBack} />
  }
  if (detail.type === 'stock') {
    return <StockDetail detail={detail} card={card} lbl={lbl} big={big} onBack={onBack} />
  }
  if (detail.type === 'profit-channel') {
    return (
      <ProfitChannelDetail
        detail={detail}
        card={card}
        lbl={lbl}
        big={big}
        onBack={onBack}
        onOpen={openChild}
      />
    )
  }
  if (detail.type === 'profit-order') {
    return <ProfitOrderDetail detail={detail} card={card} lbl={lbl} big={big} onBack={onBack} />
  }
  if (detail.type === 'profit-shipping-losses') {
    return (
      <ProfitShippingLossDetail
        card={card}
        lbl={lbl}
        big={big}
        onBack={onBack}
        onOpen={openChild}
      />
    )
  }
  if (detail.type === 'pnl') {
    return <PnlDrillDetail detail={detail} card={card} lbl={lbl} big={big} onBack={onBack} />
  }
  if (detail.type === 'brand') {
    const b = detail.data
    const pnl = DATA.pnlViews[b.brand].find((m) => m.month === '2026-09')
    return (
      <div>
        <button type="button" className="au-detail-back" onClick={onBack}>← Back</button>
        <h2 style={{ ...big, fontSize: 22, marginBottom: 16 }}>{b.brand}</h2>
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ ...lbl, marginBottom: 8 }}>P&amp;L summary · September</div>
          <Row l="Revenue" v={money0(b.sales)} />
          <Row l="Gross profit" v={money0(pnl.gross_profit)} />
          <Row l="Net profit" v={money0(b.netProfit)} bold accent={b.netProfit < 0 ? RED : INK} />
        </div>
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ ...lbl, marginBottom: 8 }}>Channels</div>
          {b.channels.map((c) => (
            <Row key={c.channel} l={c.channel} v={money0(c.revenue)} />
          ))}
        </div>
        <div style={{ ...card }}>
          <div style={{ ...lbl, marginBottom: 8 }}>Top products</div>
          {b.topProducts.map((p) => (
            <Row key={p.name} l={p.name} v={money0(p.revenue)} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button type="button" className="au-detail-back" onClick={onBack}>← Back</button>
      <GenericOverviewDetail detail={detail} card={card} lbl={lbl} big={big} />
    </div>
  )
}

function PnlDrillDetail({ detail, card, lbl, big, onBack }) {
  const periodLabel = detail.period || 'September 2026'
  const monthRollup = detail.rows?.length && /^2026-\d{2}$/.test(detail.rows[0].date)
  const monthSum = detail.rows?.reduce((s, r) => s + r.amount, 0) ?? 0
  const productSum = !monthRollup ? detail.rows?.reduce((s, r) => s + r.amount, 0) ?? 0 : 0

  return (
    <div>
      <button type="button" className="au-detail-back" onClick={onBack}>← Back</button>
      <h2 style={{ ...big, fontSize: 20, marginBottom: 4 }}>{detail.title}</h2>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>{periodLabel} · {money0(detail.total)}</div>
      {detail.brandRows?.length ? (
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ ...lbl, marginBottom: 8 }}>By brand · {periodLabel}</div>
          {detail.brandRows.map((r) => (
            <Row key={r.description} l={r.description} v={money(r.amount)} />
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontWeight: 700, borderTop: `1px solid ${BORDER}` }}>
            <span>Total</span>
            <span style={{ fontFamily: MONO }}>{money(detail.total)}</span>
          </div>
        </div>
      ) : null}
      {monthRollup ? (
        <div style={{ ...card }}>
          <div style={{ ...lbl, marginBottom: 8 }}>By month</div>
          {detail.rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: i ? `1px solid ${BORDER}` : 'none' }}>
              <div style={{ minWidth: 0, fontSize: 13 }}>{r.description}</div>
              <div style={{ fontFamily: MONO, fontSize: 13, whiteSpace: 'nowrap' }}>{money(r.amount)}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontWeight: 700, borderTop: `1px solid ${BORDER}` }}>
            <span>Apr–Sep total</span>
            <span style={{ fontFamily: MONO }}>{money(monthSum)}</span>
          </div>
        </div>
      ) : (
        <div style={{ ...card }}>
          <div style={{ ...lbl, marginBottom: 8 }}>By product · {periodLabel}</div>
          {detail.rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: i ? `1px solid ${BORDER}` : 'none' }}>
              <div style={{ minWidth: 0, fontSize: 13 }}>{r.description}</div>
              <div style={{ fontFamily: MONO, fontSize: 13, whiteSpace: 'nowrap' }}>{money(r.amount)}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontWeight: 700, borderTop: `1px solid ${BORDER}` }}>
            <span>Total</span>
            <span style={{ fontFamily: MONO }}>{money(productSum)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function GenericOverviewDetail({ detail, card, lbl }) {
  if (detail.type === 'sales-sep') {
    return (
      <>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Sales · September</h2>
        <div style={{ ...card }}>
          <Row l="September" v={money0(detail.salesCur)} />
          <Row l="August" v={money0(detail.salesPrior)} />
          <Row l="Change" v={money0(detail.salesCur - detail.salesPrior)} bold />
        </div>
      </>
    )
  }
  if (detail.type === 'margin') {
    const p = detail.sepPnl
    return (
      <>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Gross margin</h2>
        <div style={{ ...card }}>
          <Row l="Gross margin %" v={`${detail.grossPct.toFixed(1)}%`} />
          <Row l="Gross profit" v={money0(p.gross_profit)} />
          <Row l="Revenue" v={money0(p.revenue_total)} />
        </div>
      </>
    )
  }
  if (detail.type === 'net') {
    const p = detail.sepPnl
    const prior = detail.priorPnl
    return (
      <>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Net profit · September</h2>
        <div style={{ ...card }}>
          <Row l="Net profit" v={money0(p.net_profit)} bold accent={p.net_profit < 0 ? RED : INK} />
          <Row l="Prior month" v={money0(prior.net_profit)} />
          <Row l="Operating expenses" v={money0(p.operating_expenses_total)} />
          <Row l="Gross profit" v={money0(p.gross_profit)} />
        </div>
      </>
    )
  }
  if (detail.type === 'stock-summary') {
    return (
      <>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Stock at cost</h2>
        <div style={{ ...card }}>
          <Row l="September" v={money0(detail.stockValue)} bold />
          {detail.stockPrior != null ? <Row l="August" v={money0(detail.stockPrior)} /> : null}
          {detail.stockDelta != null ? (
            <Row
              l="Change vs August"
              v={`${detail.stockDelta >= 0 ? '+' : ''}${detail.stockDelta.toFixed(1)}%`}
              accent={MUTED}
            />
          ) : null}
          <Row l="Avg weeks of supply" v={String(detail.stockWeeks)} />
          <Row l="SKU count" v={String(detail.stockRows.length)} />
        </div>
      </>
    )
  }
  if (detail.type === 'profit-summary') {
    const pp = DATA.profitPerOrder
    return (
      <>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Profit per order</h2>
        <div style={{ ...card }}>
          <Row l="Blended avg September" v={money(pp.blendedAvgProfitPerOrder)} bold />
          <Row l="Orders September" v={String(pp.totalOrders)} />
          <Row l="Profit after fulfillment" v={money0(pp.contributionAfterFulfillment)} />
          <Row l="Prior month avg" v={money(detail.prior)} />
        </div>
      </>
    )
  }
  return null
}

function Row({ l, v, bold, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, fontWeight: bold ? 700 : 400 }}>
      <span style={{ color: MUTED }}>{l}</span>
      <span style={{ fontFamily: MONO, color: accent || INK }}>{v}</span>
    </div>
  )
}

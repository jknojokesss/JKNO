import { useState, useMemo, useEffect, useReducer } from 'react'
import Image from 'next/image'
import SampleJkLogoLink from './SampleJkLogoLink'
import DATA from '../../data/primal-krisp.json'
import PrimalKrispOverview from './PrimalKrispOverview'
import PrimalKrispOverviewDetail from './PrimalKrispOverviewDetail'
import PrimalKrispFinancials from './PrimalKrispFinancials'
import PrimalKrispStoresTab from './PrimalKrispStoresTab'
import { initBillingFromData, billingReducer, totalOwed } from './primalKrispStoreBilling'
import {
  SPICE,
  CHAR,
  KRAFT,
  CREAM,
  CARDBG,
  INK,
  MUTED,
  BORDER,
  AMBER,
  RED,
  GREEN,
  MONO,
  UI,
  SHELL_CSS,
  money,
  money0,
  moneyK,
  pct1,
  fmtD,
  fmtInt,
  TieMark,
} from './primalKrispUtils'
import {
  SubscriberLineChart,
  RenewalBars14,
  TastingLiftChart,
  MarginByChannelChart,
  InventoryDaysChart,
} from './PrimalKrispCharts'
import PrimalKrispDepositsTab from './primal-krisp/PrimalKrispDepositsTab'
import PrimalKrispDepositsDetail from './primal-krisp/PrimalKrispDepositsDetail'
import PrimalKrispMonthEndTab from './primal-krisp/PrimalKrispMonthEndTab'
import PrimalKrispListControls from './primal-krisp/PrimalKrispListControls'
import { allocateWholeDollars } from './sampleWholeDollarDisplay.js'

const CHANNELS = DATA.channels
const AS_OF = DATA.meta.as_of
const BIZ = DATA.brand.name

export default function PrimalKrispPortal() {
  const [tab, setTab] = useState('overview')
  const [period, setPeriod] = useState('month')
  const [billingState, dispatchBilling] = useReducer(billingReducer, undefined, () => initBillingFromData(DATA))
  const [regionFilter, setRegionFilter] = useState('All')
  const [listFilter, setListFilter] = useState(null)
  const [storeSearch, setStoreSearch] = useState('')
  const [storeSort, setStoreSort] = useState({ key: 'balance', dir: 'desc' })
  const [promoSort, setPromoSort] = useState({ key: 'spend', dir: 'desc' })
  const [runSort, setRunSort] = useState({ key: 'date', dir: 'desc' })
  const [reorderFocus, setReorderFocus] = useState(false)
  const [overviewDetail, setOverviewDetail] = useState(null)
  const [narrowNav, setNarrowNav] = useState(false)

  const ov = DATA.overview
  const periodSlice = period === 'week' ? DATA.period_slices?.overview : null
  const stores = DATA.stores
  const storeList = billingState.stores
  const liveStoreOwed = totalOwed(storeList)

  const storeKpis = useMemo(() => {
    let bagsSold = 0
    let unaccounted = 0
    let past60 = 0
    storeList.forEach((s) => {
      const sam = s.sample
      bagsSold += period === 'week' ? sam.bags_sold_week || 0 : sam.bags_sold_sept || 0
      unaccounted += sam.bags_unaccounted || 0
      ;(sam.invoices || sam.open_invoices || []).forEach((inv) => {
        if (inv.status !== 'Paid' && inv.days_outstanding > 60) past60 += inv.amount
      })
    })
    return { bagsSold, unaccounted, past60 }
  }, [storeList, period])

  const salesPeriod = periodSlice?.sales ?? ov.sales_this_month
  const salesPrior = periodSlice?.sales_prior_week ?? ov.sales_last_month
  const bagsPeriod = periodSlice?.bags_sold ?? ov.bags_sold_this_month
  const channelRowsPeriod = useMemo(() => {
    if (period === 'week' && periodSlice?.sales_by_channel) return periodSlice.sales_by_channel
    return ov.sales_by_channel.map((c) => ({ channel: c.channel, sales: c.sales, bags: c.bags }))
  }, [period, periodSlice, ov.sales_by_channel])
  const regions = useMemo(() => ['All', ...Object.keys(stores.by_region)], [stores.by_region])

  const sortedRuns = useMemo(() => {
    const dir = runSort.dir === 'asc' ? 1 : -1
    return [...DATA.production_runs].sort((a, b) => String(a.date).localeCompare(String(b.date)) * dir)
  }, [runSort])

  const sortedPromos = useMemo(() => {
    const dir = promoSort.dir === 'asc' ? 1 : -1
    return [...DATA.promo_codes].sort((a, b) => {
      const va = a[promoSort.key]
      const vb = b[promoSort.key]
      if (typeof va === 'string') return va.localeCompare(vb) * dir
      return (va - vb) * dir
    })
  }, [promoSort])

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
  const btn = { fontFamily: UI, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }
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

  const KPI = ({ k, v, sub, subColor, accent, onClick }) => {
    const inner = (
      <>
        <div style={lbl}>{k}</div>
        <div className="pk-kpi-val" style={{ ...big, fontSize: '29px', color: accent || INK, lineHeight: 1.15, marginTop: '4px' }}>{v}</div>
        {sub ? (
          <div style={{ fontFamily: UI, fontSize: '12px', color: subColor || '#A2937A', marginTop: '3px', fontWeight: subColor ? 600 : 400 }}>
            {sub}
          </div>
        ) : null}
      </>
    )
    if (!onClick) {
      return <div style={{ ...card, flex: 1, minWidth: '150px', padding: '15px 17px' }}>{inner}</div>
    }
    return (
      <button
        type="button"
        className="pk-click"
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
      </button>
    )
  }

  const FilterChip = ({ label, onClear }) =>
    label ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: MUTED }}>Filter</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '18px',
            background: CHAR,
            color: CREAM,
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {label}
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear filter"
            style={{
              border: 'none',
              background: 'rgba(255,255,255,.2)',
              color: CREAM,
              borderRadius: '2px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Clear
          </button>
        </span>
      </div>
    ) : null

  const SortBtn = ({ label, sortKey, current, onSort }) => {
    const active = current.key === sortKey
    return (
      <button
        type="button"
        onClick={() =>
          onSort({
            key: sortKey,
            dir: active && current.dir === 'desc' ? 'asc' : 'desc',
          })
        }
        style={{
          ...btn,
          padding: '8px 12px',
          minHeight: '40px',
          borderRadius: '8px',
          border: `1px solid ${active ? CHAR : BORDER}`,
          background: active ? CHAR : CARDBG,
          color: active ? CREAM : MUTED,
          fontSize: '12px',
          fontWeight: active ? 700 : 600,
          textDecoration: active ? 'underline' : 'none',
          textUnderlineOffset: 3,
        }}
      >
        {active ? `Sort: ${label}` : label}
      </button>
    )
  }

  const Row = ({ l, v, neg, bold, top, tieExpected, tieActual }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: top ? `1px solid ${BORDER}` : 'none' }}>
      <span style={{ fontSize: '13px', color: bold ? INK : MUTED, fontWeight: bold ? 600 : 400 }}>{l}</span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: '13px',
          color: neg ? RED : bold ? INK : MUTED,
          fontWeight: bold ? 600 : 400,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {tieExpected != null && <TieMark expected={tieExpected} actual={tieActual} />}
        {v}
      </span>
    </div>
  )

  const RankedBars = ({ title, rows, valueKey, labelKey, formatValue, onRowClick, onCardClick, onTotalClick, wholeDollarTotal = null }) => {
    const sorted = [...rows].sort((a, b) => b[valueKey] - a[valueKey])
    const max = sorted[0]?.[valueKey] || 1
    const total = sorted.reduce((s, r) => s + (r[valueKey] || 0), 0)
    const wholeParts =
      wholeDollarTotal != null && !formatValue
        ? allocateWholeDollars(sorted.map((r) => r[valueKey]), wholeDollarTotal)
        : null
    const fmt = formatValue || ((v, i) => (wholeParts ? money0(wholeParts[i]) : money(v)))
    const totalFmt = wholeDollarTotal != null && !formatValue ? money0(wholeDollarTotal) : fmt(total)
    const cardStyle = { ...card, flex: 1, minWidth: '290px', textAlign: 'left' }
    const titleBtn = onCardClick ? (
      <button
        type="button"
        className="pk-click"
        onClick={onCardClick}
        style={{ border: 'none', background: 'transparent', padding: 0, marginBottom: 14, cursor: 'pointer', textAlign: 'left', width: '100%' }}
      >
        <div style={lbl}>{title}</div>
      </button>
    ) : (
      <div style={{ ...lbl, marginBottom: '14px' }}>{title}</div>
    )
    return (
      <div style={cardStyle}>
        {titleBtn}
        {sorted.map((r, i) => (
          <div
            key={r[labelKey]}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick ? () => onRowClick(r) : undefined}
            onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(r) : undefined}
            className={onRowClick ? 'pk-click' : undefined}
            style={{ padding: '9px 0', borderTop: i ? `1px solid ${CREAM}` : 'none', cursor: onRowClick ? 'pointer' : 'default' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: INK }}>{r[labelKey]}</span>
              <span style={{ ...big, fontSize: '15px', color: INK, fontFamily: MONO }}>{fmt(r[valueKey], i)}</span>
            </div>
            <div style={{ flex: 1, height: '6px', background: CREAM, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((r[valueKey] / max) * 100)}%`, height: '100%', background: KRAFT }} />
            </div>
          </div>
        ))}
        {onTotalClick ? (
          <button
            type="button"
            className="pk-click"
            onClick={onTotalClick}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: 10,
              marginTop: 6,
              border: 'none',
              borderTop: `1px solid ${BORDER}`,
              background: 'transparent',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              color: INK,
            }}
          >
            <span>Total</span>
            <span style={{ fontFamily: MONO }}>{totalFmt}</span>
          </button>
        ) : null}
      </div>
    )
  }

  const openDetail = (d) => setOverviewDetail(d)

  const TABS = [
    ['overview', 'Overview', 'Overview'],
    ['financials', 'Financials', 'Financials'],
    ['stores', 'Stores', 'Stores'],
    ['products', 'Products', 'Products'],
    ['subscriptions', 'Online & subscriptions', 'Online'],
    ['deposits', 'Deposits', 'Deposits'],
    ['advertising', 'Advertising / promos', 'Ads'],
  ]
  const EXTRA = [['close', 'Month end', 'Month end']]
  const currentLabel = [...TABS, ...EXTRA].find((t) => t[0] === tab)?.[1] || ''

  const salesDelta = salesPrior > 0 ? ((salesPeriod - salesPrior) / salesPrior) * 100 : 0

  const listFilterLabel =
    listFilter === 'open_balance'
      ? 'Open balance'
      : listFilter === 'past60'
        ? 'Past 60 days'
        : listFilter === 'unaccounted'
          ? 'Unaccounted bags'
          : null

  const goTab = (id) => {
    setTab(id)
    setOverviewDetail(null)
  }

  const goOverviewHome = () => {
    setTab('overview')
    setOverviewDetail(null)
    setReorderFocus(false)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const goStoresFilter = (filter) => {
    setTab('stores')
    setListFilter(filter)
    setReorderFocus(false)
  }
  const goStoresDueReorder = () => {
    setTab('stores')
    setListFilter(null)
    setReorderFocus(true)
  }

  const sampleHeader = 'Sample — fictitious numbers · as of Oct 2026'

  const portalStyles = `${SHELL_CSS({ CHAR, CREAM, INK, SPICE })}
.pk-drawer-backdrop{position:fixed;inset:0;background:rgba(43,32,24,.45);z-index:8000}
.pk-drawer{position:fixed;top:0;right:0;height:100%;width:min(420px,100%);background:${CARDBG};border-left:1px solid ${BORDER};z-index:8001;display:flex;flex-direction:column;box-shadow:-8px 0 32px rgba(0,0,0,.12)}
@media(max-width:860px){.pk-drawer{top:0;left:0;right:0;width:100%;border-left:none}}
.pk-promo-table{width:100%;border-collapse:collapse;font-size:13px}
@media(max-width:390px){
.pk-promo-card{overflow-x:visible!important;padding:12px 8px!important}
.pk-promo-table{font-size:12px;table-layout:fixed}
.pk-promo-table th,.pk-promo-table td{padding:6px 2px!important}
.pk-promo-table th.pk-promo-code,.pk-promo-table td.pk-promo-code{width:23%;word-break:break-word;white-space:normal;line-height:1.25}
.pk-promo-table th.pk-promo-spend,.pk-promo-table td.pk-promo-spend{width:19%}
.pk-promo-table th.pk-promo-orders,.pk-promo-table td.pk-promo-orders{width:13%}
.pk-promo-table th.pk-promo-rev,.pk-promo-table td.pk-promo-rev{width:23%}
.pk-promo-table th.pk-promo-return,.pk-promo-table td.pk-promo-return{width:22%}
.pk-promo-return-head{display:inline-flex;flex-direction:column;align-items:flex-end;line-height:1.2;text-align:right}
}
.pk-prod-summary-card{overflow-x:hidden!important}
.pk-prod-summary-table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:13px}
.pk-prod-summary-table th,.pk-prod-summary-table td{padding:8px 4px;vertical-align:top}
.pk-prod-summary-table th.pk-num,.pk-prod-summary-table td.pk-num{text-align:right}
.pk-prod-summary-table td.pk-name{font-weight:600;line-height:1.3;word-break:break-word}
.pk-prod-summary-table th.pk-sold-head{white-space:normal;line-height:1.2;text-align:right}
@media(max-width:480px){
.pk-prod-summary-table{font-size:12px}
.pk-prod-summary-table th,.pk-prod-summary-table td{padding:8px 2px}
.pk-prod-summary-table th.pk-cost-head{white-space:normal;line-height:1.2;font-size:10px;text-align:right}
.pk-prod-summary-table th.pk-sold-head{font-size:10px}
}`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: portalStyles }} />

      <SampleJkLogoLink />

      <div className="pk-shell">
        <aside className="pk-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <button
              type="button"
              onClick={goOverviewHome}
              aria-label="Primal Krisp home"
              style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'block' }}
            >
              <Image
                src="/samples/primal-krisp/primal_krisp_logo_white.png"
                alt={BIZ}
                width={200}
                height={56}
                style={{ height: '56px', width: 'auto', maxWidth: '100%', display: 'block' }}
              />
            </button>
          </div>
          {narrowNav ? (
            <nav className="pk-nav pk-nav--main pk-nav--phone-grid" aria-label="Sections">
              {[...TABS, ...EXTRA].map(([id, longLabel, shortLabel]) => {
                const active = tab === id
                const navLabel = shortLabel
                return (
                  <button
                    key={id}
                    className="pk-navbtn"
                    onClick={() => {
                      setTab(id)
                      setReorderFocus(false)
                      setOverviewDetail(null)
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
          ) : (
            <>
              <nav className="pk-nav pk-nav--main" aria-label="Sections">
                {[...TABS, ...EXTRA].map(([id, longLabel]) => {
                  const active = tab === id
                  return (
                    <button
                      key={id}
                      className="pk-navbtn"
                      onClick={() => {
                        setTab(id)
                        setReorderFocus(false)
                        setOverviewDetail(null)
                      }}
                      style={
                        active
                          ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${SPICE}` }
                          : undefined
                      }
                    >
                      {longLabel}
                    </button>
                  )
                })}
              </nav>
            </>
          )}
        </aside>

        <main className="pk-main">
          <div style={{ marginBottom: '22px' }}>
            <button
              type="button"
              aria-label="Go to Overview"
              onClick={goOverviewHome}
              style={{
                ...lbl,
                color: SPICE,
                border: 'none',
                background: 'transparent',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'block',
                font: 'inherit',
              }}
            >
              {BIZ}
            </button>
            <h1 style={{ ...big, fontSize: '28px', color: INK, letterSpacing: '0.3px', lineHeight: 1.1, marginTop: '4px' }}>{currentLabel}</h1>
            <div style={{ fontSize: '12px', color: MUTED, marginTop: '6px' }}>{sampleHeader}</div>
          </div>

          {tab === 'financials' && (
            <PrimalKrispFinancials card={card} lbl={lbl} big={big} btn={btn} inp={inp} KPI={KPI} />
          )}

          {(tab === 'overview' || tab === 'subscriptions' || tab === 'close' || tab === 'stores' || tab === 'products' || tab === 'advertising') &&
          overviewDetail ? (
            <PrimalKrispOverviewDetail
              detail={overviewDetail}
              onBack={() => setOverviewDetail(null)}
              onClose={() => setOverviewDetail(null)}
              storeList={storeList}
              openStoreBalance={liveStoreOwed}
            />
          ) : null}
          {tab === 'deposits' && overviewDetail ? (
            <PrimalKrispDepositsDetail
              detail={overviewDetail}
              onBack={() => setOverviewDetail(null)}
              onClose={() => setOverviewDetail(null)}
            />
          ) : null}
          {tab === 'overview' && !overviewDetail && (
            <PrimalKrispOverview
              card={card}
              lbl={lbl}
              big={big}
              KPI={KPI}
              period={period}
              setPeriod={setPeriod}
              salesPeriod={salesPeriod}
              salesPrior={salesPrior}
              salesDelta={salesDelta}
              bagsPeriod={bagsPeriod}
              channelRowsPeriod={channelRowsPeriod}
              onOpenDetail={setOverviewDetail}
              openStoreBalance={liveStoreOwed}
            />
          )}

          {tab === 'stores' && !overviewDetail && (
            <PrimalKrispStoresTab
              billingState={billingState}
              dispatch={dispatchBilling}
              card={card}
              lbl={lbl}
              big={big}
              btn={btn}
              inp={inp}
              KPI={KPI}
              Row={Row}
              period={period}
              storeKpis={storeKpis}
              listFilter={listFilter}
              setListFilter={setListFilter}
              listFilterLabel={listFilterLabel}
              FilterChip={FilterChip}
              regions={regions}
              regionFilter={regionFilter}
              setRegionFilter={setRegionFilter}
              storeSearch={storeSearch}
              setStoreSearch={setStoreSearch}
              storeSort={storeSort}
              setStoreSort={setStoreSort}
              SortBtn={SortBtn}
              reorderFocus={reorderFocus}
              onOpenDetail={openDetail}
            />
          )}

          {tab === 'subscriptions' && !overviewDetail && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI
                  k="Website sales"
                  v={money0(
                    period === 'week'
                      ? channelRowsPeriod.find((c) => c.channel === 'Website')?.sales || 0
                      : ov.sales_by_channel.find((c) => c.channel === 'Website')?.sales || 0,
                  )}
                  onClick={() => openDetail({ kind: 'subChannel', channel: 'Website' })}
                />
                <KPI
                  k="Subscription sales"
                  v={money0(
                    period === 'week'
                      ? channelRowsPeriod.find((c) => c.channel === 'Subscriptions')?.sales || 0
                      : ov.sales_by_channel.find((c) => c.channel === 'Subscriptions')?.sales || 0,
                  )}
                  onClick={() => openDetail({ kind: 'subChannel', channel: 'Subscriptions' })}
                />
                <KPI k="Active subs" v={DATA.subscriptions.active} onClick={() => openDetail({ kind: 'subs' })} />
                <KPI k="September churn" v={pct1(DATA.subscriptions.churn_sept_pct)} onClick={() => openDetail({ kind: 'subChurn' })} />
                <KPI
                  k="Failed payments"
                  v={DATA.subscriptions.failed_payments_open.count}
                  accent={RED}
                  onClick={() => openDetail({ kind: 'subFailed' })}
                />
              </div>
              <div style={{ ...lbl, marginBottom: '12px', color: MUTED, textTransform: 'none', letterSpacing: 0, fontSize: '12px' }}>
                Subscribe & save: 6% off, free shipping
              </div>

              <div style={{ ...card, marginBottom: '16px', width: '100%', overflowX: 'hidden' }}>
                <div
                  role="button"
                  tabIndex={0}
                  className="pk-click"
                  onClick={() => openDetail({ kind: 'subMonthly' })}
                  onKeyDown={(e) => e.key === 'Enter' && openDetail({ kind: 'subMonthly' })}
                  style={{ ...lbl, marginBottom: '8px', cursor: 'pointer', display: 'inline-block' }}
                >
                  Active subscribers, 12 months
                </div>
                <SubscriberLineChart monthly={DATA.subscriptions.monthly} />
              </div>

              <div style={{ ...card, marginBottom: '16px', width: '100%', overflowX: 'hidden' }}>
                <div
                  role="button"
                  tabIndex={0}
                  className="pk-click"
                  onClick={() => openDetail({ kind: 'subRenewals' })}
                  onKeyDown={(e) => e.key === 'Enter' && openDetail({ kind: 'subRenewals' })}
                  style={{ ...lbl, marginBottom: '8px', cursor: 'pointer', display: 'inline-block' }}
                >
                  Renewals, next 14 days
                </div>
                <RenewalBars14 days={DATA.subscriptions.renewals_next_14_days} />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <RankedBars
                  title="By interval"
                  rows={DATA.subscriptions.by_interval.map((r) => ({ label: r.interval, n: r.active }))}
                  valueKey="n"
                  labelKey="label"
                  formatValue={(v) => fmtInt(v)}
                  onCardClick={() =>
                    openDetail({
                      kind: 'subBar',
                      sub: 'By interval',
                      total: DATA.subscriptions.active,
                      formatTitle: (v) => fmtInt(v),
                      rows: DATA.subscriptions.by_interval.map((r) => ({ label: r.interval, value: r.active })),
                    })
                  }
                  onTotalClick={() =>
                    openDetail({
                      kind: 'tableTotal',
                      tableName: 'By interval',
                      rows: DATA.subscriptions.by_interval.map((r) => ({ label: r.interval, value: r.active, key: r.interval })),
                      total: DATA.subscriptions.active,
                      format: (v) => fmtInt(v),
                    })
                  }
                  onRowClick={(r) =>
                    openDetail({
                      kind: 'subBar',
                      sub: r.label,
                      total: r.n,
                      formatTitle: (v) => fmtInt(v),
                      rows: [{ label: r.label, value: r.n }],
                    })
                  }
                />
                <RankedBars
                  title="By what they get"
                  rows={DATA.subscriptions.by_what_they_get.map((r) => ({ label: r.item, n: r.active }))}
                  valueKey="n"
                  labelKey="label"
                  formatValue={(v) => fmtInt(v)}
                  onCardClick={() =>
                    openDetail({
                      kind: 'subBar',
                      sub: 'By what they get',
                      total: DATA.subscriptions.by_what_they_get.reduce((s, r) => s + r.active, 0),
                      formatTitle: (v) => fmtInt(v),
                      rows: DATA.subscriptions.by_what_they_get.map((r) => ({ label: r.item, value: r.active })),
                    })
                  }
                  onTotalClick={() => {
                    const rows = DATA.subscriptions.by_what_they_get
                    const total = rows.reduce((s, r) => s + r.active, 0)
                    openDetail({
                      kind: 'tableTotal',
                      tableName: 'By what they get',
                      rows: rows.map((r) => ({ label: r.item, value: r.active, key: r.item })),
                      total,
                      format: (v) => fmtInt(v),
                    })
                  }}
                  onRowClick={(r) =>
                    openDetail({
                      kind: 'subBar',
                      sub: r.label,
                      total: r.n,
                      formatTitle: (v) => fmtInt(v),
                      rows: [{ label: r.label, value: r.n }],
                    })
                  }
                />
                <RankedBars
                  title="Cancel reasons (September)"
                  rows={DATA.subscriptions.cancel_reasons.map((r) => ({ label: r.reason, n: r.count }))}
                  valueKey="n"
                  labelKey="label"
                  formatValue={(v) => fmtInt(v)}
                  onCardClick={() => openDetail({ kind: 'subChurn' })}
                  onTotalClick={() => {
                    const rows = DATA.subscriptions.cancel_reasons
                    const total = rows.reduce((s, r) => s + r.count, 0)
                    openDetail({
                      kind: 'tableTotal',
                      tableName: 'Cancel reasons (September)',
                      rows: rows.map((r) => ({ label: r.reason, value: r.count, key: r.reason })),
                      total,
                      format: (v) => fmtInt(v),
                    })
                  }}
                  onRowClick={(r) =>
                    openDetail({
                      kind: 'subBar',
                      sub: r.label,
                      total: r.n,
                      formatTitle: (v) => fmtInt(v),
                      rows: [{ label: r.label, value: r.n }],
                    })
                  }
                />
              </div>
            </>
          )}

          {tab === 'deposits' && !overviewDetail && (
            <PrimalKrispDepositsTab card={card} lbl={lbl} KPI={KPI} onOpenDetail={openDetail} />
          )}

          {tab === 'advertising' && !overviewDetail && (
            <>
              <div className="pk-promo-card" style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <PrimalKrispListControls
                  sortOptions={[
                    { key: 'spend', labels: { desc: 'Spend (largest)', asc: 'Spend (smallest)' } },
                    { key: 'revenue', labels: { desc: 'Revenue (largest)', asc: 'Revenue (smallest)' } },
                    { key: 'return_per_dollar', labels: { desc: 'Return (largest)', asc: 'Return (smallest)' } },
                  ]}
                  sort={promoSort}
                  onSortChange={setPromoSort}
                  rowCount={DATA.promo_codes.length}
                />
                <table className="pk-promo-table">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <th className="pk-promo-code" style={{ ...lbl, textAlign: 'left', padding: '8px 6px' }}>Code</th>
                      <th className="pk-promo-spend" style={{ ...lbl, textAlign: 'right', padding: '8px 6px' }}>Spend</th>
                      <th className="pk-promo-orders" style={{ ...lbl, textAlign: 'right', padding: '8px 6px' }}>Orders</th>
                      <th className="pk-promo-rev" style={{ ...lbl, textAlign: 'right', padding: '8px 6px' }}>Revenue</th>
                      <th className="pk-promo-return" style={{ ...lbl, textAlign: 'right', padding: '8px 6px' }}>
                        <span className="pk-promo-return-head">
                          <span>Return</span>
                          <span>per $1</span>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPromos.map((p) => (
                        <tr
                          key={p.code}
                          className="pk-click"
                          style={{ borderBottom: `1px solid ${CREAM}`, cursor: 'pointer' }}
                          onClick={() => openDetail({ kind: 'promoCode', code: p.code })}
                          onKeyDown={(e) => e.key === 'Enter' && openDetail({ kind: 'promoCode', code: p.code })}
                          tabIndex={0}
                          role="button"
                        >
                          <td className="pk-promo-code" style={{ padding: '10px 6px', fontWeight: 600, color: INK }}>{p.code}</td>
                          <td className="pk-promo-spend" style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO }}>{money(p.spend)}</td>
                          <td className="pk-promo-orders" style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO }}>{fmtInt(p.orders)}</td>
                          <td className="pk-promo-rev" style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO }}>{money(p.revenue)}</td>
                          <td className="pk-promo-return" style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO }}>{p.return_per_dollar.toFixed(1)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div style={{ fontFamily: UI, fontSize: 12, color: MUTED, marginTop: 10 }}>Return = sales per $1 spent</div>
              </div>

              <div style={{ ...card, overflowX: 'auto' }}>
                <div style={{ ...lbl, marginBottom: '8px' }}>Store bags — 4 weeks before vs after each tasting</div>
                <TastingLiftChart tastings={DATA.tastings} />
              </div>
            </>
          )}

          {tab === 'products' && !overviewDetail && (
            <>
              <div className="pk-prod-summary-card" style={{ ...card, marginBottom: '16px' }}>
                <table className="pk-prod-summary-table">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <th style={{ ...lbl, textAlign: 'left', width: '34%' }}>Product</th>
                      <th className="pk-num" style={{ ...lbl, width: '20%' }}>Retail</th>
                      <th className="pk-num pk-cost-head" style={{ ...lbl, width: '24%' }}>Cost / bag</th>
                      <th className="pk-num pk-sold-head" style={{ ...lbl, width: '22%' }}>
                        {period === 'week' ? (
                          <>
                            Sold
                            <br />
                            (week)
                          </>
                        ) : (
                          <>
                            Sold
                            <br />
                            (Sept)
                          </>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DATA.products.map((p) => {
                      const cost = p.fictitious.cost_per_bag
                      const marginRow = DATA.product_margins_by_channel.find((m) => m.product === p.name)
                      const bagsMonth = marginRow?.bags_sold_sept_all_channels || 0
                      const bags =
                        period === 'week'
                          ? Math.round(bagsMonth * (bagsPeriod / ov.bags_sold_this_month))
                          : bagsMonth
                      const retail = p.real.price_per_bag_in_packs || p.real.price_per_bag_build_your_own
                      const openChannel = () => openDetail({ kind: 'productChannel', name: p.name })
                      const openCost = (e) => {
                        e.stopPropagation()
                        openDetail({ kind: 'productCost', name: p.name })
                      }
                      return (
                        <tr
                          key={p.name}
                          className="pk-click"
                          style={{ borderBottom: `1px solid ${CREAM}`, cursor: 'pointer' }}
                          onClick={openChannel}
                          onKeyDown={(e) => e.key === 'Enter' && openChannel()}
                          tabIndex={0}
                          role="button"
                        >
                          <td className="pk-name">{p.name}</td>
                          <td
                            className="pk-num"
                            style={{ fontFamily: MONO }}
                            onClick={(e) => {
                              e.stopPropagation()
                              openChannel()
                            }}
                          >
                            {retail ? money(retail) : '—'}
                          </td>
                          <td className="pk-num" style={{ fontFamily: MONO }} onClick={openCost}>{money(cost.total)}</td>
                          <td
                            className="pk-num"
                            style={{ fontFamily: MONO }}
                            onClick={(e) => {
                              e.stopPropagation()
                              openChannel()
                            }}
                          >
                            {fmtInt(bags)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <div style={{ ...lbl, marginBottom: '8px' }}>Margin per bag by channel</div>
                <MarginByChannelChart products={DATA.product_margins_by_channel} channels={CHANNELS} />
              </div>

              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <div style={{ ...lbl, marginBottom: '8px' }}>Days of stock per product</div>
                <InventoryDaysChart rows={DATA.inventory.by_product} />
              </div>

              <div style={{ ...card, overflowX: 'auto' }}>
                <PrimalKrispListControls
                  sortOptions={[{ key: 'date', labels: { desc: 'Date (newest)', asc: 'Date (oldest)' } }]}
                  sort={runSort}
                  onSortChange={setRunSort}
                  rowCount={DATA.production_runs.length}
                />
                <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Run', 'Date', 'Product', 'Raw lbs', 'Planned', 'Packed', 'Yield', 'Cost / bag', 'Status'].map((h) => (
                        <th key={h} style={{ ...lbl, padding: '8px 4px', textAlign: 'left', color: KRAFT }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRuns.map((r) => (
                      <tr
                        key={r.run}
                        className="pk-click"
                        style={{ borderBottom: `1px solid ${CREAM}`, cursor: 'pointer' }}
                        onClick={() => openDetail({ kind: 'prodRun', run: r.run })}
                        onKeyDown={(e) => e.key === 'Enter' && openDetail({ kind: 'prodRun', run: r.run })}
                        tabIndex={0}
                        role="button"
                      >
                        <td style={{ padding: '8px 4px', fontWeight: 600, position: 'sticky', left: 0, background: CARDBG }}>{r.run}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO }}>{fmtD(r.date)}</td>
                        <td style={{ padding: '8px 4px' }}>{r.product}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO, textAlign: 'right' }}>{r.raw_meat_lbs}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO, textAlign: 'right' }}>{fmtInt(r.bags_planned)}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO, textAlign: 'right' }}>{r.bags_packed != null ? fmtInt(r.bags_packed) : '—'}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO, textAlign: 'right' }}>{r.yield_vs_plan_pct != null ? pct1(r.yield_vs_plan_pct) : '—'}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO, textAlign: 'right' }}>{r.cost_per_bag != null ? money(r.cost_per_bag) : '—'}</td>
                        <td style={{ padding: '8px 4px' }}>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'close' && !overviewDetail && (
            <PrimalKrispMonthEndTab card={card} lbl={lbl} onOpenDetail={openDetail} storeOwed={liveStoreOwed} />
          )}
        </main>
      </div>
    </>
  )
}

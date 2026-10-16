import { useState, useMemo, useEffect, Fragment } from 'react'
import Image from 'next/image'
import DemoLobby from '../DemoLobby'
import DATA from '../../data/primal-krisp.json'
import PrimalKrispOverview from './PrimalKrispOverview'
import PrimalKrispFinancials from './PrimalKrispFinancials'
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
  fmtAsOfLong,
  fmtD,
  fmtInt,
  TieMark,
  verdictPromo,
  TINT_RED,
} from './primalKrispUtils'
import {
  SubscriberLineChart,
  RenewalBars14,
  TastingLiftChart,
  MarginByChannelChart,
  InventoryDaysChart,
  ArAgingBars,
} from './PrimalKrispCharts'

const CHANNELS = DATA.channels
const AS_OF = DATA.meta.as_of
const BIZ = DATA.brand.name

export default function PrimalKrispPortal() {
  const [tab, setTab] = useState('overview')
  const [period, setPeriod] = useState('month')
  const [drawerStore, setDrawerStore] = useState(null)
  const [drawerProduct, setDrawerProduct] = useState(null)
  const [regionFilter, setRegionFilter] = useState('All')
  const [termsFilter, setTermsFilter] = useState('All')
  const [listFilter, setListFilter] = useState(null)
  const [storeSearch, setStoreSearch] = useState('')
  const [storeSort, setStoreSort] = useState({ key: 'balance', dir: 'desc' })
  const [costOpen, setCostOpen] = useState(null)
  const [promoSort, setPromoSort] = useState({ key: 'revenue', dir: 'desc' })
  const [invSort, setInvSort] = useState({ key: 'date', dir: 'desc' })

  const ov = DATA.overview
  const periodSlice = period === 'week' ? DATA.period_slices?.overview : null
  const stores = DATA.stores
  const storeList = stores.list

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

  const agingTotal = useMemo(
    () => Object.values(stores.ar_aging).reduce((a, b) => a + b, 0),
    [stores.ar_aging],
  )

  const openBalanceSum = useMemo(
    () => storeList.reduce((s, st) => s + (st.sample.open_balance || 0), 0),
    [storeList],
  )

  const filteredStores = useMemo(() => {
    const q = storeSearch.trim().toLowerCase()
    let rows = storeList.filter((s) => {
      if (regionFilter !== 'All' && s.region !== regionFilter) return false
      if (termsFilter === 'Consignment' && !s.sample.terms.includes('Consignment')) return false
      if (termsFilter === 'Invoice' && !s.sample.terms.includes('invoice')) return false
      if (listFilter === 'open_balance' && !(s.sample.open_balance > 0)) return false
      if (listFilter === 'past60') {
        const has = (s.sample.invoices || s.sample.open_invoices || []).some(
          (inv) => inv.status !== 'Paid' && inv.days_outstanding > 60,
        )
        if (!has) return false
      }
      if (listFilter === 'unaccounted' && !(s.sample.bags_unaccounted > 0)) return false
      if (q && !(`${s.name} ${s.city}`.toLowerCase().includes(q))) return false
      return true
    })
    const dir = storeSort.dir === 'asc' ? 1 : -1
    rows = [...rows].sort((a, b) => {
      const sa = a.sample
      const sb = b.sample
      let va
      let vb
      if (storeSort.key === 'name') {
        va = a.name
        vb = b.name
        return va.localeCompare(vb) * dir
      }
      if (storeSort.key === 'bags') {
        va = period === 'week' ? sa.bags_sold_week || 0 : sa.bags_sold_sept || 0
        vb = period === 'week' ? sb.bags_sold_week || 0 : sb.bags_sold_sept || 0
      } else {
        va = sa.open_balance || 0
        vb = sb.open_balance || 0
      }
      return (va - vb) * dir
    })
    return rows
  }, [storeList, regionFilter, termsFilter, listFilter, storeSearch, storeSort, period])

  const salesPeriod = periodSlice?.sales ?? ov.sales_this_month
  const salesPrior = periodSlice?.sales_prior_week ?? ov.sales_last_month
  const bagsPeriod = periodSlice?.bags_sold ?? ov.bags_sold_this_month
  const channelRowsPeriod = useMemo(() => {
    if (period === 'week' && periodSlice?.sales_by_channel) return periodSlice.sales_by_channel
    return ov.sales_by_channel.map((c) => ({ channel: c.channel, sales: c.sales, bags: c.bags }))
  }, [period, periodSlice, ov.sales_by_channel])
  const regions = useMemo(() => ['All', ...Object.keys(stores.by_region)], [stores.by_region])

  const sortedRuns = useMemo(() => {
    const dir = invSort.dir === 'asc' ? 1 : -1
    return [...DATA.production_runs].sort((a, b) => {
      let va = a[invSort.key]
      let vb = b[invSort.key]
      if (invSort.key === 'date') {
        va = a.date || ''
        vb = b.date || ''
        return va.localeCompare(vb) * dir
      }
      if (typeof va === 'string') return va.localeCompare(vb) * dir
      return ((va || 0) - (vb || 0)) * dir
    })
  }, [invSort])

  useEffect(() => {
    if (!drawerStore && !drawerProduct) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDrawerStore(null)
        setDrawerProduct(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerStore, drawerProduct])

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

  const KPI = ({ k, v, sub, accent, onClick }) => {
    const inner = (
      <>
        <div style={lbl}>{k}</div>
        <div style={{ ...big, fontSize: '29px', color: accent || INK, lineHeight: 1.15, marginTop: '4px' }}>{v}</div>
        {sub ? <div style={{ fontFamily: UI, fontSize: '12px', color: '#A2937A', marginTop: '3px' }}>{sub}</div> : null}
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
        <span style={{ position: 'absolute', top: 11, right: 13, color: '#C6B79A', fontSize: 15 }}>›</span>
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
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </span>
      </div>
    ) : null

  const SortBtn = ({ label, sortKey, current, onSort }) => {
    const active = current.key === sortKey
    const arrow = active ? (current.dir === 'asc' ? ' ↑' : ' ↓') : ''
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
        }}
      >
        {label}
        {arrow}
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

  const RankedBars = ({ title, rows, valueKey, labelKey, formatValue }) => {
    const sorted = [...rows].sort((a, b) => b[valueKey] - a[valueKey])
    const max = sorted[0]?.[valueKey] || 1
    const fmt = formatValue || ((v) => money(v))
    return (
      <div style={{ ...card, flex: 1, minWidth: '290px' }}>
        <div style={{ ...lbl, marginBottom: '14px' }}>{title}</div>
        {sorted.map((r, i) => (
          <div key={r[labelKey]} style={{ padding: '9px 0', borderTop: i ? `1px solid ${CREAM}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: INK }}>{r[labelKey]}</span>
              <span style={{ ...big, fontSize: '15px', color: INK, fontFamily: MONO }}>{fmt(r[valueKey])}</span>
            </div>
            <div style={{ flex: 1, height: '6px', background: CREAM, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((r[valueKey] / max) * 100)}%`, height: '100%', background: KRAFT }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const TABS = [
    ['overview', 'Overview'],
    ['financials', 'Financials'],
    ['stores', 'Stores'],
    ['products', 'Products'],
    ['subscriptions', 'Online & subscriptions'],
    ['advertising', 'Advertising / promos'],
  ]
  const EXTRA = [['close', 'Monthly close']]
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
    setDrawerStore(null)
    setDrawerProduct(null)
  }
  const goStoresFilter = (filter) => {
    setTab('stores')
    setListFilter(filter)
    setDrawerStore(null)
  }

  const sampleHeader = `Sample — fictitious numbers · as of ${fmtAsOfLong(AS_OF)}`

  const storeDrawerInvoices = drawerStore?.sample?.invoices || drawerStore?.sample?.open_invoices || []
  const storeDrawerOpenSum = storeDrawerInvoices
    .filter((inv) => inv.status !== 'Paid')
    .reduce((a, inv) => a + inv.amount, 0)

  const productBreakdown = drawerProduct
    ? DATA.product_store_breakdown?.find((p) => p.product === drawerProduct)
    : null

  const portalStyles = `${SHELL_CSS({ CHAR, CREAM, INK, SPICE })}
.pk-drawer-backdrop{position:fixed;inset:0;background:rgba(43,32,24,.45);z-index:8000}
.pk-drawer{position:fixed;top:0;right:0;height:100%;width:min(420px,100%);background:${CARDBG};border-left:1px solid ${BORDER};z-index:8001;display:flex;flex-direction:column;box-shadow:-8px 0 32px rgba(0,0,0,.12)}
@media(max-width:860px){.pk-drawer{top:0;left:0;right:0;width:100%;border-left:none}}`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: portalStyles }} />

      <DemoLobby />

      <div className="pk-shell">
        <aside className="pk-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <Image
              src="/samples/primal-krisp/primal_krisp_logo_white.png"
              alt={BIZ}
              width={200}
              height={56}
              style={{ height: '56px', width: 'auto', maxWidth: '100%' }}
            />
            <div style={{ ...lbl, color: '#B6A78C', marginTop: '12px' }}>Dashboard</div>
          </div>
          <nav className="pk-nav pk-nav--main" aria-label="Dashboard sections">
            {TABS.map(([id, label]) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  className="pk-navbtn"
                  onClick={() => {
                    setTab(id)
                    setDrawerStore(null)
                    setDrawerProduct(null)
                  }}
                  style={
                    active
                      ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${SPICE}` }
                      : undefined
                  }
                >
                  {label}
                </button>
              )
            })}
          </nav>
          <div className="pk-tools-label" style={{ ...lbl, color: '#7A6A52', fontSize: '10px', margin: '16px 14px 6px' }}>
            Tools
          </div>
          <nav className="pk-nav pk-nav--tools" aria-label="Tools">
            {EXTRA.map(([id, label]) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  className="pk-navbtn"
                  onClick={() => setTab(id)}
                  style={
                    active
                      ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${SPICE}` }
                      : undefined
                  }
                >
                  {label}
                </button>
              )
            })}
          </nav>
          <div style={{ padding: '12px 10px 0', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: '8px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: '#8A7A66', lineHeight: 1.7 }}>
              SAMPLE DASHBOARD<br />
              <span style={{ color: SPICE, fontWeight: 600 }}>{DATA.meta.built_by}</span>
            </div>
          </div>
        </aside>

        <main className="pk-main">
          <div style={{ marginBottom: '22px' }}>
            <div style={{ ...lbl, color: SPICE }}>{BIZ}</div>
            <h1 style={{ ...big, fontSize: '28px', color: INK, letterSpacing: '0.3px', lineHeight: 1.1, marginTop: '4px' }}>{currentLabel}</h1>
            <div style={{ fontSize: '12px', color: MUTED, marginTop: '6px' }}>{sampleHeader}</div>
          </div>

          {tab === 'stores' && (
            <FilterChip label={listFilterLabel} onClear={() => setListFilter(null)} />
          )}

          {tab === 'financials' && (
            <PrimalKrispFinancials card={card} lbl={lbl} big={big} btn={btn} inp={inp} KPI={KPI} />
          )}

          {tab === 'overview' && (
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
              goTab={goTab}
              goStoresFilter={goStoresFilter}
            />
          )}

          {tab === 'stores' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Stores carrying" v={stores.count} />
                <KPI
                  k={period === 'week' ? 'Bags sold this week' : 'Bags sold to stores'}
                  v={fmtInt(storeKpis.bagsSold)}
                />
                <KPI
                  k="Owed by stores"
                  v={money(ov.open_store_balance)}
                  accent={AMBER}
                  onClick={() => setListFilter('open_balance')}
                />
                <KPI
                  k="Past 60 days"
                  v={money(storeKpis.past60)}
                  accent={storeKpis.past60 ? RED : INK}
                  onClick={() => setListFilter('past60')}
                />
                <KPI
                  k="Bags unaccounted"
                  v={storeKpis.unaccounted}
                  accent={storeKpis.unaccounted ? RED : GREEN}
                  onClick={() => setListFilter('unaccounted')}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
                <input
                  type="search"
                  placeholder="Search store or city"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  style={{ ...inp, flex: '1 1 200px', minHeight: '40px' }}
                  aria-label="Search stores"
                />
                <SortBtn label="Balance" sortKey="balance" current={storeSort} onSort={setStoreSort} />
                <SortBtn label="Name" sortKey="name" current={storeSort} onSort={setStoreSort} />
                <SortBtn label="Bags sold" sortKey="bags" current={storeSort} onSort={setStoreSort} />
              </div>

              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...lbl, marginBottom: '10px' }}>AR aging — open store balances</div>
                <ArAgingBars aging={stores.ar_aging} />
                <Row
                  l="Total"
                  v={money(stores.open_balance_total)}
                  bold
                  top
                  tieExpected={stores.open_balance_total}
                  tieActual={agingTotal}
                />
                <Row
                  l="Store cards"
                  v={money(openBalanceSum)}
                  tieExpected={ov.open_store_balance}
                  tieActual={openBalanceSum}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {regions.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegionFilter(r)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '18px',
                      border: `1px solid ${regionFilter === r ? CHAR : BORDER}`,
                      background: regionFilter === r ? CHAR : CARDBG,
                      color: regionFilter === r ? CREAM : MUTED,
                      ...btn,
                      fontSize: '12px',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['All', 'Consignment', 'Invoice'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTermsFilter(t)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '18px',
                      border: `1px solid ${termsFilter === t ? SPICE : BORDER}`,
                      background: termsFilter === t ? SPICE : CARDBG,
                      color: termsFilter === t ? '#fff' : MUTED,
                      ...btn,
                      fontSize: '12px',
                    }}
                  >
                    {t === 'Invoice' ? 'Net 30 invoice' : t}
                  </button>
                ))}
              </div>

              {filteredStores.map((st) => {
                const s = st.sample
                const sent = (s.cases_sent_sept || 0) * (s.bags_per_case || 12)
                const bagsSold = period === 'week' ? s.bags_sold_week || 0 : s.bags_sold_sept
                const pill =
                  s.reorder_flag === 'Reorder now'
                    ? { c: RED, t: 'Reorder now' }
                    : s.reorder_flag === 'Reorder soon'
                      ? { c: AMBER, t: 'Reorder soon' }
                      : { c: GREEN, t: 'OK' }
                const overdue = (s.invoices || s.open_invoices || []).some(
                  (inv) => inv.status !== 'Paid' && inv.days_outstanding > 60,
                )
                return (
                  <button
                    type="button"
                    key={st.name}
                    onClick={() => setDrawerStore(st)}
                    style={{
                      ...card,
                      display: 'block',
                      width: '100%',
                      marginBottom: '12px',
                      padding: '15px 18px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      minHeight: '44px',
                      borderColor: drawerStore?.name === st.name ? CHAR : overdue ? '#E7C3B8' : BORDER,
                      background: overdue ? TINT_RED : CARDBG,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ ...big, fontSize: '20px', color: INK }}>{st.name}</div>
                        <div style={{ fontSize: '12px', color: MUTED, marginTop: '4px' }}>
                          {st.city} · {s.terms} · {money(s.price_per_bag)}/bag
                        </div>
                        <div style={{ fontSize: '12px', color: INK, marginTop: '6px' }}>
                          Sent {sent} · Sold {bagsSold} · On shelf {s.on_shelf_last_count}
                          {s.bags_unaccounted ? ` · ${s.bags_unaccounted} unaccounted` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', background: pill.c, padding: '5px 11px', borderRadius: '20px' }}>
                          {pill.t}
                        </span>
                        {s.open_balance > 0 && (
                          <span style={{ ...big, fontSize: '15px', color: INK }}>{money(s.open_balance)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </>
          )}

          {tab === 'subscriptions' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI
                  k="Website sales"
                  v={money0(
                    period === 'week'
                      ? channelRowsPeriod.find((c) => c.channel === 'Website')?.sales || 0
                      : ov.sales_by_channel.find((c) => c.channel === 'Website')?.sales || 0,
                  )}
                />
                <KPI
                  k="Subscription sales"
                  v={money0(
                    period === 'week'
                      ? channelRowsPeriod.find((c) => c.channel === 'Subscriptions')?.sales || 0
                      : ov.sales_by_channel.find((c) => c.channel === 'Subscriptions')?.sales || 0,
                  )}
                  accent={SPICE}
                />
                <KPI k="Active subs" v={DATA.subscriptions.active} />
                <KPI k="September churn" v={pct1(DATA.subscriptions.churn_sept_pct)} />
                <KPI k="Failed payments" v={DATA.subscriptions.failed_payments_open.count} accent={RED} />
              </div>
              <div style={{ ...lbl, marginBottom: '12px', color: MUTED, textTransform: 'none', letterSpacing: 0, fontSize: '12px' }}>
                {DATA.subscription_terms_real}
              </div>

              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <div style={{ ...lbl, marginBottom: '8px' }}>Active subscribers — 12 months</div>
                <SubscriberLineChart monthly={DATA.subscriptions.monthly} />
              </div>

              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <div style={{ ...lbl, marginBottom: '8px' }}>Renewals — next 14 days</div>
                <RenewalBars14 days={DATA.subscriptions.renewals_next_14_days} />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <RankedBars
                  title="By interval"
                  rows={DATA.subscriptions.by_interval.map((r) => ({ label: r.interval, n: r.active }))}
                  valueKey="n"
                  labelKey="label"
                  formatValue={(v) => fmtInt(v)}
                />
                <RankedBars
                  title="By what they get"
                  rows={DATA.subscriptions.by_what_they_get.map((r) => ({ label: r.item, n: r.active }))}
                  valueKey="n"
                  labelKey="label"
                  formatValue={(v) => fmtInt(v)}
                />
                <RankedBars
                  title="Cancel reasons (September)"
                  rows={DATA.subscriptions.cancel_reasons.map((r) => ({ label: r.reason, n: r.count }))}
                  valueKey="n"
                  labelKey="label"
                  formatValue={(v) => fmtInt(v)}
                />
              </div>
            </>
          )}

          {tab === 'advertising' && (
            <>
              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {[
                        ['Code', 'code', 'left'],
                        ['Spend', 'spend', 'right'],
                        ['Orders', 'orders', 'right'],
                        ['Revenue', 'revenue', 'right'],
                        ['Return / $1', 'return_per_dollar', 'right'],
                        ['', null, 'right'],
                      ].map(([h, key, align]) => (
                        <th key={h || 'act'} style={{ ...lbl, textAlign: align, padding: '8px 6px' }}>
                          {key ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPromoSort((s) => ({
                                  key,
                                  dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc',
                                }))
                              }
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                ...lbl,
                                textAlign: align,
                                minHeight: '40px',
                                width: '100%',
                                color: promoSort.key === key ? INK : '#96866C',
                              }}
                            >
                              {h}
                              {promoSort.key === key ? (promoSort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                            </button>
                          ) : (
                            h
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...DATA.promo_codes]
                      .sort((a, b) => {
                        const dir = promoSort.dir === 'asc' ? 1 : -1
                        const va = a[promoSort.key]
                        const vb = b[promoSort.key]
                        if (typeof va === 'string') return va.localeCompare(vb) * dir
                        return (va - vb) * dir
                      })
                      .map((p) => {
                      const vd = verdictPromo(p.return_per_dollar)
                      return (
                        <tr key={p.code} style={{ borderBottom: `1px solid ${CREAM}` }}>
                          <td style={{ padding: '10px 6px', fontWeight: 600, color: INK }}>{p.code}</td>
                          <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO }}>{money(p.spend)}</td>
                          <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO }}>{p.orders}</td>
                          <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO }}>{money(p.revenue)}</td>
                          <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: MONO }}>{p.return_per_dollar.toFixed(1)}</td>
                          <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', background: vd.c, padding: '4px 10px', borderRadius: '16px' }}>
                              {p.call || vd.t}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ ...card, overflowX: 'auto' }}>
                <div style={{ ...lbl, marginBottom: '8px' }}>Store bags — 4 weeks before vs after each tasting</div>
                <TastingLiftChart tastings={DATA.tastings} />
              </div>
            </>
          )}

          {tab === 'products' && (
            <>
              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Product', 'Retail', 'Cost / bag', period === 'week' ? 'Bags sold (week)' : 'Bags sold (Sept)', ''].map((h) => (
                        <th key={h} style={{ ...lbl, textAlign: 'left', padding: '8px 6px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DATA.products.map((p) => {
                      const cost = p.fictitious.cost_per_bag
                      const open = costOpen === p.name
                      const parts = Object.entries(cost).filter(([k]) => k !== 'total')
                      const partSum = parts.reduce((s, [, v]) => s + v, 0)
                      const marginRow = DATA.product_margins_by_channel.find((m) => m.product === p.name)
                      const bagsMonth = marginRow?.bags_sold_sept_all_channels || 0
                      const bags =
                        period === 'week'
                          ? Math.round(bagsMonth * (bagsPeriod / ov.bags_sold_this_month))
                          : bagsMonth
                      const retail = p.real.price_per_bag_in_packs || p.real.price_per_bag_build_your_own
                      return (
                        <Fragment key={p.name}>
                          <tr
                            style={{ borderBottom: `1px solid ${CREAM}`, cursor: 'pointer' }}
                            onClick={() => setDrawerProduct(p.name)}
                          >
                            <td style={{ padding: '10px 6px', fontWeight: 600 }}>{p.name}</td>
                            <td style={{ padding: '10px 6px', fontFamily: MONO }}>{retail ? money(retail) : '—'}</td>
                            <td style={{ padding: '10px 6px', fontFamily: MONO }}>{money(cost.total)}</td>
                            <td style={{ padding: '10px 6px', fontFamily: MONO }}>{bags}</td>
                            <td style={{ padding: '10px 6px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCostOpen(open ? null : p.name)
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: SPICE,
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  minHeight: '40px',
                                  padding: '8px',
                                }}
                              >
                                Cost
                              </button>
                            </td>
                          </tr>
                          {open && (
                            <tr>
                              <td colSpan={5} style={{ padding: '8px 12px 14px', background: CREAM }}>
                                {parts.map(([k, v]) => (
                                  <Row key={k} l={k.replace(/_/g, ' ')} v={money(v)} />
                                ))}
                                <Row
                                  l="Cost per bag"
                                  v={money(cost.total)}
                                  bold
                                  top
                                  tieExpected={cost.total}
                                  tieActual={partSum}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
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
                <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {[
                        ['Run', 'run'],
                        ['Date', 'date'],
                        ['Product', 'product'],
                        ['Raw lbs', 'raw_meat_lbs'],
                        ['Planned', 'bags_planned'],
                        ['Packed', 'bags_packed'],
                        ['Yield', 'yield_vs_plan_pct'],
                        ['Cost / bag', 'cost_per_bag'],
                        ['Status', 'status'],
                      ].map(([h, key]) => (
                        <th key={h} style={{ ...lbl, padding: '8px 4px', textAlign: 'left', color: KRAFT }}>
                          <button
                            type="button"
                            onClick={() =>
                              setInvSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))
                            }
                            style={{ border: 'none', background: 'none', cursor: 'pointer', ...lbl, color: invSort.key === key ? INK : KRAFT, minHeight: 40 }}
                          >
                            {h}
                            {invSort.key === key ? (invSort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRuns.map((r) => (
                      <tr key={r.run} style={{ borderBottom: `1px solid ${CREAM}` }}>
                        <td style={{ padding: '8px 4px', fontWeight: 600, position: 'sticky', left: 0, background: CARDBG }}>{r.run}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO }}>{fmtD(r.date)}</td>
                        <td style={{ padding: '8px 4px' }}>{r.product}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO, textAlign: 'right' }}>{r.raw_meat_lbs}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO, textAlign: 'right' }}>{r.bags_planned}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO, textAlign: 'right' }}>{r.bags_packed ?? '—'}</td>
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

          {tab === 'close' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Income to post" v={money(DATA.monthly_close.income_to_post_total)} accent={GREEN} />
                <KPI k="COGS to post" v={money(DATA.monthly_close.cogs_to_post.amount)} />
                <KPI k="AR at month end" v={money(DATA.monthly_close.ar_open_at_month_end)} accent={AMBER} />
              </div>
              <div style={{ ...card }}>
                <div style={{ ...lbl, color: KRAFT, marginBottom: '6px' }}>Income to post</div>
                {Object.entries(DATA.monthly_close.income_to_post).map(([k, v]) => (
                  <Row key={k} l={k} v={money(v)} />
                ))}
                <Row l="Total" v={money(DATA.monthly_close.income_to_post_total)} bold top />
                <div style={{ marginTop: '16px', padding: '12px 14px', background: CREAM, borderRadius: '2px', border: `1px dashed ${BORDER}` }}>
                  <div style={{ ...lbl, marginBottom: '6px' }}>Booked elsewhere</div>
                  {Object.entries(DATA.monthly_close.booked_through_shopify_do_not_reenter).map(([k, v]) => (
                    <Row key={k} l={k} v={money(v)} />
                  ))}
                </div>
                <div style={{ ...lbl, color: KRAFT, margin: '16px 0 6px' }}>Journal entry preview</div>
                {DATA.monthly_close.journal_entries_preview.map((je, i) => (
                  <div key={i} style={{ fontSize: '12px', color: MUTED, padding: '6px 0', borderTop: i ? `1px solid ${CREAM}` : 'none' }}>
                    <span style={{ color: INK, fontWeight: 600 }}>{je.memo}</span> · Dr {je.debit} / Cr {je.credit} · {money(je.amount)}
                  </div>
                ))}
              </div>
            </>
          )}
        </main>

        {(drawerStore || drawerProduct) && (
          <div
            className="pk-drawer-backdrop"
            role="presentation"
            onClick={() => {
              setDrawerStore(null)
              setDrawerProduct(null)
            }}
          />
        )}

        {drawerStore && (
          <aside className="pk-drawer" aria-label="Store detail">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 18px 12px', borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <div style={{ ...big, fontSize: '20px', color: INK }}>{drawerStore.name}</div>
                <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>{drawerStore.city}</div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDrawerStore(null)}
                style={{
                  border: 'none',
                  background: CREAM,
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  fontSize: '22px',
                  lineHeight: 1,
                  color: INK,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 24px' }}>
              <div style={{ ...lbl, marginBottom: '10px' }}>Invoices</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Invoice', 'Date', 'Amount', 'Status', 'Days'].map((h) => (
                      <th key={h} style={{ ...lbl, textAlign: h === 'Invoice' ? 'left' : 'right', padding: '8px 4px', fontSize: '10px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {storeDrawerInvoices.map((inv) => (
                    <tr key={inv.invoice} style={{ borderBottom: `1px solid ${CREAM}` }}>
                      <td style={{ padding: '10px 4px', fontWeight: 600 }}>{inv.invoice}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO, fontSize: '12px' }}>{fmtD(inv.issued)}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO }}>{money(inv.amount)}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', fontSize: '12px', color: inv.status === 'Paid' ? GREEN : AMBER }}>
                        {inv.status || 'Open'}
                      </td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO, fontSize: '12px' }}>
                        {inv.status === 'Paid' ? '—' : inv.days_outstanding}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Row
                l="Open balance"
                v={money(drawerStore.sample.open_balance)}
                bold
                top
                tieExpected={drawerStore.sample.open_balance}
                tieActual={storeDrawerOpenSum}
              />
            </div>
          </aside>
        )}

        {drawerProduct && productBreakdown && (
          <aside className="pk-drawer" aria-label="Product detail">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 18px 12px', borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <div style={{ ...big, fontSize: '20px', color: INK }}>{drawerProduct}</div>
                <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>Store channel</div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDrawerProduct(null)}
                style={{
                  border: 'none',
                  background: CREAM,
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  fontSize: '22px',
                  lineHeight: 1,
                  color: INK,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Store', 'Units', 'Dollars'].map((h) => (
                      <th key={h} style={{ ...lbl, textAlign: h === 'Store' ? 'left' : 'right', padding: '8px 4px', fontSize: '10px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productBreakdown.stores.map((r) => (
                    <tr key={r.store} style={{ borderBottom: `1px solid ${CREAM}` }}>
                      <td style={{ padding: '10px 4px' }}>
                        <div style={{ fontWeight: 600 }}>{r.store}</div>
                        <div style={{ fontSize: '11px', color: MUTED }}>{r.city}</div>
                      </td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO }}>{r.units}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: MONO }}>{money(r.dollars)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Row
                l="Total"
                v={money(productBreakdown.total_dollars)}
                bold
                top
                tieExpected={productBreakdown.store_channel_dollars}
                tieActual={productBreakdown.total_dollars}
              />
              <Row
                l="Units"
                v={fmtInt(productBreakdown.total_units)}
                tieExpected={productBreakdown.store_channel_units}
                tieActual={productBreakdown.total_units}
              />
            </div>
          </aside>
        )}
      </div>
    </>
  )
}

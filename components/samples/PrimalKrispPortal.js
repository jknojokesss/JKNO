import { useState, useMemo, Fragment } from 'react'
import Image from 'next/image'
import DemoFontLinks from '../DemoFontLinks'
import DemoLobby from '../DemoLobby'
import { DEMO_PORTAL_ROOT_CLASS, DEMO_RENDER_HINTS, DEMO_UI } from '../../lib/demoFonts'
import DATA from '../../data/primal-krisp.json'
import {
  BRICK,
  CHARCOAL,
  SAGE,
  BROWN,
  CREAM,
  CARDBG,
  INK,
  MUTED,
  BORDER,
  AMBER,
  RED,
  MONO,
  UI,
  money,
  money0,
  moneyK,
  pct1,
  fmtAsOfLong,
  fmtD,
  TieMark,
  verdictPromo,
} from './primalKrispUtils'
import {
  StackedSalesByChannel,
  CashForecast13,
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
  const [pnlView, setPnlView] = useState('single')
  const [pnlOpen, setPnlOpen] = useState(null)
  const [expandedStore, setExpandedStore] = useState(null)
  const [regionFilter, setRegionFilter] = useState('All')
  const [termsFilter, setTermsFilter] = useState('All')
  const [costOpen, setCostOpen] = useState(null)
  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(DATA.monthly_sales_by_channel.length - 1)

  const ov = DATA.overview
  const stores = DATA.stores
  const pnl = DATA.pnl
  const months = DATA.monthly_sales_by_channel

  const storeList = stores.list

  const storeKpis = useMemo(() => {
    let bagsSold = 0
    let unaccounted = 0
    let past60 = 0
    storeList.forEach((s) => {
      bagsSold += s.sample.bags_sold_sept || 0
      unaccounted += s.sample.bags_unaccounted || 0
      ;(s.sample.open_invoices || []).forEach((inv) => {
        if (inv.days_outstanding > 60) past60 += inv.amount
      })
    })
    return { bagsSold, unaccounted, past60 }
  }, [storeList])

  const agingTotal = useMemo(
    () => Object.values(stores.ar_aging).reduce((a, b) => a + b, 0),
    [stores.ar_aging],
  )

  const openBalanceSum = useMemo(
    () => storeList.reduce((s, st) => s + (st.sample.open_balance || 0), 0),
    [storeList],
  )

  const channelSum = useMemo(
    () => ov.sales_by_channel.reduce((s, c) => s + c.sales, 0),
    [ov.sales_by_channel],
  )

  const filteredStores = useMemo(() => {
    return storeList.filter((s) => {
      if (regionFilter !== 'All' && s.region !== regionFilter) return false
      if (termsFilter === 'Consignment' && !s.sample.terms.includes('Consignment')) return false
      if (termsFilter === 'Invoice' && !s.sample.terms.includes('invoice')) return false
      return true
    })
  }, [storeList, regionFilter, termsFilter])

  const regions = useMemo(() => ['All', ...Object.keys(stores.by_region)], [stores.by_region])

  const card = { background: CARDBG, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px' }
  const lbl = {
    fontFamily: UI,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    color: '#96866C',
  }
  const big = { fontFamily: UI, fontWeight: 700, letterSpacing: '-0.4px' }
  const btn = { fontFamily: UI, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }
  const inp = {
    padding: '10px 12px',
    fontSize: '14px',
    border: `1px solid ${BORDER}`,
    borderRadius: '9px',
    background: CREAM,
    color: INK,
    outline: 'none',
    fontFamily: 'inherit',
  }

  const KPI = ({ k, v, sub, accent }) => (
    <div style={{ ...card, flex: 1, minWidth: '150px', padding: '15px 17px' }}>
      <div style={lbl}>{k}</div>
      <div style={{ ...big, fontSize: '29px', color: accent || INK, lineHeight: 1.15, marginTop: '4px' }}>{v}</div>
      {sub ? <div style={{ fontFamily: UI, fontSize: '12px', color: '#A2937A', marginTop: '3px' }}>{sub}</div> : null}
    </div>
  )

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

  const DrillRow = ({ k, l, v, items, tieTotal }) => {
    const open = pnlOpen === k
    const has = items && items.length > 0
    const subSum = has ? items.reduce((s, it) => s + (it.n || 0), 0) : 0
    return (
      <>
        <div
          onClick={() => has && setPnlOpen(open ? null : k)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 0',
            cursor: has ? 'pointer' : 'default',
          }}
        >
          <span style={{ fontSize: '13px', color: MUTED, display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
            {has && (
              <span style={{ color: BRICK, fontSize: '9px', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none' }}>
                ▶
              </span>
            )}
            {l}
          </span>
          <span style={{ fontFamily: MONO, fontSize: '13px', color: MUTED, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {has && tieTotal != null && <TieMark expected={tieTotal} actual={subSum} />}
            {v}
          </span>
        </div>
        {open && has && (
          <div style={{ margin: '0 0 12px 17px', padding: '4px 12px', background: CREAM, border: `1px solid ${BORDER}`, borderRadius: '9px' }}>
            {items.map((it, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderTop: i ? `1px solid ${BORDER}` : 'none',
                }}
              >
                <span style={{ fontSize: '12px', color: INK }}>{it.l}</span>
                <span style={{ fontFamily: MONO, fontSize: '12px', color: INK }}>{it.v}</span>
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  const RankedBars = ({ title, rows, valueKey, labelKey, formatValue, footerTotal, tieExpected, tieActual }) => {
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
              <span style={{ ...big, fontSize: '15px', color: INK }}>{fmt(r[valueKey])}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '6px', background: CREAM, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((r[valueKey] / max) * 100)}%`, height: '100%', background: BRICK }} />
              </div>
            </div>
          </div>
        ))}
        {footerTotal != null && (
          <Row l="Total" v={money(footerTotal)} bold top tieExpected={tieExpected} tieActual={tieActual} />
        )}
      </div>
    )
  }

  const TABS = [
    ['overview', 'Overview'],
    ['stores', 'Stores'],
    ['subscriptions', 'Online & subscriptions'],
    ['tastings', 'Tastings & promos'],
    ['products', 'Products & margins'],
    ['inventory', 'Inventory & runs'],
    ['pnl', 'P&L'],
  ]
  const EXTRA = [
    ['quickbooks', 'QuickBooks sync'],
    ['close', 'Monthly close'],
    ['askai', 'Answers'],
  ]
  const currentLabel = [...TABS, ...EXTRA].find((t) => t[0] === tab)?.[1] || ''

  const salesDelta =
    ov.sales_last_month > 0
      ? ((ov.sales_this_month - ov.sales_last_month) / ov.sales_last_month) * 100
      : 0

  const cogsLines = DATA.product_margins_by_channel.map((p) => ({
    l: p.product,
    v: money(-p.bags_sold_sept_all_channels * p.cost_per_bag),
    n: p.bags_sold_sept_all_channels * p.cost_per_bag,
  }))

  const opexLines = Object.entries(pnl.operating_expenses).map(([k, v]) => ({ l: k, v: money(-v), n: v }))
  const revLines = Object.entries(pnl.revenue).map(([k, v]) => ({ l: k, v: money(v), n: v }))

  const sampleHeader = `Sample — fictitious numbers · as of ${fmtAsOfLong(AS_OF)}`

  return (
    <>
      <DemoFontLinks />
      <style>{`*{box-sizing:border-box;margin:0;padding:0}${DEMO_RENDER_HINTS}body{background:${CREAM};color:${INK}}
.jm-shell{display:flex;min-height:100vh;align-items:stretch}
.jm-side{width:236px;flex-shrink:0;background:${CHARCOAL};color:${CREAM};display:flex;flex-direction:column;padding:22px 14px;position:sticky;top:0;height:100vh}
.jm-nav{display:flex;flex-direction:column;gap:3px}.jm-nav--tabs{flex:1}
.jm-navbtn{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:10px;border:none;background:transparent;color:#B6A78C;font-family:${DEMO_UI};font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.jm-navbtn:hover{background:rgba(255,255,255,.08);color:${CREAM}}
.jm-main{flex:1;min-width:0;max-width:1180px;padding:24px 30px 60px}
@media(max-width:860px){.jm-shell{flex-direction:column}.jm-side{width:auto;height:auto;position:static;padding:14px 12px 10px}.jm-nav--tabs,.jm-nav--tools{flex-direction:row;overflow-x:auto;gap:6px;padding:4px 4px 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.jm-nav::-webkit-scrollbar{display:none}.jm-tools-label{margin:8px 4px 4px!important}.jm-navbtn{width:auto;padding:8px 14px;border-radius:18px;background:rgba(255,255,255,.07);flex-shrink:0;font-size:13px}.jm-main{padding:18px 16px 52px;max-width:100%}}`}</style>

      <DemoLobby />

      <div className={`jm-shell ${DEMO_PORTAL_ROOT_CLASS}`}>
        <aside className="jm-side">
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
          <nav className="jm-nav jm-nav--tabs" aria-label="Dashboard sections">
            {TABS.map(([id, label]) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  className="jm-navbtn"
                  onClick={() => {
                    setTab(id)
                    setExpandedStore(null)
                  }}
                  style={
                    active
                      ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${BRICK}` }
                      : undefined
                  }
                >
                  {label}
                </button>
              )
            })}
          </nav>
          <div className="jm-tools-label" style={{ ...lbl, color: '#7A6A52', fontSize: '10px', margin: '16px 14px 6px' }}>
            Tools
          </div>
          <nav className="jm-nav jm-nav--tools" aria-label="Tools">
            {EXTRA.map(([id, label]) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  className="jm-navbtn"
                  onClick={() => setTab(id)}
                  style={
                    active
                      ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${BRICK}` }
                      : undefined
                  }
                >
                  {label}
                  {id === 'quickbooks' ? (
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: SAGE, marginLeft: '8px', display: 'inline-block' }} />
                  ) : null}
                </button>
              )
            })}
          </nav>
          <div style={{ padding: '12px 10px 0', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: '8px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: '#8A7A66', lineHeight: 1.7 }}>
              SAMPLE DASHBOARD<br />
              <span style={{ color: BRICK, fontWeight: 600 }}>{DATA.meta.built_by}</span>
            </div>
          </div>
        </aside>

        <main className="jm-main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <div>
              <div style={{ ...lbl, color: BRICK }}>{BIZ}</div>
              <h1 style={{ ...big, fontSize: '28px', color: INK, lineHeight: 1.1, marginTop: '4px' }}>{currentLabel}</h1>
              <div style={{ fontSize: '12px', color: MUTED, marginTop: '6px' }}>{sampleHeader}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                {[['week', 'This week'], ['month', 'This month']].map(([p, l]) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: '4px 11px',
                      border: 'none',
                      background: period === p ? CHARCOAL : 'transparent',
                      color: period === p ? CREAM : MUTED,
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ ...big, fontSize: '24px', color: BRICK }}>{money0(ov.sales_this_month)}</div>
              <div style={{ ...lbl, color: '#9A8868' }}>REVENUE THIS MONTH</div>
            </div>
          </div>

          {tab === 'overview' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Cash on hand" v={money0(ov.cash_on_hand)} />
                <KPI
                  k="Sales this month"
                  v={money0(ov.sales_this_month)}
                  sub={`${salesDelta >= 0 ? '+' : ''}${pct1(salesDelta)} vs last month`}
                  accent={BRICK}
                />
                <KPI k="Bags sold" v={ov.bags_sold_this_month.toLocaleString()} />
                <KPI k="Active subscriptions" v={ov.active_subscriptions} accent={SAGE} />
                <KPI k="Owed by stores" v={money(ov.open_store_balance)} accent={ov.open_store_balance ? AMBER : INK} />
              </div>

              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <div style={{ ...lbl, marginBottom: '8px' }}>Sales by channel — trailing 12 months</div>
                <StackedSalesByChannel months={months} channels={CHANNELS} />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <RankedBars
                  title="Sales this month, by channel"
                  rows={ov.sales_by_channel.map((c) => ({ channel: c.channel, sales: c.sales }))}
                  valueKey="sales"
                  labelKey="channel"
                  footerTotal={channelSum}
                  tieExpected={ov.sales_this_month}
                  tieActual={channelSum}
                />
              </div>

              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <div style={{ ...lbl, marginBottom: '8px' }}>13-week cash forecast</div>
                <CashForecast13 forecast={DATA.cash_forecast_13_weeks} />
              </div>
            </>
          )}

          {tab === 'stores' && (
            <>
              <div style={{ ...card, marginBottom: '16px', padding: '12px 16px', fontSize: '13px', color: MUTED }}>
                Store names are real (primalkrisp.com store locator). All numbers are fictitious.
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Stores carrying" v={stores.count} />
                <KPI k="Bags sold to stores" v={storeKpis.bagsSold.toLocaleString()} />
                <KPI k="Owed by stores" v={money(ov.open_store_balance)} accent={AMBER} />
                <KPI k="Past 60 days" v={money(storeKpis.past60)} accent={storeKpis.past60 ? RED : INK} />
                <KPI k="Bags unaccounted" v={storeKpis.unaccounted} accent={storeKpis.unaccounted ? RED : SAGE} />
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
                      border: `1px solid ${regionFilter === r ? CHARCOAL : BORDER}`,
                      background: regionFilter === r ? CHARCOAL : CARDBG,
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
                      border: `1px solid ${termsFilter === t ? BRICK : BORDER}`,
                      background: termsFilter === t ? BRICK : CARDBG,
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
                const open = expandedStore === st.name
                const invSum = (s.open_invoices || []).reduce((a, inv) => a + inv.amount, 0)
                const pill =
                  s.reorder_flag === 'Reorder now'
                    ? { c: RED, t: 'Reorder now' }
                    : s.reorder_flag === 'Reorder soon'
                      ? { c: AMBER, t: 'Reorder soon' }
                      : { c: SAGE, t: 'OK' }
                return (
                  <div
                    key={st.name}
                    style={{ ...card, padding: 0, marginBottom: '12px', overflow: 'hidden', borderColor: open ? CHARCOAL : BORDER }}
                  >
                    <div onClick={() => setExpandedStore(open ? null : st.name)} style={{ padding: '15px 18px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ ...big, fontSize: '18px', color: INK }}>{st.name}</div>
                          <div style={{ fontSize: '12px', color: MUTED, marginTop: '4px' }}>
                            {st.city} · {s.terms} · {money(s.price_per_bag)}/bag
                          </div>
                          <div style={{ fontSize: '12px', color: INK, marginTop: '6px' }}>
                            Sent {sent} · Sold {s.bags_sold_sept} · On shelf {s.on_shelf_last_count}
                            {s.bags_unaccounted ? ` · ${s.bags_unaccounted} unaccounted` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', background: pill.c, padding: '5px 11px', borderRadius: '20px' }}>
                            {pill.t}
                          </span>
                          {s.bags_unaccounted > 0 && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: MUTED }}>{s.bags_unaccounted} unaccounted</span>
                          )}
                          {s.open_balance > 0 && (
                            <span style={{ ...big, fontSize: '15px', color: INK }}>{money(s.open_balance)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {open && (
                      <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${CREAM}` }}>
                        <div style={{ ...lbl, margin: '14px 0 8px' }}>Open invoices</div>
                        {(s.open_invoices || []).map((inv) => (
                          <Row key={inv.invoice} l={`${inv.invoice} · ${fmtD(inv.issued)} · ${inv.days_outstanding}d`} v={money(inv.amount)} />
                        ))}
                        <Row
                          l="Open balance"
                          v={money(s.open_balance)}
                          bold
                          top
                          tieExpected={s.open_balance}
                          tieActual={invSum}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {tab === 'subscriptions' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Website sales" v={money0(ov.sales_by_channel.find((c) => c.channel === 'Website')?.sales || 0)} />
                <KPI
                  k="Subscription sales"
                  v={money0(ov.sales_by_channel.find((c) => c.channel === 'Subscriptions')?.sales || 0)}
                  accent={BRICK}
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
                  formatValue={(v) => v.toLocaleString()}
                />
                <RankedBars
                  title="By what they get"
                  rows={DATA.subscriptions.by_what_they_get.map((r) => ({ label: r.item, n: r.active }))}
                  valueKey="n"
                  labelKey="label"
                  formatValue={(v) => v.toLocaleString()}
                />
                <RankedBars
                  title="Cancel reasons (September)"
                  rows={DATA.subscriptions.cancel_reasons.map((r) => ({ label: r.reason, n: r.count }))}
                  valueKey="n"
                  labelKey="label"
                  formatValue={(v) => v.toLocaleString()}
                />
              </div>
            </>
          )}

          {tab === 'tastings' && (
            <>
              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Code', 'Spend', 'Orders', 'Revenue', 'Return / $1', ''].map((h) => (
                        <th key={h} style={{ ...lbl, textAlign: h === 'Code' ? 'left' : 'right', padding: '8px 6px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DATA.promo_codes.map((p) => {
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
                      {['Product', 'Retail', 'Cost / bag', 'Bags sold (Sept)', ''].map((h) => (
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
                      const bags = marginRow?.bags_sold_sept_all_channels || 0
                      const retail = p.real.price_per_bag_in_packs || p.real.price_per_bag_build_your_own
                      return (
                        <Fragment key={p.name}>
                          <tr style={{ borderBottom: `1px solid ${CREAM}` }}>
                            <td style={{ padding: '10px 6px', fontWeight: 600 }}>{p.name}</td>
                            <td style={{ padding: '10px 6px', fontFamily: MONO }}>{retail ? money(retail) : '—'}</td>
                            <td style={{ padding: '10px 6px', fontFamily: MONO }}>{money(cost.total)}</td>
                            <td style={{ padding: '10px 6px', fontFamily: MONO }}>{bags}</td>
                            <td style={{ padding: '10px 6px' }}>
                              <button
                                type="button"
                                onClick={() => setCostOpen(open ? null : p.name)}
                                style={{ background: 'none', border: 'none', color: BRICK, cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                              >
                                {open ? 'Hide' : 'Expand'}
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

              <div style={{ ...card, overflowX: 'auto' }}>
                <div style={{ ...lbl, marginBottom: '8px' }}>Margin per bag by channel</div>
                <MarginByChannelChart products={DATA.product_margins_by_channel} channels={CHANNELS} />
              </div>
            </>
          )}

          {tab === 'inventory' && (
            <>
              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <div style={{ ...lbl, marginBottom: '8px' }}>Days of stock per product</div>
                <InventoryDaysChart rows={DATA.inventory.by_product} />
              </div>

              <div style={{ ...card, overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Run', 'Date', 'Product', 'Raw lbs', 'Planned', 'Packed', 'Yield', 'Cost / bag', 'Status'].map((h) => (
                        <th key={h} style={{ ...lbl, padding: '8px 4px', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DATA.production_runs.map((r) => (
                      <tr key={r.run} style={{ borderBottom: `1px solid ${CREAM}` }}>
                        <td style={{ padding: '8px 4px', fontWeight: 600 }}>{r.run}</td>
                        <td style={{ padding: '8px 4px' }}>{fmtD(r.date)}</td>
                        <td style={{ padding: '8px 4px' }}>{r.product}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO }}>{r.raw_meat_lbs}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO }}>{r.bags_planned}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO }}>{r.bags_packed ?? '—'}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO }}>{r.yield_vs_plan_pct != null ? pct1(r.yield_vs_plan_pct) : '—'}</td>
                        <td style={{ padding: '8px 4px', fontFamily: MONO }}>{r.cost_per_bag != null ? money(r.cost_per_bag) : '—'}</td>
                        <td style={{ padding: '8px 4px' }}>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'pnl' && (
            <>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[['single', 'This month'], ['range', 'Date range']].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setPnlView(v)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '18px',
                      border: `1px solid ${pnlView === v ? CHARCOAL : BORDER}`,
                      background: pnlView === v ? CHARCOAL : CARDBG,
                      color: pnlView === v ? CREAM : MUTED,
                      ...btn,
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {pnlView === 'single' && (
                <>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <KPI k="Revenue" v={money(pnl.revenue_total)} accent={SAGE} />
                    <KPI k="Gross profit" v={money(pnl.gross_profit)} />
                    <KPI k="Net profit" v={money(pnl.net_profit)} accent={BRICK} />
                  </div>
                  <div style={{ ...card }}>
                    <div style={{ ...lbl, marginBottom: '12px' }}>Profit &amp; loss — {pnl.period} ({pnl.basis})</div>
                    <DrillRow k="rev" l="Revenue" v={money(pnl.revenue_total)} items={revLines} tieTotal={pnl.revenue_total} />
                    <DrillRow k="cogs" l="Cost of goods sold" v={money(-pnl.cogs)} items={cogsLines} tieTotal={pnl.cogs} />
                    <Row l="Gross profit" v={money(pnl.gross_profit)} bold top />
                    <DrillRow
                      k="opex"
                      l="Operating expenses"
                      v={money(-pnl.operating_expenses_total)}
                      items={opexLines}
                      tieTotal={pnl.operating_expenses_total}
                    />
                    <Row l="Net profit" v={money(pnl.net_profit)} bold top />
                  </div>
                </>
              )}

              {pnlView === 'range' && (
                <div style={{ ...card, overflowX: 'auto' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ ...lbl }}>From</span>
                    <select value={rangeStart} onChange={(e) => setRangeStart(Number(e.target.value))} style={{ ...inp, cursor: 'pointer' }}>
                      {months.map((m, i) => (
                        <option key={i} value={i}>{m.label}</option>
                      ))}
                    </select>
                    <span style={{ ...lbl }}>to</span>
                    <select value={rangeEnd} onChange={(e) => setRangeEnd(Number(e.target.value))} style={{ ...inp, cursor: 'pointer' }}>
                      {months.map((m, i) => (
                        <option key={i} value={i}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: 'max-content' }}>
                    <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, paddingBottom: '8px' }}>
                      <span style={{ width: '120px', ...lbl }}>Month</span>
                      <span style={{ width: '100px', ...lbl, textAlign: 'right' }}>Revenue</span>
                    </div>
                    {months.slice(Math.min(rangeStart, rangeEnd), Math.max(rangeStart, rangeEnd) + 1).map((m) => (
                      <div key={m.month} style={{ display: 'flex', padding: '6px 0', borderBottom: `1px solid ${CREAM}` }}>
                        <span style={{ width: '120px', fontSize: '13px' }}>{m.label}</span>
                        <span style={{ width: '100px', textAlign: 'right', fontFamily: MONO, fontSize: '13px' }}>{money(m.Total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'quickbooks' && (
            <>
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ ...big, fontSize: '18px', color: INK }}>QuickBooks Online</div>
                <div style={{ fontSize: '13px', color: MUTED, marginTop: '6px' }}>{BIZ} · last sync 02:14 ET</div>
              </div>
              {['Synced reports', 'Operating hooks', 'Close workflow'].map((title) => (
                <div key={title} style={{ ...card, marginBottom: '12px', fontWeight: 600, fontSize: '15px', color: INK }}>
                  {title}
                </div>
              ))}
            </>
          )}

          {tab === 'close' && (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <KPI k="Income to post" v={money(DATA.monthly_close.income_to_post_total)} accent={SAGE} />
                <KPI k="COGS to post" v={money(DATA.monthly_close.cogs_to_post.amount)} />
                <KPI k="AR at month end" v={money(DATA.monthly_close.ar_open_at_month_end)} accent={AMBER} />
              </div>
              <div style={{ ...card }}>
                <div style={{ ...lbl, color: BROWN, marginBottom: '6px' }}>Income to post</div>
                {Object.entries(DATA.monthly_close.income_to_post).map(([k, v]) => (
                  <Row key={k} l={k} v={money(v)} />
                ))}
                <Row l="Total" v={money(DATA.monthly_close.income_to_post_total)} bold top />
                <div style={{ marginTop: '16px', padding: '12px 14px', background: CREAM, borderRadius: '10px', border: `1px dashed ${BORDER}` }}>
                  <div style={{ ...lbl, marginBottom: '6px' }}>Booked elsewhere — do NOT re-enter</div>
                  {Object.entries(DATA.monthly_close.booked_through_shopify_do_not_reenter).map(([k, v]) => (
                    <Row key={k} l={k} v={money(v)} />
                  ))}
                </div>
                <div style={{ ...lbl, color: BROWN, margin: '16px 0 6px' }}>Journal entry preview</div>
                {DATA.monthly_close.journal_entries_preview.map((je, i) => (
                  <div key={i} style={{ fontSize: '12px', color: MUTED, padding: '6px 0', borderTop: i ? `1px solid ${CREAM}` : 'none' }}>
                    <span style={{ color: INK, fontWeight: 600 }}>{je.memo}</span> · Dr {je.debit} / Cr {je.credit} · {money(je.amount)}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'askai' && (
            <>
              {DATA.answers.map((item, i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <div style={{ background: CHARCOAL, color: CREAM, padding: '10px 14px', borderRadius: '14px 14px 4px 14px', maxWidth: '85%', fontSize: '14px' }}>
                      {item.q}
                    </div>
                  </div>
                  <div style={{ ...card, padding: '13px 15px', fontSize: '14px', lineHeight: 1.55, maxWidth: '90%' }}>{item.a}</div>
                </div>
              ))}
            </>
          )}
        </main>
      </div>
    </>
  )
}

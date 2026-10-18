import { useState, useCallback } from 'react'
import DemoLobby from '../../DemoLobby'
import { DATA } from './popinsanityComputed'
import {
  SPICE,
  CHAR,
  CREAM,
  INK,
  SHELL_CSS,
} from './popinsanityUtils'
import { useStyles } from './PopinsanityShared'
import PopinsanityOverview from './PopinsanityOverview'
import PopinsanityOrdersTab from './PopinsanityOrdersTab'
import PopinsanityTiersTab from './PopinsanityTiersTab'
import PopinsanitySalesTab from './PopinsanitySalesTab'
import PopinsanityCalendarTab from './PopinsanityCalendarTab'
import PopinsanityFinancials from './PopinsanityFinancials'
import {
  OrderDetail,
  TierDetail,
  ChannelDetail,
  DayDetail,
  PnlLineDetail,
  ProductLineDetail,
} from './PopinsanityDetails'

const TABS = [
  ['overview', 'Overview'],
  ['orders', 'Corporate orders'],
  ['tiers', 'Gift tiers'],
  ['sales', 'Sales by channel'],
  ['calendar', 'Cash-in calendar'],
  ['financials', 'Financials'],
]

const BIZ = DATA.meta.company

export default function PopinsanityPortal() {
  const [tab, setTab] = useState('overview')
  const [calendarMonth, setCalendarMonth] = useState('2026-10')
  const [stack, setStack] = useState([])
  const styles = useStyles()

  const currentLabel = TABS.find((t) => t[0] === tab)?.[1] || ''

  const goTab = useCallback((id) => {
    setTab(id)
    setStack([])
  }, [])

  const push = useCallback((view) => {
    setStack((s) => [...s, view])
  }, [])

  const back = useCallback(() => {
    setStack((s) => (s.length ? s.slice(0, -1) : s))
  }, [])

  const openOrder = useCallback((orderId) => push({ kind: 'order', orderId }), [push])
  const openTier = useCallback((tierId) => push({ kind: 'tier', tierId }), [push])
  const openChannel = useCallback((channelId) => push({ kind: 'channel', channelId }), [push])
  const openDay = useCallback((date, items) => push({ kind: 'day', date, items }), [push])
  const openPnlLine = useCallback((line) => push({ kind: 'pnl', line }), [push])

  const top = stack[stack.length - 1]

  const portalStyles = SHELL_CSS({ CHAR, CREAM, INK, SPICE })

  const renderDetail = () => {
    if (!top) return null
    const wrap = (node) => <div key={stack.length}>{node}</div>
    switch (top.kind) {
      case 'order':
        return wrap(
          <OrderDetail
            orderId={top.orderId}
            onBack={back}
            onTier={(id) => push({ kind: 'tier', tierId: id })}
            card={styles.card}
            big={styles.big}
            lbl={styles.lbl}
          />,
        )
      case 'tier':
        return wrap(
          <TierDetail
            tierId={top.tierId}
            onBack={back}
            onOrder={openOrder}
            card={styles.card}
            big={styles.big}
            lbl={styles.lbl}
          />,
        )
      case 'channel':
        return wrap(
          <ChannelDetail
            channelId={top.channelId}
            onBack={back}
            onOrder={openOrder}
            onProductLine={(line) => push({ kind: 'productLine', line })}
            card={styles.card}
            big={styles.big}
            lbl={styles.lbl}
          />,
        )
      case 'productLine':
        return wrap(<ProductLineDetail line={top.line} onBack={back} card={styles.card} big={styles.big} />)
      case 'day':
        return wrap(<DayDetail date={top.date} items={top.items} onBack={back} onOrder={openOrder} card={styles.card} big={styles.big} />)
      case 'pnl':
        return wrap(
          <PnlLineDetail
            line={top.line}
            section={top.line.section}
            onBack={back}
            onChannel={(id) => push({ kind: 'channel', channelId: id })}
            card={styles.card}
            big={styles.big}
          />,
        )
      default:
        return null
    }
  }

  const renderTab = () => {
    switch (tab) {
      case 'overview':
        return (
          <PopinsanityOverview
            styles={styles}
            goTab={goTab}
            setCalendarMonth={setCalendarMonth}
            openChannel={openChannel}
            openTier={openTier}
          />
        )
      case 'orders':
        return <PopinsanityOrdersTab styles={styles} openOrder={openOrder} />
      case 'tiers':
        return <PopinsanityTiersTab styles={styles} openTier={openTier} />
      case 'sales':
        return <PopinsanitySalesTab styles={styles} openChannel={openChannel} />
      case 'calendar':
        return (
          <PopinsanityCalendarTab
            styles={styles}
            monthKey={calendarMonth}
            setMonthKey={setCalendarMonth}
            openDay={openDay}
            openOrder={openOrder}
          />
        )
      case 'financials':
        return <PopinsanityFinancials styles={styles} openPnlLine={openPnlLine} />
      default:
        return null
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: portalStyles }} />
      <DemoLobby />
      <div className="pop-shell">
        <aside className="pop-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <div className="pop-wordmark">POPINSANITY</div>
            <div
              style={{
                fontFamily: styles.lbl.fontFamily,
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.7px',
                textTransform: 'uppercase',
                color: '#B6A78C',
                marginTop: '12px',
              }}
            >
              Dashboard
            </div>
          </div>
          <nav className="pop-nav pop-nav--main" aria-label="Dashboard sections">
            {TABS.map(([id, label]) => {
              const active = tab === id && !top
              return (
                <button
                  key={id}
                  type="button"
                  className="pop-navbtn"
                  onClick={() => goTab(id)}
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
        </aside>

        <nav className="pop-mobtab" aria-label="Mobile sections">
          {TABS.map(([id, label]) => {
            const active = tab === id && !top
            const short =
              id === 'overview'
                ? 'Overview'
                : id === 'orders'
                  ? 'Orders'
                  : id === 'tiers'
                    ? 'Tiers'
                    : id === 'sales'
                      ? 'Sales'
                      : id === 'calendar'
                        ? 'Cash'
                        : 'P&L'
            return (
              <button key={id} type="button" className={active ? 'pop-mobtab--on' : ''} onClick={() => goTab(id)}>
                {short}
              </button>
            )
          })}
        </nav>

        <main className="pop-main">
          <div style={{ marginBottom: '22px' }}>
            <div style={{ ...styles.lbl, color: SPICE }}>{BIZ}</div>
            <h1 style={{ ...styles.big, fontSize: '28px', color: INK, letterSpacing: '0.3px', lineHeight: 1.1, marginTop: '4px' }}>
              {top ? (top.kind === 'order' ? 'Order detail' : top.kind === 'tier' ? 'Tier detail' : top.kind === 'channel' ? 'Channel detail' : top.kind === 'day' ? 'Cash due' : 'Line detail') : currentLabel}
            </h1>
          </div>
          {top ? renderDetail() : renderTab()}
        </main>
      </div>
    </>
  )
}

import { useMemo, useState, useEffect } from 'react'
import DemoLobby from '../../DemoLobby'
import MR_DIPZ_RAW from './mrDipzData'
import {
  buildMrDipzModel,
  SHELL_CSS,
  CHAR,
  SPICE,
  KRAFT,
  CREAM,
  CARDBG,
  INK,
  MUTED,
  BORDER,
  GREEN,
  AMBER,
  UI,
  MONO,
  fmtAsOfLong,
} from './mrDipzUtils'
import MrDipzOverview from './MrDipzOverview'
import MrDipzStores from './MrDipzStores'
import MrDipzCredits from './MrDipzCredits'
import MrDipzProducts from './MrDipzProducts'
import MrDipzOwed from './MrDipzOwed'
import MrDipzFinancials from './MrDipzFinancials'
import MrDipzDetail from './MrDipzDetail'

const AS_OF = MR_DIPZ_RAW.meta.as_of
const BIZ = MR_DIPZ_RAW.meta.brand

const TABS = [
  ['overview', 'Overview'],
  ['stores', 'Stores'],
  ['credits', 'Credits'],
  ['products', 'Products'],
  ['owed', 'Owed by stores'],
  ['financials', 'Financials'],
]

export default function MrDipzSample() {
  const [tab, setTab] = useState('overview')
  const [detail, setDetail] = useState(null)
  const model = useMemo(() => buildMrDipzModel(MR_DIPZ_RAW), [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setDetail(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
        className="md-click"
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

  const goTab = (id) => {
    setTab(id)
    setDetail(null)
  }

  const onStoreClick = (st) => setDetail({ type: 'store', store: st })
  const onCreditClick = (cm, storeName) => setDetail({ type: 'credit', credit: cm, storeName })
  const onProductClick = (p) => setDetail({ type: 'product', product: p })

  const currentLabel = TABS.find((t) => t[0] === tab)?.[1] || ''
  const sampleHeader = `Sample — fictitious numbers · as of ${fmtAsOfLong(AS_OF)}`

  const portalStyles = SHELL_CSS({ CHAR, CREAM, INK, SPICE })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: portalStyles }} />
      <DemoLobby />
      <div className="md-shell">
        <aside className="md-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <div
              style={{
                fontFamily: UI,
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: '0.12em',
                color: CREAM,
                lineHeight: 1.2,
              }}
            >
              MR. DIPZ
            </div>
            <div style={{ ...lbl, color: '#B6A78C', marginTop: '12px' }}>Dashboard</div>
          </div>
          <nav className="md-nav md-nav--main" aria-label="Dashboard sections">
            {TABS.map(([id, label]) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  type="button"
                  className="md-navbtn"
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
          <div style={{ padding: '12px 10px 0', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: '8px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: '#8A7A66', lineHeight: 1.7 }}>
              SAMPLE DASHBOARD<br />
              <span style={{ color: SPICE, fontWeight: 600 }}>{MR_DIPZ_RAW.meta.built_by}</span>
            </div>
          </div>
        </aside>

        <main className="md-main">
          <div style={{ marginBottom: '22px' }}>
            <div style={{ ...lbl, color: SPICE }}>{BIZ}</div>
            <h1 style={{ ...big, fontSize: '28px', color: INK, letterSpacing: '0.3px', lineHeight: 1.1, marginTop: '4px' }}>{currentLabel}</h1>
            <div style={{ fontSize: '12px', color: MUTED, marginTop: '6px' }}>{sampleHeader}</div>
          </div>

          {detail ? (
            <MrDipzDetail detail={detail} onClose={() => setDetail(null)} productBySku={model.productBySku} />
          ) : null}

          {tab === 'overview' && (
            <MrDipzOverview model={model} card={card} lbl={lbl} big={big} KPI={KPI} goTab={goTab} onStoreClick={onStoreClick} />
          )}
          {tab === 'stores' && <MrDipzStores model={model} card={card} lbl={lbl} inp={inp} onStoreClick={onStoreClick} />}
          {tab === 'credits' && <MrDipzCredits model={model} card={card} lbl={lbl} onCreditClick={onCreditClick} />}
          {tab === 'products' && <MrDipzProducts model={model} card={card} lbl={lbl} onProductClick={onProductClick} />}
          {tab === 'owed' && <MrDipzOwed model={model} card={card} lbl={lbl} onStoreClick={onStoreClick} />}
          {tab === 'financials' && <MrDipzFinancials model={model} card={card} lbl={lbl} />}
        </main>
      </div>
    </>
  )
}

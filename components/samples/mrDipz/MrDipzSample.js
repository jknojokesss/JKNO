import { useMemo, useState, useEffect } from 'react'
import DemoLobby from '../../DemoLobby'
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
  UI,
  MONO,
} from './mrDipzUtils'
import MrDipzOverview from './MrDipzOverview'
import MrDipzStores from './MrDipzStores'
import MrDipzCredits from './MrDipzCredits'
import MrDipzProducts from './MrDipzProducts'
import MrDipzOwed from './MrDipzOwed'
import MrDipzFinancials from './MrDipzFinancials'
import MrDipzDetail from './MrDipzDetail'

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
  const model = useMemo(() => buildMrDipzModel(), [])

  useEffect(() => {
    if (!detail) return
    const onKey = (e) => {
      if (e.key === 'Escape') setDetail(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail])

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

  const KPI = ({ k, v, sub, accent, onClick }) => {
    const inner = (
      <>
        <div style={lbl}>{k}</div>
        <div style={{ ...big, fontSize: '29px', color: accent || INK, lineHeight: 1.15, marginTop: '4px' }}>{v}</div>
        {sub ? <div style={{ fontFamily: UI, fontSize: '12px', color: '#A2937A', marginTop: '3px' }}>{sub}</div> : null}
      </>
    )
    if (!onClick) return <div style={{ ...card, flex: 1, minWidth: 150, padding: '15px 17px' }}>{inner}</div>
    return (
      <button type="button" className="md-click" onClick={onClick} style={{ ...card, flex: 1, minWidth: 150, padding: '15px 17px', textAlign: 'left', cursor: 'pointer', position: 'relative' }}>
        {inner}
        <span style={{ position: 'absolute', top: 11, right: 13, color: '#C6B79A', fontSize: 15 }}>›</span>
      </button>
    )
  }

  const goTab = (id) => {
    setTab(id)
    setDetail(null)
  }

  const currentLabel = TABS.find((t) => t[0] === tab)?.[1] || ''
  const sampleHeader = `Sample — fictitious numbers · as of Sep 30, 2026`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS({ CHAR, CREAM, INK, SPICE }) }} />
      <DemoLobby />
      <div className="md-shell">
        <aside className="md-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 22, letterSpacing: '0.12em', color: CREAM }}>MR. DIPZ</div>
            <div style={{ ...lbl, color: '#B6A78C', marginTop: 12 }}>Dashboard</div>
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
                  style={active ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${SPICE}` } : undefined}
                >
                  {label}
                </button>
              )
            })}
          </nav>
          <div style={{ padding: '12px 10px 0', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: 8 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: '#8A7A66', lineHeight: 1.7 }}>
              SAMPLE DASHBOARD<br />
              <span style={{ color: SPICE, fontWeight: 600 }}>JK No Jokes Financials</span>
            </div>
          </div>
        </aside>

        <main className="md-main">
          <div style={{ marginBottom: 22 }}>
            <div style={{ ...lbl, color: SPICE }}>Mr. Dipz</div>
            <h1 style={{ ...big, fontSize: 28, color: INK, marginTop: 4, lineHeight: 1.1 }}>{currentLabel}</h1>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{sampleHeader}</div>
          </div>

          {detail ? <MrDipzDetail detail={detail} onClose={() => setDetail(null)} /> : null}

          {tab === 'overview' && (
            <MrDipzOverview
              model={model}
              card={card}
              lbl={lbl}
              KPI={KPI}
              goTab={goTab}
              onAreaClick={(area) => setDetail({ type: 'area', area })}
              onWeekClick={(week) => setDetail({ type: 'week', week })}
            />
          )}
          {tab === 'stores' && (
            <MrDipzStores
              model={model}
              card={card}
              lbl={lbl}
              onStoreClick={(st) => setDetail({ type: 'store', store: st })}
              onAreaClick={(area) => setDetail({ type: 'area', area })}
            />
          )}
          {tab === 'credits' && (
            <MrDipzCredits model={model} card={card} lbl={lbl} onCreditClick={(c) => setDetail({ type: 'credit', credit: c })} />
          )}
          {tab === 'products' && (
            <MrDipzProducts model={model} card={card} lbl={lbl} onProductClick={(p) => setDetail({ type: 'product', product: p })} />
          )}
          {tab === 'owed' && (
            <MrDipzOwed model={model} card={card} lbl={lbl} onInvoiceClick={(inv) => setDetail({ type: 'invoice', invoice: inv })} />
          )}
          {tab === 'financials' && (
            <MrDipzFinancials
              model={model}
              card={card}
              lbl={lbl}
              onPnlLineClick={(line, month, amount, prior) => setDetail({ type: 'pnl', line, month, amount, prior })}
            />
          )}
        </main>
      </div>
    </>
  )
}

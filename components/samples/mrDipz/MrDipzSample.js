import { useMemo, useState, useEffect } from 'react'
import { buildMrDipzModel, CREAM, SPICE, INK, MUTED, UI } from './mrDipzUtils'

export const MD_SAMPLE_HEADER = 'Sample — fictitious numbers · as of Oct 2026'
export const MD_CREDIT_LINE = 'JK No Jokes Financials'
import { SHELL_CSS } from './MrDipzKit'
import MrDipzOverview from './MrDipzOverview'
import MrDipzStores from './MrDipzStores'
import MrDipzCredits from './MrDipzCredits'
import MrDipzProducts from './MrDipzProducts'
import MrDipzOwed from './MrDipzOwed'
import MrDipzFinancials from './MrDipzFinancials'
import MrDipzDetail from './MrDipzDetail'

const BIZ = 'Mr. Dipz'

const TABS = [
  ['overview', 'Overview'],
  ['stores', 'Stores'],
  ['credits', 'Credits'],
  ['products', 'Products'],
  ['owed', 'Owed by stores'],
  ['financials', 'Financials'],
]

const TAB_BODY = {
  overview: MrDipzOverview,
  stores: MrDipzStores,
  credits: MrDipzCredits,
  products: MrDipzProducts,
  owed: MrDipzOwed,
  financials: MrDipzFinancials,
}

export default function MrDipzSample() {
  const [tab, setTab] = useState('overview')
  const [stack, setStack] = useState([])
  const model = useMemo(() => buildMrDipzModel(), [])

  const scrollTop = () => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }
  const open = (d) => {
    setStack((s) => [...s, d])
    scrollTop()
  }
  const back = () => {
    setStack((s) => s.slice(0, -1))
    scrollTop()
  }
  const close = () => {
    setStack([])
    scrollTop()
  }
  const goTab = (id) => {
    setTab(id)
    setStack([])
    scrollTop()
  }

  useEffect(() => {
    document.documentElement.classList.add('md-sample-page')
    return () => document.documentElement.classList.remove('md-sample-page')
  }, [])

  useEffect(() => {
    if (!stack.length) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setStack((s) => s.slice(0, -1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stack.length])

  const currentLabel = TABS.find((t) => t[0] === tab)?.[1] || ''
  const Body = TAB_BODY[tab]
  const detail = stack[stack.length - 1]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />

      <div className="md-shell">
        <aside className="md-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <div className="md-credit">{MD_CREDIT_LINE}</div>
            <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 26, letterSpacing: '1px', color: CREAM, lineHeight: 1.1, marginTop: 10 }}>
              MR. DIPZ
            </div>
            <div className="md-lbl" style={{ color: '#B6A78C', marginTop: 12 }}>
              Dashboard
            </div>
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
        </aside>

        <main className="md-main">
          <div style={{ marginBottom: 22 }}>
            <div className="md-lbl" style={{ color: SPICE }}>
              {BIZ}
            </div>
            <h1 style={{ fontFamily: UI, fontWeight: 700, fontSize: 28, color: INK, letterSpacing: '0.3px', lineHeight: 1.1, marginTop: 4 }}>
              {currentLabel}
            </h1>
            <div className="md-sample-header" style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{MD_SAMPLE_HEADER}</div>
          </div>

          {detail ? (
            <MrDipzDetail model={model} detail={detail} depth={stack.length} open={open} back={back} close={close} />
          ) : (
            <Body model={model} open={open} goTab={goTab} />
          )}
        </main>
      </div>
    </>
  )
}

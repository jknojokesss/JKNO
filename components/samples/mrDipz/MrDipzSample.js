import { useMemo, useState, useEffect } from 'react'
import { buildMrDipzModel, CREAM, SPICE, INK, MUTED, UI } from './mrDipzUtils'
import SampleJkLogoLink from '../SampleJkLogoLink'

export const MD_SAMPLE_HEADER = 'Sample — fictitious numbers · as of Oct 2026'
import { SHELL_CSS } from './MrDipzKit'
import MrDipzOverview from './MrDipzOverview'
import MrDipzStores from './MrDipzStores'
import MrDipzCredits from './MrDipzCredits'
import MrDipzDeductions from './MrDipzDeductions'
import MrDipzProducts from './MrDipzProducts'
import MrDipzOwed from './MrDipzOwed'
import MrDipzFinancials from './MrDipzFinancials'
import MrDipzDetail from './MrDipzDetail'

const BIZ = 'Mr. Dipz'

const TABS = [
  ['overview', 'Overview', 'Overview'],
  ['stores', 'Stores', 'Stores'],
  ['credits', 'Credits', 'Credits'],
  ['deductions', 'Distributor deductions', 'Deductions'],
  ['products', 'Products', 'Products'],
  ['owed', 'Owed by stores', 'Owed'],
  ['financials', 'Financials', 'P&L'],
]

const TAB_BODY = {
  overview: MrDipzOverview,
  stores: MrDipzStores,
  credits: MrDipzCredits,
  deductions: MrDipzDeductions,
  products: MrDipzProducts,
  owed: MrDipzOwed,
  financials: MrDipzFinancials,
}

export default function MrDipzSample() {
  const [tab, setTab] = useState('overview')
  const [deductionFilter, setDeductionFilter] = useState(null)
  const [stack, setStack] = useState([])
  const [narrowNav, setNarrowNav] = useState(false)
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
  const goTab = (id, opts) => {
    setTab(id)
    setStack([])
    setDeductionFilter(opts?.deductionFilter ?? null)
    scrollTop()
  }

  useEffect(() => {
    document.documentElement.classList.add('md-sample-page')
    return () => document.documentElement.classList.remove('md-sample-page')
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)')
    const sync = () => setNarrowNav(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
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

      <SampleJkLogoLink />

      <div className="md-shell">
        <aside className="md-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 26, letterSpacing: '1px', color: CREAM, lineHeight: 1.1, marginTop: 10 }}>
              MR. DIPZ
            </div>
          </div>
          <nav className="md-nav md-nav--main" aria-label="Sections">
            {TABS.map(([id, longLabel, shortLabel]) => {
              const active = tab === id
              const navLabel = narrowNav ? shortLabel : longLabel
              return (
                <button
                  key={id}
                  type="button"
                  className="md-navbtn"
                  onClick={() => goTab(id)}
                  style={active ? { background: 'rgba(255,255,255,.12)', color: CREAM, boxShadow: `inset 3px 0 0 ${SPICE}` } : undefined}
                >
                  {navLabel}
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
            <Body
              model={model}
              open={open}
              goTab={goTab}
              initialFilter={tab === 'deductions' ? deductionFilter : undefined}
            />
          )}
        </main>
      </div>
    </>
  )
}

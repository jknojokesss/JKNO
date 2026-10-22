import { useEffect, useReducer, useState } from 'react'
import SampleJkLogoLink from '../SampleJkLogoLink'
import DATA from '../../../data/lease-broker-crm.json'
import { initLeaseBrokerState, leaseBrokerReducer } from './leaseBrokerReducer'
import { ACCENT, INK, MUTED, SHELL_CSS, UI, fmtD } from './leaseBrokerUtils'
import LeaseBrokerHome from './LeaseBrokerHome'
import LeaseBrokerBoard from './LeaseBrokerBoard'
import LeaseBrokerDeal from './LeaseBrokerDeal'
import LeaseBrokerFees from './LeaseBrokerFees'
import LeaseBrokerDealers from './LeaseBrokerDealers'
import LeaseBrokerReferrals from './LeaseBrokerReferrals'
import { AddDealModal, AddQuoteModal, AddDealerModal, MarkFeePaidModal } from './LeaseBrokerModals'

const BIZ = DATA.brand.name
const META = DATA.meta
const SAMPLE_HEADER = `Sample — fictitious clients and dealers · as of ${fmtD(META.as_of)}`

const TABS = [
  ['home', 'Home', 'Home'],
  ['board', 'Deal board', 'Board'],
  ['fees', 'Fee tracker', 'Fees'],
  ['dealers', 'Dealers', 'Dealers'],
  ['referrals', 'Referrals', 'Referrals'],
]

export default function LeaseBrokerPortal() {
  const [state, dispatch] = useReducer(leaseBrokerReducer, undefined, initLeaseBrokerState)
  const [tab, setTab] = useState('home')
  const [dealId, setDealId] = useState(null)
  const [narrowNav, setNarrowNav] = useState(false)
  const [ready, setReady] = useState(false)
  const [modal, setModal] = useState(null)
  const [feeDealId, setFeeDealId] = useState(null)
  const [prefill, setPrefill] = useState(null)

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)')
    const sync = () => setNarrowNav(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const openDeal = (id) => {
    setDealId(id)
    setTab('deal')
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  const goTab = (id) => {
    setTab(id)
    setDealId(null)
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  const deal = dealId ? state.deals.find((d) => d.id === dealId) : null

  const currentLabel =
    tab === 'deal' && deal ? deal.client.name : TABS.find((t) => t[0] === tab)?.[1] || 'Home'

  const startNewDealFromLease = (d) => {
    setPrefill({
      client: { ...d.client },
      vehicle: { make: '', model: '', trim: '', miles_per_year: 10000, term_months: 36, down: 0 },
      referrerId: d.referrer_id || state.referrers[0]?.id,
    })
    setModal('addDeal')
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />
      <SampleJkLogoLink />

      <div className="lb-shell">
        <aside className="lb-side">
          <div style={{ padding: '2px 8px 16px' }}>
            <button
              type="button"
              onClick={() => goTab('home')}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: UI,
                fontWeight: 800,
                fontSize: narrowNav ? 20 : 22,
                letterSpacing: '0.5px',
                color: '#F4F5F7',
                lineHeight: 1.15,
              }}
            >
              PARKWAY
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', color: '#9CA3AF', marginTop: 4 }}>LEASE BROKERS</div>
            </button>
          </div>
          <nav className="lb-nav" aria-label="Sections">
            {TABS.map(([id, longLabel, shortLabel]) => {
              const active = tab === id || (tab === 'deal' && id === 'board')
              const label = narrowNav ? shortLabel : longLabel
              return (
                <button
                  key={id}
                  type="button"
                  className="lb-navbtn"
                  onClick={() => goTab(id)}
                  style={
                    active
                      ? { background: 'rgba(255,255,255,.12)', color: '#fff', boxShadow: `inset 3px 0 0 ${ACCENT}` }
                      : undefined
                  }
                >
                  {label}
                </button>
              )
            })}
          </nav>
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button type="button" className="lb-btn lb-btn--primary" style={{ width: '100%' }} onClick={() => setModal('addDeal')}>
              Add deal
            </button>
          </div>
        </aside>

        <main className="lb-main">
          <div style={{ marginBottom: 22 }}>
            <button
              type="button"
              onClick={() => goTab('home')}
              style={{
                fontFamily: UI,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '.7px',
                textTransform: 'uppercase',
                color: ACCENT,
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              {BIZ}
            </button>
            <h1 style={{ fontFamily: UI, fontWeight: 700, fontSize: 28, color: INK, lineHeight: 1.1, marginTop: 4 }}>{currentLabel}</h1>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{SAMPLE_HEADER}</div>
          </div>

          {tab === 'home' && (
            <LeaseBrokerHome
              state={state}
              meta={META}
              ready={ready}
              openDeal={openDeal}
              startNewDealFromLease={startNewDealFromLease}
              goFees={() => goTab('fees')}
            />
          )}
          {tab === 'board' && (
            <LeaseBrokerBoard
              deals={state.deals}
              onMove={(id, stage) => dispatch({ type: 'MOVE_DEAL', dealId: id, stage })}
              openDeal={openDeal}
            />
          )}
          {tab === 'deal' && (
            <LeaseBrokerDeal
              deal={deal}
              dealers={state.dealers}
              referrers={state.referrers}
              programMonth={META.program_month}
              onBack={() => goTab('board')}
              onPickWinner={(dealId, quoteId) => dispatch({ type: 'PICK_WINNER', dealId, quoteId })}
              onAddQuote={() => setModal('addQuote')}
              onMarkFeePaid={() => setFeeDealId(deal.id)}
            />
          )}
          {tab === 'fees' && (
            <LeaseBrokerFees
              deals={state.deals}
              meta={META}
              ready={ready}
              openDeal={openDeal}
              onMarkFeePaid={(id) => setFeeDealId(id)}
            />
          )}
          {tab === 'dealers' && (
            <LeaseBrokerDealers dealers={state.dealers} onAddDealer={() => setModal('addDealer')} />
          )}
          {tab === 'referrals' && (
            <LeaseBrokerReferrals deals={state.deals} referrers={state.referrers} openDeal={openDeal} />
          )}
        </main>
      </div>

      {modal === 'addDeal' && (
        <AddDealModal
          key={prefill ? `prefill-${prefill.client.name}` : 'new'}
          referrers={state.referrers}
          initialClient={prefill?.client}
          initialReferrerId={prefill?.referrerId}
          onClose={() => {
            setModal(null)
            setPrefill(null)
          }}
          onSave={(payload) => {
            dispatch({ type: 'ADD_DEAL', ...payload })
            setPrefill(null)
          }}
        />
      )}
      {modal === 'addQuote' && deal && (
        <AddQuoteModal
          dealers={state.dealers}
          dealId={deal.id}
          onClose={() => setModal(null)}
          onSave={(payload) => dispatch({ type: 'ADD_QUOTE', ...payload })}
        />
      )}
      {modal === 'addDealer' && (
        <AddDealerModal onClose={() => setModal(null)} onSave={(payload) => dispatch({ type: 'ADD_DEALER', ...payload })} />
      )}
      {feeDealId && (
        <MarkFeePaidModal
          clientName={state.deals.find((d) => d.id === feeDealId)?.client?.name}
          amount={state.deals.find((d) => d.id === feeDealId)?.fee?.amount}
          asOf={META.as_of}
          onClose={() => setFeeDealId(null)}
          onSave={(paidDate) => dispatch({ type: 'MARK_FEE_PAID', dealId: feeDealId, paidDate })}
        />
      )}
    </>
  )
}

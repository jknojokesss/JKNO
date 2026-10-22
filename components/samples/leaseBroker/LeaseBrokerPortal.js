import { useEffect, useReducer, useState } from 'react'
import SampleJkLogoLink from '../SampleJkLogoLink'
import DATA from '../../../data/lease-broker-crm.json'
import { initLeaseBrokerState, leaseBrokerReducer } from './leaseBrokerReducer'
import { SHELL_CSS } from './leaseBrokerUtils'
import { TAB_ICONS } from './LeaseBrokerTabIcons'
import LeaseBrokerHome from './LeaseBrokerHome'
import LeaseBrokerBoard from './LeaseBrokerBoard'
import LeaseBrokerDeal from './LeaseBrokerDeal'
import LeaseBrokerFees from './LeaseBrokerFees'
import LeaseBrokerDealers from './LeaseBrokerDealers'
import LeaseBrokerReferrals from './LeaseBrokerReferrals'
import { AddDealModal, AddQuoteModal, AddDealerModal, MarkFeePaidModal } from './LeaseBrokerModals'

const BIZ = DATA.brand.name
const META = DATA.meta
const SAMPLE_HEADER = 'Sample — fictitious numbers'

const TABS = [
  ['home', 'Home'],
  ['board', 'Board'],
  ['fees', 'Fees'],
  ['dealers', 'Dealers'],
  ['referrals', 'Referrals'],
]

const PAGE_TITLES = {
  home: 'Home',
  board: 'Board',
  fees: 'Fees',
  dealers: 'Dealers',
  referrals: 'Referrals',
}

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
    tab === 'deal' && deal ? deal.client.name : PAGE_TITLES[tab] || 'Home'

  const startNewDealFromLease = (d) => {
    setPrefill({
      client: { ...d.client },
      vehicle: { make: '', model: '', trim: '', miles_per_year: 10000, term_months: 36, down: 0 },
      referrerId: d.referrer_id || state.referrers[0]?.id,
    })
    setModal('addDeal')
  }

  const navActive = (id) => tab === id || (tab === 'deal' && id === 'board')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />
      <SampleJkLogoLink />

      <div className="lb-shell">
        <aside className="lb-side lb-side--desktop">
          <button type="button" className="lb-brand" onClick={() => goTab('home')}>{BIZ}</button>
          <nav className="lb-nav" aria-label="Sections">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`lb-navbtn${navActive(id) ? ' lb-navbtn--active' : ''}`}
                onClick={() => goTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="lb-side-add">
            <button type="button" className="lb-btn lb-btn--primary" style={{ width: '100%' }} onClick={() => setModal('addDeal')}>
              Add deal
            </button>
          </div>
        </aside>

        <header className="lb-mobile-top">
          <button type="button" className="lb-brand" onClick={() => goTab('home')}>{BIZ}</button>
          <button type="button" className="lb-btn lb-btn--primary" onClick={() => setModal('addDeal')}>Add deal</button>
        </header>

        <main className="lb-main">
          <div className="lb-page-head">
            <h1 className="lb-page-title">{currentLabel}</h1>
            <div className="lb-sample-line">{SAMPLE_HEADER}</div>
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

        {narrowNav ? (
          <nav className="lb-tabbar lb-nav" aria-label="Sections">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`lb-navbtn${navActive(id) ? ' lb-navbtn--active' : ''}`}
                onClick={() => goTab(id)}
              >
                {TAB_ICONS[id]}
                <span className="lb-tab-label">{label}</span>
              </button>
            ))}
          </nav>
        ) : null}
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

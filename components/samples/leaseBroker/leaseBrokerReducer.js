import { cloneInitialState, nextDealId, nextDealerId, nextQuoteId } from './leaseBrokerModel'
import DATA from '../../../data/lease-broker-crm.json'

export function initLeaseBrokerState() {
  return cloneInitialState()
}

export function leaseBrokerReducer(state, action) {
  switch (action.type) {
    case 'MOVE_DEAL': {
      const { dealId, stage } = action
      return {
        ...state,
        deals: state.deals.map((d) => (d.id === dealId ? { ...d, stage } : d)),
      }
    }
    case 'MARK_FEE_PAID': {
      const { dealId, paidDate } = action
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === dealId
            ? {
                ...d,
                fee: { ...d.fee, paid: true, paid_date: paidDate },
                stage: d.stage === 'delivered' ? 'fee_paid' : d.stage,
              }
            : d
        ),
      }
    }
    case 'PICK_WINNER': {
      const { dealId, quoteId } = action
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === dealId
            ? {
                ...d,
                quotes: d.quotes.map((q) => ({ ...q, winner: q.id === quoteId })),
              }
            : d
        ),
      }
    }
    case 'ADD_DEAL': {
      const { client, vehicle, referrerId } = action
      const id = nextDealId(state.deals)
      const feeDefault = DATA.meta.broker_fee_default || 895
      const deal = {
        id,
        stage: 'lead',
        client: { name: client.name.trim(), phone: client.phone.trim(), email: (client.email || '').trim() },
        referrer_id: referrerId || null,
        vehicle: {
          make: vehicle.make.trim(),
          model: vehicle.model.trim(),
          trim: (vehicle.trim || '').trim(),
          miles_per_year: Number(vehicle.miles_per_year) || 10000,
          term_months: Number(vehicle.term_months) || 36,
          down: Number(vehicle.down) || 0,
        },
        fee: { amount: feeDefault, paid: false, paid_date: null },
        lease_end: null,
        delivered_date: null,
        quotes: [],
        notes: '',
      }
      return { ...state, deals: [...state.deals, deal] }
    }
    case 'ADD_QUOTE': {
      const { dealId, quote } = action
      const qd = quote.quote_date
      return {
        ...state,
        deals: state.deals.map((d) => {
          if (d.id !== dealId) return d
          const id = nextQuoteId(d)
          const row = {
            id,
            dealer_id: quote.dealer_id,
            monthly: Number(quote.monthly),
            due_at_signing: Number(quote.due_at_signing),
            money_factor: Number(quote.money_factor),
            residual_pct: Number(quote.residual_pct),
            rebates: Number(quote.rebates) || 0,
            quote_date: qd,
            winner: d.quotes.length === 0,
          }
          return { ...d, quotes: [...d.quotes, row], stage: d.stage === 'lead' ? 'quoted' : d.stage }
        }),
        dealers: state.dealers.map((dl) => {
          if (dl.id !== quote.dealer_id) return dl
          return qd > (dl.last_quote_date || '') ? { ...dl, last_quote_date: qd } : dl
        }),
      }
    }
    case 'ADD_DEALER': {
      const { name, salesperson, phone, brands } = action
      const dealer = {
        id: nextDealerId(state.dealers),
        name: name.trim(),
        salesperson: salesperson.trim(),
        phone: phone.trim(),
        brands: brands.map((b) => b.trim()).filter(Boolean),
        last_quote_date: null,
        deals_closed: 0,
      }
      return { ...state, dealers: [...state.dealers, dealer] }
    }
    default:
      return state
  }
}

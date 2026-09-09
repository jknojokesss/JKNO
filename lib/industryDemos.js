// Industry demo registry (split for deploy; merged at runtime)
import { INDUSTRIES_A_1 } from './industryDemos-a1'
import { INDUSTRIES_A_2 } from './industryDemos-a2'
import { INDUSTRIES_B_1 } from './industryDemos-b1'
import { INDUSTRIES_B_2 } from './industryDemos-b2'

export const INDUSTRIES = [...INDUSTRIES_A_1, ...INDUSTRIES_A_2, ...INDUSTRIES_B_1, ...INDUSTRIES_B_2]

// Live bespoke demos that already exist as standalone pages.
export const EXISTING_DEMOS = [
  { href: '/ashford-trading', biz: 'Ashford Trading', industry: 'Wholesale Trading', emoji: '', blurb: 'Import POs, landed cost, invoices, and P&L on one trading desk.' },
  { href: '/riverside-tires', biz: 'Riverside Tires', industry: 'Tires & Auto Service', emoji: '', blurb: 'Items + services — tire sales, service tickets, and shop profit live.' },
  { href: '/riverfall-gowns', biz: 'Riverfall Gowns', industry: 'Gowns & Bridal Retail', emoji: '', blurb: 'Order tracking — every gown from order to pickup, deposits and balances.' },
  { href: '/riverstone-roofing', biz: 'Riverstone Roofing', industry: 'Commercial Roofing', emoji: '', blurb: 'Job margin flags, WIP schedule, claim-aware cash flow — and a buyer package.' },
  { href: '/demo', biz: 'Riverside Bakery', industry: 'Bakery & Café', emoji: '', blurb: 'Daily sales, food cost, and profit for a bakery café.' },
  { href: '/appliance-repair', biz: 'YT Appliance Repair', industry: 'Appliance Repair', emoji: '', blurb: 'Live job board — log parts and labor, watch profit per job update.' },
  { href: '/sba-lending', biz: 'Riverbank Funding', industry: 'Business Lending', emoji: '', blurb: 'Loan pipeline — leads to disbursed deals to fees, one screen.' },
  { href: '/riverbend-fence', biz: 'Riverbend Fence Co.', industry: 'Fencing & Trade Contracting', emoji: '', blurb: 'The crew logs a day from a phone — coded to the job in QuickBooks.' },
  { href: '/ar-desk', biz: 'Lakeland Supply Co.', industry: 'QuickBooks AR & Statements', emoji: '', blurb: 'Reads QuickBooks, sends every statement in one pass — from your own email.' },
]

export const ALL_DEMOS = [
  ...EXISTING_DEMOS,
  ...INDUSTRIES.map((c) => ({ href: `/demos/${c.slug}`, biz: c.biz, industry: c.industry, emoji: c.emoji, blurb: c.blurb })),
]

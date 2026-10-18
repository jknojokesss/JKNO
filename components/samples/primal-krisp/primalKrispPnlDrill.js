/** Deterministic P&L drill transaction lists — sums must match line amounts to the cent. */

export function round2(n) {
  return Math.round(n * 100) / 100
}

function fnv1a(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function daysInMonth(ym) {
  const [y, mo] = ym.split('-').map(Number)
  return new Date(y, mo, 0).getDate()
}

function formatDrillDate(ym, day) {
  const [y, mo] = ym.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, mo - 1, day, 12)))
}

function sortDate(ym, day) {
  return `${ym}-${String(day).padStart(2, '0')}`
}

function pickDays(ym, n, seed) {
  const dim = daysInMonth(ym)
  const days = []
  let s = seed
  for (let i = 0; i < n; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    days.push(1 + (s % dim))
  }
  return days.sort((a, b) => a - b)
}

function splitAmountExact(total, n, seed) {
  const totalCents = Math.round(total * 100)
  if (n <= 0) return []
  if (totalCents === 0) return Array(n).fill(0)
  if (n === 1) return [round2(total)]
  const weights = []
  for (let i = 0; i < n; i++) {
    weights.push(1 + ((seed + i * 9973) % 40))
  }
  const wsum = weights.reduce((a, b) => a + b, 0)
  const cents = []
  let allocated = 0
  for (let i = 0; i < n - 1; i++) {
    const c = Math.floor((totalCents * weights[i]) / wsum)
    cents.push(c)
    allocated += c
  }
  cents.push(totalCents - allocated)
  return cents.map((c) => round2(c / 100))
}

function rowCount(amount, seed) {
  let n = 5 + (seed % 11)
  if (amount >= 8000) n = Math.max(n, 14)
  else if (amount >= 4000) n = Math.max(n, 11)
  else if (amount >= 2000) n = Math.max(n, 8)
  return Math.min(15, Math.max(5, n))
}

const REV_WEB = [
  'Shopify payout',
  'Shopify order batch',
  'Amazon order batch',
  'Website promo orders',
  'Gift box orders',
  'Subscribe and save renewals',
  'One-time checkout',
  'Corporate web order',
  'Wholesale web portal',
  'Refund offset (net)',
  'Shipping upgrades',
  'Loyalty redemption',
  'Flash sale batch',
  'Email campaign orders',
  'Influencer code orders',
]
const REV_SUB = [
  'Subscription renewal batch',
  'Subscribe and save shipment',
  'Skipped month catch-up',
  'Annual plan renewal',
  'Quarterly refill',
  'New subscriber welcome kits',
  'Flavor swap shipment',
  'Failed payment retry batch',
  'Gift subscription start',
  'Corporate sub seats',
  'Pause resume shipment',
  'Add-on bag shipment',
  'Referral reward shipment',
  'Bundle upgrade',
  'Holiday sub promo',
]
const REV_STORES = [
  'Whole Foods invoice 1042',
  'Seasons Market invoice 881',
  'Gourmet Glatt remittance',
  'Kesher Foods invoice 1190',
  'Store demo restock',
  'Consignment settlement',
  'Open invoice payment',
  'Chain PO 4421',
  'Independent grocer batch',
  'Distributor pickup',
  'Credit memo offset',
  'New door placement',
  'Endcap restock',
  'Regional chain check',
  'Co-op payout',
]
const REV_WHOLE = [
  'Bulk case order 88 ct',
  'Food service PO 7712',
  'Distributor pallet',
  'Corporate gifting 200 bags',
  'Wholesale refill',
  'Broker commission net',
  'Trade show follow-up PO',
  'Private label trial',
  'Airport kiosk supplier',
  'Camp order',
  'Caterer bulk',
  'Office snack program',
  'Reseller reorder',
  'Export sample conversion',
  'Volume tier true-up',
]
const REV_TASTE = [
  'Tasting booth sales',
  'Event cash sales',
  'Sample-to-sale conversion',
  'Farmers market day',
  'Synagogue event table',
  'Sports venue pop-up',
  'Festival booth',
  'In-store demo sales',
  'Charity walk table',
  'Community fair',
  'Retail demo day',
  'Partner event split',
  'Coupon redemptions at event',
  'POS terminal batch',
  'Event supply true-up',
]

const COGS_TEMPLATES = [
  'Brisket trim purchase',
  'Chicken breast lot',
  'Spice blend lot',
  'Co-packer run',
  'Packaging film roll',
  'Case goods receipt',
  'Freight-in allocation',
  'Yield adjustment batch',
  'QC hold release',
  'Rework batch',
  'Organic cert lot fee',
  'Cold storage pull',
  'Production variance true-up',
  'Ingredient price true-up',
  'Month-end inventory relief',
]

const OPEX_SHIP = [
  'ShipBob - labels',
  'USPS postage',
  'UPS weekly invoice',
  'FedEx pickup',
  'DHL international',
  'Packaging supplies',
  'Ice packs',
  'Fulfillment pick fees',
  'Returns processing',
  'Zone 8 surcharge',
  'Dimensional weight adj',
  'Saturday delivery',
  'Address correction fees',
  'Insurance on outbound',
  '3PL storage move',
]
const OPEX_FEES = [
  'Shopify payout fee',
  'Stripe processing',
  'PayPal settlement fee',
  'Amazon Pay fee',
  'Chargeback reserve',
  'Card network assessment',
  'Subscription app fee',
  'Buy-now-pay-later fee',
  'Currency conversion',
  'Payout timing fee',
  'Dispute fee',
  'ACH return fee',
  'Gateway monthly',
  'Fraud filter tool',
  'Statement fee',
]
const OPEX_ADS = [
  'Meta ads',
  'Google Shopping',
  'TikTok creator spend',
  'Influencer invoice',
  'Podcast sponsorship',
  'Email platform ads',
  'Retargeting batch',
  'Amazon ads',
  'Coupon site placement',
  'Billboard mock test',
  'Affiliate payout',
  'Creative studio',
  'UGC licensing',
  'PR wire',
  'Sampling ads',
]
const OPEX_DISC = [
  'Promo code discount',
  'Free bag giveaway',
  'Bundle markdown',
  'Loyalty points redemption',
  'Wholesale markdown',
  'Damaged goods credit',
  'Price match adjustment',
  'Influencer code',
  'Cart abandon offer',
  'Referral credit',
  'Subscription intro offer',
  'Trade show coupon',
  'Employee sample cost',
  'Charity donation bags',
  'B2B volume rebate',
]
const OPEX_TASTE = [
  'Event staffing',
  'Sample bags',
  'Booth rental share',
  'Tasting tent supplies',
  'POS terminal rental',
  'Permit fee',
  'Ice and coolers',
  'Travel mileage',
  'Demo product',
  'Signage print',
  'Gift with purchase',
  'Event insurance day',
  'Parking voucher',
  'Cleanup fee',
  'Partner split',
]
const OPEX_PAY = [
  'Payroll - Sep 1 run',
  'Payroll - Sep 15 run',
  'Payroll - Sep 29 run',
  'Contractor - production',
  'Contractor - sales',
  'Bonus accrual',
  'Payroll tax remit',
  '401k match',
  'Health stipend',
  'Overtime production',
  'Temp labor event',
  'Commission payout',
  'Severance accrual',
  'Payroll adjustment',
  'Benefits admin fee',
]
const OPEX_RENT = [
  'Warehouse rent',
  'Cold storage rent',
  'Office share',
  'Pallet storage',
  'Co-packer slot fee',
  'Equipment lease',
  'Parking pass',
  'Utilities allocation',
  'CAM charges',
  'Security deposit top-up',
  'Trash service',
  'Internet circuit',
  'Forklift lease',
  'Insurance rider',
  'Property tax share',
]
const OPEX_INS = [
  'Product liability premium',
  'Kosher supervision fee',
  'Annual audit retainer',
  'GL insurance installment',
  'Workers comp',
  'Umbrella policy',
  'Certification renewal',
  'Lab testing retainer',
  'Recall insurance',
  'Broker fee',
  'State filing',
  'Trademark maintenance',
  'Food safety consult',
  'Kashrus letter fee',
  'Compliance training',
]
const OPEX_SOFT = [
  'Shopify apps',
  'Subscription platform',
  'QuickBooks',
  'Google Workspace',
  'Slack',
  'Notion',
  'Klaviyo',
  'ShipStation',
  'Inventory app',
  'Payroll software',
  'Password manager',
  'Analytics tool',
  'Helpdesk',
  'Backup service',
  'API usage overage',
]

function descriptionPool(ledgerKey) {
  if (ledgerKey === 'rev_Website') return REV_WEB
  if (ledgerKey === 'rev_Subscriptions') return REV_SUB
  if (ledgerKey === 'rev_Stores') return REV_STORES
  if (ledgerKey === 'rev_Wholesale & bulk') return REV_WHOLE
  if (ledgerKey === 'rev_Tastings & events') return REV_TASTE
  if (ledgerKey.startsWith('cogs_')) return COGS_TEMPLATES
  if (ledgerKey === 'opex_Shipping & packing') return OPEX_SHIP
  if (ledgerKey === 'opex_Card & Shopify fees') return OPEX_FEES
  if (ledgerKey === 'opex_Ads & creators') return OPEX_ADS
  if (ledgerKey === 'opex_Discounts & free bags (promo cost)') return OPEX_DISC
  if (ledgerKey === 'opex_Tastings (samples + staff)') return OPEX_TASTE
  if (ledgerKey === 'opex_Payroll') return OPEX_PAY
  if (ledgerKey === 'opex_Rent & storage') return OPEX_RENT
  if (ledgerKey === 'opex_Insurance & kosher fees') return OPEX_INS
  if (ledgerKey === 'opex_Software (store, subscriptions, other)') return OPEX_SOFT
  return ['Transaction']
}

function monthShort(ym) {
  const [y, mo] = ym.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, mo - 1, 1)))
}

function pickDescriptions(pool, n, seed, monthYm) {
  const mon = monthShort(monthYm)
  const out = []
  for (let i = 0; i < n; i++) {
    const idx = (seed + i * 31) % pool.length
    let desc = pool[idx]
    if (desc.includes('Sep ')) desc = desc.replace(/Sep /g, `${mon} `)
    if (out.includes(desc) && pool.length > n) {
      desc = pool[(idx + 7) % pool.length]
      if (desc.includes('Sep ')) desc = desc.replace(/Sep /g, `${mon} `)
    }
    out.push(desc)
  }
  return out
}

export function lineAmountForLedgerKey(month, ledgerKey) {
  if (ledgerKey.startsWith('rev_')) {
    const ch = ledgerKey.slice(4)
    return month.revenue?.[ch] ?? 0
  }
  if (ledgerKey.startsWith('cogs_')) {
    const name = ledgerKey.slice(5)
    return month.cogs_entries?.find((e) => e.l === name)?.n ?? 0
  }
  if (ledgerKey.startsWith('opex_')) {
    const name = ledgerKey.slice(5)
    return month.operating_expenses_entries?.find((e) => e.l === name)?.n ?? 0
  }
  return null
}

export function isExpandedDrillKey(ledgerKey) {
  return ledgerKey.startsWith('rev_') || ledgerKey.startsWith('cogs_') || ledgerKey.startsWith('opex_')
}

export function buildDrillTransactions(monthYm, ledgerKey, lineTotal) {
  const seed = fnv1a(`${monthYm}|${ledgerKey}|${round2(lineTotal)}`)
  const n = rowCount(lineTotal, seed)
  const pool = descriptionPool(ledgerKey)
  const descriptions = pickDescriptions(pool, n, seed, monthYm)
  const days = pickDays(monthYm, n, seed ^ 0x9e3779b9)
  const amounts = splitAmountExact(lineTotal, n, seed ^ 0x85ebca6b)
  const product = ledgerKey.startsWith('cogs_') ? ledgerKey.slice(5) : null

  return amounts.map((amount, i) => {
    const day = days[i]
    let description = descriptions[i]
    if (product) description = `${description} · ${product}`
    return {
      id: `${monthYm}-${ledgerKey}-${i}`,
      date: formatDrillDate(monthYm, day),
      sortDate: sortDate(monthYm, day),
      description,
      amount,
    }
  })
}

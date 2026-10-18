/**
 * Primal Krisp — Due to reorder feature totals.
 * Run: node scripts/check-primal-krisp-feature.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const GLYPH_RE = /[✓✔↓↑▲▼▶]/
import {
  getDueToReorderStores,
  daysBetween,
  lineItemsTotal,
  salesSeptForStore,
  topStoreNames,
  septOrderAmountInHistory,
  storeWholesalePrice,
  reorderAsOf,
  round2,
} from '../components/samples/primal-krisp/primalKrispReorderData.js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DATA = JSON.parse(fs.readFileSync(path.join(root, 'data/primal-krisp.json'), 'utf8'))
const PK_REORDER_AS_OF = reorderAsOf(DATA)

const failures = []
const ok = (label, cond) => {
  if (!cond) failures.push(label)
  return cond
}

const due = getDueToReorderStores(DATA)
ok('count 6-8', due.length >= 6 && due.length <= 8)
ok('overview card count', due.length === DATA.overview.due_to_reorder_count)

for (let i = 1; i < due.length; i++) {
  ok(`sort days_over ${due[i - 1].store_name}`, due[i - 1].days_over >= due[i].days_over)
}

const storeNames = new Set(DATA.stores.list.map((s) => s.name))
for (const st of due) {
  ok(`store exists ${st.store_name}`, storeNames.has(st.store_name))
  const ago = daysBetween(st.last_order_date, PK_REORDER_AS_OF)
  ok(`days ago ${st.store_name}`, ago === st.last_order_days_ago)
  ok(`past gap ${st.store_name}`, st.last_order_days_ago > st.usual_gap_days)
  ok(`days_over ${st.store_name}`, st.days_over === st.last_order_days_ago - st.usual_gap_days)

  const linesSum = lineItemsTotal(st.usual_order_lines)
  ok(`usual lines ${st.store_name}`, round2(linesSum) === round2(st.usual_order.amount))

  for (const ln of st.usual_order_lines) {
    const expected = round2(ln.bags * ln.unit_price)
    ok(`line math ${st.store_name} ${ln.flavor}`, round2(ln.line_total) === expected)
    const catalog = storeWholesalePrice(ln.flavor, DATA)
    const storeRow = DATA.stores.list.find((s) => s.name === st.store_name)
    const storeBag = storeRow?.sample?.price_per_bag
    if (catalog != null && Math.abs(ln.unit_price - catalog) > 0.02 && Math.abs(ln.unit_price - storeBag) > 0.02) {
      ok(`wholesale price ${st.store_name} ${ln.flavor}`, false)
    }
  }

  for (const o of st.order_history) {
    ok(
      `history bags ${st.store_name} ${o.date}`,
      o.bags > 0 && o.bags <= o.cases * DATA.due_to_reorder.bags_per_case,
    )
  }

  const top = topStoreNames(DATA)
  if (top.includes(st.store_name)) {
    const sales = salesSeptForStore(st.store_name, DATA)
    const septAmt = septOrderAmountInHistory(st)
    ok(`sept sales tie ${st.store_name}`, sales != null && round2(septAmt) === round2(sales))
  }
}

const portalPath = path.join(root, 'components/samples/PrimalKrispPortal.js')
const portalSrc = fs.readFileSync(portalPath, 'utf8')
const utilsPath = path.join(root, 'components/samples/primalKrispUtils.js')
const utilsSrc = fs.readFileSync(utilsPath, 'utf8')
ok('no verdictPromo helper', !/verdictPromo/.test(utilsSrc))
ok('advertising table no Keep Watch Cut', !/\bKeep\b|\bWatch\b|\bCut\b/.test(portalSrc))
ok('promo ads narrow layout CSS', /@media\(max-width:390px\)/.test(portalSrc) && /\.pk-promo-table/.test(portalSrc) && /\.pk-promo-return-head/.test(portalSrc))
ok('financials net profit green when positive', /k="Net profit"[^>]*accent=\{cur\.net_profit >= 0 \? GREEN : RED\}/.test(fs.readFileSync(path.join(root, 'components/samples/PrimalKrispFinancials.js'), 'utf8')))
ok('subscription sales not spice accent', !/k="Subscription sales"[\s\S]{0,120}accent=\{SPICE\}/.test(portalSrc))
ok('products table no stray Cost cell', !/>\s*Cost\s*<\/button>/.test(portalSrc))
ok('list controls component', fs.existsSync(path.join(root, 'components/samples/primal-krisp/PrimalKrispListControls.js')))
ok('list controls sort labels', /Date \(newest\)/.test(portalSrc) && /Deposit amount \(largest\)/.test(fs.readFileSync(path.join(root, 'components/samples/primal-krisp/PrimalKrispDepositsTab.js'), 'utf8')))
ok('list controls no glyph sort', !/[↑↓▲▼▶✓✔]/.test(fs.readFileSync(path.join(root, 'components/samples/primal-krisp/PrimalKrispListControls.js'), 'utf8')))
ok('sidebar stretch full page', /align-self:stretch/.test(utilsSrc))
ok('logo goes overview', /goOverviewHome/.test(portalSrc) && /onClick=\{goOverviewHome\}/.test(portalSrc))
const pageSrc = fs.readFileSync(path.join(root, 'pages/primal-krisp.js'), 'utf8')
ok('og:image primal-krisp', /property="og:image"/.test(pageSrc) && /samples\/primal-krisp\/og-image\.png/.test(pageSrc))
ok('og image file', fs.existsSync(path.join(root, 'public/samples/primal-krisp/og-image.png')))
ok('promo ads card no narrow scroll', /\.pk-promo-card\{overflow-x:visible!important/.test(portalSrc))
ok('nav phone grid at 860', /\.pk-nav--phone-grid[^}]*grid-template-columns:repeat\(4,1fr\)/.test(utilsSrc))
ok('nav phone grid no horizontal scroll', /\.pk-nav--phone-grid[^}]*overflow-x:hidden/.test(utilsSrc))
ok('nav unified at narrow width', /pk-nav--phone-grid/.test(portalSrc) && /\[\.\.\.TABS, \.\.\.EXTRA\]/.test(portalSrc))
ok('nav short labels at 860', /narrowNav \?/.test(portalSrc) && /const navLabel = shortLabel/.test(portalSrc))
ok('table total detail kind', /kind === 'tableTotal'/.test(fs.readFileSync(path.join(root, 'components/samples/PrimalKrispOverviewDetail.js'), 'utf8')))
ok('deposits table total opens breakdown', /kind: 'tableTotal'/.test(fs.readFileSync(path.join(root, 'components/samples/primal-krisp/PrimalKrispDepositsTab.js'), 'utf8')))
ok('stores aging total tappable', /tableName: 'AR aging/.test(fs.readFileSync(path.join(root, 'components/samples/PrimalKrispStoresTab.js'), 'utf8')))
ok('ranked bars total row', /onTotalClick/.test(portalSrc))

const chartsSrc = fs.readFileSync(path.join(root, 'components/samples/PrimalKrispCharts.js'), 'utf8')
ok('subscriber chart single series', /SubscriberLineChart/.test(chartsSrc) && !/Cancelled/.test(chartsSrc.split('export function SubscriberLineChart')[1]?.split('export function RenewalBars14')[0] || ''))
ok('subscriber chart no min width scroll', !/SubscriberLineChart[\s\S]*minWidth:\s*'520px'/.test(chartsSrc))

const mc = DATA.monthly_close
const srcSum = round2((mc.september_sales_sources || []).reduce((s, r) => s + r.amount, 0))
ok('month end tab label', /'Month end'/.test(portalSrc))
ok('month end no journal ui', !/Journal entry/.test(portalSrc) && !/\bDr\b/.test(portalSrc) && !/\bCr\b/.test(portalSrc))
ok('month end no to post copy', !/to post/i.test(portalSrc))
ok('month end section 1 total', mc.total_sales === 55530.64 && srcSum === mc.total_sales)
ok('month end ties overview sales', round2(DATA.overview.sales_this_month) === mc.total_sales)
ok('month end gross profit', round2(mc.total_sales - mc.cost_of_goods) === round2(mc.gross_profit))
ok('month end detail handlers', /monthEndSalesTotal/.test(fs.readFileSync(path.join(root, 'components/samples/PrimalKrispOverviewDetail.js'), 'utf8')))

for (const p of DATA.promo_codes) {
  ok(`promo no call field ${p.code}`, p.call === undefined)
}

const pkFiles = [
  path.join(root, 'pages/primal-krisp.js'),
  path.join(root, 'data/primal-krisp.json'),
  ...fs
    .readdirSync(path.join(root, 'components/samples'))
    .filter((f) => f.startsWith('PrimalKrisp') || f.startsWith('primalKrisp'))
    .map((f) => path.join(root, 'components/samples', f)),
  ...fs.readdirSync(path.join(root, 'components/samples/primal-krisp')).map((f) =>
    path.join(root, 'components/samples/primal-krisp', f),
  ),
]
for (const file of pkFiles) {
  if (!fs.existsSync(file) || file.endsWith('.png')) continue
  const text = fs.readFileSync(file, 'utf8')
  const stripped = text.replace(/←/g, '').replace(/›/g, '')
  ok(`no icon glyphs in ${path.relative(root, file)}`, !GLYPH_RE.test(stripped))
}

console.log('primal-krisp due to reorder', {
  as_of: PK_REORDER_AS_OF,
  count: due.length,
  stores: due.map((s) => s.store_name),
})

if (failures.length) {
  console.error('FAILURES:', failures)
  process.exit(1)
}
console.log('OK — all checks passed')

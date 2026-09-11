// ── What we build, as the website tells it ───────────────────────────────
// Shared so the homepage and /what-we-do cannot drift apart: the homepage
// shows the three headings and the item names only (it got too long to
// scroll once every item carried its description), and /what-we-do renders
// the same rows in full with their tags.
//
// `tag` is an internal note, not rendered anywhere. It was a LIVE/DEMO badge
// on the page, which amounted to advertising which features were only demos.

export const BUILD_STACK = [
  {
    kicker: 'THE PIPES',
    title: 'Integrations we wrote ourselves',
    blurb: 'Not Zapier, not a $99/mo connector. Real API work against the systems you already run, on a nightly schedule that just works.',
    items: [
      { t: 'QuickBooks Online — both directions', d: 'Nightly pull of your P&L, balance sheet, and full general-ledger detail. Month-end journal entries pushed back in.', tag: 'LIVE' },
      { t: 'POS registers', d: 'Every ticket and line item synced each night — items, sizes, and mix your register never sends to QuickBooks on its own.', tag: 'LIVE' },
      { t: 'Distributor & vendor portals', d: 'One click on your supplier\u2019s site pulls unit cost and PO number into your books. Stock orders vs. same-day jobs classified automatically.', tag: 'LIVE' },
      { t: 'Bank & card activity', d: 'Classified against your chart of accounts — operating vs. loans vs. owner\u2019s personal, so the P&L means something.', tag: 'LIVE' },
      { t: 'Invoice email & payment links', d: 'Statements and invoices go out from your address, with card or bank checkout when you want them.', tag: 'LIVE' },
    ],
  },
  {
    kicker: 'THE DASHBOARD',
    title: 'Built for one business: yours',
    blurb: 'No template, no settings screen you have to learn. We build the views your business is actually run on.',
    items: [
      { t: 'Profit per ticket, job, or order', d: 'Revenue, cost, and margin on every sale — matched back to what you actually paid for that item or that day\u2019s work.', tag: 'LIVE' },
      { t: 'Inventory that ties out', d: 'Dated purchase layers, FIFO relief, and a month-end COGS entry ready to post. The dollars reconcile to QuickBooks.', tag: 'LIVE' },
      { t: 'Financials vs. QuickBooks', d: 'Your portal and the official QBO statement on the same screen. If they don\u2019t match, you see it — not a surprise at tax time.', tag: 'LIVE' },
      { t: 'Your own login', d: 'Scoped on the server to exactly one company. A portal user can never name — or see — anybody else\u2019s books.', tag: 'LIVE' },
      { t: 'Ask it a question', d: 'Plain English in, a real answer out — computed from your own numbers, not guessed at by a chatbot.', tag: 'LIVE' },
    ],
  },
  {
    kicker: 'FOR YOUR BUSINESS',
    title: 'Different trades, same engine',
    blurb: 'The first version of each of these was built for one owner\u2019s specific headache. Once it works, we wire it for the next business that needs it.',
    items: [
      { t: 'Property management', d: 'Rent roll, delinquency with next steps, and owner statements ready on the 1st — every door in the portfolio.', tag: 'DEMO', href: '/harborfield-properties' },
      { t: 'Import & distribution', d: 'PO pipeline from factory to shelf — freight, duty, and brokerage rolled into landed cost before goods hit inventory.', tag: 'DEMO', href: '/northline-global' },
      { t: 'Wholesale & route accounts', d: 'Create an invoice per store, email the PDF, mark paid, and keep QuickBooks in sync — without re-keying.', tag: 'DEMO', href: '/demos/wholesale' },
      { t: 'Custom order retail', d: 'Deposits, alterations, pickup dates, and balances on every order — owner and floor staff on different screens, same data.', tag: 'DEMO', href: '/riverfall-gowns' },
      { t: 'Field crew log', d: 'The crew logs a day from a phone in ten seconds — and it lands in QuickBooks already coded to the job.', tag: 'DEMO', href: '/riverbend-fence' },
      { t: 'Commercial job margin & WIP', d: 'Over/under billing, retainage, and variance flags while the job is still open — not after the fact.', tag: 'DEMO', href: '/riverstone-roofing' },
      { t: 'Repair shop job board', d: 'Open tickets, parts, labor, and profit per RO updating as the day moves.', tag: 'DEMO', href: '/appliance-repair' },
      { t: 'Lending & deal pipeline', d: 'Leads through disbursed deals to fees earned — one screen for the book of business.', tag: 'DEMO', href: '/sba-lending' },
    ],
  },
  {
    kicker: 'CLOSE & COLLECT',
    title: 'Books that stay current',
    blurb: 'We don\u2019t just build the portal — we keep the pipe running and the month tied out.',
    items: [
      { t: 'Month-end inventory JE', d: 'Movement method COGS computed from your layers, drafted as a journal entry for you to review and post.', tag: 'LIVE' },
      { t: 'AR desk', d: 'Reads open invoices out of QuickBooks and sends every statement in one pass, from your own email address.', tag: 'LIVE', href: '/ar-desk' },
      { t: 'Client AR portal', d: 'Your customer-service team logs in, sees only your company\u2019s receivables, and sends statements without touching admin tools.', tag: 'LIVE' },
      { t: 'Buyer package & cash flow', d: 'Normalized EBITDA with add-backs, 13-week cash with retainage and slow claims in their own column — print-ready.', tag: 'DEMO', href: '/riverstone-roofing' },
    ],
  },
]

// Short labels for the homepage “who we build for” strip — no client names.
export const BUSINESS_TYPES = [
  { label: 'Shops with a register', detail: 'Tires, auto, food — ticket matched to what you paid the vendor' },
  { label: 'Contractors & trades', detail: 'Job cost from the field, WIP, retainage' },
  { label: 'Wholesale & distribution', detail: 'Store invoices, pricing, QuickBooks sync' },
  { label: 'Custom-order retail', detail: 'Deposits, alterations, multi-role workflow' },
  { label: 'Brokers & lenders', detail: 'Pipeline, fees, portfolio on one screen' },
  { label: 'Anyone on QuickBooks', detail: 'Who needs one honest screen instead of ten reports' },
]

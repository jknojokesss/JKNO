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
    icon: '◉',
    kicker: 'THE PIPES',
    title: 'Integrations we wrote ourselves',
    blurb: 'Not Zapier, not a $99/mo connector. Real API work against the systems you already run, on a nightly schedule that just works.',
    items: [
      { t: 'QuickBooks Online — both directions', d: 'Nightly pull of your P&L, balance sheet, and full general-ledger detail. Month-end journal entries pushed back in.', tag: 'LIVE' },
      { t: 'Clover POS', d: 'Every ticket and every line item synced each night — items, sizes, and mix your POS never sends to QuickBooks.', tag: 'LIVE' },
      { t: 'Vendor invoice import', d: 'One click on your supplier\u2019s own portal pulls unit cost and PO number into your books. No re-keying invoices.', tag: 'LIVE' },
      { t: 'Bank & card activity', d: 'Classified against your chart of accounts — operating vs. loans vs. owner\u2019s personal, so the P&L means something.', tag: 'LIVE' },
    ],
  },
  {
    icon: '▣',
    kicker: 'THE DASHBOARD',
    title: 'Built for one business: yours',
    blurb: 'No template, no settings screen you have to learn. We build the views your business is actually run on.',
    items: [
      { t: 'Profit per order', d: 'Revenue, cost, and margin on every single ticket — matched back to what you paid your vendor for that exact item.', tag: 'LIVE' },
      { t: 'Inventory that ties out', d: 'Dated purchase layers, FIFO relief, and a month-end COGS entry ready to post. The dollars reconcile to QuickBooks.', tag: 'LIVE' },
      { t: 'Your own login', d: 'Scoped on the server to exactly one company. A portal user can never name — or see — anybody else\u2019s books.', tag: 'LIVE' },
      { t: 'Ask it a question', d: 'Plain English in, a real answer out — computed from your own numbers, not guessed at by a chatbot.', tag: 'LIVE' },
    ],
  },
  {
    icon: '⬡',
    kicker: 'IDEAS FROM THE FIELD',
    title: 'Built for one client. Now available to any.',
    blurb: 'The best features here started as one owner\u2019s specific headache. Once it is built, everybody gets to use it.',
    items: [
      { t: 'AR desk', d: 'Reads your open invoices out of QuickBooks and sends every statement in one pass, from your own email address.', tag: 'LIVE', href: '/ar-desk' },
      { t: 'Ten-second crew log', d: 'The field logs a day from a phone — and it lands in QuickBooks already coded to the job.', tag: 'DEMO', href: '/quefence' },
      { t: 'WIP schedule & buyer package', d: 'Over/under billing, retainage, normalized EBITDA with add-backs — print-ready for a lender or a buyer.', tag: 'DEMO', href: '/srl' },
      { t: '13-week cash flow', d: 'What is actually landing in the bank, with slow-paying claims and retainage aged in their own column.', tag: 'DEMO', href: '/srl' },
    ],
  },
]

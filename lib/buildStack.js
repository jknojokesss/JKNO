// Shared copy for homepage feature cards and /what-we-do.
// Keep the voice plain: software + operator, not brochure fluff.

export const BUILD_STACK = [
  {
    icon: '◉',
    kicker: 'THE PIPES',
    title: 'Integrations we wrote ourselves',
    blurb: 'Not Zapier, not a $99/mo connector. Real API work against the systems you already run, on a schedule that just works.',
    items: [
      { t: 'QuickBooks Online — both directions', d: 'Nightly pull of your P&L, balance sheet, and full general-ledger detail. Month-end journal entries pushed back in.', tag: 'LIVE' },
      { t: 'Clover POS', d: 'Every ticket and every line item synced each night — items, sizes, and mix your POS never sends to QuickBooks.', tag: 'LIVE' },
      { t: 'Vendor invoice import', d: 'One click on your supplier\u2019s own portal pulls unit cost and PO number into your books. No re-keying invoices.', tag: 'LIVE' },
      { t: 'Bank & card activity', d: 'Classified against your chart of accounts — operating vs. loans vs. owner\u2019s personal, so the P&L means something.', tag: 'LIVE' },
    ],
  },
  {
    icon: '▣',
    kicker: 'THE PORTAL',
    title: 'Built for one business: yours',
    blurb: 'No template you have to learn. Screens shaped like how you already think about the work.',
    items: [
      { t: 'Profit per order', d: 'Revenue, cost, and margin on every ticket — matched back to what you paid your vendor for that exact item.', tag: 'LIVE' },
      { t: 'Inventory that ties out', d: 'Dated purchase layers, FIFO relief, and a month-end COGS entry ready to post. The dollars reconcile to QuickBooks.', tag: 'LIVE' },
      { t: 'Your own login', d: 'Scoped on the server to exactly one company. A portal user can never name — or see — anybody else\u2019s books.', tag: 'LIVE' },
      { t: 'Trading & wholesale books', d: 'POs, landed cost, invoices, bank, and P&L on one desk — sample: Ashford Trading.', tag: 'LIVE', href: '/ashford-trading' },
    ],
  },
  {
    icon: '⬡',
    kicker: 'THE OPERATOR',
    title: 'Someone stays on it',
    blurb: 'Automation is only half. Exceptions get reviewed. You get a person who already knows the system.',
    items: [
      { t: 'Month-end that ties', d: 'Nothing posts until it reconciles. You\u2019re not waiting on a mystery close.', tag: 'LIVE' },
      { t: 'AR desk', d: 'Reads open invoices out of QuickBooks and sends statements in one pass, from your own email.', tag: 'LIVE', href: '/ar-desk' },
      { t: 'Field crew log', d: 'The crew logs a day from a phone — and it lands coded to the job.', tag: 'DEMO', href: '/riverbend-fence' },
      { t: 'WIP & cash timing', d: 'Over/under billing and what is actually landing in the bank — for trades that bill slow.', tag: 'DEMO', href: '/riverstone-roofing' },
    ],
  },
]

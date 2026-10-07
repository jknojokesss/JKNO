import Link from 'next/link'

const TICKET = {
  ticket: 'C-89221',
  when: 'Sep 25 · register',
  line: '235/65R17 Bridgestone Ecopia ×4',
  sale: 520,
  cost: 300,
  match: 'Distributor invoice matched',
}

const fmt = (n) => `$${n.toLocaleString('en-US')}`

export default function HomeHeroProof() {
  const gross = TICKET.sale - TICKET.cost
  const margin = TICKET.sale > 0 ? Math.round((gross / TICKET.sale) * 1000) / 10 : 0

  return (
    <aside className="m-hero-proof" aria-label="Example margin on one ticket">
      <p className="m-hero-proof__eyebrow">What owners actually need on a Tuesday</p>

      <div className="m-hero-proof__slab">
        <div className="m-hero-proof__head">
          <span className="m-hero-proof__ticket">{TICKET.ticket}</span>
          <span className="m-hero-proof__when">{TICKET.when}</span>
        </div>
        <p className="m-hero-proof__line">{TICKET.line}</p>

        <div className="m-hero-proof__grid">
          <div className="m-hero-proof__cell">
            <span className="m-hero-proof__k">Sale</span>
            <span className="m-hero-proof__v">{fmt(TICKET.sale)}</span>
          </div>
          <div className="m-hero-proof__cell">
            <span className="m-hero-proof__k">Cost</span>
            <span className="m-hero-proof__v">{fmt(TICKET.cost)}</span>
          </div>
          <div className="m-hero-proof__cell m-hero-proof__cell--accent">
            <span className="m-hero-proof__k">Gross</span>
            <span className="m-hero-proof__v">{fmt(gross)}</span>
          </div>
          <div className="m-hero-proof__cell m-hero-proof__cell--accent">
            <span className="m-hero-proof__k">Margin</span>
            <span className="m-hero-proof__v">{margin}%</span>
          </div>
        </div>

        <p className="m-hero-proof__match">{TICKET.match}</p>
      </div>

      <div className="m-hero-proof__close">
        <span className="m-hero-proof__close-k">Month-end</span>
        <p className="m-hero-proof__close-v">
          Same login rolls into the closed month — tied to the QuickBooks statement, not a side spreadsheet.
        </p>
      </div>

      <p className="m-hero-proof__demo">
        <Link href="/riverside-tires">Tire shop demo</Link>
        <span aria-hidden="true"> · </span>
        fictitious shop, real screens
      </p>
    </aside>
  )
}

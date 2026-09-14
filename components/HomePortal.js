import { useState } from 'react'
import { useRouter } from 'next/router'
import { BOOKING_URL } from '../lib/marketing'

const BIZ = 'Westline Tire & Auto'
const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orders', label: 'Orders' },
  { id: 'stock', label: 'Stock' },
  { id: 'financials', label: 'Financials' },
  { id: 'ask', label: 'Ask' },
  { id: 'get-yours', label: 'Get yours' },
]

const ORDERS = [
  { ro: 'RO-4812', date: 'Jun 14', vehicle: '2019 Camry', size: '215/55R17', rev: 847, cost: 512, margin: 39.6 },
  { ro: 'RO-4809', date: 'Jun 14', vehicle: '2021 F-150', size: '275/65R18', rev: 1240, cost: 798, margin: 35.6 },
  { ro: 'RO-4805', date: 'Jun 13', vehicle: '2017 Civic', size: '215/55R17', rev: 692, cost: 468, margin: 32.4 },
  { ro: 'RO-4801', date: 'Jun 13', vehicle: '2020 RAV4', size: '225/65R17', rev: 918, cost: 601, margin: 34.5 },
  { ro: 'RO-4798', date: 'Jun 12', vehicle: '2015 Altima', size: '215/60R16', rev: 756, cost: 524, margin: 30.7 },
]

const STOCK = [
  { size: '215/55R17', onHand: 18, avgCost: 74, value: 1332 },
  { size: '225/65R17', onHand: 12, avgCost: 81, value: 972 },
  { size: '275/65R18', onHand: 8, avgCost: 112, value: 896 },
  { size: '265/45R20', onHand: 4, avgCost: 119, value: 476 },
]

const PL = [
  { line: 'Tire & service revenue', amt: 48240 },
  { line: 'Parts & tire COGS', amt: -29810 },
  { line: 'Gross profit', amt: 18430, bold: true },
  { line: 'Operating expenses', amt: -11200 },
  { line: 'Net income', amt: 7230, accent: true },
]

const money = (n) => '$' + Math.round(n).toLocaleString()
const pct = (n) => n.toFixed(1) + '%'

function Kpi({ label, value, sub, accent }) {
  return (
    <div className="hp-kpi">
      <div className="hp-kpi__label">{label}</div>
      <div className={`hp-kpi__value${accent ? ' hp-kpi__value--accent' : ''}`}>{value}</div>
      {sub && <div className="hp-kpi__sub">{sub}</div>}
    </div>
  )
}

function Screen({ tab, form, setForm, onSubmit, submitted, submitting }) {
  if (tab === 'dashboard') {
    return (
      <>
        <div className="hp-kpi-row">
          <Kpi label="Month revenue" value={money(48240)} sub="Through Jun 14" />
          <Kpi label="Gross margin" value="38.2%" sub="Matched to vendor cost" accent />
          <Kpi label="Open AR" value={money(6840)} sub="4 invoices" />
          <Kpi label="Stock on hand" value={money(3676)} sub="4 sizes tracked" />
        </div>
        <div className="hp-card">
          <div className="hp-card__head">
            <h2 className="hp-card__title">Recent repair orders</h2>
            <span className="hp-card__meta">Clover × distributor cost</span>
          </div>
          <table className="hp-table">
            <thead>
              <tr>
                <th>RO</th><th>Vehicle</th><th>Size</th><th className="hp-num">Revenue</th><th className="hp-num">Cost</th><th className="hp-num">Margin</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.slice(0, 4).map((o) => (
                <tr key={o.ro}>
                  <td className="hp-mono">{o.ro}</td>
                  <td>{o.vehicle}</td>
                  <td className="hp-mono hp-muted">{o.size}</td>
                  <td className="hp-num">{money(o.rev)}</td>
                  <td className="hp-num hp-muted">{money(o.cost)}</td>
                  <td className="hp-num hp-good">{pct(o.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hp-pitch">Every ticket matched to what you paid the vendor — updated nightly from your register and distributor portal.</p>
      </>
    )
  }

  if (tab === 'orders') {
    return (
      <>
        <div className="hp-kpi-row">
          <Kpi label="Orders this month" value="186" />
          <Kpi label="Avg margin" value="34.8%" accent />
          <Kpi label="Same-day matches" value="42" sub="Qty ≤ 4, near sale date" />
        </div>
        <div className="hp-card">
          <div className="hp-card__head"><h2 className="hp-card__title">Profit per repair order</h2></div>
          <table className="hp-table">
            <thead>
              <tr>
                <th>RO</th><th>Date</th><th>Vehicle</th><th className="hp-num">Revenue</th><th className="hp-num">Cost</th><th className="hp-num">Margin</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o) => (
                <tr key={o.ro}>
                  <td className="hp-mono">{o.ro}</td>
                  <td className="hp-muted">{o.date}</td>
                  <td>{o.vehicle}</td>
                  <td className="hp-num">{money(o.rev)}</td>
                  <td className="hp-num hp-muted">{money(o.cost)}</td>
                  <td className="hp-num hp-good">{pct(o.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hp-pitch">Not a Clover report. Not a guess. Revenue from the register, cost from the invoice.</p>
      </>
    )
  }

  if (tab === 'stock') {
    return (
      <>
        <div className="hp-kpi-row">
          <Kpi label="Inventory asset" value={money(3676)} sub="As of Jun 14" />
          <Kpi label="Restocks MTD" value={money(4240)} sub="Capitalized to balance sheet" />
          <Kpi label="COGS relief" value={money(3180)} sub="Month-end JE ready" accent />
        </div>
        <div className="hp-card">
          <div className="hp-card__head"><h2 className="hp-card__title">On-hand by size</h2></div>
          <table className="hp-table">
            <thead>
              <tr><th>Size</th><th className="hp-num">Qty</th><th className="hp-num">Avg cost</th><th className="hp-num">Value</th></tr>
            </thead>
            <tbody>
              {STOCK.map((s) => (
                <tr key={s.size}>
                  <td className="hp-mono">{s.size}</td>
                  <td className="hp-num">{s.onHand}</td>
                  <td className="hp-num hp-muted">{money(s.avgCost)}</td>
                  <td className="hp-num">{money(s.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hp-pitch">Dated purchase layers, FIFO relief, and a month-end entry that ties to QuickBooks.</p>
      </>
    )
  }

  if (tab === 'financials') {
    return (
      <>
        <div className="hp-kpi-row">
          <Kpi label="QBO sync" value="Nightly" sub="P&L · BS · GL detail" accent />
          <Kpi label="Closed through" value="May 2026" />
          <Kpi label="Open month" value="June" sub="Live register mix" />
        </div>
        <div className="hp-split">
          <div className="hp-card">
            <div className="hp-card__head">
              <h2 className="hp-card__title">P&amp;L — June (open)</h2>
              <span className="hp-card__meta">Portal view</span>
            </div>
            <table className="hp-table hp-table--pl">
              <tbody>
                {PL.map((r) => (
                  <tr key={r.line} className={r.bold ? 'hp-row-bold' : r.accent ? 'hp-row-accent' : ''}>
                    <td>{r.line}</td>
                    <td className="hp-num">{money(Math.abs(r.amt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hp-card hp-card--qbo">
            <div className="hp-card__head">
              <h2 className="hp-card__title">QuickBooks statement</h2>
              <span className="hp-pill hp-pill--ok">Reconciled</span>
            </div>
            <div className="hp-qbo-lines">
              <div><span>Gross profit</span><span>{money(18430)}</span></div>
              <div><span>Net income</span><span className="hp-good">{money(7230)}</span></div>
              <div><span>Inventory asset</span><span>{money(3676)}</span></div>
            </div>
            <p className="hp-qbo-note">Official QBO figure on the same screen. If they don&rsquo;t match, you see it here.</p>
          </div>
        </div>
      </>
    )
  }

  if (tab === 'ask') {
    return (
      <div className="hp-ask">
        <div className="hp-ask__thread">
          <div className="hp-ask__q">What was margin on 225/65R17 this month?</div>
          <div className="hp-ask__a">
            <strong>34.5%</strong> across 14 units sold. Revenue {money(12852)}, tire cost {money(8424)}.
            Best day was Jun 8 — 6 units at 41% after a restock at $78.
          </div>
          <div className="hp-ask__q">How much is sitting in open AR?</div>
          <div className="hp-ask__a">
            <strong>{money(6840)}</strong> across 4 invoices. Oldest is Fleet Care LLC — 22 days, {money(2180)}.
          </div>
        </div>
        <div className="hp-ask__input">
          <span className="hp-ask__placeholder">Ask anything about your numbers…</span>
        </div>
        <p className="hp-pitch">Plain English in, answer out — computed from your books, not guessed by a chatbot.</p>
      </div>
    )
  }

  return (
    <div id="contact" className="hp-get">
      <div className="hp-get__copy">
        <h2 className="hp-get__title">This is what we build.</h2>
        <p className="hp-get__lead">
          One custom portal for your business — QuickBooks wired to your register, distributors, and vendors. Updated every night.
        </p>
        <ul className="hp-get__list">
          <li>Profit per ticket, job, or order</li>
          <li>Inventory that ties to the balance sheet</li>
          <li>Financials reconciled against QBO</li>
          <li>Your own login — scoped to one company</li>
        </ul>
        <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hp-get__book">Book a 30-min call →</a>
      </div>
      <div className="hp-get__form">
        {submitted ? (
          <div className="hp-get__done">We&rsquo;ll be in touch.</div>
        ) : (
          <>
            <h3 className="hp-get__form-title">What would you want built first?</h3>
            {[
              { key: 'name', label: 'Your name', placeholder: 'John Smith' },
              { key: 'email', label: 'Email', placeholder: 'you@company.com' },
              { key: 'business', label: 'Business name', placeholder: 'Acme Corp' },
            ].map(({ key, label, placeholder }) => (
              <label key={key} className="hp-field">
                <span>{label}</span>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <button
              type="button"
              className="hp-get__submit"
              onClick={onSubmit}
              disabled={submitting || !form.name || !form.email || !form.business}
            >
              {submitting ? 'Sending…' : 'Send message'}
            </button>
            <p className="hp-get__alt">
              Or <a href="mailto:jk@jknojokes.com">jk@jknojokes.com</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function HomePortal({ live, form, setForm, onSubmit, submitted, submitting }) {
  const router = useRouter()
  const [tab, setTab] = useState('dashboard')
  const active = NAV.find((n) => n.id === tab)

  const pick = (id) => {
    setTab(id)
    if (id === 'get-yours') {
      window.setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
    }
  }

  return (
    <div className={`hp-portal${live ? ' hp-portal--live' : ''}`}>
      <div className="hp-mobilenav">
        {NAV.map((n) => (
          <button key={n.id} type="button" className={tab === n.id ? 'is-on' : ''} onClick={() => pick(n.id)}>
            {n.label}
          </button>
        ))}
      </div>

      <div className="hp-shell">
        <aside className="hp-side">
          <div className="hp-brand">
            <div className="hp-brand__icon">W</div>
            <div>
              <div className="hp-brand__name">Westline</div>
              <div className="hp-brand__sub">Tire &amp; Auto</div>
            </div>
          </div>

          <nav className="hp-nav">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`hp-navbtn${tab === n.id ? ' is-on' : ''}${n.id === 'get-yours' ? ' hp-navbtn--cta' : ''}`}
                onClick={() => pick(n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="hp-sidefoot">
            <div className="hp-sidefoot__jk">JK<span>.</span></div>
            <button type="button" className="hp-sidefoot__link" onClick={() => router.push('/demos')}>More demos</button>
            <button type="button" className="hp-sidefoot__link" onClick={() => router.push('/what-we-do')}>What we build</button>
            <button type="button" className="hp-sidefoot__link" onClick={() => router.push('/about')}>About</button>
            <button type="button" className="hp-sidefoot__link" onClick={() => router.push('/login')}>Log in</button>
          </div>
        </aside>

        <main className="hp-main">
          <header className="hp-top">
            <div>
              <div className="hp-top__month">June 2026 · open month</div>
              <h1 className="hp-top__title">{active?.label}</h1>
            </div>
            <div className="hp-top__badge">Built by JK No Jokes</div>
          </header>

          <Screen
            tab={tab}
            form={form}
            setForm={setForm}
            onSubmit={onSubmit}
            submitted={submitted}
            submitting={submitting}
          />
        </main>
      </div>
    </div>
  )
}

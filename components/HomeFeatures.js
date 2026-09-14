import { useState, useEffect, useCallback } from 'react'

const ROTATE = ['margin', 'profit', 'inventory', 'cash flow', 'job cost', 'rent roll']

export const HOME_FEATURES = [
  {
    k: 'Sync',
    title: 'QuickBooks, both ways',
    desc: 'P&L, balance sheet, and GL detail pulled nightly. Month-end journal entries pushed back in.',
  },
  {
    k: 'POS',
    title: 'Register → books',
    desc: 'Every ticket and line item synced each night — items, sizes, and mix your register never sends to QBO.',
  },
  {
    k: 'Vendors',
    title: 'Distributor cost matching',
    desc: 'Unit cost and PO number from your supplier portal. Stock restocks vs. same-day jobs classified automatically.',
  },
  {
    k: 'Margin',
    title: 'Profit per ticket or job',
    desc: 'Revenue, cost, and margin on every sale — matched to what you actually paid for that item or day\u2019s work.',
  },
  {
    k: 'Stock',
    title: 'Inventory that ties out',
    desc: 'Purchase layers, FIFO relief, and a month-end COGS entry ready to post. Dollars reconcile to QuickBooks.',
  },
  {
    k: 'Collect',
    title: 'AR & statements',
    desc: 'Open invoices from QBO, statements from your address, payment links when you want them.',
  },
]

export function HomeRotator() {
  const [i, setI] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const id = window.setInterval(() => {
      setVisible(false)
      window.setTimeout(() => {
        setI((n) => (n + 1) % ROTATE.length)
        setVisible(true)
      }, 220)
    }, 2800)
    return () => window.clearInterval(id)
  }, [])

  return (
    <p className="m-rotator" aria-live="polite">
      Your{' '}
      <span className={`m-rotator__word${visible ? ' is-in' : ' is-out'}`}>{ROTATE[i]}</span>
      {' '}— on one screen.
    </p>
  )
}

export default function HomeFeatures({ live, focusPulse = 0 }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [focused, setFocused] = useState(false)

  const pick = useCallback((idx) => {
    setActive(idx)
    setPaused(true)
    window.setTimeout(() => setPaused(false), 8000)
  }, [])

  useEffect(() => {
    if (!focusPulse) return
    setActive(0)
    setPaused(true)
    setFocused(true)
    const t1 = window.setTimeout(() => setFocused(false), 1100)
    const t2 = window.setTimeout(() => setPaused(false), 8000)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [focusPulse])

  useEffect(() => {
    if (!live || paused) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const id = window.setInterval(() => {
      setActive((n) => (n + 1) % HOME_FEATURES.length)
    }, 3400)
    return () => window.clearInterval(id)
  }, [live, paused])

  const f = HOME_FEATURES[active]

  return (
    <div id="features" className={`m-features${live ? ' m-features--live' : ''}${focused ? ' m-features--focus' : ''}`}>
      <div className="m-features__display" key={active}>
        <span className="m-features__k">{f.k}</span>
        <h2 className="m-features__title">{f.title}</h2>
        <p className="m-features__desc">{f.desc}</p>
      </div>

      <div className="m-features__track" role="tablist" aria-label="What we build">
        {HOME_FEATURES.map((item, idx) => (
          <button
            key={item.k}
            type="button"
            role="tab"
            aria-selected={idx === active}
            className={`m-features__pill${idx === active ? ' is-on' : ''}`}
            onClick={() => pick(idx)}
          >
            <span className="m-features__pill-n">{String(idx + 1).padStart(2, '0')}</span>
            {item.title}
          </button>
        ))}
      </div>

      <div className="m-features__bar" aria-hidden="true">
        <span
          className="m-features__bar-fill"
          style={{ width: `${((active + 1) / HOME_FEATURES.length) * 100}%` }}
        />
      </div>
    </div>
  )
}

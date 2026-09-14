import { useState, useEffect } from 'react'

const ROTATE = ['margin', 'profit', 'inventory', 'cash flow', 'job cost', 'rent roll']

const DOORS = [
  { n: '01', title: 'Tires & auto', hint: 'Profit per repair order', href: '/riverside-tires' },
  { n: '02', title: 'Roofing', hint: 'Job margin & WIP', href: '/riverstone-roofing' },
  { n: '03', title: 'Fencing', hint: 'Crew log → QuickBooks', href: '/riverbend-fence' },
  { n: '04', title: 'Bridal', hint: 'Orders & alterations', href: '/riverfall-gowns' },
  { n: '05', title: 'Property', hint: 'Rent roll & owners', href: '/harborfield-properties' },
  { n: '06', title: 'Import', hint: 'Landed cost pipeline', href: '/northline-global' },
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

export default function HomeShowcase() {
  return (
    <div id="showcase" className="m-band__doors">
      <p className="m-doors__label">Live portals — click in, no login</p>
      <div className="m-doors__grid">
        {DOORS.map((d) => (
          <a key={d.href} href={d.href} className="m-door">
            <span className="m-door__n">{d.n}</span>
            <span className="m-door__body">
              <span className="m-door__title">{d.title}</span>
              <span className="m-door__hint">{d.hint}</span>
            </span>
            <span className="m-door__arrow" aria-hidden="true">→</span>
          </a>
        ))}
      </div>
      <a href="/demos" className="m-doors__more">All demos &amp; industries →</a>
    </div>
  )
}

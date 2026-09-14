import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const ROTATE = ['margin', 'profit', 'inventory', 'cash flow', 'job cost', 'rent roll']

const BENTO = [
  { label: 'Tires & auto', href: '/riverside-tires', line: 'Profit per repair order', span: 'wide' },
  { label: 'Roofing', href: '/riverstone-roofing', line: 'Job margin & WIP', span: 'tall' },
  { label: 'Fencing', href: '/riverbend-fence', line: 'Crew log → QuickBooks', span: 'norm' },
  { label: 'Bridal', href: '/riverfall-gowns', line: 'Orders & alterations', span: 'norm' },
  { label: 'Property', href: '/harborfield-properties', line: 'Rent roll & owners', span: 'norm' },
  { label: 'Import', href: '/northline-global', line: 'Landed cost pipeline', span: 'wide' },
]

const PIPE = ['QuickBooks', 'Register', 'Vendors', 'Your portal']

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
  const router = useRouter()

  return (
    <section id="showcase" className="m-showcase">
      <div className="m-wrap">
        <div className="m-pipe" aria-hidden="true">
          {PIPE.map((node, idx) => (
            <div key={node} className="m-pipe__segment">
              <span className="m-pipe__node">{node}</span>
              {idx < PIPE.length - 1 && <span className="m-pipe__line"><span className="m-pipe__pulse" /></span>}
            </div>
          ))}
        </div>

        <div className="m-bento">
          {BENTO.map((t) => (
            <a key={t.href} href={t.href} className={`m-bento__cell m-bento__cell--${t.span}`}>
              <span className="m-bento__label">{t.label}</span>
              <span className="m-bento__line">{t.line}</span>
              <span className="m-bento__go">Open demo →</span>
            </a>
          ))}
        </div>

        <p className="m-showcase__foot">
          <button type="button" className="m-btn m-btn--primary m-btn--pop" onClick={() => router.push('/demos')}>
            All {BENTO.length}+ live demos
          </button>
        </p>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'

const CHIPS = [
  { text: 'margin', x: '-32vw', y: '-28vh', r: -14 },
  { text: 'profit', x: '38vw', y: '-22vh', r: 11 },
  { text: 'QuickBooks', x: '-28vw', y: '18vh', r: -8 },
  { text: 'register', x: '42vw', y: '8vh', r: 16 },
  { text: 'COGS', x: '12vw', y: '-35vh', r: -20 },
  { text: 'inventory', x: '-18vw', y: '32vh', r: 9 },
  { text: 'RO #4812', x: '28vw', y: '28vh', r: -12 },
  { text: '$4,820 AR', x: '-42vw', y: '4vh', r: 7 },
  { text: '38.2%', x: '8vw', y: '38vh', r: -16 },
  { text: 'Weldon PO#', x: '36vw', y: '-8vh', r: 13 },
  { text: 'job cost', x: '-8vw', y: '-18vh', r: 10 },
  { text: 'rent roll', x: '22vw', y: '22vh', r: -9 },
]

export default function HomeAssemble({ onDone }) {
  const [out, setOut] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      onDone?.()
      return
    }

    const t1 = window.setTimeout(() => setOut(true), 1150)
    const t2 = window.setTimeout(() => onDone?.(), 1500)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div className={`hp-assemble${out ? ' hp-assemble--out' : ''}`} aria-hidden="true">
      <div className="hp-assemble__stage">
        <div className="hp-assemble__shard hp-assemble__shard--topbar" />
        <div className="hp-assemble__shard hp-assemble__shard--side" />
        <div className="hp-assemble__shard hp-assemble__shard--main" />
        <div className="hp-assemble__shard hp-assemble__shard--spot" />

        {CHIPS.map((chip, i) => (
          <span
            key={chip.text}
            className="hp-assemble__chip"
            style={{
              '--sx': chip.x,
              '--sy': chip.y,
              '--sr': `${chip.r}deg`,
              '--chip-d': `${0.08 + i * 0.035}s`,
            }}
          >
            {chip.text}
          </span>
        ))}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'

// Living "Monthly Snapshot" dashboard card for the homepage hero.
// Navy panel styled to the site palette; animates on mount. No browser-chrome
// header, no page wrapper — drops straight into a section.
const C = {
  navy: '#1A2035', navyBorder: '#2E3A5C', inset: '#1E2540',
  gold: '#C9A84C', goldDark: '#B8943C', goldLight: '#E8D5A3', goldPale: '#F0DEAC',
  mutedNavy: '#6B7A96', green: '#28C840',
}
const display = "'Space Grotesk', sans-serif"
const mono = "'DM Mono', monospace"

const MONTHS = [
  { m: 'Feb', rev: 41.2, exp: 27.0 }, { m: 'Mar', rev: 47.8, exp: 30.2 },
  { m: 'Apr', rev: 54.6, exp: 33.1 }, { m: 'May', rev: 50.6, exp: 31.8 },
  { m: 'Jun', rev: 75.1, exp: 40.0 }, { m: 'Jul', rev: 62.4, exp: 37.6 },
].map(d => ({ ...d, profit: +(d.rev - d.exp).toFixed(1) }))

const MIX = [
  { k: 'New tires',  v: 72, c: C.gold },
  { k: 'Service',    v: 21, c: C.goldDark },
  { k: 'Used tires', v: 5,  c: C.goldLight },
  { k: 'Other',      v: 2,  c: '#4A5578' },
]

const HERO_TARGET = 75090

function useCountUp(target, ms, start) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!start) return
    let raf, t0
    const step = (t) => {
      if (!t0) t0 = t
      const p = Math.min((t - t0) / ms, 1)
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [start, target, ms])
  return n
}

export default function LivingSnapshot() {
  const [go, setGo] = useState(false)
  const [pulse, setPulse] = useState(false)
  const hero = useCountUp(HERO_TARGET, 1500, go)

  useEffect(() => {
    const t = setTimeout(() => setGo(true), 250)
    const p = setInterval(() => setPulse(v => !v), 1400)
    return () => { clearTimeout(t); clearInterval(p) }
  }, [])

  const maxRev = Math.max(...MONTHS.map(d => d.rev))
  const chartH = 150, chartW = 520, pad = 8
  const bw = (chartW - pad * 2) / MONTHS.length
  const maxProfit = Math.max(...MONTHS.map(d => d.profit))
  const linePts = MONTHS.map((d, i) => {
    const x = pad + bw * i + bw / 2
    const y = chartH - (d.profit / maxProfit) * (chartH - 30) - 10
    return [x, y]
  })
  const linePath = linePts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')

  return (
    <div style={{ background: C.navy, border: '1px solid #E2D9C5', overflow: 'hidden' }}>
      <div style={{ padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '2px', color: C.gold, textTransform: 'uppercase' }}>Monthly Snapshot</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, transition: 'opacity .7s ease', opacity: pulse ? 1 : 0.35 }} />
            <span style={{ fontFamily: mono, fontSize: 10, color: C.mutedNavy, letterSpacing: '1px' }}>LIVE</span>
          </span>
        </div>

        <div style={{ fontFamily: mono, fontSize: 12, color: C.mutedNavy, letterSpacing: '1px' }}>Net sales · best month</div>
        <div style={{ fontFamily: display, fontSize: 56, fontWeight: 700, color: '#fff', lineHeight: 1, marginTop: 4, letterSpacing: '-1px' }}>
          ${hero.toLocaleString()}
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 16, borderTop: `1px solid ${C.navyBorder}`, paddingTop: 14 }}>
          {[['Gross margin', '47%'], ['Net margin', '36%'], ['Tickets', '630']].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontFamily: mono, fontSize: 19, color: C.goldPale, fontWeight: 500 }}>{v}</div>
              <div style={{ fontFamily: mono, fontSize: 9.5, color: C.mutedNavy, letterSpacing: '1px', marginTop: 3, textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.mutedNavy, marginBottom: 10 }}>Revenue · Expenses · Profit ($K)</div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
            {MONTHS.map((d, i) => {
              const x = pad + bw * i
              const rh = (d.rev / maxRev) * (chartH - 20)
              const eh = (d.exp / maxRev) * (chartH - 20)
              return (
                <g key={d.m}>
                  <rect x={x + bw * 0.18} width={bw * 0.30} y={chartH - (go ? rh : 0)} height={go ? rh : 0}
                    fill="#3A4568" style={{ transition: `all .9s cubic-bezier(.2,.7,.2,1) ${i * 80}ms` }} />
                  <rect x={x + bw * 0.52} width={bw * 0.30} y={chartH - (go ? eh : 0)} height={go ? eh : 0}
                    fill="#232B47" style={{ transition: `all .9s cubic-bezier(.2,.7,.2,1) ${i * 80}ms` }} />
                  <text x={x + bw / 2} y={chartH + 12} textAnchor="middle" fontSize="9" fill={C.mutedNavy} fontFamily={mono}>{d.m}</text>
                </g>
              )
            })}
            <path d={linePath} fill="none" stroke={C.gold} strokeWidth="2.5"
              strokeDasharray="1000" strokeDashoffset={go ? 0 : 1000}
              style={{ transition: 'stroke-dashoffset 1.3s ease .3s' }} />
            {linePts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={C.gold}
                style={{ opacity: go ? 1 : 0, transition: `opacity .3s ease ${600 + i * 120}ms` }} />
            ))}
          </svg>
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.mutedNavy, marginBottom: 8 }}>Sales mix</div>
          <div style={{ display: 'flex', height: 16, borderRadius: 4, overflow: 'hidden' }}>
            {MIX.map((s, i) => (
              <div key={s.k} title={`${s.k} ${s.v}%`}
                style={{ width: go ? `${s.v}%` : '0%', background: s.c, transition: `width .9s cubic-bezier(.2,.7,.2,1) ${300 + i * 120}ms` }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {MIX.map(s => (
              <span key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 10, color: C.mutedNavy }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: s.c }} /> {s.k} · {s.v}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

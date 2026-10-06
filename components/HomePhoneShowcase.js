import { useEffect, useRef, useState } from 'react'
import { demoEmbedSrc } from '../lib/demoEmbed'

const DEMO_SRC = demoEmbedSrc('/riverside-tires')
const FRAME_W = 390
const FRAME_H = 844

const STEP_MS = {
  home: 1100,
  press: 720,
  launch: 900,
  portal: 6500,
}

const HOME_ROWS = [
  [
    { label: 'FaceTime', glyph: '📹', hue: '#22c55e' },
    { label: 'Calendar', glyph: '31', hue: '#fff' },
    { label: 'Photos', glyph: '🌸', hue: '#ec4899' },
    { label: 'Camera', glyph: '📷', hue: '#64748b' },
  ],
  [
    { label: 'Riverside Tires', glyph: 'RT', hue: '#B0281C', rt: true },
    { label: 'Mail', glyph: 'M', hue: '#3b82f6' },
    { label: 'Notes', glyph: '≡', hue: '#fbbf24' },
    { label: 'Reminders', glyph: '☑', hue: '#fff' },
  ],
  [
    { label: 'Maps', glyph: '↑', hue: '#22c55e' },
    { label: 'Weather', glyph: '☀', hue: '#38bdf8' },
    { label: 'NFL', glyph: '🏈', hue: '#013369' },
    { label: 'Settings', glyph: '⚙', hue: '#6b7280' },
  ],
]

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function AppIcon({ label, glyph, hue, rt = false }) {
  return (
    <div className={`m-phone__app${rt ? ' m-phone__app--rt' : ''}`}>
      <span
        className={`m-phone__app-icon${rt ? ' m-phone__app-icon--rt' : ''}`}
        style={rt ? undefined : { background: hue }}
      >
        {glyph}
      </span>
      <span className="m-phone__app-name">{label}</span>
    </div>
  )
}

export default function HomePhoneShowcase() {
  const [step, setStep] = useState('home')
  const iframeHostRef = useRef(null)
  const [frameScale, setFrameScale] = useState(1)

  useEffect(() => {
    const el = iframeHostRef.current
    if (!el) return undefined
    const fit = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      setFrameScale(Math.min(w / FRAME_W, h / FRAME_H))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    const order = ['home', 'press', 'launch', 'portal']

    const loop = async () => {
      let i = 0
      while (!cancelled) {
        const name = order[i]
        setStep(name)
        await sleep(STEP_MS[name])
        i = (i + 1) % order.length
      }
    }

    loop()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="m-phone-stage" aria-label="Tap Riverside Tires on the home screen to open the shop portal">
      <div className="m-phone">
        <div className="m-phone__bezel">
          <div className="m-phone__island" aria-hidden="true" />
          <div className={`m-phone__screen m-phone__screen--${step}`}>
            <div className="m-phone__scene m-phone__scene--home">
              <div className="m-phone__wallpaper" aria-hidden="true" />
              <div className="m-phone__ios-bar">
                <span>9:41</span>
              </div>

              <div className="m-phone__ios-pages">
                {HOME_ROWS.map((row, ri) => (
                  <div key={ri} className="m-phone__ios-row">
                    {row.map((app) => (
                      <AppIcon
                        key={app.label}
                        label={app.label}
                        glyph={app.glyph}
                        hue={app.hue}
                        rt={app.rt}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className="m-phone__dock" aria-hidden="true">
                {['Phone', 'Safari', 'Messages', 'Music'].map((name) => (
                  <div key={name} className="m-phone__dock-icon" />
                ))}
              </div>
            </div>

            <div className="m-phone__scene m-phone__scene--portal">
              <div ref={iframeHostRef} className="m-phone__iframe-host">
                <iframe
                  title="Riverside Tires demo"
                  src={DEMO_SRC}
                  className="m-phone__iframe"
                  loading="eager"
                  tabIndex={-1}
                  style={{
                    width: FRAME_W,
                    height: FRAME_H,
                    transform: `scale(${frameScale})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="m-phone-stage__cap">
        {step === 'portal' && (
          <>
            Your portal on the phone —{' '}
            <a href="/riverside-tires">open full demo</a>
          </>
        )}
        {step === 'launch' && (
          <>
            Opening <strong>Riverside Tires</strong>…
          </>
        )}
        {(step === 'home' || step === 'press') && (
          <>
            Tap <strong>Riverside Tires</strong> on the home screen
          </>
        )}
      </p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { demoEmbedSrc } from '../lib/demoEmbed'

const DEMO_SRC = demoEmbedSrc('/riverside-tires')

/** home → tap → portal, repeat. Short and obvious. */
const STEP_MS = {
  home: 2800,
  tap: 1600,
  portal: 7500,
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
      {rt && <span className="m-phone__finger" aria-hidden="true" />}
    </div>
  )
}

export default function HomePhoneShowcase() {
  const [step, setStep] = useState('home')

  useEffect(() => {
    let cancelled = false
    const order = ['home', 'tap', 'portal']

    const loop = async () => {
      await sleep(300)
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
      <ol className="m-phone-steps" aria-hidden="true">
        <li className={step === 'home' ? 'is-on' : ''}>Home</li>
        <li className={step === 'tap' ? 'is-on' : ''}>Tap</li>
        <li className={step === 'portal' ? 'is-on' : ''}>Portal</li>
      </ol>

      <div className="m-phone">
        <div className="m-phone__bezel">
          <div className="m-phone__island" aria-hidden="true" />
          <div className={`m-phone__screen m-phone__screen--${step}`}>
            <div className="m-phone__scene m-phone__scene--home">
              <div className="m-phone__wallpaper" aria-hidden="true" />
              <div className="m-phone__ios-bar">
                <span>9:41</span>
              </div>
              <p className="m-phone__home-hint">Tap your shop app</p>

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

              <div className="m-phone__shade" aria-hidden="true" />
              <div className="m-phone__tap-badge" aria-hidden="true">TAP</div>
            </div>

            <div className="m-phone__scene m-phone__scene--portal">
              <iframe
                title="Riverside Tires demo"
                src={DEMO_SRC}
                className="m-phone__iframe"
                loading="eager"
                tabIndex={-1}
              />
            </div>
          </div>
        </div>
      </div>

      <p className="m-phone-stage__cap">
        {step === 'portal' ? (
          <>
            Your portal, on the phone —{' '}
            <a href="/riverside-tires">open full demo</a>
          </>
        ) : (
          <>
            <strong>Riverside Tires</strong> on the home screen → books inside
          </>
        )}
      </p>
    </div>
  )
}

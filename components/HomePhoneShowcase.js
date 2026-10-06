import { useEffect, useRef, useState } from 'react'
import { phoneDemoEmbedSrc } from '../lib/demoEmbed'
import { postPhoneDemo } from '../lib/phoneDemoPostMessage'

const DEMO_SRC = phoneDemoEmbedSrc('/riverside-tires')
const FRAME_W = 390
const FRAME_H = 844

const PHASES = [
  { id: 'home', ms: 900 },
  { id: 'press', ms: 500 },
  { id: 'launch', ms: 750 },
  { id: 'portal', ms: 9500 },
]

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
  const [phase, setPhase] = useState('home')
  const [iframeMounted, setIframeMounted] = useState(false)
  const iframeHostRef = useRef(null)
  const iframeRef = useRef(null)
  const [frameScale, setFrameScale] = useState(1)
  const phaseIndexRef = useRef(0)

  const portalVisible = phase === 'launch' || phase === 'portal'

  useEffect(() => {
    if (portalVisible) setIframeMounted(true)
  }, [portalVisible])

  useEffect(() => {
    const el = iframeHostRef.current
    if (!el || !iframeMounted) return undefined
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
  }, [iframeMounted])

  useEffect(() => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    if (portalVisible) postPhoneDemo('start', win)
    else postPhoneDemo('stop', win)
  }, [portalVisible, phase])

  const onIframeLoad = () => {
    if (portalVisible) postPhoneDemo('start', iframeRef.current?.contentWindow)
  }

  useEffect(() => {
    let timer

    const advance = () => {
      const next = PHASES[phaseIndexRef.current]
      setPhase(next.id)
      timer = window.setTimeout(() => {
        phaseIndexRef.current = (phaseIndexRef.current + 1) % PHASES.length
        advance()
      }, next.ms)
    }

    phaseIndexRef.current = 0
    advance()
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="m-phone-stage" aria-label="Tap Riverside Tires on the home screen to open the shop portal">
      <div className="m-phone">
        <div className="m-phone__bezel">
          <div className="m-phone__island" aria-hidden="true" />
          <div className={`m-phone__screen m-phone__screen--${phase}`}>
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

            {iframeMounted && (
              <div
                className={`m-phone__scene m-phone__scene--portal${portalVisible ? '' : ' m-phone__scene--portal-hidden'}`}
                aria-hidden={!portalVisible}
              >
                <div ref={iframeHostRef} className="m-phone__iframe-host">
                  <iframe
                    ref={iframeRef}
                    title="Riverside Tires demo"
                    src={DEMO_SRC}
                    className="m-phone__iframe"
                    loading="eager"
                    tabIndex={-1}
                    onLoad={onIframeLoad}
                    style={{
                      width: FRAME_W,
                      height: FRAME_H,
                      transform: `scale(${frameScale})`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="m-phone-stage__cap">
        {portalVisible ? (
          <>
            <strong>Riverside Tires</strong> portal —{' '}
            <a href="/riverside-tires">open full demo</a>
          </>
        ) : (
          <>
            Tap <strong>Riverside Tires</strong> (red <strong>RT</strong> icon, second row)
          </>
        )}
      </p>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { markFlightPageFlyIns, useScrollFlyIn } from '../lib/useScrollFlyIn'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { BOOKING_URL, MARKETING_FONTS, NAV_LINKS } from '../lib/marketing'
import MarketingFlightChrome from './MarketingFlightChrome'
import MarketingJKChrome from './MarketingJKChrome'

export function MarketingLogo({ size = 26, tagline = true, onClick, light = false }) {
  const inner = (
    <div className={`m-logo${light ? ' m-logo--light' : ''}`} style={{ '--m-logo-size': `${size}px` }}>
      <span className="m-logo__jk">
        JK<span className="m-logo__dot">.</span>
      </span>
      {tagline && (
        <span className="m-logo__tag nav-tagline">No Jokes Financials</span>
      )}
    </div>
  )
  if (!onClick) return inner
  return (
    <button type="button" onClick={onClick} aria-label="JK No Jokes home"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
      {inner}
    </button>
  )
}

export default function MarketingShell({
  title,
  description,
  children,
  padTop = true,
  darkHeader = false,
  flightHome = false,
  marketingHome = false,
  jkTheme = true,
  flightTheme = false,
}) {
  const router = useRouter()
  const flightPageRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [onDarkHero, setOnDarkHero] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const chromeFlight = flightTheme || flightHome
  const useJK = jkTheme && !flightTheme && !flightHome
  const showFlightChrome = flightTheme && !flightHome
  const showJKChrome = useJK
  const showPageChrome = showFlightChrome || useJK
  const onHomeHero = useJK || marketingHome || flightHome || (chromeFlight && !flightHome) || (darkHeader && onDarkHero && !menuOpen)

  useScrollFlyIn(flightPageRef, showPageChrome, router.pathname)

  useEffect(() => {
    if (!showPageChrome || !flightPageRef.current) return
    markFlightPageFlyIns(flightPageRef.current)
  }, [showPageChrome, router.pathname, children])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8)
      if (router.pathname === '/' && !flightHome && !marketingHome) setOnDarkHero(window.scrollY < 720)
      if (router.pathname === '/' && marketingHome) setOnDarkHero(window.scrollY < 640)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [router.pathname, flightHome, marketingHome])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [router.pathname, router.asPath])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [menuOpen])

  const go = (href) => {
    if (href.startsWith('/#')) {
      if (router.pathname !== '/') router.push(href)
      else document.getElementById(href.slice(2))?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push(href)
    }
    setMenuOpen(false)
  }

  const navActive = (href) => {
    if (href === '/what-we-do') return router.pathname === '/what-we-do'
    return router.pathname === href || router.pathname.startsWith(href + '/')
  }

  return (
    <div
      className={[
        'marketing-site',
        chromeFlight ? 'marketing-site--flight' : '',
        useJK ? 'marketing-site--jk' : '',
      ].filter(Boolean).join(' ')}
    >
      <Head>
        {title && <title>{title}</title>}
        {description && <meta name="description" content={description} />}
        {description && <meta property="og:description" content={description} />}
        {title && <meta property="og:title" content={title} />}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://jknojokes.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href={MARKETING_FONTS} rel="stylesheet" />
      </Head>

      <header
        className={`m-header${chromeFlight ? ' m-header--flight' : ''}${useJK ? ' m-header--jk' : ''}${onHomeHero ? ' m-header--hero' : ''}${!onHomeHero && (scrolled || menuOpen) ? ' is-solid' : ''}${menuOpen ? ' is-menu-open' : ''}${onHomeHero || chromeFlight || useJK ? ' m-header--dark' : ''}`}
      >
        <div className="m-wrap m-header__inner">
          <MarketingLogo light={onHomeHero || chromeFlight || useJK} onClick={() => { setMenuOpen(false); router.push('/') }} />
          {!isMobile && (
            <nav className="m-header__nav" aria-label="Main">
              {NAV_LINKS.map((item) => (
                <button key={item.label} type="button" className={`m-nav-link${navActive(item.href) ? ' is-active' : ''}`}
                  onClick={() => go(item.href)}>{item.label}</button>
              ))}
              <button type="button" className="m-nav-link" onClick={() => go('/#contact')}>Contact</button>
              <button type="button" className={`m-btn m-header__btn${onHomeHero || chromeFlight || useJK ? ' m-btn--ghost-light' : ' m-btn--secondary'}${router.pathname === '/login' ? ' is-nav-current' : ''}`} onClick={() => router.push('/login')}>Log in</button>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className={`m-btn m-header__btn${onHomeHero || chromeFlight || useJK ? ' m-btn--gold' : ' m-btn--primary'}`}>
                Book a call
              </a>
            </nav>
          )}
          {isMobile && (
            <button type="button" className={`m-menu-toggle${onHomeHero || chromeFlight || useJK ? ' m-menu-toggle--light' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </header>

      {menuOpen && (
        <div className="m-mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu">
          <nav className="m-wrap m-mobile-menu__nav" aria-label="Main">
            {NAV_LINKS.map((item) => (
              <button key={item.label} type="button" className={`m-mobile-nav-link${navActive(item.href) ? ' is-active' : ''}`}
                onClick={() => go(item.href)}>{item.label}</button>
            ))}
            <button type="button" className="m-mobile-nav-link" onClick={() => go('/#contact')}>Contact</button>
            <div className="m-mobile-menu__actions">
              <button type="button" className="m-btn m-btn--secondary" style={{ flex: 1 }} onClick={() => { setMenuOpen(false); router.push('/login') }}>Log in</button>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn m-btn--primary" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>Book a call</a>
            </div>
          </nav>
        </div>
      )}

      {showFlightChrome ? <MarketingFlightChrome /> : null}
      {showJKChrome ? <MarketingJKChrome /> : null}
      <div
        ref={flightPageRef}
        className={showPageChrome ? (showFlightChrome ? 'm-flight-page' : 'm-jk-page') : undefined}
        style={{ paddingTop: padTop && !flightHome && !marketingHome ? '68px' : 0 }}
      >
        {children}
      </div>

      <footer
        className={chromeFlight || marketingHome || useJK ? 'm-footer-flight' : ''}
        style={{
          padding: '48px 0 40px',
          borderTop: chromeFlight || marketingHome || useJK ? undefined : '1px solid #DFE4EC',
          background: chromeFlight || marketingHome || useJK ? undefined : '#fff',
          position: chromeFlight || marketingHome || useJK ? 'relative' : undefined,
          zIndex: chromeFlight || marketingHome || useJK ? 1 : undefined,
        }}
      >
        <div className="m-wrap" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '32px', alignItems: 'flex-start' }}>
          <div>
            <MarketingLogo size={22} tagline={false} light={chromeFlight || marketingHome || useJK} onClick={() => router.push('/')} />
            <p
              className={chromeFlight || useJK ? 'm-footer-flight__blurb' : ''}
              style={{
                marginTop: '12px',
                fontSize: '14px',
                color: chromeFlight || useJK ? undefined : '#5A6577',
                maxWidth: '300px',
                lineHeight: 1.65,
              }}
            >
              I build the portal, write the integrations, and keep the books. One company per login.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            <div>
              {NAV_LINKS.map((item) => (
                <button key={item.label} className="m-nav-link" style={{ display: 'block', padding: '5px 0', textAlign: 'left' }}
                  onClick={() => go(item.href)}>{item.label}</button>
              ))}
            </div>
            <div>
              <button className="m-nav-link" style={{ display: 'block', padding: '5px 0', textAlign: 'left' }} onClick={() => go('/#contact')}>Contact</button>
              <button className="m-nav-link" style={{ display: 'block', padding: '5px 0', textAlign: 'left' }} onClick={() => router.push('/login')}>Log in</button>
              <button className="m-nav-link" style={{ display: 'block', padding: '5px 0', textAlign: 'left' }} onClick={() => router.push('/privacy')}>Privacy</button>
              <button className="m-nav-link" style={{ display: 'block', padding: '5px 0', textAlign: 'left' }} onClick={() => router.push('/terms')}>Terms</button>
            </div>
          </div>
        </div>
        <div className="m-wrap m-footer-bar">
          <span>© {new Date().getFullYear()} JK No Jokes Financials</span>
          <span className="m-footer-bar__tag">Built in Jersey. No jokes.</span>
        </div>
      </footer>
    </div>
  )
}

export function PageHero({ eyebrow, kicker, title, lead, children, align = 'left' }) {
  const label = eyebrow || (kicker ? kicker.replace(/^—\s*/, '') : null)
  return (
    <section className={`m-inner-hero${align === 'center' ? ' m-inner-hero--center' : ''}`}>
      <div className="m-wrap m-inner-hero__inner">
        {label && <div className="m-kicker">{label}</div>}
        {title && <h1 className="m-h1 m-inner-hero__title">{title}</h1>}
        {lead && <p className="m-lead m-inner-hero__lead">{lead}</p>}
        {children}
      </div>
    </section>
  )
}

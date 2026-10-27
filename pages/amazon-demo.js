/**
 * Larkfield Kitchen Co. — Amazon seller sample portal.
 * Client logic and sample data: public/amazon-demo/{app.js,data.js,styles.css}.
 */
import Head from 'next/head'
import Script from 'next/script'

export default function AmazonDemoPortal() {
  return (
    <>
      <Head>
        <title>Larkfield Kitchen Co. | Client Portal (Sample)</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="description"
          content="Sample client portal by JK No Jokes Financials: Amazon profit from Sellerboard plus every other expense from QuickBooks Online, in one weekly view."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Larkfield Kitchen Co. | Client Portal (Sample)" />
        <meta
          property="og:description"
          content="Amazon profit from Sellerboard plus every other expense from QuickBooks, in one weekly report. Prepared by JK No Jokes Financials."
        />
        <meta property="og:image" content="https://www.jknojokes.com/amazon-demo/og.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400..600;1,400&family=Source+Serif+4:ital,opsz,wght@0,600;0,700;1,600&display=swap"
        />
        <link rel="stylesheet" href="/amazon-demo/styles.css" />
      </Head>

      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="app">
        <aside className="side" aria-label="Main navigation">
          <div className="brand">
            <span className="mark" aria-hidden="true">
              LK
            </span>
            <span className="brand-text">
              <strong>Larkfield Kitchen Co.</strong>
              <span>Client portal</span>
            </span>
          </div>
          <nav className="nav" id="nav">
            <a href="#/overview" data-page="overview">
              Overview
            </a>
            <a href="#/report" data-page="report">
              Weekly report
            </a>
            <a href="#/products" data-page="products">
              Products
            </a>
            <a href="#/shipments" data-page="shipments">
              FBA shipments
            </a>
            <a href="#/expenses" data-page="expenses">
              Expenses
            </a>
            <a href="#/inventory" data-page="inventory">
              Inventory
            </a>
            <a href="#/cash" data-page="cash">
              Cash
            </a>
            <a href="#/sources" data-page="sources">
              Data sources
            </a>
          </nav>
          <div className="side-foot">
            <div className="sync" id="sideSync" />
            <p className="prep">
              Prepared by
              <br />
              <strong>JK No Jokes Financials</strong>
            </p>
          </div>
        </aside>
        <div className="body">
          <header className="top">
            <div className="top-row">
              <div className="top-title">
                <span className="mark sm" aria-hidden="true">
                  LK
                </span>
                <div>
                  <h1 id="pageTitle">
                    Overview
                  </h1>
                  <p className="sub" id="pageSub" />
                </div>
              </div>
              <span className="pill-sample">Sample data</span>
            </div>
            <div className="range" id="rangeBar" role="group" aria-label="Date range" />
          </header>
          <main id="main" tabIndex={-1} />
          <footer className="foot">
            <p>
              <strong>Sample portal with fictitious data.</strong> Larkfield Kitchen Co. is not a real company.
            </p>
            <p>
              Prepared by JK No Jokes Financials ·{' '}
              <a href="https://jknojokes.com" rel="noopener">
                jknojokes.com
              </a>{' '}
              · <a href="tel:+19175898455">917-589-8455</a>
            </p>
          </footer>
        </div>
      </div>
      <div className="drawer-wrap" id="drawerWrap" hidden>
        <div className="drawer-scrim" data-close />
        <section className="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" />
      </div>
      <div className="tip" id="tip" role="status" aria-live="polite" />
      <nav className="mob-tabs" id="mobTabs" aria-label="Main navigation" />

      <Script src="/amazon-demo/data.js" strategy="beforeInteractive" />
      <Script src="/amazon-demo/app.js" strategy="afterInteractive" />
    </>
  )
}

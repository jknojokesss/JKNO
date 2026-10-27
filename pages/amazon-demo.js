/**
 * Murray's Shot Glass Gallery — Amazon seller sample portal.
 * Client logic and sample data: public/amazon-demo/{app.js,data.js,styles.css}.
 */
import Head from 'next/head'
import Script from 'next/script'

export default function AmazonDemoPortal() {
  return (
    <>
      <Head>
        <title>Murray&apos;s Shot Glass Gallery | Client Portal (Sample)</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="description"
          content="Sample client portal by JK No Jokes Financials: Amazon profit from Sellerboard plus every other expense from QuickBooks Online, in one weekly view."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Murray's Shot Glass Gallery | Client Portal (Sample)" />
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
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
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
              MS
            </span>
            <span className="brand-text">
              <strong>Murray&apos;s Shot Glass Gallery</strong>
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
            <a href="#/payables" data-page="payables">
              Payables
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
                  MS
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
              Sample data · JK No Jokes Financials · <a href="tel:+19175898455">917-589-8455</a>
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
      <div className="mob-more-wrap" id="mobMoreSheet" hidden aria-hidden="true">
        <div className="mob-more-scrim" data-close-more />
        <nav className="mob-more-panel" id="mobMorePanel" aria-label="More pages" />
      </div>

      <Script src="/amazon-demo/data.js" strategy="beforeInteractive" />
      <Script src="/amazon-demo/app.js" strategy="afterInteractive" />
    </>
  )
}

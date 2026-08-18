import Head from 'next/head'
import { MONTH_PL, YTD_2026, H2_2025, TTM, LANDED_NOT_IN_COGS } from '../lib/mnePnl'

// Printable profit & loss statement for MNE Trading — the version that gets
// handed to a lender (mortgage modification packet). Read-only, print-to-PDF,
// same figures as the /mne-trading P&L tab.
const NAVY = '#1C2B4A', GOLD = '#B8973A', INK = '#1A1A2E', MUTED = '#6B6B7B', BORDER = '#D8D2C6', RULE = '#EDE8DE'
const MONO = "'IBM Plex Mono', monospace"

const money = (n) => (n < 0 ? '(' : '') + '$' + Math.abs(Math.round(n)).toLocaleString() + (n < 0 ? ')' : '')
const pct = (n) => (n * 100).toFixed(1) + '%'

const PREPARED = 'August 18, 2026'

export default function MNEProfitAndLoss() {
  const num = { fontFamily: MONO, fontSize: '13px', textAlign: 'right', whiteSpace: 'nowrap' }
  const colHead = { fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED, padding: '0 0 8px', textAlign: 'right' }

  // Income → COGS → gross profit → operating expenses → net income.
  const LINES = [
    { l: 'Sales — merchandise (watches & eyewear)', ytd: YTD_2026.rev, ttm: TTM.rev },
    { l: 'Total revenue', ytd: YTD_2026.rev, ttm: TTM.rev, sub: true },
    { l: 'Cost of goods sold — merchandise purchases', ytd: -YTD_2026.cogs, ttm: -TTM.cogs, gap: true },
    { l: 'Gross profit', ytd: YTD_2026.gp, ttm: TTM.gp, total: true },
    { l: 'Operating expenses (see Note 4)', ytd: 0, ttm: 0, gap: true, sub: true },
    { l: 'Net income', ytd: YTD_2026.gp, ttm: TTM.gp, total: true, grand: true },
  ]

  const Row = ({ r }) => (
    <tr>
      <td style={{
        padding: r.grand ? '12px 0 12px 2px' : '7px 0 7px 2px',
        borderTop: r.total ? `1px solid ${BORDER}` : (r.sub ? `1px solid ${RULE}` : 'none'),
        paddingTop: r.gap ? '18px' : undefined,
        fontSize: r.grand ? '15px' : '13px',
        fontWeight: r.total || r.sub ? 700 : 400,
        color: r.total || r.sub ? INK : '#3A3A4A',
      }}>{r.l}</td>
      {[r.ytd, r.ttm].map((v, i) => (
        <td key={i} style={{
          ...num,
          padding: r.grand ? '12px 0 12px 30px' : '7px 0 7px 30px',
          paddingTop: r.gap ? '18px' : undefined,
          borderTop: r.total ? `1px solid ${BORDER}` : (r.sub ? `1px solid ${RULE}` : 'none'),
          fontSize: r.grand ? '15px' : '13px',
          fontWeight: r.total || r.sub ? 700 : 400,
          borderBottom: r.grand ? `3px double ${NAVY}` : 'none',
        }}>{money(v)}</td>
      ))}
    </tr>
  )

  return (
    <>
      <Head>
        <title>MNE Trading — Profit &amp; Loss Statement</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}
body{background:#EFECE5;font-family:'Inter',sans-serif;color:${INK};-webkit-font-smoothing:antialiased}
.sheet{max-width:8.5in;margin:24px auto;background:#fff;padding:0.6in 0.7in 0.5in;box-shadow:0 6px 30px rgba(0,0,0,.13)}
.bar{max-width:8.5in;margin:0 auto;display:flex;justify-content:flex-end;gap:10px;padding:0 4px}
.printbtn{font-family:'Inter',sans-serif;font-weight:600;font-size:13px;padding:9px 18px;border:none;border-radius:8px;background:${NAVY};color:#fff;cursor:pointer}
.printbtn:hover{background:#26385C}
.foot{display:none}
@media print{
  html,body{background:#fff}
  .bar{display:none}
  .sheet{box-shadow:none;margin:0;padding:0;max-width:none}
  .pagebreak{break-before:page;page-break-before:always;margin-top:0 !important}
  .foot{display:block}
}
@page{size:letter;margin:0.6in 0.7in}`}</style>
      </Head>

      <div className="bar">
        <button className="printbtn" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <div className="sheet">
        {/* Letterhead */}
        <div style={{ borderBottom: `2px solid ${NAVY}`, paddingBottom: '14px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px', color: NAVY, lineHeight: 1 }}>
                MNE TRADING<span style={{ color: GOLD }}>.</span>
              </div>
              <div style={{ fontSize: '12px', color: MUTED, marginTop: '5px' }}>
                Wholesale importer — branded watches &amp; eyewear
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: MUTED, lineHeight: 1.7 }}>
              <div>Prepared {PREPARED}</div>
              <div>Books maintained by JK No Jokes Financials</div>
            </div>
          </div>
        </div>

        <div style={{ margin: '22px 0 6px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.2px' }}>Statement of Profit and Loss</h1>
          <div style={{ fontSize: '13px', color: MUTED, marginTop: '3px' }}>
            Year to date January 1 – June 30, 2026, with trailing twelve months July 1, 2025 – June 30, 2026
          </div>
        </div>

        {/* Statement */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '18px' }}>
          <thead>
            <tr>
              <th style={{ ...colHead, textAlign: 'left', paddingLeft: '2px' }}>&nbsp;</th>
              <th style={{ ...colHead, paddingLeft: '30px' }}>YTD 2026<br /><span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>Jan 1 – Jun 30</span></th>
              <th style={{ ...colHead, paddingLeft: '30px' }}>Trailing 12 mo.<br /><span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>Jul 2025 – Jun 2026</span></th>
            </tr>
          </thead>
          <tbody>{LINES.map((r, i) => <Row key={i} r={r} />)}</tbody>
        </table>

        <div style={{ display: 'flex', gap: '10px', marginTop: '22px', flexWrap: 'wrap' }}>
          {[
            { k: 'Gross margin — YTD 2026', v: pct(YTD_2026.margin) },
            { k: 'Gross margin — 12 months', v: pct(TTM.margin) },
            { k: 'Avg. monthly net income', v: money(TTM.gp / 12) },
          ].map(s => (
            <div key={s.k} style={{ flex: 1, minWidth: '150px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED }}>{s.k}</div>
              <div style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 600, color: NAVY, marginTop: '4px' }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Certification */}
        <div style={{ marginTop: '26px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px' }}>
          <div style={{ fontSize: '11.5px', lineHeight: 1.6, color: '#3A3A4A' }}>
            I certify that the information set forth in this profit and loss statement is true,
            accurate and complete to the best of my knowledge, and that it fairly reflects the
            income and expenses of MNE Trading for the periods shown.
          </div>
          <div style={{ display: 'flex', gap: '28px', marginTop: '30px', flexWrap: 'wrap' }}>
            {['Owner signature', 'Print name', 'Date'].map((l, i) => (
              <div key={l} style={{ flex: i === 0 ? 2 : 1, minWidth: '150px' }}>
                <div style={{ borderBottom: `1px solid ${INK}`, height: '1px' }} />
                <div style={{ fontSize: '10px', color: MUTED, marginTop: '5px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '28px', marginTop: '26px', flexWrap: 'wrap' }}>
            {['Business address', 'EIN / Tax ID'].map(l => (
              <div key={l} style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ borderBottom: `1px solid ${BORDER}`, height: '1px' }} />
                <div style={{ fontSize: '10px', color: MUTED, marginTop: '5px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="foot" style={{ marginTop: '26px', fontSize: '10px', color: MUTED, textAlign: 'center' }}>
          MNE Trading — Statement of Profit and Loss — prepared {PREPARED} — page 1 of 2
        </div>

        {/* Monthly schedule */}
        <div className="pagebreak" style={{ marginTop: '30px', paddingTop: '2px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>Schedule 1 — Monthly detail</div>
          <div style={{ fontSize: '11px', color: MUTED, marginBottom: '10px' }}>Twelve months ended June 30, 2026</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', breakInside: 'avoid' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Month', 'Revenue', 'Cost of goods sold', 'Gross profit', 'Margin'].map(h => (
                  <th key={h} style={{ ...colHead, padding: '0 0 7px', textAlign: h === 'Month' ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTH_PL.map((m, i) => (
                <tr key={m.label} style={{ borderTop: i ? `1px solid ${RULE}` : 'none' }}>
                  <td style={{ padding: '6px 0' }}>{m.label}</td>
                  <td style={{ ...num, padding: '6px 0' }}>{money(m.rev)}</td>
                  <td style={{ ...num, padding: '6px 0', color: MUTED }}>{money(m.cogs)}</td>
                  <td style={{ ...num, padding: '6px 0', fontWeight: 600 }}>{money(m.rev - m.cogs)}</td>
                  <td style={{ ...num, padding: '6px 0', color: MUTED }}>{pct((m.rev - m.cogs) / m.rev)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: '9px 0', fontWeight: 700 }}>Total — 12 months</td>
                <td style={{ ...num, padding: '9px 0', fontWeight: 700 }}>{money(TTM.rev)}</td>
                <td style={{ ...num, padding: '9px 0', fontWeight: 700 }}>{money(TTM.cogs)}</td>
                <td style={{ ...num, padding: '9px 0', fontWeight: 700 }}>{money(TTM.gp)}</td>
                <td style={{ ...num, padding: '9px 0', fontWeight: 700 }}>{pct(TTM.margin)}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: MUTED }}>Of which: calendar 2025 (Jul–Dec)</td>
                <td style={{ ...num, padding: '6px 0', color: MUTED }}>{money(H2_2025.rev)}</td>
                <td style={{ ...num, padding: '6px 0', color: MUTED }}>{money(H2_2025.cogs)}</td>
                <td style={{ ...num, padding: '6px 0', color: MUTED }}>{money(H2_2025.gp)}</td>
                <td style={{ ...num, padding: '6px 0', color: MUTED }}>{pct(H2_2025.margin)}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: MUTED }}>Of which: calendar 2026 (Jan–Jun)</td>
                <td style={{ ...num, padding: '6px 0', color: MUTED }}>{money(YTD_2026.rev)}</td>
                <td style={{ ...num, padding: '6px 0', color: MUTED }}>{money(YTD_2026.cogs)}</td>
                <td style={{ ...num, padding: '6px 0', color: MUTED }}>{money(YTD_2026.gp)}</td>
                <td style={{ ...num, padding: '6px 0', color: MUTED }}>{pct(YTD_2026.margin)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes */}
        <div style={{ marginTop: '22px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Notes to the statement</div>
          <ol style={{ paddingLeft: '18px', fontSize: '11.5px', color: '#3A3A4A', lineHeight: 1.65 }}>
            <li style={{ marginBottom: '5px' }}>
              <b>Basis of presentation.</b> Prepared on the accrual basis from the company&apos;s
              purchase order, supplier bill and customer invoice records. Revenue is recorded when
              merchandise is invoiced to the customer; cost of goods sold is recorded when the
              related purchase order is received and billed. These statements are unaudited and
              have not been reviewed or compiled under AICPA standards.
            </li>
            <li style={{ marginBottom: '5px' }}>
              <b>Period.</b> June 30, 2026 is the most recent closed month. July and August 2026
              are still open and are excluded.
            </li>
            <li style={{ marginBottom: '5px' }}>
              <b>Cost of goods sold.</b> Reflects the merchandise cost of goods received.
              Freight, duty and delivery charges of {money(LANDED_NOT_IN_COGS)} recorded against
              June 2026 arrivals are carried on the underlying purchase orders and are not
              included in the amounts above. Merchandise invoiced in June 2026 includes orders
              sold against shipments still in transit at June 30; the cost of those goods is
              recorded when the shipment is received, which raises the June gross margin
              relative to prior months.
            </li>
            <li style={{ marginBottom: '5px' }}>
              <b>Operating expenses.</b> No operating expenses (rent, insurance, vehicle,
              telephone, professional fees, bank and merchant charges, or owner compensation)
              are recorded in the accounting records for the periods presented. Net income
              therefore equals gross profit. Amounts paid personally by the owner on behalf of
              the business, if any, are not reflected.
            </li>
            <li>
              <b>Owner draws.</b> Distributions to the owner are equity transactions and do not
              appear on this statement.
            </li>
          </ol>
        </div>

        <div style={{ marginTop: '14px', fontSize: '10px', color: MUTED, textAlign: 'center' }}>
          MNE Trading — Statement of Profit and Loss — prepared {PREPARED} — page 2 of 2
        </div>
      </div>
    </>
  )
}

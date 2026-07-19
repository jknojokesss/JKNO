import Head from 'next/head'

// Standalone type/palette preview — dark industrial "shop ledger". Unlinked.
const C = {
  bg: '#0C0C0D', panel: '#141517', side: '#17181B', bar: '#0A0A0B',
  border: '#282A2E', line: '#202226', text: '#E9E7E2', sub: '#8B877C', muted: '#5E5B54',
  red: '#DE3B2F', green: '#57B58A',
}
const head = "'Barlow Semi Condensed', sans-serif"
const ui = "'Inter', sans-serif"
const mono = "'IBM Plex Mono', monospace"

const KPI = ({ label, value, sub, subColor, primary }) => (
  <div style={{ flex: 1, minWidth: 160, background: C.panel, borderLeft: `2px solid ${primary ? C.red : C.border}`, borderTop: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: '14px 16px' }}>
    <div style={{ fontFamily: head, fontSize: 11, color: C.sub, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontFamily: mono, fontSize: 26, color: C.text, fontWeight: 600, marginTop: 9, letterSpacing: '-0.02em' }}>{value}</div>
    {sub && <div style={{ fontFamily: mono, fontSize: 11, color: subColor || C.muted, marginTop: 7 }}>{sub}</div>}
  </div>
)

const Row = ({ label, val, indent, strong, green, top }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: strong ? '9px 2px' : '6px 2px', paddingLeft: indent ? 18 : 2, borderTop: top ? `1px solid ${C.line}` : 'none' }}>
    <span style={{ fontFamily: ui, fontSize: strong ? 13 : 12.5, color: strong ? C.text : C.sub, fontWeight: strong ? 600 : 400 }}>{label}</span>
    <span style={{ fontFamily: mono, fontSize: strong ? 13 : 12.5, color: green ? C.green : C.text, fontWeight: 500 }}>{val}</span>
  </div>
)

export default function StylePreview() {
  return (
    <>
      <Head>
        <title>Reydel — shop ledger</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" />
      </Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>

        {/* Sidebar — steel, red spine */}
        <aside style={{ width: 208, background: C.side, borderRight: `1px solid ${C.border}`, boxShadow: `inset -3px 0 0 ${C.red}`, padding: '20px 15px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ width: 32, height: 32, background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: head, fontWeight: 700, fontSize: 19, color: '#fff' }}>R</span>
            <div>
              <div style={{ fontFamily: head, fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>REYDEL</div>
              <div style={{ fontFamily: head, fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: '0.3em', marginTop: 3 }}>TIRE &amp; AUTO</div>
            </div>
          </div>
          <div style={{ height: 1, background: C.border, margin: '16px 0' }} />
          {['Dashboard', 'Financials', 'Sales & Items', 'Orders', 'Stock'].map((n, i) => (
            <div key={n} style={{ fontFamily: head, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: i === 0 ? '#fff' : C.sub, padding: '10px 10px', background: i === 0 ? 'rgba(222,59,47,.12)' : 'transparent', borderLeft: i === 0 ? `2px solid ${C.red}` : '2px solid transparent', fontWeight: i === 0 ? 600 : 500 }}>{n}</div>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Status bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bar, borderBottom: `1px solid ${C.border}`, padding: '13px 30px' }}>
            <div style={{ fontFamily: head, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Business Overview</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.sub, display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ color: C.green }}>● LIVE</span>
              <span>THROUGH JUN 2026</span>
            </div>
          </div>

          <div style={{ padding: '26px 30px', maxWidth: 1000 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 26 }}>
              <KPI primary label="Revenue · Jun" value="$75,090" sub="▲ 48% VS MAY" subColor={C.green} />
              <KPI label="Gross profit" value="$53,907" sub="71.8% MARGIN" />
              <KPI label="Net profit" value="$39,204" sub="52.2% MARGIN" />
              <KPI label="Revenue YTD" value="$281,792" sub="6 MO · $114,776 PROFIT" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
              {/* Mini P&L */}
              <div style={{ background: C.panel, border: `1px solid ${C.line}`, padding: '18px 20px' }}>
                <div style={{ fontFamily: head, fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 10, borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>Profit &amp; Loss — June</div>
                <div style={{ fontFamily: head, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.14em', margin: '12px 0 2px' }}>INCOME</div>
                <Row label="Clover Sales" val="$73,450" indent />
                <Row label="Sales Income" val="$1,640" indent />
                <Row label="Total Income" val="$75,090" strong top />
                <div style={{ fontFamily: head, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.14em', margin: '12px 0 2px' }}>COST OF GOODS SOLD</div>
                <Row label="Cost of Goods Sold" val="($21,183)" indent />
                <Row label="Gross Profit" val="$53,907" strong green top />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '13px 12px', background: 'rgba(87,181,138,.08)', borderLeft: `2px solid ${C.green}` }}>
                  <span style={{ fontFamily: head, fontSize: 14, fontWeight: 700, color: C.green, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Net Income</span>
                  <span style={{ fontFamily: mono, fontSize: 21, fontWeight: 600, color: C.green }}>$39,204</span>
                </div>
              </div>

              {/* Monthly */}
              <div style={{ background: C.panel, border: `1px solid ${C.line}`, padding: '18px 20px' }}>
                <div style={{ fontFamily: head, fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 10, borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>Profit by Month</div>
                {[['MAR', '$21,074', '41.9%'], ['APR', '$12,676', '35.2%'], ['MAY', '$17,972', '35.5%'], ['JUN', '$39,204', '52.2%']].map(([m, p, mg], i) => (
                  <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 2px', borderTop: i ? `1px solid ${C.line}` : 'none' }}>
                    <span style={{ fontFamily: mono, fontSize: 12, color: C.sub, letterSpacing: '0.05em' }}>{m} 2026</span>
                    <span style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
                      <span style={{ fontFamily: mono, fontSize: 13, color: C.green, fontWeight: 500 }}>{p}</span>
                      <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, width: 46, textAlign: 'right' }}>{mg}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Specimen */}
            <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div><div style={{ fontFamily: head, fontSize: 26, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Barlow Condensed</div><div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 2 }}>Headlines · brand · titles</div></div>
              <div><div style={{ fontFamily: ui, fontSize: 22, fontWeight: 500, color: C.text }}>Inter — interface</div><div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 2 }}>Labels · rows · body</div></div>
              <div><div style={{ fontFamily: mono, fontSize: 22, fontWeight: 500, color: C.text }}>$1,234,567.89</div><div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 2 }}>IBM Plex Mono · all figures</div></div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

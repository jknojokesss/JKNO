import Head from 'next/head'

// Standalone, unauthenticated type/palette preview — not linked in nav.
const C = {
  cream: '#F5F0E4', card: '#FFFFFF', ink: '#1B1917', sub: '#6B6357',
  muted: '#A79E8C', hair: '#E6DDCB', red: '#B0281C', green: '#15794A',
  sidebar: '#1B1712',
}
const head = "'Barlow Semi Condensed', sans-serif"
const ui = "'Inter', sans-serif"
const mono = "'IBM Plex Mono', monospace"

const KPI = ({ label, value, sub, subColor, rule }) => (
  <div style={{ flex: 1, minWidth: 160, background: C.card, border: `1px solid ${C.hair}`, borderTop: rule ? `2px solid ${C.red}` : `1px solid ${C.hair}`, padding: '15px 17px' }}>
    <div style={{ fontFamily: ui, fontSize: 11, color: C.sub, fontWeight: 500 }}>{label}</div>
    <div style={{ fontFamily: mono, fontSize: 25, color: C.ink, fontWeight: 600, marginTop: 8, letterSpacing: '-0.01em' }}>{value}</div>
    {sub && <div style={{ fontFamily: ui, fontSize: 11, color: subColor || C.muted, marginTop: 6 }}>{sub}</div>}
  </div>
)

const Line = ({ label, val, indent, strong, green, top }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: strong ? '9px 4px' : '6px 4px', paddingLeft: indent ? 20 : 4, borderTop: top ? `1px solid ${C.hair}` : 'none' }}>
    <span style={{ fontFamily: ui, fontSize: strong ? 13 : 12.5, color: strong ? C.ink : C.sub, fontWeight: strong ? 600 : 400 }}>{label}</span>
    <span style={{ fontFamily: mono, fontSize: strong ? 13 : 12.5, color: green ? C.green : C.ink, fontWeight: strong ? 600 : 500 }}>{val}</span>
  </div>
)

export default function StylePreview() {
  return (
    <>
      <Head>
        <title>Reydel — type preview</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;500;600;700&display=swap" />
      </Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: C.cream }}>

        {/* Sidebar */}
        <aside style={{ width: 210, background: C.sidebar, padding: '22px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26 }}>
            <span style={{ width: 30, height: 30, background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: head, fontWeight: 700, fontSize: 18, color: '#fff' }}>R</span>
            <div>
              <div style={{ fontFamily: head, fontSize: 19, fontWeight: 700, color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>REYDEL</div>
              <div style={{ fontFamily: head, fontSize: 10, fontWeight: 500, color: '#8C8271', letterSpacing: '0.28em', marginTop: 3 }}>TIRE &amp; AUTO</div>
            </div>
          </div>
          {['Dashboard', 'Financials', 'Sales & Items', 'Orders', 'Stock'].map((n, i) => (
            <div key={n} style={{ fontFamily: ui, fontSize: 12.5, color: i === 0 ? '#fff' : '#8C8271', padding: '9px 11px', background: i === 0 ? 'rgba(255,255,255,.06)' : 'transparent', borderLeft: i === 0 ? `2px solid ${C.red}` : '2px solid transparent', fontWeight: 500 }}>{n}</div>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '30px 34px', maxWidth: 1020 }}>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: head, fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: '0.01em' }}>Business Overview</div>
            <div style={{ fontFamily: ui, fontSize: 12.5, color: C.muted, marginTop: 3 }}>Reydel Tire &amp; Auto · financials through June 2026</div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 26 }}>
            <KPI rule label="Revenue · June" value="$75,090" sub="▲ 48% vs May" subColor={C.green} />
            <KPI label="Gross profit · June" value="$53,907" sub="71.8% margin" />
            <KPI label="Net profit · June" value="$39,204" sub="52.2% margin" />
            <KPI label="Revenue · YTD" value="$281,792" sub="6 mo · $114,776 profit" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Mini P&L */}
            <div style={{ background: C.card, border: `1px solid ${C.hair}`, padding: '20px 22px' }}>
              <div style={{ fontFamily: head, fontSize: 17, fontWeight: 700, color: C.ink, letterSpacing: '0.02em', paddingBottom: 10, borderBottom: `1px solid ${C.hair}`, marginBottom: 6 }}>Profit &amp; Loss — June</div>
              <div style={{ fontFamily: head, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.1em', margin: '12px 0 2px' }}>INCOME</div>
              <Line label="Clover Sales" val="$73,450" indent />
              <Line label="Sales Income" val="$1,640" indent />
              <Line label="Total Income" val="$75,090" strong top />
              <div style={{ fontFamily: head, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.1em', margin: '12px 0 2px' }}>COST OF GOODS SOLD</div>
              <Line label="Cost of Goods Sold" val="($21,183)" indent />
              <Line label="Gross Profit" val="$53,907" strong green top />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '13px 12px', background: '#F1F6F1', border: `1px solid #CDE3D3` }}>
                <span style={{ fontFamily: head, fontSize: 14, fontWeight: 700, color: C.green, letterSpacing: '0.04em' }}>NET INCOME</span>
                <span style={{ fontFamily: mono, fontSize: 20, fontWeight: 600, color: C.green }}>$39,204</span>
              </div>
            </div>

            {/* Monthly table */}
            <div style={{ background: C.card, border: `1px solid ${C.hair}`, padding: '20px 22px' }}>
              <div style={{ fontFamily: head, fontSize: 17, fontWeight: 700, color: C.ink, letterSpacing: '0.02em', paddingBottom: 10, borderBottom: `1px solid ${C.hair}`, marginBottom: 8 }}>Profit by month</div>
              {[['March', '$21,074', '41.9%'], ['April', '$12,676', '35.2%'], ['May', '$17,972', '35.5%'], ['June', '$39,204', '52.2%']].map(([m, p, mg], i) => (
                <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 4px', borderTop: i ? `1px solid ${C.hair}` : 'none' }}>
                  <span style={{ fontFamily: ui, fontSize: 12.5, color: C.ink, fontWeight: 500 }}>{m}</span>
                  <span style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                    <span style={{ fontFamily: mono, fontSize: 12.5, color: C.green, fontWeight: 500 }}>{p}</span>
                    <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, width: 46, textAlign: 'right' }}>{mg}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Specimen footer */}
          <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${C.hair}`, display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <div><div style={{ fontFamily: head, fontSize: 26, fontWeight: 700, color: C.ink }}>Barlow Semi Condensed</div><div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 2 }}>Headlines · brand · section titles</div></div>
            <div><div style={{ fontFamily: ui, fontSize: 22, fontWeight: 500, color: C.ink }}>Inter — interface text</div><div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 2 }}>Labels, rows, body</div></div>
            <div><div style={{ fontFamily: mono, fontSize: 22, fontWeight: 500, color: C.ink }}>$1,234,567.89</div><div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 2 }}>IBM Plex Mono · all figures</div></div>
          </div>
        </main>
      </div>
    </>
  )
}

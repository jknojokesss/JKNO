import Head from 'next/head'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

// Standalone preview — "printed briefing" on warm paper. Hero stat + sentence
// + real statement, no stat-card grid, sharp rules not shadow-boxes. Unlinked.
const C = {
  paper: '#F2F0EA', ink: '#1B1815', sub: '#6A655C', muted: '#9A9284',
  hair: '#DBD5C7', line: '#E6E1D6', side: '#1E1C19', red: '#B0281C', green: '#1C7A4E',
}
const head = "'Barlow Semi Condensed', sans-serif"
const ui = "'Inter', sans-serif"
const mono = "'IBM Plex Mono', monospace"

const Row = ({ label, val, indent, strong, green, top }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: strong ? '9px 2px' : '6px 2px', paddingLeft: indent ? 18 : 2, borderTop: top ? `1px solid ${C.line}` : 'none' }}>
    <span style={{ fontFamily: ui, fontSize: strong ? 13 : 12.5, color: strong ? C.ink : C.sub, fontWeight: strong ? 600 : 400 }}>{label}</span>
    <span style={{ fontFamily: mono, fontSize: strong ? 13 : 12.5, color: green ? C.green : C.ink, fontWeight: 500 }}>{val}</span>
  </div>
)

export default function StylePreview() {
  const trend = [
    { m: 'JAN', rev: 40, exp: 26, profit: 14 }, { m: 'FEB', rev: 30, exp: 20, profit: 10 },
    { m: 'MAR', rev: 50, exp: 29, profit: 21 }, { m: 'APR', rev: 36, exp: 23, profit: 13 },
    { m: 'MAY', rev: 51, exp: 33, profit: 18 }, { m: 'JUN', rev: 75, exp: 36, profit: 39 },
  ]
  return (
    <>
      <Head>
        <title>Reydel — briefing</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" />
      </Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: C.paper }}>

        {/* Sidebar — graphite, red spine */}
        <aside style={{ width: 208, background: C.side, boxShadow: `inset -3px 0 0 ${C.red}`, padding: '20px 15px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ width: 32, height: 32, background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: head, fontWeight: 700, fontSize: 19, color: '#fff' }}>R</span>
            <div>
              <div style={{ fontFamily: head, fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>REYDEL</div>
              <div style={{ fontFamily: head, fontSize: 10, fontWeight: 500, color: '#7C766B', letterSpacing: '0.3em', marginTop: 3 }}>TIRE &amp; AUTO</div>
            </div>
          </div>
          <div style={{ height: 1, background: '#33302B', margin: '16px 0' }} />
          {['Dashboard', 'Financials', 'Sales & Items', 'Orders', 'Stock'].map((n, i) => (
            <div key={n} style={{ fontFamily: head, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: i === 0 ? '#fff' : '#948D81', padding: '10px 10px', background: i === 0 ? 'rgba(176,40,28,.16)' : 'transparent', borderLeft: i === 0 ? `2px solid ${C.red}` : '2px solid transparent', fontWeight: i === 0 ? 600 : 500 }}>{n}</div>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.hair}`, padding: '12px 34px' }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: '0.06em' }}>REYDEL TIRE &amp; AUTO · LAKEWOOD, NJ</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.green }}>● LIVE · JUN 2026</div>
          </div>

          <div style={{ padding: '34px 34px', maxWidth: 1000 }}>

            {/* HERO */}
            <div style={{ fontFamily: head, fontSize: 13, fontWeight: 600, color: C.red, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Net Profit · June 2026</div>
            <div style={{ fontFamily: head, fontSize: 82, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1, margin: '6px 0 12px' }}>$39,204</div>
            <div style={{ fontFamily: ui, fontSize: 16, color: C.sub, maxWidth: 620, lineHeight: 1.5 }}>
              Reydel's strongest month on record — <span style={{ color: C.ink, fontWeight: 500 }}>$75,090 in sales, up 48% over May</span>, at a 52% net margin. Tires drove 72% of it; brakes and service the rest.
            </div>

            {/* Inline stat strip — rules, not boxes */}
            <div style={{ display: 'flex', marginTop: 24, borderTop: `1px solid ${C.hair}`, borderBottom: `1px solid ${C.hair}` }}>
              {[['Revenue', '$75,090'], ['Gross profit', '$53,907'], ['Tickets', '630'], ['Avg ticket', '$119'], ['Tires sold', '486']].map(([l, v], i) => (
                <div key={l} style={{ flex: 1, padding: '14px 18px', borderLeft: i ? `1px solid ${C.line}` : 'none' }}>
                  <div style={{ fontFamily: ui, fontSize: 11, color: C.muted }}>{l}</div>
                  <div style={{ fontFamily: mono, fontSize: 17, color: C.ink, fontWeight: 500, marginTop: 5 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 28, marginTop: 30 }}>
              <div>
                <div style={{ fontFamily: head, fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 8, borderBottom: `1px solid ${C.hair}`, marginBottom: 4 }}>Profit &amp; Loss — June</div>
                <div style={{ fontFamily: head, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.14em', margin: '12px 0 2px' }}>INCOME</div>
                <Row label="Clover Sales" val="$73,450" indent />
                <Row label="Sales Income" val="$1,640" indent />
                <Row label="Total Income" val="$75,090" strong top />
                <div style={{ fontFamily: head, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.14em', margin: '14px 0 2px' }}>COST OF GOODS SOLD</div>
                <Row label="Cost of Goods Sold" val="($21,183)" indent />
                <Row label="Gross Profit" val="$53,907" strong green top />
                <div style={{ fontFamily: head, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.14em', margin: '14px 0 2px' }}>OPERATING EXPENSES</div>
                <Row label="Payroll, rent, utilities…" val="($14,703)" indent />
                <Row label="Net Income" val="$39,204" strong green top />
              </div>

              <div>
                <div style={{ fontFamily: head, fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 8, borderBottom: `1px solid ${C.hair}`, marginBottom: 10 }}>Revenue, Expenses &amp; Profit</div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                  {[[C.red, 'Revenue'], ['#C7BFB0', 'Expenses'], [C.green, 'Profit']].map(([c, l]) => (
                    <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: ui, fontSize: 10, color: C.sub }}>
                      <span style={{ width: 8, height: 8, background: c, display: 'inline-block' }} />{l}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={trend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barGap={2} barCategoryGap="26%">
                    <CartesianGrid strokeDasharray="2 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 10, fill: C.muted, fontFamily: mono }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: C.muted, fontFamily: mono }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}K`} />
                    <Bar dataKey="rev" name="Revenue" fill={C.red} />
                    <Bar dataKey="exp" name="Expenses" fill="#C7BFB0" />
                    <Line dataKey="profit" name="Profit" stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Specimen */}
            <div style={{ marginTop: 34, paddingTop: 18, borderTop: `1px solid ${C.hair}`, display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div><div style={{ fontFamily: head, fontSize: 24, fontWeight: 700, color: C.ink, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Barlow Condensed</div><div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 2 }}>Headlines · hero · titles</div></div>
              <div><div style={{ fontFamily: ui, fontSize: 20, fontWeight: 500, color: C.ink }}>Inter — prose &amp; labels</div><div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 2 }}>The sentences that read human</div></div>
              <div><div style={{ fontFamily: mono, fontSize: 20, fontWeight: 500, color: C.ink }}>$1,234,567</div><div style={{ fontFamily: ui, fontSize: 11, color: C.muted, marginTop: 2 }}>IBM Plex Mono · figures</div></div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

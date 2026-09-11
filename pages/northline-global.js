import { useState } from 'react'
import Head from 'next/head'
import { DEMO_UI, DEMO_HEAD, DEMO_MONO, DEMO_FONT_LINK } from '../lib/demoFonts'

const BIZ = 'Northline Global'
const SIDEBAR = '#1A1C19', ACCENT = '#C9A84C', BG = '#F2F0EA', BORDER = '#D8D4CC'
const INK = '#1B1815', MUTED = '#6B6560', GREEN = '#2D6A4F', RED = '#B0281C', AMBER = '#B8860B'

const money = (n) => '$' + Math.round(n).toLocaleString()
const fmtD = (s) => new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const NAV = [
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'pos', label: 'Purchase orders' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'orders', label: 'Orders' },
]

const PIPELINE = [
  { id: 'PO-2841', vendor: 'Shenzhen Apex', status: 'In transit', eta: '2026-06-18', value: 48200, landed: 52840, stage: 3 },
  { id: 'PO-2836', vendor: 'Guangzhou Bright', status: 'At port', eta: '2026-06-12', value: 31400, landed: 34680, stage: 4 },
  { id: 'PO-2830', vendor: 'Ningbo Home Co', status: 'Customs hold', eta: '2026-06-08', value: 22100, landed: 24800, stage: 4 },
  { id: 'PO-2825', vendor: 'Shenzhen Apex', status: 'Received', eta: '2026-05-28', value: 55600, landed: 61160, stage: 5 },
  { id: 'PO-2819', vendor: 'Dongguan Pack', status: 'Draft', eta: '—', value: 18900, landed: 20800, stage: 1 },
]

const STAGES = ['Draft', 'Ordered', 'Shipped', 'In transit', 'At port', 'Received']

const INVENTORY = [
  { sku: 'NL-4420', name: 'Ceramic planter set (3pc)', onHand: 840, allocated: 120, bin: 'A-12-03', value: 16800 },
  { sku: 'NL-3318', name: 'LED desk lamp — matte black', onHand: 2200, allocated: 340, bin: 'B-04-11', value: 28600 },
  { sku: 'NL-2291', name: 'Bamboo cutting board 18"', onHand: 1560, allocated: 0, bin: 'A-08-02', value: 9360 },
  { sku: 'NL-1187', name: 'Stainless kitchen scale', onHand: 420, allocated: 80, bin: 'C-02-07', value: 5040 },
  { sku: 'NL-5502', name: 'Woven storage basket — large', onHand: 680, allocated: 200, bin: 'B-09-01', value: 8160 },
]

const ORDERS = [
  { id: 'SO-8821', customer: 'Urban Home Co', date: '2026-06-04', lines: 4, total: 8420, margin: 28.4, status: 'Picking' },
  { id: 'SO-8818', customer: 'Lakeside Retail', date: '2026-06-03', lines: 2, total: 3180, margin: 31.2, status: 'Shipped' },
  { id: 'SO-8814', customer: 'Main St Mercantile', date: '2026-06-02', lines: 6, total: 12400, margin: 24.8, status: 'Invoiced' },
  { id: 'SO-8809', customer: 'Coastal Living', date: '2026-06-01', lines: 3, total: 5640, margin: 29.1, status: 'Paid' },
]

const inTransit = PIPELINE.filter((p) => p.stage >= 3 && p.stage < 5).reduce((s, p) => s + p.landed, 0)
const inventoryVal = INVENTORY.reduce((s, i) => s + i.value, 0)

export default function NorthlineGlobal() {
  const [tab, setTab] = useState('pipeline')
  const [binSearch, setBinSearch] = useState('')

  const hcell = { padding: '7px 12px', fontSize: '9px', color: MUTED, background: '#EAE6DE', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: `1px solid ${BORDER}`, fontFamily: DEMO_UI }
  const cell = (extra = {}) => ({ padding: '10px 12px', borderBottom: `1px solid #E8E4DC`, color: INK, fontSize: '13px', fontFamily: DEMO_UI, ...extra })

  const Kpi = ({ k, v, sub, color }) => (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px', flex: 1, minWidth: '140px' }}>
      <div style={{ fontFamily: DEMO_MONO, fontSize: '9px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{k}</div>
      <div style={{ fontFamily: DEMO_HEAD, fontSize: '26px', fontWeight: 600, color: color || INK, lineHeight: 1 }}>{v}</div>
      {sub && <div style={{ fontFamily: DEMO_MONO, fontSize: '10px', color: MUTED, marginTop: '4px' }}>{sub}</div>}
    </div>
  )

  const stageColor = (stage) => {
    if (stage >= 5) return GREEN
    if (stage === 4) return AMBER
    if (stage >= 2) return ACCENT
    return MUTED
  }

  const filteredInv = binSearch
    ? INVENTORY.filter((i) => i.bin.toLowerCase().includes(binSearch.toLowerCase()) || i.sku.toLowerCase().includes(binSearch.toLowerCase()) || i.name.toLowerCase().includes(binSearch.toLowerCase()))
    : INVENTORY

  return (
    <>
      <Head>
        <title>{BIZ} — Import & Distribution Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href={DEMO_FONT_LINK} rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:${DEMO_UI};background:${BG};color:${INK}}
        .shell{display:flex;min-height:100vh}
        .side{width:210px;flex-shrink:0;background:${SIDEBAR};display:flex;flex-direction:column;padding:22px 12px;position:sticky;top:0;height:100vh;overflow-y:auto}
        .main{flex:1;min-width:0;padding:28px 32px 60px;overflow-y:auto}
        .nbtn{display:block;width:100%;text-align:left;padding:9px 13px;border-radius:7px;border:none;background:transparent;color:#9a9590;font-family:${DEMO_UI};font-size:13px;font-weight:500;cursor:pointer;margin-bottom:2px}
        .nbtn:hover{background:rgba(255,255,255,.06);color:#ddd}
        .nbtn.on{background:rgba(255,255,255,.08);color:#fff;box-shadow:inset 3px 0 0 ${ACCENT}}
        .kpi-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
        .stage-bar{display:flex;gap:3px;margin-top:6px}
        .stage-dot{flex:1;height:4px;border-radius:2px;background:#E0DCD4}
        .stage-dot.on{background:${ACCENT}}
        .mobilenav{display:none}
        input.bin-search{width:100%;max-width:280px;padding:9px 12px;border:1px solid ${BORDER};border-radius:6px;font-family:${DEMO_UI};font-size:13px;background:#fff;margin-bottom:14px}
        @media(max-width:700px){
          .side{display:none}
          .main{padding:16px 14px 48px}
          .mobilenav{display:flex;overflow-x:auto;gap:2px;padding:8px 10px;background:${SIDEBAR};position:sticky;top:0;z-index:9;-webkit-overflow-scrolling:touch}
          .mobilenav button{flex-shrink:0;border:none;background:transparent;color:#9a9590;font-family:${DEMO_UI};font-size:12px;font-weight:500;padding:8px 12px;border-radius:6px;cursor:pointer;white-space:nowrap}
          .mobilenav button.on{background:rgba(255,255,255,.1);color:#fff;box-shadow:inset 0 -2px 0 ${ACCENT}}
        }
      `}</style>

      <div className="mobilenav">
        {NAV.map((n) => (
          <button key={n.id} type="button" className={tab === n.id ? 'on' : ''} onClick={() => setTab(n.id)}>{n.label}</button>
        ))}
      </div>

      <div className="shell">
        <aside className="side">
          <div style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: '16px' }}>
            <div style={{ fontFamily: DEMO_HEAD, fontSize: '17px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Northline<br />Global</div>
            <div style={{ fontFamily: DEMO_MONO, fontSize: '9px', color: ACCENT, letterSpacing: '.16em', marginTop: '5px' }}>IMPORT & DISTRIBUTION</div>
          </div>
          <nav style={{ flex: 1 }}>
            {NAV.map((n) => (
              <button key={n.id} className={`nbtn${tab === n.id ? ' on' : ''}`} onClick={() => setTab(n.id)}>{n.label}</button>
            ))}
          </nav>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: '14px', fontFamily: DEMO_MONO, fontSize: '9px', color: '#6a6560', lineHeight: 1.7 }}>
            SAMPLE PORTAL<br /><span style={{ color: ACCENT }}>JK No Jokes Financials</span>
          </div>
        </aside>

        <main className="main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: DEMO_MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase' }}>June 2026</div>
              <div style={{ fontFamily: DEMO_HEAD, fontSize: '22px', fontWeight: 600 }}>{NAV.find((n) => n.id === tab)?.label}</div>
            </div>
            <div style={{ fontFamily: DEMO_MONO, fontSize: '10px', color: MUTED, background: '#E8E4DC', padding: '5px 12px', borderRadius: '20px' }}>Sample · JK No Jokes</div>
          </div>

          {tab === 'pipeline' && (
            <>
              <div className="kpi-row">
                <Kpi k="In transit" v={money(inTransit)} sub="3 POs · landed cost" color={ACCENT} />
                <Kpi k="Open POs" v="5" sub="2 awaiting receipt" />
                <Kpi k="Customs hold" v="1" sub="PO-2830" color={RED} />
              </div>
              <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, marginBottom: '16px', maxWidth: '580px' }}>
                Every container tracked from factory to warehouse — freight, duty, and brokerage rolled into landed cost before goods hit the shelf.
              </p>
              {PIPELINE.map((p) => (
                <div key={p.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 16px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{p.id} · {p.vendor}</div>
                      <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>ETA {p.eta === '—' ? '—' : fmtD(p.eta)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: DEMO_MONO, fontSize: '11px', color: stageColor(p.stage), fontWeight: 600 }}>{p.status}</div>
                      <div style={{ fontFamily: DEMO_MONO, fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>{money(p.landed)} landed</div>
                    </div>
                  </div>
                  <div className="stage-bar">
                    {STAGES.map((_, i) => (
                      <div key={i} className={`stage-dot${i < p.stage ? ' on' : ''}`} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontFamily: DEMO_MONO, fontSize: '9px', color: MUTED }}>
                    <span>Draft</span><span>Received</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === 'pos' && (
            <>
              <div className="kpi-row">
                <Kpi k="PO value (open)" v={money(120600)} sub="ex-factory" />
                <Kpi k="Landed (est.)" v={money(133320)} sub="+10.5% freight & duty" color={ACCENT} />
              </div>
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    <th style={hcell}>PO</th>
                    <th style={hcell}>Vendor</th>
                    <th style={{ ...hcell, textAlign: 'right' }}>Factory</th>
                    <th style={{ ...hcell, textAlign: 'right' }}>Landed</th>
                    <th style={hcell}>Status</th>
                  </tr></thead>
                  <tbody>
                    {PIPELINE.map((p) => (
                      <tr key={p.id}>
                        <td style={cell({ fontWeight: 600, fontFamily: DEMO_MONO })}>{p.id}</td>
                        <td style={cell()}>{p.vendor}</td>
                        <td style={cell({ textAlign: 'right', fontFamily: DEMO_MONO })}>{money(p.value)}</td>
                        <td style={cell({ textAlign: 'right', fontFamily: DEMO_MONO, fontWeight: 600 })}>{money(p.landed)}</td>
                        <td style={cell({ color: stageColor(p.stage), fontWeight: 600, fontSize: '12px' })}>{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'inventory' && (
            <>
              <div className="kpi-row">
                <Kpi k="On hand" v={money(inventoryVal)} sub="5 SKUs · FIFO cost" />
                <Kpi k="Allocated" v="740" sub="units reserved for orders" />
                <Kpi k="Bins" v="12" sub="warehouse zones A–C" />
              </div>
              <input
                className="bin-search"
                type="search"
                placeholder="Find by SKU, product, or bin…"
                value={binSearch}
                onChange={(e) => setBinSearch(e.target.value)}
              />
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    <th style={hcell}>SKU</th>
                    <th style={hcell}>Product</th>
                    <th style={{ ...hcell, textAlign: 'right' }}>On hand</th>
                    <th style={{ ...hcell, textAlign: 'right' }}>Allocated</th>
                    <th style={hcell}>Bin</th>
                  </tr></thead>
                  <tbody>
                    {filteredInv.map((i) => (
                      <tr key={i.sku}>
                        <td style={cell({ fontFamily: DEMO_MONO, fontWeight: 600 })}>{i.sku}</td>
                        <td style={cell()}>{i.name}</td>
                        <td style={cell({ textAlign: 'right', fontFamily: DEMO_MONO })}>{i.onHand.toLocaleString()}</td>
                        <td style={cell({ textAlign: 'right', fontFamily: DEMO_MONO, color: i.allocated ? AMBER : MUTED })}>{i.allocated || '—'}</td>
                        <td style={cell({ fontFamily: DEMO_MONO, color: ACCENT, fontWeight: 600 })}>{i.bin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'orders' && (
            <>
              <div className="kpi-row">
                <Kpi k="Open orders" v="2" sub="picking + packing" />
                <Kpi k="Shipped MTD" v={money(42840)} sub="12 orders" color={GREEN} />
                <Kpi k="Avg margin" v="28.4%" sub="after landed cost" color={ACCENT} />
              </div>
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    <th style={hcell}>Order</th>
                    <th style={hcell}>Customer</th>
                    <th style={hcell}>Date</th>
                    <th style={{ ...hcell, textAlign: 'right' }}>Total</th>
                    <th style={{ ...hcell, textAlign: 'right' }}>Margin</th>
                    <th style={hcell}>Status</th>
                  </tr></thead>
                  <tbody>
                    {ORDERS.map((o) => (
                      <tr key={o.id}>
                        <td style={cell({ fontFamily: DEMO_MONO, fontWeight: 600 })}>{o.id}</td>
                        <td style={cell({ fontWeight: 500 })}>{o.customer}</td>
                        <td style={cell({ color: MUTED })}>{fmtD(o.date)}</td>
                        <td style={cell({ textAlign: 'right', fontFamily: DEMO_MONO, fontWeight: 600 })}>{money(o.total)}</td>
                        <td style={cell({ textAlign: 'right', fontFamily: DEMO_MONO, color: o.margin >= 28 ? GREEN : INK })}>{o.margin}%</td>
                        <td style={cell({ fontWeight: 600, fontSize: '12px', color: o.status === 'Paid' ? GREEN : o.status === 'Picking' ? ACCENT : MUTED })}>{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}

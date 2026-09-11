import { useState } from 'react'
import Head from 'next/head'
import { DEMO_UI, DEMO_HEAD, DEMO_MONO, DEMO_FONT_LINK } from '../lib/demoFonts'

const BIZ = 'Harborfield Residential'
const SIDEBAR = '#1E2A35', ACCENT = '#4A7BA8', BG = '#F4F6F8', BORDER = '#D8DEE6'
const INK = '#1A2430', MUTED = '#5C6B7A', GREEN = '#1E7A4A', RED = '#C0392B', AMBER = '#B8860B'

const money = (n) => '$' + Math.round(n).toLocaleString()
const fmtPct = (n) => n.toFixed(1) + '%'

const NAV = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'delinquent', label: 'Delinquency' },
  { id: 'owners', label: 'Owner statements' },
  { id: 'financials', label: 'Financials' },
]

const PROPERTIES = [
  { name: 'Pine Gardens Apts', units: 24, owner: 'Radcliffe LP', rentRoll: 42800, delinquent: 3400, vacancy: 1, status: 'ok' },
  { name: 'Bayside Court', units: 12, owner: 'Marino Group', rentRoll: 26400, delinquent: 8200, vacancy: 2, status: 'alert' },
  { name: 'Main St mixed-use', units: 8, owner: '88 Main LLC', rentRoll: 19800, delinquent: 2600, vacancy: 0, status: 'ok' },
  { name: 'Cedar Ln homes', units: 9, owner: 'Various', rentRoll: 24600, delinquent: 4200, vacancy: 1, status: 'watch' },
  { name: 'Hooper Ave 4-plex', units: 4, owner: 'T. Vance', rentRoll: 8900, delinquent: 0, vacancy: 0, status: 'ok' },
]

const DELINQUENT = [
  { unit: 'Bayside Court #7', tenant: 'M. Ortega', days: 41, owed: 2850, step: 'Filing prep' },
  { unit: 'Bayside Court #11', tenant: 'K. Walsh', days: 35, owed: 2600, step: 'Notice served' },
  { unit: 'Pine Gardens #14', tenant: 'S. Patel', days: 18, owed: 1700, step: 'Payment plan' },
  { unit: 'Main St #3', tenant: 'L. Chen', days: 9, owed: 1300, step: 'Reminder sent' },
  { unit: 'Cedar Ln — 2 homes', tenant: 'Various', days: 12, owed: 4200, step: 'Reminder sent' },
]

const OWNERS = [
  { name: 'Radcliffe LP', props: 'Pine Gardens · 24 units', collected: 41200, repairs: 4820, feePct: 8 },
  { name: 'Marino Group', props: 'Bayside Court · 12 townhomes', collected: 24800, repairs: 3120, feePct: 8 },
  { name: '88 Main LLC', props: 'Main St mixed-use', collected: 19100, repairs: 1450, feePct: 8 },
  { name: 'T. Vance', props: 'Hooper Ave 4-plex', collected: 8900, repairs: 640, feePct: 9 },
]

const totalRoll = PROPERTIES.reduce((s, p) => s + p.rentRoll, 0)
const totalDelinquent = PROPERTIES.reduce((s, p) => s + p.delinquent, 0)
const totalVacant = PROPERTIES.reduce((s, p) => s + p.vacancy, 0)
const totalDoors = PROPERTIES.reduce((s, p) => s + p.units, 0)

export default function HarborfieldProperties() {
  const [tab, setTab] = useState('portfolio')
  const [expanded, setExpanded] = useState(null)

  const hcell = { padding: '7px 12px', fontSize: '9px', color: MUTED, background: '#EEF2F6', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: `1px solid ${BORDER}`, fontFamily: DEMO_UI }
  const cell = (extra = {}) => ({ padding: '10px 12px', borderBottom: `1px solid #E8EDF2`, color: INK, fontSize: '13px', fontFamily: DEMO_UI, ...extra })

  const Kpi = ({ k, v, sub, color }) => (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px', flex: 1, minWidth: '140px' }}>
      <div style={{ fontFamily: DEMO_MONO, fontSize: '9px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{k}</div>
      <div style={{ fontFamily: DEMO_HEAD, fontSize: '26px', fontWeight: 600, color: color || INK, lineHeight: 1 }}>{v}</div>
      {sub && <div style={{ fontFamily: DEMO_MONO, fontSize: '10px', color: MUTED, marginTop: '4px' }}>{sub}</div>}
    </div>
  )

  return (
    <>
      <Head>
        <title>{BIZ} — Property Management Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href={DEMO_FONT_LINK} rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:${DEMO_UI};background:${BG};color:${INK}}
        .shell{display:flex;min-height:100vh}
        .side{width:210px;flex-shrink:0;background:${SIDEBAR};display:flex;flex-direction:column;padding:22px 12px;position:sticky;top:0;height:100vh;overflow-y:auto}
        .main{flex:1;min-width:0;padding:28px 32px 60px;overflow-y:auto}
        .nbtn{display:block;width:100%;text-align:left;padding:9px 13px;border-radius:7px;border:none;background:transparent;color:#8a9aa8;font-family:${DEMO_UI};font-size:13px;font-weight:500;cursor:pointer;margin-bottom:2px}
        .nbtn:hover{background:rgba(255,255,255,.06);color:#ddd}
        .nbtn.on{background:rgba(255,255,255,.09);color:#fff;box-shadow:inset 3px 0 0 ${ACCENT}}
        .kpi-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
        .mobilenav{display:none}
        @media(max-width:700px){
          .side{display:none}
          .main{padding:16px 14px 48px}
          .mobilenav{display:flex;overflow-x:auto;gap:2px;padding:8px 10px;background:${SIDEBAR};position:sticky;top:0;z-index:9;-webkit-overflow-scrolling:touch}
          .mobilenav button{flex-shrink:0;border:none;background:transparent;color:#8a9aa8;font-family:${DEMO_UI};font-size:12px;font-weight:500;padding:8px 12px;border-radius:6px;cursor:pointer;white-space:nowrap}
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
            <div style={{ fontFamily: DEMO_HEAD, fontSize: '17px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Harborfield<br />Residential</div>
            <div style={{ fontFamily: DEMO_MONO, fontSize: '9px', color: ACCENT, letterSpacing: '.16em', marginTop: '5px' }}>PROPERTY MANAGEMENT</div>
          </div>
          <nav style={{ flex: 1 }}>
            {NAV.map((n) => (
              <button key={n.id} className={`nbtn${tab === n.id ? ' on' : ''}`} onClick={() => setTab(n.id)}>{n.label}</button>
            ))}
          </nav>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: '14px', fontFamily: DEMO_MONO, fontSize: '9px', color: '#5a6a78', lineHeight: 1.7 }}>
            SAMPLE PORTAL<br /><span style={{ color: ACCENT }}>JK No Jokes Financials</span>
          </div>
        </aside>

        <main className="main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: DEMO_MONO, fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase' }}>June 2026</div>
              <div style={{ fontFamily: DEMO_HEAD, fontSize: '22px', fontWeight: 600 }}>{NAV.find((n) => n.id === tab)?.label}</div>
            </div>
            <div style={{ fontFamily: DEMO_MONO, fontSize: '10px', color: MUTED, background: '#E8EDF2', padding: '5px 12px', borderRadius: '20px' }}>Sample · JK No Jokes</div>
          </div>

          {tab === 'portfolio' && (
            <>
              <div className="kpi-row">
                <Kpi k="Rent roll" v={money(totalRoll)} sub="June 2026" />
                <Kpi k="Collected MTD" v="96.2%" sub="of rent roll" color={GREEN} />
                <Kpi k="Delinquent" v={money(totalDelinquent)} sub="11 tenants" color={RED} />
                <Kpi k="Vacancy" v={fmtPct((totalVacant / totalDoors) * 100)} sub={`${totalVacant} of ${totalDoors} doors`} />
              </div>
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    <th style={hcell}>Property</th>
                    <th style={{ ...hcell, textAlign: 'right' }}>Units</th>
                    <th style={{ ...hcell, textAlign: 'right' }}>Rent roll</th>
                    <th style={{ ...hcell, textAlign: 'right' }}>Delinquent</th>
                    <th style={hcell}>Owner</th>
                  </tr></thead>
                  <tbody>
                    {PROPERTIES.map((p) => (
                      <tr key={p.name}>
                        <td style={cell({ fontWeight: 600 })}>{p.name}</td>
                        <td style={cell({ textAlign: 'right', fontFamily: DEMO_MONO })}>{p.units}</td>
                        <td style={cell({ textAlign: 'right', fontFamily: DEMO_MONO })}>{money(p.rentRoll)}</td>
                        <td style={cell({ textAlign: 'right', fontFamily: DEMO_MONO, color: p.delinquent > 3000 ? RED : INK, fontWeight: p.delinquent > 3000 ? 600 : 400 })}>{money(p.delinquent)}</td>
                        <td style={cell({ color: MUTED })}>{p.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'delinquent' && (
            <>
              <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, marginBottom: '16px', maxWidth: '560px' }}>
                Every late tenant has a next step — nobody falls through. Bayside Court is {money(8200)} of your {money(totalDelinquent)} delinquency.
              </p>
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
                {DELINQUENT.map((d) => (
                  <div key={d.unit} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', borderBottom: `1px solid #EEF2F6`, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{d.unit}</div>
                      <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{d.tenant} · {d.days} days late</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: DEMO_MONO, fontWeight: 600, fontSize: '15px' }}>{money(d.owed)}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: d.days > 30 ? RED : AMBER, marginTop: '2px' }}>{d.step}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'owners' && (
            <>
              <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, marginBottom: '16px', maxWidth: '560px' }}>
                Owner statements ready on the 1st — collected rent, repairs, and your management fee on one page.
              </p>
              {OWNERS.map((o) => {
                const fee = Math.round(o.collected * o.feePct / 100)
                const net = o.collected - o.repairs - fee
                const open = expanded === o.name
                return (
                  <div key={o.name} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}>
                    <button type="button" onClick={() => setExpanded(open ? null : o.name)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', fontFamily: DEMO_UI }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '15px' }}>{o.name}</div>
                          <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{o.props}</div>
                        </div>
                        <div style={{ fontFamily: DEMO_MONO, fontWeight: 600, color: GREEN }}>{money(net)} net</div>
                      </div>
                    </button>
                    {open && (
                      <div style={{ padding: '0 16px 14px', fontSize: '13px', color: MUTED, borderTop: `1px solid #EEF2F6` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>Collected</span><span style={{ fontFamily: DEMO_MONO, color: INK }}>{money(o.collected)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>Repairs</span><span style={{ fontFamily: DEMO_MONO, color: INK }}>−{money(o.repairs)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>Management fee ({o.feePct}%)</span><span style={{ fontFamily: DEMO_MONO, color: INK }}>−{money(fee)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', borderTop: `2px solid ${INK}`, fontWeight: 600, color: INK }}><span>Owner distribution</span><span style={{ fontFamily: DEMO_MONO }}>{money(net)}</span></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {tab === 'financials' && (
            <>
              <div className="kpi-row">
                <Kpi k="Revenue MTD" v={money(96400)} sub="management + leasing" />
                <Kpi k="Expenses" v={money(71900)} sub="payroll + maintenance" />
                <Kpi k="Net income" v={money(24500)} sub="26% margin" color={GREEN} />
              </div>
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '18px 20px', fontSize: '14px', color: MUTED, lineHeight: 1.65 }}>
                Management fees, leasing commissions, and maintenance markups — reconciled to QuickBooks on the same screen as the rent roll.
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}

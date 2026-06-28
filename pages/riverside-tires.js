import { useState } from 'react'
import Head from 'next/head'

const BIZ = 'Riverside Tires'
const SIDEBAR = '#1A1A1A', ACCENT = '#CC2222', BG = '#F8F8F8', BORDER = '#E5E5E5'
const INK = '#1A1A1A', MUTED = '#888', GREEN = '#1E7A3A', RED = '#CC2222', AMBER = '#C98A2A'
const mono = "'DM Mono', monospace"
const serif = "'Cormorant Garamond', serif"
const ui = "'DM Sans', sans-serif"

const fmt = (n) => '$' + Math.round(n).toLocaleString()
const fmtD2 = (n) => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (n) => n.toFixed(1) + '%'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard'    },
  { id: 'financials', label: 'Financials'   },
  { id: 'inventory',  label: 'Sales & Items'},
  { id: 'orders',     label: 'Orders'       },
  { id: 'stock',      label: 'Stock'        },
  { id: 'accounts',   label: 'Accounts'     },
  { id: 'ai',         label: '✦ Ask AI'    },
]

const ITEMS = [
  { name: '235/65/17 Bridgestone Ecopia', orders: 48, qty: 96,  rev: 11520, cost: 7200  },
  { name: '205/55/16 Michelin Primacy',   orders: 41, qty: 82,  rev: 8610,  cost: 5330  },
  { name: '225/60/17 Goodyear Assurance', orders: 37, qty: 74,  rev: 8140,  cost: 5180  },
  { name: '215/60/16 Cooper CS5',         orders: 34, qty: 68,  rev: 6460,  cost: 4080  },
  { name: '245/70/17 BFGoodrich A/T',     orders: 28, qty: 56,  rev: 7840,  cost: 4760  },
  { name: 'Tire plug / patch repair',     orders: 62, qty: 62,  rev: 1550,  cost: 310   },
  { name: 'Tire rotation (set)',          orders: 55, qty: 55,  rev: 1925,  cost: 275   },
  { name: '235/55/18 Pirelli P-Zero',     orders: 22, qty: 44,  rev: 5940,  cost: 3740  },
  { name: 'Oil change (synthetic)',       orders: 44, qty: 44,  rev: 3080,  cost: 1320  },
  { name: '225/45/18 Continental ExtremeContact', orders: 19, qty: 38, rev: 4940, cost: 3040 },
  { name: 'Wheel balance (full set)',     orders: 38, qty: 38,  rev: 1900,  cost: 380   },
  { name: '265/70/17 Toyo Open Country', orders: 16, qty: 32,  rev: 4480,  cost: 2720  },
  { name: 'Lug nut replacement',         orders: 29, qty: 58,  rev: 870,   cost: 290   },
  { name: '195/65/15 Hankook Kinergy',   orders: 18, qty: 36,  rev: 2340,  cost: 1440  },
  { name: 'TPMS sensor replacement',     orders: 24, qty: 24,  rev: 1920,  cost: 720   },
  { name: '255/50/20 Michelin Latitude', orders: 12, qty: 24,  rev: 4200,  cost: 2760  },
  { name: 'Valve stem replacement',      orders: 33, qty: 66,  rev: 660,   cost: 132   },
  { name: '225/65/17 Firestone All-Season', orders: 21, qty: 42, rev: 3780, cost: 2310 },
]

const ORDERS = [
  { id: 'WO-041', customer: 'James Carter',    service: '235/65/17 Bridgestone x4 + balance', total: 520, status: 'completed', date: 'Jun 25', tech: 'Mike' },
  { id: 'WO-042', customer: 'Linda Torres',    service: 'Oil change + tire rotation',         total: 115, status: 'completed', date: 'Jun 25', tech: 'Luis' },
  { id: 'WO-043', customer: 'Kevin Nguyen',    service: '205/55/16 Michelin x2 + balance',   total: 248, status: 'in-progress', date: 'Jun 26', tech: 'Mike' },
  { id: 'WO-044', customer: 'Diane Morris',    service: 'Tire plug repair',                  total: 25,  status: 'completed', date: 'Jun 26', tech: 'Luis' },
  { id: 'WO-045', customer: 'Marcus Johnson',  service: '245/70/17 BFG A/T x4 + alignment', total: 620, status: 'in-progress', date: 'Jun 27', tech: 'Mike' },
  { id: 'WO-046', customer: 'Sandra Reyes',    service: 'TPMS sensor x2 + balance',         total: 210, status: 'scheduled', date: 'Jun 28', tech: 'Luis' },
  { id: 'WO-047', customer: 'Brian Walsh',     service: '225/60/17 Goodyear x4',            total: 440, status: 'scheduled', date: 'Jun 28', tech: 'Mike' },
  { id: 'WO-048', customer: 'Angela Kim',      service: 'Lug nut replacement + torque check', total: 65, status: 'scheduled', date: 'Jun 28', tech: 'Luis' },
  { id: 'WO-049', customer: 'Robert Patel',    service: '255/50/20 Michelin x4',            total: 880, status: 'scheduled', date: 'Jun 29', tech: 'Mike' },
]

const STOCK = [
  { name: '235/65/17 Bridgestone Ecopia', onHand: 8,  reorder: 6,  cost: 75,  price: 120 },
  { name: '205/55/16 Michelin Primacy',   onHand: 6,  reorder: 4,  cost: 65,  price: 105 },
  { name: '225/60/17 Goodyear Assurance', onHand: 10, reorder: 6,  cost: 70,  price: 110 },
  { name: '215/60/16 Cooper CS5',         onHand: 4,  reorder: 4,  cost: 60,  price: 95  },
  { name: '245/70/17 BFGoodrich A/T',     onHand: 6,  reorder: 4,  cost: 85,  price: 140 },
  { name: '235/55/18 Pirelli P-Zero',     onHand: 4,  reorder: 4,  cost: 85,  price: 135 },
  { name: '225/45/18 Continental',        onHand: 3,  reorder: 4,  cost: 80,  price: 130 },
  { name: '265/70/17 Toyo Open Country',  onHand: 2,  reorder: 4,  cost: 85,  price: 140 },
  { name: '195/65/15 Hankook Kinergy',    onHand: 8,  reorder: 4,  cost: 40,  price: 65  },
  { name: '225/65/17 Firestone',          onHand: 6,  reorder: 4,  cost: 55,  price: 90  },
  { name: '255/50/20 Michelin Latitude',  onHand: 2,  reorder: 2,  cost: 115, price: 175 },
]

const ACCOUNTS = [
  { name: 'Checking — Main Operating', type: 'Asset',     balance: 28400  },
  { name: 'Savings — Reserve',         type: 'Asset',     balance: 14200  },
  { name: 'Clover POS Clearing',       type: 'Asset',     balance: 3180   },
  { name: 'Accounts Receivable',       type: 'Asset',     balance: 4620   },
  { name: 'Tire Inventory',            type: 'Asset',     balance: 18340  },
  { name: 'Parts & Supplies',          type: 'Asset',     balance: 2860   },
  { name: 'Tire Sales',                type: 'Income',    balance: 69040  },
  { name: 'Service Revenue',           type: 'Income',    balance: 14260  },
  { name: 'Cost of Goods — Tires',     type: 'Expense',   balance: 43200  },
  { name: 'Labor & Wages',             type: 'Expense',   balance: 12400  },
  { name: 'Rent',                      type: 'Expense',   balance: 7200   },
  { name: 'Shop Supplies',             type: 'Expense',   balance: 1840   },
  { name: 'Credit Card — Shop',        type: 'Liability', balance: 3240   },
  { name: 'Business Loan',             type: 'Liability', balance: 22000  },
]

const MONTH_REV = [
  { m: 'Jul', rev: 28400, cogs: 18200 }, { m: 'Aug', rev: 31200, cogs: 19800 },
  { m: 'Sep', rev: 29800, cogs: 18900 }, { m: 'Oct', rev: 33600, cogs: 21200 },
  { m: 'Nov', rev: 30100, cogs: 19100 }, { m: 'Dec', rev: 27500, cogs: 17400 },
  { m: 'Jan', rev: 24800, cogs: 15800 }, { m: 'Feb', rev: 26400, cogs: 16700 },
  { m: 'Mar', rev: 31900, cogs: 20200 }, { m: 'Apr', rev: 35200, cogs: 22100 },
  { m: 'May', rev: 38100, cogs: 23900 }, { m: 'Jun', rev: 34800, cogs: 21800 },
]
const maxRev = Math.max(...MONTH_REV.map(m => m.rev))

const STATUS_COLOR = { completed: GREEN, 'in-progress': AMBER, scheduled: '#5A6070' }
const TYPE_COLOR   = { Asset: '#1857A4', Income: GREEN, Expense: RED, Liability: AMBER, Equity: MUTED }

export default function RiversideTires() {
  const [tab, setTab]   = useState('dashboard')
  const [sort, setSort] = useState('rev')
  const [aiQ, setAiQ]   = useState('')
  const [aiA, setAiA]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const sortedItems = [...ITEMS].sort((a, b) => b[sort] - a[sort])
  const totalRev  = ITEMS.reduce((s, i) => s + i.rev, 0)
  const totalCogs = ITEMS.reduce((s, i) => s + i.cost, 0)
  const grossProfit = totalRev - totalCogs
  const ytdRev    = MONTH_REV.reduce((s, m) => s + m.rev, 0)
  const ytdCogs   = MONTH_REV.reduce((s, m) => s + m.cogs, 0)
  const ytdGP     = ytdRev - ytdCogs

  const hcell = (align = 'left') => ({ padding: '7px 12px', fontSize: '9px', color: MUTED, background: '#FAFAFA', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: `1px solid ${BORDER}`, fontFamily: ui, textAlign: align })
  const cell  = (align = 'left', extra = {}) => ({ padding: '9px 12px', borderBottom: `1px solid #F5F5F5`, color: INK, fontSize: '12px', fontFamily: ui, textAlign: align, ...extra })

  const Kpi = ({ k, v, sub, color }) => (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px', flex: 1, minWidth: '140px' }}>
      <div style={{ fontFamily: mono, fontSize: '9px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{k}</div>
      <div style={{ fontFamily: serif, fontSize: '28px', fontWeight: 600, color: color || INK, lineHeight: 1.1 }}>{v}</div>
      {sub && <div style={{ fontFamily: mono, fontSize: '10px', color: MUTED, marginTop: '4px' }}>{sub}</div>}
    </div>
  )

  const Card = ({ title, children, extra }) => (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, fontFamily: mono, fontSize: '10px', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}{extra}
      </div>
      {children}
    </div>
  )

  const askAi = () => {
    if (!aiQ.trim()) return
    setAiLoading(true)
    setTimeout(() => {
      const q = aiQ.toLowerCase()
      let ans = ''
      if (q.includes('top') || q.includes('best')) ans = `Your top seller this month is ${ITEMS[0].name} at ${fmt(ITEMS[0].rev)} revenue across ${ITEMS[0].orders} orders. Bridgestone 235/65/17 and Michelin 205/55/16 together account for over 28% of total revenue.`
      else if (q.includes('profit') || q.includes('margin')) ans = `Your gross margin this month is ${pct((grossProfit/totalRev)*100)} — ${fmt(grossProfit)} profit on ${fmt(totalRev)} revenue. Year-to-date gross profit is ${fmt(ytdGP)}, a ${pct((ytdGP/ytdRev)*100)} margin.`
      else if (q.includes('stock') || q.includes('inventory') || q.includes('reorder')) ans = `You have ${STOCK.filter(s=>s.onHand<=s.reorder).length} items at or below reorder level. Most urgent: ${STOCK.filter(s=>s.onHand<s.reorder).map(s=>s.name.split(' ').slice(0,3).join(' ')).join(', ')}.`
      else if (q.includes('revenue') || q.includes('sales')) ans = `Month-to-date revenue is ${fmt(34800)} across ${ORDERS.length + 180} work orders. Your busiest month this year was May at ${fmt(38100)}. Revenue is down 8.7% from May but up 22.5% vs June last year.`
      else ans = `Based on your current data: ${fmt(totalRev)} MTD revenue, ${pct((grossProfit/totalRev)*100)} gross margin, ${ORDERS.filter(o=>o.status!=='completed').length} open work orders. Your strongest category is tire sales at ${pct((69040/83300)*100)} of total revenue.`
      setAiA(ans)
      setAiLoading(false)
    }, 900)
  }

  return (
    <>
      <Head>
        <title>{BIZ} — Dashboard Demo</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:${ui};background:${BG};color:${INK}}
        .shell{display:flex;min-height:100vh}
        .side{width:210px;flex-shrink:0;background:${SIDEBAR};display:flex;flex-direction:column;padding:22px 12px;position:sticky;top:0;height:100vh;overflow-y:auto}
        .main{flex:1;min-width:0;padding:28px 32px 60px;overflow-y:auto}
        .nbtn{display:block;width:100%;text-align:left;padding:9px 13px;border-radius:7px;border:none;background:transparent;color:#6a6a6a;font-family:${ui};font-size:13px;font-weight:500;cursor:pointer;margin-bottom:2px;letter-spacing:.01em;transition:background .15s,color .15s}
        .nbtn:hover{background:rgba(255,255,255,.06);color:#ccc}
        .nbtn.on{background:rgba(255,255,255,.09);color:#fff;box-shadow:inset 3px 0 0 ${ACCENT}}
        .kpi-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
        @media(max-width:700px){.side{display:none}.main{padding:16px 14px 48px}}
      `}</style>

      <div className="shell">
        <aside className="side">
          <div style={{ paddingBottom: '22px', borderBottom: '1px solid #2a2a2a', marginBottom: '16px' }}>
            <div style={{ fontFamily: mono, fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '.1em' }}>RIVERSIDE</div>
            <div style={{ fontFamily: mono, fontSize: '9px', color: ACCENT, letterSpacing: '.2em', marginTop: '3px' }}>TIRES &amp; AUTO</div>
          </div>
          <nav style={{ flex: 1 }}>
            {NAV.map(n => (
              <button key={n.id} className={`nbtn${tab===n.id?' on':''}`} onClick={()=>setTab(n.id)}>{n.label}</button>
            ))}
          </nav>
          <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '14px', marginTop: '8px' }}>
            <div style={{ fontFamily: mono, fontSize: '9px', color: '#444', lineHeight: 1.7 }}>
              SAMPLE DASHBOARD<br/><span style={{ color: ACCENT }}>JK No Jokes Financials</span>
            </div>
          </div>
        </aside>

        <main className="main">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'8px' }}>
            <div>
              <div style={{ fontFamily:mono, fontSize:'9px', color:MUTED, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'3px' }}>June 2026</div>
              <div style={{ fontFamily:serif, fontSize:'22px', fontWeight:600 }}>{NAV.find(n=>n.id===tab)?.label}</div>
            </div>
            <div style={{ fontFamily:mono, fontSize:'10px', color:MUTED, background:'#F0F0F0', padding:'5px 12px', borderRadius:'20px' }}>Live · JK No Jokes</div>
          </div>

          {/* ── DASHBOARD ── */}
          {tab==='dashboard' && <>
            <div className="kpi-row">
              <Kpi k="Revenue MTD"  v={fmt(34800)} sub="June 2026" />
              <Kpi k="Gross Profit" v={fmt(13000)} sub={pct((13000/34800)*100)+' margin'} color={GREEN} />
              <Kpi k="Work Orders"  v="247"        sub="this month" />
              <Kpi k="Avg Ticket"   v={fmt(141)}   sub="per order" />
            </div>
            <Card title="Monthly Revenue vs. COGS — Last 12 Months">
              <div style={{ padding:'20px 16px 12px', display:'flex', alignItems:'flex-end', gap:'5px', height:'180px' }}>
                {MONTH_REV.map((m,i)=>(
                  <div key={m.m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
                    <div style={{ width:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end', height:'140px', gap:'2px' }}>
                      <div style={{ width:'100%', background: i===11?ACCENT:'#E5E5E5', borderRadius:'3px 3px 0 0', height:`${Math.round((m.rev/maxRev)*120)}px`, minHeight:'3px' }} />
                    </div>
                    <div style={{ fontFamily:mono, fontSize:'8px', color:i===11?ACCENT:MUTED }}>{m.m}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Top Sellers — June" extra={<span style={{cursor:'pointer',color:ACCENT,fontFamily:mono,fontSize:'10px'}} onClick={()=>setTab('inventory')}>View all →</span>}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><th style={hcell()}>Item</th><th style={hcell('right')}>Orders</th><th style={hcell('right')}>Revenue</th><th style={hcell('right')}>Margin</th></tr></thead>
                <tbody>{ITEMS.slice(0,6).map((it,i)=>(
                  <tr key={i} style={{ background:i%2?'#FAFAFA':'#fff' }}>
                    <td style={cell()}>{it.name}</td>
                    <td style={cell('right',{color:MUTED})}>{it.orders}</td>
                    <td style={cell('right',{fontFamily:mono,fontWeight:500})}>{fmt(it.rev)}</td>
                    <td style={cell('right',{fontFamily:mono,color:GREEN})}>{pct(((it.rev-it.cost)/it.rev)*100)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="Open Work Orders">
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><th style={hcell()}>WO #</th><th style={hcell()}>Customer</th><th style={hcell()}>Service</th><th style={hcell('right')}>Total</th><th style={hcell('center')}>Status</th></tr></thead>
                <tbody>{ORDERS.filter(o=>o.status!=='completed').map((o,i)=>(
                  <tr key={i} style={{ background:i%2?'#FAFAFA':'#fff' }}>
                    <td style={cell('left',{fontFamily:mono,fontSize:'11px',color:MUTED})}>{o.id}</td>
                    <td style={cell()}>{o.customer}</td>
                    <td style={cell('left',{color:MUTED,fontSize:'11px'})}>{o.service}</td>
                    <td style={cell('right',{fontFamily:mono,fontWeight:500})}>{fmt(o.total)}</td>
                    <td style={{...cell('center')}}>
                      <span style={{background:STATUS_COLOR[o.status]+'20',color:STATUS_COLOR[o.status],padding:'3px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:500,whiteSpace:'nowrap'}}>{o.status}</span>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          </>}

          {/* ── FINANCIALS ── */}
          {tab==='financials' && <>
            <div className="kpi-row">
              <Kpi k="YTD Revenue"  v={fmt(ytdRev)} sub="Jul 2025 – Jun 2026" />
              <Kpi k="YTD COGS"     v={fmt(ytdCogs)} sub="cost of tires sold" color={RED} />
              <Kpi k="Gross Profit" v={fmt(ytdGP)}   sub={pct((ytdGP/ytdRev)*100)+' margin'} color={GREEN} />
            </div>
            <Card title="P&L — Month by Month">
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><th style={hcell()}>Month</th><th style={hcell('right')}>Revenue</th><th style={hcell('right')}>COGS</th><th style={hcell('right')}>Gross Profit</th><th style={hcell('right')}>Margin</th></tr></thead>
                <tbody>{[...MONTH_REV].reverse().map((m,i)=>{
                  const gp = m.rev-m.cogs
                  return <tr key={i} style={{ background:i%2?'#FAFAFA':'#fff' }}>
                    <td style={cell('left',{fontFamily:mono,fontWeight:500})}>{m.m} {m.m==='Jul'||m.m==='Aug'||m.m==='Sep'||m.m==='Oct'||m.m==='Nov'||m.m==='Dec'?'2025':'2026'}</td>
                    <td style={cell('right',{fontFamily:mono})}>{fmt(m.rev)}</td>
                    <td style={cell('right',{fontFamily:mono,color:MUTED})}>{fmt(m.cogs)}</td>
                    <td style={cell('right',{fontFamily:mono,fontWeight:600,color:GREEN})}>{fmt(gp)}</td>
                    <td style={cell('right',{fontFamily:mono,color:MUTED})}>{pct((gp/m.rev)*100)}</td>
                  </tr>
                })}
                </tbody>
                <tfoot><tr style={{ background:'#F5F5F5', borderTop:`2px solid ${BORDER}` }}>
                  <td style={cell('left',{fontWeight:600,fontFamily:mono})}>YTD Total</td>
                  <td style={cell('right',{fontFamily:mono,fontWeight:700})}>{fmt(ytdRev)}</td>
                  <td style={cell('right',{fontFamily:mono,color:MUTED})}>{fmt(ytdCogs)}</td>
                  <td style={cell('right',{fontFamily:mono,fontWeight:700,color:GREEN})}>{fmt(ytdGP)}</td>
                  <td style={cell('right',{fontFamily:mono,color:MUTED})}>{pct((ytdGP/ytdRev)*100)}</td>
                </tr></tfoot>
              </table>
            </Card>
          </>}

          {/* ── SALES & ITEMS ── */}
          {tab==='inventory' && <>
            <Card title="All Items — June 2026" extra={
              <div style={{ display:'flex', gap:'6px' }}>
                {[['rev','Revenue'],['orders','Orders'],['qty','Units']].map(([k,l])=>(
                  <button key={k} onClick={()=>setSort(k)} style={{ fontFamily:mono, fontSize:'10px', padding:'3px 9px', borderRadius:'5px', border:`1px solid ${sort===k?ACCENT:BORDER}`, background:sort===k?ACCENT:'transparent', color:sort===k?'#fff':MUTED, cursor:'pointer' }}>{l}</button>
                ))}
              </div>
            }>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>
                  <th style={hcell()}>#</th><th style={hcell()}>Item / Service</th>
                  <th style={hcell('right')}>Orders</th><th style={hcell('right')}>Units</th>
                  <th style={hcell('right')}>Revenue</th><th style={hcell('right')}>COGS</th>
                  <th style={hcell('right')}>Margin</th>
                </tr></thead>
                <tbody>{sortedItems.map((it,i)=>(
                  <tr key={i} style={{ background:i%2?'#FAFAFA':'#fff' }}>
                    <td style={cell('left',{fontFamily:mono,fontSize:'11px',color:MUTED,width:'28px'})}>{i+1}</td>
                    <td style={cell()}>{it.name}</td>
                    <td style={cell('right',{color:MUTED})}>{it.orders}</td>
                    <td style={cell('right',{color:MUTED})}>{it.qty}</td>
                    <td style={cell('right',{fontFamily:mono,fontWeight:500})}>{fmt(it.rev)}</td>
                    <td style={cell('right',{fontFamily:mono,color:MUTED})}>{fmt(it.cost)}</td>
                    <td style={cell('right',{fontFamily:mono,color:GREEN})}>{pct(((it.rev-it.cost)/it.rev)*100)}</td>
                  </tr>
                ))}</tbody>
                <tfoot><tr style={{ background:'#F5F5F5', borderTop:`2px solid ${BORDER}` }}>
                  <td colSpan={4} style={cell('left',{fontWeight:600,fontFamily:mono})}>Total</td>
                  <td style={cell('right',{fontFamily:mono,fontWeight:700,color:ACCENT})}>{fmt(totalRev)}</td>
                  <td style={cell('right',{fontFamily:mono,color:MUTED})}>{fmt(totalCogs)}</td>
                  <td style={cell('right',{fontFamily:mono,color:GREEN})}>{pct((grossProfit/totalRev)*100)}</td>
                </tr></tfoot>
              </table>
            </Card>
          </>}

          {/* ── ORDERS ── */}
          {tab==='orders' && <>
            <div className="kpi-row">
              <Kpi k="Open"          v={ORDERS.filter(o=>o.status!=='completed').length} sub="in progress / scheduled" color={AMBER} />
              <Kpi k="Completed today" v={ORDERS.filter(o=>o.status==='completed').length} sub="closed out" color={GREEN} />
              <Kpi k="Revenue today" v={fmt(ORDERS.filter(o=>o.status==='completed').reduce((s,o)=>s+o.total,0))} />
            </div>
            <Card title="Work Orders — Jun 25–29">
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>
                  <th style={hcell()}>WO #</th><th style={hcell()}>Customer</th><th style={hcell()}>Service</th>
                  <th style={hcell()}>Tech</th><th style={hcell('right')}>Total</th>
                  <th style={hcell('center')}>Status</th><th style={hcell('right')}>Date</th>
                </tr></thead>
                <tbody>{ORDERS.map((o,i)=>(
                  <tr key={i} style={{ background:i%2?'#FAFAFA':'#fff' }}>
                    <td style={cell('left',{fontFamily:mono,fontSize:'11px',color:MUTED})}>{o.id}</td>
                    <td style={cell()}>{o.customer}</td>
                    <td style={cell('left',{color:MUTED,fontSize:'11px'})}>{o.service}</td>
                    <td style={cell('left',{color:MUTED})}>{o.tech}</td>
                    <td style={cell('right',{fontFamily:mono,fontWeight:500})}>{fmt(o.total)}</td>
                    <td style={{...cell('center')}}>
                      <span style={{background:STATUS_COLOR[o.status]+'20',color:STATUS_COLOR[o.status],padding:'3px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:500,whiteSpace:'nowrap'}}>{o.status}</span>
                    </td>
                    <td style={cell('right',{fontFamily:mono,fontSize:'11px',color:MUTED})}>{o.date}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          </>}

          {/* ── STOCK ── */}
          {tab==='stock' && <>
            <div className="kpi-row">
              <Kpi k="SKUs in stock" v={STOCK.length} />
              <Kpi k="Reorder needed" v={STOCK.filter(s=>s.onHand<=s.reorder).length} sub="at or below reorder level" color={RED} />
              <Kpi k="Inventory value" v={fmt(STOCK.reduce((s,i)=>s+i.onHand*i.cost,0))} />
            </div>
            <Card title="Tire Inventory">
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>
                  <th style={hcell()}>Item</th><th style={hcell('right')}>On Hand</th>
                  <th style={hcell('right')}>Reorder At</th><th style={hcell('right')}>Unit Cost</th>
                  <th style={hcell('right')}>Sell Price</th><th style={hcell('center')}>Status</th>
                </tr></thead>
                <tbody>{STOCK.map((s,i)=>{
                  const low = s.onHand <= s.reorder
                  return <tr key={i} style={{ background:i%2?'#FAFAFA':'#fff' }}>
                    <td style={cell()}>{s.name}</td>
                    <td style={cell('right',{fontFamily:mono,fontWeight:600,color:low?RED:INK})}>{s.onHand}</td>
                    <td style={cell('right',{fontFamily:mono,color:MUTED})}>{s.reorder}</td>
                    <td style={cell('right',{fontFamily:mono,color:MUTED})}>{fmt(s.cost)}</td>
                    <td style={cell('right',{fontFamily:mono})}>{fmt(s.price)}</td>
                    <td style={{...cell('center')}}>
                      <span style={{background:low?RED+'20':GREEN+'20',color:low?RED:GREEN,padding:'3px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:500}}>{low?'Reorder':'OK'}</span>
                    </td>
                  </tr>
                })}</tbody>
              </table>
            </Card>
          </>}

          {/* ── ACCOUNTS ── */}
          {tab==='accounts' && <>
            <div className="kpi-row">
              <Kpi k="Total Assets"      v={fmt(ACCOUNTS.filter(a=>a.type==='Asset').reduce((s,a)=>s+a.balance,0))} color='#1857A4' />
              <Kpi k="Total Income"      v={fmt(ACCOUNTS.filter(a=>a.type==='Income').reduce((s,a)=>s+a.balance,0))} color={GREEN} />
              <Kpi k="Total Expenses"    v={fmt(ACCOUNTS.filter(a=>a.type==='Expense').reduce((s,a)=>s+a.balance,0))} color={RED} />
              <Kpi k="Total Liabilities" v={fmt(ACCOUNTS.filter(a=>a.type==='Liability').reduce((s,a)=>s+a.balance,0))} color={AMBER} />
            </div>
            <Card title="Chart of Accounts">
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><th style={hcell()}>Account</th><th style={hcell('center')}>Type</th><th style={hcell('right')}>Balance</th></tr></thead>
                <tbody>{ACCOUNTS.map((a,i)=>(
                  <tr key={i} style={{ background:i%2?'#FAFAFA':'#fff' }}>
                    <td style={cell()}>{a.name}</td>
                    <td style={{...cell('center')}}>
                      <span style={{background:TYPE_COLOR[a.type]+'18',color:TYPE_COLOR[a.type],padding:'3px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:500}}>{a.type}</span>
                    </td>
                    <td style={cell('right',{fontFamily:mono,fontWeight:500})}>{fmt(a.balance)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          </>}

          {/* ── ASK AI ── */}
          {tab==='ai' && <>
            <div style={{ background:'#fff', border:`1px solid ${BORDER}`, borderRadius:'12px', padding:'28px', maxWidth:'680px' }}>
              <div style={{ fontFamily:serif, fontSize:'22px', fontWeight:600, marginBottom:'6px' }}>✦ Ask AI</div>
              <div style={{ fontFamily:mono, fontSize:'10px', color:MUTED, marginBottom:'20px', letterSpacing:'.05em' }}>Ask anything about your business data</div>
              <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
                <input value={aiQ} onChange={e=>setAiQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askAi()}
                  placeholder="e.g. What's my best seller? What's my margin?"
                  style={{ flex:1, padding:'10px 14px', fontSize:'14px', border:`1px solid ${BORDER}`, borderRadius:'8px', fontFamily:ui, outline:'none' }} />
                <button onClick={askAi} style={{ background:ACCENT, color:'#fff', border:'none', borderRadius:'8px', padding:'10px 18px', fontFamily:mono, fontSize:'11px', cursor:'pointer', letterSpacing:'.05em' }}>ASK</button>
              </div>
              {aiLoading && <div style={{ fontFamily:mono, fontSize:'12px', color:MUTED }}>Thinking…</div>}
              {aiA && !aiLoading && (
                <div style={{ background:'#F8F8F8', border:`1px solid ${BORDER}`, borderRadius:'8px', padding:'16px', fontFamily:ui, fontSize:'14px', lineHeight:1.7, color:INK }}>
                  {aiA}
                </div>
              )}
              <div style={{ marginTop:'20px', display:'flex', flexWrap:'wrap', gap:'8px' }}>
                {["What's my top seller?","What's my gross margin?","Which items need reorder?","How was revenue this year?"].map(q=>(
                  <button key={q} onClick={()=>{setAiQ(q);setTimeout(askAi,0)}} style={{ fontFamily:mono, fontSize:'10px', padding:'5px 11px', borderRadius:'20px', border:`1px solid ${BORDER}`, background:'#fff', color:MUTED, cursor:'pointer' }}>{q}</button>
                ))}
              </div>
            </div>
          </>}
        </main>
      </div>
    </>
  )
}

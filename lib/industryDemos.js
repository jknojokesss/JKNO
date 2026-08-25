// ─────────────────────────────────────────────────────────────────────────
// Industry demo configs — one entry per industry, rendered by
// components/IndustryDemo.js at /demos/[slug]. All sample data, no backend.
// Numbers are latest-month (Jun) figures; the 12-month arrays run Jul→Jun.
// revCats sums to rev[11]; expLines sums to exp[11].
// ─────────────────────────────────────────────────────────────────────────

export const INDUSTRIES = [
  {
    slug: 'auto-repair', biz: 'Shoreline Auto & Tire', industry: 'Auto Repair & Tires', emoji: '🚗',
    blurb: 'Repair orders, tire sales, and profit per car — live.',
    theme: { dark: '#1E2A38', accent: '#C0492F' },
    months: { rev: [61200, 59800, 63400, 66100, 70800, 64200, 58900, 57400, 62800, 65900, 67200, 68400], exp: [46800, 45900, 48200, 50100, 53400, 48800, 45200, 44600, 47900, 50200, 50800, 51300] },
    revCats: [['Tire sales', 29800], ['Repairs & service', 27200], ['Alignments & inspections', 6900], ['Detailing', 4500]],
    expLines: [
      { n: 'Parts & tires (COGS)', a: 26400, tx: [['6/26', 'ATD — American Tire Dist.', 9840], ['6/19', 'WorldPac parts order', 4210], ['6/12', 'NAPA Auto Parts', 2890]] },
      { n: 'Payroll', a: 14800, tx: [['6/30', 'Payroll run — 2 techs + advisor', 7400], ['6/15', 'Payroll run', 7400]] },
      { n: 'Rent', a: 4200, tx: [['6/1', 'Shoreline Plaza LLC', 4200]] },
      { n: 'Shop supplies', a: 1900, tx: [['6/22', 'Grainger', 640], ['6/9', 'Uline', 720], ['6/4', 'Local hardware', 540]] },
      { n: 'Insurance', a: 1600, tx: [['6/1', 'Garage keepers policy', 1600]] },
      { n: 'Software & misc', a: 2400, tx: [['6/1', 'Shop management software', 380], ['6/14', 'Card processing fees', 1120], ['6/28', 'Uniforms & laundry', 900]] },
    ],
    extraKpi: { k: 'CARS THROUGH THE SHOP', v: '312', sub: 'this month · avg $219/RO' },
    insights: [
      'Tires are 44% of your revenue but only ~18% margin — repairs and service carry the profit. June\'s mix shifted 3 points toward tires, which is why profit felt flat while the shop was slammed.',
      'Average repair order is $219. Shops that get to $260+ do it by converting inspections to estimates, not raising prices — at 312 cars/month, a $40 lift is ~$12K more revenue.',
      'That $9,840 ATD order in late June: quoting WorldPac against every $5K+ parts order is worth ~$1,000/month on a 4% swing.',
    ],
    extras: [
      {
        tab: 'Supplier Orders',
        kpis: [{ k: 'INVENTORY ON SHELF', v: '$84K', sub: 'at cost' }, { k: 'STOCK BUYS (JUN)', v: '$13,910', sub: 'hit Inventory, not COGS' }, { k: 'JOB PARTS (JUN)', v: '$5,150', sub: 'straight to COGS' }],
        modules: [{
          type: 'worklist', t: 'Supplier orders, classified', sub: 'Every parts order tagged the way your books need it — shelf stock vs. cost of a specific job',
          rows: [
            { a: 'ATD #88412 — 24 tires, mixed sizes', b: 'American Tire Distributors · 6/26', val: '$9,840', flag: { f: 'STOCK', tone: 'blue' } },
            { a: 'WorldPac — brake kits', b: 'Silverado RO #2214 · 6/19', val: '$4,210', flag: { f: 'COGS', tone: 'amber' } },
            { a: 'NAPA — filters & fluids restock', b: 'Shelf replenishment · 6/12', val: '$2,890', flag: { f: 'STOCK', tone: 'blue' } },
            { a: 'ATD #88371 — 4 Michelin Primacy', b: 'Camry RO #2196 · 6/9', val: '$940', flag: { f: 'COGS', tone: 'amber' } },
            { a: 'Interstate — battery order', b: 'Shelf replenishment · 6/4', val: '$1,180', flag: { f: 'STOCK', tone: 'blue' } },
          ],
          note: 'The PO# rule does the tagging automatically — stock hits Inventory, job parts hit COGS. Month-end stops being a guessing game.',
        }],
      },
      {
        tab: 'Tire Stock',
        modules: [{
          type: 'board', t: 'Tire stock by size & brand', sub: 'What is moving, what is sitting, what to reorder before the weekend',
          cols: ['SIZE / BRAND', 'ON HAND', 'SOLD (JUN)', 'AVG COST', 'RETAIL', 'MARGIN', ''],
          rows: [
            ['225/65R17 Michelin Defender', '18', '22', '$128', '$189', '32%', { f: 'REORDER', tone: 'red' }],
            ['265/70R17 BFG KO2', '24', '15', '$142', '$215', '34%', { f: 'HEALTHY', tone: 'green' }],
            ['205/55R16 Firestone', '31', '19', '$84', '$132', '36%', { f: 'HEALTHY', tone: 'green' }],
            ['275/55R20 Nitto', '9', '11', '$167', '$259', '36%', { f: 'LOW', tone: 'amber' }],
            ['195/65R15 Kumho', '42', '6', '$61', '$98', '38%', { f: 'SLOW MOVER', tone: 'amber' }],
            ['235/45R18 Continental', '2', '8', '$138', '$209', '34%', { f: 'REORDER', tone: 'red' }],
          ],
          note: 'Same live stock view we run for a real tire shop client — this is not a mockup pattern, it is the product.',
        }],
      },
    ],
    ops: {
      type: 'jobs', unit: 'RO', label: 'Repair Orders', title: 'Open repair orders', sub: 'Change a status or add an RO — in your build this is your live shop board',
      cols: ['REPAIR ORDER', 'TECH', 'STATUS', 'CHARGED', 'PROFIT'],
      kpis: [{ k: 'CARS IN THE SHOP', v: '7', sub: '3 waiting on parts' }, { k: 'BILLED TODAY', v: '$2,840', sub: '9 tickets closed' }, { k: 'AVG PROFIT / RO', v: '$96', sub: 'after parts + labor' }],
      rows: [
        { a: 'Silverado 2500 — brakes + rotors', b: 'M. Alvarez · drop-off', who: 'Danny', s: 'in_progress', chg: 780, cost: 410 },
        { a: 'Camry — 4 tires + alignment', b: 'S. Rothman · waiting', who: 'Pete', s: 'in_progress', chg: 940, cost: 660 },
        { a: 'F-150 — AC not blowing cold', b: 'Ocean Landscaping (fleet)', who: 'Danny', s: 'waiting', chg: 620, cost: 285 },
        { a: 'Odyssey — timing belt + water pump', b: 'R. Chen · scheduled Thu', who: 'Pete', s: 'scheduled', chg: 1180, cost: 540 },
        { a: 'Jetta — check engine diag', b: 'K. Williams', who: 'Danny', s: 'done', chg: 165, cost: 20 },
        { a: 'Wrangler — lift kit install', b: 'T. Brennan', who: 'Pete', s: 'done', chg: 1450, cost: 890 },
      ],
    },
  },
  {
    slug: 'hvac', biz: 'Coastal Air Heating & Cooling', industry: 'HVAC', emoji: '❄️',
    blurb: 'Installs vs. service calls, profit per job, seasonal swings.',
    theme: { dark: '#16323E', accent: '#E07A3C' },
    months: { rev: [88400, 84200, 61800, 52400, 58900, 71200, 76800, 68400, 55200, 59800, 78400, 92600], exp: [65200, 62400, 47800, 41200, 45600, 54300, 58200, 52100, 43400, 46200, 59400, 68900] },
    revCats: [['Installs & replacements', 54000], ['Service calls', 26800], ['Maintenance plans', 11800]],
    expLines: [
      { n: 'Equipment & parts', a: 34200, tx: [['6/24', 'Ferguson HVAC Supply', 12400], ['6/17', 'Johnstone Supply', 8900], ['6/6', 'Carrier distributor — 2 condensers', 9200]] },
      { n: 'Payroll', a: 21500, tx: [['6/30', 'Payroll — 3 techs + office', 10750], ['6/15', 'Payroll run', 10750]] },
      { n: 'Vehicles & fuel', a: 4800, tx: [['6/28', 'Fleet fuel card', 2140], ['6/20', 'Van 2 — brake service', 890], ['6/8', 'Fleet fuel card', 1770]] },
      { n: 'Rent & warehouse', a: 3600, tx: [['6/1', 'Industrial park unit 4B', 3600]] },
      { n: 'Insurance', a: 2900, tx: [['6/1', 'GL + workers comp', 2900]] },
      { n: 'Marketing', a: 1900, tx: [['6/15', 'Google Local Services ads', 1250], ['6/3', 'Yard signs & truck decals', 650]] },
    ],
    extraKpi: { k: 'MAINTENANCE PLANS', v: '118', sub: 'recurring revenue base' },
    insights: [
      'June did $92.6K — install season. But look at October: $52.4K. Banking ~$8K/month now is what covers winter payroll without sweating it.',
      'Maintenance plans are only 13% of revenue but they smooth the whole curve. You have 118 plans; at 160, your fixed costs are covered before a single install.',
      'Equipment ate 37% of June spend, and installs are running roughly 2× the margin of service calls per crew-day — every extra install day is worth ~$1,900 in profit.',
    ],
    extras: [
      {
        tab: 'Quote Builder',
        modules: [{
          type: 'quote', t: 'Quote an install — margin before you send it', sub: 'Pick the system, set the hours, and the number is ready before you leave the kitchen table',
          systems: [['3-ton Trane XR14 + air handler', 4100, 16], ['2-ton condenser swap', 2400, 10], ['4-ton full system + ductwork', 6800, 28], ['2-zone Mitsubishi mini-split', 2900, 14], ['Rooftop unit — light commercial', 5400, 20]],
          rate: 95, permitCost: 240,
          note: 'In your build this pulls your real equipment costs and labor rates — and every quote logs to a pipeline so none go cold.',
        }],
      },
      {
        tab: 'Contracts',
        kpis: [{ k: 'PLANS ACTIVE', v: '118', sub: '$11.8K/mo recurring' }, { k: 'VISITS DUE (30d)', v: '14', sub: '2 overdue' }, { k: 'RENEWALS (30d)', v: '9', sub: 'worth $6,400/yr' }],
        modules: [{
          type: 'worklist', t: 'Maintenance contracts', sub: 'Who you cover, how often, and what is coming due — instead of a notebook in the truck', act: 'MARK SCHEDULED',
          rows: [
            { a: 'Marino residence', b: '2 visits/yr · $189/yr', val: '', meta: 'visit overdue 12 days', flag: { f: 'OVERDUE', tone: 'red' } },
            { a: 'Bayshore Dental — 2 rooftop units', b: '4 visits/yr · $1,880/yr', val: '', meta: 'visit due in 6 days', flag: { f: 'DUE SOON', tone: 'amber' } },
            { a: 'Hoffman residence', b: '2 visits/yr · $189/yr', val: '', meta: 'visit due in 14 days', flag: { f: 'DUE SOON', tone: 'amber' } },
            { a: 'K. Patel', b: '2 visits/yr · $189/yr', val: '', meta: 'renewal in 9 days', flag: { f: 'RENEWAL', tone: 'blue' } },
            { a: 'Shore Motel — 16 PTAC units', b: 'quarterly · $3,400/yr', val: '', meta: 'renewal in 21 days', flag: { f: 'RENEWAL', tone: 'blue' } },
            { a: 'Riverside Café — walk-in + refrigeration', b: 'quarterly · $2,100/yr', val: '', meta: 'current — next visit Sep', flag: { f: 'ON TRACK', tone: 'green' } },
          ],
          note: 'Reminders fire before visits and renewals — the recurring base stops leaking.',
        }],
      },
    ],
    ops: {
      type: 'jobs', label: 'Jobs', title: 'Job board', sub: 'Installs and calls, with profit per job as parts and labor hit',
      cols: ['JOB', 'TECH', 'STATUS', 'CHARGED', 'PROFIT'],
      kpis: [{ k: 'OPEN JOBS', v: '11', sub: '6 scheduled this week' }, { k: 'INSTALLS THIS MONTH', v: '9', sub: 'avg $6,000 ticket' }, { k: 'FIRST-VISIT FIX RATE', v: '84%', sub: 'service calls' }],
      rows: [
        { a: 'Bayshore Dental — 3-ton install', b: 'Trane XR14 + air handler', who: 'Rob', s: 'in_progress', chg: 6800, cost: 4100 },
        { a: 'Marino residence — AC no cool', b: 'Capacitor + refrigerant', who: 'Steve', s: 'done', chg: 480, cost: 140 },
        { a: 'Shore Motel — 4 PTAC units', b: 'Replace units 12–15', who: 'Rob', s: 'scheduled', chg: 5200, cost: 3400 },
        { a: 'K. Patel — mini-split install', b: '2-zone Mitsubishi', who: 'Jimmy', s: 'waiting', chg: 4600, cost: 2900 },
        { a: 'Riverside Café — walk-in cooler', b: 'Compressor swap', who: 'Steve', s: 'in_progress', chg: 2100, cost: 1180 },
        { a: 'Hoffman residence — tune-up', b: 'Maintenance plan visit', who: 'Jimmy', s: 'done', chg: 129, cost: 25 },
      ],
    },
  },
  {
    slug: 'plumbing', biz: 'BlueLine Plumbing', industry: 'Plumbing', emoji: '🚿',
    blurb: 'Service calls, remodels, and water heaters — margin on every job.',
    theme: { dark: '#1B2F4B', accent: '#2C6E9B' },
    months: { rev: [69800, 71200, 68400, 72600, 75800, 78200, 81400, 74600, 70200, 72800, 73400, 74200], exp: [51200, 52400, 50100, 53200, 55400, 57100, 59200, 54600, 51400, 53200, 53600, 54100] },
    revCats: [['Service & repair', 38400], ['Remodels & rough-in', 24600], ['Water heaters', 11200]],
    expLines: [
      { n: 'Materials & fixtures', a: 22800, tx: [['6/25', 'Ferguson Plumbing Supply', 8400], ['6/18', 'Home Depot Pro', 3200], ['6/10', 'AO Smith — 4 water heaters', 4900]] },
      { n: 'Payroll', a: 19600, tx: [['6/30', 'Payroll — 3 plumbers + apprentice', 9800], ['6/15', 'Payroll run', 9800]] },
      { n: 'Vehicles & fuel', a: 4300, tx: [['6/27', 'Fleet fuel', 1980], ['6/12', 'Van 1 — tires', 840], ['6/5', 'Fleet fuel', 1480]] },
      { n: 'Insurance', a: 2700, tx: [['6/1', 'GL + workers comp', 2700]] },
      { n: 'Permits & inspections', a: 1400, tx: [['6/20', 'Township permits ×3', 860], ['6/6', 'Backflow certifications', 540]] },
      { n: 'Rent & misc', a: 3300, tx: [['6/1', 'Shop rent', 2200], ['6/14', 'Answering service', 420], ['6/1', 'Software & GPS', 680]] },
    ],
    extraKpi: { k: 'AVG SERVICE TICKET', v: '$342', sub: 'up from $305 last quarter' },
    insights: [
      'Service & repair is 52% of June revenue and runs roughly double the per-hour margin of remodel work — protect those emergency slots.',
      '14 water heaters in June at ~$800 installed. Attaching a heater quote to every service call over $300 converts about 1 in 9 — that\'s 4 more heaters a month sitting in your own call log.',
      'Vehicles + fuel hit $4,300. Clustering jobs by township on set days could pull ~15% of that back without touching the schedule.',
    ],
    extras: [
      {
        tab: 'Emergency Margin',
        modules: [{
          type: 'segments', t: 'Emergency vs. scheduled — same crew, different money', sub: 'Why the 2am call is worth protecting',
          segs: [
            { name: 'EMERGENCY', hot: true, lines: [['Jobs (Jun)', '31'], ['Avg ticket', '$612'], ['Labor hrs/job', '2.1']], foot: ['Margin', '58%'] },
            { name: 'SCHEDULED SERVICE', lines: [['Jobs (Jun)', '64'], ['Avg ticket', '$342'], ['Labor hrs/job', '2.4']], foot: ['Margin', '39%'] },
            { name: 'REMODEL / ROUGH-IN', lines: [['Jobs (Jun)', '6'], ['Avg ticket', '$4,100'], ['Labor hrs/job', '38']], foot: ['Margin', '31%'] },
          ],
          note: 'Every emergency slot you protect is worth roughly 1.5 scheduled jobs. Answer the phone at 2am — but charge like it.',
        }],
      },
      {
        tab: 'A/R & Heaters',
        modules: [
          {
            type: 'worklist', t: 'Who owes you', sub: 'Open invoices, oldest first', act: 'SEND REMINDER',
            rows: [
              { a: 'Lakewood duplex GC — rough-in', b: 'Invoice #1182', val: '$6,200', meta: '54 days', flag: { f: '60+ DAYS', tone: 'red' } },
              { a: 'Toms River Diner — grease trap', b: 'Invoice #1201', val: '$1,450', meta: '31 days', flag: { f: '31–60 DAYS', tone: 'amber' } },
              { a: 'Shore Pines HOA — backflow tests', b: 'Invoice #1214', val: '$720', meta: '18 days', flag: { f: 'CURRENT', tone: 'green' } },
              { a: 'B. Katz — water heater', b: 'Invoice #1219', val: '$1,850', meta: '9 days', flag: { f: 'CURRENT', tone: 'green' } },
            ],
            note: 'One reminder button beats an awkward phone call. In your build these send automatically at 30 and 45 days.',
          },
          {
            type: 'worklist', t: 'Water-heater funnel', sub: 'Every service call over $300 gets a heater quote — about 1 in 9 says yes', act: 'QUOTE IT',
            rows: [
              { a: 'M. Osei — faucet & disposal call', b: 'Heater is 11 years old', val: '$1,850', flag: { f: 'QUOTE OPEN', tone: 'amber' } },
              { a: 'Delgado residence — repipe', b: 'Heater is 14 years old, quoted at walkthrough', val: '$2,100', flag: { f: 'QUOTE OPEN', tone: 'amber' } },
              { a: 'R. Chen — service call', b: 'Installed 6/22', val: '$1,790', flag: { f: 'WON', tone: 'green' } },
              { a: 'Sandpiper Motel', b: '2 aging commercial units', val: '$5,400', flag: { f: 'QUOTE OPEN', tone: 'amber' } },
            ],
            note: '14 heaters went in last month. The funnel is where the 15th comes from.',
          },
        ],
      },
    ],
    ops: {
      type: 'jobs', label: 'Jobs', title: 'Job board', sub: 'Every open job with live cost vs. charged',
      cols: ['JOB', 'PLUMBER', 'STATUS', 'CHARGED', 'PROFIT'],
      kpis: [{ k: 'OPEN JOBS', v: '9', sub: '2 emergencies today' }, { k: 'WATER HEATERS (MTD)', v: '14', sub: 'avg $800 installed' }, { k: 'CALLBACK RATE', v: '2.1%', sub: 'trailing 90 days' }],
      rows: [
        { a: 'Toms River Diner — grease trap', b: 'Emergency — backed up', who: 'Vic', s: 'in_progress', chg: 1450, cost: 620 },
        { a: 'Delgado residence — repipe', b: 'Whole-house PEX, day 2 of 3', who: 'Sal', s: 'in_progress', chg: 8900, cost: 5200 },
        { a: 'B. Katz — 50-gal water heater', b: 'Replace + expansion tank', who: 'Vic', s: 'scheduled', chg: 1850, cost: 1080 },
        { a: 'Lakewood duplex — bath remodel', b: 'Rough-in, GC: Cornerstone', who: 'Sal', s: 'waiting', chg: 6200, cost: 3600 },
        { a: 'M. Osei — kitchen faucet + disposal', b: 'Customer-supplied fixture', who: 'Eddie', s: 'done', chg: 380, cost: 95 },
        { a: 'Shore Pines HOA — irrigation backflow', b: 'Annual test, 6 devices', who: 'Eddie', s: 'done', chg: 720, cost: 140 },
      ],
    },
  },
  {
    slug: 'electrician', biz: 'Amped Electric', industry: 'Electrical Contracting', emoji: '⚡',
    blurb: 'Residential service, commercial contracts, panel upgrades.',
    theme: { dark: '#21262E', accent: '#D9A62E' },
    months: { rev: [56200, 57800, 59400, 58200, 60800, 62400, 59800, 57200, 58900, 60400, 61200, 61800], exp: [40800, 41900, 42800, 42100, 43900, 45200, 43400, 41600, 42700, 43800, 44200, 44500] },
    revCats: [['Residential service', 27400], ['Commercial contracts', 24800], ['Panel upgrades & EV chargers', 9600]],
    expLines: [
      { n: 'Materials & fixtures', a: 17900, tx: [['6/26', 'Cooper Electric Supply', 7200], ['6/16', 'Graybar', 5400], ['6/8', 'Home Depot Pro', 2100]] },
      { n: 'Payroll', a: 16800, tx: [['6/30', 'Payroll — 2 journeymen + helper', 8400], ['6/15', 'Payroll run', 8400]] },
      { n: 'Vehicles & fuel', a: 3600, tx: [['6/28', 'Fleet fuel', 1650], ['6/11', 'Van registration + tolls', 480], ['6/4', 'Fleet fuel', 1470]] },
      { n: 'Insurance', a: 2400, tx: [['6/1', 'GL + workers comp', 2400]] },
      { n: 'Tools & equipment', a: 1500, tx: [['6/19', 'Milwaukee — replacement kit', 890], ['6/7', 'Test equipment calibration', 610]] },
      { n: 'Rent & misc', a: 2300, tx: [['6/1', 'Shop rent', 1500], ['6/1', 'Software & phones', 800]] },
    ],
    extraKpi: { k: 'EV CHARGERS (MTD)', v: '6', sub: 'fastest-growing line' },
    insights: [
      'Commercial is 40% of revenue but pays in 45+ days; residential pays same-day. Your mid-month cash dip is timing, not performance — now you can see it coming.',
      'EV chargers: 6 in June, best margin in the shop, and growing. Put it on every invoice footer — your own customer list is the cheapest lead source you have.',
      'There\'s $34K sitting in pending estimates at a 61% win rate. A same-week follow-up call moves roughly 1 in 5 of those — worth more than any new ad spend.',
    ],
    extras: [
      {
        tab: 'Estimates',
        kpis: [{ k: 'PENDING', v: '$34K', sub: '11 quotes out' }, { k: 'WIN RATE', v: '61%', sub: 'trailing 90 days' }, { k: 'GONE COLD', v: '2', sub: 'no touch in 3+ weeks' }],
        modules: [{
          type: 'worklist', t: 'Estimate pipeline', sub: 'A same-week follow-up call moves 1 in 5 of these', act: 'FOLLOW UP',
          rows: [
            { a: 'Toms River Twp — field lighting', b: 'Sent 5/28', val: '$12,600', meta: '31 days out', flag: { f: 'GONE COLD', tone: 'red' } },
            { a: 'Bayville office park — panel + circuits', b: 'Sent 6/2', val: '$8,400', meta: '26 days out', flag: { f: 'GONE COLD', tone: 'red' } },
            { a: 'Ocean Dental — renovation circuits', b: 'Sent 6/12', val: '$5,200', meta: '16 days out', flag: { f: 'FOLLOW UP', tone: 'amber' } },
            { a: 'H. Nguyen — 200A panel upgrade', b: 'Sent 6/18', val: '$3,400', meta: '10 days out', flag: { f: 'FOLLOW UP', tone: 'amber' } },
            { a: 'Shore Motel — exterior lighting ph.2', b: 'Sent 6/24', val: '$2,850', meta: '4 days out', flag: { f: 'FRESH', tone: 'green' } },
            { a: 'R. Feldman — EV charger #2', b: 'Sent 6/25', val: '$1,250', meta: '3 days out', flag: { f: 'FRESH', tone: 'green' } },
          ],
          note: 'At your 61% win rate, the two cold ones alone are ~$12.8K of expected revenue sitting in voicemail.',
        }],
      },
      {
        tab: 'A/R & EV',
        modules: [
          {
            type: 'segments', t: 'When the money actually lands', sub: 'Commercial work pays more — and later',
            segs: [
              { name: 'RESIDENTIAL', lines: [['Invoices (Jun)', '24'], ['Avg days to pay', '2'], ['Outstanding', '$1,850']], foot: ['Share of revenue', '44%'] },
              { name: 'COMMERCIAL', hot: true, lines: [['Invoices (Jun)', '11'], ['Avg days to pay', '47'], ['Outstanding', '$28,400']], foot: ['Share of revenue', '40%'] },
              { name: 'PANELS & EV', lines: [['Invoices (Jun)', '9'], ['Avg days to pay', '8'], ['Outstanding', '$3,200']], foot: ['Share of revenue', '16%'] },
            ],
            note: 'The mid-month cash dip is commercial float, not a slow business. Now it is visible instead of scary.',
          },
          {
            type: 'board', t: 'EV charger installs — the growth line', sub: 'Best margin in the shop, and every install markets the next one',
            cols: ['JOB', 'DATE', 'CHARGED', 'COST', 'MARGIN', 'CAME FROM'],
            rows: [
              ['R. Feldman — Tesla wall connector', '6/25', '$1,250', '$520', '58%', 'Referral'],
              ['M. Grasso — Level 2 + subpanel', '6/18', '$2,100', '$980', '53%', 'Invoice footer'],
              ['Bayside condo — shared charger', '6/11', '$3,800', '$1,900', '50%', 'Property manager'],
              ['K. Brooks — Level 2', '6/6', '$1,180', '$540', '54%', 'Google'],
            ],
            note: '6 installs in June, 4 referral sources. Put it on every invoice footer — your customer list is the cheapest ad you own.',
          },
        ],
      },
    ],
    ops: {
      type: 'jobs', label: 'Jobs', title: 'Job board', sub: 'Track every job from estimate to paid',
      cols: ['JOB', 'ELECTRICIAN', 'STATUS', 'CHARGED', 'PROFIT'],
      kpis: [{ k: 'OPEN JOBS', v: '8', sub: '3 commercial' }, { k: 'ESTIMATES OUT', v: '$34K', sub: '11 pending approval' }, { k: 'WIN RATE', v: '61%', sub: 'trailing 90 days' }],
      rows: [
        { a: 'Bayville Fitness — lighting retrofit', b: 'LED conversion, 84 fixtures', who: 'Marc', s: 'in_progress', chg: 12800, cost: 7900 },
        { a: 'H. Nguyen — 200A panel upgrade', b: 'Permit approved', who: 'Dre', s: 'scheduled', chg: 3400, cost: 1750 },
        { a: 'Ocean Twp office — new circuits', b: '6 dedicated circuits, server room', who: 'Marc', s: 'waiting', chg: 2900, cost: 1420 },
        { a: 'R. Feldman — EV charger', b: 'Tesla wall connector, 60A', who: 'Dre', s: 'done', chg: 1250, cost: 520 },
        { a: 'Sandpiper Motel — exterior lighting', b: 'Photocells + timers', who: 'Dre', s: 'in_progress', chg: 1850, cost: 880 },
        { a: 'K. Brooks — troubleshoot flickering', b: 'Diagnostic call', who: 'Marc', s: 'done', chg: 220, cost: 30 },
      ],
    },
  },
  {
    slug: 'landscaping', biz: 'Evergreen Lawn & Landscape', industry: 'Landscaping', emoji: '🌿',
    blurb: 'Route revenue, install jobs, and crew costs by month.',
    theme: { dark: '#1E3326', accent: '#3E8E5A' },
    months: { rev: [62400, 58200, 51800, 42600, 28400, 21200, 19800, 22400, 38600, 52800, 56400, 58900], exp: [45800, 43200, 38900, 32400, 22800, 18100, 17200, 18900, 29800, 39600, 41800, 43700] },
    revCats: [['Weekly maintenance routes', 27200], ['Hardscape & installs', 21400], ['Irrigation', 6100], ['Fertilization programs', 4200]],
    expLines: [
      { n: 'Payroll & crews', a: 21600, tx: [['6/30', 'Payroll — 2 crews of 3', 10800], ['6/15', 'Payroll run', 10800]] },
      { n: 'Materials & plants', a: 10900, tx: [['6/24', 'SiteOne Landscape Supply', 4800], ['6/14', 'Nursery — install job', 3900], ['6/6', 'Mulch — 40 yds', 2200]] },
      { n: 'Equipment & fuel', a: 5200, tx: [['6/27', 'Fuel — trucks + equipment', 2400], ['6/17', 'Mower deck repair', 1100], ['6/5', 'Fuel', 1700]] },
      { n: 'Insurance', a: 2300, tx: [['6/1', 'GL + workers comp + auto', 2300]] },
      { n: 'Dump & disposal fees', a: 1300, tx: [['6/21', 'Green waste facility', 780], ['6/9', 'Green waste facility', 520]] },
      { n: 'Misc & software', a: 2400, tx: [['6/1', 'Route software', 340], ['6/15', 'Equipment lease', 1450], ['6/1', 'Phone & office', 610]] },
    ],
    extraKpi: { k: 'ACTIVE ROUTES', v: '142', sub: 'weekly properties' },
    insights: [
      'Revenue swings 3× between June ($58.9K) and January ($19.8K). Maintenance routes cover about 62% of your winter fixed costs — the installs you book now decide whether January hurts.',
      'Hardscape ran a 39% margin in June vs ~21% on weekly routes. One Whitman-sized patio equals about 3 weeks of route profit.',
      'Crews are at 91% utilization — you\'re near capacity. The next $10K/month is a mix move (more hardscape), not more mowing.',
    ],
    extras: [
      {
        tab: 'Route Book',
        kpis: [{ k: 'WEEKLY ROUTE REVENUE', v: '$6,800', sub: '142 properties' }, { k: 'AVG ROUTE MARGIN', v: '23%', sub: 'after crew + fuel' }, { k: 'UNDERPRICED YARDS', v: '~14', sub: 'mostly Tuesday route' }],
        modules: [{
          type: 'board', t: 'The route book', sub: 'Your recurring base, day by day — this list is what your business is worth',
          cols: ['DAY / ROUTE', 'PROPS', 'WEEKLY $', 'CREW COST', 'MARGIN', ''],
          rows: [
            ['Mon — Silver Bay loop', '24', '$1,180', '$860', '27%', { f: 'HEALTHY', tone: 'green' }],
            ['Tue — Toms River North', '31', '$1,420', '$1,190', '16%', { f: 'REPRICE', tone: 'red' }],
            ['Wed — Ocean Twp', '26', '$1,310', '$980', '25%', { f: 'HEALTHY', tone: 'green' }],
            ['Thu — Lakewood', '29', '$1,390', '$1,110', '20%', { f: 'WATCH', tone: 'amber' }],
            ['Fri — Brick + HOA contracts', '32', '$1,500', '$1,050', '30%', { f: 'BEST DAY', tone: 'green' }],
          ],
          note: 'Tuesday runs 11 points under Friday with the same crew — that is $180/week of mispricing, forever, until you fix it.',
        }],
      },
      {
        tab: 'Contracts',
        modules: [{
          type: 'worklist', t: 'Programs & renewals', sub: 'Fertilization programs and seasonal contracts — renewal season decides your winter', act: 'SEND RENEWAL',
          rows: [
            { a: 'Silver Bay HOA — full grounds contract', b: '$28,400/yr · 3-year term', val: '', meta: 'renewal in 45 days', flag: { f: 'RENEWAL', tone: 'blue' } },
            { a: 'Fertilization program — 61 properties', b: '5-step program · $340 avg', val: '', meta: 'step 4 due in 2 weeks', flag: { f: 'DUE SOON', tone: 'amber' } },
            { a: 'Toms River office park', b: '$9,200/yr grounds', val: '', meta: 'renewal in 20 days', flag: { f: 'RENEWAL', tone: 'blue' } },
            { a: 'Irrigation winterization list', b: '38 systems booked last year', val: '', meta: 'campaign opens Sep 1', flag: { f: 'UPCOMING', tone: 'blue' } },
            { a: 'M. Grasso — annual bed maintenance', b: '$2,100/yr', val: '', meta: 'lapsed 30 days ago', flag: { f: 'WIN BACK', tone: 'red' } },
          ],
          note: 'Programs renew in waves — the win-back list is the cheapest revenue you will ever get.',
        }],
      },
    ],
    ops: {
      type: 'jobs', unit: 'PROJECT', label: 'Install Jobs', title: 'Install & project board', sub: 'The big-ticket jobs alongside your weekly routes',
      cols: ['PROJECT', 'CREW', 'STATUS', 'QUOTED', 'PROFIT'],
      kpis: [{ k: 'INSTALL BACKLOG', v: '$48K', sub: '7 jobs booked' }, { k: 'ROUTE REVENUE / WK', v: '$6,800', sub: '142 properties' }, { k: 'CREW UTILIZATION', v: '91%', sub: 'this month' }],
      rows: [
        { a: 'Whitman residence — paver patio', b: '600 sq ft + fire pit', who: 'Crew A', s: 'in_progress', chg: 18400, cost: 11200 },
        { a: 'Silver Bay HOA — entrance beds', b: 'Design + install', who: 'Crew B', s: 'scheduled', chg: 7200, cost: 4100 },
        { a: 'D. Okafor — sod + irrigation', b: '4,000 sq ft front yard', who: 'Crew A', s: 'waiting', chg: 6800, cost: 4300 },
        { a: 'Toms River office park — cleanup', b: 'Spring cleanup contract', who: 'Crew B', s: 'done', chg: 3400, cost: 1900 },
        { a: 'M. Grasso — drainage + french drain', b: 'Backyard standing water', who: 'Crew A', s: 'scheduled', chg: 4900, cost: 2800 },
      ],
    },
  },
  {
    slug: 'cleaning', biz: 'FreshCoast Commercial Cleaning', industry: 'Cleaning Services', emoji: '🧽',
    blurb: 'Contract revenue, labor cost per account, margin per building.',
    theme: { dark: '#1F2B3A', accent: '#2E9B8F' },
    months: { rev: [38400, 38900, 39600, 40200, 40800, 41200, 41600, 40900, 41400, 41800, 42100, 42300], exp: [28600, 28900, 29400, 29800, 30200, 30400, 30700, 30200, 30600, 30900, 31100, 31200] },
    revCats: [['Office contracts', 24800], ['Medical & dental offices', 9700], ['One-time deep cleans', 7800]],
    expLines: [
      { n: 'Payroll', a: 20400, tx: [['6/30', 'Payroll — 11 cleaners', 10200], ['6/15', 'Payroll run', 10200]] },
      { n: 'Supplies & chemicals', a: 3800, tx: [['6/23', 'Janitorial supply house', 1900], ['6/10', 'Uline — liners & paper', 1200], ['6/3', 'Equipment consumables', 700]] },
      { n: 'Vehicles', a: 2400, tx: [['6/26', 'Fuel', 1100], ['6/12', 'Van insurance', 800], ['6/5', 'Fuel', 500]] },
      { n: 'Insurance & bonding', a: 1900, tx: [['6/1', 'GL + janitorial bond', 1900]] },
      { n: 'Software', a: 900, tx: [['6/1', 'Scheduling + timeclock app', 900]] },
      { n: 'Misc', a: 1800, tx: [['6/18', 'Equipment repair — floor scrubber', 850], ['6/1', 'Office & phone', 950]] },
    ],
    extraKpi: { k: 'ACTIVE CONTRACTS', v: '34', sub: '$31K recurring monthly' },
    insights: [
      '74% of your month ($31.4K of $42.3K) is locked in before it starts — recurring contract revenue. That\'s the number a lender or a buyer of this business cares about most.',
      'Shoreline Realty and Harbor Point CPA are sitting on $4,450 past due — that\'s 40% of a month\'s profit waiting on two phone calls.',
      'Labor is 65% of total spend. Fifteen minutes tighter per building on the night route is worth roughly $900/month.',
    ],
    extras: [
      {
        tab: 'Building Margins',
        modules: [{
          type: 'board', t: 'True margin per building', sub: 'Crew hours logged per account — so you know which contract is underpriced before renewal',
          cols: ['ACCOUNT', 'MONTHLY', 'CREW HRS', 'LABOR $', 'SUPPLIES', 'MARGIN', ''],
          rows: [
            ['Bayview Medical Plaza', '$3,400', '96', '$2,110', '$180', '33%', { f: 'HEALTHY', tone: 'green' }],
            ['Pine Ridge Dental', '$1,850', '52', '$1,140', '$95', '33%', { f: 'HEALTHY', tone: 'green' }],
            ['Toms River Law Center', '$2,200', '68', '$1,500', '$120', '26%', { f: 'WATCH', tone: 'amber' }],
            ['Shoreline Realty offices', '$1,450', '58', '$1,280', '$85', '6%', { f: 'UNDERPRICED', tone: 'red' }],
            ['Harbor Point CPA', '$780', '22', '$480', '$45', '33%', { f: 'HEALTHY', tone: 'green' }],
          ],
          note: 'Shoreline Realty takes 58 hours for $1,450 — either the scope grew or the price did not. That is your next renewal conversation.',
        }],
      },
      {
        tab: 'Renewals & QC',
        modules: [
          {
            type: 'worklist', t: 'Contract renewals', sub: 'Protect the recurring base — it is 74% of your month', act: 'START RENEWAL',
            rows: [
              { a: 'Bayview Medical Plaza', b: '$3,400/mo · 2-year contract', val: '', meta: 'renewal in 30 days', flag: { f: 'RENEWAL', tone: 'blue' } },
              { a: 'Ocean Fitness day porter', b: '$2,600/mo · paused for summer', val: '', meta: 'restart date 9/1', flag: { f: 'WIN BACK', tone: 'amber' } },
              { a: 'Toms River Law Center', b: '$2,200/mo', val: '', meta: 'renewal in 75 days', flag: { f: 'ON TRACK', tone: 'green' } },
            ],
          },
          {
            type: 'worklist', t: 'Walkthrough & QC log', sub: 'The quality story that wins medical and dental accounts', act: 'LOG WALKTHROUGH',
            rows: [
              { a: 'Bayview Medical Plaza', b: 'Walkthrough 6/24 with facilities manager', val: '96/100', flag: { f: 'PASSED', tone: 'green' } },
              { a: 'Pine Ridge Dental', b: 'Walkthrough 6/18', val: '98/100', flag: { f: 'PASSED', tone: 'green' } },
              { a: 'Shoreline Realty', b: 'Complaint 6/20 — break room missed', val: '—', flag: { f: 'FOLLOW UP', tone: 'red' } },
              { a: 'Harbor Point CPA', b: 'Due for quarterly walkthrough', val: '—', flag: { f: 'SCHEDULE', tone: 'amber' } },
            ],
            note: 'Documented walkthroughs are how you defend the price at renewal — and win the next medical office.',
          },
        ],
      },
    ],
    ops: {
      type: 'clients', label: 'Accounts', title: 'Account list', sub: 'Every building, its monthly value, and who owes you',
      cols: ['ACCOUNT', 'STATUS', 'MONTHLY', 'BALANCE DUE'],
      kpis: [{ k: 'RECURRING REVENUE', v: '$31,400', sub: 'monthly contracts' }, { k: 'PAST DUE', v: '$4,850', sub: '3 accounts' }, { k: 'AVG MARGIN / ACCOUNT', v: '27%', sub: 'after labor + supplies' }],
      rows: [
        { a: 'Bayview Medical Plaza', b: '3 suites · 5×/week', s: 'active', chg: 3400, cost: 0 },
        { a: 'Toms River Law Center', b: '2 floors · 3×/week', s: 'active', chg: 2200, cost: 0 },
        { a: 'Shoreline Realty offices', b: '1 floor · 2×/week', s: 'past_due', chg: 1450, cost: 2900 },
        { a: 'Pine Ridge Dental', b: 'Nightly', s: 'active', chg: 1850, cost: 0 },
        { a: 'Harbor Point CPA', b: 'Weekly', s: 'past_due', chg: 780, cost: 1560 },
        { a: 'Ocean Fitness (day porter)', b: 'Daily porter, 4 hrs', s: 'paused', chg: 2600, cost: 390 },
      ],
    },
  },
  {
    slug: 'construction', biz: 'Cornerstone Builders', industry: 'Construction & Remodeling', emoji: '🏗️',
    blurb: 'Job costing per project — draws, subs, and true margin.',
    theme: { dark: '#2A2620', accent: '#C9822E' },
    months: { rev: [182000, 176400, 168800, 194200, 158600, 148400, 172800, 189400, 205600, 218400, 226800, 238000], exp: [152400, 148200, 141800, 162400, 133800, 125600, 144800, 158200, 171400, 181600, 187800, 196400] },
    revCats: [['Residential remodels', 126000], ['New construction draws', 88000], ['Small commercial', 24000]],
    expLines: [
      { n: 'Subcontractors', a: 92000, tx: [['6/27', 'BlueLine Plumbing — Maple Ave rough-in', 18400], ['6/20', 'Amped Electric — Bayview house', 22800], ['6/13', 'Drywall crew — 3 jobs', 16200]] },
      { n: 'Materials', a: 61400, tx: [['6/25', 'ABC Building Supply', 24600], ['6/16', '84 Lumber — framing package', 19800], ['6/6', 'Window & door order', 11400]] },
      { n: 'Payroll', a: 27800, tx: [['6/30', 'Payroll — field + PM + office', 13900], ['6/15', 'Payroll run', 13900]] },
      { n: 'Equipment rental', a: 6200, tx: [['6/22', 'Excavator — 1 week', 3400], ['6/8', 'Lift rental', 2800]] },
      { n: 'Insurance & bonds', a: 4800, tx: [['6/1', 'GL + builders risk + WC', 4800]] },
      { n: 'Permits & misc', a: 4200, tx: [['6/18', 'Township permits — 2 jobs', 2600], ['6/1', 'Software & office', 1600]] },
    ],
    extraKpi: { k: 'BACKLOG', v: '$1.4M', sub: 'signed, not yet started' },
    insights: [
      'Bayview Ave is holding 25% margin at draw 4 — but Hooper Ave is already at 67% cost-to-contract with a third of the work left. Watch the next sub invoice before it eats the whole margin.',
      '$86K is sitting in unbilled draws. Invoicing draws a week earlier, every time, is permanent free cash flow.',
      'Your margin problems last year clustered on jobs under $50K. The data says: stop taking small jobs, or price them 8 points higher.',
    ],
    extras: [
      {
        tab: 'Draws & COs',
        kpis: [{ k: 'UNBILLED DRAWS', v: '$86K', sub: 'milestones already hit' }, { k: 'PENDING CHANGE ORDERS', v: '$23.4K', sub: '2 awaiting signature' }, { k: 'RETAINAGE HELD', v: '$31K', sub: 'across 3 jobs' }],
        modules: [
          {
            type: 'worklist', t: 'Draw & billing tracker', sub: 'Cash flow kills GCs, not margin — bill the moment the milestone hits', act: 'INVOICE NOW',
            rows: [
              { a: 'Bayview Ave — draw 5 of 6', b: 'Framing + roof milestone hit', val: '$58,000', meta: 'ready 8 days', flag: { f: 'BILL NOW', tone: 'red' } },
              { a: 'Hooper Ave storefront — progress bill', b: 'Per contract, due 7/1', val: '$22,000', meta: 'due now', flag: { f: 'BILL NOW', tone: 'red' } },
              { a: 'Maple Ave — draw 3 of 4', b: 'Tile + trim milestone', val: '$28,000', meta: '~2 weeks out', flag: { f: 'UPCOMING', tone: 'blue' } },
              { a: 'Silverton kitchen — final invoice', b: 'Punch list still open', val: '$12,800', meta: 'blocked', flag: { f: 'ON HOLD', tone: 'amber' } },
            ],
            note: 'Every draw billed a week earlier is permanent free cash flow. $80K is sitting here right now.',
          },
          {
            type: 'worklist', t: 'Change orders', sub: 'Where remodel margin quietly dies — unsigned and unbilled scope', act: 'SEND FOR SIGNATURE',
            rows: [
              { a: 'Bayview Ave — deck extension', b: 'Priced 6/20, verbal yes', val: '$11,600', flag: { f: 'PENDING SIGNATURE', tone: 'red' } },
              { a: 'Maple Ave — cabinet upgrade', b: 'Signed 6/12', val: '$8,400', flag: { f: 'APPROVED · UNBILLED', tone: 'amber' } },
              { a: 'Hooper Ave — ADA hardware', b: 'Signed + billed 6/8', val: '$3,400', flag: { f: 'BILLED', tone: 'green' } },
            ],
            note: 'A verbal yes is a gift, not a contract. Nothing starts until it is signed — this list enforces that.',
          },
        ],
      },
      {
        tab: 'Job Costs',
        modules: [{
          type: 'board', t: 'Budget vs. actual, per project', sub: 'Margin visible mid-job — not three months after closeout',
          cols: ['PROJECT', 'COST BUDGET', 'COST TO DATE', '% COMPLETE', 'PACE', ''],
          rows: [
            ['Bayview Ave new build', '$545K', '$512K', '91%', 'on budget', { f: 'ON TRACK', tone: 'green' }],
            ['Maple Ave gut remodel', '$172K', '$149K', '70%', 'burning fast', { f: 'WATCH', tone: 'amber' }],
            ['Hooper Ave storefront', '$112K', '$98K', '66%', 'over pace', { f: 'OVER', tone: 'red' }],
            ['Silverton kitchen', '$47K', '$41K', '92%', 'on budget', { f: 'ON TRACK', tone: 'green' }],
          ],
          note: 'Hooper has spent 88% of budget at 66% complete. You want that conversation with the subs THIS week, not at closeout.',
        }],
      },
    ],
    ops: {
      type: 'jobs', unit: 'PROJECT', label: 'Projects', title: 'Active projects', sub: 'Contract value vs. cost to date — margin visible before the job closes',
      cols: ['PROJECT', 'PM', 'STATUS', 'CONTRACT', 'MARGIN TO DATE'],
      kpis: [{ k: 'ACTIVE PROJECTS', v: '6', sub: '2 in punch-list' }, { k: 'DRAWS OUTSTANDING', v: '$86K', sub: '3 invoices pending' }, { k: 'AVG PROJECT MARGIN', v: '18%', sub: 'trailing 6 months' }],
      rows: [
        { a: 'Bayview Ave — new build', b: '3,200 sq ft custom · draw 4 of 6', who: 'Tony', s: 'in_progress', chg: 684000, cost: 512000 },
        { a: 'Maple Ave — full gut remodel', b: 'Kitchen + 2 baths + addition', who: 'Rich', s: 'in_progress', chg: 218000, cost: 149000 },
        { a: 'Hooper Ave storefront', b: 'Commercial fit-out, 2,400 sq ft', who: 'Tony', s: 'waiting', chg: 146000, cost: 98000 },
        { a: 'Silverton kitchen', b: 'Cabinets installed, counters Thu', who: 'Rich', s: 'in_progress', chg: 64000, cost: 41000 },
        { a: 'Brick Blvd office — ADA bathroom', b: 'Punch list', who: 'Tony', s: 'done', chg: 38000, cost: 29500 },
      ],
    },
  },
  {
    slug: 'restaurant', biz: 'Brick & Ember Pizzeria', industry: 'Restaurant & Pizzeria', emoji: '🍕',
    blurb: 'Food cost, delivery-app fees, and what each channel really earns.',
    theme: { dark: '#33201B', accent: '#C0492F' },
    months: { rev: [98600, 96200, 84800, 78400, 76200, 82600, 79800, 74200, 79400, 82800, 85600, 88400], exp: [81400, 79800, 71200, 66800, 65400, 69800, 67900, 63800, 67400, 69800, 72100, 74300] },
    revCats: [['Takeout & delivery', 41600], ['Dine-in', 34200], ['Catering', 12600]],
    expLines: [
      { n: 'Food cost', a: 28600, tx: [['6/26', 'Restaurant Depot', 8400], ['6/19', 'Produce vendor', 3200], ['6/12', 'Cheese & flour distributor', 6800]] },
      { n: 'Payroll', a: 27400, tx: [['6/30', 'Payroll — kitchen + counter + drivers', 13700], ['6/15', 'Payroll run', 13700]] },
      { n: 'Rent', a: 7800, tx: [['6/1', 'Route 37 plaza', 7800]] },
      { n: 'Delivery platform fees', a: 4700, tx: [['6/30', 'DoorDash commission', 2600], ['6/30', 'Uber Eats commission', 1500], ['6/30', 'Slice fees', 600]] },
      { n: 'Utilities', a: 2900, tx: [['6/14', 'Electric — ovens + walk-in', 1900], ['6/8', 'Gas', 1000]] },
      { n: 'Supplies & misc', a: 2900, tx: [['6/21', 'Boxes & packaging', 1400], ['6/1', 'POS + software', 620], ['6/9', 'Hood cleaning', 880]] },
    ],
    extraKpi: { k: 'FOOD COST', v: '32.4%', sub: 'target: under 33%' },
    insights: [
      'Delivery apps took $4,700 in June — 11.3% of delivery revenue. Moving just 15% of app orders to direct ordering (box flyers, QR reorder cards) is ~$700/month straight to profit.',
      'Overall food cost is 32.4%, inside target — but catering runs 38%. It\'s your biggest ticket at your thinnest margin. Price the trays up 8%; nobody comparison-shops a party tray.',
      'July did $98.6K last year vs $74.2K in February. Staff up now, then cut Sunday-night hours after Labor Day — this pattern repeats every single year.',
    ],
    extras: [
      {
        tab: 'Channels',
        modules: [{
          type: 'segments', t: 'What each channel really pays you', sub: 'Same pizza, four different businesses',
          segs: [
            { name: 'DINE-IN', hot: true, lines: [['Orders (Jun)', '1,180'], ['Avg ticket', '$29.10'], ['Platform fees', '$0']], foot: ['Profit / order', '$6.10'] },
            { name: 'TAKEOUT DIRECT', lines: [['Orders (Jun)', '820'], ['Avg ticket', '$26.40'], ['Platform fees', '$0']], foot: ['Profit / order', '$5.40'] },
            { name: 'DOORDASH', lines: [['Orders (Jun)', '610'], ['Avg ticket', '$34.20'], ['Fees / order', '($4.90)']], foot: ['Profit / order', '$2.80'] },
            { name: 'UBER EATS', lines: [['Orders (Jun)', '205'], ['Avg ticket', '$33.10'], ['Fees / order', '($4.60)']], foot: ['Profit / order', '$2.90'] },
          ],
          note: 'A DoorDash order LOOKS bigger and pays you less than half of dine-in. Box flyers + QR reorder cards move 15% of app orders direct — about $700/month straight to profit.',
        }],
      },
      {
        tab: 'Food & Labor',
        modules: [
          {
            type: 'board', t: 'Food cost by week', sub: 'The number every operator lives by — weekly, not month-end',
            cols: ['WEEK', 'SALES', 'FOOD PURCHASES', 'FOOD COST %', 'TARGET', ''],
            rows: [
              ['Jun 1–7', '$21,400', '$6,810', '31.8%', '33%', { f: 'HIT', tone: 'green' }],
              ['Jun 8–14', '$20,800', '$7,090', '34.1%', '33%', { f: 'MISS', tone: 'red' }],
              ['Jun 15–21', '$22,600', '$7,230', '32.0%', '33%', { f: 'HIT', tone: 'green' }],
              ['Jun 22–28', '$23,600', '$7,650', '32.4%', '33%', { f: 'HIT', tone: 'green' }],
            ],
            note: 'The week-2 miss was the big Restaurant Depot buy — timing, not waste. Weekly view is how you know the difference.',
          },
          {
            type: 'board', t: 'Labor vs. sales by shift', sub: 'Where to add a body and where to cut one',
            cols: ['SHIFT', 'AVG SALES', 'LABOR $', 'LABOR %', ''],
            rows: [
              ['Friday dinner', '$8,900', '$1,690', '19%', { f: 'STRONG', tone: 'green' }],
              ['Saturday dinner', '$9,400', '$1,780', '19%', { f: 'STRONG', tone: 'green' }],
              ['Sunday night', '$2,300', '$860', '37%', { f: 'WATCH', tone: 'amber' }],
              ['Tuesday lunch', '$1,150', '$540', '47%', { f: 'CUT A SHIFT', tone: 'red' }],
            ],
            note: 'Tuesday lunch pays 47 cents of every dollar to labor. Close the slicer station or run a lunch special — either fixes it.',
          },
        ],
      },
    ],
    ops: {
      type: 'sales', label: 'Menu & Sales', title: 'What actually makes you money', sub: 'Top sellers by item — revenue, cost, and real margin',
      kpis: [{ k: 'AVG TICKET', v: '$31.40', sub: 'up $2.10 vs last month' }, { k: 'ORDERS (MTD)', v: '2,815', sub: '58% takeout/delivery' }, { k: 'DELIVERY APP FEES', v: '$4,700', sub: '11.3% of delivery revenue' }],
      items: [
        ['Large plain pie', 1240, 21700, 5580], ['Specialty pies (vodka, BBQ chix)', 680, 15640, 4890], ['Chicken parm dinner', 310, 5890, 2140], ['Wings (per 10)', 520, 7280, 3120], ['Catering — party trays', 48, 12600, 4800], ['Salads & apps', 590, 6490, 2260],
      ],
    },
  },
  {
    slug: 'liquor-store', biz: 'Bayview Wine & Spirits', industry: 'Liquor Store', emoji: '🍷',
    blurb: 'Category margins, inventory turns, and what the registers really net.',
    theme: { dark: '#2B1E33', accent: '#8E4FA8' },
    months: { rev: [121400, 108600, 102800, 106400, 118200, 138600, 98400, 94800, 101200, 105800, 109400, 114800], exp: [104800, 93800, 88900, 91800, 101900, 119200, 85200, 82100, 87400, 91200, 94300, 98700] },
    revCats: [['Spirits', 51200], ['Wine', 33400], ['Beer', 22800], ['Mixers & other', 7400]],
    expLines: [
      { n: 'Product (COGS)', a: 82600, tx: [['6/24', 'Fedway Associates', 31200], ['6/17', 'Allied Beverage', 26800], ['6/10', 'Beer distributor', 14200]] },
      { n: 'Payroll', a: 8900, tx: [['6/30', 'Payroll — 4 part-time + manager', 4450], ['6/15', 'Payroll run', 4450]] },
      { n: 'Rent', a: 4200, tx: [['6/1', 'Bayview shopping center', 4200]] },
      { n: 'Insurance', a: 1300, tx: [['6/1', 'Liquor liability + property', 1300]] },
      { n: 'Card fees & misc', a: 1700, tx: [['6/30', 'Card processing', 1250], ['6/1', 'POS + security', 450]] },
    ],
    extraKpi: { k: 'GROSS MARGIN', v: '28.1%', sub: 'wine leads at 34%' },
    insights: [
      'Wine is 29% of revenue at a 34% margin; beer is 20% of revenue at 22%. Every end-cap you flip from beer promo to wine promo is a straight margin trade-up.',
      'You\'re turning $142K of inventory 4.1× a year — but roughly $9K of it hasn\'t moved in 6 months. A bin sale turns that into cash before the holiday buy.',
      'December did $138.6K — 1.4× a normal month — and the holiday order deposits land in October. Summer cash discipline is what makes December possible.',
    ],
    extras: [
      {
        tab: 'Dead Stock',
        kpis: [{ k: 'CASH FROZEN', v: '$9,200', sub: '47 stale SKUs' }, { k: 'OLDEST', v: '14 mo', sub: 'novelty minis' }, { k: 'MARKDOWN TARGET', v: '$4,900', sub: 'recoverable before Oct buy' }],
        modules: [{
          type: 'worklist', t: 'Dead stock — cash sleeping on the shelf', sub: 'No register report shows you this. Turn it into the October deposit.', act: 'MARK DOWN',
          rows: [
            { a: 'Novelty minis assortment', b: 'No sale in 14 months', val: '$340', flag: { f: 'CLEARANCE', tone: 'red' } },
            { a: 'Rosé cases — last summer buy', b: 'No sale in 11 months · 9 cases', val: '$1,240', flag: { f: 'MARKDOWN', tone: 'red' } },
            { a: 'Hard kombucha line', b: 'No sale in 9 months', val: '$460', flag: { f: 'MARKDOWN', tone: 'red' } },
            { a: 'Craft gin — local distillery', b: 'No sale in 8 months · 9 bottles', val: '$780', flag: { f: 'MARKDOWN', tone: 'amber' } },
            { a: 'Japanese whisky — limited allocation', b: '6 months, but appreciating', val: '$2,100', flag: { f: 'HOLD', tone: 'green' } },
          ],
          note: 'A bin sale turns ~$4,900 of dust into cash. The whisky stays — allocation bottles are the one thing that earns rent on the shelf.',
        }],
      },
      {
        tab: 'Mix Planner',
        modules: [{
          type: 'mix', t: 'Flip an end-cap, keep the difference', sub: 'Same shelf, same foot traffic — different margin',
          aName: 'Beer', bName: 'Wine', aM: 22, bM: 34, perCap: 3800, max: 6,
          note: 'A wine end-cap in a store this size moves ~$3,800/month. The margin gap does the rest — drag the slider.',
        }],
      },
    ],
    ops: {
      type: 'sales', label: 'Categories', title: 'Category performance', sub: 'Where the margin actually is — not just where the volume is',
      kpis: [{ k: 'TRANSACTIONS (MTD)', v: '6,240', sub: 'avg basket $18.40' }, { k: 'INVENTORY ON HAND', v: '$142K', sub: '4.1 turns/year' }, { k: 'TOP MARGIN LINE', v: 'Wine', sub: '34% vs 22% on beer' }],
      items: [
        ['Bourbon & whiskey', 2140, 28400, 21100], ['Vodka & tequila', 1890, 22800, 17300], ['Wine — domestic', 1450, 19600, 12800], ['Wine — imported', 820, 13800, 9200], ['Beer — cases & six-packs', 2680, 22800, 17800], ['Seltzers, mixers & minis', 1520, 7400, 5400],
      ],
    },
  },
  {
    slug: 'barbershop', biz: 'Fade District Barbershop', industry: 'Barbershop & Salon', emoji: '💈',
    blurb: 'Chair revenue, product sales, and per-barber performance.',
    theme: { dark: '#1D2530', accent: '#C9A84C' },
    months: { rev: [28900, 29400, 30100, 29800, 28600, 31800, 27400, 26800, 28900, 29800, 30600, 31400], exp: [20400, 20700, 21100, 20900, 20200, 22100, 19400, 19100, 20300, 20900, 21400, 21900] },
    revCats: [['Haircuts & fades', 21800], ['Beard work & hot shaves', 5200], ['Product sales', 4400]],
    expLines: [
      { n: 'Barber commissions', a: 13600, tx: [['6/30', 'Commission payout — 4 chairs', 6800], ['6/15', 'Commission payout', 6800]] },
      { n: 'Rent', a: 3800, tx: [['6/1', 'Main St storefront', 3800]] },
      { n: 'Product cost', a: 2200, tx: [['6/20', 'Pomade & product wholesale', 1400], ['6/6', 'Suavecito order', 800]] },
      { n: 'Supplies', a: 1100, tx: [['6/18', 'Blades, capes, sanitation', 650], ['6/4', 'Towel service', 450]] },
      { n: 'Software & booking', a: 600, tx: [['6/1', 'Booksy + card reader fees', 600]] },
      { n: 'Misc', a: 600, tx: [['6/12', 'Utilities', 380], ['6/1', 'Music licensing + wifi', 220]] },
    ],
    extraKpi: { k: 'CUTS THIS MONTH', v: '918', sub: 'avg $23.70 + tips' },
    insights: [
      'Product attach is 19% and product margin is 50% — every 5 points of attach is ~$550/month. The chairs that mention product mid-cut sell 3× more of it.',
      'Clients who rebook before leaving come back every 3.5 weeks; walk-outs stretch to 5+. Your 64% rebook rate hides ~90 "missing" cuts a year.',
      'Saturday turns people away while Tuesday sits at 60% booked. A $5 Tuesday special fills dead chairs without discounting your peak.',
    ],
    extras: [
      {
        tab: 'Scoreboard',
        modules: [{
          type: 'board', t: 'Chair scoreboard — June', sub: 'Post it in the back room and watch rebook rates jump',
          cols: ['BARBER', 'CUTS', 'REVENUE', 'REBOOK %', 'ATTACH %', 'COMMISSION', ''],
          rows: [
            ['Dre', '268', '$7,240', '74%', '26%', '$3,620', { f: 'TOP CHAIR', tone: 'green' }],
            ['Marco', '241', '$6,190', '66%', '21%', '$3,095', { f: 'SOLID', tone: 'green' }],
            ['Jay', '224', '$5,480', '58%', '14%', '$2,740', { f: 'COACH ATTACH', tone: 'amber' }],
            ['Tone', '185', '$4,510', '49%', '11%', '$2,255', { f: 'REBOOK TALK', tone: 'red' }],
          ],
          note: 'Dre rebooks 74% and sells product on 1 of 4 cuts — that is $2,700/month more than Tone from the same chair. Commission math is transparent, so nobody argues payday.',
        }],
      },
    ],
    ops: {
      type: 'sales', label: 'Services', title: 'Service & product mix', sub: 'What fills the chairs vs. what pads the margin',
      kpis: [{ k: 'BOOKED THIS WEEK', v: '87%', sub: 'of available slots' }, { k: 'REBOOK RATE', v: '64%', sub: 'clients booking next cut' }, { k: 'PRODUCT ATTACH', v: '19%', sub: 'of cuts add product' }],
      items: [
        ['Fade / taper', 512, 14340, 0], ['Cut + beard combo', 218, 7630, 0], ['Hot towel shave', 84, 2940, 210], ['Kids cuts', 104, 2290, 0], ['Pomade & product', 186, 4400, 2200],
      ],
    },
  },
  {
    slug: 'boutique', biz: 'Willow & Main Boutique', industry: 'Boutique & Retail', emoji: '🛍️',
    blurb: 'In-store vs. online, inventory cost, and margin by category.',
    theme: { dark: '#33222B', accent: '#B85C79' },
    months: { rev: [42800, 39600, 41200, 44800, 52600, 61400, 38200, 36800, 40400, 43200, 44900, 46700], exp: [35100, 32800, 33900, 36600, 42400, 48900, 31800, 30900, 33400, 35400, 36600, 37800] },
    revCats: [['In-store sales', 29800], ['Online orders', 12400], ['Alterations & services', 4500]],
    expLines: [
      { n: 'Inventory (COGS)', a: 21900, tx: [['6/23', 'Market buy — fall preview', 9800], ['6/14', 'Brand rep order — denim', 6400], ['6/5', 'Jewelry & accessories vendor', 5700]] },
      { n: 'Payroll', a: 8200, tx: [['6/30', 'Payroll — 3 part-time + manager', 4100], ['6/15', 'Payroll run', 4100]] },
      { n: 'Rent', a: 4600, tx: [['6/1', 'Downtown Main St', 4600]] },
      { n: 'Shopify & card fees', a: 1500, tx: [['6/30', 'Card processing', 980], ['6/1', 'Shopify + apps', 520]] },
      { n: 'Marketing', a: 900, tx: [['6/16', 'Instagram ads', 600], ['6/2', 'Email platform', 300]] },
      { n: 'Misc', a: 700, tx: [['6/10', 'Bags & packaging', 420], ['6/1', 'Utilities & wifi', 280]] },
    ],
    extraKpi: { k: 'AVG SALE', v: '$68', sub: 'in-store · $84 online' },
    insights: [
      'Dresses are 28% of June revenue at a 54% margin — they carry the store. The sale rack runs half that margin; keep it to one rack in the back.',
      'Online is 27% of revenue with a higher average sale ($84 vs $68). Spring sell-through hit 71% — reorder your dress vendors now, don\'t wait for market.',
      'December did $61.4K vs $36.8K in February. Let Q4\'s receipts write the fall open-to-buy: more dresses and jewelry, not more denim.',
    ],
    extras: [
      {
        tab: 'Sell-Through',
        modules: [{
          type: 'board', t: 'Sell-through & reorder board', sub: 'The buying decision IS the boutique decision — make it with receipts, not gut',
          cols: ['CATEGORY / VENDOR', 'RECEIVED', 'SOLD', 'SELL-THRU', 'WKS OF STOCK', ''],
          rows: [
            ['Dresses — MINKPINK', '84', '71', '85%', '2.1', { f: 'REORDER NOW', tone: 'red' }],
            ['Jewelry — local maker', '150', '112', '75%', '3.8', { f: 'REORDER SOON', tone: 'amber' }],
            ['Tops & knits — Z Supply', '120', '89', '74%', '4.2', { f: 'HEALTHY', tone: 'green' }],
            ['Denim — AGOLDE', '60', '38', '63%', '6.4', { f: 'HEALTHY', tone: 'green' }],
            ['Shoes — Matisse', '44', '21', '48%', '9.8', { f: 'MARKDOWN', tone: 'amber' }],
          ],
          note: 'REORDER NOW means the winner sells out before the reorder lands. That is the only true emergency in retail.',
        }],
      },
      {
        tab: 'Buying & Channels',
        modules: [
          {
            type: 'board', t: 'Fall open-to-buy', sub: 'Last fall wrote this budget — not a vendor rep with a lookbook',
            cols: ['CATEGORY', 'LAST FALL SALES', 'FALL BUDGET', 'COMMITTED', 'LEFT TO SPEND'],
            rows: [
              ['Dresses', '$38,200', '$21,000', '$9,800', '$11,200'],
              ['Jewelry & accessories', '$16,900', '$8,500', '$3,200', '$5,300'],
              ['Tops & knits', '$24,100', '$11,000', '$6,400', '$4,600'],
              ['Denim', '$18,400', '$7,000', '$6,400', '$600'],
              ['Shoes', '$9,200', '$3,000', '$2,680', '$320'],
            ],
            note: 'Denim is nearly spent and shoes are done. When the rep pushes more, the answer is on this screen.',
          },
          {
            type: 'segments', t: 'In-store vs. online — true margin', sub: 'After every fee, not before',
            segs: [
              { name: 'IN-STORE', lines: [['Sales (Jun)', '$29,800'], ['Avg sale', '$68'], ['Rent + staff share', '($9,400)']], foot: ['Channel margin', '22%'] },
              { name: 'ONLINE', hot: true, lines: [['Sales (Jun)', '$12,400'], ['Avg sale', '$84'], ['Fees + shipping', '($1,830)']], foot: ['Channel margin', '25%'] },
            ],
            note: 'Online carries no rent and a higher basket — every dollar moved there is a better dollar.',
          },
        ],
      },
    ],
    ops: {
      type: 'sales', label: 'Categories', title: 'Category performance', sub: 'Sell-through and margin by line — know what to reorder',
      kpis: [{ k: 'TRANSACTIONS (MTD)', v: '612', sub: '441 in-store · 171 online' }, { k: 'INVENTORY ON HAND', v: '$58K', sub: 'at cost' }, { k: 'SELL-THROUGH', v: '71%', sub: 'spring collection' }],
      items: [
        ['Dresses', 148, 13300, 6100], ['Denim & bottoms', 96, 8640, 4230], ['Tops & knits', 187, 10280, 4820], ['Jewelry & accessories', 142, 6390, 2350], ['Shoes', 44, 4840, 2680], ['Sale rack', 89, 3250, 1720],
      ],
    },
  },
  {
    slug: 'gym', biz: 'Ironworks Fitness Club', industry: 'Gym & Fitness', emoji: '🏋️',
    blurb: 'Membership base, churn, PT revenue, and who owes dues.',
    theme: { dark: '#23272B', accent: '#D95B43' },
    months: { rev: [46800, 47200, 48100, 49400, 50200, 50800, 54600, 53800, 52400, 52800, 53000, 53200], exp: [35400, 35600, 36100, 36900, 37400, 37800, 40200, 39600, 38900, 39200, 39400, 39600] },
    revCats: [['Memberships', 38600], ['Personal training', 10400], ['Classes & day passes', 4200]],
    expLines: [
      { n: 'Payroll & trainers', a: 19800, tx: [['6/30', 'Payroll — staff + trainer splits', 9900], ['6/15', 'Payroll run', 9900]] },
      { n: 'Rent', a: 9800, tx: [['6/1', '12,000 sq ft — industrial park', 9800]] },
      { n: 'Equipment & maintenance', a: 3600, tx: [['6/22', 'Treadmill belt + service call', 1400], ['6/8', 'Plate & dumbbell replacement', 2200]] },
      { n: 'Utilities', a: 2700, tx: [['6/14', 'Electric — HVAC heavy', 2100], ['6/8', 'Water & sewer', 600]] },
      { n: 'Insurance', a: 1600, tx: [['6/1', 'GL + participant liability', 1600]] },
      { n: 'Software & misc', a: 2100, tx: [['6/1', 'Gym management software', 480], ['6/30', 'Card processing on dues', 1120], ['6/1', 'Music + streaming licenses', 500]] },
    ],
    extraKpi: { k: 'ACTIVE MEMBERS', v: '714', sub: '+22 net this month' },
    insights: [
      '31 failed payments are sitting on $1,840 — that\'s silent churn. Same-day retry + a text recovers ~70% of these; that\'s $1,300/month you\'re currently donating.',
      'Personal training is 20% of revenue at your best margin, but only ~40 of 714 members train. Ten new PT clients are worth more than sixty new memberships.',
      'January\'s signup bump predictably decays by April. In your data, the 90-day check-in is the single highest-ROI retention move you have.',
    ],
    extras: [
      {
        tab: 'Recovery',
        kpis: [{ k: 'FAILED PAYMENTS', v: '$1,840', sub: '31 cards' }, { k: 'RECOVERED (MTD)', v: '$890', sub: 'retry + text' }, { k: 'TYPICAL SAVE RATE', v: '~70%', sub: 'if chased same-day' }],
        modules: [{
          type: 'worklist', t: 'Failed payments to chase', sub: 'Silent churn — every card here is a member who did not cancel', act: 'RETRY + TEXT',
          rows: [
            { a: 'J. Whitfield', b: 'Standard monthly', val: '$98', meta: '2 cycles behind', flag: { f: 'URGENT', tone: 'red' } },
            { a: 'D. Ramos', b: 'Standard + classes', val: '$158', meta: '2 cycles behind', flag: { f: 'URGENT', tone: 'red' } },
            { a: 'L. Grant', b: 'Unlimited', val: '$138', meta: '2 cycles behind', flag: { f: 'URGENT', tone: 'red' } },
            { a: 'K. Douglas', b: 'Standard monthly', val: '$79', meta: '6 days', flag: { f: 'RETRY', tone: 'amber' } },
            { a: 'M. Chen', b: 'Standard monthly', val: '$49', meta: '3 days', flag: { f: 'RETRY', tone: 'amber' } },
            { a: 'S. Ortiz', b: 'Standard monthly', val: '$49', meta: 'failed yesterday', flag: { f: 'FRESH', tone: 'green' } },
          ],
          note: 'Fresh fails recover at ~90%. Two-cycle fails are basically cancellations — which is why this list exists.',
        }],
      },
      {
        tab: 'Retention & PT',
        modules: [
          {
            type: 'worklist', t: '90-day check-in list', sub: 'The January cohort is deciding right now whether to quit in April', act: 'MARK CALLED',
            rows: [
              { a: 'A. Kowalski', b: 'Joined Jan 6 · no visit in 3 weeks', val: '', flag: { f: 'AT RISK', tone: 'red' } },
              { a: 'T. Rivera', b: 'Joined Jan 12 · 2 visits/week', val: '', flag: { f: 'HEALTHY', tone: 'green' } },
              { a: 'B. Okafor', b: 'Joined Jan 15 · no visit in 2 weeks', val: '', flag: { f: 'AT RISK', tone: 'red' } },
              { a: 'C. Munoz', b: 'Joined Jan 20 · 1 visit/week', val: '', flag: { f: 'CHECK IN', tone: 'amber' } },
              { a: 'R. Stein', b: 'Joined Jan 27 · 3 visits/week', val: '', flag: { f: 'PT UPSELL?', tone: 'blue' } },
            ],
            note: 'Members who get a human call at 90 days stay ~5 months longer. This list is the whole retention machine.',
          },
          {
            type: 'board', t: 'Personal training engine', sub: 'Best margin in the building — and only 40 of 714 members use it',
            cols: ['TRAINER', 'SESSIONS (JUN)', 'REVENUE', 'TRAINER SPLIT', 'NET TO GYM', ''],
            rows: [
              ['Maya', '84', '$5,880', '$3,230', '$2,650', { f: 'FULLY BOOKED', tone: 'green' }],
              ['Derek', '61', '$4,270', '$2,350', '$1,920', { f: 'ROOM FOR 15', tone: 'amber' }],
              ['Sam (new)', '18', '$1,260', '$690', '$570', { f: 'RAMPING', tone: 'blue' }],
            ],
            note: 'Ten new PT clients net more than sixty new memberships — and Derek has open slots this week.',
          },
        ],
      },
    ],
    ops: {
      type: 'clients', label: 'Members', title: 'Membership & dues board', sub: 'Failed payments chased automatically — this is the list that pays your rent',
      cols: ['MEMBER', 'STATUS', 'MONTHLY', 'BALANCE DUE'],
      kpis: [{ k: 'MRR', v: '$38,600', sub: '714 active members' }, { k: 'FAILED PAYMENTS', v: '$1,840', sub: '31 cards to retry' }, { k: 'CHURN', v: '2.8%', sub: 'monthly — target under 3%' }],
      rows: [
        { a: 'M. Castellano', b: 'Unlimited + PT (8 sessions/mo)', s: 'active', chg: 389, cost: 0 },
        { a: 'J. Whitfield', b: 'Standard monthly', s: 'past_due', chg: 49, cost: 98 },
        { a: 'Bayside Crossfit crew (corp.)', b: 'Corporate — 12 seats', s: 'active', chg: 468, cost: 0 },
        { a: 'D. Ramos', b: 'Standard + classes', s: 'past_due', chg: 79, cost: 158 },
        { a: 'S. Iqbal', b: 'Annual (paid up)', s: 'active', chg: 42, cost: 0 },
        { a: 'T. Callahan', b: 'Standard — froze for summer', s: 'paused', chg: 49, cost: 0 },
      ],
    },
  },
  {
    slug: 'dental', biz: 'Pearl Dental Studio', industry: 'Dental Practice', emoji: '🦷',
    blurb: 'Production vs. collections, insurance A/R, and case acceptance.',
    theme: { dark: '#1E3A44', accent: '#2E8FA3' },
    months: { rev: [118200, 121400, 119800, 122600, 124800, 121200, 116400, 119800, 123400, 125200, 126400, 127600], exp: [86400, 88200, 87100, 89400, 90800, 88400, 84900, 87200, 89800, 91100, 92000, 92800] },
    revCats: [['Insurance reimbursements', 71400], ['Patient payments', 39800], ['Cosmetic & whitening', 16400]],
    expLines: [
      { n: 'Payroll — hygienists & staff', a: 46200, tx: [['6/30', 'Payroll — 2 hygienists, 3 front/back', 23100], ['6/15', 'Payroll run', 23100]] },
      { n: 'Supplies & lab fees', a: 21400, tx: [['6/24', 'Crown & bridge lab', 9200], ['6/15', 'Henry Schein order', 8400], ['6/5', 'Implant components', 3800]] },
      { n: 'Rent', a: 9600, tx: [['6/1', 'Medical plaza suite', 9600]] },
      { n: 'Equipment leases', a: 6400, tx: [['6/1', 'CBCT + chairs lease', 4600], ['6/1', 'Cerec milling lease', 1800]] },
      { n: 'Malpractice & insurance', a: 4100, tx: [['6/1', 'Malpractice premium', 3200], ['6/1', 'Office policy', 900]] },
      { n: 'Software & misc', a: 5100, tx: [['6/1', 'Practice management + imaging', 1900], ['6/30', 'Card & financing fees', 1800], ['6/12', 'Marketing — new patient ads', 1400]] },
    ],
    extraKpi: { k: 'COLLECTIONS RATE', v: '96.8%', sub: 'of net production' },
    insights: [
      '$84K of accepted treatment is unscheduled — the biggest number in the practice. One front-desk hour a day working that list beats any new-patient ad campaign.',
      'Collections are strong at 96.8%, but $12.4K of insurance A/R is past 60 days across 9 claims — claims age badly after 90; chase them this month.',
      'Cosmetic is 13% of revenue, best margin, zero insurance friction. With 38 new patients in June, every cosmetic case accepted adds ~$2K average.',
    ],
    extras: [
      {
        tab: 'Treatment List',
        kpis: [{ k: 'UNSCHEDULED', v: '$84K', sub: 'accepted, not booked' }, { k: 'BOOKED THIS WEEK', v: '$9,200', sub: 'from this list' }, { k: 'AVG DAYS SINCE ACCEPT', v: '34', sub: 'they cool fast after 45' }],
        modules: [{
          type: 'worklist', t: 'Accepted, not scheduled', sub: 'The most valuable list in the practice — one front-desk hour a day works it', act: 'CALL TODAY',
          rows: [
            { a: 'S. Brennan', b: 'Crowns ×2 — accepted 5/12', val: '$2,900', meta: '61 days', flag: { f: 'GOING COLD', tone: 'red' } },
            { a: 'M. Okonkwo', b: 'Invisalign refinement', val: '$1,100', meta: '44 days', flag: { f: 'GOING COLD', tone: 'red' } },
            { a: 'J. Marino', b: 'Veneers — full case accepted', val: '$8,400', meta: '18 days', flag: { f: 'CALL', tone: 'amber' } },
            { a: 'K. Liu', b: 'Perio phase 2', val: '$780', meta: '12 days', flag: { f: 'CALL', tone: 'amber' } },
            { a: 'R. Delgado', b: 'Implant phase 2 — crown seat', val: '$3,200', meta: '9 days', flag: { f: 'FRESH', tone: 'green' } },
          ],
          note: 'Booked-from-this-list is the KPI that grows a practice without a single new-patient ad.',
        }],
      },
      {
        tab: 'Claims & Providers',
        modules: [
          {
            type: 'worklist', t: 'Insurance claims aging', sub: 'Claims age like milk after 90 days — chase at 60', act: 'CHASE CLAIM',
            rows: [
              { a: 'Delta Dental — 4 claims', b: 'Crowns + perio batch', val: '$6,800', meta: '68 days', flag: { f: '60+ DAYS', tone: 'red' } },
              { a: 'Horizon BCBS — 3 claims', b: 'Restorative', val: '$3,400', meta: '62 days', flag: { f: '60+ DAYS', tone: 'red' } },
              { a: 'Cigna — 2 claims', b: 'Endo + crown', val: '$2,200', meta: '48 days', flag: { f: '31–60', tone: 'amber' } },
              { a: 'MetLife — 5 claims', b: 'Hygiene batch', val: '$1,900', meta: '19 days', flag: { f: 'CURRENT', tone: 'green' } },
            ],
            note: 'Two payers are sitting on $10.2K past 60 days. A 20-minute chase call beats writing it off in December.',
          },
          {
            type: 'board', t: 'Production vs. collections by provider', sub: 'Who fills the schedule, who fills the bank',
            cols: ['PROVIDER', 'PRODUCTION (JUN)', 'COLLECTED', 'RATE', ''],
            rows: [
              ['Dr. Patel (owner)', '$78,400', '$76,100', '97%', { f: 'STRONG', tone: 'green' }],
              ['Dr. Shah (associate)', '$32,800', '$30,400', '93%', { f: 'REVIEW ADJUSTMENTS', tone: 'amber' }],
              ['Hygiene (2 chairs)', '$16,400', '$16,100', '98%', { f: 'STRONG', tone: 'green' }],
            ],
            note: 'The associate gap is usually insurance adjustments, not effort — but you only fix what you can see.',
          },
        ],
      },
    ],
    ops: {
      type: 'clients', label: 'Treatment & A/R', title: 'Open treatment plans & balances', sub: 'Accepted treatment not yet scheduled is money sitting on the table',
      cols: ['PATIENT', 'STATUS', 'PLAN VALUE', 'BALANCE DUE'],
      kpis: [{ k: 'UNSCHEDULED TREATMENT', v: '$84K', sub: 'accepted, not booked' }, { k: 'INSURANCE A/R > 60d', v: '$12,400', sub: '9 claims to chase' }, { k: 'NEW PATIENTS (MTD)', v: '38', sub: 'goal: 35' }],
      rows: [
        { a: 'R. Delgado', b: 'Implant + crown, #19', s: 'active', chg: 5800, cost: 1450 },
        { a: 'M. Okonkwo', b: 'Invisalign full', s: 'active', chg: 5200, cost: 0 },
        { a: 'S. Brennan', b: 'Crowns ×2, accepted 5/12', s: 'paused', chg: 2900, cost: 0 },
        { a: 'K. Liu', b: 'Perio maintenance program', s: 'active', chg: 780, cost: 195 },
        { a: 'J. Marino', b: 'Veneers consult → accepted', s: 'active', chg: 8400, cost: 2100 },
        { a: 'D. Foster', b: 'Root canal + crown', s: 'past_due', chg: 2400, cost: 1160 },
      ],
    },
  },
  {
    slug: 'law-firm', biz: 'Harbor Point Law Group', industry: 'Law Firm', emoji: '⚖️',
    blurb: 'Billed vs. collected, A/R aging, and realization by matter.',
    theme: { dark: '#212A3A', accent: '#A8894A' },
    months: { rev: [132400, 128800, 136200, 141800, 138400, 129600, 134800, 138200, 140600, 142400, 143800, 144800], exp: [90200, 88400, 92800, 96400, 94200, 89100, 91800, 94200, 95800, 96900, 97600, 98200] },
    revCats: [['Hourly billing', 92600], ['Flat-fee matters', 34800], ['Retainer draws', 17400]],
    expLines: [
      { n: 'Attorney & staff payroll', a: 68400, tx: [['6/30', 'Payroll — 3 attorneys, 2 paralegals, admin', 34200], ['6/15', 'Payroll run', 34200]] },
      { n: 'Rent', a: 11200, tx: [['6/1', 'Class A office — Hooper Ave', 11200]] },
      { n: 'Malpractice insurance', a: 4900, tx: [['6/1', 'Professional liability premium', 4900]] },
      { n: 'Research & filing fees', a: 4300, tx: [['6/1', 'Westlaw subscription', 2400], ['6/19', 'Court filing fees', 1100], ['6/8', 'Process servers', 800]] },
      { n: 'Marketing', a: 3800, tx: [['6/15', 'Google ads — estate planning', 2400], ['6/1', 'SEO retainer', 1400]] },
      { n: 'Office & misc', a: 5600, tx: [['6/1', 'Practice management software', 1200], ['6/30', 'Card & trust account fees', 1600], ['6/12', 'CLE + bar dues', 2800]] },
    ],
    extraKpi: { k: 'REALIZATION RATE', v: '91%', sub: 'billed vs. worked' },
    insights: [
      '$31K of receivables is past 60 days — and Shoreline Marina is $21.4K of it while you keep working the file. Evergreen retainer replenishment would have flagged this at $8K.',
      'Realization at 91% means ~$14K of June\'s work went unbilled or written down — and the write-downs cluster on flat-fee matters. Reprice those; don\'t discount hourly.',
      '$46K of work-in-progress is unbilled. Billing on the 25th instead of the 5th costs you ten days of float, every month, forever.',
    ],
    extras: [
      {
        tab: 'WIP & Billing',
        kpis: [{ k: 'UNBILLED WIP', v: '$46K', sub: 'time on the clock, not invoiced' }, { k: 'OLDEST WIP', v: '47 days', sub: 'Meridian litigation' }, { k: 'BILLED THIS WEEK', v: '$12,400', sub: 'from this list' }],
        modules: [{
          type: 'worklist', t: 'Unbilled work', sub: 'The work is done. The invoice is not. That is the whole problem.', act: 'BILL NOW',
          rows: [
            { a: 'Meridian Homes — contract litigation', b: '41.2 hrs @ $350', val: '$14,420', meta: '47 days unbilled', flag: { f: 'BILL NOW', tone: 'red' } },
            { a: 'Bayside Builders — defect defense', b: '22.8 hrs @ $350', val: '$7,980', meta: '19 days', flag: { f: 'BILL SOON', tone: 'amber' } },
            { a: 'Feldstein estate plan', b: 'Flat fee — signing milestone hit', val: '$4,500', meta: '12 days', flag: { f: 'BILL SOON', tone: 'amber' } },
            { a: 'Estate of Caruso — probate', b: '8.4 hrs @ $350', val: '$2,940', meta: '8 days', flag: { f: 'CURRENT', tone: 'green' } },
          ],
          note: 'Billing on the 5th instead of the 25th is a permanent 10-day raise in cash flow. Same work, same clients.',
        }],
      },
      {
        tab: 'Retainers',
        modules: [
          {
            type: 'worklist', t: 'Retainer & trust balances', sub: 'Evergreen replenishment stops A/R before it exists', act: 'REQUEST REPLENISH',
            rows: [
              { a: 'Shoreline Marina', b: 'Lease dispute · floor $10,000', val: '$0', meta: 'exhausted — working unpaid', flag: { f: 'STOP WORK?', tone: 'red' } },
              { a: 'K. Nowak', b: 'Employment claim · floor $5,000', val: '$600', meta: 'below floor', flag: { f: 'REPLENISH', tone: 'amber' } },
              { a: 'Meridian Homes', b: 'Litigation · floor $15,000', val: '$4,200', meta: 'below floor', flag: { f: 'REPLENISH', tone: 'amber' } },
              { a: 'Bayside Builders', b: 'Defense · floor $12,000', val: '$11,800', meta: 'healthy', flag: { f: 'OK', tone: 'green' } },
            ],
            note: 'Shoreline is $21.4K into A/R because the retainer hit zero and nobody stopped. This screen is the tripwire.',
          },
          {
            type: 'segments', t: 'Realization by matter type', sub: 'Where the write-downs actually live',
            segs: [
              { name: 'HOURLY', lines: [['Worked (Jun)', '$92,600'], ['Billed', '$88,900'], ['Written down', '($3,700)']], foot: ['Realization', '96%'] },
              { name: 'FLAT-FEE', hot: true, lines: [['Worked (Jun)', '$38,400'], ['Billed', '$30,200'], ['Written down', '($8,200)']], foot: ['Realization', '79%'], footTone: 'red' },
              { name: 'RETAINER DRAW', lines: [['Worked (Jun)', '$17,400'], ['Billed', '$17,400'], ['Written down', '$0']], foot: ['Realization', '100%'] },
            ],
            note: 'Flat-fee matters eat 79 cents on the dollar. Reprice the estate-plan package — do not discount the hourly work.',
          },
        ],
      },
    ],
    ops: {
      type: 'clients', label: 'Matters & A/R', title: 'Active matters & receivables', sub: 'Billed this month per matter, and which clients are sitting on invoices',
      cols: ['CLIENT / MATTER', 'STATUS', 'BILLED (MTD)', 'A/R BALANCE'],
      kpis: [{ k: 'A/R OUTSTANDING', v: '$118K', sub: '$31K over 60 days' }, { k: 'UNBILLED WIP', v: '$46K', sub: 'time not yet invoiced' }, { k: 'AVG DAYS TO PAY', v: '38', sub: 'down from 51' }],
      rows: [
        { a: 'Meridian Homes LLC', b: 'Contract litigation', s: 'active', chg: 18400, cost: 24600 },
        { a: 'Estate of R. Caruso', b: 'Probate administration', s: 'active', chg: 6200, cost: 0 },
        { a: 'Shoreline Marina', b: 'Lease dispute', s: 'past_due', chg: 8900, cost: 21400 },
        { a: 'T. & M. Feldstein', b: 'Estate plan — flat fee', s: 'active', chg: 4500, cost: 0 },
        { a: 'Bayside Builders', b: 'Construction defect defense', s: 'active', chg: 14800, cost: 9200 },
        { a: 'K. Nowak', b: 'Employment claim', s: 'paused', chg: 0, cost: 3800 },
      ],
    },
  },
  {
    slug: 'property-management', biz: 'Keystone Property Management', industry: 'Property Management', emoji: '🏠',
    blurb: 'Rent roll, owner statements, and delinquencies across the portfolio.',
    theme: { dark: '#26303A', accent: '#4A7BA8' },
    months: { rev: [88200, 89400, 90800, 91600, 92400, 93800, 94200, 94800, 95400, 95800, 96100, 96400], exp: [66400, 67200, 68100, 68800, 69200, 70100, 70400, 70800, 71200, 71500, 71700, 71900] },
    revCats: [['Management fees', 61800], ['Leasing commissions', 19200], ['Maintenance markups', 15400]],
    expLines: [
      { n: 'Payroll', a: 38400, tx: [['6/30', 'Payroll — PMs + leasing + office', 19200], ['6/15', 'Payroll run', 19200]] },
      { n: 'Maintenance techs & contractors', a: 18600, tx: [['6/24', 'HVAC contractor — 4 units', 6800], ['6/16', 'In-house tech payroll', 8400], ['6/9', 'Plumbing calls ×6', 3400]] },
      { n: 'Office rent', a: 5400, tx: [['6/1', 'Office suite', 5400]] },
      { n: 'Software', a: 2800, tx: [['6/1', 'AppFolio', 2100], ['6/1', 'Screening & marketing tools', 700]] },
      { n: 'Insurance', a: 2400, tx: [['6/1', 'E&O + GL', 2400]] },
      { n: 'Misc', a: 4300, tx: [['6/20', 'Legal — eviction filings ×2', 1900], ['6/30', 'Mileage + phones', 1400], ['6/1', 'Owner portal & banking fees', 1000]] },
    ],
    extraKpi: { k: 'DOORS MANAGED', v: '284', sub: 'across 41 owners' },
    insights: [
      'Bayside Court is carrying $8,200 of your $18.4K delinquency — that\'s a screening conversation with the owner, not just tenant-chasing.',
      'Maintenance markups are 16% of revenue and your fastest-growing line — every work order routed to your in-house tech instead of a contractor is roughly double the margin.',
      'Your top 5 owners are 58% of revenue. A quarterly owner report — essentially this dashboard — is your cheapest retention tool.',
    ],
    extras: [
      {
        tab: 'Owner Statements',
        modules: [{
          type: 'statement', t: 'Owner statement — one click', sub: 'The report that keeps an owner for a decade. Pick one:',
          owners: [
            { name: 'Radcliffe LP', props: 'Pine Gardens · 24 units', collected: 41200, repairs: 4820, feePct: 8 },
            { name: 'Marino Group', props: 'Bayside Court · 12 townhomes', collected: 24800, repairs: 3120, feePct: 8 },
            { name: '88 Main LLC', props: 'Main St mixed-use · 8 units', collected: 19100, repairs: 1450, feePct: 8 },
            { name: 'T. Vance', props: 'Hooper Ave 4-plex', collected: 8900, repairs: 640, feePct: 9 },
          ],
          note: 'In your build this emails itself on the 1st, per owner, with every repair receipt attached. Owners stop calling — and stop leaving.',
        }],
      },
      {
        tab: 'Delinquency & WOs',
        modules: [
          {
            type: 'worklist', t: 'Delinquency pipeline', sub: 'Every late tenant has a next step — nobody falls through', act: 'NEXT STEP',
            rows: [
              { a: 'Bayside Court #7', b: '$2,850 · 41 days late', val: '$2,850', flag: { f: 'FILING PREP', tone: 'red' } },
              { a: 'Bayside Court #11', b: '$2,600 · 35 days late', val: '$2,600', flag: { f: 'NOTICE SERVED', tone: 'red' } },
              { a: 'Pine Gardens #14', b: '$1,700 · 18 days late', val: '$1,700', flag: { f: 'PAYMENT PLAN', tone: 'blue' } },
              { a: 'Main St #3', b: '$1,300 · 9 days late', val: '$1,300', flag: { f: 'REMINDER SENT', tone: 'amber' } },
              { a: 'Cedar Ln — 2 homes', b: '$4,200 combined · 12 days', val: '$4,200', flag: { f: 'REMINDER SENT', tone: 'amber' } },
            ],
            note: 'Two of the top three are the same property — that is the Bayside screening conversation, with receipts.',
          },
          {
            type: 'board', t: 'Work-order margins', sub: 'In-house tech vs. contractor — roughly 2× the margin when it is yours',
            cols: ['WORK ORDER', 'DONE BY', 'COST', 'BILLED', 'MARGIN', ''],
            rows: [
              ['Pine Gardens — 2 AC service calls', 'In-house tech', '$180', '$420', '57%', { f: 'IN-HOUSE', tone: 'green' }],
              ['Bayside #4 — water heater', 'Contractor', '$1,080', '$1,300', '17%', { f: 'CONTRACTOR', tone: 'amber' }],
              ['Main St — hallway lighting', 'In-house tech', '$140', '$310', '55%', { f: 'IN-HOUSE', tone: 'green' }],
              ['Cedar Ln — roof leak', 'Contractor', '$890', '$1,020', '13%', { f: 'CONTRACTOR', tone: 'amber' }],
            ],
            note: 'Every job your tech can safely take is double margin. The board shows which categories to hire the next tech for.',
          },
        ],
      },
    ],
    ops: {
      type: 'clients', label: 'Rent Roll', title: 'Portfolio rent roll', sub: 'Who paid, who hasn’t, and which owners are due statements',
      cols: ['PROPERTY', 'STATUS', 'MONTHLY RENT ROLL', 'DELINQUENT'],
      kpis: [{ k: 'COLLECTED (MTD)', v: '96.2%', sub: 'of June rent roll' }, { k: 'DELINQUENT', v: '$18,400', sub: '11 tenants' }, { k: 'VACANCY', v: '3.9%', sub: '11 of 284 doors' }],
      rows: [
        { a: 'Pine Gardens Apts', b: '24 units · owner: Radcliffe LP', s: 'active', chg: 42800, cost: 3400 },
        { a: 'Hooper Ave 4-plex', b: '4 units · owner: T. Vance', s: 'active', chg: 8900, cost: 0 },
        { a: 'Bayside Court townhomes', b: '12 units · owner: Marino Group', s: 'past_due', chg: 26400, cost: 8200 },
        { a: 'Main St mixed-use', b: '6 apts + 2 retail · owner: 88 Main LLC', s: 'active', chg: 19800, cost: 2600 },
        { a: 'Cedar Ln single-families', b: '9 homes · owner: various', s: 'active', chg: 24600, cost: 4200 },
      ],
    },
  },
  {
    slug: 'ecommerce', biz: 'Wildflower Goods Co.', industry: 'E-Commerce', emoji: '📦',
    blurb: 'True margin after ads, shipping, and fees — per channel.',
    theme: { dark: '#2E2338', accent: '#7A5FA8' },
    months: { rev: [58400, 56800, 61200, 68400, 78600, 92400, 54200, 51800, 58400, 63200, 67400, 71800], exp: [48200, 46900, 50400, 55800, 63400, 74200, 45100, 43200, 48100, 51600, 54800, 58300] },
    revCats: [['Shopify store', 42600], ['Amazon', 21400], ['Wholesale accounts', 7800]],
    expLines: [
      { n: 'Product cost', a: 28400, tx: [['6/22', 'Supplier PO #1148 — candles', 14200], ['6/12', 'Packaging supplier', 4800], ['6/4', 'Supplier PO #1141 — bath line', 9400]] },
      { n: 'Shipping & fulfillment', a: 11200, tx: [['6/30', 'ShipStation — USPS/UPS labels', 7400], ['6/30', 'Amazon FBA fees', 3800]] },
      { n: 'Ads (Meta & Google)', a: 9800, tx: [['6/30', 'Meta ads', 6200], ['6/30', 'Google Shopping', 3600]] },
      { n: 'Payroll', a: 5400, tx: [['6/30', 'Payroll — 2 part-time packers', 2700], ['6/15', 'Payroll run', 2700]] },
      { n: 'Software & fees', a: 2100, tx: [['6/1', 'Shopify + apps', 780], ['6/30', 'Card processing', 1320]] },
      { n: 'Misc', a: 1400, tx: [['6/1', 'Storage unit', 900], ['6/16', 'Photography props', 500]] },
    ],
    extraKpi: { k: 'ROAS', v: '4.2×', sub: 'blended, after fees' },
    insights: [
      'Blended ROAS reads 4.2×, but margin per order is $18.90 after everything — and Meta-attributed orders run ~$6 thinner than organic. Scale email/SMS before you scale ad spend.',
      'Amazon is 30% of revenue but FBA + referral fees take ~32% off the top. A Shopify order is worth ~1.5× an Amazon order to you — package inserts pushing Amazon buyers to your list pay for themselves.',
      'December did $92.4K vs $51.8K in February, and the Q4 inventory PO lands in September. That\'s why summer feels cash-tight even when sales are fine — now it\'s on the chart instead of a surprise.',
    ],
    extras: [
      {
        tab: 'Margin Waterfall',
        modules: [{
          type: 'segments', t: 'From price to profit, per order', sub: 'Revenue is vanity — this is the number that pays you',
          segs: [
            { name: 'SHOPIFY', hot: true, lines: [['Avg order', '$62.50'], ['Product', '($24.70)'], ['Ship + pack', '($9.10)'], ['Fees', '($2.30)'], ['Ads (blended)', '($7.50)']], foot: ['Profit / order', '$18.90'] },
            { name: 'AMAZON', lines: [['Avg order', '$61.80'], ['Product', '($24.40)'], ['FBA fees', '($12.10)'], ['Referral 15%', '($9.30)'], ['Ads', '($4.20)']], foot: ['Profit / order', '$11.80'] },
            { name: 'WHOLESALE', lines: [['Avg unit', '$28.30'], ['Product', '($11.80)'], ['Ship (bulk)', '($2.10)'], ['Fees', '$0'], ['Ads', '$0']], foot: ['Profit / unit', '$14.40'] },
          ],
          note: 'A Shopify order is worth 1.6× an Amazon order. Package inserts pushing Amazon buyers to your site pay for themselves in one order.',
        }],
      },
      {
        tab: 'SKUs & Inventory',
        modules: [
          {
            type: 'board', t: 'Profit by SKU', sub: 'After returns, after ads — which product actually built the business',
            cols: ['SKU', 'SOLD (JUN)', 'REVENUE', 'TRUE PROFIT', 'PER UNIT', ''],
            rows: [
              ['Candle trio gift set', '312', '$26,200', '$9,100', '$29.17', { f: 'PUSH', tone: 'green' }],
              ['Bath soak line', '284', '$15,600', '$4,800', '$16.90', { f: 'HEALTHY', tone: 'green' }],
              ['Subscription box', '148', '$8,000', '$3,300', '$22.30', { f: 'SLEEPER — GROW', tone: 'blue' }],
              ['Room spray', '196', '$7,800', '$1,900', '$9.69', { f: 'HEALTHY', tone: 'green' }],
              ['Ceramic diffuser', '61', '$6,700', '$400', '$6.56', { f: 'KILL OR REPRICE', tone: 'red' }],
            ],
            note: 'The diffuser breaks and gets returned — after returns it barely clears $6/unit on your heaviest shipping. Kill it or raise it $12.',
          },
          {
            type: 'board', t: 'Inventory runway', sub: 'Weeks of stock left — and the Q4 PO cash countdown',
            cols: ['PRODUCT', 'ON HAND', 'WKS LEFT', 'REORDER BY', 'PO CASH NEEDED', ''],
            rows: [
              ['Candle trio', '410', '5.2', 'Jul 28', '$11,400', { f: 'ORDER NOW', tone: 'red' }],
              ['Bath soak', '620', '8.6', 'Aug 18', '$8,900', { f: 'SOON', tone: 'amber' }],
              ['Room spray', '540', '10.8', 'Sep 2', '$4,300', { f: 'OK', tone: 'green' }],
              ['Q4 holiday assortment', '—', '—', 'Sep 15 PO', '$38,000', { f: 'SAVE FOR IT', tone: 'blue' }],
            ],
            note: 'The September PO is $38K. Banking $9K/month starting now is the difference between a big Q4 and a credit-card Q4.',
          },
        ],
      },
    ],
    ops: {
      type: 'orders', label: 'Orders', title: 'Order flow', sub: 'Recent orders across channels — margin after every fee, per order',
      cols: ['ORDER', 'STATUS', 'TOTAL', 'MARGIN'],
      kpis: [{ k: 'ORDERS (MTD)', v: '1,148', sub: 'avg order $62.50' }, { k: 'RETURN RATE', v: '3.1%', sub: 'mostly sizing' }, { k: 'MARGIN / ORDER', v: '$18.90', sub: 'after ads + shipping + fees' }],
      rows: [
        { a: '#8412 — gift bundle ×2', b: 'Shopify · K. Moreno · NJ', s: 'shipped', chg: 148, cost: 92 },
        { a: '#8411 — candle trio', b: 'Shopify · repeat customer', s: 'delivered', chg: 84, cost: 51 },
        { a: 'FBA batch — 60 units', b: 'Amazon restock', s: 'pending', chg: 1980, cost: 1420 },
        { a: '#8409 — bath set + candle', b: 'Shopify · first-time, via Meta ad', s: 'packed', chg: 96, cost: 71 },
        { a: 'Wholesale — Willow & Main', b: '24 units, net-30', s: 'shipped', chg: 680, cost: 410 },
        { a: '#8404 — subscription box', b: 'Shopify · monthly recurring', s: 'delivered', chg: 54, cost: 31 },
      ],
    },
  },
  {
    slug: 'trucking', biz: 'Atlantic Freight Lines', industry: 'Trucking & Logistics', emoji: '🚛',
    blurb: 'Revenue per load, cost per mile, and margin per truck.',
    theme: { dark: '#1F2933', accent: '#D98E32' },
    months: { rev: [198400, 202800, 196200, 204600, 208400, 199800, 194200, 198600, 203400, 206800, 209600, 212400], exp: [174200, 177800, 172400, 179200, 182100, 175400, 170800, 174200, 178100, 180800, 182900, 184800] },
    revCats: [['Contract freight', 148600], ['Spot loads', 48400], ['Fuel surcharges', 15400]],
    expLines: [
      { n: 'Driver pay', a: 78600, tx: [['6/30', 'Driver settlements — 8 drivers', 39300], ['6/15', 'Driver settlements', 39300]] },
      { n: 'Fuel', a: 52400, tx: [['6/28', 'Fleet fuel card — week 4', 13800], ['6/21', 'Fleet fuel card — week 3', 12900], ['6/14', 'Fleet fuel card — week 2', 13200]] },
      { n: 'Maintenance & tires', a: 21800, tx: [['6/24', 'Truck 4 — clutch + PM service', 8900], ['6/16', 'Steer tires ×4 — truck 7', 4200], ['6/9', 'Trailer brake job', 3800]] },
      { n: 'Insurance', a: 14600, tx: [['6/1', 'Liability + cargo + physical damage', 14600]] },
      { n: 'Truck payments', a: 12400, tx: [['6/1', 'Equipment finance — 4 notes', 12400]] },
      { n: 'Tolls & misc', a: 5000, tx: [['6/30', 'EZ-Pass fleet', 3200], ['6/1', 'ELD + dispatch software', 1100], ['6/18', 'Permits', 700]] },
    ],
    extraKpi: { k: 'COST PER MILE', v: '$1.84', sub: 'revenue: $2.12/mi' },
    insights: [
      'You\'re running a $0.28/mile spread ($2.12 revenue vs $1.84 cost). Fuel moved 4 cents last quarter and quietly ate 14% of it — the surcharge schedule has to move with the pump.',
      'Contract freight is 70% of revenue and predictable. Spot pays better per mile, but truck 7\'s empty ride back from Buffalo erased the premium — your 91% loaded ratio is the number to defend.',
      'Truck 4: 6 days down in June, $8.9K in repairs, ~$14K total swing with lost loads. At this rate, replacing it beats repairing it within 3 quarters.',
    ],
    extras: [
      {
        tab: 'Truck P&L',
        modules: [{
          type: 'board', t: 'Every truck is its own business', sub: 'Revenue minus fuel, maintenance, payment, and driver — per unit',
          cols: ['TRUCK', 'REVENUE (JUN)', 'FUEL', 'MAINT', 'PAYMENT', 'DRIVER', 'PROFIT', ''],
          rows: [
            ['Truck 1 — 2022 Cascadia', '$29,800', '$6,900', '$1,100', '$2,150', '$10,400', '$9,250', { f: 'BEST', tone: 'green' }],
            ['Truck 2 — 2021 Cascadia', '$27,400', '$6,600', '$1,850', '$2,150', '$9,800', '$7,000', { f: 'HEALTHY', tone: 'green' }],
            ['Truck 3 — 2020 Volvo', '$26,100', '$6,800', '$2,400', '$1,880', '$9,400', '$5,620', { f: 'HEALTHY', tone: 'green' }],
            ['Truck 4 — 2016 Freightliner', '$14,200', '$4,100', '$8,900', '$0', '$6,200', '($5,000)', { f: 'REPLACE', tone: 'red' }],
            ['Truck 5 — 2019 Kenworth', '$25,300', '$6,500', '$2,900', '$1,650', '$9,100', '$5,150', { f: 'WATCH MAINT', tone: 'amber' }],
            ['Trucks 6–8 (avg each)', '$29,900', '$7,200', '$1,550', '$2,190', '$11,200', '$7,760', { f: 'HEALTHY', tone: 'green' }],
          ],
          note: 'Truck 4 LOST $5K in June with no payment on it. A $2,150/month note on a new unit beats an $8,900 repair month every time — now the math is on one line.',
        }],
      },
      {
        tab: 'Lanes & Fuel',
        modules: [
          {
            type: 'board', t: 'Lane profitability', sub: 'Rate per mile lies — deadhead tells the truth',
            cols: ['LANE', 'LOADS (JUN)', 'RATE/MI', 'DEADHEAD', 'MARGIN/LOAD', ''],
            rows: [
              ['Lakewood → Boston (reefer)', '9', '$2.31', '12%', '$520', { f: 'BEST LANE', tone: 'green' }],
              ['Edison → Baltimore (contract 3×/wk)', '24', '$2.18', '6%', '$370', { f: 'CORE', tone: 'green' }],
              ['Port Newark drayage', '18', '$2.60', '4%', '$330', { f: 'CORE', tone: 'green' }],
              ['Newark → Richmond', '11', '$2.05', '9%', '$310', { f: 'HEALTHY', tone: 'green' }],
              ['Spot — Elizabeth → Buffalo', '4', '$2.42', '41%', '$95', { f: 'DEADHEAD TRAP', tone: 'red' }],
            ],
            note: 'Buffalo pays the best rate per loaded mile and the worst money per load — the empty ride home eats it. Defend the 91% loaded ratio.',
          },
          {
            type: 'board', t: 'Fuel vs. surcharge recovery', sub: 'The $0.28/mile spread leaks here first',
            cols: ['WEEK', 'GALLONS', 'PUMP AVG', 'FUEL COST', 'SURCHARGE BILLED', 'GAP'],
            rows: [
              ['Jun 1–7', '3,180', '$3.89', '$12,370', '$3,720', '($680)'],
              ['Jun 8–14', '3,240', '$3.96', '$12,830', '$3,780', '($910)'],
              ['Jun 15–21', '3,150', '$4.04', '$12,730', '$3,810', '($1,050)'],
              ['Jun 22–28', '3,290', '$4.01', '$13,190', '$4,240', '($720)'],
            ],
            note: 'Your surcharge schedule lags the pump by about two weeks — that gap was $3,360 in June. Reset the schedule monthly, not quarterly.',
          },
        ],
      },
    ],
    ops: {
      type: 'jobs', unit: 'LOAD', label: 'Loads', title: 'Load board', sub: 'Every load with rate, cost, and margin — per truck, per lane',
      cols: ['LOAD', 'DRIVER', 'STATUS', 'RATE', 'MARGIN'],
      kpis: [{ k: 'TRUCKS ROLLING', v: '7 of 8', sub: 'truck 4 in the shop' }, { k: 'LOADED MILES (MTD)', v: '94,200', sub: '91% loaded ratio' }, { k: 'AVG MARGIN / LOAD', v: '$312', sub: 'after driver + fuel' }],
      rows: [
        { a: 'Newark → Richmond', b: 'Dry van · paper products · 342 mi', who: 'C. Booker', s: 'in_progress', chg: 1180, cost: 790 },
        { a: 'Port Newark → Allentown', b: 'Container drayage ×2', who: 'M. Silva', s: 'done', chg: 940, cost: 610 },
        { a: 'Lakewood → Boston', b: 'Reefer · food distribution', who: 'D. Wright', s: 'in_progress', chg: 1640, cost: 1120 },
        { a: 'Edison → Baltimore', b: 'Contract lane · 3×/week', who: 'A. Petrov', s: 'scheduled', chg: 1090, cost: 720 },
        { a: 'Spot — Elizabeth → Buffalo', b: 'DAT load · 372 mi', who: 'J. Okafor', s: 'scheduled', chg: 1420, cost: 980 },
        { a: 'Trenton → Hartford', b: 'Dry van · returns', who: 'M. Silva', s: 'waiting', chg: 860, cost: 590 },
      ],
    },
  },
  {
    slug: 'wholesale', biz: 'Garden State Distribution', industry: 'Wholesale & Distribution', emoji: '🏭',
    blurb: 'Margin by account, route profitability, and receivables.',
    theme: { dark: '#22303B', accent: '#3E7CB1' },
    months: { rev: [172400, 174800, 178200, 176400, 180800, 183600, 179400, 176800, 180200, 182600, 184400, 186200], exp: [153100, 155200, 158100, 156600, 160400, 162800, 159200, 156900, 159800, 161900, 163500, 164900] },
    revCats: [['Grocery & deli accounts', 98400], ['Restaurants', 54600], ['Convenience stores', 33200]],
    expLines: [
      { n: 'Product (COGS)', a: 131800, tx: [['6/25', 'Manufacturer PO — dry goods', 48200], ['6/18', 'Importer — specialty lines', 39400], ['6/11', 'Manufacturer PO — beverages', 32800]] },
      { n: 'Warehouse payroll', a: 15400, tx: [['6/30', 'Payroll — warehouse + drivers', 7700], ['6/15', 'Payroll run', 7700]] },
      { n: 'Trucks & fuel', a: 8900, tx: [['6/27', 'Fleet fuel', 3900], ['6/14', 'Box truck lease ×3', 3600], ['6/7', 'Reefer unit service', 1400]] },
      { n: 'Warehouse rent', a: 4800, tx: [['6/1', '18,000 sq ft + dock', 4800]] },
      { n: 'Insurance', a: 2200, tx: [['6/1', 'Cargo + GL + auto', 2200]] },
      { n: 'Misc', a: 1800, tx: [['6/1', 'Inventory software + scanners', 900], ['6/20', 'Pallets & shrink wrap', 900]] },
    ],
    extraKpi: { k: 'ACTIVE ACCOUNTS', v: '96', sub: '12 routes, 4 days/week' },
    insights: [
      'Average drop margin is 11.8% against a 12% target — and Route 2\'s small deli drops are what\'s pulling it down. A $500 order minimum on that route fixes it without losing an account.',
      '$21K of A/R is past terms, and Shore Market IGA is both your biggest account and your slowest payer. A 1% early-pay discount buys back ~20 days of float — take that trade.',
      'COGS is 80% of revenue here, so a 1% better buy beats a 5% sales increase. Your specialty and import lines run double the margin of dry goods — that\'s the growth lane.',
    ],
    extras: [
      {
        tab: 'Account Margins',
        modules: [{
          type: 'board', t: 'Margin per account', sub: 'Volume is not the same as profit — cost-to-serve tells the truth',
          cols: ['ACCOUNT', 'MONTHLY', 'DROPS/MO', 'MARGIN %', '$/DROP', ''],
          rows: [
            ['Lakewood Kosher Grocer', '$16,800', '4', '14.6%', '$613', { f: 'BEST', tone: 'green' }],
            ['Shore Market IGA', '$34,200', '8', '13.1%', '$560', { f: 'CORE', tone: 'green' }],
            ['QuickStop #4', '$14,200', '4', '12.8%', '$454', { f: 'HEALTHY', tone: 'green' }],
            ['Marino\'s Deli', '$11,400', '4', '12.4%', '$353', { f: 'HEALTHY', tone: 'green' }],
            ['Bayview Pizza', '$4,800', '4', '11.2%', '$134', { f: 'WATCH', tone: 'amber' }],
            ['Corner Deli (Route 2)', '$1,850', '4', '6.8%', '$31', { f: 'BELOW MINIMUM', tone: 'red' }],
          ],
          note: 'Corner Deli earns $31 a drop — the truck stop costs more than that. A $500 order minimum fixes the tail without losing the account.',
        }],
      },
      {
        tab: 'A/R & Routes',
        modules: [
          {
            type: 'worklist', t: 'Receivables past terms', sub: '$21K past terms — and your biggest account is your slowest payer', act: 'CALL ACCOUNT',
            rows: [
              { a: 'Shore Market IGA', b: 'Net-30 · biggest account', val: '$18,400', meta: '22 days past terms', flag: { f: 'PAST TERMS', tone: 'red' } },
              { a: 'Lakewood Kosher Grocer', b: 'Net-30', val: '$4,200', meta: '9 days past terms', flag: { f: 'PAST TERMS', tone: 'amber' } },
              { a: 'Bayview Pizza', b: 'COD — missed last drop', val: '$1,120', meta: 'collect on next drop', flag: { f: 'COLLECT', tone: 'amber' } },
              { a: 'Toms River Diner', b: 'Net-15', val: '$960', meta: 'current', flag: { f: 'CURRENT', tone: 'green' } },
            ],
            note: 'A 1% early-pay discount to Shore Market buys back ~20 days of float on your biggest number. Take that trade.',
          },
          {
            type: 'board', t: 'Route profitability', sub: 'Four trucks, four different businesses',
            cols: ['ROUTE', 'ACCOUNTS', 'MONTHLY REV', 'TRUCK + LABOR', 'MARGIN', ''],
            rows: [
              ['Route 3 — Lakewood', '22', '$52,600', '$5,400', '13.8%', { f: 'BEST', tone: 'green' }],
              ['Route 4 — Toms River', '17', '$47,000', '$5,100', '12.9%', { f: 'HEALTHY', tone: 'green' }],
              ['Route 1 — Shore towns', '26', '$48,200', '$5,900', '12.4%', { f: 'HEALTHY', tone: 'green' }],
              ['Route 2 — small delis', '31', '$38,400', '$6,800', '9.1%', { f: 'FIX THE TAIL', tone: 'red' }],
            ],
            note: 'Route 2 has the most stops and the least profit — the order minimum and one dropped account turn it green.',
          },
        ],
      },
    ],
    ops: {
      type: 'orders', label: 'Orders', title: 'Order & delivery board', sub: 'Today’s orders by account — margin per drop, not just per month',
      cols: ['ORDER', 'STATUS', 'TOTAL', 'MARGIN'],
      kpis: [{ k: 'ORDERS TODAY', v: '38', sub: 'across 4 routes' }, { k: 'A/R OUTSTANDING', v: '$94K', sub: '$21K past terms' }, { k: 'AVG MARGIN / DROP', v: '11.8%', sub: 'target 12%' }],
      rows: [
        { a: 'Marino’s Deli — weekly order', b: 'Route 2 · net-15', s: 'delivered', chg: 2840, cost: 2490 },
        { a: 'Bayview Pizza — dry goods', b: 'Route 2 · COD', s: 'shipped', chg: 1120, cost: 970 },
        { a: 'QuickStop #4 — beverages + snacks', b: 'Route 1 · net-30', s: 'packed', chg: 3600, cost: 3190 },
        { a: 'Shore Market IGA', b: 'Route 3 · net-30 · biggest account', s: 'pending', chg: 8400, cost: 7280 },
        { a: 'Toms River Diner', b: 'Route 4 · net-15', s: 'delivered', chg: 1960, cost: 1710 },
        { a: 'Lakewood Kosher Grocer', b: 'Route 3 · specialty lines', s: 'shipped', chg: 4200, cost: 3580 },
      ],
    },
  },
]

// Live bespoke demos that already exist as standalone pages.
export const EXISTING_DEMOS = [
  { href: '/demo', biz: 'Riverside Bakery', industry: 'Bakery & Café', emoji: '🥐', blurb: 'The original — daily sales, food cost, and profit for a bakery café.' },
  { href: '/riverside-tires', biz: 'Riverside Tires', industry: 'Tires & Auto Service', emoji: '🔩', blurb: 'Items + services — tire sales, service tickets, and shop profit live.' },
  { href: '/riverfall-gowns', biz: 'Riverfall Gowns', industry: 'Gowns & Bridal Retail', emoji: '👗', blurb: 'Order tracking — every gown from order to pickup, deposits and balances.' },
  { href: '/appliance-repair', biz: 'YT Appliance Repair', industry: 'Appliance Repair', emoji: '🔧', blurb: 'Live job board — log parts and labor, watch profit per job update.' },
  { href: '/sba-lending', biz: 'Riverbank Funding', industry: 'Business Lending', emoji: '🏦', blurb: 'Loan pipeline — leads to disbursed deals to fees, one screen.' },
  { href: '/srl', biz: 'Southeastern Roofing Logistics', industry: 'Commercial Roofing', emoji: '🏘️', blurb: 'Job margin flags, WIP schedule, claim-aware cash flow — and a buyer package.' },
  { href: '/quefence', biz: 'QueFence', industry: 'Fencing & Trade Contracting', emoji: '🪵', blurb: 'The crew logs a day in ten seconds — and it lands in QuickBooks coded to the job.' },
  { href: '/ar-desk', biz: 'Lakeland Supply Co.', industry: 'QuickBooks AR & Statements', emoji: '📬', blurb: 'Reads QuickBooks, sends every statement in one pass — from your own email.' },
]

export const ALL_DEMOS = [
  ...EXISTING_DEMOS,
  ...INDUSTRIES.map((c) => ({ href: `/demos/${c.slug}`, biz: c.biz, industry: c.industry, emoji: c.emoji, blurb: c.blurb })),
]

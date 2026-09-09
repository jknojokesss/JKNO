export const INDUSTRIES_A_2 = [  {
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
]

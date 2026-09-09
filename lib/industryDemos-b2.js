export const INDUSTRIES_B_2 = [  {
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

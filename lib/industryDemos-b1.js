export const INDUSTRIES_B_1 = [  {
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
  },]

-- ============================================================
--  JERKY MUNCH — live schema + RLS + seed
--  Project: jjcnzpicenrbxqrjqsnn  (Efraim's Supabase, "Jerky" org)
--  Paste this whole file into the project's SQL Editor and Run.
--  Safe to re-run: uses IF NOT EXISTS / upserts.
-- ============================================================

-- ── 0. RESET ────────────────────────────────────────────────
--  Drops ONLY these 8 tables so the schema is built clean even
--  if the project already had a table by one of these names.
--  Safe on this fresh project — there is no real data yet.
drop table if exists consignment_log      cascade;
drop table if exists monthly_financials   cascade;
drop table if exists direct_sales         cascade;
drop table if exists ad_channels          cascade;
drop table if exists expenses             cascade;
drop table if exists products             cascade;
drop table if exists settings             cascade;
drop table if exists consignment_partners cascade;

-- ── 1. TABLES ───────────────────────────────────────────────

-- cost-per-unit knobs, etc. (drives P&L COGS)
create table if not exists settings (
  key        text primary key,
  value      numeric not null,
  updated_at timestamptz default now()
);

-- product catalog across all three lines
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  line        text not null check (line in ('bags','boards','camp')),
  name        text not null,
  color       text,
  unit_cost   numeric default 0,
  price       numeric default 0,
  week_units  int default 0,
  month_units int default 0,
  sort        int default 0,
  created_at  timestamptz default now()
);

-- consignment accounts (the reconciliation engine's core)
create table if not exists consignment_partners (
  id           uuid primary key default gen_random_uuid(),
  store        text not null,
  price        numeric default 0,
  sent         int default 0,
  returned     int default 0,
  paid         numeric default 0,
  counted      int,
  counted_date date,
  diagnosis    text default '',
  cycle        int default 1,
  last_contact date,
  restock      text default 'good' check (restock in ('good','soon','now')),
  notes        text default '',
  created_at   timestamptz default now()
);

-- per-partner activity feed
create table if not exists consignment_log (
  id         uuid primary key default gen_random_uuid(),
  partner_id uuid references consignment_partners(id) on delete cascade,
  at         date default current_date,
  note       text not null,
  created_at timestamptz default now()
);

-- direct sales (Shopify / markets / pop-ups / wholesale)
create table if not exists direct_sales (
  id         uuid primary key default gen_random_uuid(),
  who        text not null,
  source     text not null,
  units      int default 0,
  rev        numeric default 0,
  sale_date  date default current_date,
  created_at timestamptz default now()
);

-- advertising channels + ROAS tracking
create table if not exists ad_channels (
  id         uuid primary key default gen_random_uuid(),
  channel    text not null,
  spend      numeric default 0,
  rev        numeric default 0,
  track      text default '',
  tracked    boolean default false,
  created_at timestamptz default now()
);

-- expenses (business + personal-card, for the QuickBooks hand-off)
create table if not exists expenses (
  id         uuid primary key default gen_random_uuid(),
  vendor     text not null,
  cat        text default 'Other',
  amt        numeric default 0,
  pay        text default 'personal' check (pay in ('business','personal')),
  exp_date   date default current_date,
  created_at timestamptz default now()
);

-- 11-month P&L series — includes boards + camp revenue/COGS lines
create table if not exists monthly_financials (
  id          uuid primary key default gen_random_uuid(),
  period      text not null unique,   -- '2025-07' … sortable
  label       text not null,          -- 'Jul'
  direct_rev  numeric default 0,
  consign_rev numeric default 0,
  board_rev   numeric default 0,
  camp_rev    numeric default 0,
  cogs        numeric default 0,      -- bags COGS
  board_cogs  numeric default 0,
  camp_cogs   numeric default 0,
  ad_spend    numeric default 0,
  opex_non_ad numeric default 0,
  sort        int default 0,
  created_at  timestamptz default now()
);

-- ── 2. ROW LEVEL SECURITY ───────────────────────────────────
--  Isolated project: only invited, signed-in users get in.
--  The anon key is PUBLIC by design — RLS is the real lock.
--  IMPORTANT: in Auth > Providers, turn OFF "Allow new users to
--  sign up" so the only accounts that exist are the ones you
--  create (Efraim + you). Then authenticated == authorized.
do $$
declare t text;
begin
  foreach t in array array[
    'settings','products','consignment_partners','consignment_log',
    'direct_sales','ad_channels','expenses','monthly_financials'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists auth_all on %I;', t);
    execute format(
      'create policy auth_all on %I for all to authenticated using (true) with check (true);',
      t);
  end loop;
end $$;

-- ── 3. SEED (mirrors the current live demo; edit to reality in-app) ──

insert into settings (key, value) values
  ('cost_per_bag', 4.5),
  ('board_cost',   22),
  ('camp_cost',    18)
on conflict (key) do nothing;

insert into products (line, name, color, unit_cost, price, week_units, month_units, sort) values
  ('bags','Barbecue',      '#9E3B24', 4.5, 8.5, 22, 88, 1),
  ('bags','Nashville',     '#C24A22', 4.5, 8.5, 16, 64, 2),
  ('bags','Maple Bourbon', '#97652C', 4.5, 9.0, 13, 50, 3),
  ('bags','FirePopper',    '#B2351A', 4.5, 8.5, 12, 46, 4),
  ('bags','Teriyaki',      '#6B4A2A', 4.5, 8.5, 11, 42, 5),
  ('bags','Sweet Chili',   '#A8432C', 4.5, 8.5,  9, 37, 6),
  ('bags','Cracked Pepper','#46403A', 4.5, 8.5,  8, 33, 7),
  ('bags','Jalapeño',      '#5C7C3A', 4.5, 8.5,  6, 25, 8),
  ('boards','Heart Board', '#8A2E22', 22, 45, 2,  9, 9),
  ('boards','Gift Board',  '#A9763A', 26, 55, 1,  6, 10),
  ('camp','Camp Fanny Pack','#3E7C4F', 18, 42, 3, 12, 11),
  ('camp','Camp Package',  '#2B6C4A', 28, 65, 1,  5, 12)
on conflict do nothing;

-- consignment accounts (Efraim's real Lakewood-area stores)
with p as (
  insert into consignment_partners
    (store, price, sent, returned, paid, counted, counted_date, cycle, last_contact, restock, notes)
  values
    ('Gourmet Glatt North', 8.5, 60, 0, 425, 6,  '2026-06-15', 1, '2026-06-15', 'now',  'Manager Yossi reorders every ~2 weeks. Wants more Barbecue.'),
    ('Gourmet Glatt South', 8.5, 48, 4, 340, 2,  '2026-06-15', 1, '2026-06-12', 'now',  'Down to 2 bags — promised a delivery this week.'),
    ('Seasons',             9.0, 54, 0, 360, 14, '2026-06-14', 1, '2026-06-14', 'good', 'Steady account. Likes the Maple Bourbon.'),
    ('Nutmeg',              8.0, 40, 0, 200, 8,  '2026-06-16', 1, '2026-05-26', 'soon', 'Haven''t spoken in ~3 weeks — check in, ask about missing bags.'),
    ('Aisle 9 Jackson',     8.5, 36, 0, 255, 4,  '2026-06-13', 1, '2026-06-13', 'soon', 'New buyer contact — trial going well so far.'),
    ('Aisle 9 Lakewood',    8.5, 44, 0, 340, 4,  '2026-06-13', 1, '2026-06-13', 'good', 'Clean account, always pays on time.'),
    ('Foodex',              8.0, 30, 0, 160, 9,  '2026-06-12', 1, '2026-06-05', 'soon', 'Slower mover — try a sampler display by the register.'),
    ('Superstop',           8.0, 36, 0, 0,   36, '2026-06-10', 1, '2026-06-10', 'good', 'First delivery just landed — follow up in 2 weeks.'),
    ('Evergreen',           9.0, 40, 0, 270, 8,  '2026-06-16', 1, '2026-06-16', 'now',  'Reorders fast — strong location, push more here.')
  returning id, store
)
insert into consignment_log (partner_id, at, note)
select id, current_date, 'Account added' from p;

insert into direct_sales (who, source, units, rev) values
  ('Online store (Shopify)',      'Shopify / online', 120, 1560),
  ('Farmers Market — Toms River', 'Farmers market',    45,  585),
  ('Acme Corp — office bulk order','Wholesale / bulk',  60,  540),
  ('Gym pop-up weekend',          'Pop-up event',      30,  390)
on conflict do nothing;

insert into ad_channels (channel, spend, rev, track, tracked) values
  ('Instagram Ads',           600, 2400, 'Meta pixel + code IG10',           true),
  ('Influencer — @njfoodie',  400, 1600, 'Promo code NJFOODIE',              true),
  ('Google Search',           300,  900, 'Google conversion tag',            true),
  ('Facebook Ads',            450,  180, 'Meta pixel',                       true),
  ('Local 5K Sponsorship',    250,  150, 'Estimated — needs a promo code',   false),
  ('Flyers / print',          120,   90, 'Estimated — needs a promo code',   false)
on conflict do nothing;

insert into expenses (vendor, cat, amt, pay) values
  ('Beef supplier — Sysco', 'Ingredients', 1850, 'business'),
  ('Packaging & bags',      'Packaging',    420, 'personal'),
  ('Spices & cure',         'Ingredients',  260, 'personal'),
  ('Farmers market booth fee','Fees',       150, 'personal'),
  ('Dehydrator repair',     'Equipment',    180, 'business'),
  ('Gas & deliveries',      'Travel',       220, 'personal'),
  ('Labels — Vistaprint',   'Packaging',     95, 'personal')
on conflict do nothing;

-- 11-month P&L history (boards + camp layered on the bags baseline)
insert into monthly_financials
  (period, label, direct_rev, consign_rev, board_rev, camp_rev, cogs, board_cogs, camp_cogs, ad_spend, opex_non_ad, sort) values
  ('2025-07','Jul',1200, 900,  380,   0, 1450, 150,   0,  700, 480, 1),
  ('2025-08','Aug',1320, 980,  420,   0, 1520, 165,   0,  780, 500, 2),
  ('2025-09','Sep',1450,1050,  460,   0, 1600, 180,   0,  850, 510, 3),
  ('2025-10','Oct',1600,1150,  520,   0, 1720, 205,   0,  950, 520, 4),
  ('2025-11','Nov',1800,1300,  680,   0, 1900, 270,   0, 1200, 560, 5),
  ('2025-12','Dec',2200,1600,  980,   0, 2150, 390,   0, 1500, 620, 6),
  ('2026-01','Jan',1500,1100,  420,   0, 1700, 165,   0,  900, 520, 7),
  ('2026-02','Feb',1650,1200,  460, 240, 1780, 180,  95, 1050, 540, 8),
  ('2026-03','Mar',1820,1380,  520, 640, 2050, 205, 255, 1350, 600, 9),
  ('2026-04','Apr',1900,1450,  560, 980, 2180, 220, 390, 1500, 620, 10),
  ('2026-05','May',1980,1510,  600,1240, 2280, 235, 495, 1650, 640, 11)
on conflict (period) do nothing;

-- ============================================================
--  DONE. Next:
--   • Auth > Users > Add user  →  Efraim's email + a temp password
--   • Auth > Providers > Email →  turn OFF "Allow new users to sign up"
--   • Settings > API → send JK the Project URL (have it) + anon key
-- ============================================================

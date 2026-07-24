-- ============================================================
--  JERKY MUNCH — RE-SEED the two blocks that didn't land
--  (expenses + 11-month P&L history got skipped during the
--   earlier SQL-editor error retries). Run once in the
--   jerky-munch SQL editor ("Run without RLS").
--  Safe/idempotent: clears these two first, then re-inserts.
-- ============================================================

delete from expenses;
delete from monthly_financials;

insert into expenses (vendor, cat, amt, pay) values
  ('Beef supplier — Sysco', 'Ingredients', 1850, 'business'),
  ('Packaging & bags',      'Packaging',    420, 'personal'),
  ('Spices & cure',         'Ingredients',  260, 'personal'),
  ('Farmers market booth fee','Fees',       150, 'personal'),
  ('Dehydrator repair',     'Equipment',    180, 'business'),
  ('Gas & deliveries',      'Travel',       220, 'personal'),
  ('Labels — Vistaprint',   'Packaging',     95, 'personal');

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
  ('2026-05','May',1980,1510,  600,1240, 2280, 235, 495, 1650, 640, 11);

-- After this: the P&L "Compare months" and "Date range" views have
-- a full 11-month history to work with (plus the live current month).
-- NOTE: the go-live zero-out (supabase-jerky-zero.sql) clears these again.

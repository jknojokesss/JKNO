-- ============================================================
--  JERKY MUNCH — ZERO OUT (go-live reset)
--  Run in the jerky-munch Supabase SQL editor WHEN Efraim is
--  ready to start entering real data. Clears all demo numbers,
--  keeps the structure + his catalog + cost settings.
--  (Use Supabase's "Run without RLS" button.)
-- ============================================================

-- Demo transactions — wiped clean
delete from consignment_log;
delete from direct_sales;
delete from ad_channels;
delete from expenses;
delete from monthly_financials;

-- Per-flavor / boards / camp sold-counts → 0 (catalog kept: name, color, price, cost)
update products set week_units = 0, month_units = 0;

-- Consignment accounts: KEEP his 9 real stores + their prices, ZERO the balances.
-- He'll enter current on-shelf counts / payments live in the app.
update consignment_partners set
  sent = 0, returned = 0, paid = 0,
  counted = null, counted_date = null,
  diagnosis = '', cycle = 1, last_contact = null;

-- ── Alternative: FULLY wipe the stores too (uncomment to use instead
--    of the UPDATE above — Efraim then adds his own accounts):
-- delete from consignment_partners;   -- (also clears their logs via cascade)

-- Settings (cost_per_bag / board_cost / camp_cost) are intentionally KEPT.
-- Delete them too only if you want to re-enter costs from scratch:
-- delete from settings;

-- ============================================================
--  After running: the app shows a clean slate — $0 everywhere,
--  his stores listed at zero, ready for real numbers.
-- ============================================================

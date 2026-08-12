-- ═══════════════════════════════════════════════════════════════════════
-- QuickBooks Online read pipe — data tables
--
-- Run this in ANY Supabase project that receives a client's QBO data.
-- Already applied to the main project. Run it in an isolated client project
-- (e.g. Jerky Munch) before adding that client to ISOLATED in
-- lib/qboTargets.js.
--
-- NOTE: qbo_connections (OAuth tokens) is NOT here on purpose — connections
-- always live in the main project, so every client's sync health is visible
-- in one place. This file is only the financial data.
--
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- Monthly P&L, one row per account per month
create table if not exists qbo_gl_summary (
  id bigint generated always as identity primary key,
  client_slug text not null,
  month date not null,
  account text not null,
  "group" text not null,        -- Income / Cost of Goods Sold / Expenses / …
  subgroup text,
  amount numeric not null
);
create index if not exists qbo_gl_summary_client_month on qbo_gl_summary (client_slug, month);

-- Monthly balance sheet, same shape
create table if not exists qbo_bs_summary (
  id bigint generated always as identity primary key,
  client_slug text not null,
  month date not null,
  account text not null,
  "group" text not null,        -- ASSETS / LIABILITIES AND EQUITY
  subgroup text,                -- Bank Accounts / Current Liabilities / …
  amount numeric not null
);
create index if not exists qbo_bs_summary_client_month on qbo_bs_summary (client_slug, month);

-- General ledger detail — the transaction-level book
create table if not exists qbo_gl_txns (
  id bigint generated always as identity primary key,
  client_slug text not null,
  month date not null,          -- pull window, used for month-scoped replacement
  txn_date date not null,
  txn_type text,
  doc_num text,
  name text,                    -- customer / vendor / payee
  memo text,
  split_account text,
  account text,
  amount numeric not null
);
create index if not exists qbo_gl_txns_client_month on qbo_gl_txns (client_slug, month);
create index if not exists qbo_gl_txns_client_date on qbo_gl_txns (client_slug, txn_date);

-- RLS on, no policies: the sync writes with the service-role key, and nothing
-- is readable with the anon key. Add a policy later if a client's own app
-- needs to read these directly.
alter table qbo_gl_summary enable row level security;
alter table qbo_bs_summary enable row level security;
alter table qbo_gl_txns enable row level security;

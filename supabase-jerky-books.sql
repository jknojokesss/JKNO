-- ============================================================
--  JERKY MUNCH — QuickBooks books (Chart of Accounts + General Ledger)
--  Run once in the jerky-munch SQL editor ("Run without RLS").
--  Powers the "Books" tab: import the CoA + GL exports, get a real P&L.
-- ============================================================

-- Chart of Accounts (sets how each ledger line is categorized)
create table if not exists coa_accounts (
  id            uuid primary key default gen_random_uuid(),
  account       text not null,          -- full QuickBooks name (may be "Parent:Child")
  leaf          text,                   -- last segment ("Parent:Child" -> "Child")
  account_type  text,                   -- Income / Cost of Goods Sold / Expenses / Bank / Equity ...
  detail_type   text,
  created_at    timestamptz default now()
);
alter table coa_accounts enable row level security;
drop policy if exists auth_all on coa_accounts;
create policy auth_all on coa_accounts for all to authenticated using (true) with check (true);

-- General Ledger (every transaction, one row per posting)
create table if not exists gl_transactions (
  id             uuid primary key default gen_random_uuid(),
  txn_date       date,
  account        text,                  -- the account this posting hits (GL section = leaf name)
  txn_type       text,                  -- Invoice, Deposit, Expense, Payment ...
  num            text,
  name           text,                  -- customer / vendor
  description    text,
  split_account  text,                  -- the other side of the entry
  amount         numeric not null default 0,
  source         text default 'quickbooks',
  created_at     timestamptz default now()
);
alter table gl_transactions enable row level security;
drop policy if exists auth_all on gl_transactions;
create policy auth_all on gl_transactions for all to authenticated using (true) with check (true);

create index if not exists gl_txn_date_idx    on gl_transactions (txn_date);
create index if not exists gl_txn_account_idx on gl_transactions (account);

-- ============================================================
--  Done. In the app: Books tab -> drop in the Chart of Accounts,
--  then the General Ledger. The P&L (monthly, by channel, net
--  profit) rebuilds from the GL, categorized by the CoA.
-- ============================================================

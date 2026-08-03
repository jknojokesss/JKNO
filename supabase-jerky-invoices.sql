-- ============================================================
--  JERKY MUNCH — invoice A/R ledger for the 9 invoice stores
--  Run once in the jerky-munch SQL editor ("Run without RLS").
--  One row per invoice; ties to the invoice-type stores.
-- ============================================================

create table if not exists store_invoices (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid references consignment_partners(id) on delete cascade,
  inv_date    date default current_date,     -- delivery / invoice date
  units       int,                            -- optional (units delivered)
  unit_price  numeric,                        -- optional (per-unit price)
  amount      numeric not null default 0,     -- invoice total (units*price or manual)
  description text default '',
  due_date    date,
  status      text default 'unpaid' check (status in ('unpaid','paid')),
  paid_date   date,
  created_at  timestamptz default now()
);

alter table store_invoices enable row level security;
drop policy if exists auth_all on store_invoices;
create policy auth_all on store_invoices for all to authenticated using (true) with check (true);

create index if not exists store_invoices_partner_idx on store_invoices (partner_id);

-- ============================================================
--  Done. The Invoice stores tab now tracks deliver → invoice → paid,
--  with outstanding balance + overdue per store.
-- ============================================================

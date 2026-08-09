-- ============================================================
--  JERKY MUNCH — count-only staff role
--  Run once in the jerky-munch SQL editor ("Run without RLS").
--  A "counter" user can ONLY set shelf counts (via the RPC),
--  nothing else. The owner (any email not listed) keeps full access.
-- ============================================================

create table if not exists user_roles (
  email      text primary key,
  role       text not null default 'counter' check (role in ('owner', 'counter')),
  created_at timestamptz default now()
);
alter table user_roles enable row level security;
drop policy if exists ur_read on user_roles;
create policy ur_read on user_roles for select to authenticated using (true);
-- rows are managed here in the SQL editor, not from the app.

-- role of the current user; anyone not listed is treated as the owner
create or replace function jm_role() returns text
  language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from user_roles where lower(email) = lower(auth.email())),
    'owner')
$$;
grant execute on function jm_role() to authenticated;

-- lock consignment writes to the owner; counters go through the RPC below
alter table consignment_partners enable row level security;
drop policy if exists auth_all on consignment_partners;
drop policy if exists cp_select on consignment_partners;
drop policy if exists cp_write on consignment_partners;
create policy cp_select on consignment_partners for select to authenticated using (true);
create policy cp_write  on consignment_partners for all to authenticated
  using (jm_role() = 'owner') with check (jm_role() = 'owner');

-- the ONLY write a counter can make: set the shelf count on one store
create or replace function set_shelf_count(p_partner uuid, p_count int)
  returns void language plpgsql security definer set search_path = public as $$
begin
  update consignment_partners
     set counted = p_count, counted_date = now()
   where id = p_partner;
  insert into consignment_log (partner_id, note)
    values (p_partner, 'Counted ' || p_count || ' on shelf');
end $$;
grant execute on function set_shelf_count(uuid, int) to authenticated;

-- ============================================================
--  To add a counter:
--    1. Create the user in Auth (Authentication → Users → Add user).
--    2. insert into user_roles (email, role) values ('worker@example.com', 'counter');
--  They log in at /jerky-munch and see only the shelf-count screen.
-- ============================================================

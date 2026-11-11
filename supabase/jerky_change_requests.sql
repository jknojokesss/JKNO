-- Jerky Munch (project jjcnzpicenrbxqrjqsnn) — change requests from portal owners.
-- Apply manually in the Jerky Supabase SQL editor. Not auto-run from JKNO CI.

create table if not exists public.jerky_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  submitter_email text not null,
  request_text text not null check (char_length(trim(request_text)) > 0),
  page_label text not null,
  status text not null default 'received'
    check (status in ('received', 'in_progress', 'done', 'declined')),
  reply_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jerky_change_requests_user_created_idx
  on public.jerky_change_requests (user_id, created_at desc);

create index if not exists jerky_change_requests_open_status_idx
  on public.jerky_change_requests (status, created_at desc)
  where status in ('received', 'in_progress');

create or replace function public.jerky_change_requests_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jerky_change_requests_updated_at on public.jerky_change_requests;
create trigger jerky_change_requests_updated_at
  before update on public.jerky_change_requests
  for each row
  execute function public.jerky_change_requests_set_updated_at();

alter table public.jerky_change_requests enable row level security;

drop policy if exists jerky_change_requests_insert_own on public.jerky_change_requests;
create policy jerky_change_requests_insert_own
  on public.jerky_change_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists jerky_change_requests_select_own on public.jerky_change_requests;
create policy jerky_change_requests_select_own
  on public.jerky_change_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Service role (Jerky admin API) bypasses RLS. No public update/delete policies.

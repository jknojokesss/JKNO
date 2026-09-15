-- JK Command Center — private ops tables in the main project.
-- RLS on, no policies: service-role only (pages/api/command.js).
-- Safe to re-run.

create table if not exists jk_projects (
  id serial primary key,
  name text not null unique,
  kind text not null,
  status text not null default 'building',
  monthly_value numeric,
  url text,
  admin_url text,
  notes text,
  sort integer default 100,
  updated_at timestamptz default now()
);

create table if not exists jk_tasks (
  id serial primary key,
  title text not null,
  project text,
  priority text not null default 'med',
  status text not null default 'open',
  due_date date,
  source text,
  notes text,
  created_at timestamptz default now(),
  done_at timestamptz
);

create table if not exists jk_prospects (
  id serial primary key,
  name text not null,
  company text,
  source text,
  stage text not null default 'lead',
  demo_industry text,
  next_followup date,
  notes text,
  created_at timestamptz default now()
);

alter table jk_projects enable row level security;
alter table jk_tasks enable row level security;
alter table jk_prospects enable row level security;

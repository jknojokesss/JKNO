-- Log of invoice emails sent from /admin/ar (initial send + reminders).
-- Service-role only — RLS on, no policies (same pattern as qbo_gl_summary).

create table if not exists qbo_ar_mail_log (
  id bigint generated always as identity primary key,
  client_slug text not null,
  invoice_id text not null,
  doc_number text,
  kind text not null check (kind in ('send', 'reminder')),
  sent_at timestamptz not null default now(),
  to_email text not null,
  cc_email text,
  subject text
);

create index if not exists qbo_ar_mail_log_client_invoice
  on qbo_ar_mail_log (client_slug, invoice_id, sent_at desc);

alter table qbo_ar_mail_log enable row level security;

# JK No Jokes — site + demos

Next.js (pages router) on Vercel, production = `main`, domain jknojokes.com.
Data lives in one Supabase project (`cpvscxqrdhbccngfnhdz`, "jk@jknojokes.com's
Project") reached through `lib/supabase.js` via `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Jerky Munch uses its own isolated project
(`lib/supabaseJerky.js`) — don't mix them.

## Demos

Two kinds:

- **Generic industry demos** — entries in `INDUSTRIES` in `lib/industryDemos.js`,
  rendered by `components/IndustryDemo.js` at `/demos/[slug]`. Data baked into
  the config object.
- **Bespoke prospect demos** — standalone pages (e.g. `pages/srl.js`,
  `pages/riverfall-gowns.js`), listed in `EXISTING_DEMOS` in
  `lib/industryDemos.js`. May be Supabase-backed.

To build a new bespoke prospect demo, use the `prospect-demo` skill
(`.claude/skills/prospect-demo/`).

## SRL roofing demo (`/srl`, redirect from `/roofing`)

Southeastern Roofing Logistics — commercial roofer on AccuLynx prepping for a
sale. Five screens: Job Margin (variance flags), WIP Schedule (over/under
billing), Cash Flow (13-week, claims aged separately), Liabilities (retainage /
AP / deposits / unbilled supplements), Buyer Package (normalized EBITDA with
add-backs, print-to-PDF). Original build spec lives in the session that built
it; the four pain points: margin known too late, cash trapped in WIP+AR,
invisible liabilities, books not sale-ready.

- **Page**: `pages/srl.js`, all math client-side from raw tables. Read-only —
  the pitch is "nobody types anything in here; it reads AccuLynx + QuickBooks."
- **Data**: `roof_*` tables (AccuLynx-shaped: jobs, worksheets, invoices,
  payments, change_orders, supplements + QB-side gl_summary, addbacks), seeded
  by `supabase-roofing.sql`. RLS on, anon read-only. Demo is pinned to
  AS_OF = 2026-08-11 so aging never drifts.
- **Reseed**: the SQL file drops + recreates everything, safe to re-run. From a
  session with the Supabase MCP, don't paste the 100KB file — the DB fetches it
  from the repo itself (http extension is enabled):

  ```sql
  do $$
  declare sql_text text;
  begin
    select content into sql_text from extensions.http_get(
      'https://raw.githubusercontent.com/jknojokesss/JKNO/<COMMIT_SHA>/supabase-roofing.sql');
    execute sql_text;
  end $$;
  ```

  Use a full commit SHA, not a branch name — the raw CDN caches branch URLs.
- **Palette discipline** (from the prospect's own site): `#035CEB` appears in
  exactly three places — top bar, active nav, variance/over-under numbers.
  Everything else is stone `#C9C4B8` / slate `#444C56` / ink `#1A1E24` on paper
  `#F6F6F6`. Charter serif headings, Inter with tabular numerals.

## QuickBooks Online read pipe

One Intuit app ("PL Pull", workspace "JK No Jokes" on developer.intuit.com)
serves all clients. Read-only accounting scope. Flow: visit
`/api/qbo/connect?client=<slug>` (we can click it ourselves with an accountant
login and pick the client's company), callback stores realm + tokens in
`qbo_connections`, and the nightly cron (`/api/cron/qbo-sync`, vercel.json)
refreshes tokens and replaces that client's trailing-24-month monthly P&L in
`qbo_gl_summary`. Both tables are RLS-on with no policies — service-role only,
via `lib/supabaseAdmin.js`. Intuit rotates refresh tokens on every refresh;
`lib/qbo.js` persists the new one before doing anything else. Env: `QBO_CLIENT_ID`,
`QBO_CLIENT_SECRET`, `QBO_ENV` (sandbox|production), optional `QBO_REDIRECT_URI`
(defaults to https://jknojokes.com/api/qbo/callback — must be registered in the
Intuit app's redirect URIs). `status='reauth_needed'` on a connection means the
refresh token died (revoked or 100-day idle) and someone must click connect again.

Each sync pulls three reports independently (one failing doesn't cost the
others): P&L → `qbo_gl_summary`, Balance Sheet → `qbo_bs_summary` (both full
replace, 24 months), General Ledger detail → `qbo_gl_txns` (trailing 3 months
by default, replacing only those months so history accumulates). GL is fetched
one month per request — long ranges hit Intuit's report timeout — and its
columns are located by ColKey, not position. Manual run:
`/api/cron/qbo-sync?key=<CRON_SECRET>` plus optional `&client=<slug>` and
`&gl=<months>` for a backfill.

**Where the data lands**: `lib/qboTargets.js`. Most clients write to the main
project; clients with their own isolated Supabase project are listed in
`ISOLATED` there (Jerky Munch → `JERKY_SUPABASE_SERVICE_ROLE_KEY`) and their
books are written to their own project instead. Tokens always stay in the main
project. An isolated client whose key is missing errors rather than falling
back — its books must never land in the shared DB. Any receiving project needs
`supabase-qbo-tables.sql` applied first.

## Conventions

- Bespoke demo pages are single files with inline styles; match that.
- `.env.local` (gitignored) needs the two `NEXT_PUBLIC_SUPABASE_*` vars for
  `next build` to pass locally — values are the main project's URL + anon key.
- This sandbox's network policy blocks supabase.co and jknojokes.com; verify
  pages by serving fixtures through Playwright route interception (the seed
  generator can emit a fixtures JSON).

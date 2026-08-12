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

## Conventions

- Bespoke demo pages are single files with inline styles; match that.
- `.env.local` (gitignored) needs the two `NEXT_PUBLIC_SUPABASE_*` vars for
  `next build` to pass locally — values are the main project's URL + anon key.
- This sandbox's network policy blocks supabase.co and jknojokes.com; verify
  pages by serving fixtures through Playwright route interception (the seed
  generator can emit a fixtures JSON).

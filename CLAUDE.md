# JK No Jokes — site + demos

Next.js (pages router) on Vercel, production = `main`, domain jknojokes.com.
Data lives in one Supabase project (`cpvscxqrdhbccngfnhdz`, "jk@jknojokes.com's
Project") reached through `lib/supabase.js` via `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Jerky Munch uses its own isolated project
(`lib/supabaseJerky.js`) — don't mix them.

The live client portal is **Reydel Tire** (login → `/dashboard`). Demos and
Jerky are separate products; don't restyle, reseed, or isolate Reydel as if it
were one of them.

## Live client: Reydel Tire

Owner **Thomas Reydel**. Portal login `thomashart1984@gmail.com`. Anchor JK No
Jokes client — Lakewood, NJ tire & auto shop. Real Clover POS + Weldon
invoices + QuickBooks, not synthetic. The product he uses is the
profit-per-order view (`order_profit` in Supabase: matched tire sales with
revenue/cost/margin). Auth is email/password via `/login`; unauthenticated
visits bounce there. Shell: `components/Shell.js`.

**Screens** (accent `#B0281C` in at most the wordmark block, active nav, and
key numbers; paper `#F2F0EA` / ink `#1B1815` / graphite sidebar `#1E1C19`;
Barlow Semi Condensed headings, Inter body, IBM Plex Mono labels, tabular
numerals):

- `/dashboard` — monthly P&L from `monthly_summary` + mix from Clover lines
- `/financials` — QBO statements (`loadQboStatements(..., 'reydel')`) reconciled
  against `gl_transactions`; cash views cap at `RECONCILED_THROUGH`
- `/inventory` — Clover items ranked by revenue
- `/orders` — order history with Weldon-matched cost / profit
- `/stock` — on-hand from dated Weldon `LAYERS` minus FIFO sales
- `/ai` — Ask preview only (`COMING SOON`); do not wire a live model here
  unless asked

**QBO slug `reydel`.** Books stay in the main project (not `ISOLATED`). Nightly
sync mirrors GL into `gl_transactions` when the connection has
`portal_client_id` set. Connect: `/api/qbo/connect?client=reydel`. Chart
classification: `lib/accountTypes.js` (loans vs owner's personal vs operating).

**Clover.** `lib/cloverSync.js`, hardcoded `CLIENT_ID`. Nightly cron
`/api/cron/clover-sync` (07:00 UTC, last 7 days, delete-by-`order_id` then
insert). Manual: `/admin/sync` → `/api/clover-sync`. Env:
`CLOVER_API_TOKEN`, `CLOVER_MERCHANT_ID`. Pages that read `clover_line_items`
must page past PostgREST's 1000-row cap (`.range`). Clover's basic plan only
pushes payment-type totals into QBO — no items, no COGS. That's why this
portal matches Weldon to Clover itself; don't "fix" that with Synder /
Commerce Sync / a Clover plan upgrade unless asked. Clover Clearing should
zero after each business day via documented JEs with statements attached,
not an auto-reconcile.

**Weldon / stock.** Weldon is Mavis (MAVISX). Store 776 (`MAVIS00776`) is the
stock warehouse; 796 (`MAVIS00091`) is same-day. Purchases are the `LAYERS`
array in `pages/stock.js`, not a table. Restocks are a 30-second edit —
procedure in `SETUP.md` ("Adding a Weldon Restock"). `q × c` of every new
layer must equal the Inventory Asset hit in QB. Special-orders (small Weldon
POs, qty ≤ 4) are matched from `weldon_orders` on the LIVE view only; the
5/31 book snapshot stays the accounting anchor. Bookmarklet:
`weldon-sync/bookmarklet.js` → `/api/weldon-import` (`WELDON_IMPORT_TOKEN`).
Running it inserts **new `web_id`s into `weldon_orders` only** — it does not
add `LAYERS` or post to QuickBooks.

**Heller CC (Capital One 9618).** That's the card for Mavis / Eastern
Warehouse / Ben Tire. "Plain VISA" and "online VISA (9618)" are the same
card. The QBO Heller CC register is intentionally those three vendors only —
don't "complete" it with the rest of the Capital One activity. Card **8738**
on the same account is Heller personal (due-from-owner / skip, not P&L).
**CHK 5402** is Heller's personal checking, not Reydel's: Reydel sends him
money, he pays the card from there. Transfers to 5402 are not Heller CC
payments. Map: `lib/accountTypes.js` (`Heller CC` = liability).

**Used tires** are a separate pile from new-tire `LAYERS`. Ben Tire purchases
go to Inventory Asset; Clover used-tire sales relieve at **$18/unit**. Don't
FIFO them against Weldon stock.

**What goes to Inventory Asset vs expense** (the order-date / STOCK recon —
lives in `pages/orders.js` + `pages/api/inventory-cogs.js`, not in a chat):

- From **4/27** Weldon `PO# STOCK` = shelf restock → capitalize (add a
  `LAYERS` row, Dr Inventory Asset). A named/blank PO# = customer special
  order → expense, matched to a Clover sale of that size within ~3 days.
  Before 4/27 the PO# field is unreliable — the first big shelf fill is the
  **April 15–17** stock-up (and the May 15 Matthew Campbell batch), classified
  by size and session, not PO#. Don't revert to "qty 6+ = inventory" as a
  standing rule; that's the pre-PO# heuristic only.
- May is a **closed** period. PO#-based reclass starts **6/1**
  (`RECLASS_FROM`) so posted May JEs don't move.
- Qty ≥ 5 on the stock page is always a restock (never auto-matched as
  same-day). Qty ≤ 4 near a sale date is same-day and does not pull the shelf.
- July had no PO#s — restocks were classified by consecutive `web_id`s +
  Clover sell→reorder timing (`JULY_LAYERS` in `inventory-cogs.js`).
- Month-end relief is movement method: begin + stock purchases − end =
  Dr COGS / Cr Inventory. Engine: `/api/inventory-cogs`; preview JE:
  `/api/qbo/prepare-close`. June purchases $4,450; July $10,237 (of which
  $452 is the 7/31 CC that hits August's GL). A new month needs new layers
  in `inventory-cogs.js` before close will run.

Do not: invent Reydel rows, drop them into an isolated Supabase project, or
"clean up" `LAYERS` / `RETURNS` / `SAME_DAY_ITEMS` without tying the dollars
back to QuickBooks.

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

- Working style: blunt, short, make the call. Verify numbers against data
  before stating them; if you didn't check, say so. Voice-to-text is normal
  (phonetic spellings, mid-thought cutoffs). Keep Adar, HOA, and personal
  material out of this repo.
- Other clients vs demos: Jerky Munch is live (isolated Supabase). MNE Trading
  (`/mne-trading`) and QueFence (`/quefence`) are seeded demos even when they
  are real prospects — don't mix them with Reydel books or restyle Reydel to
  match a demo.
- Bespoke demo pages are single files with inline styles; match that.
- `.env.local` (gitignored) needs the two `NEXT_PUBLIC_SUPABASE_*` vars for
  `next build` to pass locally — values are the main project's URL + anon key.
- This sandbox's network policy blocks supabase.co and jknojokes.com; verify
  pages by serving fixtures through Playwright route interception (the seed
  generator can emit a fixtures JSON).

# JK No Jokes — site + demos

Next.js (pages router) on Vercel, production = `main`, domain jknojokes.com.
This repo is three things at once: a marketing site, ~26 demo dashboards, and
**real production software for paying clients**. Do not assume a page is a
demo. `/srl` is a demo; `/portal` and `/admin/ar` move real money; Reydel's
live login is `/dashboard`.

Data lives in one Supabase project (`cpvscxqrdhbccngfnhdz`, "jk@jknojokes.com's
Project") reached through `lib/supabase.js` via `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Jerky Munch uses its own isolated project
(`lib/supabaseJerky.js`) — don't mix them.

The live tire-shop product is **Reydel Tire** (login → `/dashboard`). Demos and
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

CSV/XLSX **book** import paths were deliberately removed (PRs #19, #20) —
`/admin/financials`, `/api/gl-import`, `/api/coa-import`, `/api/gl-restore`.
Ledger and CoA come from the QBO API. Don't rebuild a hand-upload that can
overwrite a nightly sync. (Export-to-CSV on `/stock` and `/orders` is fine.)

Stock on-hand is the dated `LAYERS` snapshot minus FIFO sales, not a live
`stock_purchases → Clover` rebuild. That live version drifted (pre-4/15
carryover, reconstructed costs). Don't bring it back.

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

## QuickBooks Online pipe

One Intuit app ("PL Pull", workspace "JK No Jokes" on developer.intuit.com)
serves all clients. Scope `com.intuit.quickbooks.accounting` covers **reads and
writes** — Intuit has no separate read-only scope, so clients do not re-auth
when write features ship. Flow: visit `/api/qbo/connect?client=<slug>` (we can
click it ourselves with an accountant login and pick the client's company),
callback stores realm + tokens in `qbo_connections`, and the nightly cron
(`/api/cron/qbo-sync`, vercel.json) refreshes tokens and replaces that client's
trailing-24-month monthly P&L in `qbo_gl_summary`. `qbo_connections` and
`qbo_gl_summary` are RLS-on with **no policies** — service-role only, via
`lib/supabaseAdmin.js`. Intuit rotates refresh tokens on every refresh;
`lib/qboAuth.js` (and the cron's inline refresh) persist the new one **before**
doing anything else. New code that refreshes must go through `qboAuth` or the
next caller gets `invalid_grant`. Env: `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`,
`QBO_ENV` (sandbox|production), optional `QBO_REDIRECT_URI` (defaults to
https://jknojokes.com/api/qbo/callback — must be registered in the Intuit app's
redirect URIs). `status='reauth_needed'` on a connection means the refresh
token died (revoked or 100-day idle) and someone must click connect again.

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

**Writes** (`lib/qboWrite.js`, `/api/qbo/push-je`, `/api/qbo/prepare-close`)
are gated by `lib/requireAdmin.js`, which **fails closed**. An earlier version
returned true when `ADMIN_API_KEY` was missing; don't reintroduce that. Month-
end inventory JE: `/api/inventory-cogs` (same engine as `/orders`) →
`/api/qbo/prepare-close` (Dr COGS / Cr Inventory) → `/admin/qbo-push` posts.

**Gotchas that were each a bug once** — don't regress:
- Persist the rotated refresh token before any later work that can fail.
- GL one month per request; columns by ColKey, not position.
- The P&L "Total" column is not a month (`Date.parse("Total 1")` → 2001-01-01).
- Paged Supabase reads need a stable `ORDER BY` or rows duplicate/vanish
  across pages while counts still match.
- Default PostgREST cap is 1000 rows; page past it.
- Null-dated leftover CSV "Beginning Balance" rows survive range deletes —
  mirror deletes must catch those too. Row-count matching is not reconciliation;
  QuickBooks' own statement is the independent check.

Official QBO statements live in `lib/qboStatements.js`. Ledger-derived figures
(`lib/jerkyGL.js`, `/financials`) are reconstructions. Show both and reconcile;
don't drop the official figure.

## AR desk and client portal (live money)

`/admin/ar` pulls a client's real open invoices from QBO and emails the
QBO-generated invoice PDF. Read-only against the books; the only side effect
is email. QBO has no statement API, so `lib/statementPdf.js` draws one.

`/portal` maps a login **server-side** to exactly one QBO company
(`lib/portalAuth.js`). The page never chooses a client; a portal login can
never name a slug, so it can never see another client's books. Fails closed.
Portal clients are blocked from admin access; `portal_users.protect_from_admin`
has an exception so our own books can be a self-test.

`/admin/ar` and `/portal` implement the same AR logic twice. If you touch AR
behavior, check whether both paths need it. PR #47 was one attempt to
converge them.

## Security — fail closed

Four modules fail closed because of a specific past hole:

| Module | Guards |
|---|---|
| `lib/requireAdmin.js` | QBO write endpoints. False when unconfigured. |
| `lib/requireJerkyUser.js` | Jerky invoice endpoints (create real invoices). |
| `lib/portalAuth.js` | Forces one `client_slug`; a portal user can't name a client. |
| `lib/qboTargets.js` | Errors rather than writing an isolated client's books to the shared DB. |

`lib/supabaseAdmin.js` uses the service-role key and **bypasses RLS** — never
import it into anything that runs in the browser. The Jerky anon key is public
by design (it ships in the bundle); **RLS** protects that data, not the key.
Cron routes require `CRON_SECRET`. `lib/qboState.js` is CSRF protection for
OAuth state — it used to be cookie-only, which stranded users across apex/www.
Two tables in the main project have RLS **off**: `shul_board_status` and
`outreach_contacts` — anyone with the anon key can read/modify them. Don't
copy that pattern onto client books.

## Conventions

- Working style: blunt, short, make the call. Verify numbers against data
  before stating them; if you didn't check, say so. Voice-to-text is normal
  (phonetic spellings, mid-thought cutoffs). Keep Adar, HOA, and personal
  material out of this repo. Don't dump raw chat transcripts or other-repo
  sessions (MNE's `mne-trading-app`, Lew Imports, etc.) into this git tree —
  distill durable JKNO rules here.
- Other clients vs demos: Jerky Munch is live (isolated Supabase). MNE Trading
  (`/mne-trading`) and QueFence (`/quefence`) are seeded demos even when they
  are real prospects — don't mix them with Reydel books or restyle Reydel to
  match a demo. Jerky's new-invoice form is one line on purpose; the
  multi-flavor product builder was removed because Efraim doesn't use it —
  don't rebuild it.
- Bespoke demo pages are single files with inline styles; match that.
  `pages/quefence.js` is thousands of lines on purpose.
- Nearly every `lib/*.js` opens with a comment explaining not just what it
  does but **what went wrong before it looked like this**. Read that header
  before changing the module.
- Commit messages and PR titles describe the user-visible outcome in plain
  English, not the mechanism.
- `.env.local` (gitignored) needs the two `NEXT_PUBLIC_SUPABASE_*` vars for
  `next build` / `next dev` on this VM — URL + anon key for the main project
  (`cpvscxqrdhbccngfnhdz`). Pull them with the Supabase MCP
  (`get_publishable_keys`); do not commit the file.
- This VM can reach supabase.co and jknojokes.com. Query and migrate the live
  DB through the Supabase MCP (`execute_sql` / `apply_migration`). Don't invent
  a network block.

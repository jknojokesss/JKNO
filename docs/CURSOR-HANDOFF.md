# JK No Jokes — handoff for Cursor

Reconstructed 2026-08-31 so that work started in Claude Code on the web can be
picked up in Cursor with full context.

**On the chat logs:** the raw transcripts of those cloud sessions are not
exportable. Cloud sessions run in ephemeral containers that are reclaimed after
the session ends, and the remote API exposes only session *metadata* (title,
dates, branch, status) — not message history. What follows is rebuilt from the
things that did persist: 629 commits, 68 pull requests with their descriptions,
the session index, and the code itself. The PR descriptions are the closest
thing to a transcript — they were written per change and carry the reasoning.
See `docs/PR-HISTORY.md` for all 68 in full.

---

## 1. What this is

A Next.js **pages-router** app on Vercel that is three things at once:

1. **A marketing site** for a bookkeeping/CFO practice (jknojokes.com).
2. **A demo factory** — ~26 fake-company dashboards used as sales collateral.
3. **Real production software for real paying clients** — live QuickBooks
   integrations, invoicing, AR chasing, a client portal, payment links.

Do not assume a page is a demo. `/srl` is a demo; `/portal` moves real money.

- **Production branch:** `main`, auto-deploys to Vercel.
- **Domain:** jknojokes.com
- **Package name:** `jk-accounting` (Next 14.2.3, React 18, Tailwind).

```
npm install
npm run dev      # localhost:3000
npm run build    # needs .env.local — see §3
```

---

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 pages router |
| Styling | Tailwind + heavy inline styles on bespoke pages |
| Data | Supabase (Postgres + Auth + RLS) — **two separate projects** |
| Accounting | QuickBooks Online REST API (OAuth2) |
| Mail | nodemailer over SMTP (Gmail/Workspace, Zoho), Resend for lead capture |
| Payments | Stripe (Payment Links + dynamic Checkout) |
| PDF | pdf-lib (hand-drawn statements) |
| Charts | Recharts |
| Cron | Vercel cron (`vercel.json`) |

Two nightly crons:

```
/api/cron/clover-sync   07:00 UTC   Clover POS → Supabase (Reydel tires)
/api/cron/qbo-sync      07:30 UTC   QuickBooks → Supabase (all connected clients)
```

---

## 3. Environment variables

`.env.local` is gitignored. **`next build` fails without the two
`NEXT_PUBLIC_SUPABASE_*` vars** — everything else degrades gracefully.

**Required for build/dev**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Server-side / production**
```
SUPABASE_SERVICE_ROLE_KEY          bypasses RLS — server only, never in a component
JERKY_SUPABASE_SERVICE_ROLE_KEY    Jerky Munch's isolated project

QBO_CLIENT_ID / QBO_CLIENT_SECRET  the one Intuit app ("PL Pull")
QBO_ENV                            sandbox | production
QBO_REDIRECT_URI                   default https://jknojokes.com/api/qbo/callback
CRON_SECRET                        gates the cron routes
ADMIN_API_KEY                      gates the QBO *write* endpoints (fails closed)

SMTP_HOST/PORT/USER/PASS/FROM      generic outbound mail
GMAIL_USER / GMAIL_APP_PASSWORD    the AR desk's own sending address
JERKY_SMTP_*                       Jerky Munch's own mailbox
ZOHO_EMAIL / ZOHO_PASSWORD         alternate SMTP
RESEND_API_KEY                     expo/lead capture
LEAD_NOTIFY_EMAIL

STRIPE_SECRET_KEY                  per-invoice checkout
STRIPE_LINKS                       JSON map of name → flat Payment Link
STRIPE_PAYMENT_LINK                single fallback flat link
STRIPE_PAY_CLIENT                  which QBO company /pay reads (default 'jkno')
PAY_ZELLE                          Zelle handle shown alongside the card link

PORTAL_BASE_URL
PORTAL_LINK_SECRET                 HMAC key for signed document links

CLOVER_API_TOKEN / CLOVER_MERCHANT_ID
JERKY_SHOPIFY_DOMAIN / JERKY_SHOPIFY_TOKEN
JERKY_WA_VERIFY_TOKEN              WhatsApp webhook
WELDON_IMPORT_TOKEN                bookmarklet import
GOOGLE_PLACES_API_KEY              lead scraping
ANTHROPIC_API_KEY
```

---

## 4. The data layer — two Supabase projects, kept apart

```
MAIN     cpvscxqrdhbccngfnhdz   lib/supabase.js (browser, anon+RLS)
                                lib/supabaseAdmin.js (service role, server only)
JERKY    jjcnzpicenrbxqrjqsnn   lib/supabaseJerky.js
```

**This separation is a deliberate client-data boundary, not an accident.** Jerky
Munch's books must never land in the shared database. `lib/qboTargets.js` routes
each client's synced data to the right project; an isolated client whose
service-role key is missing **errors rather than falling back**. OAuth tokens
always stay in the main project so connection health is visible in one place.

SQL lives at the repo root and is re-runnable (drop + recreate):

| File | Purpose |
|---|---|
| `supabase-setup.sql` | core/main schema |
| `supabase-qbo-tables.sql` | `qbo_*` tables — apply to **any** project that receives books |
| `supabase-qbo-policies.sql` | RLS for those |
| `supabase-roofing.sql` | `roof_*` seed for the `/srl` demo (~101 KB) |
| `supabase-ardesk.sql` | `/ar-desk` demo seed (~120 KB) |
| `supabase-jerky-*.sql` | Jerky project: munch, stores, invoices, books, roles, reseed, zero |
| `20260529032505_initial_schema.sql` | full historical dump (~1.4 MB) |

Tables you'll actually meet: `qbo_connections`, `qbo_gl_summary`,
`qbo_bs_summary`, `qbo_gl_txns`, `qbo_journal_entries`, `portal_users`,
`portal_sends`, `clients`, `admins`, `store_invoices`, `consignment_partners`,
`consignment_log`, `gl_transactions`, `coa_accounts`, `pl_totals`, `bs_totals`,
`monthly_summary`, `clover_line_items`, `weldon_orders`, `gown_orders`,
`gown_catalog`, `gown_tasks`, `outreach_contacts`.

---

## 5. The QuickBooks pipe — read the gotchas before touching it

One Intuit app ("PL Pull", workspace "JK No Jokes") serves **every** client.
Scope `com.intuit.quickbooks.accounting` covers reads *and* writes — there is no
separate read-only scope, so no client re-authorizes when write features ship.

**Connect flow:** visit `/api/qbo/connect?client=<slug>` → Intuit login → pick
company → `/api/qbo/callback` stores realm + tokens in `qbo_connections` and
echoes the company name back, so connecting the wrong file is caught on the spot.

**Nightly sync** (`/api/cron/qbo-sync`) per client, three reports fetched
independently so one failure doesn't cost the others:

| Report | Lands in | Window |
|---|---|---|
| P&L | `qbo_gl_summary` | trailing 24 months, full replace |
| Balance Sheet | `qbo_bs_summary` | trailing 24 months, full replace |
| GL detail | `qbo_gl_txns` | trailing 3 months, replaces only those months so history accumulates |

Manual run: `/api/cron/qbo-sync?key=<CRON_SECRET>` plus optional
`&client=<slug>` and `&gl=<months>` for a backfill.

### Non-obvious things that were each a bug once

- **Intuit rotates the refresh token on every refresh.** The response carries a
  new one and invalidates the old. `lib/qboAuth.js` persists it *before* doing
  anything that could fail. Any new code path that refreshes must do the same or
  the next caller gets `invalid_grant`. (PR #9)
- **GL is fetched one month per request.** Longer ranges hit Intuit's report
  timeout. (PR #14)
- **GL columns are located by ColKey, never by position.** (PR #16)
- **The P&L "Total" column is not a month** — parsing it as one corrupts the
  series. (PR #13)
- **Paged Supabase reads need a stable sort**, or rows duplicate/vanish across
  pages. (PR #22)
- **The mirror truncated at 1000 rows** — Supabase's default limit. (PR #18)
- `status='reauth_needed'` on a connection = refresh token died (revoked, or
  100-day idle). Someone must click connect again.

**Write pipe** (`lib/qboWrite.js`, `/api/qbo/push-je`, `/api/qbo/prepare-close`)
is gated by `lib/requireAdmin.js`, which **fails closed**. An earlier version
returned `true` when no API key was configured, reasoning the admin page sat
behind a login — but a protected page says nothing about a protected API route.
Don't reintroduce that.

---

## 6. Workstreams

### 6a. Marketing site
`/`, `/about`, `/what-we-do`, `/how-it-works`, `/ai`, `/privacy`, `/terms`,
`/login`, `/signup`, `/reset-password`, `/expo`, `/expo-sign`, `/expo-leads`.
The home page carries a Calendly link for a $25 gift-card booking offer.

### 6b. Demos — two kinds, don't confuse them

**Generic industry demos** — config objects in `INDUSTRIES`
(`lib/industryDemos.js`), all rendered by `components/IndustryDemo.js` at
`/demos/[slug]`. Data is baked into the config; no backend. 18 of them:
`auto-repair hvac plumbing electrician landscaping cleaning construction
restaurant liquor-store barbershop boutique gym dental law-firm
property-management ecommerce trucking wholesale`.

**Bespoke prospect demos** — standalone single-file pages, listed in
`EXISTING_DEMOS`. May be Supabase-backed:

| Route | Business | Angle |
|---|---|---|
| `/demo` | Riverside Bakery | the original |
| `/riverside-tires` | Riverside Tires | items + services |
| `/riverfall-gowns` | Riverfall Gowns | order tracking |
| `/appliance-repair` | YT Appliance Repair | live job board |
| `/sba-lending` | Riverbank Funding | loan pipeline |
| `/srl` | Southeastern Roofing Logistics | see §6c |
| `/quefence` | QueFence | crew logs a day in 10s → QuickBooks, job-coded |
| `/ar-desk` | Lakeland Supply Co. | statements in one pass |

Also present but not in the gallery: `/fence-makers`, `/gowns`, `/crave-jerky`,
`/jerky-joy`, `/next-level-taste`, `/country-crave`, `/bear-wolf`,
`/mint-capital`, `/menachem`, `/mne-trading`.

**To build a new one, use the `prospect-demo` skill** at
`.claude/skills/prospect-demo/SKILL.md`. In Cursor you won't get skill
auto-loading — read that file yourself and follow it; it encodes the house
pattern (seeded data layer → standalone page → gallery entry → deploy).

### 6c. `/srl` — the roofing demo (the most polished one)

Southeastern Roofing Logistics, a commercial roofer on AccuLynx prepping for a
sale. Five screens: Job Margin (variance flags), WIP Schedule (over/under
billing), Cash Flow (13-week, claims aged separately), Liabilities (retainage /
AP / deposits / unbilled supplements), Buyer Package (normalized EBITDA with
add-backs, print-to-PDF).

Four pain points it dramatizes: margin known too late; cash trapped in WIP+AR;
invisible liabilities; books not sale-ready.

- All math is client-side from raw tables. **Read-only by design** — the pitch is
  "nobody types anything in here; it reads AccuLynx + QuickBooks."
- Data: `roof_*` tables, AccuLynx-shaped, seeded by `supabase-roofing.sql`.
  RLS on, anon read-only. Pinned to `AS_OF = 2026-08-11` so aging never drifts.
- **Palette discipline** (sampled from the prospect's real site): `#035CEB`
  appears in exactly **three** places — top bar, active nav, variance/over-under
  numbers. Everything else is stone `#C9C4B8` / slate `#444C56` / ink `#1A1E24`
  on paper `#F6F6F6`. Charter serif headings, Inter with tabular numerals.
  Keep this discipline; it's why the page reads as expensive.
- **Reseed:** the SQL drops and recreates everything, safe to re-run. From a
  session with the Supabase MCP, don't paste the 100 KB file — have the DB fetch
  it (the `http` extension is enabled), using a **full commit SHA**, never a
  branch name (the raw CDN caches branch URLs):

```sql
do $$
declare sql_text text;
begin
  select content into sql_text from extensions.http_get(
    'https://raw.githubusercontent.com/jknojokesss/JKNO/<COMMIT_SHA>/supabase-roofing.sql');
  execute sql_text;
end $$;
```

### 6d. The AR desk (`/admin/ar`) — live, real client money

Pulls a client's real open invoices straight from QuickBooks and emails the
actual QBO-generated invoice PDF from our own address (`GMAIL_USER`).
Read-only against the books; the only side effect is email.

Grew over PRs #24–#61 into a full collections workstation:
work queue with send tracking and thresholds, saved views, aging chips,
multi-select on invoices *and* customers, sortable columns everywhere, a read
cache, statements folded in as a second tab, printable statements with page
breaks and batch runs, real PDF statements as attachments.

Supporting libs: `lib/qboAr.js` (live reads + the QB-rendered PDF),
`lib/qboStatements.js`, `lib/statementPdf.js`, `components/WorkQueue.js`,
`components/viewState.js`, `components/useIsPhone.js`.

**Why statements are hand-drawn PDFs:** QuickBooks has no statement API and
therefore no statement PDF. `lib/statementPdf.js` draws one with pdf-lib so a
statement can be *attached* like an invoice is — a customer-facing message
should carry the sender's own document, never a link to a third party's domain.

**Derived vs. official figures:** the apps also *derive* statements from the
ledger (`lib/jerkyGL.js`, `/financials`). Those reconstructions are honest but
they are reconstructions. `lib/qboStatements.js` holds what QuickBooks itself
reports. Showing the official figure and reconciling the derived one against it
is what makes drift visible — keep both.

### 6e. `/portal` — the client portal

A portal login is mapped **server-side** to exactly one QuickBooks company. The
page never chooses a client; `lib/portalAuth.js` forces the signed-in user's
`client_slug` onto every action and **fails closed**. A portal login can never
name a client, so it can never see another client's books. Portal clients are
additionally blocked from admin access (PR #41); `portal_users.protect_from_admin`
has an exception so our own books can be used as a self-test (PR #44).

Emailing opens *her own* mail app (or Gmail on the web) with to/subject/body
prefilled and the PDF downloaded to attach — the message leaves from her
account, carrying only her words and her document. On phones it hands off to the
native mail app rather than Gmail's desktop compose URL (PR #61).

Because Gmail-compose can't attach files, emails carry a link to
`/api/portal/doc` instead — **HMAC-signed** over `(client, kind, id, exp)` and
expiring, so nothing is enumerable without `PORTAL_LINK_SECRET`.

Built to stay usable at **7,000 invoices** (PRs #45, #50, #60): server-side
paging, parallel page fetches, and it no longer reads the whole invoice history.

### 6f. `/pay` — short branded pay links

`pages/pay/[[...slug]].js`. Stripe's own URLs are long and anonymous and don't
belong next to an invoice in a customer's inbox.

```
/pay?inv=1001     looks that invoice up in QuickBooks, sends them to Stripe for
                  EXACTLY the balance owed, invoice number attached to the payment
/pay              the flat Stripe Payment Link
/pay/retainer     a named flat link for another price/product
/pay?email=…      prefills their email
```

A fixed Payment Link can only ever charge one amount, which is useless when
every customer owes something different — hence dynamic per-invoice checkout,
falling back to the flat link whenever Stripe or the lookup is unavailable, so a
link already sitting in a sent email never dead-ends.

**Build-time trap, already fixed — don't undo it:** `lib/qboAuth` and `lib/qboAr`
are imported *inside* `getServerSideProps`, not at module scope. They reach for
the service-role key, and Next evaluates page modules at build time when that key
isn't present; a top-level import fails the whole build.

Invoice emails carry both the card link and Zelle (`PAY_ZELLE`), and say *why*
a pay line is missing rather than silently omitting it (PRs #65, #66).

### 6g. Jerky Munch — isolated client, most complex build

Runs against its own Supabase project. `/jerky-munch` (1,815 lines) is a PWA
(`public/jerky-munch.webmanifest`, `public/sw.js`, real PNG icons at 192/512 +
maskable + apple-touch).

- **Invoicing → real QuickBooks invoices** from the Invoice Stores tab.
  Customer-mapping UI, QB payment write-back on mark-paid, in-app void
  (fetches a fresh SyncToken first).
- **Invoice numbers:** auto-assigned on create when QB's custom-txn-numbers is
  on; an "Assign #" button heals blank-numbered rows. Two-way sync with QB via
  `/api/jerky/sync-invoices` — QuickBooks is the source of truth.
- **New-invoice form is deliberately one line** (item + price prefilled from the
  last invoice, enter qty). The multi-flavor product builder was **removed
  because Efraim doesn't use it** — don't rebuild it.
- **Mail from the business, not Intuit:** `lib/jerkyMailer.js` sends the
  QB-generated PDF from `accounting@jerkymunch.com` over Workspace SMTP, reusing
  the subject/body Efraim already set in QuickBooks
  (`Preferences.EmailMessagesPrefs`), with a fallback default.
- **Consignment:** per-bag price editor (default $11.50). The
  owed-per-count reconciliation read zero while price was 0 — that's why the
  editor exists.
- **Confirm dialog before an invoice emails a store**, so test runs can't spam a
  real customer.
- **Plain English on operational tabs**: "Owed to you" not "A/R", "Where the bags
  went" not "reconciliation", "Theft or loss" not "shrinkage". **Financials
  statements keep standard accounting terms** — that split is intentional.
- Mobile: 16px inputs (stops iOS zoom-on-focus), 40px min tap targets under 600px.
- `/api/jerky-wa-order` — WhatsApp → Shopify draft-order webhook.
  Setup notes in `EFRAIM-whatsapp-order-bot-setup.md`.
- `lib/requireJerkyUser.js` gates every Jerky endpoint and **fails closed** —
  these routes create real invoices in a real company's books.

### 6h. Reydel / Riverside Tires

`/stock`, `/inventory`, `/orders`, `/financials`, `/admin/sync`.
Clover POS syncs nightly (`lib/cloverSync.js`). Weldon supplier orders arrive via
a browser bookmarklet POSTing to `/api/weldon-import` (token-gated, CORS-enabled)
— it runs on the user's real Cloudflare-cleared Weldon session, which is why
it's a bookmarklet and not a server-side scrape.

Stock is a **fixed, reconciled on-hand snapshot**, not a live computation. The
live `stock_purchases − Clover` version pulled in pre-4/15 carryover, used
dashboard-reconstructed costs, and drifted as Clover kept syncing (PRs #1, #2).

Month-end: `/api/qbo/prepare-close` builds the inventory-relief journal entry
(Dr COGS / Cr Inventory) from `/api/inventory-cogs`, which runs the *same* cost
engine as `/orders`; `/admin/qbo-push` pushes it. `lib/accountTypes.js` is the
single source of truth for account classification (explicit chart-of-accounts map
first, keyword fallback second) shared by the Accounts page and Financials.
`lib/rebuildFinancials.js` recomputes `pl_totals` / `monthly_summary` /
`bs_totals` after either a GL import or a chart-of-accounts import.

CSV/XLSX import paths were **deliberately removed** for both Reydel and Jerky
(PRs #19, #20) — books come from the QuickBooks API now, nothing is hand-imported.

### 6i. Other admin
`/admin` (index, dashboard, clients, leads, calls), `/outreach`,
`/api/scrape-leads` (Google Places), `/api/send-outreach`, `/api/send-receipt`
(allowlisted senders only — prevents use as an open email relay), `/api/contact`,
`/api/expo-lead`.

---

## 7. Security invariants — these are load-bearing

Four modules **fail closed** and each does so because of a specific past hole:

| Module | Guards |
|---|---|
| `lib/requireAdmin.js` | QBO write endpoints. Returns false when unconfigured. |
| `lib/requireJerkyUser.js` | Jerky invoice endpoints (creates real invoices). |
| `lib/portalAuth.js` | Forces one `client_slug`; a portal user can't name a client. |
| `lib/qboTargets.js` | Errors rather than writing an isolated client's books to the shared DB. |

Plus:
- `lib/supabaseAdmin.js` uses the service-role key and **bypasses RLS** — never
  import it into anything that runs in the browser.
- The Jerky anon key is public by design (it ships in the bundle). **RLS is what
  protects that data**, not the key.
- `qbo_connections` and `qbo_gl_summary` are RLS-on with **no policies** —
  service-role only.
- Cron routes require `CRON_SECRET` (Vercel attaches it as a bearer token
  automatically), keeping them un-triggerable from the public internet.
- `lib/qboState.js` — OAuth state is CSRF protection. It used to be proved by a
  cookie alone, which stranded real users (host-only cookies across apex/www).

---

## 8. Conventions

- **Bespoke demo pages are single files with inline styles.** Match that; don't
  refactor them into shared components. `pages/quefence.js` is 2,421 lines and
  that is on purpose.
- Commit messages and PR titles are written in **plain English describing the
  user-visible outcome**, not the mechanism — "Invoice lines can be negative",
  "Keep her place on return", "Say why the pay line is missing instead of
  omitting it silently". Match that voice.
- Client-facing copy avoids accounting jargon on operational screens and keeps
  it on financial statements.
- `.env.local` is gitignored; both `NEXT_PUBLIC_SUPABASE_*` vars are needed for
  `next build` to pass locally.
- **Sandbox note (was true in the cloud sessions):** that environment's network
  policy blocked supabase.co and jknojokes.com, so pages were verified by serving
  fixtures through Playwright route interception. On your own machine you can
  just hit the real thing — this constraint is why some verification code looks
  indirect.

---

## 9. Session index — what was built where

Sessions on this repo run in Claude Code on the web (`anthropic_cloud`) or from
the local CLI bridge. Transcripts are not retrievable; branches and PRs are.

### Cloud sessions (web), this repo

| Started | Title | Branch | Outcome |
|---|---|---|---|
| 2026-07-20 | Gowns error | `claude/gowns-error-kgdspv` | feature deployed from main; lockfile restored |
| 2026-07-30 | 3D warehouse | `claude/3d-warehouse-s057gu` | Adar Warehouse 3D finder; dark → bright daylight scene, colors on by default. Artifact "Adar Warehouse — 3D Finder"; also `public/adar-warehouse.html` |
| 2026-07-30 | (untitled) | `claude/new-session-8tto53` | $500 payment confirmed; Stripe Payment Links identified for scale — the seed of §6f |
| 2026-08-11 | Roofing demo | `claude/roofing-demo-2ka9v8` | PRs #3–#23: `/srl` built and shipped, Intuit app approved, QB feeds live. The single biggest session. |
| 2026-08-18 | MNE P&L for mortgage modification | `claude/mne-pl-mortgage-modification-o9vrl5` | split payment display, labeled $505k vs $491.9k. Also sourced the separate `jknojokesss/mne-trading-app` repo |
| 2026-08-25 | QB customer statements/invoices portal | `claude/qb-customer-portal-4gbvje` | PRs #24–#67: the AR desk, the portal, statements, pay links. Ended on a dual-code-path bug between `/admin/ar` and `/portal`. Artifact "Wilner Portal Access" |
| 2026-08-31 | Cloud code chat export | `claude/cloud-code-chat-export-e59wv3` | this document |

**Carry-over worth knowing:** the last session's closing note was a *dual code
path* between `/admin/ar` and `/portal` — the same AR logic implemented twice.
PR #47 ("Admin AR: same search, sort and paging as the portal") was one attempt
to converge them. If you touch AR behaviour, check whether both paths need it.

### Local CLI sessions (context only, no branches here)

"APIs with QB desktop" (2026-08-26) · "Quefence demo spec" (2026-08-13, fed
`/quefence`) · "MNE invoice entry and profit calculation" (2026-08-06) ·
"Reydel Tire July purchases inventory" (2026-08-02) · "Build 3D warehouse map"
(2026-07-30) · "Review Jerky Munch project" (2026-07-23) · plus non-code sessions.

### Chronology by volume

Development ran 2026-05-27 → 2026-08-30, 629 commits. Heaviest days:
07-19 (38), 05-27 (31), 08-07 (31), 08-12 (31), 06-30 (23), 06-23 (23),
06-28 (22), 07-21 (22), 06-11 (21).

Roughly: May–June built the marketing site, the demo engine, and the Reydel
tooling; July added the bespoke prospect demos and the gowns/warehouse work;
August was QuickBooks — the read pipe (#9–#23), then the AR desk, portal,
statements, and pay links (#24–#67).

---

## 10. Open threads

- **PR #68** ("Document the live Reydel portal in CLAUDE.md") was open, not
  merged, as of 2026-08-31. `main` is at `3c58eef` (PR #67).
- The `/admin/ar` ↔ `/portal` dual code path described above.
- Stale branches on the remote: `fix/orders-inventory-classification`,
  `fix/stock-naming`, `qbo-write`, `quefence-demo`.
- `CLAUDE.md` at the repo root is the instruction file the cloud sessions read.
  It is accurate but narrower than this document — it covers the demos, the SRL
  demo, and the QBO pipe. Keep it current; it's what future Claude sessions load.

---

## 11. Reading order for a new contributor

1. `CLAUDE.md` — project rules in brief
2. This file
3. `lib/qbo.js`, `lib/qboAuth.js`, `lib/qboTargets.js` — the integration spine
4. `pages/admin/ar.js` + `pages/portal.js` — the live products
5. `pages/srl.js` — the house style at its best
6. `docs/PR-HISTORY.md` — the reasoning behind all 68 changes

Nearly every `lib/*.js` opens with a comment explaining not just what it does but
*what went wrong before it looked like this*. Those headers are the real
documentation — read them before changing a module.

---
name: prospect-demo
description: Build a bespoke, Supabase-backed sales demo portal for a specific prospect (like /srl for the roofing contractor). Use when asked to build a demo around a prospect's business, industry, or pain points — takes a spec or a description of the prospect and produces a seeded data layer, a standalone demo page, gallery entry, and production deploy.
---

# Prospect demo builder

Builds what `/riverstone-roofing` (Riverstone Roofing) is: a standalone,
click-through management portal seeded with synthetic data engineered so the
prospect recognizes their own problems in it. Read `pages/riverstone-roofing.js` and
`supabase-roofing.sql` as the reference implementation before starting.

## Ground rules

1. **Pain points first.** Get 3–5 named pain points from the user or spec.
   Every screen must serve one; cut anything that doesn't. Screen headers are
   questions in the owner's language ("Which jobs are losing money?"), never
   nouns ("Margin Analysis").
2. **Synthetic data, engineered problems.** The demo must have something wrong
   in it — jobs bleeding margin, money never invoiced, liabilities nobody sees.
   A demo where everything is healthy sells nothing.
3. **Read-only portal.** No data entry, no posting. The pitch is always "keep
   your current software — this reads it." State the boundary in the UI.
4. **Their palette, JK's type.** Sample 4–6 colors from the prospect's website.
   Pick ONE loud accent and use it in at most three places; build everything
   else from the neutrals. Serif headings (Charter), body/numerals in a
   tabular-figure sans (Inter + `font-variant-numeric: tabular-nums`), numbers
   right-aligned, no gradients, no emoji in the app, no animated counters.

## Build sequence

1. **Data layer.** Write a deterministic Node generator (seeded PRNG — copy
   `mulberry32` from the SRL generator) that emits one `supabase-<name>.sql`
   file: `drop + create` tables (prefixed `<name>_*`), RLS enabled with
   anon-select-only policies, then all inserts. Mirror the shape of the
   prospect's real software so the future integration is a swap, not a rewrite.
   Pin an `AS_OF` date so aging never drifts. Also emit a fixtures JSON
   (PostgREST-shaped, per-table arrays) for local verification.
   - Engineer the story numbers deterministically (forced problem jobs, status
     cycles), not by tuning random rates — RNG whack-a-mole wastes hours.
2. **Seed the DB.** Commit + push the SQL, then from the Supabase MCP run the
   `http_get` + `execute` block in CLAUDE.md against the main project, using
   the full commit SHA in the raw URL. Verify with a few aggregate selects.
3. **Page.** One file in `pages/`, all metrics computed client-side from the
   raw tables via `lib/supabase.js`. Structure that works sent cold:
   - First-visit intro overlay: the pain-point questions with live numbers,
     "nobody types anything in here," and (if branded with a real name) an
     explicit synthetic-data line. localStorage show-once + a sidebar button
     to reopen it.
   - Every screen leads with a one-sentence takeaway with the key number.
   - Default views show the exceptions (the flagged few), not the full table;
     accountant-grade tables collapse behind a toggle; long lists truncate.
   - A "next question →" bar walks the screens in order.
   - Make it clickable: expandable rows (chevrons), drill-ins, demo-action
     modals (e.g. draft invoice), clickable chart elements. Sticky mobile tab
     strip below 820px — cold links get opened on phones.
4. **Verify.** `next build` (needs `.env.local`), then Playwright with the
   Chromium at `/opt/pw-browsers/chromium`, serving the fixtures JSON via
   `page.route('**supabase.co/**', ...)` — the sandbox cannot reach Supabase.
   Screenshot every screen at 1440px and one phone viewport; actually look at
   them and fix what reads wrong (empty blocks, implausible totals, weak
   opening numbers).
5. **Ship.** Add the gallery entry to `EXISTING_DEMOS` in
   `lib/industryDemos.js`. Commit to the working branch, open a PR to `main`,
   and merge only when the user has asked for it to be live — merging deploys
   production via Vercel.

## Data realism checks (the ones that bit last time)

- Revenue vs. AR: DSO ≈ AR / (annual revenue / 365). 70–90 reads as painful;
  120+ reads as fake.
- Profitability at industry-plausible margins, not software-company margins.
- If the pitch claims a footprint/mix ("multi-state," "recurring base"), the
  data must actually show it at believable weight.
- Every liability/action block on every screen must be non-empty.
- The opening screen's headline number must be big enough to matter — engineer
  a few large, in-progress problems, not just small or already-closed ones.

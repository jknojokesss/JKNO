# JK No Jokes — Accounting Portal
## Setup Guide (Read This First)

---

## What You're Getting
A full client-facing accounting portal with:
- Google login for clients
- Dashboard with revenue/expense/profit charts
- P&L with drill-down into every line item
- Balance Sheet
- Built to deploy on Vercel

---

## Step 1 — Set Up Supabase (Your Database, Free)

1. Go to **supabase.com** and create a free account
2. Click **New Project** — name it "jk-accounting"
3. Once created, go to **SQL Editor** in the left sidebar
4. Copy everything from `supabase-setup.sql` and run it
5. Go to **Project Settings → API**
6. Copy your **Project URL** and **anon/public key** — you'll need these next

### Enable Google Login in Supabase:
1. Go to **Authentication → Providers → Google**
2. Toggle it ON
3. You'll need a Google OAuth Client ID and Secret — get these at console.cloud.google.com
   - Create a project → Credentials → OAuth 2.0 Client ID
   - Set authorized redirect URI to: `https://[your-supabase-project].supabase.co/auth/v1/callback`
4. Paste the Client ID and Secret into Supabase

---

## Step 2 — Deploy to Vercel

1. Go to **github.com** and create a new repository called "jk-accounting"
2. Upload all these files to it
3. Go to **vercel.com** → New Project → Import from GitHub
4. Select your repo
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Hit Deploy

---

## Step 3 — Add Your First Client

In Supabase, go to **Table Editor → clients** and add a row:
- `email`: the client's Google email address
- `name`: their business name
- `logo_url`: (optional) link to their logo image

That's it — when they visit your site and log in with that Google account, they'll see their dashboard.

---

## Step 4 — Point jknojokes.com to Vercel

Same process as the Saratoga site:
1. In Vercel, go to your project → Settings → Domains
2. Add `jknojokes.com` and `www.jknojokes.com`
3. Vercel will give you DNS records to add in Squarespace
4. Add them and wait 30 min

---

## What's Next (Future Builds)
- [ ] Transaction entry page (you enter journal entries)
- [ ] CSV bank import with AI categorization
- [ ] Cash flow statement
- [ ] Admin panel for you to manage all clients
- [ ] Document upload section

---

## Maintenance — Adding a Weldon Restock to the Stock Page

The **Stock** page (`pages/stock.js`) computes on-hand live from Clover sales,
but the **purchases** are a fixed list of cost layers near the top of the file
(`const LAYERS = [...]`). On-hand = layers − returns − sales (time-aware FIFO),
so it ties to the books to the dollar. When Reydel does a new Weldon stock-up,
add the new tires to that list — it's a 30-second edit.

**For each line on the Weldon invoice, add one entry to `LAYERS`:**

```js
{ "s": "235/60/17", "l": "235/60/17", "q": 10, "c": 65, "d": "2026-06-20" },
```

| key | meaning |
|-----|---------|
| `s` | bare size `NNN/NN/NN` (no brand) — this is what sales match against |
| `l` | display label — add the brand if premium, e.g. `"235/60/17 Cooper"` |
| `q` | quantity on that invoice line |
| `c` | unit cost (what Weldon charged per tire) |
| `d` | date the stock arrived, `YYYY-MM-DD` — sales before this date won't draw from it |

**Returns to Weldon** go in the `RETURNS = [...]` list right below, same idea
but no date: `{ "s": "285/45/22", "q": 4, "c": 105 }`.

**Two rules that keep it tying to QuickBooks:**
1. The total of every `q × c` you add to `LAYERS` must equal what hit the
   **Inventory Asset** account in QB for that stock-up.
2. After editing, bump `AS_OF` (also near the top) if you want the page to count
   sales through a later date.

That's it — commit, push, Vercel redeploys. No database changes needed.

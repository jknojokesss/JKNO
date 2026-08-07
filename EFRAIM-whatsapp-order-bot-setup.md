# Jerky Munch — WhatsApp Order Bot: what I need from you

Here's how the auto order-taker will work: a customer WhatsApps you an order → it
automatically shows up in Shopify as a **draft order** with the items, quantities,
name and address already filled in → you glance at it and hit send to invoice them.
No copy-pasting. You stay in control (you approve every draft before it goes out),
so a misread never bills anyone the wrong thing.

I've already built the engine. To flip it on, I need three things from you. #1 and
#2 take a little time on Meta's side, so start those first.

---

## 1. A dedicated WhatsApp number for orders

The bot needs its **own** WhatsApp number — one connected to the business system,
not the normal WhatsApp app. Two options:

- **New number (recommended):** get a fresh number just for orders. Cleanest, and
  your personal WhatsApp stays untouched.
- **Move your current business number:** possible, but that number **leaves the
  regular WhatsApp app** once it's connected — you'd only see its messages through
  the system, not the normal app. Most people don't want that. Only do this if
  customers already text orders to that exact number and you don't want to change it.

**What to do:** decide which, and tell me the number.

## 2. Meta (Facebook) Business verification

WhatsApp's business API runs through Meta, and Meta requires the business to be
verified. This is the part that can take a few days to ~2 weeks, so kick it off now.

**What to do:**
- Go to **business.facebook.com** and make sure Jerky Munch has a Business account
  (create one if not).
- Start **Business Verification** in Settings → Business Info.
- Have ready: business legal name, address, phone, and a document that proves the
  business exists (business license, utility bill, bank statement, or incorporation
  paperwork — anything official with the business name + address).
- Submit it and let me know once it's approved.

*(I'll handle connecting the number to the system and the technical WhatsApp setup
once verification is through — you don't need to touch that part.)*

## 3. Shopify access (so it can create the draft orders)

I need a Shopify "app token" so the bot can drop draft orders into your store.

**What to do in Shopify admin:**
1. **Settings → Apps and sales channels → Develop apps** (turn on custom app
   development if it asks).
2. **Create an app** — name it anything, e.g. "Order Bot".
3. Open **Configuration → Admin API integration → Configure**, and turn on these
   scopes:
   - `write_draft_orders`
   - `read_products`
   - `read_customers`
   - `write_customers`
4. **Save**, then **Install app**.
5. Copy the **Admin API access token** (starts with `shpat_...`) — it's shown once.
6. Also grab your store domain (the `something.myshopify.com` one).

**Send me the token + the store domain.** (Send the token privately — treat it like
a password.)

---

That's it. Start #1 and #2 today since Meta takes the longest; #3 is 5 minutes
whenever. As soon as I have all three, I'll switch it live and we'll test it with a
real order.

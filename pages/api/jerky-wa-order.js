// ============================================================
//  Jerky Munch — WhatsApp -> Shopify draft-order engine
//  Webhook URL (prod): https://jknojokes.com/api/jerky-wa-order
//
//  A customer WhatsApps an order -> this route parses the free
//  text with Claude, matches items to the Shopify catalog, and
//  creates a Shopify DRAFT ORDER pre-filled with everything.
//  Efraim reviews the draft and sends the invoice himself
//  (draft = human-in-the-loop, so a misread never bills a customer).
//
//  No auto-reply to the customer — this only builds the draft.
//
//  Required env vars (Vercel, JKNO project):
//    ANTHROPIC_API_KEY      - JK's Anthropic API key
//    JERKY_SHOPIFY_DOMAIN   - e.g. jerky-munch.myshopify.com
//    JERKY_SHOPIFY_TOKEN    - Shopify Admin API access token (shpat_...)
//    JERKY_WA_VERIFY_TOKEN  - any string; must match what Efraim
//                             enters in the Meta webhook config
//
//  Test locally with a simulated payload (no real number needed):
//    POST this route a body shaped like the WhatsApp Cloud API
//    webhook (see SAMPLE_PAYLOAD at the bottom of this file).
// ============================================================

const SHOPIFY_API_VERSION = '2025-01'
// Opus 5 is the default per house policy. For a cheaper high-volume
// parser, swap to 'claude-haiku-4-5' (parsing is simple; Haiku is plenty).
const PARSE_MODEL = 'claude-opus-5'

// ---- Shopify: pull the product catalog (for matching) ------
async function fetchShopifyCatalog() {
  const domain = process.env.JERKY_SHOPIFY_DOMAIN
  const token = process.env.JERKY_SHOPIFY_TOKEN
  if (!domain || !token) throw new Error('Shopify env vars not set')

  const url = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250&fields=id,title,variants`
  const r = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
  })
  if (!r.ok) throw new Error(`Shopify products fetch failed: ${r.status} ${await r.text()}`)
  const { products = [] } = await r.json()

  // Flatten to a simple variant list Claude can match against.
  const variants = []
  for (const p of products) {
    for (const v of p.variants || []) {
      const variantName = v.title && v.title !== 'Default Title' ? ` - ${v.title}` : ''
      variants.push({
        variant_id: v.id,
        label: `${p.title}${variantName}`,
        price: v.price,
        sku: v.sku || '',
      })
    }
  }
  return variants
}

// ---- Claude: parse free text -> structured order -----------
async function parseOrder(text, variants, profileName) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY not set')

  const catalog = variants
    .map((v) => `- variant_id ${v.variant_id} | ${v.label} | $${v.price}${v.sku ? ` | sku ${v.sku}` : ''}`)
    .join('\n')

  const system =
    'You turn a customer\'s free-text WhatsApp message into a structured order for Jerky Munch. ' +
    'Match each requested item to the closest variant_id in the catalog. ' +
    'If an item clearly is not in the catalog, still include it with matched_variant_id null so a human can decide. ' +
    'Only include real order lines — ignore greetings, thank-yous, and chit-chat. ' +
    'Never invent items the customer did not ask for.'

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      is_order: { type: 'boolean' },
      customer_name: { type: 'string' },
      shipping_address: { type: 'string' },
      notes: { type: 'string' },
      line_items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            matched_variant_id: { type: ['integer', 'null'] },
            item_text: { type: 'string' },
            quantity: { type: 'integer' },
          },
          required: ['matched_variant_id', 'item_text', 'quantity'],
        },
      },
    },
    required: ['is_order', 'customer_name', 'shipping_address', 'notes', 'line_items'],
  }

  const userMsg =
    `Catalog:\n${catalog || '(catalog unavailable)'}\n\n` +
    `WhatsApp sender name: ${profileName || '(unknown)'}\n` +
    `Message:\n"""${text}"""`

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: PARSE_MODEL,
      max_tokens: 1500,
      system,
      output_config: { format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: userMsg }],
    }),
  })
  if (!r.ok) throw new Error(`Claude parse failed: ${r.status} ${await r.text()}`)

  const data = await r.json()
  if (data.stop_reason === 'refusal') throw new Error('Claude refused the parse request')
  const textBlock = (data.content || []).find((b) => b.type === 'text')
  if (!textBlock) throw new Error('Claude returned no text block')
  return JSON.parse(textBlock.text)
}

// ---- Shopify: create the pre-filled draft order ------------
async function createDraftOrder(order, variants, fromPhone, profileName, rawText) {
  const domain = process.env.JERKY_SHOPIFY_DOMAIN
  const token = process.env.JERKY_SHOPIFY_TOKEN

  const priceByVariant = {}
  for (const v of variants) priceByVariant[String(v.variant_id)] = { price: v.price, label: v.label }

  const line_items = (order.line_items || []).map((li) => {
    const qty = li.quantity && li.quantity > 0 ? li.quantity : 1
    if (li.matched_variant_id && priceByVariant[String(li.matched_variant_id)]) {
      // Matched to catalog: let Shopify pull the real title + price.
      return { variant_id: li.matched_variant_id, quantity: qty }
    }
    // Unmatched: custom line, $0, flagged for Efraim to price.
    return { title: `[VERIFY] ${li.item_text}`, quantity: qty, price: '0.00' }
  })

  if (line_items.length === 0) {
    return { skipped: true, reason: 'no line items parsed' }
  }

  const noteParts = [
    'Auto-created from a WhatsApp order.',
    profileName ? `Sender: ${profileName}` : null,
    fromPhone ? `WhatsApp #: ${fromPhone}` : null,
    order.customer_name ? `Customer: ${order.customer_name}` : null,
    order.shipping_address ? `Address: ${order.shipping_address}` : null,
    order.notes ? `Notes: ${order.notes}` : null,
    '',
    'Original message:',
    rawText,
  ].filter(Boolean)

  const draft = {
    draft_order: {
      line_items,
      note: noteParts.join('\n'),
      tags: 'whatsapp-bot',
    },
  }

  const url = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/draft_orders.json`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  if (!r.ok) throw new Error(`Shopify draft create failed: ${r.status} ${await r.text()}`)
  const { draft_order } = await r.json()
  return { draft_order_id: draft_order?.id, name: draft_order?.name }
}

// ---- Extract the inbound message from a Cloud API payload ---
function extractMessage(body) {
  const value = body?.entry?.[0]?.changes?.[0]?.value
  const msg = value?.messages?.[0]
  if (!msg) return null
  const profileName = value?.contacts?.[0]?.profile?.name || ''
  const text = msg.type === 'text' ? msg.text?.body || '' : ''
  return { type: msg.type, text, fromPhone: msg.from || '', profileName }
}

// ============================================================
export default async function handler(req, res) {
  // --- Meta webhook verification handshake (GET) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
    const verifyToken = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    if (mode === 'subscribe' && verifyToken && verifyToken === process.env.JERKY_WA_VERIFY_TOKEN) {
      return res.status(200).send(challenge)
    }
    return res.status(403).end()
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const msg = extractMessage(req.body)

    // Ack anything that isn't a text message (status callbacks, etc.)
    // Always 200 to Meta so it doesn't retry-storm.
    if (!msg || msg.type !== 'text' || !msg.text.trim()) {
      return res.status(200).json({ ok: true, skipped: 'no text message' })
    }

    const variants = await fetchShopifyCatalog()
    const order = await parseOrder(msg.text, variants, msg.profileName)

    if (!order.is_order || !(order.line_items || []).length) {
      return res.status(200).json({ ok: true, skipped: 'not an order' })
    }

    const result = await createDraftOrder(order, variants, msg.fromPhone, msg.profileName, msg.text)
    return res.status(200).json({ ok: true, ...result })
  } catch (e) {
    // Log for debugging; still 200 so Meta doesn't hammer retries.
    console.error('jerky-wa-order error:', e)
    return res.status(200).json({ ok: false, error: String(e.message || e) })
  }
}

// ============================================================
//  SAMPLE_PAYLOAD — shape of a WhatsApp Cloud API inbound text.
//  Use this to test locally before the real number exists:
//
//  curl -X POST http://localhost:3210/api/jerky-wa-order \
//    -H 'Content-Type: application/json' \
//    -d '{"entry":[{"changes":[{"value":{
//      "contacts":[{"profile":{"name":"Moshe"}}],
//      "messages":[{"from":"17325551234","type":"text",
//        "text":{"body":"Hi, can I get 3 bags of teriyaki and 2 original"}}]
//    }}]}]}'
// ============================================================

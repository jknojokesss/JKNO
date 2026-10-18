/**
 * One-shot geography / real-name sanitizer for the six public sample pages.
 * Run: node scripts/sanitize-sample-geography.mjs
 */
import fs from 'fs'
import path from 'path'

const root = path.resolve(import.meta.dirname, '..')

const CLOSEOUT_BUYERS = [
  ['Hudson Valley Discount Grocers', 'Valley Discount Grocers'],
  ['Tri-State Bargain Outlet', 'Bargain Outlet Stores'],
  ['Keystone Surplus Distributors', 'Summit Surplus Distributors'],
  ['Garden State Quick Mart', 'Corner Quick Mart'],
]

const PRIMAL_REGION_MAP = {
  Brooklyn: 'North',
  'Five Towns, NY': 'South',
  'North NJ': 'East',
  'Rockland, NY': 'West',
  'Ocean & Monmouth, NJ': 'Central',
  'Manhattan & Bronx': 'Area 6',
  Queens: 'Area 7',
}

const STORE_RENAMES = [
  [/Bais Hamakolet/g, 'Bais Hamazon'],
  [/Brocha Supermarket/g, 'Brocha Foods'],
  [/Kesher Foods/g, 'Kesher Market'],
  [/Golden Basket Kosher/g, 'Golden Kosher'],
]

function stripStoreSuffix(name) {
  let n = name
  for (const [re, rep] of STORE_RENAMES) n = n.replace(re, rep)
  const dash = n.indexOf(' - ')
  if (dash > 0) n = n.slice(0, dash).trim()
  return n
}

function replaceAll(text, pairs) {
  let out = text
  for (const [from, to] of pairs) out = out.split(from).join(to)
  return out
}

function sanitizeMrDipz() {
  const file = path.join(root, 'components/samples/mrDipz/mrDipzData.js')
  let text = fs.readFileSync(file, 'utf8')
  const areaNames = {
    monsey: 'North',
    brooklyn: 'South',
    queens: 'East',
    'five-towns': 'West',
    southfield: 'Central',
    boca: 'Out of state',
  }
  text = text.replace(
    /export const AREAS = \[.*?\];/,
    `export const AREAS = ${JSON.stringify(
      Object.entries(areaNames).map(([id, name]) => ({ id, name })),
    )};`,
  )
  const storesMatch = text.match(/export const STORES = (\[.*?\]);/)
  if (!storesMatch) throw new Error('STORES not found')
  const stores = JSON.parse(storesMatch[1])
  const seen = new Map()
  for (const s of stores) {
    let name = stripStoreSuffix(s.name)
    if (seen.has(name)) {
      const alt = `${name} II`
      name = seen.has(alt) ? `${name} East` : alt
    }
    seen.set(name, true)
    s.name = name
  }
  text = text.replace(/export const STORES = \[.*?\];/, `export const STORES = ${JSON.stringify(stores)};`)
  text = text.replace(/Freight to Michigan and Florida/g, 'Out of state freight')
  text = text.replace(/Freight carrier, Michigan/g, 'Freight carrier, out of state')
  text = text.replace(/Freight carrier, Florida/g, 'Freight carrier, out of state')
  fs.writeFileSync(file, text)
}

function sanitizeAufschnitt() {
  for (const rel of ['components/samples/aufschnitt/aufschnittCatalog.js', 'components/samples/aufschnitt/aufschnittData.js']) {
    const file = path.join(root, rel)
    let text = fs.readFileSync(file, 'utf8')
    text = text.replace(/\/\*\* Relative store size[^*]*\*\//, '/** Relative store size for Stores channel splits. */')
    text = text.replace(/largest distributors \/ Lakewood/g, 'largest distributors')
    const names = []
    const nameRe = /'([^']+ - [^']+)'|"([^"]+ - [^"]+)"/g
    let m
    while ((m = nameRe.exec(text))) {
      const raw = m[1] || m[2]
      if (raw.includes(' - ')) names.push(raw)
    }
    const uniq = [...new Set(names)]
    const mapping = new Map()
    const used = new Set()
    for (const raw of uniq) {
      let base = stripStoreSuffix(raw)
      if (used.has(base)) base = `${base} II`
      used.add(base)
      mapping.set(raw, base)
    }
    for (const [from, to] of mapping) {
      text = text.split(from).join(to)
    }
    fs.writeFileSync(file, text)
  }
}

function sanitizePopinsanity() {
  const file = path.join(root, 'components/samples/popinsanity/popinsanityComputed.js')
  let text = fs.readFileSync(file, 'utf8')
  text = text.replace(/'Shop \(Monsey\)'/g, "'Shop'")
  fs.writeFileSync(file, text)
}

function sanitizeCloseout() {
  const dataFile = path.join(root, 'components/samples/closeoutExplosion/closeoutExplosionData.js')
  let text = fs.readFileSync(dataFile, 'utf8')
  text = replaceAll(text, CLOSEOUT_BUYERS)
  fs.writeFileSync(dataFile, text)
  const lotsDir = path.join(root, 'components/samples/closeoutExplosion/lots')
  for (const f of fs.readdirSync(lotsDir)) {
    if (!f.endsWith('.json')) continue
    const p = path.join(lotsDir, f)
    let j = fs.readFileSync(p, 'utf8')
    j = replaceAll(j, CLOSEOUT_BUYERS)
    fs.writeFileSync(p, j)
  }
}

function walkReplaceStrings(obj, fn) {
  if (typeof obj === 'string') return fn(obj)
  if (Array.isArray(obj)) return obj.map((x) => walkReplaceStrings(x, fn))
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(obj)) out[k] = walkReplaceStrings(v, fn)
    return out
  }
  return obj
}

function sanitizePrimalJson() {
  const file = path.join(root, 'data/primal-krisp.json')
  let data = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (data.stores?.by_region) {
    const next = {}
    for (const [k, v] of Object.entries(data.stores.by_region)) {
      const nk = PRIMAL_REGION_MAP[k] || k
      next[nk] = (next[nk] || 0) + v
    }
    data.stores.by_region = next
  }
  const subLabel = 'Subscribe & save: 6% off, free shipping'
  data.subscription_terms_real = subLabel
  if (data.real_terms) data.real_terms = subLabel

  const geoCityMap = {
    Brooklyn: 'North',
    Bronx: 'Area 6',
    Queens: 'Area 7',
    Lakewood: 'East',
    Monsey: 'West',
    Deal: 'South',
    'Silver Spring': 'Central',
    Lawrence: 'South',
    Cedarhurst: 'South',
    Woodmere: 'South',
    'Boca Raton': 'Out of state',
    'Boro Park': 'North',
    Flatbush: 'North',
    Teaneck: 'East',
  }

  data = walkReplaceStrings(data, (s) => {
    let t = s
    for (const [from, to] of Object.entries(PRIMAL_REGION_MAP)) t = t.split(from).join(to)
    for (const [from, to] of Object.entries(geoCityMap)) t = t.split(from).join(to)
    for (const [re, rep] of STORE_RENAMES) t = t.replace(re, rep)
    t = t.replace(/primalkrisp\.com/gi, 'sample-brand.example')
    t = t.replace(/\(real, from [^)]+\)/gi, '')
    t = t.replace(/Real, from [^.,]+[.,]?/gi, '')
    if (/\s-\s/.test(t) && /Market|Kosher|Foods|Glatt|Fresh|Hamazon|Hamakolet/i.test(t)) {
      t = stripStoreSuffix(t)
    }
    return t
  })

  if (Array.isArray(data.stores?.list)) {
    const used = new Set()
    for (const st of data.stores.list) {
      if (st.name) {
        let n = stripStoreSuffix(st.name)
        if (used.has(n)) n = `${n} II`
        used.add(n)
        st.name = n
      }
      if (st.region && PRIMAL_REGION_MAP[st.region]) st.region = PRIMAL_REGION_MAP[st.region]
      if (st.city && geoCityMap[st.city]) st.city = geoCityMap[st.city]
      else if (st.city && /[A-Z]/.test(st.city)) st.city = st.region || 'North'
    }
  }

  let text = JSON.stringify(data, null, 1) + '\n'
  const banned = ['Brooklyn', 'Monsey', 'Lakewood', 'Flatbush', 'Boro Park', 'Five Towns', 'primalkrisp.com']
  for (const b of banned) {
    if (text.includes(b)) text = text.split(b).join('North')
  }
  fs.writeFileSync(file, text)
}

const only = process.argv[2]
if (!only || only === 'mr-dipz') sanitizeMrDipz()
if (!only || only === 'aufschnitt') sanitizeAufschnitt()
if (!only || only === 'popinsanity') sanitizePopinsanity()
if (!only || only === 'closeout') sanitizeCloseout()
if (!only || only === 'primal') sanitizePrimalJson()
console.log('sanitize-sample-geography: done')

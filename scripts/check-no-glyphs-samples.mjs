/**
 * Fail if prospect sample UI sources include banned glyphs or strings.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const scanRoots = [
  'pages/aufschnitt.js',
  'pages/mr-dipz.js',
  'pages/popinsanity.js',
  'pages/primal-krisp.js',
  'pages/riverside-tires.js',
  'pages/closeout-explosion.js',
  'components/samples/aufschnitt',
  'components/samples/mrDipz',
  'components/samples/popinsanity',
  'components/samples/primal-krisp',
  'components/samples/PrimalKrispPortal.js',
  'components/samples/PrimalKrispFinancials.js',
  'components/samples/PrimalKrispStoresTab.js',
  'components/samples/riverside',
  'components/samples/closeoutExplosion',
  'components/samples/SampleJkLogoLink.js',
]

const glyphRe = /[›»‹«→←↑↓▲▼▾▸⇄↗✓✔…]/
const ellipsisCssRe = /text-overflow\s*:\s*ellipsis/
const closeIconRe = />\s*×\s*</
const banned = ['Owings Mills', 'Abraham', 'Essiccata']

function walk(entry, out) {
  const abs = path.join(root, entry)
  if (!fs.existsSync(abs)) return
  const st = fs.statSync(abs)
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(abs)) {
      if (name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.mjs')) walk(path.join(entry, name), out)
    }
    return
  }
  out.push(abs)
}

const isUiSource = (rel) => rel.endsWith('.js') || rel.endsWith('.jsx')

const files = []
for (const r of scanRoots) walk(r, files)

const failures = []
for (const file of files) {
  const rel = path.relative(root, file)
  const text = fs.readFileSync(file, 'utf8')
  if (glyphRe.test(text)) failures.push(`${rel}: banned glyph`)
  if (isUiSource(rel) && ellipsisCssRe.test(text)) failures.push(`${rel}: text-overflow ellipsis`)
  if (closeIconRe.test(text)) failures.push(`${rel}: close icon × in markup`)
  for (const m of text.matchAll(/content\s*:\s*(['"])(.*?)\1/g)) {
    const body = m[2]
    if (!body || body === '') continue
    if (glyphRe.test(body)) failures.push(`${rel}: banned glyph in CSS content "${body}"`)
  }
  if (isUiSource(rel)) {
    for (const b of banned) {
      if (text.includes(b)) failures.push(`${rel}: contains "${b}"`)
    }
  }
}

if (failures.length) {
  console.error('check-no-glyphs-samples FAILED:\n' + failures.join('\n'))
  process.exit(1)
}
console.log('check-no-glyphs-samples: ok')

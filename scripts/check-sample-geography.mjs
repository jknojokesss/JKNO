/**
 * Fail only on real-site leakage and the one retained closeout rename guard.
 */
import fs from 'fs'
import path from 'path'

const root = path.resolve(import.meta.dirname, '..')

const BANNED = ['primalkrisp.com', 'real, from', 'Tri-State']

const FILES = [
  'pages/mr-dipz.js',
  'pages/primal-krisp.js',
  'pages/popinsanity.js',
  'pages/closeout-explosion.js',
  'pages/aufschnitt.js',
  'pages/riverside-tires.js',
  'data/primal-krisp.json',
  'components/samples/mrDipz',
  'components/samples/popinsanity',
  'components/samples/closeoutExplosion',
  'components/samples/aufschnitt',
  'components/samples/riverside',
  'components/samples/PrimalKrispPortal.js',
  'components/samples/PrimalKrispOverviewDetail.js',
  'components/samples/PrimalKrispOverview.js',
  'components/samples/PrimalKrispFinancials.js',
  'components/samples/primalKrispUtils.js',
  'components/samples/primal-krisp',
]

function collectFiles(rel) {
  const abs = path.join(root, rel)
  if (!fs.existsSync(abs)) return []
  const st = fs.statSync(abs)
  if (st.isFile()) return [abs]
  const out = []
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue
    const p = path.join(abs, ent.name)
    if (ent.isDirectory()) out.push(...collectFiles(path.relative(root, p)))
    else if (/\.(js|json|tsx?)$/.test(ent.name)) out.push(p)
  }
  return out
}

const failures = []
for (const rel of FILES) {
  for (const file of collectFiles(rel)) {
    const text = fs.readFileSync(file, 'utf8')
    for (const term of BANNED) {
      if (text.includes(term)) failures.push(`${path.relative(root, file)}: contains "${term}"`)
    }
  }
}

if (failures.length) {
  console.error('check-sample-geography FAILED:\n' + failures.join('\n'))
  process.exit(1)
}
console.log('check-sample-geography OK')

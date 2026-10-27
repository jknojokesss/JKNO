/**
 * Regenerate demo product WebPs — generic shot-glass art, 400×400, <30 KB each.
 */
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const OUT = path.join(process.cwd(), 'public/amazon-demo/img')
const SIZE = 400

const SKUS = {
  'MSG-HEAVY-6': {
    bg: '#E8ECF0',
    liquid: '#C45A2E',
    glass: '#6B7280',
    accent: '#374151',
    kind: 'heavy',
  },
  'MSG-ETCH-12': {
    bg: '#EDE8E0',
    liquid: '#8B4513',
    glass: '#9CA3AF',
    accent: '#57534E',
    kind: 'etched',
  },
  'MSG-CRYST-4': {
    bg: '#E6F0FA',
    liquid: '#38BDF8',
    glass: '#94A3B8',
    accent: '#0EA5E9',
    kind: 'crystal',
  },
  'MSG-STATE-50': {
    bg: '#F0EDE6',
    liquid: '#DC2626',
    glass: '#78716C',
    accent: '#2563EB',
    kind: 'state',
  },
  'MSG-GOLD-2': {
    bg: '#F5F0E4',
    liquid: '#D97706',
    glass: '#A8A29E',
    accent: '#CA8A04',
    kind: 'gold',
  },
  'MSG-MINI-6': {
    bg: '#EEF2FF',
    liquid: '#6366F1',
    glass: '#64748B',
    accent: '#4338CA',
    kind: 'mini',
  },
  'MSG-TALL-4': {
    bg: '#ECFDF5',
    liquid: '#059669',
    glass: '#6B7280',
    accent: '#047857',
    kind: 'tall',
  },
  'MSG-DBL-2': {
    bg: '#F0F9FF',
    liquid: '#0284C7',
    glass: '#64748B',
    accent: '#0369A1',
    kind: 'double',
  },
  'MSG-GIFT-4': {
    bg: '#FDF2F8',
    liquid: '#DB2777',
    glass: '#9CA3AF',
    accent: '#BE185D',
    kind: 'gift',
  },
  'MSG-RACK-24': {
    bg: '#F5F5F4',
    liquid: '#78716C',
    glass: '#57534E',
    accent: '#92400E',
    kind: 'rack',
  },
}

function glassPath(kind, i, n) {
  const cx = 200
  const spread = n === 1 ? 0 : n === 2 ? 70 : n <= 4 ? 55 : 38
  const x = cx + (i - (n - 1) / 2) * spread
  const h = kind === 'tall' ? 130 : kind === 'mini' ? 72 : kind === 'heavy' ? 105 : 95
  const w = kind === 'mini' ? 36 : kind === 'tall' ? 44 : 48
  const y = 280 - h
  const rim = w + 8
  return { x, y, w, h, rim }
}

function svgFor(sku, cfg) {
  const { bg, liquid, glass, accent, kind } = cfg
  let inner = ''
  const count =
    kind === 'state'
      ? 5
      : kind === 'mini'
        ? 6
        : kind === 'rack'
          ? 4
          : kind === 'gift'
            ? 2
            : kind === 'etched'
              ? 3
              : kind === 'crystal'
                ? 2
                : 2

  if (kind === 'rack') {
    inner += `<rect x="72" y="248" width="256" height="14" rx="4" fill="${accent}" opacity="0.85"/>
<rect x="88" y="262" width="224" height="8" rx="2" fill="#78350F"/>`
  }
  if (kind === 'gift') {
    inner += `<rect x="118" y="118" width="164" height="120" rx="10" fill="${accent}" opacity="0.25"/>
<rect x="118" y="168" width="164" height="12" fill="${accent}" opacity="0.5"/>
<rect x="192" y="118" width="16" height="120" fill="${accent}" opacity="0.45"/>`
  }

  for (let i = 0; i < count; i++) {
    const g = glassPath(kind, i, count)
    const { x, y, w, h, rim } = g
    const lx = x - w / 2
    const ly = y + h * 0.35
    const lh = h * 0.55
    inner += `<ellipse cx="${x}" cy="${y}" rx="${rim / 2}" ry="7" fill="${glass}" opacity="0.95"/>
<path d="M ${lx} ${y} L ${lx + 4} ${y + h} L ${lx + w - 4} ${y + h} L ${lx + w} ${y} Z" fill="${glass}" opacity="0.55"/>
<rect x="${lx + 6}" y="${ly}" width="${w - 12}" height="${lh}" rx="3" fill="${liquid}" opacity="0.92"/>
<ellipse cx="${x}" cy="${ly}" rx="${(w - 12) / 2}" ry="5" fill="${liquid}" opacity="0.75"/>`
    if (kind === 'gold') {
      inner += `<ellipse cx="${x}" cy="${y + 2}" rx="${rim / 2 - 2}" ry="4" fill="none" stroke="${accent}" stroke-width="3"/>`
    }
    if (kind === 'double') {
      inner += `<path d="M ${lx + 2} ${y + 8} L ${lx + 6} ${y + h - 6} L ${lx + w - 6} ${y + h - 6} L ${lx + w - 2} ${y + 8} Z" fill="none" stroke="${accent}" stroke-width="2" opacity="0.7"/>`
    }
    if (kind === 'etched') {
      inner += `<path d="M ${x - 8} ${y + 20} Q ${x} ${y + 35} ${x + 8} ${y + 20}" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.5"/>
<path d="M ${x - 10} ${y + 45} L ${x + 10} ${y + 45}" stroke="#fff" stroke-width="1.2" opacity="0.45"/>`
    }
    if (kind === 'crystal') {
      inner += `<path d="M ${lx + 8} ${y + 12} L ${x} ${y + h - 8} L ${lx + w - 8} ${y + 12} Z" fill="#fff" opacity="0.18"/>`
    }
    if (kind === 'heavy') {
      inner += `<ellipse cx="${x}" cy="${y + h - 4}" rx="${w / 2 + 4}" ry="8" fill="${accent}" opacity="0.85"/>`
    }
    if (kind === 'state') {
      const colors = ['#DC2626', '#2563EB', '#16A34A', '#CA8A04', '#7C3AED']
      inner += `<rect x="${lx + 8}" y="${ly + 8}" width="${w - 16}" height="${lh * 0.35}" rx="2" fill="${colors[i % colors.length]}" opacity="0.55"/>`
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
<rect width="100%" height="100%" fill="${bg}"/>
${inner}
</svg>`
}

async function main() {
  await mkdir(OUT, { recursive: true })
  for (const [sku, cfg] of Object.entries(SKUS)) {
    const svg = svgFor(sku, cfg)
    const buf = await sharp(Buffer.from(svg)).webp({ quality: 82, effort: 4 }).toBuffer()
    if (buf.length > 30 * 1024) {
      const smaller = await sharp(Buffer.from(svg)).webp({ quality: 72, effort: 6 }).toBuffer()
      await writeFile(path.join(OUT, `${sku}.webp`), smaller)
      console.log(`${sku}.webp ${smaller.length} bytes (recompressed)`)
    } else {
      await writeFile(path.join(OUT, `${sku}.webp`), buf)
      console.log(`${sku}.webp ${buf.length} bytes`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

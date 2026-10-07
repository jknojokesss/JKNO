import { ALL_DEMOS } from './industryDemos'

/** @param {string} href */
export function getSamplePortal(href) {
  const row = ALL_DEMOS.find((d) => d.href === href)
  if (row) {
    return { href: row.href, name: row.biz, industry: row.industry }
  }
  return { href, name: 'Sample portal', industry: '' }
}

/** Homepage hero — fixed trio */
export const HERO_SAMPLE_BARS = [
  getSamplePortal('/demo'),
  getSamplePortal('/riverstone-roofing'),
  getSamplePortal('/northline-global'),
]

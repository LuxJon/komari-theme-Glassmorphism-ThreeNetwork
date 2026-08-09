import type { NodeData } from '@/stores/nodes'
import { getCountryCodeFromRegion } from '@/utils/geoHelper'
import { getRegionByAlias } from '@/utils/regionHelper'

export const HOME_ALL_REGION = '__all__'

export interface HomeRegionOption {
  code: string
  count: number
}

// Keep the same geographic priority used by LuminaPlus. Countries outside the
// priority list are still discovered automatically; Europe precedes other areas.
const REGION_PRIORITY = ['CN', 'HK', 'MO', 'TW', 'SG', 'JP', 'US']

const EUROPE_CODES = new Set([
  'EU',
  'GB',
  'IE',
  'FR',
  'DE',
  'NL',
  'BE',
  'LU',
  'CH',
  'AT',
  'IT',
  'ES',
  'PT',
  'SE',
  'NO',
  'FI',
  'DK',
  'IS',
  'PL',
  'CZ',
  'SK',
  'HU',
  'RO',
  'BG',
  'GR',
  'HR',
  'SI',
  'RS',
  'BA',
  'ME',
  'MK',
  'AL',
  'LT',
  'LV',
  'EE',
  'UA',
  'MD',
  'BY',
  'RU',
  'TR',
  'CY',
  'MT',
  'LI',
  'MC',
  'AD',
  'SM',
  'VA',
  'GE',
  'AM',
  'AZ',
])

function getRegionRank(code: string): number {
  const priorityIndex = REGION_PRIORITY.indexOf(code)
  if (priorityIndex !== -1)
    return priorityIndex
  return EUROPE_CODES.has(code) ? REGION_PRIORITY.length : REGION_PRIORITY.length + 1
}

export function getHomeNodeRegionCode(node: NodeData): string {
  return getRegionByAlias(node.region)?.code ?? getCountryCodeFromRegion(node.region) ?? 'UN'
}

export function getHomeRegionOptions(nodes: NodeData[]): HomeRegionOption[] {
  const counts = new Map<string, number>()
  for (const node of nodes) {
    const code = getHomeNodeRegionCode(node)
    counts.set(code, (counts.get(code) ?? 0) + 1)
  }

  return Array.from(counts, ([code, count]) => ({ code, count })).sort((a, b) =>
    getRegionRank(a.code) - getRegionRank(b.code)
    || b.count - a.count
    || a.code.localeCompare(b.code),
  )
}

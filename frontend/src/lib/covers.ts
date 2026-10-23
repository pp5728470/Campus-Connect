/** The six notebook cover colours from docs/design/CampusConnect-UI-Design.html. */
export const COVER_COLORS = [
  { id: 'teal', hex: '#0E6B66', label: 'Teal', className: 'nb-c-teal' },
  { id: 'maroon', hex: '#86293F', label: 'Maroon', className: 'nb-c-maroon' },
  { id: 'forest', hex: '#2F6A3B', label: 'Forest', className: 'nb-c-forest' },
  { id: 'indigo', hex: '#363D8C', label: 'Indigo', className: 'nb-c-indigo' },
  { id: 'steel', hex: '#2C5A84', label: 'Steel', className: 'nb-c-steel' },
  { id: 'ochre', hex: '#8C5F0E', label: 'Ochre', className: 'nb-c-ochre' },
] as const

export type CoverId = (typeof COVER_COLORS)[number]['id']
export type CoverHex = (typeof COVER_COLORS)[number]['hex']

/** Cover ids accepted by create/update class APIs. */
export const COVER_IDS = COVER_COLORS.map((c) => c.id) as [
  CoverId,
  CoverId,
  CoverId,
  CoverId,
  CoverId,
  CoverId,
]

/** @deprecated Use COVER_IDS — kept temporarily for call sites that still import BANNER_COLORS. */
export const BANNER_COLORS = COVER_IDS

export const DEFAULT_COVER: CoverId = 'teal'
export const DEFAULT_COVER_ID: CoverId = 'teal'

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9A-Fa-f]{6})$/.exec(hex.trim())
  if (!m) return null
  const n = Number.parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function isCoverId(value: string): value is CoverId {
  return COVER_COLORS.some((c) => c.id === value)
}

/** Resolve a cover id or legacy hex to a CoverId. */
export function resolveCoverId(color: string | null | undefined): CoverId {
  if (!color) return DEFAULT_COVER_ID
  const lower = color.trim().toLowerCase()
  if (isCoverId(lower)) return lower

  const normalized = color.trim().toUpperCase()
  const exact = COVER_COLORS.find((c) => c.hex.toUpperCase() === normalized)
  if (exact) return exact.id

  const rgb = parseHex(color)
  if (!rgb) return DEFAULT_COVER_ID

  let best: CoverId = DEFAULT_COVER_ID
  let bestDist = Number.POSITIVE_INFINITY
  for (const cover of COVER_COLORS) {
    const c = parseHex(cover.hex)
    if (!c) continue
    const dist = (rgb[0] - c[0]) ** 2 + (rgb[1] - c[1]) ** 2 + (rgb[2] - c[2]) ** 2
    if (dist < bestDist) {
      bestDist = dist
      best = cover.id
    }
  }
  return best
}

/** Snap any stored banner colour to the official cover hex (for inline styles). */
export function resolveCoverColor(color: string | null | undefined): CoverHex {
  const id = resolveCoverId(color)
  return COVER_COLORS.find((c) => c.id === id)!.hex
}

export function coverClassName(color: string | null | undefined): string {
  const id = resolveCoverId(color)
  return COVER_COLORS.find((c) => c.id === id)!.className
}

export function coverLabel(color: string): string {
  const id = resolveCoverId(color)
  return COVER_COLORS.find((c) => c.id === id)?.label ?? 'Cover'
}

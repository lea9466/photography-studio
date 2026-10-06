import type { ProFeature } from '@/lib/subscriptions/types'

/**
 * Photographer-controlled order + visibility of the movable homepage
 * sections. Hero (always first) and contact (always last) are fixed and
 * deliberately not part of this list. `homepage_sections` on `users` stores
 * the layout as JSON; NULL means "default order, everything visible", which is
 * how every site rendered before this feature existed.
 */
export const HOMEPAGE_SECTION_IDS = [
  'about',
  'galleries',
  'recent_photos',
  'posts',
  'packages',
  'testimonials',
  'faq',
] as const

export type HomepageSectionId = (typeof HOMEPAGE_SECTION_IDS)[number]

export type HomepageSectionEntry = { id: HomepageSectionId; visible: boolean }

export type HomepageSectionLayout = HomepageSectionEntry[]

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionId, string> = {
  about: 'אודות',
  galleries: 'גלריות',
  recent_photos: 'תמונות אחרונות',
  posts: 'בלוג',
  packages: 'חבילות ומחירים',
  testimonials: 'המלצות',
  faq: 'שאלות נפוצות',
}

const KNOWN_IDS = new Set<string>(HOMEPAGE_SECTION_IDS)

export function defaultHomepageSectionLayout(): HomepageSectionLayout {
  return HOMEPAGE_SECTION_IDS.map((id) => ({ id, visible: true }))
}

/**
 * Tolerant parser for whatever is in the DB column: drops unknown/duplicate
 * ids, and appends any section missing from the saved value (e.g. one added
 * to the product later) at the end, visible.
 */
export function normalizeHomepageSectionLayout(raw: unknown): HomepageSectionLayout {
  const seen = new Set<string>()
  const result: HomepageSectionLayout = []

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue
      const { id, visible } = item as { id?: unknown; visible?: unknown }
      if (typeof id !== 'string' || !KNOWN_IDS.has(id) || seen.has(id)) continue
      seen.add(id)
      result.push({ id: id as HomepageSectionId, visible: visible !== false })
    }
  }

  for (const id of HOMEPAGE_SECTION_IDS) {
    if (!seen.has(id)) result.push({ id, visible: true })
  }

  return result
}

/**
 * Sections whose content is a PRO feature. On the Basic (free) plan they are
 * not rendered on the public site at all, so the order editor shows them
 * greyed out with an upgrade prompt instead of letting them be arranged.
 */
export const HOMEPAGE_SECTION_PRO_FEATURE: Partial<Record<HomepageSectionId, ProFeature>> = {
  posts: 'posts',
  packages: 'packages',
  testimonials: 'testimonials',
  faq: 'faq',
}

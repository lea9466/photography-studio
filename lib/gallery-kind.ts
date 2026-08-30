import type { GalleryType } from '@/lib/types/database.types'

/**
 * The two kinds of gallery are separate products with no overlap between
 * them:
 *
 * - `client`   — a private, password-gated delivery gallery tied to one
 *                client. Served only from the isolated private-gallery
 *                subdomain (see lib/private-gallery/isolation.ts).
 *                `gallery_type: 'selection'`, `is_public: false`.
 * - `showcase` — a public portfolio gallery shown on the studio's own public
 *                site. No client, no password, indexable.
 *                `gallery_type: 'portfolio'`, `is_public: true`.
 *
 * A gallery's kind is fixed the moment it's created and can never change.
 * The two are created through separate flows and stay unrelated — a `client`
 * gallery can never be turned public. `showcase` galleries do have a separate
 * "shown on the site right now / hidden" toggle (their `is_public` column),
 * but that's visibility, not identity — see updateGallerySettings.
 */
export type GalleryKind = 'client' | 'showcase'

type GalleryKindShape = {
  gallery_type?: string | null
  is_public?: boolean | null
}

/**
 * Derives the kind of an existing gallery row from `gallery_type`, which is
 * set at creation and never mutated anywhere. `is_public` is deliberately NOT
 * used here: a showcase gallery hidden from the site still has
 * `is_public: false` but is still a showcase gallery.
 */
export function galleryKind(gallery: GalleryKindShape): GalleryKind {
  return gallery.gallery_type === 'portfolio' ? 'showcase' : 'client'
}

/**
 * The fixed `gallery_type` + `is_public` a given kind always maps to — the
 * single place that coupling is written down, used by the two create actions.
 */
export function galleryKindColumns(kind: GalleryKind): {
  galleryType: GalleryType
  isPublic: boolean
} {
  return kind === 'showcase'
    ? { galleryType: 'portfolio', isPublic: true }
    : { galleryType: 'selection', isPublic: false }
}

export function isGalleryKind(value: string | null | undefined): value is GalleryKind {
  return value === 'client' || value === 'showcase'
}

export const GALLERY_KIND_LABELS: Record<GalleryKind, string> = {
  client: 'גלריית לקוח',
  showcase: 'גלריה לאתר',
}

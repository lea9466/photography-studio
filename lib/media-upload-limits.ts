/** Max upload size for hero, cover, logo, and other primary site images (50 MB). */
export const PRIMARY_IMAGE_MAX_BYTES = 50 * 1024 * 1024

export const PRIMARY_IMAGE_MAX_MB = 50

export const PRIMARY_IMAGE_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const

export function validatePrimaryImageFile(contentType: string, fileSize: number) {
  if (!PRIMARY_IMAGE_ALLOWED_TYPES.includes(contentType as (typeof PRIMARY_IMAGE_ALLOWED_TYPES)[number])) {
    throw new Error('סוג הקובץ לא נתמך')
  }
  if (fileSize > PRIMARY_IMAGE_MAX_BYTES) {
    throw new Error(`גודל הקובץ חורג מ-${PRIMARY_IMAGE_MAX_MB} MB`)
  }
}

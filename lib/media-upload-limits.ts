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

/**
 * Allowed content types for photographer-uploaded gallery/blog-post SOURCE
 * photos (originals + edited-photo replacements), via
 * createR2UploadUrls/createPostR2UploadUrls (lib/actions/storage.actions.ts).
 *
 * Deliberately NOT the same list as PRIMARY_IMAGE_ALLOWED_TYPES above:
 * that one includes image/svg+xml for logos — there is no legitimate use
 * for SVG here (these are client photos, not vector logos, and the
 * upload/preview pipeline in lib/images/process.ts has no SVG handling at
 * all — it loads every file into an <img>/<canvas> to generate previews).
 *
 * Scoped to what this app's own code actually touches: the preview/
 * watermarked derivatives it generates are always hardcoded to
 * 'image/jpeg' (lib/images/process.ts canvasToBlob), and jpeg/png/webp are
 * the formats already trusted elsewhere in the app. NOTE: the upload UI
 * for this flow uses accept="image/*" (unrestricted) client-side, so if
 * photographers are actually relying on uploading HEIC/TIFF originals
 * today (e.g. straight off an iPhone), this list would need to be widened
 * — nothing in the codebase references those formats today, so treating
 * them as in-scope here would be guessing rather than confirming.
 */
export const GALLERY_PHOTO_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

// No size limit existed for this flow before this change. 100MB is a
// judgment call, not an existing convention — generous headroom for a
// full-resolution, minimally-compressed camera JPEG (typically well under
// 50MB even at 50MP+), while still bounding the presigned PUT. Adjust if
// real-world originals are routinely larger.
export const GALLERY_PHOTO_MAX_BYTES = 100 * 1024 * 1024
export const GALLERY_PHOTO_MAX_MB = 100

export function validateGalleryPhotoUpload(contentType: string, fileSize?: number) {
  if (!GALLERY_PHOTO_ALLOWED_TYPES.includes(contentType as (typeof GALLERY_PHOTO_ALLOWED_TYPES)[number])) {
    throw new Error('סוג הקובץ לא נתמך')
  }
  if (fileSize !== undefined && fileSize > GALLERY_PHOTO_MAX_BYTES) {
    throw new Error(`גודל הקובץ חורג מ-${GALLERY_PHOTO_MAX_MB} MB`)
  }
}

/**
 * Camera RAW file extensions. The gallery upload pipeline only ever stores
 * JPEG/PNG/WebP (GALLERY_PHOTO_ALLOWED_TYPES) and builds its preview +
 * watermarked derivatives by decoding the file in a browser <canvas>, which
 * cannot read RAW — so a RAW upload always fails somewhere downstream (the
 * server content-type allowlist, or "כיווץ נכשל" when it slips through with
 * an empty File.type). Browsers report an empty or inconsistent File.type
 * for most RAW files, so detection here is by extension, not MIME type.
 * List covers the common vendor formats (Canon, Nikon, Sony, Fuji,
 * Panasonic, Olympus, Pentax, Leica, Adobe DNG, …).
 */
export const RAW_PHOTO_EXTENSIONS = [
  '3fr', 'ari', 'arw', 'bay', 'braw', 'cap', 'cr2', 'cr3', 'crw', 'dcr',
  'dcs', 'dng', 'drf', 'eip', 'erf', 'fff', 'gpr', 'iiq', 'k25', 'kdc',
  'mdc', 'mef', 'mos', 'mrw', 'nef', 'nrw', 'obm', 'orf', 'pef', 'ptx',
  'pxn', 'r3d', 'raf', 'raw', 'rw2', 'rwl', 'rwz', 'sr2', 'srf', 'srw',
  'x3f',
] as const

/** True when a filename ends in a known camera-RAW extension (case-insensitive). */
export function isRawPhotoFilename(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase()
  return ext !== undefined && (RAW_PHOTO_EXTENSIONS as readonly string[]).includes(ext)
}

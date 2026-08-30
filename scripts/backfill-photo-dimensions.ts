/**
 * Backfill photos.width / photos.height for rows uploaded before dimensions
 * were recorded (older galleries). The client gallery masonry uses these to
 * reserve each photo's box before its image loads — without them the grid
 * re-balances as images stream in and the photos visibly jump around.
 *
 * Dimensions are read from the preview derivative (resized proportionally, so
 * the aspect ratio matches the original), falling back to the watermarked
 * copy. Values are the preview's pixel size, which is all the layout needs.
 *
 * Usage:
 *   npx tsx scripts/backfill-photo-dimensions.ts            # every gallery
 *   npx tsx scripts/backfill-photo-dimensions.ts <galleryId>
 *   npx tsx scripts/backfill-photo-dimensions.ts --dry-run
 */
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import sharp from 'sharp'
import { createAdminClient } from '../lib/supabase/admin'
import { downloadMediaObject } from '../lib/r2/storage'
import type { MediaBucket } from '../lib/r2/types'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const galleryId = args.find((arg) => !arg.startsWith('--'))

const PAGE_SIZE = 500

type Row = {
  id: string
  gallery_id: string
  preview_url: string | null
  watermarked_preview_url: string | null
}

async function fetchCandidates(
  db: ReturnType<typeof createAdminClient>
): Promise<Row[]> {
  const all: Row[] = []
  let from = 0

  for (;;) {
    let query = db
      .from('photos')
      .select('id, gallery_id, preview_url, watermarked_preview_url')
      .or('width.is.null,height.is.null')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (galleryId) query = query.eq('gallery_id', galleryId)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const rows = (data ?? []) as Row[]
    all.push(...rows)
    if (rows.length < PAGE_SIZE) break
    from += rows.length
  }

  return all
}

async function readDimensions(row: Row) {
  const sources: Array<{ bucket: MediaBucket; path: string | null }> = [
    { bucket: 'previews', path: row.preview_url },
    { bucket: 'watermarked', path: row.watermarked_preview_url },
  ]

  for (const { bucket, path } of sources) {
    if (!path) continue
    try {
      const bytes = await downloadMediaObject(bucket, path)
      const meta = await sharp(Buffer.from(bytes)).metadata()
      if (meta.width && meta.height) {
        // sharp reports pre-rotation dimensions; honour EXIF orientation 5-8.
        const rotated = meta.orientation != null && meta.orientation >= 5
        return rotated
          ? { width: meta.height, height: meta.width }
          : { width: meta.width, height: meta.height }
      }
    } catch {
      // try the next source
    }
  }

  return null
}

async function run() {
  const db = createAdminClient()
  const candidates = await fetchCandidates(db)
  console.log(
    `${candidates.length} photo(s) missing dimensions${
      galleryId ? ` in gallery ${galleryId}` : ''
    }.\n`
  )

  let updated = 0
  let failed = 0

  for (const row of candidates) {
    const dims = await readDimensions(row)
    if (!dims) {
      failed += 1
      console.warn(`  ✗ ${row.id} — could not read dimensions`)
      continue
    }

    if (dryRun) {
      updated += 1
      console.log(`  · ${row.id} → ${dims.width}×${dims.height} (dry-run)`)
      continue
    }

    const { error } = await db
      .from('photos')
      .update(dims as never)
      .eq('id', row.id)

    if (error) {
      failed += 1
      console.warn(`  ✗ ${row.id} — update failed: ${error.message}`)
    } else {
      updated += 1
      console.log(`  ✓ ${row.id} → ${dims.width}×${dims.height}`)
    }
  }

  console.log(
    `\nDone. updated=${updated} failed=${failed}${
      dryRun ? ' (dry-run, nothing written)' : ''
    }`
  )
}

void run()

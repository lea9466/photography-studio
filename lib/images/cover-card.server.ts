import 'server-only'
import sharp from 'sharp'
import {
  COVER_CARD_MAX_DIMENSION,
  COVER_CARD_QUALITY,
} from '@/lib/images/cover-card'

/** Server-side card compression (mirrors browser-image-compression settings). */
export async function compressCoverCardBuffer(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(COVER_CARD_MAX_DIMENSION, COVER_CARD_MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality: Math.round(COVER_CARD_QUALITY * 100),
      mozjpeg: true,
    })
    .toBuffer()
}

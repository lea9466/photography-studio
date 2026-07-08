import sharp from 'sharp'

export const COVER_CARD_MAX_WIDTH = 800
export const COVER_CARD_QUALITY = 78
export const COVER_FULL_QUALITY = 92
export const COVER_STORAGE_PREFIX = 'gallery_cover_v2_'

function escapeXml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildWatermarkSvg(text: string, width: number, height: number) {
  const fontSize = Math.max(14, Math.round(width * 0.032))
  const padding = Math.max(12, Math.round(width * 0.02))
  const x = padding
  const y = height - padding

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="${x}"
    y="${y}"
    font-family="Heebo, Arial, sans-serif"
    font-weight="600"
    font-size="${fontSize}"
    fill="rgba(255,255,255,0.7)"
    stroke="rgba(0,0,0,0.25)"
    stroke-width="1"
    text-anchor="start"
  >${escapeXml(text)}</text>
</svg>`

  return Buffer.from(svg)
}

export function deriveCoverCardStoragePath(coverPath: string): string | null {
  const normalized = coverPath.replace(/^branding\//, '').trim()
  if (!normalized.includes(COVER_STORAGE_PREFIX)) return null
  if (normalized.includes('_card.')) return normalized

  const dot = normalized.lastIndexOf('.')
  if (dot === -1) return null

  return `${normalized.slice(0, dot)}_card${normalized.slice(dot)}`
}

export async function processCoverFullImage(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer).webp({ quality: COVER_FULL_QUALITY, effort: 4 }).toBuffer()
}

export async function processCoverCardImage(
  inputBuffer: Buffer,
  options?: {
    watermarkText?: string | null
    applyAutoWatermark?: boolean
  }
): Promise<Buffer> {
  let cardBuffer = await sharp(inputBuffer)
    .resize({ width: COVER_CARD_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: COVER_CARD_QUALITY })
    .toBuffer()

  const applyAutoWatermark = options?.applyAutoWatermark ?? true
  const watermarkText = options?.watermarkText?.trim()
  if (!applyAutoWatermark || !watermarkText) {
    return cardBuffer
  }

  const { width = COVER_CARD_MAX_WIDTH, height = COVER_CARD_MAX_WIDTH } =
    await sharp(cardBuffer).metadata()
  const watermarkSvg = buildWatermarkSvg(watermarkText, width, height)

  cardBuffer = await sharp(cardBuffer)
    .composite([{ input: watermarkSvg, top: 0, left: 0 }])
    .webp({ quality: COVER_CARD_QUALITY })
    .toBuffer()

  return cardBuffer
}

export function buildCoverStoragePaths(userId: string, timestamp: number) {
  const base = `${userId}/${COVER_STORAGE_PREFIX}${timestamp}.webp`
  const dot = base.lastIndexOf('.')
  const card = `${base.slice(0, dot)}_card${base.slice(dot)}`
  return { fullPath: base, cardPath: card }
}

import 'server-only'

import sharp from 'sharp'
import {
  deleteMediaObject,
  downloadMediaObject,
  uploadMediaObject,
} from '@/lib/r2/storage'
import { getLogoFileKind } from '@/lib/branding/logo-favicon-path'

const FAVICON_SIZE = 512

const faviconVariantPaths = (userId: string) => [
  `${userId}/favicon.png`,
  `${userId}/favicon.jpg`,
  `${userId}/favicon.webp`,
]

async function clearFaviconVariants(userId: string) {
  await Promise.all(
    faviconVariantPaths(userId).map((path) =>
      deleteMediaObject('branding', path).catch(() => undefined)
    )
  )
}

async function convertSvgToFaviconPng(svgBytes: Uint8Array): Promise<Buffer> {
  return sharp(Buffer.from(svgBytes), { density: 300 })
    .resize(FAVICON_SIZE, FAVICON_SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
}

export async function syncBrandingLogoFavicon(userId: string, logoPath: string) {
  const kind = getLogoFileKind(logoPath)
  const sourceBytes = await downloadMediaObject('branding', logoPath)

  await clearFaviconVariants(userId)

  if (kind === 'png') {
    await uploadMediaObject('branding', `${userId}/favicon.png`, sourceBytes, 'image/png')
    return `${userId}/favicon.png`
  }

  if (kind === 'jpeg') {
    await uploadMediaObject('branding', `${userId}/favicon.jpg`, sourceBytes, 'image/jpeg')
    return `${userId}/favicon.jpg`
  }

  if (kind === 'webp') {
    await uploadMediaObject('branding', `${userId}/favicon.webp`, sourceBytes, 'image/webp')
    return `${userId}/favicon.webp`
  }

  if (kind === 'svg') {
    const pngBuffer = await convertSvgToFaviconPng(sourceBytes)
    await uploadMediaObject('branding', `${userId}/favicon.png`, pngBuffer, 'image/png')
    return `${userId}/favicon.png`
  }

  throw new Error('פורמט לוגו לא נתמך ליצירת favicon')
}

export async function deleteBrandingLogoFavicon(userId: string) {
  await clearFaviconVariants(userId)
}

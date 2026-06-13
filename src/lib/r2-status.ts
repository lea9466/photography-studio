import { r2ConfigError, r2Configured } from '@/lib/r2'
import { r2PublicConfigured } from '@/lib/r2-public'

export function getR2GalleryUploadStatus(): {
  ready: boolean
  message: string
} {
  if (!r2Configured()) {
    return { ready: false, message: r2ConfigError() }
  }
  if (!r2PublicConfigured()) {
    return {
      ready: false,
      message:
        'חסר NEXT_PUBLIC_R2_PUBLIC_URL (או R2_PUBLIC_URL) — נדרש לקישורי תמונות ציבוריים',
    }
  }
  return { ready: true, message: '' }
}

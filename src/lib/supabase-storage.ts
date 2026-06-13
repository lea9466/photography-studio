import 'server-only'

import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'
import {
  SITE_STORAGE_BUCKET,
  supabasePublicUrlFromPath,
  supabaseStoragePathFromUrl,
} from '@/lib/storage-urls'

export { SITE_STORAGE_BUCKET } from '@/lib/storage-urls'

export function supabaseStorageConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!getAdminClient()
}

export function supabaseStorageConfigError(): string {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return 'חסר NEXT_PUBLIC_SUPABASE_URL ב-.env.local'
  }
  if (!getAdminClient()) return adminConfigError()
  return 'Supabase Storage לא מוגדר'
}

function sanitizeSiteFileName(fileName: string): string {
  const base = fileName.replace(/[/\\]/g, '').replace(/[^\w.\-]+/g, '_')
  return base || 'file'
}

function buildSiteObjectPath(prefix: string, fileName: string): string {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return `site/${prefix}/${stamp}-${sanitizeSiteFileName(fileName)}`
}

/** Hero, לוגו ושאר נכסי האתר — Supabase Storage (bucket albums, תיקיית site/). */
export async function uploadSiteFileToSupabase(
  file: File,
  prefix: string
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  if (!supabaseStorageConfigured()) {
    return { url: null, path: null, error: supabaseStorageConfigError() }
  }

  const sb = getAdminClient()!
  const objectPath = buildSiteObjectPath(prefix, file.name)
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await sb.storage
    .from(SITE_STORAGE_BUCKET)
    .upload(objectPath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    return { url: null, path: null, error: error.message }
  }

  return {
    url: supabasePublicUrlFromPath(objectPath),
    path: objectPath,
    error: null,
  }
}

export async function deleteSupabaseStorageByUrls(urls: string[]): Promise<void> {
  const sb = getAdminClient()
  if (!sb) return

  const paths = [
    ...new Set(
      urls
        .map((url) => supabaseStoragePathFromUrl(url))
        .filter((path): path is string => !!path)
    ),
  ]
  if (paths.length === 0) return

  await sb.storage.from(SITE_STORAGE_BUCKET).remove(paths).catch(() => {})
}

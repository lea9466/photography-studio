import { createAdminClient } from '@/lib/supabase/admin'
import {
  generateGalleryPassword,
  hashGalleryPassword,
  isBcryptHash,
} from '@/lib/gallery-password'

export async function rotateGalleryPassword(galleryId: string) {
  const admin = createAdminClient()
  const plain = generateGalleryPassword()
  const hashed = await hashGalleryPassword(plain)

  const { error } = await admin
    .from('galleries')
    .update({ password: hashed } as never)
    .eq('id', galleryId)

  if (error) throw new Error(error.message)
  return plain
}

export async function persistHashedGalleryPassword(
  galleryId: string,
  plain: string
) {
  const admin = createAdminClient()
  const hashed = await hashGalleryPassword(plain)

  const { error } = await admin
    .from('galleries')
    .update({ password: hashed } as never)
    .eq('id', galleryId)

  if (error) throw new Error(error.message)
}

export async function migrateLegacyGalleryPassword(
  galleryId: string,
  plain: string,
  stored: string | null
) {
  if (!stored || isBcryptHash(stored)) return
  await persistHashedGalleryPassword(galleryId, plain)
}

export function galleryHasPassword(stored: string | null) {
  return Boolean(stored?.trim())
}

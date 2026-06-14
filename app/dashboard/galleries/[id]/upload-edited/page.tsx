import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signStoragePaths } from '@/lib/storage'
import { UploadEdited } from '@/components/gallery/UploadEdited'

type UploadEditedPageProps = {
  params: Promise<{ id: string }>
}

export default async function UploadEditedPage({
  params,
}: UploadEditedPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: selections } = await supabase
    .from('photo_selections')
    .select(
      `
      photos (id, preview_url),
      edited_photos (final_url)
    `
    )
    .eq('gallery_id', id)
    .eq('selected_edit', true)

  type Row = {
    photos: { id: string; preview_url: string | null } | { id: string; preview_url: string | null }[] | null
    edited_photos: { final_url: string | null } | { final_url: string | null }[] | null
  }

  const rows = (selections ?? []) as Row[]

  const previewPaths = rows.map((r) => {
    const photo = Array.isArray(r.photos) ? r.photos[0] : r.photos
    return photo?.preview_url ?? null
  })
  const editedPaths = rows.map((r) => {
    const edited = Array.isArray(r.edited_photos) ? r.edited_photos[0] : r.edited_photos
    return edited?.final_url ?? null
  })

  const previewSigned = await signStoragePaths('previews', previewPaths)
  const editedSigned = await signStoragePaths('edited', editedPaths)

  const selectedPhotos = rows
    .map((row) => {
      const photo = Array.isArray(row.photos) ? row.photos[0] : row.photos
      const edited = Array.isArray(row.edited_photos) ? row.edited_photos[0] : row.edited_photos
      if (!photo) return null
      return {
        id: photo.id,
        preview_signed_url: photo.preview_url
          ? previewSigned[photo.preview_url] ?? null
          : null,
        edited_signed_url: edited?.final_url
          ? editedSigned[edited.final_url] ?? null
          : null,
      }
    })
    .filter(Boolean)

  return (
    <UploadEdited
      galleryId={id}
      userId={user.id}
      selectedPhotos={selectedPhotos as never}
    />
  )
}

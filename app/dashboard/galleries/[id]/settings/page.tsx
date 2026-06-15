import { notFound } from 'next/navigation'
import { fetchGalleryDetail } from '@/lib/actions/gallery.actions'
import { GallerySettingsForm } from '@/components/dashboard/GallerySettingsForm'
import type { Gallery, GallerySettings } from '@/lib/types/database.types'

type SettingsPageProps = {
  params: Promise<{ id: string }>
}

export default async function GallerySettingsPage({ params }: SettingsPageProps) {
  const { id } = await params
  const data = await fetchGalleryDetail(id)
  if (!data) notFound()

  type Detail = Gallery & {
    gallery_settings: GallerySettings | GallerySettings[] | null
  }

  const gallery = data as Detail
  const settings = Array.isArray(gallery.gallery_settings)
    ? gallery.gallery_settings[0]
    : gallery.gallery_settings

  return (
    <div className="space-y-3 animate-fade-in">
      <div>
        <h2 className="text-lg font-medium">הגדרות גלריה</h2>
        <p className="text-sm text-[--muted]">
          שם, סיסמה, מגבלות בחירה והורדות
        </p>
      </div>
      <GallerySettingsForm gallery={gallery} settings={settings ?? null} />
    </div>
  )
}

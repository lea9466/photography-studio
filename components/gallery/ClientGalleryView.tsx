'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ClientPhotoMasonry } from '@/components/gallery/ClientPhotoMasonry'
import {
  type ClientGalleryData,
  type ClientGalleryPhoto,
} from '@/lib/actions/client-gallery.actions'
import { StatusBanner } from '@/components/gallery/StatusBanner'
import { Lightbox } from '@/components/gallery/Lightbox'
import { SelectionBar } from '@/components/gallery/SelectionBar'
import { ClientEditedDownloadButton } from '@/components/gallery/ClientEditedDownloadButton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  canToggleSelection,
  selectionStorageKey,
  type ClientSelectionPayload,
} from '@/lib/gallery-selection'
import { resolveMediaUrl } from '@/lib/r2/storage'

type ClientGalleryViewProps = {
  gallery: ClientGalleryData
  photos: ClientGalleryPhoto[]
}

type StoredSelections = Record<
  string,
  Pick<ClientGalleryPhoto, 'selected_album' | 'selected_edit'>
>

function buildSelections(items: ClientGalleryPhoto[]): ClientSelectionPayload[] {
  return items.map((photo) => ({
    photoId: photo.id,
    selected_album: photo.selected_album,
    selected_edit: photo.selected_edit,
  }))
}

function mergeStoredSelections(
  photos: ClientGalleryPhoto[],
  stored: StoredSelections | null
) {
  if (!stored) return photos

  return photos.map((photo) => {
    const draft = stored[photo.id]
    if (!draft) return photo

    return {
      ...photo,
      selected_album: draft.selected_album,
      selected_edit: draft.selected_edit,
    }
  })
}

export function ClientGalleryView({ gallery, photos }: ClientGalleryViewProps) {
  const canSelect = ['sent', 'selection'].includes(gallery.status)
  const isDelivered = ['delivery_ready', 'locked'].includes(gallery.status)
  const [items, setItems] = useState(photos)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null)
  const [aboutImageUrl, setAboutImageUrl] = useState<string | null>(null)

  const showEdited = items.some((p) => p.edited_signed_url)
  const [tab, setTab] = useState(() => {
    if (['delivery_ready', 'locked'].includes(gallery.status)) {
      return photos.some((p) => p.edited_signed_url) ? 'edited' : 'album'
    }
    return 'all'
  })

  useEffect(() => {
    if (!canSelect) return

    try {
      const raw = sessionStorage.getItem(selectionStorageKey(gallery.id))
      if (!raw) return
      setItems(mergeStoredSelections(photos, JSON.parse(raw) as StoredSelections))
    } catch {
      // ignore invalid draft data
    }
  }, [canSelect, gallery.id, photos])

  useEffect(() => {
    async function loadBrandingImages() {
      const heroPath = gallery.hero_desktop_url || gallery.hero_mobile_url
      if (heroPath) {
        setHeroImageUrl(await resolveMediaUrl('branding', heroPath))
      }
      if (gallery.logo_url) {
        setLogoImageUrl(await resolveMediaUrl('branding', gallery.logo_url))
      }
      if (gallery.about_image_url) {
        setAboutImageUrl(await resolveMediaUrl('branding', gallery.about_image_url))
      }
    }
    loadBrandingImages()
  }, [gallery.hero_desktop_url, gallery.hero_mobile_url, gallery.logo_url, gallery.about_image_url])

  useEffect(() => {
    if (!canSelect) return

    const stored: StoredSelections = {}
    for (const photo of items) {
      if (photo.selected_album || photo.selected_edit) {
        stored[photo.id] = {
          selected_album: photo.selected_album,
          selected_edit: photo.selected_edit,
        }
      }
    }

    try {
      sessionStorage.setItem(
        selectionStorageKey(gallery.id),
        JSON.stringify(stored)
      )
    } catch {
      // ignore quota / private mode errors
    }
  }, [canSelect, gallery.id, items])

  const filtered = useMemo(() => {
    switch (tab) {
      case 'album':
        return items.filter((p) => p.selected_album)
      case 'edit':
        return items.filter((p) => p.selected_edit)
      case 'edited':
        return items.filter((p) => p.edited_signed_url)
      default:
        return items
    }
  }, [items, tab])

  const albumCount = items.filter((p) => p.selected_album).length
  const editCount = items.filter((p) => p.selected_edit).length

  function toggleField(photoId: string, field: 'selected_album' | 'selected_edit') {
    if (
      !canToggleSelection(
        items,
        photoId,
        field,
        gallery.max_album_selection,
        gallery.max_edit_selection
      )
    ) {
      toast.error('הגעת למקסימום הבחירות')
      return
    }

    setItems((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, [field]: !photo[field] } : photo
      )
    )
  }

  function openLightbox(index: number) {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  return (
    <div
      className="min-h-screen pb-16"
      dir="rtl"
      data-theme={gallery.selected_theme}
      style={{ '--client-accent': gallery.accent_color } as React.CSSProperties}
    >
      {/* Hero Section */}
      {heroImageUrl && (
        <div className="relative h-64 w-full overflow-hidden sm:h-96 lg:h-[500px]">
          <Image
            src={heroImageUrl}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center text-white">
              {logoImageUrl && (
                <div className="mb-4 flex justify-center">
                  <Image
                    src={logoImageUrl}
                    alt="Logo"
                    width={120}
                    height={120}
                    className="h-20 w-20 rounded-full object-contain"
                  />
                </div>
              )}
              <p className="text-lg font-medium">
                {gallery.studio_name ?? 'Studio Gallery'}
              </p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl lg:text-5xl">
                {gallery.title}
              </h1>
            </div>
          </div>
        </div>
      )}

      <header className={`border-b border-[--border] px-4 py-6 text-center ${!gallery.hero_desktop_url && !gallery.hero_mobile_url ? '' : 'hidden'}`}>
        <p className="text-sm text-[--muted]">
          {gallery.studio_name ?? 'Studio Gallery'}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{gallery.title}</h1>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-3 py-6 sm:px-4">
        <StatusBanner
          status={gallery.status}
          maxAlbum={gallery.max_album_selection}
          maxEdit={gallery.max_edit_selection}
        />

        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              {!isDelivered ? (
                <TabsTrigger value="all">כל התמונות</TabsTrigger>
              ) : null}
              <TabsTrigger value="album">אלבום</TabsTrigger>
              {!isDelivered ? (
                <TabsTrigger value="edit">לעיבוד</TabsTrigger>
              ) : null}
              {showEdited ? (
                <TabsTrigger value="edited">מעובדות</TabsTrigger>
              ) : null}
            </TabsList>

            {isDelivered && showEdited ? (
              <ClientEditedDownloadButton galleryId={gallery.id} />
            ) : null}
          </div>

          <TabsContent value={tab}>
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-[--muted]">
                אין תמונות בטאב זה
              </p>
            ) : (
              <ClientPhotoMasonry
                photos={filtered.map((photo) => ({
                  id: photo.id,
                  src:
                    isDelivered || tab === 'edited'
                      ? photo.edited_signed_url ?? photo.preview_signed_url
                      : photo.preview_signed_url,
                  selected_album: photo.selected_album,
                  selected_edit: photo.selected_edit,
                }))}
                canSelect={canSelect}
                onOpen={openLightbox}
                onToggleAlbum={(id) => toggleField(id, 'selected_album')}
                onToggleEdit={(id) => toggleField(id, 'selected_edit')}
                getGlobalIndex={(id) => items.findIndex((p) => p.id === id)}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {canSelect ? (
        <SelectionBar
          galleryId={gallery.id}
          albumCount={albumCount}
          editCount={editCount}
          maxAlbum={gallery.max_album_selection}
          maxEdit={gallery.max_edit_selection}
          selections={buildSelections(items)}
        />
      ) : null}

      {/* About Section */}
      {(gallery.about_text || aboutImageUrl || gallery.stat_projects > 0 || gallery.stat_clients > 0 || gallery.stat_experience_years > 0) && (
        <section className="mx-auto mt-12 max-w-5xl px-4 py-8">
          <div className="grid gap-8 md:grid-cols-2">
            {aboutImageUrl && (
              <div className="relative aspect-square overflow-hidden rounded-xl">
                <Image
                  src={aboutImageUrl}
                  alt="About"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
            <div className={`flex flex-col justify-center ${aboutImageUrl ? '' : 'md:col-span-2'}`}>
              {gallery.about_text && (
                <div className="mb-6">
                  <h2 className="mb-3 text-2xl font-semibold">אודות</h2>
                  <p className="text-sm leading-relaxed text-[--muted] whitespace-pre-line">
                    {gallery.about_text}
                  </p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-3">
                {gallery.stat_projects > 0 && (
                  <div className="rounded-lg border border-[--border] p-4 text-center">
                    <p className="text-3xl font-semibold" style={{ color: 'var(--client-accent)' }}>
                      {gallery.stat_projects}
                    </p>
                    <p className="mt-1 text-sm text-[--muted]">פרויקטים</p>
                  </div>
                )}
                {gallery.stat_clients > 0 && (
                  <div className="rounded-lg border border-[--border] p-4 text-center">
                    <p className="text-3xl font-semibold" style={{ color: 'var(--client-accent)' }}>
                      {gallery.stat_clients}
                    </p>
                    <p className="mt-1 text-sm text-[--muted]">לקוחות</p>
                  </div>
                )}
                {gallery.stat_experience_years > 0 && (
                  <div className="rounded-lg border border-[--border] p-4 text-center">
                    <p className="text-3xl font-semibold" style={{ color: 'var(--client-accent)' }}>
                      {gallery.stat_experience_years}
                    </p>
                    <p className="mt-1 text-sm text-[--muted]">שנות ניסיון</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <Lightbox
        photos={items}
        index={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onNavigate={setLightboxIndex}
        canSelect={canSelect}
        isLimitedQuality={!['delivery_ready', 'locked'].includes(gallery.status)}
        onToggleAlbum={(id) => toggleField(id, 'selected_album')}
        onToggleEdit={(id) => toggleField(id, 'selected_edit')}
      />
    </div>
  )
}

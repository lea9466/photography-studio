'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ClientPhotoMasonry } from '@/components/gallery/ClientPhotoMasonry'
import { ClientGalleryHero } from '@/components/gallery/ClientGalleryHero'
import { clientPageDataTheme } from '@/lib/branding/client-page-background'
import {
  type ClientGalleryData,
  type ClientGalleryPhoto,
} from '@/lib/actions/client-gallery.actions'
import { StatusBanner } from '@/components/gallery/StatusBanner'
import { Lightbox } from '@/components/gallery/Lightbox'
import { SelectionBar } from '@/components/gallery/SelectionBar'
import { BackToTopButton } from '@/components/gallery/BackToTopButton'
import { ClientEditedDownloadButton } from '@/components/gallery/ClientEditedDownloadButton'
import { ClientDownloadButton } from '@/components/gallery/ClientDownloadButton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  canToggleSelection,
  selectionStorageKey,
  type ClientSelectionPayload,
} from '@/lib/gallery-selection'

type ClientGalleryViewProps = {
  gallery: ClientGalleryData
  photos: ClientGalleryPhoto[]
}

type StoredSelections = Record<
  string,
  Pick<ClientGalleryPhoto, 'selected_album' | 'selected_edit'>
>

/** Active tab takes the studio's accent, with text picked to read on it. */
const TAB_TRIGGER_CLASS =
  'rounded-full px-4 py-2 data-[state=active]:bg-accent data-[state=active]:text-accent-fg data-[state=active]:shadow-sm'

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
  const canSelect = ['selection'].includes(gallery.status)
  const isDelivered = ['delivery_ready', 'locked'].includes(gallery.status)
  // Per-gallery: the photographer can turn off a whole selection track.
  const albumEnabled = gallery.album_selection_enabled
  const editEnabled = gallery.edit_selection_enabled
  const canSelectAlbum = canSelect && albumEnabled
  const canSelectEdit = canSelect && editEnabled
  const [items, setItems] = useState(photos)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxActiveSrc, setLightboxActiveSrc] = useState<string | null>(null)

  const showEdited = items.some((p) => p.edited_signed_url)
  const [tab, setTab] = useState(() => {
    if (['delivery_ready', 'locked'].includes(gallery.status)) {
      if (photos.some((p) => p.edited_signed_url)) return 'processed'
      return albumEnabled ? 'album' : 'regular'
    }
    return 'regular'
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
      case 'processed':
        return items.filter((p) => p.edited_signed_url)
      case 'regular':
      default:
        return items.filter((p) => !p.edited_signed_url)
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

  function openLightbox(index: number, lightboxSrc: string | null) {
    setLightboxIndex(index)
    setLightboxActiveSrc(lightboxSrc)
    setLightboxOpen(true)
  }

  return (
    <div
      className="min-h-screen bg-background pb-16 text-foreground"
      dir="rtl"
      data-client-gallery-root
      data-theme={clientPageDataTheme(gallery.background)}
      style={
        {
          '--client-accent': gallery.accent_color,
          '--client-accent-fg': gallery.accent_foreground,
        } as React.CSSProperties
      }
    >
      <ClientGalleryHero
        title={gallery.title}
        studioName={gallery.studio_name}
        logoUrl={gallery.logo_image_url}
        coverUrl={gallery.cover_image_url}
        heroStyle={gallery.hero_style}
        headingFont={gallery.heading_font}
        siteLink={gallery.site_link}
      />

      <main className="w-full space-y-6 py-6">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4">
          <StatusBanner
            status={gallery.status}
            maxAlbum={gallery.max_album_selection}
            maxEdit={gallery.max_edit_selection}
            albumEnabled={albumEnabled}
            editEnabled={editEnabled}
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 rounded-2xl border border-border bg-background p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-full border-none bg-foreground/5 p-1 sm:w-auto">
              <TabsTrigger
                value="regular"
                className={TAB_TRIGGER_CLASS}
              >
                תמונות רגילות
              </TabsTrigger>
              {editEnabled && (
                <TabsTrigger
                  value="edit"
                  className={TAB_TRIGGER_CLASS}
                >
                  לעיבוד
                </TabsTrigger>
              )}
              {albumEnabled && (
                <TabsTrigger
                  value="album"
                  className={TAB_TRIGGER_CLASS}
                >
                  אלבום
                </TabsTrigger>
              )}
              <TabsTrigger
                value="processed"
                className={TAB_TRIGGER_CLASS}
              >
                מעובדות
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
              {gallery.allow_download_preview && (
                <ClientDownloadButton galleryId={gallery.id} type="watermarked" />
              )}
              {gallery.allow_download_original && (
                <ClientDownloadButton galleryId={gallery.id} type="original" />
              )}
              <ClientEditedDownloadButton
                galleryId={gallery.id}
                hasProcessed={showEdited}
                isDelivered={isDelivered}
              />
            </div>
          </div>

          <TabsContent value={tab} className="mt-6">
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted">
                אין תמונות בטאב זה
              </p>
            ) : (
              <div className="px-1 sm:px-1.5">
                <ClientPhotoMasonry
                  photos={filtered.map((photo) => ({
                    id: photo.id,
                    src:
                      tab === 'processed'
                        ? photo.edited_signed_url ?? photo.preview_signed_url
                        : photo.preview_signed_url,
                    lightboxSrc:
                      photo.lightbox_signed_url ?? photo.preview_signed_url,
                    width: photo.width,
                    height: photo.height,
                    selected_album: photo.selected_album,
                    selected_edit: photo.selected_edit,
                  }))}
                  canSelectAlbum={canSelectAlbum}
                  canSelectEdit={canSelectEdit}
                  onOpen={openLightbox}
                  onToggleAlbum={(id) => toggleField(id, 'selected_album')}
                  onToggleEdit={(id) => toggleField(id, 'selected_edit')}
                  getGlobalIndex={(id) => items.findIndex((p) => p.id === id)}
                />
              </div>
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
          showAlbum={albumEnabled}
          showEdit={editEnabled}
          selections={buildSelections(items)}
        />
      ) : null}

      <Lightbox
        photos={items}
        index={lightboxIndex}
        open={lightboxOpen}
        activeSrc={lightboxActiveSrc}
        onOpenChange={setLightboxOpen}
        onNavigate={(nextIndex) => {
          setLightboxIndex(nextIndex)
          setLightboxActiveSrc(null)
        }}
        canSelectAlbum={canSelectAlbum}
        canSelectEdit={canSelectEdit}
        // The lightbox only ever renders a down-scaled proof — never a
        // full-size delivered file — so the note holds at every stage and
        // regardless of whether a watermark is burned in.
        isLimitedQuality
        onToggleAlbum={(id) => toggleField(id, 'selected_album')}
        onToggleEdit={(id) => toggleField(id, 'selected_edit')}
      />

      {/* Lifted above the selection bar while it's on screen so they don't overlap. */}
      <BackToTopButton className={canSelect ? 'bottom-20 sm:bottom-24' : undefined} />
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
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
    <div className="min-h-screen pb-16" dir="rtl">
      <header className="border-b border-[--border] px-4 py-6 text-center">
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

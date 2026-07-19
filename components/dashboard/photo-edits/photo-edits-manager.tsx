'use client'

import { useEffect, useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  createPhotoEditComparison,
  deletePhotoEditComparison,
  reorderPhotoEditComparisons,
  togglePhotoEditComparisonActive,
  updatePhotoEditComparison,
} from '@/lib/actions/photo-edit-comparisons.actions'
import { PhotoEditDialog } from '@/components/dashboard/photo-edits/photo-edit-dialog'
import { PhotoEditEmptyState } from '@/components/dashboard/photo-edits/photo-edit-empty-state'
import { PhotoEditSortableList } from '@/components/dashboard/photo-edits/photo-edit-sortable-list'
import type { PhotoEditFormValues } from '@/components/dashboard/photo-edits/photo-edit-form'
import { GalleriesDashboardNote } from '@/components/dashboard/GalleriesDashboardNote'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PhotoEditComparison } from '@/lib/types/photo-edit-comparison'

type PhotoEditsManagerProps = {
  initialItems: PhotoEditComparison[]
  studioName?: string | null
  signedUrls?: Record<string, string>
}

function toFormData(values: PhotoEditFormValues, includeId = false) {
  const formData = new FormData()
  if (includeId) formData.set('id', values.comparisonId)
  formData.set('title', values.title)
  formData.set('description', values.description)
  formData.set('originalImageUrl', values.originalImageUrl)
  formData.set('originalWatermarkedUrl', values.originalWatermarkedUrl)
  formData.set('editedImageUrl', values.editedImageUrl)
  formData.set('editedWatermarkedUrl', values.editedWatermarkedUrl)
  formData.set('displayStyle', values.displayStyle)
  formData.set('isActive', String(values.isActive))
  formData.set('autoApplyWatermark', String(values.autoApplyWatermark))
  formData.set('watermarkText', values.watermarkText)
  return formData
}

export function PhotoEditsManager({
  initialItems,
  studioName,
  signedUrls = {},
}: PhotoEditsManagerProps) {
  const [items, setItems] = useState(initialItems)
  const [urlMap, setUrlMap] = useState(signedUrls)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setItems(initialItems)
    setUrlMap(signedUrls)
  }, [initialItems, signedUrls])
  const [editing, setEditing] = useState<PhotoEditComparison | null>(null)
  const [deleting, setDeleting] = useState<PhotoEditComparison | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(item: PhotoEditComparison) {
    setEditing(item)
    setDialogOpen(true)
  }

  function handleSubmit(values: PhotoEditFormValues) {
    startTransition(async () => {
      if (editing) {
        const result = await updatePhotoEditComparison(editing.id, toFormData(values))
        if (!result.success) {
          toast.error(result.error)
          return
        }
        if (result.data) {
          setItems((current) =>
            current.map((item) => (item.id === editing.id ? result.data! : item))
          )
          setUrlMap((current) => ({
            ...current,
            ...(values.originalPreviewUrl
              ? {
                  [values.originalImageUrl]: values.originalPreviewUrl,
                  [values.originalWatermarkedUrl]: values.originalPreviewUrl,
                }
              : {}),
            ...(values.editedPreviewUrl
              ? {
                  [values.editedImageUrl]: values.editedPreviewUrl,
                  [values.editedWatermarkedUrl]: values.editedPreviewUrl,
                }
              : {}),
          }))
        }
        toast.success('השינויים נשמרו בהצלחה')
      } else {
        const result = await createPhotoEditComparison(toFormData(values, true))
        if (!result.success) {
          toast.error(result.error)
          return
        }
        if (result.data) {
          setItems((current) => [...current, result.data!])
          setUrlMap((current) => ({
            ...current,
            ...(values.originalPreviewUrl
              ? {
                  [values.originalImageUrl]: values.originalPreviewUrl,
                  [values.originalWatermarkedUrl]: values.originalPreviewUrl,
                }
              : {}),
            ...(values.editedPreviewUrl
              ? {
                  [values.editedImageUrl]: values.editedPreviewUrl,
                  [values.editedWatermarkedUrl]: values.editedPreviewUrl,
                }
              : {}),
          }))
        }
        toast.success('הזוג נוצר בהצלחה')
      }
      setDialogOpen(false)
      setEditing(null)
    })
  }

  function handleToggleActive(item: PhotoEditComparison, isActive: boolean) {
    const previous = items
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, isActive } : entry))
    )

    startTransition(async () => {
      const result = await togglePhotoEditComparisonActive(item.id, isActive)
      if (!result.success) {
        setItems(previous)
        toast.error(result.error)
        return
      }
      if (result.data) {
        setItems((current) =>
          current.map((entry) => (entry.id === item.id ? result.data! : entry))
        )
      }
      toast.success(isActive ? 'הזוג מוצג באתר' : 'הזוג הוסתר מהאתר')
    })
  }

  function handleDeleteConfirm() {
    if (!deleting) return
    const id = deleting.id

    startTransition(async () => {
      const result = await deletePhotoEditComparison(id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setItems((current) => current.filter((item) => item.id !== id))
      setDeleting(null)
      toast.success('הזוג נמחק')
    })
  }

  function handleReorder(next: PhotoEditComparison[]) {
    const previous = items
    const withOrder = next.map((item, index) => ({ ...item, sortOrder: index }))
    setItems(withOrder)

    startTransition(async () => {
      const result = await reorderPhotoEditComparisons(
        withOrder.map((item) => ({ id: item.id, sortOrder: item.sortOrder }))
      )
      if (!result.success) {
        setItems(previous)
        toast.error(result.error)
        return
      }
    })
  }

  return (
    <div className="space-y-6">
      <GalleriesDashboardNote>
        <p>
          העלי תמונה מקורית ותמונה מעובדת. הקישור «לפני ואחרי עיבוד» בהדר האתר יופיע רק אם קיים
          לפחות זוג אחד.
        </p>
      </GalleriesDashboardNote>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[--muted]">
          {items.length === 0
            ? 'עדיין אין זוגות תמונות'
            : `${items.length} זוגות תמונות`}
        </p>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          יצירת זוג חדש
        </Button>
      </div>

      {items.length === 0 ? (
        <PhotoEditEmptyState onCreate={openCreate} />
      ) : (
        <PhotoEditSortableList
          items={items}
          signedUrls={urlMap}
          disabled={isPending}
          onReorder={handleReorder}
          onEdit={openEdit}
          onDelete={setDeleting}
          onToggleActive={handleToggleActive}
        />
      )}

      <PhotoEditDialog
        open={dialogOpen}
        editing={editing}
        studioName={studioName}
        signedUrls={urlMap}
        saving={isPending}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>למחוק את זוג התמונות?</DialogTitle>
            <DialogDescription>
              הפעולה תמחק את התמונה המקורית, את התמונה המעובדת ואת כל פרטי הזוג. לא ניתן לבטל את
              הפעולה.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              ביטול
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={handleDeleteConfirm}
            >
              {isPending ? 'מוחק...' : 'מחיקה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

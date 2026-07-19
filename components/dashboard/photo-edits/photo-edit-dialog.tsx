'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  PhotoEditForm,
  type PhotoEditFormValues,
} from '@/components/dashboard/photo-edits/photo-edit-form'
import type { PhotoEditComparison } from '@/lib/types/photo-edit-comparison'

type PhotoEditDialogProps = {
  open: boolean
  editing: PhotoEditComparison | null
  studioName?: string | null
  signedUrls?: Record<string, string>
  saving?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PhotoEditFormValues) => void
}

export function PhotoEditDialog({
  open,
  editing,
  studioName,
  signedUrls,
  saving,
  onOpenChange,
  onSubmit,
}: PhotoEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'עריכת זוג תמונות' : 'יצירת זוג חדש'}</DialogTitle>
          <DialogDescription>
            העלי תמונה מקורית ותמונה מעובדת כדי להציג את תהליך העריכה באתר.
          </DialogDescription>
        </DialogHeader>
        <PhotoEditForm
          initial={editing}
          studioName={studioName}
          signedUrls={signedUrls}
          saving={saving}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}

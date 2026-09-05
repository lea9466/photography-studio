'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type SendGalleryConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  pending?: boolean
}

/**
 * Confirmation before a client gallery's FIRST send. The send freezes the
 * source album — "one-time use", the photographer can only upload edited
 * deliverables afterwards. See docs/private-gallery-lifecycle-plan.md §1.ז.
 */
export function SendGalleryConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  pending,
}: SendGalleryConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogTitle>לשלוח את הגלריה ללקוח?</DialogTitle>
        <DialogDescription className="mt-2 leading-relaxed">
          אחרי השליחה <strong>לא ניתן להוסיף או למחוק תמונות</strong> בגלריה זו — רק
          להעלות תמונות מעובדות בהמשך. ודאי שכל תמונות האלבום הועלו.
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            עוד לא
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="bg-[#6b2d43] text-white hover:bg-[#5a2538]"
          >
            שלח ללקוח
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

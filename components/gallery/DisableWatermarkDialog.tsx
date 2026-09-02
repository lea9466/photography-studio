'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type DisableWatermarkDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * Confirmation shown when a photographer turns OFF automatic watermarking for a
 * client gallery. Without the stamp the client sees clean (reduced-resolution)
 * images during the selection phase too — before the album is finalised — so we
 * make her acknowledge that instead of letting the toggle flip silently.
 * Cancelling leaves the (controlled) switch in its ON state untouched.
 */
export function DisableWatermarkDialog({
  open,
  onOpenChange,
  onConfirm,
}: DisableWatermarkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogTitle>לכבות סימן מים אוטומטי?</DialogTitle>
        <DialogDescription className="mt-2 leading-relaxed">
          התמונות יוצגו ללקוח באיכות מוקטנת אך <strong>ללא סימן מים</strong> — כולל
          בשלב בחירת התמונות, לפני סגירת האלבום. מומלץ להשאיר מופעל.
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            ביטול
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            כבה בכל זאת
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

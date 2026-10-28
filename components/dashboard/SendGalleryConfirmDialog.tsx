'use client'

import { ClientEmailDialog } from '@/components/dashboard/ClientEmailDialog'

type SendGalleryConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the (possibly empty) personal note for the client. */
  onConfirm: (clientNote: string) => void
  pending?: boolean
}

/**
 * Confirmation before a client gallery's FIRST send. The send freezes the
 * source album — "one-time use", the photographer can only upload edited
 * deliverables afterwards. See docs/private-gallery-lifecycle-plan.md §1.ז.
 */
export function SendGalleryConfirmDialog(props: SendGalleryConfirmDialogProps) {
  return (
    <ClientEmailDialog
      {...props}
      title="לשלוח את הגלריה ללקוח?"
      description={
        <>
          אחרי השליחה <strong>לא ניתן להוסיף או למחוק תמונות</strong> בגלריה זו — רק
          להעלות תמונות מעובדות בהמשך. ודאי שכל תמונות האלבום הועלו.
        </>
      }
      confirmLabel="שלח ללקוח"
    />
  )
}

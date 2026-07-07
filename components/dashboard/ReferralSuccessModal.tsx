'use client'

import { useEffect, useState, useTransition } from 'react'
import { dismissReferralPopup } from '@/lib/actions/referral.actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type ReferralSuccessModalProps = {
  open: boolean
}

export function ReferralSuccessModal({ open }: ReferralSuccessModalProps) {
  const [visible, setVisible] = useState(open)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setVisible(open)
  }, [open])

  function handleDismiss() {
    startTransition(async () => {
      await dismissReferralPopup()
      setVisible(false)
    })
  }

  return (
    <Dialog open={visible} onOpenChange={(next) => !next && handleDismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🎉 קיבלת 30 יום נוספים!</DialogTitle>
          <DialogDescription>
            חברה שהזמנת יצרה את הגלריה השנייה שלה. תקופת הניסיון שלך הוארכה ב-30 יום.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleDismiss} disabled={pending}>
            מעולה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

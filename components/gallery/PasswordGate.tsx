'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  requestGalleryPassword,
  verifyGalleryPassword,
} from '@/lib/actions/client-gallery.actions'
import { formatEmailHintMessage, type EmailHint } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type PasswordGateProps = {
  galleryId: string
  galleryTitle: string
  studioName?: string | null
  emailHint?: EmailHint | null
}

export function PasswordGate({
  galleryId,
  galleryTitle,
  studioName,
  emailHint,
}: PasswordGateProps) {
  const [password, setPassword] = useState('')
  const [hint, setHint] = useState(emailHint)
  const [isPending, startTransition] = useTransition()
  const [isSending, startSendTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await verifyGalleryPassword(galleryId, password)
        window.location.reload()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'סיסמה שגויה')
      }
    })
  }

  function handleSendPassword() {
    startSendTransition(async () => {
      try {
        const result = await requestGalleryPassword(galleryId)
        setHint(result.emailHint)
        toast.success(formatEmailHintMessage(result.emailHint))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שליחת הסיסמה נכשלה')
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle>{studioName ?? 'Studio Gallery'}</CardTitle>
          <CardDescription>{galleryTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hint ? (
            <p className="rounded-md border border-[--border] bg-[--muted]/30 px-4 py-3 text-center text-sm text-[--foreground]">
              {formatEmailHintMessage(hint)}
            </p>
          ) : (
            <p className="text-center text-sm text-[--muted]">
              לא נמצא מייל ללקוח — פנו לצלם/ת לקבלת סיסמה
            </p>
          )}

          {hint ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isSending}
              onClick={handleSendPassword}
            >
              {isSending ? 'שולחים...' : 'שלחו לי סיסמה למייל'}
            </Button>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">סיסמת גלריה</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזינו סיסמה"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'נכנסים...' : 'כניסה לגלריה'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

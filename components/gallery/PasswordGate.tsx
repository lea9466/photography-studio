'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  requestGalleryPassword,
  verifyGalleryPassword,
} from '@/lib/actions/client-gallery.actions'
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
  maskedEmail?: string | null
}

function codeSentNotice(masked: string | null) {
  return masked
    ? `קוד כניסה נשלח לכתובת ${masked}`
    : 'קוד כניסה נשלח למייל'
}

export function PasswordGate({
  galleryId,
  galleryTitle,
  studioName,
  maskedEmail,
}: PasswordGateProps) {
  const [step, setStep] = useState<'request' | 'enter-code'>('request')
  const [code, setCode] = useState('')
  const [masked, setMasked] = useState(maskedEmail ?? null)
  const [isPending, startTransition] = useTransition()
  const [isSending, startSendTransition] = useTransition()

  function sendCode(onSuccess?: () => void) {
    startSendTransition(async () => {
      try {
        const result = await requestGalleryPassword(galleryId)
        setMasked(result.maskedEmail)
        toast.success(codeSentNotice(result.maskedEmail))
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שליחת הקוד נכשלה')
      }
    })
  }

  function handleSubmitCode(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await verifyGalleryPassword(galleryId, code)
        window.location.reload()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'קוד שגוי')
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
          {step === 'request' ? (
            <>
              {masked ? (
                <p className="rounded-md border border-[--border] bg-[--muted]/30 px-4 py-3 text-center text-sm text-[--foreground]">
                  כדי להיכנס, נשלח לך קוד כניסה חד-פעמי לכתובת{' '}
                  <span dir="ltr" className="font-medium">
                    {masked}
                  </span>
                </p>
              ) : (
                <p className="text-center text-sm text-[--muted]">
                  לא נמצא מייל ללקוח — פנו לצלם/ת לקבלת גישה
                </p>
              )}

              {masked ? (
                <Button
                  type="button"
                  className="w-full"
                  disabled={isSending}
                  onClick={() => sendCode(() => setStep('enter-code'))}
                >
                  {isSending ? 'שולחים...' : 'שלחו לי קוד כניסה'}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <p className="rounded-md border border-[--border] bg-[--muted]/30 px-4 py-3 text-center text-sm text-[--foreground]">
                {masked ? (
                  <>
                    שלחנו קוד כניסה לכתובת{' '}
                    <span dir="ltr" className="font-medium">
                      {masked}
                    </span>
                  </>
                ) : (
                  'קוד כניסה נשלח למייל'
                )}
              </p>

              <form onSubmit={handleSubmitCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">קוד כניסה</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    dir="ltr"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="הזינו את הקוד שקיבלתם"
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'נכנסים...' : 'כניסה לגלריה'}
                </Button>
              </form>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={isSending}
                onClick={() => sendCode()}
              >
                {isSending ? 'שולחים...' : 'שלחו קוד חדש'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

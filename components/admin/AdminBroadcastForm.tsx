'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  fetchAdminBroadcastRecipientCount,
  prepareAdminBroadcastImageUpload,
  sendAdminBroadcast,
} from '@/lib/actions/admin.actions'
import { compressBrandingFile } from '@/lib/branding-upload-client'
import { getTestimonialImagePreviewUrl } from '@/lib/testimonial-image-url'
import { putToPresignedUrl } from '@/lib/r2/upload-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ImageIcon, Mail, Upload, X } from 'lucide-react'

export function AdminBroadcastForm() {
  const [isPending, startTransition] = useTransition()
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const imagePreviewSrc = imageUrl ? getTestimonialImagePreviewUrl(imageUrl) : null

  useEffect(() => {
    fetchAdminBroadcastRecipientCount()
      .then((result) => setRecipientCount(result.count))
      .catch(() => setRecipientCount(0))
  }, [])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const uploadFile = await compressBrandingFile(file)
      const { uploadUrl, storageRef } = await prepareAdminBroadcastImageUpload({
        fileName: uploadFile.name,
        contentType: uploadFile.type,
        fileSize: uploadFile.size,
      })

      await putToPresignedUrl(uploadUrl, uploadFile)
      setImageUrl(storageRef)
      toast.success('התמונה הועלתה')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בהעלאת התמונה')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!subject.trim() || !message.trim()) {
      toast.error('נא למלא נושא ותוכן')
      return
    }

    const count = recipientCount ?? 0
    if (count === 0) {
      toast.error('אין נמענים עם כתובת מייל')
      return
    }

    const confirmed = window.confirm(
      `לשלוח את המייל ל-${count} לקוחות?\n\nנושא: ${subject.trim()}`
    )
    if (!confirmed) return

    startTransition(async () => {
      try {
        const result = await sendAdminBroadcast({
          subject: subject.trim(),
          message: message.trim(),
          imageUrl,
        })

        if (result.failed > 0) {
          toast.warning(`נשלחו ${result.sent} מיילים, ${result.failed} נכשלו`)
        } else {
          toast.success(`המייל נשלח ל-${result.sent} לקוחות`)
        }

        setSubject('')
        setMessage('')
        setImageUrl(null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה בשליחה')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          שליחת מייל לכל הלקוחות
        </CardTitle>
        <CardDescription>
          {recipientCount === null
            ? 'טוען נמענים...'
            : `המייל יישלח ל-${recipientCount} לקוחות עם כתובת מייל`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="broadcast-subject">נושא</Label>
            <Input
              id="broadcast-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="לדוגמה: עדכון חשוב מהמערכת"
              required
              disabled={isPending || uploadingImage}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-message">תוכן המייל</Label>
            <Textarea
              id="broadcast-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="כתבי את תוכן ההודעה..."
              required
              disabled={isPending || uploadingImage}
              className="resize-y min-h-[140px]"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-[--border] bg-[--card] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label>תמונה (אופציונלי)</Label>
                <p className="mt-1 text-xs text-[--muted]">
                  התמונה תוצג בתוך גוף המייל
                </p>
              </div>
              {imageUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageUrl(null)}
                  disabled={uploadingImage || isPending}
                >
                  <X className="h-4 w-4" />
                  הסר
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[--border] bg-[--background]">
                {imagePreviewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreviewSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[--muted]">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                disabled={uploadingImage || isPending}
              >
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  {uploadingImage ? 'מעלה...' : imageUrl ? 'החלפת תמונה' : 'העלאת תמונה'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleImageUpload}
                    disabled={uploadingImage || isPending}
                  />
                </label>
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending || uploadingImage || recipientCount === 0}
          >
            {isPending ? 'שולח...' : `שליחה ל-${recipientCount ?? 0} לקוחות`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

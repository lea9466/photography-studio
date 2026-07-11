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
import { ImageIcon, Mail, Send, Upload, Users, X } from 'lucide-react'

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
    <Card className="overflow-hidden border-slate-200/80 shadow-md">
      <CardHeader className="border-b border-slate-200/80 bg-gradient-to-l from-rose-50 via-white to-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <Mail className="h-4 w-4" />
              </span>
              שליחת מייל לכל הלקוחות
            </CardTitle>
            <CardDescription className="mt-2 text-slate-600">
              {recipientCount === null
                ? 'טוען נמענים...'
                : `המייל יישלח ל-${recipientCount} לקוחות עם כתובת מייל`}
            </CardDescription>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
            <Users className="h-3.5 w-3.5" />
            {recipientCount ?? 0} נמענים
          </span>
        </div>
      </CardHeader>
      <CardContent className="bg-slate-50/60 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-slate-200/80 border-r-4 border-r-rose-400 bg-white p-4 shadow-sm">
            <Label htmlFor="broadcast-subject" className="text-slate-700">
              נושא
            </Label>
            <Input
              id="broadcast-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="לדוגמה: עדכון חשוב מהמערכת"
              required
              disabled={isPending || uploadingImage}
              className="mt-2 border-slate-200 bg-slate-50 focus-visible:ring-rose-300"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 border-r-4 border-r-violet-400 bg-white p-4 shadow-sm">
            <Label htmlFor="broadcast-message" className="text-slate-700">
              תוכן המייל
            </Label>
            <Textarea
              id="broadcast-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="כתבי את תוכן ההודעה..."
              required
              disabled={isPending || uploadingImage}
              className="mt-2 min-h-[140px] resize-y border-slate-200 bg-slate-50 focus-visible:ring-violet-300"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 border-r-4 border-r-sky-400 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label className="text-slate-700">תמונה (אופציונלי)</Label>
                <p className="mt-1 text-xs text-slate-500">התמונה תוצג בתוך גוף המייל</p>
              </div>
              {imageUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageUrl(null)}
                  disabled={uploadingImage || isPending}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                  הסר
                </Button>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-sky-200 bg-sky-50">
                {imagePreviewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreviewSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sky-400">
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
                className="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
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
            className="h-11 rounded-xl border border-rose-300 bg-rose-500 px-6 text-white shadow-md shadow-rose-500/20 hover:bg-rose-600"
          >
            <Send className="h-4 w-4" />
            {isPending ? 'שולח...' : `שליחה ל-${recipientCount ?? 0} לקוחות`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

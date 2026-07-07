'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  prepareFeedbackImageUpload,
  submitFeedback,
} from '@/lib/actions/feedback.actions'
import { compressBrandingFile } from '@/lib/branding-upload-client'
import { getTestimonialImagePreviewUrl } from '@/lib/testimonial-image-url'
import { putToPresignedUrl } from '@/lib/r2/upload-client'
import type { FeedbackType } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bug, ImageIcon, Lightbulb, MessageSquare, Mail, Upload, X } from 'lucide-react'

const TYPES: { value: FeedbackType; label: string; description: string }[] = [
  { value: 'תקלה', label: 'דיווח על באג', description: 'משהו לא עובד כמו שצריך' },
  { value: 'פיצ׳ר', label: 'בקשת פיצ׳ר', description: 'רעיון לשיפור או יכולת חדשה' },
  { value: 'משוב', label: 'הערות כלליות', description: 'משוב, שבח או הצעה' },
  { value: 'אחר', label: 'אחר', description: 'כל נושא אחר' },
]

type DashboardContactFormProps = {
  defaultName?: string
  defaultEmail?: string
  defaultStudio?: string
}

export function DashboardContactForm({
  defaultName = '',
  defaultEmail = '',
  defaultStudio = '',
}: DashboardContactFormProps) {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [type, setType] = useState<FeedbackType>('משוב')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const selectedType = TYPES.find((item) => item.value === type)
  const imagePreviewSrc = imageUrl ? getTestimonialImagePreviewUrl(imageUrl) : null

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const uploadFile = await compressBrandingFile(file)
      const { uploadUrl, storageRef } = await prepareFeedbackImageUpload({
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
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await submitFeedback({
          type,
          name: String(form.get('name')),
          email: String(form.get('email')),
          message: String(form.get('message')),
          studio: String(form.get('studio') || ''),
          imageUrl,
        })
        setSent(true)
        setImageUrl(null)
        toast.success('ההודעה נשלחה בהצלחה')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה בשליחה')
      }
    })
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-[--border] bg-white dark:bg-zinc-900 p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Mail className="h-7 w-7" />
        </div>
        <p className="text-lg font-semibold text-[--foreground]">תודה על הפנייה!</p>
        <p className="mt-2 text-sm text-[--muted]">
          ההודעה נשלחה אלינו. נחזור אליך בהקדם האפשר.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => setSent(false)}
        >
          שליחת פנייה נוספת
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#e8d5c4] bg-[#fdf8f4] px-5 py-4 text-sm text-[#5c4a3d] dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <p>
          כאן אפשר לשלוח הערות, לדווח על באגים או לבקש פיצ׳רים חדשים. אשמח מאוד לשמוע מכן!
        </p>
        <p className="mt-2 text-[--muted]">
          ההודעה תישלח ישירות לצוות הפיתוח — נחזור אליך בהקדם.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[--border] bg-white dark:bg-zinc-900 p-6 md:p-8 space-y-6"
      >
        <div className="space-y-2" dir="rtl">
          <Label>סוג הפנייה</Label>
          <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
            <SelectTrigger className="bg-white dark:bg-zinc-900 border-[--border] text-right flex-row-reverse justify-between shadow-none">
              <SelectValue placeholder="בחרי סוג פנייה" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-[--border] shadow-lg">
              {TYPES.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="text-right pr-2 pl-8"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedType ? (
            <p className="text-xs text-[--muted]">{selectedType.description}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-name">שם</Label>
            <Input
              id="contact-name"
              name="name"
              defaultValue={defaultName}
              required
              className="bg-white dark:bg-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">מייל</Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              dir="ltr"
              defaultValue={defaultEmail}
              required
              className="bg-white dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-studio">שם הסטודיו (אופציונלי)</Label>
          <Input
            id="contact-studio"
            name="studio"
            defaultValue={defaultStudio}
            className="bg-white dark:bg-zinc-900"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-message">הודעה</Label>
          <Textarea
            id="contact-message"
            name="message"
            rows={6}
            required
            placeholder="ספרי לנו מה קרה, מה היית רוצה לראות, או כל הערה אחרת..."
            className="bg-white dark:bg-zinc-900 resize-y min-h-[140px]"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-[#c9c5cd] bg-[#fdf8f4] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Label>תמונה מצורפת (אופציונלי)</Label>
              <p className="mt-1 text-xs text-[--muted]">
                שימושי לצילום מסך של באג או להמחשת הבקשה
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
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[#c9c5cd] bg-white">
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
            <Button type="button" variant="outline" size="sm" asChild disabled={uploadingImage || isPending}>
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

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Button
            type="submit"
            disabled={isPending || uploadingImage}
            className="bg-[#7D3A52] text-white hover:bg-[#6a2f44] px-8"
          >
            {isPending ? 'שולח...' : 'שליחת הודעה'}
          </Button>
          <div className="flex flex-wrap gap-4 text-xs text-[--muted]">
            <span className="inline-flex items-center gap-1">
              <Bug className="h-3.5 w-3.5" />
              באגים
            </span>
            <span className="inline-flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" />
              בקשות פיצ׳ר
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              הערות
            </span>
          </div>
        </div>
      </form>
    </div>
  )
}

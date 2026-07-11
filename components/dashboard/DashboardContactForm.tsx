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
import { Bug, ImageIcon, Lightbulb, Mail, MessageSquare, Send, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const INPUT_CLASS =
  'border-[#7D3A52]/10 bg-[#7D3A52]/[0.04] shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:border-[#7D3A52]/25 focus-visible:bg-[#7D3A52]/[0.07] focus-visible:ring-2 focus-visible:ring-[#7D3A52]/10'
const ACCENT_BUTTON_CLASS =
  'bg-[#7D3A52] text-white shadow-md shadow-[#7D3A52]/25 hover:bg-[#6a2f44] focus-visible:ring-[#7D3A52]/40'

const TYPES: { value: FeedbackType; label: string; description: string }[] = [
  { value: 'תקלה', label: 'דיווח על באג', description: 'משהו לא עובד כמו שצריך' },
  { value: 'פיצ׳ר', label: 'בקשת פיצ׳ר', description: 'רעיון לשיפור או יכולת חדשה' },
  { value: 'משוב', label: 'הערות כלליות', description: 'משוב, שבח או הצעה' },
  { value: 'אחר', label: 'אחר', description: 'כל נושא אחר' },
]

function ContactSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative space-y-7 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-5 right-0 w-0.5 rounded-full bg-gradient-to-b from-[#7D3A52]/30 via-[#7D3A52]/10 to-transparent"
        aria-hidden
      />
      {children}
    </section>
  )
}

function ContactSubPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'space-y-5 rounded-xl border border-[--border]/60 bg-white/80 p-5 shadow-sm shadow-[#7D3A52]/[0.03] md:p-6',
        className
      )}
    >
      {children}
    </div>
  )
}

function ContactSectionHeader({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: typeof Mail
  title: string
  description?: string
  index?: number
}) {
  return (
    <div className="space-y-3 border-b border-[#7D3A52]/10 pb-5">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {index !== undefined ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7D3A52]/10 px-1.5 text-[10px] font-semibold text-[#7D3A52]">
                {index}
              </span>
            ) : null}
            <h2 className="text-lg font-semibold text-[--foreground]">{title}</h2>
          </div>
          {description ? (
            <p className="text-xs leading-relaxed text-[--muted]">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

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
      <ContactSection>
        <ContactSubPanel className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52]">
            <Mail className="h-7 w-7" />
          </div>
          <p className="text-lg font-semibold text-[--foreground]">תודה על הפנייה!</p>
          <p className="text-sm text-[--muted]">
            ההודעה נשלחה אלינו. נחזור אליך בהקדם האפשר.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-2 border-[#7D3A52]/20 text-[#7D3A52] hover:bg-[#7D3A52]/5"
            onClick={() => setSent(false)}
          >
            שליחת פנייה נוספת
          </Button>
        </ContactSubPanel>
      </ContactSection>
    )
  }

  return (
    <ContactSection>
      <ContactSectionHeader
        index={1}
        icon={Send}
        title="שליחת פנייה"
        description="כאן אפשר לשלוח הערות, לדווח על באגים או לבקש פיצ׳רים חדשים. ההודעה תישלח ישירות לצוות הפיתוח."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2" dir="rtl">
          <Label>סוג הפנייה</Label>
          <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
            <SelectTrigger className={cn(INPUT_CLASS, 'flex-row-reverse justify-between text-right shadow-none')}>
              <SelectValue placeholder="בחרי סוג פנייה" />
            </SelectTrigger>
            <SelectContent className="border-[--border] bg-white shadow-lg">
              {TYPES.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="pr-2 pl-8 text-right"
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

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-name">שם</Label>
            <Input
              id="contact-name"
              name="name"
              defaultValue={defaultName}
              required
              className={INPUT_CLASS}
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
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-studio">שם הסטודיו (אופציונלי)</Label>
          <Input
            id="contact-studio"
            name="studio"
            defaultValue={defaultStudio}
            className={INPUT_CLASS}
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
            className={cn(INPUT_CLASS, 'min-h-[140px] resize-y')}
          />
        </div>

        <ContactSubPanel className="space-y-4">
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
                variant="outline"
                size="sm"
                onClick={() => setImageUrl(null)}
                disabled={uploadingImage || isPending}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                הסר
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#7D3A52]/15 bg-[#7D3A52]/[0.03]">
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
              className="border-[#7D3A52]/15 hover:bg-[#7D3A52]/5"
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
        </ContactSubPanel>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Button
            type="submit"
            disabled={isPending || uploadingImage}
            className={cn(ACCENT_BUTTON_CLASS, 'px-8')}
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
    </ContactSection>
  )
}

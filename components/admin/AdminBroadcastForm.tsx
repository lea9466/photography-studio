'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  fetchAdminBroadcastRecipientCount,
  prepareAdminBroadcastImageUpload,
  sendAdminBroadcast,
} from '@/lib/actions/admin.actions'
import type { AdminBroadcastRecipientFilters } from '@/lib/admin/broadcast-filters'
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
import { cn } from '@/lib/utils'
import { Filter, ImageIcon, Layers, Mail, Send, Upload, Users, X } from 'lucide-react'

const FILTER_OPTIONS: {
  key: keyof AdminBroadcastRecipientFilters
  label: string
  description: string
}[] = [
  {
    key: 'requireGallery',
    label: 'יש לפחות גלריה אחת',
    description: 'רק סטודיואים שכבר יצרו גלריה',
  },
  {
    key: 'excludeGallery',
    label: 'אין אף גלריה',
    description: 'רק סטודיואים שעדיין לא יצרו גלריה',
  },
  {
    key: 'requirePost',
    label: 'יש לפחות פוסט אחד',
    description: 'רק סטודיואים עם פוסט בבלוג',
  },
  {
    key: 'requireHeroImage',
    label: 'יש תמונת Hero',
    description: 'רק סטודיואים עם תמונת הירו בדף הבית',
  },
]

const EMPTY_FILTERS: Required<AdminBroadcastRecipientFilters> = {
  requireGallery: false,
  excludeGallery: false,
  requirePost: false,
  requireHeroImage: false,
  group: null,
}

const GROUP_OPTIONS: { key: 'A' | 'B'; label: string }[] = [
  { key: 'A', label: 'קבוצה A' },
  { key: 'B', label: 'קבוצה B' },
]

const MUTUALLY_EXCLUSIVE_FILTERS: Partial<
  Record<keyof AdminBroadcastRecipientFilters, keyof AdminBroadcastRecipientFilters>
> = {
  requireGallery: 'excludeGallery',
  excludeGallery: 'requireGallery',
}

export function AdminBroadcastForm() {
  const [isPending, startTransition] = useTransition()
  const [isCounting, startCountTransition] = useTransition()
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const imagePreviewSrc = imageUrl ? getTestimonialImagePreviewUrl(imageUrl) : null
  const activeFilterCount =
    FILTER_OPTIONS.filter((option) => filters[option.key]).length + (filters.group ? 1 : 0)

  function refreshRecipientCount(nextFilters: AdminBroadcastRecipientFilters) {
    startCountTransition(async () => {
      try {
        const result = await fetchAdminBroadcastRecipientCount(nextFilters)
        setRecipientCount(result.count)
      } catch {
        setRecipientCount(0)
      }
    })
  }

  useEffect(() => {
    refreshRecipientCount(EMPTY_FILTERS)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial count only
  }, [])

  function toggleFilter(key: keyof AdminBroadcastRecipientFilters) {
    const turningOn = !filters[key]
    const opposite = MUTUALLY_EXCLUSIVE_FILTERS[key]
    const nextFilters = {
      ...filters,
      [key]: turningOn,
      ...(turningOn && opposite ? { [opposite]: false } : {}),
    }
    setFilters(nextFilters)
    setRecipientCount(null)
    refreshRecipientCount(nextFilters)
  }

  function setGroup(group: 'A' | 'B' | null) {
    const nextFilters = {
      ...filters,
      group: filters.group === group ? null : group,
    }
    setFilters(nextFilters)
    setRecipientCount(null)
    refreshRecipientCount(nextFilters)
  }

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
      toast.error('אין נמענים שתואמים לסינון שנבחר')
      return
    }

    const activeLabels = [
      ...FILTER_OPTIONS.filter((option) => filters[option.key]).map((option) => option.label),
      ...(filters.group
        ? [GROUP_OPTIONS.find((option) => option.key === filters.group)?.label ?? '']
        : []),
    ].filter(Boolean)

    const filterSummary =
      activeLabels.length > 0
        ? `\nסינון: ${activeLabels.join(', ')}`
        : '\nסינון: כל הסטודיואים עם מייל'

    const limitWarning =
      count > 100
        ? '\n\n⚠️ שימי לב: ריסנד מגביל ל-100 מיילים ביום — כדאי לפצל לקבוצות A ו-B ולשלוח ביומיים נפרדים.'
        : ''

    const confirmed = window.confirm(
      `לשלוח את המייל ל-${count} לקוחות?${filterSummary}\n\nנושא: ${subject.trim()}${limitWarning}`
    )
    if (!confirmed) return

    startTransition(async () => {
      try {
        const result = await sendAdminBroadcast({
          subject: subject.trim(),
          message: message.trim(),
          imageUrl,
          filters,
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
              שליחת מייל ללקוחות
            </CardTitle>
            <CardDescription className="mt-2 text-slate-600">
              {recipientCount === null || isCounting
                ? 'טוען נמענים...'
                : activeFilterCount > 0
                  ? `המייל יישלח ל-${recipientCount} סטודיואים לפי הסינון שנבחר`
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
          <div className="rounded-2xl border border-slate-200/80 border-r-4 border-r-amber-400 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Filter className="h-4 w-4" />
              </span>
              <div>
                <Label className="text-slate-700">סינון נמענים</Label>
                <p className="mt-1 text-xs text-slate-500">
                  אפשר לבחור כמה תנאים יחד — יישלח רק למי שעומד בכולם. בלי סינון = כולם.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-1">
              {FILTER_OPTIONS.map((option) => {
                const checked = Boolean(filters[option.key])
                return (
                  <label
                    key={option.key}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors',
                      checked
                        ? 'border-amber-300 bg-amber-50/80'
                        : 'border-slate-200 bg-slate-50/70 hover:border-amber-200'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFilter(option.key)}
                      disabled={isPending || uploadingImage || isCounting}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-300"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {option.description}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 border-r-4 border-r-emerald-400 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <Label className="text-slate-700">פיצול לקבוצות שליחה</Label>
                <p className="mt-1 text-xs text-slate-500">
                  ריסנד מגביל ל-100 מיילים ביום. אפשר לפצל את כל הנמענים לשתי קבוצות קבועות
                  (לפי מזהה המשתמש, לא משתנה) ולשלוח לכל קבוצה ביום נפרד בלי לחפוף או לדלג על
                  אף אחד.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGroup(null)}
                disabled={isPending || uploadingImage || isCounting}
                className={cn(
                  'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                  !filters.group
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:border-emerald-200'
                )}
              >
                כולם
              </button>
              {GROUP_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setGroup(option.key)}
                  disabled={isPending || uploadingImage || isCounting}
                  className={cn(
                    'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                    filters.group === option.key
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:border-emerald-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

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
            disabled={
              isPending || uploadingImage || isCounting || recipientCount === 0
            }
            className="h-11 rounded-xl border border-rose-300 bg-rose-500 px-6 text-white shadow-md shadow-rose-500/20 hover:bg-rose-600"
          >
            <Send className="h-4 w-4" />
            {isPending
              ? 'שולח...'
              : isCounting
                ? 'מחשב נמענים...'
                : `שליחה ל-${recipientCount ?? 0} לקוחות`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

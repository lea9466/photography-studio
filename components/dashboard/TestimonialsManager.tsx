'use client'

import { useEffect, useState, useTransition } from 'react'
import { ImageIcon, Pencil, Plus, Trash2, Star, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  createTestimonial,
  deleteTestimonial,
  getTestimonialPhotoOptions,
  prepareTestimonialImageUpload,
  updateTestimonial,
  updateTestimonialsSectionTitle,
  updateTestimonialLayoutType,
  type TestimonialPhotoOption,
} from '@/lib/actions/testimonials.actions'
import { TESTIMONIALS_SECTION_DEFAULTS } from '@/lib/testimonials-section-copy'
import { compressBrandingFile } from '@/lib/branding-upload-client'
import { getBrandingPreviewUrl } from '@/lib/branding-preview-url'
import { getTestimonialImagePreviewUrl } from '@/lib/testimonial-image-url'
import { putToPresignedUrl } from '@/lib/r2/upload-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomToggle } from '@/components/ui/custom-toggle'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

type Testimonial = {
  id: string
  user_id: string
  title: string
  content: string
  shoot_type: string | null
  review_date: string | null
  created_at: string
  is_featured: boolean
  sort_order: number
  image_url: string | null
}

type TestimonialsManagerProps = {
  initialTestimonials: Testimonial[]
  photographerLogoUrl?: string | null
  initialSectionTitle: string | null
  initialLayoutType: string | null
  selectedTheme: string
}

type TestimonialFormState = {
  title: string
  content: string
  shootType: string
  reviewDate: string
  isFeatured: boolean
  imageUrl: string
}

const EMPTY_FORM: TestimonialFormState = {
  title: '',
  content: '',
  shootType: '',
  reviewDate: '',
  isFeatured: false,
  imageUrl: '',
}

function testimonialToForm(testimonial: Testimonial): TestimonialFormState {
  return {
    title: testimonial.title,
    content: testimonial.content,
    shootType: testimonial.shoot_type ?? '',
    reviewDate: testimonial.review_date ?? '',
    isFeatured: testimonial.is_featured,
    imageUrl: testimonial.image_url ?? '',
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function previewForImageRef(imageRef: string, logoUrl?: string | null) {
  if (imageRef) return getTestimonialImagePreviewUrl(imageRef)
  if (logoUrl) return getBrandingPreviewUrl(logoUrl)
  return null
}

export function TestimonialsManager({
  initialTestimonials,
  photographerLogoUrl,
  initialSectionTitle,
  initialLayoutType,
  selectedTheme,
}: TestimonialsManagerProps) {
  const [testimonials, setTestimonials] = useState(initialTestimonials)
  const [sectionTitle, setSectionTitle] = useState(initialSectionTitle ?? '')
  const [layoutType, setLayoutType] = useState(initialLayoutType ?? 'carousel')
  const [isSectionPending, startSectionTransition] = useTransition()
  const [isLayoutPending, startLayoutTransition] = useTransition()
  const themeDefault =
    TESTIMONIALS_SECTION_DEFAULTS[selectedTheme] ?? TESTIMONIALS_SECTION_DEFAULTS.elegant
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TestimonialFormState>(EMPTY_FORM)
  const [photoOptions, setPhotoOptions] = useState<TestimonialPhotoOption[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (!pickerOpen) return

    setLoadingPhotos(true)
    getTestimonialPhotoOptions()
      .then(setPhotoOptions)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'שגיאה בטעינת תמונות')
      })
      .finally(() => setLoadingPhotos(false))
  }, [pickerOpen])

  function openCreateDialog() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEditDialog(testimonial: Testimonial) {
    setEditingId(testimonial.id)
    setForm(testimonialToForm(testimonial))
    setDialogOpen(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const uploadFile = await compressBrandingFile(file)
      const { uploadUrl, storageRef } = await prepareTestimonialImageUpload({
        fileName: uploadFile.name,
        contentType: uploadFile.type,
        fileSize: uploadFile.size,
      })

      await putToPresignedUrl(uploadUrl, uploadFile)
      setForm((current) => ({ ...current, imageUrl: storageRef }))
      toast.success('התמונה הועלתה')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בהעלאת התמונה')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        const imagePayload = form.imageUrl || null

        if (editingId) {
          await updateTestimonial(editingId, {
            title: form.title,
            content: form.content,
            shootType: form.shootType || undefined,
            reviewDate: form.reviewDate || undefined,
            isFeatured: form.isFeatured,
            imageUrl: imagePayload,
          })
          setTestimonials((current) =>
            current.map((t) =>
              t.id === editingId
                ? {
                    ...t,
                    title: form.title,
                    content: form.content,
                    shoot_type: form.shootType || null,
                    review_date: form.reviewDate || null,
                    is_featured: form.isFeatured,
                    image_url: imagePayload,
                  }
                : t
            )
          )
          toast.success('התגובה עודכנה')
        } else {
          await createTestimonial({
            title: form.title,
            content: form.content,
            shootType: form.shootType || undefined,
            reviewDate: form.reviewDate || undefined,
            isFeatured: form.isFeatured,
            imageUrl: imagePayload,
          })
          const response = await fetch('/api/testimonials')
          const data = await response.json()
          setTestimonials(data)
          toast.success('התגובה נוצרה')
        }
        setDialogOpen(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function handleDelete(testimonialId: string) {
    if (!window.confirm('למחוק את התגובה?')) {
      return
    }

    startTransition(async () => {
      try {
        await deleteTestimonial(testimonialId)
        setTestimonials((current) => current.filter((t) => t.id !== testimonialId))
        toast.success('התגובה נמחקה')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  const formPreviewSrc = previewForImageRef(form.imageUrl, photographerLogoUrl)

  function handleSectionTitleSave() {
    startSectionTransition(async () => {
      try {
        const updated = await updateTestimonialsSectionTitle({
          title: sectionTitle,
        })
        setSectionTitle(updated.testimonials_title ?? '')
        toast.success('כותרת הסקשן נשמרה')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function handleLayoutTypeSave() {
    startLayoutTransition(async () => {
      try {
        const updated = await updateTestimonialLayoutType({
          layoutType: layoutType as 'carousel' | 'marquee',
        })
        setLayoutType(updated.testimonial_layout_type)
        toast.success('סוג התצוגה נשמר')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[--border] bg-[--dashboard-surface] p-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[--foreground]">כותרת סקשן התגובות</h2>
          <p className="mt-1 text-sm text-[--muted]">
            הטקסט מוצג בדף הבית הציבורי. אם השדה ריק, יוצג ברירת המחדל של ערכת העיצוב הנוכחית.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="testimonials-section-title">כותרת</Label>
          <Input
            id="testimonials-section-title"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder={themeDefault}
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleSectionTitleSave}
            disabled={isSectionPending}
          >
            {isSectionPending ? 'שומר...' : 'שמור כותרת'}
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-[--border] bg-[--dashboard-surface] p-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[--foreground]">סוג תצוגת תגובות</h2>
          <p className="mt-1 text-sm text-[--muted]">
            בחר איך התגובות יוצגו בדף הבית הציבורי
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="testimonial-layout-type">סוג תצוגה</Label>
          <select
            id="testimonial-layout-type"
            value={layoutType}
            onChange={(e) => setLayoutType(e.target.value)}
            className="w-full rounded-md border border-[--border] bg-[--dashboard-surface] px-3 py-2 text-sm text-[--foreground]"
          >
            <option value="carousel">קרוסלה (Carousel)</option>
            <option value="marquee">סרט נע (Smooth Marquee)</option>
          </select>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleLayoutTypeSave}
            disabled={isLayoutPending}
          >
            {isLayoutPending ? 'שומר...' : 'שמור סוג תצוגה'}
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-[--border] bg-[--dashboard-surface] px-4 py-3 text-sm text-[--muted]">
        סקשן התגובות מוצג בדף הבית הציבורי רק כשיש לפחות תגובה אחת. לכל תגובה אפשר לבחור תמונה
        מהאלבום — אם לא נבחרה תמונה, יוצג הלוגו שלך.
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[--muted]">
          {testimonials.length === 0
            ? 'עדיין אין תגובות — הוסיפי את הראשונה'
            : `${testimonials.length} תגובות`}
        </p>
        <Button type="button" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          תגובה חדשה
        </Button>
      </div>

      {testimonials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--border] px-6 py-12 text-center text-sm text-[--muted]">
          <p>עדיין אין תגובות — בינתיים סקשן התגובות לא יופיע בדף הבית.</p>
          <p className="mt-2">לדוגמה: &quot;הצילומים יצאו פשוט מדהימים! ממליצה בחום&quot; — דנה, חתונה</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((testimonial) => {
            const thumbSrc = previewForImageRef(
              testimonial.image_url ?? '',
              photographerLogoUrl
            )

            return (
              <Card key={testimonial.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {thumbSrc ? (
                    <div className="h-16 w-16 shrink-0 overflow-hidden border border-[--border] bg-[--dashboard-surface]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbSrc}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-dashed border-[--border] bg-[--dashboard-surface] text-[--muted]">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{testimonial.title}</span>
                      {testimonial.is_featured && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3" />
                          מומלצת
                        </Badge>
                      )}
                      {testimonial.shoot_type && (
                        <Badge variant="outline">{testimonial.shoot_type}</Badge>
                      )}
                      <span className="text-xs text-[--muted]">
                        {formatDate(testimonial.review_date ?? testimonial.created_at)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{testimonial.content}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(testimonial)}
                      disabled={isPending}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(testimonial.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'עריכת תגובה' : 'תגובה חדשה'}</DialogTitle>
            <DialogDescription>
              כותרת, תוכן, תאריך, סוג הצילום ותמונה מהאלבום
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">כותרת</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) =>
                  setForm((current) => ({ ...current, title: e.target.value }))
                }
                placeholder="חוויה מדהימה!"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shoot-type">סוג צילום (אופציונלי)</Label>
                <Input
                  id="shoot-type"
                  value={form.shootType}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, shootType: e.target.value }))
                  }
                  placeholder="חתונה, פורטרטים, משפחה..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-date">תאריך (אופציונלי)</Label>
                <Input
                  id="review-date"
                  type="date"
                  value={form.reviewDate}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, reviewDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">תוכן התגובה</Label>
              <Textarea
                id="content"
                rows={5}
                value={form.content}
                onChange={(e) =>
                  setForm((current) => ({ ...current, content: e.target.value }))
                }
                placeholder="הצילומים יצאו פשוט מדהימים! ממליצה בחום..."
              />
            </div>

            <div className="space-y-3 rounded-lg border border-[--border] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>תמונה לתגובה</Label>
                  <p className="text-xs text-[--muted]">
                    תמונה קטנה משמאל למטה. בלי תמונה — יוצג הלוגו.
                  </p>
                </div>
                {form.imageUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm((current) => ({ ...current, imageUrl: '' }))}
                  >
                    <X className="h-4 w-4" />
                    הסר
                  </Button>
                ) : null}
              </div>

              <div className="flex items-end gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-[--border] bg-[--dashboard-surface]">
                  {formPreviewSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formPreviewSrc}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[--muted]">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                    disabled={uploadingImage}
                  >
                    <ImageIcon className="h-4 w-4" />
                    בחרי מהאלבום
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild disabled={uploadingImage}>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? 'מעלה...' : 'העלאה מהמחשב'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-[--border] px-4 py-3">
              <div>
                <Label htmlFor="testimonial-featured">מומלצת</Label>
                <p className="text-xs text-[--muted]">
                  תגובות מומלצות יופיעו ראשונות בדף הציבורי
                </p>
              </div>
              <CustomToggle
                checked={form.isFeatured}
                onCheckedChange={(checked: boolean) =>
                  setForm((current) => ({ ...current, isFeatured: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              ביטול
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending || uploadingImage}>
              {isPending ? 'שומר...' : editingId ? 'שמור שינויים' : 'צור תגובה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>בחירת תמונה מהאלבום</DialogTitle>
            <DialogDescription>בחרי תמונה מהגלריות שלך לתצוגה בתגובה</DialogDescription>
          </DialogHeader>

          {loadingPhotos ? (
            <p className="py-8 text-center text-sm text-[--muted]">טוען תמונות...</p>
          ) : photoOptions.length === 0 ? (
            <p className="py-8 text-center text-sm text-[--muted]">
              אין תמונות בגלריות. אפשר להעלות תמונה מהמחשב בטופס התגובה.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photoOptions.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  className={`group relative aspect-square overflow-hidden border-2 transition ${
                    form.imageUrl === photo.storageRef
                      ? 'border-[--primary]'
                      : 'border-transparent hover:border-[--border]'
                  }`}
                  onClick={() => {
                    setForm((current) => ({ ...current, imageUrl: photo.storageRef }))
                    setPickerOpen(false)
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-1 text-[10px] text-white truncate">
                    {photo.galleryTitle}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

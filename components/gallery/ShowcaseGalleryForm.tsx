'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Send, Image as ImageIcon, X } from 'lucide-react'
import { createShowcaseGallery } from '@/lib/actions/gallery.actions'
import { uploadGalleryCoverFile } from '@/lib/cover-upload-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type ShowcaseGalleryFormProps = {
  defaultWatermarkText?: string
}

/**
 * Creation of a public showcase gallery — a single screen, not a wizard. A
 * showcase gallery only has three settings (title, cover, watermark); the
 * private client flow keeps its own multi-step wizard.
 */
export function ShowcaseGalleryForm({ defaultWatermarkText = '' }: ShowcaseGalleryFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [watermarkText, setWatermarkText] = useState(defaultWatermarkText)
  const [autoApplyWatermark, setAutoApplyWatermark] = useState(true)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!title.trim()) {
      toast.error('שם הגלריה הוא שדה חובה')
      return
    }

    startTransition(async () => {
      try {
        let coverImage: string | undefined
        if (coverFile) {
          try {
            coverImage = await uploadGalleryCoverFile(coverFile)
          } catch (error) {
            console.error('Error uploading cover image:', error)
            toast.error(error instanceof Error ? error.message : 'העלאת תמונת השער נכשלה')
            return
          }
        }

        const gallery = await createShowcaseGallery({
          title: title.trim(),
          coverImage,
          watermarkText: watermarkText.trim() || undefined,
          autoApplyWatermark,
        })

        toast.success('הגלריה נוצרה בהצלחה')
        router.push(`/dashboard/galleries/${gallery.id}/photos`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'יצירת הגלריה נכשלה')
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 rounded-2xl border border-[#c9c5cd] bg-white p-6 sm:p-8">
      <div className="space-y-2">
        <Label htmlFor="showcase-title" className="text-[#100d1f]">
          שם הגלריה
        </Label>
        <p className="text-sm text-[#48464c]/70">השם שיופיע בכרטיס הגלריה באתר התדמית.</p>
        <Input
          id="showcase-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="למשל: חתונות / ניו בורן"
          className="h-12 border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[#100d1f]">תמונת שער</Label>
        <p className="text-sm text-[#48464c]/70">
          מוצגת בכרטיס הגלריה בדף הבית. אם לא תוזן — תוצג התמונה הראשונה מהגלריה.
        </p>
        {coverFile ? (
          <div className="space-y-3">
            <div className="relative aspect-video overflow-hidden rounded-lg border border-[#c9c5cd]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(coverFile)}
                alt="תמונת שער"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCoverFile(null)}
                disabled={isPending}
                className="absolute left-2 top-2 rounded-full bg-white/90 p-1 text-[#100d1f] shadow-sm transition-colors hover:bg-white"
                aria-label="הסר תמונה"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-[#c9c5cd] p-6 text-center transition-colors hover:border-[#6b2d43]">
            <input
              type="file"
              accept="image/*"
              id="showcase-cover-upload"
              className="hidden"
              disabled={isPending}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setCoverFile(file)
              }}
            />
            <label
              htmlFor="showcase-cover-upload"
              className="flex cursor-pointer flex-col items-center gap-2"
            >
              <ImageIcon className="h-8 w-8 text-[#48464c]" />
              <span className="text-sm text-[#48464c]">לחצי לבחירת תמונה</span>
              <span className="text-xs text-[#48464c]">מומלץ תמונה רוחבית</span>
            </label>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="showcase-watermark" className="text-[#100d1f]">
            סימן מים
          </Label>
          <Input
            id="showcase-watermark"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="למשל: © שם הסטודיו"
            className="h-12 border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]"
          />
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-[#c9c5cd] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Label className="text-[#100d1f]">החל סימן מים אוטומטי</Label>
            <p className="mt-1 text-xs text-[#48464c]">
              בעת העלאת תמונות, הטקסט יוחל על גרסת התצוגה
            </p>
          </div>
          <Switch checked={autoApplyWatermark} onCheckedChange={setAutoApplyWatermark} />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="h-12 w-full bg-[#6b2d43] text-base font-bold text-white hover:bg-[#5a2538] sm:w-auto sm:px-10"
      >
        {isPending ? (
          'שומר גלריה...'
        ) : (
          <>
            <Send className="ml-2 h-5 w-5" />
            צור גלריה והמשך להעלאת תמונות
          </>
        )}
      </Button>
    </div>
  )
}

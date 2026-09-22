'use client'

import { ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { useObjectUrl } from '@/lib/hooks/use-object-url'
import {
  CLIENT_COVER_SOURCE_TYPES,
  validateCoverSourceFile,
} from '@/lib/private-galleries/client-cover'

type ClientGalleryCoverPickerProps = {
  /** Cover already saved on the gallery (a resolved URL) — shown until a new file is picked. */
  currentUrl?: string | null
  /** The newly picked file, not uploaded yet. */
  file: File | null
  onFileChange: (file: File | null) => void
  inputId: string
  disabled?: boolean
}

/**
 * Picks (but does not upload) a client-gallery cover image. Used by the
 * creation wizard, where the upload happens after the gallery exists, and by
 * the gallery settings card, which uploads on an explicit save.
 */
export function ClientGalleryCoverPicker({
  currentUrl = null,
  file,
  onFileChange,
  inputId,
  disabled = false,
}: ClientGalleryCoverPickerProps) {
  const pickedUrl = useObjectUrl(file)
  const previewUrl = pickedUrl ?? currentUrl

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return

    const problem = validateCoverSourceFile(picked)
    if (problem) {
      toast.error(problem)
      return
    }
    onFileChange(picked)
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-[#c9c5cd] bg-[#f7f2f4]">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="תצוגה מקדימה של תמונת הכיסוי" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[#48464c]">
            <ImagePlus className="h-7 w-7" aria-hidden />
            <span className="text-sm">עדיין לא נבחרה תמונת כיסוי</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#100d1f] bg-white px-4 py-2 text-sm font-semibold text-[#100d1f] transition-colors hover:bg-[#f7f2f4] ${
            disabled ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          {previewUrl ? 'החלפת תמונה' : 'בחירת תמונה'}
        </label>
        <input
          id={inputId}
          type="file"
          accept={CLIENT_COVER_SOURCE_TYPES.join(',')}
          className="sr-only"
          onChange={handleChange}
          disabled={disabled}
        />
        {file ? (
          <button
            type="button"
            onClick={() => onFileChange(null)}
            disabled={disabled}
            className="rounded-xl px-3 py-2 text-sm font-medium text-[#48464c] hover:bg-[#f7f2f4] disabled:opacity-50"
          >
            ביטול בחירה
          </button>
        ) : null}
      </div>
    </div>
  )
}

'use client'

import { ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { validateLogoSourceFile } from '@/lib/client-page-logo-upload'
import { PRIMARY_IMAGE_ALLOWED_TYPES } from '@/lib/media-upload-limits'

type ClientPageLogoFieldProps = {
  /** The logo currently in effect (a picked file's blob URL, the saved override, or the site logo). */
  previewUrl: string | null
  /** The newly picked file, not uploaded yet. */
  file: File | null
  onFileChange: (file: File | null) => void
  inputId: string
  disabled?: boolean
}

/** Picks (but does not upload) a logo for client pages, with a preview of what is in effect. */
export function ClientPageLogoField({
  previewUrl,
  file,
  onFileChange,
  inputId,
  disabled = false,
}: ClientPageLogoFieldProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return

    const problem = validateLogoSourceFile(picked)
    if (problem) {
      toast.error(problem)
      return
    }
    onFileChange(picked)
  }

  return (
    <div className="space-y-3">
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-[#c9c5cd] bg-[#f7f2f4] p-4">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="תצוגה מקדימה של הלוגו" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-sm text-[#48464c]">אין לוגו</span>
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
          {previewUrl ? 'החלפת לוגו' : 'העלאת לוגו'}
        </label>
        <input
          id={inputId}
          type="file"
          accept={PRIMARY_IMAGE_ALLOWED_TYPES.join(',')}
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

'use client'

import { useState } from 'react'

type UploadResult =
  | {
      ok: true
      message: string
      key: string
      bucket: string
      galleryId: string
      isCompressed: boolean
    }
  | { ok: false; message: string }

export default function R2UploadTest() {
  const [file, setFile] = useState<File | null>(null)
  const [galleryId, setGalleryId] = useState('')
  const [isCompressed, setIsCompressed] = useState(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setResult({ ok: false, message: 'בחרי קובץ להעלאה' })
      return
    }
    if (!galleryId.trim()) {
      setResult({ ok: false, message: 'הזיני מזהה גלריה (galleryId)' })
      return
    }

    setPending(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('galleryId', galleryId.trim())
    formData.append('isCompressed', isCompressed ? 'true' : 'false')

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = (await res.json()) as UploadResult
      setResult(data)
      if (data.ok) setFile(null)
    } catch {
      setResult({ ok: false, message: 'שגיאת רשת — נסי שוב' })
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      id="r2-upload-test"
      className="scroll-mt-24 border-t border-dashed border-[var(--color-paris-deep)]/25 bg-[var(--color-secondary)]/20 px-6 py-16 md:scroll-mt-28"
      dir="rtl"
    >
      <div className="mx-auto max-w-md text-right">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--color-paris-deep)]/50">
          בדיקה
        </p>
        <h2 className="font-display mt-2 text-2xl text-[var(--color-paris-deep)]">
          העלאה ל-Cloudflare R2
        </h2>
        <p className="mt-2 text-sm text-[var(--color-paris-deep)]/65">
          הקובץ נשמר בנתיב{' '}
          <span className="font-mono text-xs" dir="ltr">
            photographers/&#123;photographerId&#125;/galleries/&#123;galleryId&#125;/originals|thumbnails/&#123;fileName&#125;
          </span>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[var(--color-paris-deep)]/50">
              galleryId
            </span>
            <input
              type="text"
              value={galleryId}
              disabled={pending}
              onChange={(e) => {
                setGalleryId(e.target.value)
                setResult(null)
              }}
              placeholder="למשל מזהה האלבום"
              className="w-full rounded-sm border border-[var(--color-paris-deep)]/20 bg-[var(--color-white)] px-4 py-2 text-sm text-[var(--color-paris-deep)]"
              dir="ltr"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--color-paris-deep)]">
            <input
              type="checkbox"
              checked={isCompressed}
              disabled={pending}
              onChange={(e) => {
                setIsCompressed(e.target.checked)
                setResult(null)
              }}
              className="size-4 rounded border-[var(--color-paris-deep)]/30"
            />
            <span>קובץ מכווץ (thumbnails) — אחרת originals</span>
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[var(--color-paris-deep)]/50">
              קובץ
            </span>
            <input
              type="file"
              name="file"
              disabled={pending}
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null
                setFile(picked)
                setResult(null)
              }}
              className="w-full text-sm text-[var(--color-paris-deep)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-paris-deep)] file:px-4 file:py-2 file:text-xs file:text-[var(--color-white)]"
            />
          </label>

          <button
            type="submit"
            disabled={pending || !file || !galleryId.trim()}
            className="rounded-full bg-[var(--color-paris-deep)] px-8 py-3 text-sm text-[var(--color-white)] transition-opacity disabled:opacity-40"
          >
            {pending ? 'מעלה…' : 'העלה ל-R2'}
          </button>
        </form>

        {result ? (
          <div
            className={`mt-6 rounded-sm border px-4 py-3 text-sm ${
              result.ok
                ? 'border-green-700/30 bg-green-50 text-green-900'
                : 'border-red-700/30 bg-red-50 text-red-900'
            }`}
            role="status"
          >
            <p>{result.message}</p>
            {result.ok ? (
              <p className="mt-2 font-mono text-xs opacity-80" dir="ltr">
                {result.bucket}/{result.key}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

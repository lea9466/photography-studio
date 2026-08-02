'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import {
  HERO_VIDEO_ERRORS,
  HERO_VIDEO_MAX_DURATION_SECONDS,
  HERO_VIDEO_MAX_HEIGHT,
  HERO_VIDEO_MAX_WIDTH,
  hasMp4FileSignature,
  validateHeroVideoBasics,
  type HeroVideoMetadata,
} from '@/lib/hero-video-constraints'
import type { HeroType } from '@/lib/actions/branding.actions'
import {
  resolveHeroVideoAvailability,
  type HeroVideoAvailabilityStatus,
} from '@/lib/hero-video-availability'
import { cn } from '@/lib/utils'

type UploadResponse = {
  path: string
  url: string | null
  metadata: HeroVideoMetadata
  error?: string
}

type SelectedVideo = HeroVideoMetadata & {
  name: string
  size: number
}

const AVAILABILITY_TIMEOUT_MS = 10_000

const FILTER_REQUEST_TEXT = (videoUrl: string) => `שלום,

הסרטון הבא משמש כרקע Hero באתר צילום ונחסם ברשת נטפרי:

${videoUrl}

מדובר בסרטון קצר ללא קול, המוצג כרקע עיצובי באתר.

אשמח לבדיקה ולאישור הקישור.

תודה.`

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.readOnly = true
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('ההעתקה נכשלה')
}

function probeVideoMetadata(videoUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    let settled = false
    const finish = (available: boolean) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      video.removeAttribute('src')
      video.load()
      resolve(available)
    }
    const timeout = window.setTimeout(() => finish(false), AVAILABILITY_TIMEOUT_MS)

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.addEventListener('loadedmetadata', () => finish(true), { once: true })
    video.addEventListener('canplay', () => finish(true), { once: true })
    video.addEventListener('error', () => finish(false), { once: true })
    video.addEventListener('abort', () => finish(false), { once: true })
    // A stall can recover; the timeout decides when to continue to the HTTP probe.
    video.addEventListener('stalled', () => undefined, { once: true })
    video.src = videoUrl
    video.load()
  })
}

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function formatDuration(seconds: number) {
  return Number.isInteger(seconds) ? `${seconds}` : seconds.toFixed(1)
}

async function readClientMetadata(file: File): Promise<SelectedVideo> {
  validateHeroVideoBasics(file)
  const signature = new Uint8Array(await file.slice(0, 32).arrayBuffer())
  if (!hasMp4FileSignature(signature)) throw new Error(HERO_VIDEO_ERRORS.format)

  const objectUrl = URL.createObjectURL(file)
  try {
    const metadata = await new Promise<HeroVideoMetadata>((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      video.onloadedmetadata = () =>
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          codec: '',
          hasAudio: false,
          audioCodec: null,
        })
      video.onerror = () => reject(new Error(HERO_VIDEO_ERRORS.format))
      video.src = objectUrl
    })

    if (
      !Number.isFinite(metadata.duration) ||
      metadata.duration <= 0 ||
      metadata.duration > HERO_VIDEO_MAX_DURATION_SECONDS
    ) {
      throw new Error(HERO_VIDEO_ERRORS.duration)
    }
    if (
      metadata.width <= 0 ||
      metadata.height <= 0 ||
      metadata.width > HERO_VIDEO_MAX_WIDTH ||
      metadata.height > HERO_VIDEO_MAX_HEIGHT
    ) {
      throw new Error(HERO_VIDEO_ERRORS.resolution)
    }

    return { ...metadata, name: file.name, size: file.size }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function uploadVideo(
  file: File,
  onProgress: (progress: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/hero-video')
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onerror = () => reject(new Error(HERO_VIDEO_ERRORS.upload))
    xhr.onload = () => {
      let response: UploadResponse
      try {
        response = JSON.parse(xhr.responseText) as UploadResponse
      } catch {
        reject(new Error(HERO_VIDEO_ERRORS.upload))
        return
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(response.error || HERO_VIDEO_ERRORS.upload))
        return
      }
      resolve(response)
    }
    const body = new FormData()
    body.set('file', file)
    xhr.send(body)
  })
}

export function HeroVideoSettings({
  heroType,
  videoUrl,
  hasPoster,
  onTypeChange,
  onVideoUrlChange,
  onUploadingChange,
}: {
  heroType: HeroType
  videoUrl: string
  hasPoster: boolean
  onTypeChange: (type: HeroType) => void
  onVideoUrlChange: (url: string) => void
  onUploadingChange: (uploading: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selected, setSelected] = useState<SelectedVideo | null>(null)
  const [previewUrl, setPreviewUrl] = useState(videoUrl)
  const [availabilityStatus, setAvailabilityStatus] =
    useState<HeroVideoAvailabilityStatus>('idle')
  const [showFilterRequest, setShowFilterRequest] = useState(false)
  const availabilityRunRef = useRef(0)

  useEffect(() => setPreviewUrl(videoUrl), [videoUrl])
  useEffect(() => onUploadingChange(uploading || removing), [onUploadingChange, removing, uploading])

  async function checkVideoAvailability(url = previewUrl) {
    if (!url) {
      setAvailabilityStatus('idle')
      return
    }

    const runId = ++availabilityRunRef.current
    setShowFilterRequest(false)
    setAvailabilityStatus('checking')

    const status = await resolveHeroVideoAvailability({
      probeMetadata: () => probeVideoMetadata(url),
      probeHttp: async () => {
        const response = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-1023' },
          cache: 'no-store',
        })
        const result = {
          status: response.status,
          contentType: response.headers.get('content-type'),
        }
        await response.body?.cancel().catch(() => undefined)
        return result
      },
    })
    if (runId === availabilityRunRef.current) setAvailabilityStatus(status)
  }

  async function copyUrl() {
    try {
      await copyToClipboard(previewUrl)
      toast.success('הקישור הועתק')
    } catch {
      toast.error('לא הצלחנו להעתיק את הקישור')
    }
  }

  async function copyFilterRequest() {
    try {
      await copyToClipboard(FILTER_REQUEST_TEXT(previewUrl))
      toast.success('נוסח הפנייה הועתק')
    } catch {
      toast.error('לא הצלחנו להעתיק את נוסח הפנייה')
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return
    let localUrl = ''
    try {
      const metadata = await readClientMetadata(file)
      setSelected(metadata)
      if (metadata.height > metadata.width) {
        toast.warning('הסרטון אנכי. מומלץ להשתמש בסרטון אופקי לתצוגת Hero.')
      }

      localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)
      setUploading(true)
      setProgress(0)
      const response = await uploadVideo(file, setProgress)
      if (localUrl) URL.revokeObjectURL(localUrl)
      const storedUrl = response.url || response.path
      setPreviewUrl(storedUrl)
      onVideoUrlChange(storedUrl)
      setSelected({ ...metadata, ...response.metadata })
      void checkVideoAvailability(storedUrl)
      if (response.metadata.hasAudio) {
        toast.warning('נמצאה רצועת קול. הקול לא יושמע באתר.')
      }
      toast.success('הסרטון הועלה בהצלחה')
    } catch (error) {
      if (localUrl) URL.revokeObjectURL(localUrl)
      setPreviewUrl(videoUrl)
      toast.error(error instanceof Error ? error.message : HERO_VIDEO_ERRORS.upload)
    } finally {
      setUploading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function removeVideo() {
    if (removing) return
    setRemoving(true)
    try {
      const response = await fetch('/api/hero-video', { method: 'DELETE' })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error || 'לא הצלחנו להסיר את הסרטון. נסי שוב.')
      setPreviewUrl('')
      setSelected(null)
      availabilityRunRef.current += 1
      setAvailabilityStatus('idle')
      setShowFilterRequest(false)
      onVideoUrlChange('')
      onTypeChange('images')
      toast.success('הסרטון הוסר')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בהסרת הסרטון')
    } finally {
      setRemoving(false)
    }
  }

  const busy = uploading || removing

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-[--foreground]">סוג ההירו</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="סוג ההירו">
          <label
            className={cn(
              'cursor-pointer rounded-xl border p-4 transition-colors',
              heroType === 'images' ? 'border-[#7D3A52] bg-[#7D3A52]/5' : 'border-[--border]'
            )}
          >
            <span className="flex items-start gap-3">
              <input
                type="radio"
                name="hero-type"
                value="images"
                checked={heroType === 'images'}
                onChange={() => onTypeChange('images')}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">תמונות מתחלפות</span>
                <span className="mt-1 block text-sm text-[--muted]">
                  שלוש תמונות שמתחלפות במעבר עדין.
                </span>
              </span>
            </span>
          </label>
          <label
            className={cn(
              'rounded-xl border p-4 transition-colors',
              !hasPoster && 'cursor-not-allowed opacity-60',
              hasPoster && 'cursor-pointer',
              heroType === 'video' ? 'border-[#7D3A52] bg-[#7D3A52]/5' : 'border-[--border]'
            )}
          >
            <span className="flex items-start gap-3">
              <input
                type="radio"
                name="hero-type"
                value="video"
                checked={heroType === 'video'}
                disabled={!hasPoster}
                onChange={() => onTypeChange('video')}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">סרטון</span>
                <span className="mt-1 block text-sm text-[--muted]">
                  סרטון קצר שמתנגן אוטומטית ברקע ההירו.
                </span>
              </span>
            </span>
          </label>
        </div>
        {!hasPoster ? (
          <p className="mt-2 text-sm text-amber-700">
            יש להעלות תמונת Hero ראשונה כדי להפעיל מצב סרטון.
          </p>
        ) : null}
      </div>

      {heroType === 'video' ? (
        <div className="rounded-xl border border-[--border]/70 bg-white/80 p-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">סרטון Hero</h4>
            <HelpTooltip
              title="הנחיות לסרטון Hero"
              side="bottom"
              content={
                <>
                  <ul className="list-disc space-y-1 pe-4">
                    <li>פורמט מותר: MP4 בלבד</li>
                    <li>קידוד מומלץ: H.264</li>
                    <li>אורך מומלץ: 5–10 שניות</li>
                    <li>אורך מקסימלי: 12 שניות</li>
                    <li>משקל מקסימלי: 15MB</li>
                    <li>רזולוציה מומלצת: 1920×1080</li>
                    <li>רזולוציה מקסימלית: 1920×1080</li>
                    <li>ללא קול</li>
                    <li>מומלץ סרטון אופקי</li>
                    <li>מומלץ להימנע מטקסט חשוב בתוך הסרטון</li>
                    <li>תמונת ההירו הראשונה תשמש כתמונת fallback בזמן הטעינה</li>
                  </ul>
                  <p className="mt-3 border-t border-[--border] pt-2 text-[--muted]">
                    סרטון קצר וקל ייטען מהר יותר וייתן חוויה טובה יותר באתר.
                  </p>
                </>
              }
            />
          </div>

          {previewUrl ? (
            <video
              src={previewUrl}
              controls
              muted
              playsInline
              preload="metadata"
              className="mt-4 aspect-video w-full max-w-2xl rounded-lg bg-black object-cover"
            />
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="mt-4 flex aspect-video w-full max-w-2xl items-center justify-center rounded-lg border border-dashed border-[--border] text-[--muted] hover:border-[#7D3A52]/50"
            >
              <span className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8" />
                <span>בחרי סרטון MP4</span>
              </span>
            </button>
          )}

          {selected ? (
            <div className="mt-3 text-sm">
              <p className="font-medium">סרטון נבחר</p>
              <p className="text-[--muted]" dir="ltr">
                {selected.name} · {formatBytes(selected.size)} · {formatDuration(selected.duration)} שניות ·{' '}
                {selected.width}×{selected.height}
              </p>
              {selected.hasAudio ? (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800" role="status">
                  נמצאה רצועת קול. הקול לא יושמע באתר.
                </p>
              ) : null}
            </div>
          ) : null}

          {uploading ? (
            <div className="mt-3" role="status" aria-live="polite">
              <div className="mb-1 flex justify-between text-sm">
                <span>מעלה סרטון...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full bg-[#7D3A52] transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {previewUrl && !uploading ? (
            <div
              className="mt-4 space-y-3 rounded-xl border border-[--border]/70 bg-[--dashboard-surface] p-4"
              aria-live="polite"
            >
              <h5 className="font-semibold text-[--foreground]">זמינות הסרטון ברשת</h5>

              {availabilityStatus === 'idle' ? (
                <div className="space-y-3">
                  <p className="text-sm text-[--muted]">
                    ניתן לבדוק אם כתובת הסרטון נפתחת במחשב וברשת שבהם את משתמשת כרגע.
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={() => void checkVideoAvailability()}>
                    בדיקת זמינות הסרטון
                  </Button>
                </div>
              ) : null}

              {availabilityStatus === 'checking' ? (
                <div className="flex items-center gap-2 text-sm text-[--muted]" role="status">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  <span>בודקת אם הסרטון נגיש ברשת הנוכחית...</span>
                </div>
              ) : null}

              {availabilityStatus === 'available' ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" aria-hidden />
                    <div>
                      <p className="font-medium text-emerald-800">הסרטון נפתח ברשת הנוכחית</p>
                      <p className="text-sm text-[--muted]">
                        הבדיקה הצליחה במחשב וברשת שבהם את משתמשת כרגע.
                      </p>
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => void checkVideoAvailability()}>
                    <RefreshCw className="me-2 h-4 w-4" aria-hidden />
                    בדיקה חוזרת
                  </Button>
                </div>
              ) : null}

              {availabilityStatus === 'blocked' ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" aria-hidden />
                    <div>
                      <p className="font-medium text-amber-900">
                        הסרטון כנראה חסום ברשת הנוכחית
                      </p>
                      <p className="text-sm text-[--muted]">
                        הקובץ הועלה בהצלחה, אך חברת הסינון או הרשת הנוכחית מונעת את טעינתו.
                      </p>
                    </div>
                  </div>
                  <input
                    readOnly
                    value={previewUrl}
                    aria-label="כתובת הסרטון הציבורית"
                    className="w-full rounded-lg border border-[--border] bg-white px-3 py-2 text-sm"
                    dir="ltr"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => void copyUrl()}>
                      <Copy className="me-2 h-4 w-4" aria-hidden />
                      העתקת קישור
                    </Button>
                    <Button type="button" size="sm" variant="outline" asChild>
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="me-2 h-4 w-4" aria-hidden />
                        פתיחה בכרטיסייה חדשה
                      </a>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowFilterRequest((value) => !value)}
                      aria-expanded={showFilterRequest}
                    >
                      הכנת פנייה לנטפרי
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void checkVideoAvailability()}>
                      <RefreshCw className="me-2 h-4 w-4" aria-hidden />
                      בדיקה חוזרת
                    </Button>
                  </div>
                  {showFilterRequest ? (
                    <div className="space-y-2 rounded-lg border border-[--border] bg-white p-3">
                      <label htmlFor="hero-video-filter-request" className="text-sm font-medium">
                        נוסח מוכן לפנייה
                      </label>
                      <textarea
                        id="hero-video-filter-request"
                        readOnly
                        value={FILTER_REQUEST_TEXT(previewUrl)}
                        rows={9}
                        className="w-full resize-none rounded-lg border border-[--border] p-3 text-sm"
                      />
                      <Button type="button" size="sm" onClick={() => void copyFilterRequest()}>
                        <Copy className="me-2 h-4 w-4" aria-hidden />
                        העתקת נוסח הפנייה
                      </Button>
                    </div>
                  ) : null}
                  <p className="text-sm text-[--muted]">
                    במקרה שהסרטון חסום, האתר יציג אוטומטית את תמונות ההירו במקום הסרטון,
                    כך שלא יישאר אזור ריק.
                  </p>
                </div>
              ) : null}

              {availabilityStatus === 'unknown' ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CircleHelp className="mt-0.5 h-5 w-5 text-sky-600" aria-hidden />
                    <div>
                      <p className="font-medium text-[--foreground]">
                        לא הצלחנו לבדוק את הסרטון אוטומטית
                      </p>
                      <p className="text-sm text-[--muted]">
                        לא הצלחנו לאמת את זמינות הסרטון אוטומטית. אפשר לפתוח אותו לבדיקה
                        בכרטיסייה חדשה.
                      </p>
                    </div>
                  </div>
                  <input
                    readOnly
                    value={previewUrl}
                    aria-label="כתובת הסרטון הציבורית"
                    className="w-full rounded-lg border border-[--border] bg-white px-3 py-2 text-sm"
                    dir="ltr"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" asChild>
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="me-2 h-4 w-4" aria-hidden />
                        פתיחת הסרטון
                      </a>
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void copyUrl()}>
                      <Copy className="me-2 h-4 w-4" aria-hidden />
                      העתקת קישור
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void checkVideoAvailability()}>
                      <RefreshCw className="me-2 h-4 w-4" aria-hidden />
                      בדיקה חוזרת
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-1 border-t border-[--border] pt-3 text-xs text-[--muted]">
                <p>הבדיקה מתייחסת לרשת ולחברת הסינון שבהן את משתמשת כרגע.</p>
                <p>
                  הזמינות נבדקה רק ברשת הנוכחית. ייתכן שהסרטון ייחסם אצל גולשים המשתמשים
                  בחברת סינון אחרת.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
              {uploading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Upload className="me-2 h-4 w-4" />}
              {previewUrl ? 'החלפה' : 'העלאה'}
            </Button>
            {previewUrl ? (
              <Button type="button" variant="outline" disabled={busy} onClick={removeVideo}>
                {removing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Trash2 className="me-2 h-4 w-4" />}
                הסרה
              </Button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,.mp4"
            className="sr-only"
            disabled={busy}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </div>
      ) : null}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { Camera, Check, ImagePlus, Loader2, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  dismissWelcomePopup,
  generateOnboardingAbout,
  previewOnboardingSlug,
  saveSiteOnboarding,
  skipSiteOnboarding,
} from '@/lib/actions/onboarding.actions'
import { finalizeBrandingUpload, prepareBrandingUpload } from '@/lib/actions/branding.actions'
import { compressBrandingFile } from '@/lib/branding-upload-client'
import { putToPresignedUrl } from '@/lib/r2/upload-client'

// Loaded only when the modal actually opens, so the theme code never ships to
// the (vast majority of) dashboard entries that don't show it.
const OnboardingLivePreview = dynamic(
  () => import('./OnboardingLivePreview').then((m) => m.OnboardingLivePreview),
  { ssr: false }
)

export type SiteOnboardingInitial = {
  studioName: string
  slug: string | null
  accentColor: string | null
  aboutText: string
  logoUrl: string | null
  heroPreviewUrl: string | null
}

type SiteOnboardingModalProps = {
  open: boolean
  initial: SiteOnboardingInitial
}

const ACCENT_SWATCHES = [
  '#7D3A52', '#B5816A', '#C2410C', '#B45309', '#4D7C0F', '#0F766E',
  '#1D4ED8', '#6D28D9', '#BE185D', '#1F2937',
]

const DEFAULT_ONBOARDING_ACCENT = '#7D3A52'

function ChangeLaterHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1 text-xs font-medium text-emerald-700">
      <RefreshCw className="h-3 w-3 shrink-0" />
      {children}
    </p>
  )
}
const MIN_NAME_LENGTH = 2
const SLUG_DEBOUNCE_MS = 400

export function SiteOnboardingModal({ open, initial }: SiteOnboardingModalProps) {
  const router = useRouter()
  const [visible, setVisible] = useState(open)
  const [pending, startTransition] = useTransition()

  const [studioName, setStudioName] = useState(initial.studioName)
  const [slug, setSlug] = useState<string | null>(initial.slug)
  const [slugError, setSlugError] = useState('')
  const [aboutText, setAboutText] = useState(initial.aboutText)
  const [accent, setAccent] = useState(initial.accentColor || DEFAULT_ONBOARDING_ACCENT)

  const [heroUrl, setHeroUrl] = useState<string | null>(initial.heroPreviewUrl)
  const [heroUploading, setHeroUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl)
  const [logoUploading, setLogoUploading] = useState(false)
  const [aiPending, setAiPending] = useState(false)

  const isCustomAccent = !ACCENT_SWATCHES.some((c) => c.toLowerCase() === accent.toLowerCase())
  const slugLocked = Boolean(initial.slug)
  const nameValid = studioName.trim().length >= MIN_NAME_LENGTH
  const canFinish = nameValid && Boolean(slug) && Boolean(heroUrl) && !heroUploading && !pending

  useEffect(() => {
    setVisible(open)
  }, [open])

  // The slug always follows the studio name (never edited by hand); an existing
  // one is left alone. Responses can arrive out of order, so only the latest counts.
  const slugRequestId = useRef(0)
  useEffect(() => {
    if (slugLocked) return
    const name = studioName.trim()
    if (name.length < MIN_NAME_LENGTH) {
      setSlug(null)
      setSlugError('')
      return
    }
    const requestId = ++slugRequestId.current
    const timer = setTimeout(async () => {
      const result = await previewOnboardingSlug(name)
      if (requestId !== slugRequestId.current) return
      if (result.ok) {
        setSlug(result.slug)
        setSlugError('')
      } else {
        setSlug(null)
        setSlugError(result.error)
      }
    }, SLUG_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [studioName, slugLocked])

  async function uploadBrandingImage(
    file: File,
    type: 'hero_desktop' | 'logo',
    setPreview: (url: string) => void,
    setBusy: (busy: boolean) => void
  ) {
    // Show it immediately from the local file; the upload continues behind it.
    setPreview(URL.createObjectURL(file))
    setBusy(true)
    try {
      const uploadFile = await compressBrandingFile(file)
      const slot = type === 'hero_desktop' ? 0 : undefined
      const { uploadUrl, path } = await prepareBrandingUpload({
        type,
        fileName: uploadFile.name,
        contentType: uploadFile.type,
        fileSize: uploadFile.size,
        slot,
      })
      await putToPresignedUrl(uploadUrl, uploadFile)
      await finalizeBrandingUpload(type, path, slot)
    } catch {
      toast.error('העלאת התמונה נכשלה, נסי שוב')
      if (type === 'hero_desktop') setHeroUrl(initial.heroPreviewUrl)
      else setLogoUrl(initial.logoUrl)
    } finally {
      setBusy(false)
    }
  }

  function handleHeroChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void uploadBrandingImage(file, 'hero_desktop', setHeroUrl, setHeroUploading)
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void uploadBrandingImage(file, 'logo', setLogoUrl, setLogoUploading)
  }

  async function handleGenerateAbout() {
    if (!nameValid) {
      toast.error('קודם נזין שם עסק ואז נועה תכתוב אודות')
      return
    }
    setAiPending(true)
    const result = await generateOnboardingAbout(studioName)
    setAiPending(false)
    if (result.ok) setAboutText(result.text)
    else toast.error(result.error)
  }

  function handleFinish() {
    startTransition(async () => {
      const result = await saveSiteOnboarding({ studioName, aboutText, accentColor: accent })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('האתר שלך באוויר!')
      setVisible(false)
      router.refresh()
    })
  }

  function handleSkipToGalleries() {
    startTransition(async () => {
      const result = await skipSiteOnboarding()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setVisible(false)
      router.push('/dashboard/private-galleries')
    })
  }

  // X only dismisses the first-entry flag. While slug/hero are still missing the
  // modal comes back on the next entry, which is the intended nudge.
  function handleClose() {
    setVisible(false)
    void dismissWelcomePopup()
  }

  return (
    <DialogPrimitive.Root open={visible} onOpenChange={(next) => !next && handleClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 animate-fade-in" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none animate-fade-in md:inset-6"
        >
          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-1.5 text-black/60 shadow-sm ring-1 ring-black/10 transition hover:text-black"
            aria-label="סגירה"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
            {/* Form (right in RTL) */}
            <section className="flex w-full shrink-0 flex-col gap-5 p-5 pt-14 md:w-[440px] md:overflow-y-auto md:p-8 md:pt-16">
              <header className="space-y-1.5">
                <DialogPrimitive.Title className="flex items-center gap-2 text-2xl font-semibold">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  ברוכה הבאה ל-STG!
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm leading-relaxed text-black/60">
                  שלושה פרטים והאתר שלך באוויר. תראי אותו נבנה משמאל בזמן אמת.
                </DialogPrimitive.Description>
              </header>

              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-900">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <p>
                  <span className="font-semibold">שום דבר כאן לא סופי.</span> כל מה שתבחרי, כולל
                  הכתובת, אפשר לשנות בכל רגע מהדשבורד. אין סיבה להתלבט או לחשוש.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="onboarding-name" className="text-sm font-medium">
                  שם העסק
                </label>
                <Input
                  id="onboarding-name"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="למשל: סטודיו נועה"
                  maxLength={80}
                  autoFocus={!initial.studioName}
                />
                <div dir="ltr" className="min-h-5 text-start text-xs text-black/50">
                  {slugError ? (
                    <span dir="rtl" className="text-red-600">{slugError}</span>
                  ) : slug ? (
                    <span className="inline-flex items-center gap-1">
                      <Check className="h-3 w-3 text-emerald-600" />
                      {typeof window !== 'undefined' ? window.location.host : ''}/{slug}
                    </span>
                  ) : null}
                </div>
                <ChangeLaterHint>השם והכתובת ניתנים לשינוי בהגדרות האתר</ChangeLaterHint>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-medium">תמונת הירו</span>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-black/20 p-3 transition hover:border-black/40 hover:bg-black/[0.02]',
                    heroUrl && 'border-solid border-emerald-300 bg-emerald-50/40'
                  )}
                >
                  <input type="file" accept="image/*" className="sr-only" onChange={handleHeroChange} />
                  {heroUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroUrl} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-black/5">
                      <ImagePlus className="h-6 w-6 text-black/40" />
                    </span>
                  )}
                  <span className="min-w-0 text-sm">
                    {heroUploading ? (
                      <span className="inline-flex items-center gap-1.5 text-black/60">
                        <Loader2 className="h-4 w-4 animate-spin" /> מעלה...
                      </span>
                    ) : heroUrl ? (
                      'התמונה עלתה. לחצי כדי להחליף'
                    ) : (
                      'לחצי להעלאת תמונה ראשית לאתר'
                    )}
                  </span>
                </label>
                <ChangeLaterHint>אפשר להחליף או להוסיף תמונות הירו בדשבורד</ChangeLaterHint>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="onboarding-about" className="text-sm font-medium">
                    אודות <span className="font-normal text-black/40">(אופציונלי)</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAbout}
                    disabled={aiPending || !nameValid}
                    className="gap-1.5"
                  >
                    {aiPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    מילוי עם נועה
                  </Button>
                </div>
                <Textarea
                  id="onboarding-about"
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  rows={3}
                  maxLength={400}
                  placeholder="כמה משפטים על הצילום שלך"
                />
                <ChangeLaterHint>אפשר לערוך את הטקסט בכל עת</ChangeLaterHint>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">
                  צבע ראשי <span className="font-normal text-black/40">(אופציונלי)</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccent(color)}
                      aria-label={`צבע ${color}`}
                      aria-pressed={accent.toLowerCase() === color.toLowerCase()}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 transition',
                        accent.toLowerCase() === color.toLowerCase() && 'ring-2 ring-black/70'
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {accent.toLowerCase() === color.toLowerCase() ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : null}
                    </button>
                  ))}
                  {/* Free choice: the native picker, shown as a rainbow swatch. */}
                  <label
                    className={cn(
                      'relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-offset-2 transition',
                      isCustomAccent && 'ring-2 ring-black/70'
                    )}
                    style={{
                      background: isCustomAccent
                        ? accent
                        : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                    }}
                    title="בחירת צבע חופשית"
                  >
                    <input
                      type="color"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label="בחירת צבע חופשית"
                    />
                    {isCustomAccent ? <Check className="h-4 w-4 text-white" /> : null}
                  </label>
                </div>
                <ChangeLaterHint>אפשר לשנות צבע בכל רגע</ChangeLaterHint>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-medium">
                  לוגו <span className="font-normal text-black/40">(אופציונלי)</span>
                </span>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 p-2.5 text-sm transition hover:bg-black/[0.02]">
                  <input type="file" accept="image/*" className="sr-only" onChange={handleLogoChange} />
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-contain" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-black/5">
                      <Camera className="h-4 w-4 text-black/40" />
                    </span>
                  )}
                  {logoUploading ? (
                    <span className="inline-flex items-center gap-1.5 text-black/60">
                      <Loader2 className="h-4 w-4 animate-spin" /> מעלה...
                    </span>
                  ) : logoUrl ? (
                    'הלוגו עלה. לחצי להחלפה'
                  ) : (
                    'העלאת לוגו'
                  )}
                </label>
                <ChangeLaterHint>אפשר להוסיף או להחליף לוגו מאוחר יותר</ChangeLaterHint>
              </div>

              <div className="mt-auto space-y-3 pt-2">
                <Button type="button" onClick={handleFinish} disabled={!canFinish} className="w-full">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'סיום, האתר באוויר'}
                </Button>
                {!canFinish && !pending ? (
                  <p className="text-center text-xs text-black/45">
                    נדרשים שם עסק ותמונת הירו כדי לסיים.
                  </p>
                ) : (
                  <p className="text-center text-xs font-medium text-emerald-700">
                    אפשר לשנות הכול אחר כך מהדשבורד.
                  </p>
                )}
                <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900">
                  <p className="mb-1.5">רוצה רק גלריות פרטיות ללקוחות, בלי אתר?</p>
                  <button
                    type="button"
                    onClick={handleSkipToGalleries}
                    disabled={pending}
                    className="font-semibold underline underline-offset-4 hover:no-underline disabled:opacity-50"
                  >
                    דלגי לגלריות פרטיות
                  </button>
                </div>
              </div>
            </section>

            {/* Live preview (left in RTL; on top for mobile) */}
            <aside className="order-first h-60 shrink-0 bg-[#ebe8e4] p-3 md:order-none md:h-auto md:min-w-0 md:flex-1 md:p-6">
              <OnboardingLivePreview
                studioName={studioName.trim()}
                slug={slug}
                accentColor={accent}
                aboutText={aboutText}
                heroUrl={heroUrl}
                logoUrl={logoUrl}
              />
            </aside>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

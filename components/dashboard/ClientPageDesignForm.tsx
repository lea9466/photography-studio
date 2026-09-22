'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  removeClientPageLogo,
  saveClientPageAccent,
  saveClientPageBackground,
  saveClientPageHeroStyle,
  saveClientPageShowSiteLink,
  type ClientPageDesign,
} from '@/lib/actions/client-page-design.actions'
import { DEFAULT_CLIENT_ACCENT, resolveClientPageAccent } from '@/lib/branding/client-page-colors'
import type { ClientPageHeroStyle } from '@/lib/branding/client-page-hero-style'
import type { ClientPageBackground } from '@/lib/branding/client-page-background'
import { uploadClientPageLogo } from '@/lib/client-page-logo-upload'
import { useObjectUrl } from '@/lib/hooks/use-object-url'
import { ClientPageBackgroundField } from '@/components/dashboard/ClientPageBackgroundField'
import { ClientPageColorField } from '@/components/dashboard/ClientPageColorField'
import { ClientPageHeroStyleField } from '@/components/dashboard/ClientPageHeroStyleField'
import { ClientPageLogoField } from '@/components/dashboard/ClientPageLogoField'
import { ClientPagePreview } from '@/components/dashboard/ClientPagePreview'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

type ClientPageDesignFormProps = {
  design: ClientPageDesign
}

const CARD_CLASS = 'space-y-4 rounded-xl border border-[#c9c5cd] bg-white p-5 sm:p-6'
const PRIMARY_BUTTON = 'bg-[#6b2d43] text-white hover:bg-[#5a2538] disabled:opacity-60'
const SECONDARY_BUTTON = 'border-[#c9c5cd] text-[#48464c] hover:bg-[#f7f2f4]'

/**
 * Studio-wide look of the client-facing gallery page. Colour and logo default to
 * the public site's; anything set here applies to client pages only. The cover
 * image is per gallery and lives in each gallery's settings.
 */
export function ClientPageDesignForm({ design }: ClientPageDesignFormProps) {
  const [saved, setSaved] = useState(design.override)
  const [draftAccent, setDraftAccent] = useState<string | null>(design.override.accent)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [heroStyle, setHeroStyle] = useState<ClientPageHeroStyle>(design.heroStyle)
  const [background, setBackground] = useState<ClientPageBackground>(design.background)
  const [showSiteLink, setShowSiteLink] = useState(design.siteLink.enabled)
  const [isPending, startTransition] = useTransition()
  const pickedLogoUrl = useObjectUrl(logoFile)

  const shownAccent = draftAccent ?? design.site.accent ?? DEFAULT_CLIENT_ACCENT
  const accentDirty = draftAccent !== saved.accent
  const shownLogo = pickedLogoUrl ?? saved.logoUrl ?? design.site.logoUrl

  function handleSaveAccent() {
    startTransition(async () => {
      const result = await saveClientPageAccent(draftAccent)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setSaved((prev) => ({ ...prev, accent: result.accent }))
      setDraftAccent(result.accent)
      toast.success('הצבע נשמר')
    })
  }

  function handleSaveLogo() {
    if (!logoFile) return
    startTransition(async () => {
      const result = await uploadClientPageLogo(logoFile)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setSaved((prev) => ({ ...prev, logoUrl: result.logoUrl }))
      setLogoFile(null)
      toast.success('הלוגו נשמר')
    })
  }

  function handleSelectHeroStyle(style: ClientPageHeroStyle) {
    const previous = heroStyle
    setHeroStyle(style)
    startTransition(async () => {
      const result = await saveClientPageHeroStyle(style)
      if (!result.ok) {
        setHeroStyle(previous)
        toast.error(result.error)
        return
      }
      toast.success('עיצוב ראש הדף נשמר')
    })
  }

  function handleSelectBackground(next: ClientPageBackground) {
    const previous = background
    setBackground(next)
    startTransition(async () => {
      const result = await saveClientPageBackground(next)
      if (!result.ok) {
        setBackground(previous)
        toast.error(result.error)
        return
      }
      toast.success('רקע הדף נשמר')
    })
  }

  function handleToggleSiteLink(next: boolean) {
    const previous = showSiteLink
    setShowSiteLink(next)
    startTransition(async () => {
      const result = await saveClientPageShowSiteLink(next)
      if (!result.ok) {
        setShowSiteLink(previous)
        toast.error(result.error)
        return
      }
      toast.success(next ? 'הכפתור לאתר שלך יוצג בגלריות' : 'הכפתור לאתר שלך הוסר')
    })
  }

  function handleRemoveLogo() {
    startTransition(async () => {
      const result = await removeClientPageLogo()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setSaved((prev) => ({ ...prev, logoUrl: null }))
      toast.success('הלוגו הוסר')
    })
  }

  const accentStatus =
    draftAccent === null
      ? design.site.accent
        ? 'כרגע הצבע נלקח מהאתר שלך'
        : 'עדיין לא נבחר צבע — מוצג צבע ברירת מחדל'
      : 'צבע שמוגדר לדפי הלקוחות בלבד'

  const logoStatus = saved.logoUrl
    ? 'לוגו שמוגדר לדפי הלקוחות בלבד'
    : design.site.logoUrl
      ? 'כרגע הלוגו נלקח מהאתר שלך'
      : 'אין לוגו — בראש הדף יוצג שם הסטודיו בלבד'

  const shownAccentResolved = resolveClientPageAccent(shownAccent)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#100d1f]">כך ייראה ראש הדף שהלקוח רואה</h3>
        <ClientPagePreview
          studioName={design.studioName}
          accent={shownAccentResolved}
          logoUrl={shownLogo}
          heroStyle={heroStyle}
          background={background}
          headingFont={design.headingFont}
          showSiteLink={showSiteLink}
        />
      </div>

      <section className={CARD_CLASS}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#100d1f]">כפתור לאתר שלך</h3>
            <p className="text-sm text-[#48464c]">
              {design.siteLink.available
                ? 'תג קטן בפינת התמונה, עם קישור לאתר הציבורי שלך — כבוי כברירת מחדל'
                : 'זמין רק כשיש לך אתר ציבורי (שם סטודיו או קישור אישי מוגדרים)'}
            </p>
          </div>
          <Switch
            checked={showSiteLink}
            onCheckedChange={handleToggleSiteLink}
            disabled={isPending || !design.siteLink.available}
          />
        </div>
      </section>

      <section className={CARD_CLASS}>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#100d1f]">רקע הדף</h3>
          <p className="text-sm text-[#48464c]">בהיר או כהה</p>
        </div>
        <ClientPageBackgroundField value={background} onChange={handleSelectBackground} disabled={isPending} />
      </section>

      <section className={CARD_CLASS}>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#100d1f]">עיצוב ראש הדף</h3>
          <p className="text-sm text-[#48464c]">שלושה כיוונים לפריסת הלוגו והכותרת — נשמר מיד עם הבחירה</p>
        </div>
        <ClientPageHeroStyleField
          value={heroStyle}
          onChange={handleSelectHeroStyle}
          studioName={design.studioName}
          accent={shownAccentResolved}
          logoUrl={shownLogo}
          background={background}
          headingFont={design.headingFont}
          disabled={isPending}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={CARD_CLASS}>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#100d1f]">צבע ראשי</h3>
            <p className="text-sm text-[#48464c]">{accentStatus}</p>
          </div>
          <ClientPageColorField value={shownAccent} onChange={setDraftAccent} disabled={isPending} />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleSaveAccent}
              disabled={isPending || !accentDirty}
              className={PRIMARY_BUTTON}
            >
              {isPending ? 'שומר...' : 'שמירת צבע'}
            </Button>
            {draftAccent !== null ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setDraftAccent(null)}
                disabled={isPending}
                className={SECONDARY_BUTTON}
              >
                חזרה לצבע האתר
              </Button>
            ) : null}
          </div>
        </section>

        <section className={CARD_CLASS}>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#100d1f]">לוגו</h3>
            <p className="text-sm text-[#48464c]">{logoStatus}</p>
          </div>
          <ClientPageLogoField
            inputId="client-page-logo"
            previewUrl={shownLogo}
            file={logoFile}
            onFileChange={setLogoFile}
            disabled={isPending}
          />
          <div className="flex flex-wrap items-center gap-2">
            {logoFile ? (
              <Button
                type="button"
                onClick={handleSaveLogo}
                disabled={isPending}
                className={PRIMARY_BUTTON}
              >
                {isPending ? 'שומר...' : 'שמירת לוגו'}
              </Button>
            ) : null}
            {saved.logoUrl && !logoFile ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveLogo}
                disabled={isPending}
                className={SECONDARY_BUTTON}
              >
                הסרה וחזרה ללוגו האתר
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

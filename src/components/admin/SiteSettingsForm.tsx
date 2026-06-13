'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSiteSettingsAction, type ActionResult } from '@/app/admin/actions'
import type { SiteSettingsRow } from '@/lib/database.types'
import {
  THEME_DEFAULT_COLORS,
  parseThemeStyle,
  type ThemeStyle,
} from '@/lib/theme-styles'
import { useAdminThemePreview } from './AdminThemeContext'
import AdminThemeSection from './AdminThemeBar'
import AdminImagePreview from './AdminImagePreview'
import {
  heroDesktopUploadDescription,
  heroMobileUploadDescription,
  aboutImageUploadDescription,
} from '@/lib/image-recommendations'
import {
  AdminField,
  AdminFileInput,
  AdminMessage,
} from './admin-ui'

const initial: ActionResult = { ok: false, message: '' }

function savedMediaUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed || null
}

function ImagePickerCard({
  title,
  description,
  savedUrl,
  disabled,
  fileName,
  accept,
  pendingFile,
  onFileChange,
}: {
  title: string
  description: string
  savedUrl: string | null
  disabled?: boolean
  fileName: string
  accept: string
  pendingFile: File | null
  onFileChange: (file: File | null) => void
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <AdminImagePreview
        src={savedUrl}
        pendingFile={pendingFile}
        emptyText="עדיין לא הועלתה תמונה"
      />

      <AdminFileInput
        name={fileName}
        accept={accept}
        disabled={disabled}
        onFileChange={onFileChange}
      />
    </div>
  )
}

export default function SiteSettingsForm({
  settings,
  disabled,
}: {
  settings: SiteSettingsRow | null
  disabled?: boolean
}) {
  const router = useRouter()
  const { previewTheme, setPreviewTheme } = useAdminThemePreview()
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) =>
      saveSiteSettingsAction(settings?.id ?? null, formData),
    initial
  )

  const defaults = THEME_DEFAULT_COLORS[previewTheme]
  const [primary, setPrimary] = useState(
    settings?.primary_color?.trim() || defaults.primary
  )
  const [secondary, setSecondary] = useState(
    settings?.secondary_color?.trim() || defaults.secondary
  )

  const [logoPending, setLogoPending] = useState<File | null>(null)
  const [heroDesktopPending, setHeroDesktopPending] = useState<File | null>(null)
  const [heroMobilePending, setHeroMobilePending] = useState<File | null>(null)
  const [aboutPending, setAboutPending] = useState<File | null>(null)

  useEffect(() => {
    if (!settings) return
    const savedTheme = parseThemeStyle(settings.theme_style)
    setPreviewTheme(savedTheme)
    const colors = THEME_DEFAULT_COLORS[savedTheme]
    setPrimary(settings.primary_color?.trim() || colors.primary)
    setSecondary(settings.secondary_color?.trim() || colors.secondary)
  }, [
    settings?.id,
    settings?.theme_style,
    settings?.primary_color,
    settings?.secondary_color,
    setPreviewTheme,
  ])

  useEffect(() => {
    if (!state.ok) return
    setLogoPending(null)
    setHeroDesktopPending(null)
    setHeroMobilePending(null)
    setAboutPending(null)
    router.refresh()
  }, [state.ok, router])

  function selectTheme(theme: ThemeStyle) {
    setPreviewTheme(theme)
    const colors = THEME_DEFAULT_COLORS[theme]
    setPrimary(colors.primary)
    setSecondary(colors.secondary)
  }

  const logoUrl = savedMediaUrl(settings?.logo_url)
  const heroDesktopUrl = savedMediaUrl(settings?.hero_image_url)
  const heroMobileUrl = savedMediaUrl(settings?.hero_image_url_mobile)
  const aboutImageUrl = savedMediaUrl(settings?.about_image_url)
  const heroDesktopDescription = heroDesktopUploadDescription(previewTheme)
  const heroMobileDescription = heroMobileUploadDescription(previewTheme)
  const aboutImageDescription = aboutImageUploadDescription()

  return (
    <form
      action={action}
      className="site-settings-form relative space-y-16 px-4 pb-28 sm:px-6"
    >
      {settings?.id ? (
        <input type="hidden" name="settings_id" value={settings.id} />
      ) : null}
      <input type="hidden" name="logo_url" value={logoUrl ?? ''} />
      <input type="hidden" name="hero_image_url" value={heroDesktopUrl ?? ''} />
      <input
        type="hidden"
        name="hero_image_url_mobile"
        value={heroMobileUrl ?? ''}
      />
      <input type="hidden" name="about_image_url" value={aboutImageUrl ?? ''} />
      <input type="hidden" name="theme_style" value={previewTheme} />
      <input type="hidden" name="primary_color" value={primary} />
      <input type="hidden" name="secondary_color" value={secondary} />

      <AdminThemeSection
        previewTheme={previewTheme}
        primary={primary}
        secondary={secondary}
        disabled={disabled}
        onThemeSelect={selectTheme}
        onPrimaryChange={setPrimary}
        onSecondaryChange={setSecondary}
      />

      <div className="grid gap-12 xl:grid-cols-3">
        <ImagePickerCard
          title="לוגו"
          description="מופיע בהדר ובאתר. התמונה תועלה בשמירת ההגדרות."
          savedUrl={logoUrl}
          disabled={disabled}
          fileName="logo_file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          pendingFile={logoPending}
          onFileChange={setLogoPending}
        />
        <ImagePickerCard
          title="Hero — דסקטופ"
          description={heroDesktopDescription}
          savedUrl={heroDesktopUrl}
          disabled={disabled}
          fileName="hero_file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          pendingFile={heroDesktopPending}
          onFileChange={setHeroDesktopPending}
        />
        <ImagePickerCard
          title="Hero — מובייל"
          description={heroMobileDescription}
          savedUrl={heroMobileUrl}
          disabled={disabled}
          fileName="hero_file_mobile"
          accept="image/jpeg,image/png,image/webp,image/gif"
          pendingFile={heroMobilePending}
          onFileChange={setHeroMobilePending}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <AdminField
          label="שם העסק"
          name="business_name"
          defaultValue={settings?.business_name ?? ''}
          required
        />
        <AdminField
          label="סלוגן"
          name="tagline"
          defaultValue={settings?.tagline ?? ''}
        />
        <AdminField
          label="טלפון"
          name="phone"
          defaultValue={settings?.phone ?? ''}
        />
        <AdminField
          label="אימייל"
          name="email"
          type="email"
          defaultValue={settings?.email ?? ''}
        />
        <AdminField
          label="וואטסאפ"
          name="whatsapp"
          defaultValue={settings?.whatsapp ?? ''}
          hint="972501234567"
        />
        <AdminField
          label="שנות ניסיון"
          name="years_experience"
          type="number"
          min={0}
          defaultValue={settings?.years_experience ?? 0}
        />
        <AdminField
          label="סה״כ לקוחות"
          name="total_clients"
          type="number"
          min={0}
          defaultValue={settings?.total_clients ?? 0}
        />
        <AdminField
          label="סה״כ פרויקטים"
          name="total_projects"
          type="number"
          min={0}
          defaultValue={settings?.total_projects ?? 0}
        />
      </div>

      <div className="admin-surface space-y-8">
        <h4 className="text-base font-medium text-foreground">סקשן אודות</h4>
        <ImagePickerCard
          title="תמונת אודות"
          description={aboutImageDescription}
          savedUrl={aboutImageUrl}
          disabled={disabled}
          fileName="about_file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          pendingFile={aboutPending}
          onFileChange={setAboutPending}
        />
        <div className="grid gap-8 md:grid-cols-2">
          <AdminField
            label="כותרת — שורה ראשונה"
            name="about_headline_line1"
            placeholder="שלום, אני [השם שלך]"
            defaultValue={settings?.about_headline_line1 ?? ''}
          />
          <AdminField
            label="כותרת — שורה שנייה"
            name="about_headline_line2"
            placeholder="מספרת סיפורים **באור**."
            defaultValue={settings?.about_headline_line2 ?? ''}
            hint="**מילה** להדגשה"
          />
          <AdminField
            label="ציטוט על התמונה"
            name="about_quote"
            rows={3}
            defaultValue={settings?.about_quote ?? ''}
          />
          <AdminField
            label="טקסט גוף"
            name="about_text"
            rows={5}
            defaultValue={settings?.about_text ?? ''}
          />
        </div>
      </div>

      <div className="fixed bottom-6 left-6 z-50 flex max-w-sm flex-col items-start gap-3">
        {state.message ? (
          <div className="admin-card w-full p-4 backdrop-blur-sm">
            <AdminMessage ok={state.ok} message={state.message} />
          </div>
        ) : null}
        <button
          type="submit"
          disabled={disabled || pending}
          className="rounded-full bg-foreground px-8 py-3.5 text-sm font-medium text-background shadow-lg transition-all hover:opacity-90 hover:shadow-xl disabled:opacity-50"
        >
          {pending ? 'שומר...' : 'שמירת הגדרות'}
        </button>
      </div>
    </form>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/actions/feedback.actions'
import { finalizeBrandingUpload, prepareBrandingUpload, removeBrandingImage, removeHeroImageSlot } from '@/lib/actions/branding.actions'
import { putToPresignedUrl } from '@/lib/r2/upload-client'
import { compressBrandingFile } from '@/lib/branding-upload-client'
import { BrandingPreviewImage } from '@/components/dashboard/BrandingPreviewImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LabelWithHelp } from '@/components/ui/label-with-help'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { SITE_SETTINGS_HELP, THEME_HELP, THEME_OPTIONS } from '@/lib/dashboard/site-settings-help'
import { Building2, ExternalLink, Globe, Loader2, Palette, Trash2, Upload } from 'lucide-react'

const HERO_SLOT_COUNT = 3

type BrandingUploadType =
  | 'logo'
  | 'hero_desktop'
  | 'hero_mobile'
  | 'about'
  | 'contact_desktop'
  | 'contact_mobile'
  | 'packages_desktop'
  | 'packages_mobile'

function uploadTargetKey(type: BrandingUploadType, slot?: number) {
  return slot !== undefined ? `${type}:${slot}` : type
}

type SingleBrandingImageType = Exclude<
  BrandingUploadType,
  'hero_desktop' | 'hero_mobile'
>

function UploadSpinnerOverlay({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 pointer-events-none">
      <Loader2 className="h-10 w-10 animate-spin text-white" />
    </div>
  )
}

function initHeroSlots(urls: string[] | null | undefined, fallback: string | null) {
  const slots: string[] = ['', '', '']
  const source = urls?.length ? urls : fallback ? [fallback] : []
  source.slice(0, HERO_SLOT_COUNT).forEach((url, index) => {
    if (url) slots[index] = url
  })
  return slots
}

type ProfileFormProps = {
  profile: {
    name: string | null
    studio_name: string | null
    theme_primary: string
    about_text: string | null
    about_title: string | null
    about_subtitle: string | null
    about_description: string | null
    contact_card_title: string | null
    contact_card_description: string | null
    address: string | null
    phone: string | null
    stat_projects: number
    stat_clients: number
    stat_experience_years: number
    accent_color: string
    selected_theme: string
    logo_url: string | null
    hero_desktop_url: string | null
    hero_mobile_url: string | null
    hero_desktop_urls?: string[] | null
    hero_mobile_urls?: string[] | null
    about_image_url: string | null
    contact_desktop_url: string | null
    contact_mobile_url: string | null
    packages_desktop_url: string | null
    packages_mobile_url: string | null
    email: string | null
    slug: string | null
    should_color_logo: boolean
  } | null
}

const THEMES = THEME_OPTIONS

function normalizeThemeId(theme: string | null | undefined) {
  const normalized = theme === 'dark' ? 'bold' : theme
  if (normalized && THEMES.some((item) => item.id === normalized)) {
    return normalized
  }
  return THEMES[0].id
}

function SectionHeader({
  icon: Icon,
  title,
  help,
  where,
}: {
  icon: typeof Building2
  title: string
  help: string
  where?: string
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[--border] pb-2">
      <Icon className="h-6 w-6 text-[--foreground]" />
      <h2 className="text-lg font-semibold text-[--foreground]">{title}</h2>
      <HelpTooltip content={help} where={where} />
    </div>
  )
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(profile?.name ?? '')
  const [studioName, setStudioName] = useState(profile?.studio_name ?? '')
  const [aboutText, setAboutText] = useState(profile?.about_text ?? '')
  const [aboutTitle, setAboutTitle] = useState(profile?.about_title ?? '')
  const [aboutSubtitle, setAboutSubtitle] = useState(profile?.about_subtitle ?? '')
  const [aboutDescription, setAboutDescription] = useState(profile?.about_description ?? '')
  const [contactCardTitle, setContactCardTitle] = useState(profile?.contact_card_title ?? '')
  const [contactCardDescription, setContactCardDescription] = useState(profile?.contact_card_description ?? '')
  const [statProjects, setStatProjects] = useState(profile?.stat_projects ?? 0)
  const [statClients, setStatClients] = useState(profile?.stat_clients ?? 0)
  const [statExperienceYears, setStatExperienceYears] = useState(profile?.stat_experience_years ?? 0)
  const [accentColor, setAccentColor] = useState(profile?.accent_color ?? '#7c3aed')
  const [selectedTheme, setSelectedTheme] = useState(() =>
    normalizeThemeId(profile?.selected_theme)
  )
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url ?? '')
  const [heroDesktopUrls, setHeroDesktopUrls] = useState<string[]>(() =>
    initHeroSlots(profile?.hero_desktop_urls, profile?.hero_desktop_url ?? null)
  )
  const [heroMobileUrls, setHeroMobileUrls] = useState<string[]>(() =>
    initHeroSlots(profile?.hero_mobile_urls, profile?.hero_mobile_url ?? null)
  )
  const [aboutImageUrl, setAboutImageUrl] = useState(profile?.about_image_url ?? '')
  const [contactDesktopUrl, setContactDesktopUrl] = useState(profile?.contact_desktop_url ?? '')
  const [contactMobileUrl, setContactMobileUrl] = useState(profile?.contact_mobile_url ?? '')
  const [packagesDesktopUrl, setPackagesDesktopUrl] = useState(profile?.packages_desktop_url ?? '')
  const [packagesMobileUrl, setPackagesMobileUrl] = useState(profile?.packages_mobile_url ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [address, setAddress] = useState(profile?.address ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [slug, setSlug] = useState(profile?.slug ?? '')
  const [shouldColorLogo, setShouldColorLogo] = useState(profile?.should_color_logo ?? false)
  const [uploadingTargets, setUploadingTargets] = useState<ReadonlySet<string>>(() => new Set())
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({})
  const [previewVersions, setPreviewVersions] = useState<Record<string, number>>({})

  function setTargetUploading(targetKey: string, uploading: boolean) {
    setUploadingTargets((prev) => {
      const next = new Set(prev)
      if (uploading) next.add(targetKey)
      else next.delete(targetKey)
      return next
    })
  }
  const previewPath = slug.trim()
    ? `/${slug.trim()}`
    : studioName.trim()
      ? `/${encodeURIComponent(studioName.trim())}`
      : null

  function brandingPreviewSrc(targetKey: string, storedPath: string) {
    return localPreviews[targetKey] ?? storedPath
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'hero_desktop' | 'hero_mobile' | 'about' | 'contact_desktop' | 'contact_mobile' | 'packages_desktop' | 'packages_mobile',
    slot?: number
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    const targetKey = uploadTargetKey(type, slot)
    const blobUrl = URL.createObjectURL(file)
    setLocalPreviews((prev) => ({ ...prev, [targetKey]: blobUrl }))
    setTargetUploading(targetKey, true)
    try {
      const uploadFile = await compressBrandingFile(file)
      const { uploadUrl, path } = await prepareBrandingUpload({
        type,
        fileName: uploadFile.name,
        contentType: uploadFile.type,
        fileSize: uploadFile.size,
        slot,
      })

      await putToPresignedUrl(uploadUrl, uploadFile)

      const result = await finalizeBrandingUpload(type, path, slot)
      if (result.success && result.path) {
        const storedPath = result.path
        if (type === 'logo') setLogoUrl(storedPath)
        if (type === 'hero_desktop' && slot !== undefined) {
          setHeroDesktopUrls((prev) => {
            const next = [...prev]
            next[slot] = storedPath
            return next
          })
        }
        if (type === 'hero_mobile' && slot !== undefined) {
          setHeroMobileUrls((prev) => {
            const next = [...prev]
            next[slot] = storedPath
            return next
          })
        }
        if (type === 'about') setAboutImageUrl(storedPath)
        if (type === 'contact_desktop') setContactDesktopUrl(storedPath)
        if (type === 'contact_mobile') setContactMobileUrl(storedPath)
        if (type === 'packages_desktop') setPackagesDesktopUrl(storedPath)
        if (type === 'packages_mobile') setPackagesMobileUrl(storedPath)
        setPreviewVersions((prev) => ({ ...prev, [targetKey]: Date.now() }))
        toast.success('התמונה הועלתה בהצלחה')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בהעלאת התמונה')
    } finally {
      URL.revokeObjectURL(blobUrl)
      setLocalPreviews((prev) => {
        const next = { ...prev }
        delete next[targetKey]
        return next
      })
      setTargetUploading(targetKey, false)
      e.target.value = ''
    }
  }

  async function handleRemoveHeroSlot(variant: 'desktop' | 'mobile', slot: number) {
    const targetKey = uploadTargetKey(variant === 'desktop' ? 'hero_desktop' : 'hero_mobile', slot)
    setTargetUploading(targetKey, true)
    try {
      await removeHeroImageSlot({ variant, slot })
      if (variant === 'desktop') {
        setHeroDesktopUrls((prev) => {
          const next = [...prev]
          next[slot] = ''
          return next
        })
      } else {
        setHeroMobileUrls((prev) => {
          const next = [...prev]
          next[slot] = ''
          return next
        })
      }
      toast.success('התמונה הוסרה')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בהסרת התמונה')
    } finally {
      setTargetUploading(targetKey, false)
    }
  }

  async function handleRemoveBrandingImage(type: SingleBrandingImageType) {
    const targetKey = uploadTargetKey(type)
    setTargetUploading(targetKey, true)
    try {
      await removeBrandingImage(type)
      if (type === 'logo') setLogoUrl('')
      if (type === 'about') setAboutImageUrl('')
      if (type === 'contact_desktop') setContactDesktopUrl('')
      if (type === 'contact_mobile') setContactMobileUrl('')
      if (type === 'packages_desktop') setPackagesDesktopUrl('')
      if (type === 'packages_mobile') setPackagesMobileUrl('')
      toast.success('התמונה הוסרה')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בהסרת התמונה')
    } finally {
      setTargetUploading(targetKey, false)
    }
  }

  // Helper to extract R2 storage path from a public URL
  const extractPathFromUrl = (url: string | null) => {
    if (!url) return null
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url
    }
    const match = url.match(/\/branding\/([^?]+)/)
    return match ? match[1] : null
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateProfile({
          name,
          studio_name: studioName,
          theme_primary: accentColor,
          about_text: aboutText,
          about_title: aboutTitle,
          about_subtitle: aboutSubtitle,
          about_description: aboutDescription,
          contact_card_title: contactCardTitle,
          contact_card_description: contactCardDescription,
          stat_projects: statProjects,
          stat_clients: statClients,
          stat_experience_years: statExperienceYears,
          accent_color: accentColor,
          selected_theme: selectedTheme,
          logo_url: extractPathFromUrl(logoUrl) || undefined,
          hero_desktop_url: extractPathFromUrl(heroDesktopUrls.find(Boolean) ?? null) || undefined,
          hero_mobile_url: extractPathFromUrl(heroMobileUrls.find(Boolean) ?? null) || undefined,
          hero_desktop_urls: heroDesktopUrls
            .map((url) => extractPathFromUrl(url) ?? '')
            .slice(0, 3),
          hero_mobile_urls: heroMobileUrls
            .map((url) => extractPathFromUrl(url) ?? '')
            .slice(0, 3),
          about_image_url: extractPathFromUrl(aboutImageUrl) || undefined,
          contact_desktop_url: extractPathFromUrl(contactDesktopUrl) || undefined,
          contact_mobile_url: extractPathFromUrl(contactMobileUrl) || undefined,
          packages_desktop_url: extractPathFromUrl(packagesDesktopUrl) || undefined,
          packages_mobile_url: extractPathFromUrl(packagesMobileUrl) || undefined,
          email,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          slug,
          should_color_logo: shouldColorLogo,
        })
        toast.success('הפרופיל עודכן')
        document.documentElement.style.setProperty('--client-accent', accentColor)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }


  return (
    <div className="space-y-10 pb-10 md:pb-24">
      {/* Section 1: Business Details */}
      <section className="space-y-6">
        <SectionHeader
          icon={Building2}
          title="פרטי העסק"
          help={SITE_SETTINGS_HELP.sections.business.content}
          where={SITE_SETTINGS_HELP.sections.business.where}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="studio-name"
              help={SITE_SETTINGS_HELP.fields.studioName.content}
              where={SITE_SETTINGS_HELP.fields.studioName.where}
            >
              שם העסק
            </LabelWithHelp>
            <Input
              id="studio-name"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-[--border]"
            />
          </div>
          <div className="space-y-2" dir="ltr">
            <LabelWithHelp
              htmlFor="slug"
              className="text-right"
              help={SITE_SETTINGS_HELP.fields.slug.content}
              where={SITE_SETTINGS_HELP.fields.slug.where}
            >
              כתובת אתר (Slug)
            </LabelWithHelp>
            <div className="flex items-center bg-white dark:bg-zinc-900 border-[--border] rounded-lg overflow-hidden">
              <span className="bg-[--border]/30 px-3 py-3 text-[--muted] text-sm border-r border-[--border]">gallery.studio/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 border-none focus:ring-0"
              />
            </div>
            {previewPath ? (
              <a
                href={previewPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[--foreground]/70 hover:text-[--foreground] transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                צפייה באתר הציבורי
              </a>
            ) : null}
          </div>
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="email"
              help={SITE_SETTINGS_HELP.fields.email.content}
              where={SITE_SETTINGS_HELP.fields.email.where}
            >
              אימייל רשמי
            </LabelWithHelp>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-[--border]"
            />
          </div>
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="phone"
              help={SITE_SETTINGS_HELP.fields.phone.content}
              where={SITE_SETTINGS_HELP.fields.phone.where}
            >
              טלפון
            </LabelWithHelp>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-0000000"
              className="bg-white dark:bg-zinc-900 border-[--border]"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="address"
              help={SITE_SETTINGS_HELP.fields.address.content}
              where={SITE_SETTINGS_HELP.fields.address.where}
            >
              כתובת / עיר
            </LabelWithHelp>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-[--border]"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Website Content */}
      <section className="space-y-6">
        <SectionHeader
          icon={Globe}
          title="תוכן האתר"
          help={SITE_SETTINGS_HELP.sections.content.content}
          where={SITE_SETTINGS_HELP.sections.content.where}
        />
        <div className="space-y-8">
          <div className="space-y-3">
            <LabelWithHelp
              help={SITE_SETTINGS_HELP.fields.heroDesktop.content}
              where={SITE_SETTINGS_HELP.fields.heroDesktop.where}
            >
              תמונות הירו (דסקטופ) — עד 3 תמונות מתחלפות
            </LabelWithHelp>
            <p className="text-sm text-[--muted]">התמונות יתחלפו ברקע כל 2 שניות עם אנימציית fade</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {heroDesktopUrls.map((url, slot) => {
                const targetKey = uploadTargetKey('hero_desktop', slot)
                const previewSrc = brandingPreviewSrc(targetKey, url)
                return (
                <div key={`hero-desktop-${slot}`} className="space-y-2">
                  <span className="text-xs text-[--muted]">תמונה {slot + 1}</span>
                  <div className="relative group aspect-video bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] cursor-pointer transition-all hover:border-[--foreground]">
                    {previewSrc ? (
                      <BrandingPreviewImage
                        src={previewSrc}
                        cacheKey={previewVersions[targetKey]}
                        alt={`Hero desktop ${slot + 1}`}
                        className="object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[--muted]">
                        <Upload className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-white text-sm font-medium">{previewSrc ? 'החלף' : 'העלה'}</span>
                    </div>
                    <UploadSpinnerOverlay show={uploadingTargets.has(targetKey)} />
                    {previewSrc && url ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveHeroSlot('desktop', slot)}
                        disabled={uploadingTargets.has(targetKey)}
                        className="absolute top-2 left-2 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                        aria-label="הסר תמונה"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileUpload(e, 'hero_desktop', slot)}
                      disabled={uploadingTargets.has(targetKey)}
                      className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              )})}
            </div>
          </div>

          <div className="space-y-3">
            <LabelWithHelp
              help={SITE_SETTINGS_HELP.fields.heroMobile.content}
              where={SITE_SETTINGS_HELP.fields.heroMobile.where}
            >
              תמונות הירו (מובייל) — עד 3 תמונות מתחלפות
            </LabelWithHelp>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {heroMobileUrls.map((url, slot) => {
                const targetKey = uploadTargetKey('hero_mobile', slot)
                const previewSrc = brandingPreviewSrc(targetKey, url)
                return (
                <div key={`hero-mobile-${slot}`} className="space-y-2">
                  <span className="text-xs text-[--muted]">תמונה {slot + 1}</span>
                  <div className="relative group aspect-[9/16] max-w-[180px] bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] cursor-pointer transition-all hover:border-[--foreground]">
                    {previewSrc ? (
                      <BrandingPreviewImage
                        src={previewSrc}
                        cacheKey={previewVersions[targetKey]}
                        alt={`Hero mobile ${slot + 1}`}
                        className="object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[--muted]">
                        <Upload className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-white text-sm font-medium">{previewSrc ? 'החלף' : 'העלה'}</span>
                    </div>
                    <UploadSpinnerOverlay show={uploadingTargets.has(targetKey)} />
                    {previewSrc && url ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveHeroSlot('mobile', slot)}
                        disabled={uploadingTargets.has(targetKey)}
                        className="absolute top-2 left-2 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                        aria-label="הסר תמונה"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileUpload(e, 'hero_mobile', slot)}
                      disabled={uploadingTargets.has(targetKey)}
                      className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              )})}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-sm">
          {/* About Section Image */}
          <div className="space-y-3">
            <LabelWithHelp
              htmlFor="about-image"
              help={SITE_SETTINGS_HELP.fields.aboutImage.content}
              where={SITE_SETTINGS_HELP.fields.aboutImage.where}
            >
              תמונת אודות
            </LabelWithHelp>
            <div className="relative group aspect-square bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] cursor-pointer transition-all hover:border-[--foreground]">
              {brandingPreviewSrc('about', aboutImageUrl) ? (
                <BrandingPreviewImage
                  src={brandingPreviewSrc('about', aboutImageUrl)}
                  cacheKey={previewVersions.about}
                  alt="About image preview"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[--muted]">
                  <Upload className="h-8 w-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium">החלף תמונה</span>
              </div>
              <UploadSpinnerOverlay show={uploadingTargets.has(uploadTargetKey('about'))} />
              {aboutImageUrl ? (
                <button
                  type="button"
                  onClick={() => handleRemoveBrandingImage('about')}
                  disabled={uploadingTargets.has(uploadTargetKey('about'))}
                  className="absolute top-2 left-2 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                  aria-label="הסר תמונה"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
              <input
                id="about-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileUpload(e, 'about')}
                disabled={uploadingTargets.has(uploadTargetKey('about'))}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
        <div className="space-y-3 pt-2 border-t border-[--border]">
          <div className="flex items-start gap-1.5">
            <div>
              <h3 className="text-sm font-semibold text-[--foreground]">רקע יצירת קשר (דף הבית)</h3>
              <p className="text-xs text-[--muted] mt-1">תמונת רקע רק לסקשן יצירת הקשר · במובייל התמונה תהיה בהירה ותתמזג ברקע</p>
            </div>
            <HelpTooltip
              content={SITE_SETTINGS_HELP.fields.contactBgDesktop.content}
              where={SITE_SETTINGS_HELP.fields.contactBgDesktop.where}
              className="mt-0.5"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <LabelWithHelp
                htmlFor="contact-desktop"
                help={SITE_SETTINGS_HELP.fields.contactBgDesktop.content}
                where={SITE_SETTINGS_HELP.fields.contactBgDesktop.where}
              >
                רקע יצירת קשר (דסקטופ)
              </LabelWithHelp>
              <div className="relative group aspect-video bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] cursor-pointer transition-all hover:border-[--foreground]">
                {brandingPreviewSrc('contact_desktop', contactDesktopUrl) ? (
                  <BrandingPreviewImage
                    src={brandingPreviewSrc('contact_desktop', contactDesktopUrl)}
                    cacheKey={previewVersions.contact_desktop}
                    alt="Contact desktop background preview"
                    className="object-cover pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[--muted]">
                    <Upload className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-white text-sm font-medium">החלף תמונה</span>
                </div>
                <UploadSpinnerOverlay show={uploadingTargets.has(uploadTargetKey('contact_desktop'))} />
                {contactDesktopUrl ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveBrandingImage('contact_desktop')}
                    disabled={uploadingTargets.has(uploadTargetKey('contact_desktop'))}
                    className="absolute top-2 left-2 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                    aria-label="הסר תמונה"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
                <input
                  id="contact-desktop"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileUpload(e, 'contact_desktop')}
                  disabled={uploadingTargets.has(uploadTargetKey('contact_desktop'))}
                  className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-3">
              <LabelWithHelp
                htmlFor="contact-mobile"
                help={SITE_SETTINGS_HELP.fields.contactBgMobile.content}
                where={SITE_SETTINGS_HELP.fields.contactBgMobile.where}
              >
                רקע יצירת קשר (מובייל)
              </LabelWithHelp>
              <div className="relative group aspect-[9/16] bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] max-w-[200px] mx-auto cursor-pointer transition-all hover:border-[--foreground]">
                {brandingPreviewSrc('contact_mobile', contactMobileUrl) ? (
                  <BrandingPreviewImage
                    src={brandingPreviewSrc('contact_mobile', contactMobileUrl)}
                    cacheKey={previewVersions.contact_mobile}
                    alt="Contact mobile background preview"
                    className="object-cover pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[--muted]">
                    <Upload className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-white text-sm font-medium">החלף תמונה</span>
                </div>
                <UploadSpinnerOverlay show={uploadingTargets.has(uploadTargetKey('contact_mobile'))} />
                {contactMobileUrl ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveBrandingImage('contact_mobile')}
                    disabled={uploadingTargets.has(uploadTargetKey('contact_mobile'))}
                    className="absolute top-2 left-2 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                    aria-label="הסר תמונה"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
                <input
                  id="contact-mobile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileUpload(e, 'contact_mobile')}
                  disabled={uploadingTargets.has(uploadTargetKey('contact_mobile'))}
                  className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3 pt-2 border-t border-[--border]">
          <div className="flex items-start gap-1.5">
            <div>
              <h3 className="text-sm font-semibold text-[--foreground]">רקע חבילות צילום (דף הבית)</h3>
              <p className="text-xs text-[--muted] mt-1">תמונת רקע לסקשן החבילות · במובייל התמונה תהיה בהירה ותתמזג ברקע</p>
            </div>
            <HelpTooltip
              content={SITE_SETTINGS_HELP.fields.packagesBgDesktop.content}
              where={SITE_SETTINGS_HELP.fields.packagesBgDesktop.where}
              className="mt-0.5"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <LabelWithHelp
                htmlFor="packages-desktop"
                help={SITE_SETTINGS_HELP.fields.packagesBgDesktop.content}
                where={SITE_SETTINGS_HELP.fields.packagesBgDesktop.where}
              >
                רקע חבילות (דסקטופ)
              </LabelWithHelp>
              <div className="relative group aspect-video bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] cursor-pointer transition-all hover:border-[--foreground]">
                {brandingPreviewSrc('packages_desktop', packagesDesktopUrl) ? (
                  <BrandingPreviewImage
                    src={brandingPreviewSrc('packages_desktop', packagesDesktopUrl)}
                    cacheKey={previewVersions.packages_desktop}
                    alt="Packages desktop background preview"
                    className="object-cover pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[--muted]">
                    <Upload className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-white text-sm font-medium">החלף תמונה</span>
                </div>
                <UploadSpinnerOverlay show={uploadingTargets.has(uploadTargetKey('packages_desktop'))} />
                {packagesDesktopUrl ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveBrandingImage('packages_desktop')}
                    disabled={uploadingTargets.has(uploadTargetKey('packages_desktop'))}
                    className="absolute top-2 left-2 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                    aria-label="הסר תמונה"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
                <input
                  id="packages-desktop"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileUpload(e, 'packages_desktop')}
                  disabled={uploadingTargets.has(uploadTargetKey('packages_desktop'))}
                  className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-3">
              <LabelWithHelp
                htmlFor="packages-mobile"
                help={SITE_SETTINGS_HELP.fields.packagesBgMobile.content}
                where={SITE_SETTINGS_HELP.fields.packagesBgMobile.where}
              >
                רקע חבילות (מובייל)
              </LabelWithHelp>
              <div className="relative group aspect-[9/16] bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] max-w-[200px] mx-auto cursor-pointer transition-all hover:border-[--foreground]">
                {brandingPreviewSrc('packages_mobile', packagesMobileUrl) ? (
                  <BrandingPreviewImage
                    src={brandingPreviewSrc('packages_mobile', packagesMobileUrl)}
                    cacheKey={previewVersions.packages_mobile}
                    alt="Packages mobile background preview"
                    className="object-cover pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[--muted]">
                    <Upload className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-white text-sm font-medium">החלף תמונה</span>
                </div>
                <UploadSpinnerOverlay show={uploadingTargets.has(uploadTargetKey('packages_mobile'))} />
                {packagesMobileUrl ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveBrandingImage('packages_mobile')}
                    disabled={uploadingTargets.has(uploadTargetKey('packages_mobile'))}
                    className="absolute top-2 left-2 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                    aria-label="הסר תמונה"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
                <input
                  id="packages-mobile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileUpload(e, 'packages_mobile')}
                  disabled={uploadingTargets.has(uploadTargetKey('packages_mobile'))}
                  className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2 pt-4">
          <LabelWithHelp
            htmlFor="about-text"
            help={SITE_SETTINGS_HELP.fields.aboutText.content}
            where={SITE_SETTINGS_HELP.fields.aboutText.where}
          >
            טקסט אודות העסק
          </LabelWithHelp>
          <Textarea
            id="about-text"
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            rows={4}
            className="bg-white dark:bg-zinc-900 border-[--border] resize-none"
            placeholder="ספרי על עצמך ועל הסטודיו שלך..."
          />
        </div>
        </div>
      </section>

      {/* Section 3: Branding & Design */}
      <section className="space-y-6">
        <SectionHeader
          icon={Palette}
          title="מיתוג ועיצוב"
          help={SITE_SETTINGS_HELP.sections.branding.content}
          where={SITE_SETTINGS_HELP.sections.branding.where}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="name"
                help={SITE_SETTINGS_HELP.fields.photographerName.content}
                where={SITE_SETTINGS_HELP.fields.photographerName.where}
              >
                שם הצלם/ת
              </LabelWithHelp>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white dark:bg-zinc-900 border-[--border]"
              />
            </div>
            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="accent"
                help={SITE_SETTINGS_HELP.fields.accentColor.content}
                where={SITE_SETTINGS_HELP.fields.accentColor.where}
              >
                צבע מותג ראשי
              </LabelWithHelp>
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border-[--border] rounded-lg px-4 py-2">
                <Input
                  id="accent"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-none cursor-pointer bg-transparent p-0"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 border-none focus:ring-0"
                />
              </div>
            </div>
            <div className="space-y-3">
              <LabelWithHelp
                help={SITE_SETTINGS_HELP.fields.theme.content}
                where={SITE_SETTINGS_HELP.fields.theme.where}
              >
                ערכת נושא מועדפת
              </LabelWithHelp>
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="ערכת נושא מועדפת">
                {THEMES.map((theme) => {
                  const help = THEME_HELP[theme.id]
                  const isSelected = selectedTheme === theme.id
                  return (
                    <div
                      key={theme.id}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => setSelectedTheme(theme.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedTheme(theme.id)
                        }
                      }}
                      className={`relative rounded-xl border-2 p-4 text-right transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#7D3A52] bg-[#7D3A52]/5'
                          : 'border-[--border] hover:border-[#7D3A52]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className="h-6 w-6 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: theme.color1 }}
                              title={theme.color1Label}
                            />
                            <span className="text-[10px] text-[--muted] leading-none">{theme.color1Label}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className="h-6 w-6 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: theme.color2 }}
                              title={theme.color2Label}
                            />
                            <span className="text-[10px] text-[--muted] leading-none">{theme.color2Label}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className="h-6 w-6 rounded-full border-2 border-black/10 shadow-sm ring-1 ring-black/5"
                              style={{ backgroundColor: accentColor }}
                              title="צבע המותג שלך"
                            />
                            <span className="text-[10px] text-[--muted] leading-none">מותג</span>
                          </div>
                        </div>
                        <HelpTooltip
                          content={help.content}
                          where={help.where}
                          side="bottom"
                        />
                      </div>
                      <div className="mt-2 font-medium text-[--foreground]">{theme.name}</div>
                      <div className="text-xs text-[--muted] mt-0.5">{help.tagline}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="logo"
              help={SITE_SETTINGS_HELP.fields.logo.content}
              where={SITE_SETTINGS_HELP.fields.logo.where}
            >
              לוגו סטודיו
            </LabelWithHelp>
            <div className="relative h-full min-h-[160px] flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border-2 border-dashed border-[--border] hover:border-[--foreground] transition-colors cursor-pointer group overflow-hidden">
              <div className="p-6 text-center">
                {brandingPreviewSrc('logo', logoUrl) ? (
                  <div className="relative h-20 w-20 mb-2 mx-auto">
                    <BrandingPreviewImage
                      src={brandingPreviewSrc('logo', logoUrl)}
                      cacheKey={previewVersions.logo}
                      alt="Logo preview"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-[--muted] group-hover:text-[--foreground] mb-2 transition-colors mx-auto" />
                    <p className="text-sm text-[--muted]">גרור לוגו או לחץ להעלאה</p>
                    <p className="text-xs text-[--muted] mt-1">PNG, SVG (רקע שקוף מומלץ)</p>
                  </>
                )}
              </div>
              <UploadSpinnerOverlay show={uploadingTargets.has(uploadTargetKey('logo'))} />
              {logoUrl ? (
                <button
                  type="button"
                  onClick={() => handleRemoveBrandingImage('logo')}
                  disabled={uploadingTargets.has(uploadTargetKey('logo'))}
                  className="absolute top-2 left-2 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                  aria-label="הסר לוגו"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
              <input
                id="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={(e) => handleFileUpload(e, 'logo')}
                disabled={uploadingTargets.has(uploadTargetKey('logo'))}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
        {/* Logo Coloring Toggle */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <LabelWithHelp
              htmlFor="should-color-logo"
              help={SITE_SETTINGS_HELP.fields.shouldColorLogo.content}
              where={SITE_SETTINGS_HELP.fields.shouldColorLogo.where}
            >
              צביעת הלוגו בצבע המותג שלי
            </LabelWithHelp>
            <Switch
              id="should-color-logo"
              checked={shouldColorLogo}
              onCheckedChange={setShouldColorLogo}
            />
          </div>
        </div>
      </section>

      {/* Section 4: About Me Settings */}
      <section className="space-y-6">
        <SectionHeader
          icon={Globe}
          title="הגדרות אודותי"
          help={SITE_SETTINGS_HELP.sections.about.content}
          where={SITE_SETTINGS_HELP.sections.about.where}
        />
        <div className="space-y-4">
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="about-title"
              help={SITE_SETTINGS_HELP.fields.aboutTitle.content}
              where={SITE_SETTINGS_HELP.fields.aboutTitle.where}
            >
              כותרת
            </LabelWithHelp>
            <Input
              id="about-title"
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-[--border]"
              placeholder="לדוגמה: צלמת מקצועית"
            />
          </div>
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="about-subtitle"
              help={SITE_SETTINGS_HELP.fields.aboutSubtitle.content}
              where={SITE_SETTINGS_HELP.fields.aboutSubtitle.where}
            >
              כותרת משנה
            </LabelWithHelp>
            <Input
              id="about-subtitle"
              value={aboutSubtitle}
              onChange={(e) => setAboutSubtitle(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-[--border]"
              placeholder="לדוגמה: מתמחה בצילום פורטרטים"
            />
          </div>
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="about-description"
              help={SITE_SETTINGS_HELP.fields.aboutDescription.content}
              where={SITE_SETTINGS_HELP.fields.aboutDescription.where}
            >
              תיאור
            </LabelWithHelp>
            <Textarea
              id="about-description"
              value={aboutDescription}
              onChange={(e) => setAboutDescription(e.target.value)}
              rows={6}
              className="bg-white dark:bg-zinc-900 border-[--border] resize-y"
              placeholder="ספרי על עצמך ועל הסטודיו שלך..."
            />
          </div>
          <div className="space-y-3 pt-2 border-t border-[--border]">
            <LabelWithHelp
              help={SITE_SETTINGS_HELP.fields.stats.content}
              where={SITE_SETTINGS_HELP.fields.stats.where}
            >
              נתונים לתצוגה באתר
            </LabelWithHelp>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="stat-clients"
                  help={SITE_SETTINGS_HELP.fields.statClients.content}
                  where={SITE_SETTINGS_HELP.fields.statClients.where}
                >
                  לקוחות מרוצים
                </LabelWithHelp>
                <Input
                  id="stat-clients"
                  type="number"
                  min={0}
                  value={statClients}
                  onChange={(e) => setStatClients(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="bg-white dark:bg-zinc-900 border-[--border]"
                />
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="stat-projects"
                  help={SITE_SETTINGS_HELP.fields.statProjects.content}
                  where={SITE_SETTINGS_HELP.fields.statProjects.where}
                >
                  תיקי עבודות
                </LabelWithHelp>
                <Input
                  id="stat-projects"
                  type="number"
                  min={0}
                  value={statProjects}
                  onChange={(e) => setStatProjects(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="bg-white dark:bg-zinc-900 border-[--border]"
                />
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="stat-experience"
                  help={SITE_SETTINGS_HELP.fields.statExperience.content}
                  where={SITE_SETTINGS_HELP.fields.statExperience.where}
                >
                  שנות ניסיון
                </LabelWithHelp>
                <Input
                  id="stat-experience"
                  type="number"
                  min={0}
                  value={statExperienceYears}
                  onChange={(e) =>
                    setStatExperienceYears(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="bg-white dark:bg-zinc-900 border-[--border]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Gallery Contact Card Settings */}
      <section className="space-y-6">
        <SectionHeader
          icon={Palette}
          title="הגדרות כרטיס יצירת קשר בגלריה"
          help={SITE_SETTINGS_HELP.sections.contactCard.content}
          where={SITE_SETTINGS_HELP.sections.contactCard.where}
        />
        <div className="space-y-4">
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="contact-card-title"
              help={SITE_SETTINGS_HELP.fields.contactCardTitle.content}
              where={SITE_SETTINGS_HELP.fields.contactCardTitle.where}
            >
              כותרת כרטיס
            </LabelWithHelp>
            <Input
              id="contact-card-title"
              value={contactCardTitle}
              onChange={(e) => setContactCardTitle(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-[--border]"
              placeholder="לדוגמה: תיאום צילום"
            />
          </div>
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="contact-card-description"
              help={SITE_SETTINGS_HELP.fields.contactCardDescription.content}
              where={SITE_SETTINGS_HELP.fields.contactCardDescription.where}
            >
              תיאור כרטיס
            </LabelWithHelp>
            <Textarea
              id="contact-card-description"
              value={contactCardDescription}
              onChange={(e) => setContactCardDescription(e.target.value)}
              rows={4}
              className="bg-white dark:bg-zinc-900 border-[--border] resize-y"
              placeholder="לדוגמה: לתיאום צילום או שאלות, צרו קשר..."
            />
          </div>
        </div>
      </section>

      <div className="fixed bottom-8 left-4 z-50 md:bottom-8 md:left-8">
        <Button
          onClick={handleSave}
          disabled={isPending}
          size="lg"
          className="min-w-[168px] bg-[#7D3A52] px-8 font-semibold text-white shadow-lg shadow-[#7D3A52]/35 hover:bg-[#6a2f44] focus-visible:ring-[#7D3A52]/40"
        >
          {isPending ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>
    </div>
  )
}

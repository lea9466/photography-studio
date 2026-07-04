'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/actions/feedback.actions'
import { finalizeBrandingUpload, prepareBrandingUpload, removeHeroImageSlot } from '@/lib/actions/branding.actions'
import { putToPresignedUrl } from '@/lib/r2/upload-client'
import { BrandingPreviewImage } from '@/components/dashboard/BrandingPreviewImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, ExternalLink, Globe, Palette, Trash2, Upload } from 'lucide-react'

const HERO_SLOT_COUNT = 3

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
    email: string | null
    slug: string | null
    should_color_logo: boolean
  } | null
}

const THEMES = [
  { id: 'classic', name: 'קלאסי', background: '#fafafa', foreground: '#171717' },
  { id: 'modern', name: 'מודרני', background: '#ffffff', foreground: '#09090b' },
  { id: 'elegant', name: 'אלגנטי', background: '#0a0a0a', foreground: '#fafafa' },
  { id: 'bold', name: 'נועז', background: '#1c1917', foreground: '#fafafa' },
]

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
  const [selectedTheme, setSelectedTheme] = useState(profile?.selected_theme ?? 'classic')
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
  const [email, setEmail] = useState(profile?.email ?? '')
  const [slug, setSlug] = useState(profile?.slug ?? '')
  const [shouldColorLogo, setShouldColorLogo] = useState(profile?.should_color_logo ?? false)
  const [isUploading, setIsUploading] = useState(false)
  const previewPath = slug.trim()
    ? `/${slug.trim()}`
    : studioName.trim()
      ? `/${encodeURIComponent(studioName.trim())}`
      : null

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'hero_desktop' | 'hero_mobile' | 'about' | 'contact_desktop' | 'contact_mobile',
    slot?: number
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const { uploadUrl, path } = await prepareBrandingUpload({
        type,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        slot,
      })

      await putToPresignedUrl(uploadUrl, file)

      const result = await finalizeBrandingUpload(type, path, slot)
      if (result.success && result.url) {
        if (type === 'logo') setLogoUrl(result.url)
        if (type === 'hero_desktop' && slot !== undefined) {
          setHeroDesktopUrls((prev) => {
            const next = [...prev]
            next[slot] = result.url!
            return next
          })
        }
        if (type === 'hero_mobile' && slot !== undefined) {
          setHeroMobileUrls((prev) => {
            const next = [...prev]
            next[slot] = result.url!
            return next
          })
        }
        if (type === 'about') setAboutImageUrl(result.url)
        if (type === 'contact_desktop') setContactDesktopUrl(result.url)
        if (type === 'contact_mobile') setContactMobileUrl(result.url)
        toast.success('התמונה הועלתה בהצלחה')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בהעלאת התמונה')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  async function handleRemoveHeroSlot(variant: 'desktop' | 'mobile', slot: number) {
    setIsUploading(true)
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
      setIsUploading(false)
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
          email,
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
    <div className="space-y-10">
      {/* Section 1: Business Details */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[--border] pb-2">
          <Building2 className="h-6 w-6 text-[--foreground]" />
          <h2 className="text-lg font-semibold text-[--foreground]">פרטי העסק</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="studio-name">שם העסק</Label>
            <Input
              id="studio-name"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-[--border]"
            />
          </div>
          <div className="space-y-2" dir="ltr">
            <Label htmlFor="slug" className="text-right">כתובת אתר (Slug)</Label>
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
            <Label htmlFor="email">אימייל רשמי</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-[--border]"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Website Content */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[--border] pb-2">
          <Globe className="h-6 w-6 text-[--foreground]" />
          <h2 className="text-lg font-semibold text-[--foreground]">תוכן האתר</h2>
        </div>
        <div className="space-y-8">
          <div className="space-y-3">
            <Label>תמונות הירו (דסקטופ) — עד 3 תמונות מתחלפות</Label>
            <p className="text-sm text-[--muted]">התמונות יתחלפו ברקע כל 2 שניות עם אנימציית fade</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {heroDesktopUrls.map((url, slot) => (
                <div key={`hero-desktop-${slot}`} className="space-y-2">
                  <span className="text-xs text-[--muted]">תמונה {slot + 1}</span>
                  <div className="relative group aspect-video bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] cursor-pointer transition-all hover:border-[--foreground]">
                    {url ? (
                      <BrandingPreviewImage
                        src={url}
                        alt={`Hero desktop ${slot + 1}`}
                        className="object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[--muted]">
                        <Upload className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-white text-sm font-medium">{url ? 'החלף' : 'העלה'}</span>
                    </div>
                    {url ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveHeroSlot('desktop', slot)}
                        disabled={isUploading}
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
                      disabled={isUploading}
                      className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>תמונות הירו (מובייל) — עד 3 תמונות מתחלפות</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {heroMobileUrls.map((url, slot) => (
                <div key={`hero-mobile-${slot}`} className="space-y-2">
                  <span className="text-xs text-[--muted]">תמונה {slot + 1}</span>
                  <div className="relative group aspect-[9/16] max-w-[180px] bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] cursor-pointer transition-all hover:border-[--foreground]">
                    {url ? (
                      <BrandingPreviewImage
                        src={url}
                        alt={`Hero mobile ${slot + 1}`}
                        className="object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[--muted]">
                        <Upload className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-white text-sm font-medium">{url ? 'החלף' : 'העלה'}</span>
                    </div>
                    {url ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveHeroSlot('mobile', slot)}
                        disabled={isUploading}
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
                      disabled={isUploading}
                      className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-sm">
          {/* About Section Image */}
          <div className="space-y-3">
            <Label htmlFor="about-image">תמונת אודות</Label>
            <div className="relative group aspect-square bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] cursor-pointer transition-all hover:border-[--foreground]">
              {aboutImageUrl ? (
                <BrandingPreviewImage
                  src={aboutImageUrl}
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
              <input
                id="about-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileUpload(e, 'about')}
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
        <div className="space-y-3 pt-2 border-t border-[--border]">
          <div>
            <h3 className="text-sm font-semibold text-[--foreground]">רקע יצירת קשר (דף הבית)</h3>
            <p className="text-xs text-[--muted] mt-1">תמונת רקע רק לסקשן יצירת הקשר · במובייל התמונה תהיה בהירה ותתמזג ברקע</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="contact-desktop">רקע יצירת קשר (דסקטופ)</Label>
              <div className="relative group aspect-video bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] cursor-pointer transition-all hover:border-[--foreground]">
                {contactDesktopUrl ? (
                  <BrandingPreviewImage
                    src={contactDesktopUrl}
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
                <input
                  id="contact-desktop"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileUpload(e, 'contact_desktop')}
                  disabled={isUploading}
                  className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="contact-mobile">רקע יצירת קשר (מובייל)</Label>
              <div className="relative group aspect-[9/16] bg-[--border]/30 rounded-xl overflow-hidden border border-[--border] max-w-[200px] mx-auto cursor-pointer transition-all hover:border-[--foreground]">
                {contactMobileUrl ? (
                  <BrandingPreviewImage
                    src={contactMobileUrl}
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
                <input
                  id="contact-mobile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileUpload(e, 'contact_mobile')}
                  disabled={isUploading}
                  className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2 pt-4">
          <Label htmlFor="about-text">טקסט אודות העסק</Label>
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
        <div className="flex items-center gap-2 border-b border-[--border] pb-2">
          <Palette className="h-6 w-6 text-[--foreground]" />
          <h2 className="text-lg font-semibold text-[--foreground]">מיתוג ועיצוב</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם הצלם/ת</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white dark:bg-zinc-900 border-[--border]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent">צבע מותג ראשי</Label>
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
            <div className="space-y-2">
              <Label htmlFor="theme">ערכת נושא מועדפת</Label>
              <select
                id="theme"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border-[--border] rounded-lg px-4 py-3 appearance-none"
              >
                {THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">לוגו סטודיו</Label>
            <div className="relative h-full min-h-[160px] flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border-2 border-dashed border-[--border] hover:border-[--foreground] transition-colors cursor-pointer group">
              <div className="p-6 text-center">
                {logoUrl ? (
                  <div className="relative h-20 w-20 mb-2">
                    <BrandingPreviewImage
                      src={logoUrl}
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
              <input
                id="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={(e) => handleFileUpload(e, 'logo')}
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
        {/* Logo Coloring Toggle */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="should-color-logo">צביעת הלוגו בצבע המותג שלי</Label>
            <Switch
              id="should-color-logo"
              checked={shouldColorLogo}
              onCheckedChange={setShouldColorLogo}
            />
          </div>
          <p className="text-xs text-[--muted]">מתאים לקובצי SVG בלבד. אם תעלי לוגו כקובץ תמונה רגיל (PNG), הוא יוצג בצבעיו המקוריים.</p>
        </div>
      </section>

      {/* Section 4: About Me Settings */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[--border] pb-2">
          <Globe className="h-6 w-6 text-[--foreground]" />
          <h2 className="text-lg font-semibold text-[--foreground]">הגדרות אודותי</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="about-title">כותרת</Label>
            <Input
              id="about-title"
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-[--border]"
              placeholder="לדוגמה: צלמת מקצועית"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about-subtitle">כותרת משנה</Label>
            <Input
              id="about-subtitle"
              value={aboutSubtitle}
              onChange={(e) => setAboutSubtitle(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-[--border]"
              placeholder="לדוגמה: מתמחה בצילום פורטרטים"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about-description">תיאור</Label>
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
            <Label>נתונים לתצוגה באתר</Label>
            <p className="text-sm text-[--muted]">
              המספרים יוצגו באזור &quot;אודות&quot; בדף הבית (למשל: 10+ לקוחות מרוצים)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stat-clients">לקוחות מרוצים</Label>
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
                <Label htmlFor="stat-projects">תיקי עבודות</Label>
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
                <Label htmlFor="stat-experience">שנות ניסיון</Label>
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
        <div className="flex items-center gap-2 border-b border-[--border] pb-2">
          <Palette className="h-6 w-6 text-[--foreground]" />
          <h2 className="text-lg font-semibold text-[--foreground]">הגדרות כרטיס יצירת קשר בגלריה</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-card-title">כותרת כרטיס</Label>
            <Input
              id="contact-card-title"
              value={contactCardTitle}
              onChange={(e) => setContactCardTitle(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-[--border]"
              placeholder="לדוגמה: תיאום צילום"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-card-description">תיאור כרטיס</Label>
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

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isPending} size="lg" className="w-full">
        {isPending ? 'שומר...' : 'שמור שינויים'}
      </Button>
    </div>
  )
}

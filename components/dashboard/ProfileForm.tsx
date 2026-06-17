'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/actions/feedback.actions'
import { uploadBrandingImage } from '@/lib/actions/branding.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type ProfileFormProps = {
  profile: {
    name: string | null
    studio_name: string | null
    theme_primary: string
    about_text: string | null
    stat_projects: number
    stat_clients: number
    stat_experience_years: number
    accent_color: string
    selected_theme: string
    logo_url: string | null
    hero_desktop_url: string | null
    hero_mobile_url: string | null
    about_image_url: string | null
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
  const [statProjects, setStatProjects] = useState(profile?.stat_projects ?? 0)
  const [statClients, setStatClients] = useState(profile?.stat_clients ?? 0)
  const [statExperienceYears, setStatExperienceYears] = useState(profile?.stat_experience_years ?? 0)
  const [accentColor, setAccentColor] = useState(profile?.accent_color ?? '#7c3aed')
  const [selectedTheme, setSelectedTheme] = useState(profile?.selected_theme ?? 'classic')
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url ?? '')
  const [heroDesktopUrl, setHeroDesktopUrl] = useState(profile?.hero_desktop_url ?? '')
  const [heroMobileUrl, setHeroMobileUrl] = useState(profile?.hero_mobile_url ?? '')
  const [aboutImageUrl, setAboutImageUrl] = useState(profile?.about_image_url ?? '')
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero_desktop' | 'hero_mobile' | 'about') {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const result = await uploadBrandingImage(formData)
      if (result.success && result.url) {
        // Update the appropriate URL state
        if (type === 'logo') setLogoUrl(result.url)
        if (type === 'hero_desktop') setHeroDesktopUrl(result.url)
        if (type === 'hero_mobile') setHeroMobileUrl(result.url)
        if (type === 'about') setAboutImageUrl(result.url)
        toast.success('התמונה הועלתה בהצלחה')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בהעלאת התמונה')
    } finally {
      setIsUploading(false)
    }
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProfile({
          name,
          studio_name: studioName,
          theme_primary: accentColor,
          about_text: aboutText,
          stat_projects: statProjects,
          stat_clients: statClients,
          stat_experience_years: statExperienceYears,
          accent_color: accentColor,
          selected_theme: selectedTheme,
          logo_url: logoUrl || undefined,
          hero_desktop_url: heroDesktopUrl || undefined,
          hero_mobile_url: heroMobileUrl || undefined,
          about_image_url: aboutImageUrl || undefined,
        })
        toast.success('הפרופיל עודכן')
        document.documentElement.style.setProperty('--client-accent', accentColor)
        document.documentElement.setAttribute('data-theme', selectedTheme)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>פרופיל צלמת</CardTitle>
          <CardDescription>מוצג ללקוחות בגלריה</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studio">שם הסטודיו</Label>
            <Input
              id="studio"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about">טקסט אודות</Label>
            <Textarea
              id="about"
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              rows={4}
              placeholder="ספרי על עצמך ועל הסטודיו שלך..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>סטטיסטיקות</CardTitle>
          <CardDescription>מוצגות בסקשן אודות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="projects">פרויקטים</Label>
              <Input
                id="projects"
                type="number"
                value={statProjects}
                onChange={(e) => setStatProjects(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clients">לקוחות</Label>
              <Input
                id="clients"
                type="number"
                value={statClients}
                onChange={(e) => setStatClients(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">שנות ניסיון</Label>
              <Input
                id="experience"
                type="number"
                value={statExperienceYears}
                onChange={(e) => setStatExperienceYears(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>עיצוב וצבעים</CardTitle>
          <CardDescription>התאמה אישית של המראה</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accent">צבע הדגשה</Label>
            <div className="flex gap-2">
              <Input
                id="accent"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>ערכת נושא</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`relative rounded-lg border-2 p-4 text-right transition-all ${
                    selectedTheme === theme.id
                      ? 'border-[var(--client-accent)] ring-2 ring-[var(--client-accent)] ring-offset-2'
                      : 'border-[--border] hover:border-[--muted]'
                  }`}
                  style={{
                    backgroundColor: theme.background,
                    color: theme.foreground,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{theme.name}</span>
                    {selectedTheme === theme.id && (
                      <Badge variant="default">נבחר</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>תמונות מותג</CardTitle>
          <CardDescription>לוגו, תמונות רקע ותמונת אודות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="logo">לוגו</Label>
            <div className="flex items-center gap-4">
              {logoUrl && (
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[--border]">
                  <Image
                    src={logoUrl}
                    alt="Logo preview"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-desktop">תמונת רקע - דסקטופ</Label>
            <div className="space-y-2">
              {heroDesktopUrl && (
                <div className="relative h-32 w-full overflow-hidden rounded-lg border border-[--border]">
                  <Image
                    src={heroDesktopUrl}
                    alt="Hero desktop preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <Input
                id="hero-desktop"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileUpload(e, 'hero_desktop')}
                disabled={isUploading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-mobile">תמונת רקע - מובייל</Label>
            <div className="space-y-2">
              {heroMobileUrl && (
                <div className="relative h-32 w-full overflow-hidden rounded-lg border border-[--border]">
                  <Image
                    src={heroMobileUrl}
                    alt="Hero mobile preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <Input
                id="hero-mobile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileUpload(e, 'hero_mobile')}
                disabled={isUploading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="about-image">תמונת אודות</Label>
            <div className="space-y-2">
              {aboutImageUrl && (
                <div className="relative h-32 w-full overflow-hidden rounded-lg border border-[--border]">
                  <Image
                    src={aboutImageUrl}
                    alt="About image preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <Input
                id="about-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileUpload(e, 'about')}
                disabled={isUploading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isPending} size="lg" className="w-full">
        {isPending ? 'שומר...' : 'שמור שינויים'}
      </Button>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateBrandingSettings } from '@/lib/actions/branding.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type BrandingEditFormProps = {
  branding: {
    studio_name: string | null
    about_text: string | null
    stat_projects: number
    stat_clients: number
    stat_experience_years: number
    accent_color: string
    selected_theme: string
    hero_desktop_url: string | null
    hero_mobile_url: string | null
    about_image_url: string | null
  }
}

const themes = [
  { value: 'elegant', label: 'Elegant', description: 'יוקרתי וקלאסי' },
  { value: 'modern', label: 'Modern', description: 'מודרני ונקי' },
  { value: 'classic', label: 'Classic', description: 'קלאסי וחמים' },
  { value: 'bold', label: 'Bold', description: 'דרמטי וכהה' },
]

export function BrandingEditForm({ branding }: BrandingEditFormProps) {
  const [isPending, startTransition] = useTransition()
  const [studioName, setStudioName] = useState(branding.studio_name ?? '')
  const [aboutText, setAboutText] = useState(branding.about_text ?? '')
  const [statProjects, setStatProjects] = useState(branding.stat_projects.toString())
  const [statClients, setStatClients] = useState(branding.stat_clients.toString())
  const [statExperience, setStatExperience] = useState(branding.stat_experience_years.toString())
  const [accentColor, setAccentColor] = useState(branding.accent_color ?? '#B8953F')
  const [selectedTheme, setSelectedTheme] = useState(branding.selected_theme ?? 'elegant')
  const [heroDesktopUrl, setHeroDesktopUrl] = useState(branding.hero_desktop_url ?? '')
  const [heroMobileUrl, setHeroMobileUrl] = useState(branding.hero_mobile_url ?? '')
  const [aboutImageUrl, setAboutImageUrl] = useState(branding.about_image_url ?? '')

  function handleSave() {
    startTransition(async () => {
      try {
        const payload = {
          studioName: studioName || undefined,
          aboutText: aboutText || undefined,
          statProjects: statProjects ? parseInt(statProjects) : undefined,
          statClients: statClients ? parseInt(statClients) : undefined,
          statExperienceYears: statExperience ? parseInt(statExperience) : undefined,
          accentColor: accentColor || undefined,
          selectedTheme: selectedTheme || undefined,
          heroDesktopUrl: heroDesktopUrl || undefined,
          heroMobileUrl: heroMobileUrl || undefined,
          aboutImageUrl: aboutImageUrl || undefined,
        }
        
        await updateBrandingSettings(payload)
        toast.success('הגדרות המותג נשמרו בהצלחה')
      } catch (error) {
        console.error('Error saving branding settings:', error)
        toast.error(error instanceof Error ? error.message : 'שגיאה בשמירה')
      }
    })
  }

  return (
    <>
      <div className="space-y-6">
        {/* Studio Name */}
        <div className="space-y-2">
          <Label htmlFor="studio-name" className="text-[#100d1f]">שם הסטודיו</Label>
          <Input
            id="studio-name"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder="למשל: סטודיו גלריה"
            className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
          />
          <p className="text-xs text-gray-500">השם שיופיע בכותרת דף הבית שלך</p>
        </div>

        {/* About Text */}
        <div className="space-y-2">
          <Label htmlFor="about-text" className="text-[#100d1f]">טקסט אודות</Label>
          <Textarea
            id="about-text"
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            placeholder="ספרי קצת על הסטודיו והגישה שלך..."
            rows={4}
            className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] resize-none"
          />
        </div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="stat-projects" className="text-[#100d1f]">פרויקטים</Label>
            <Input
              id="stat-projects"
              type="number"
              value={statProjects}
              onChange={(e) => setStatProjects(e.target.value)}
              placeholder="0"
              className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stat-clients" className="text-[#100d1f]">לקוחות</Label>
            <Input
              id="stat-clients"
              type="number"
              value={statClients}
              onChange={(e) => setStatClients(e.target.value)}
              placeholder="0"
              className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stat-experience" className="text-[#100d1f]">שנות ניסיון</Label>
            <Input
              id="stat-experience"
              type="number"
              value={statExperience}
              onChange={(e) => setStatExperience(e.target.value)}
              placeholder="0"
              className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
            />
          </div>
        </div>

        {/* Theme Selection */}
        <div className="space-y-3">
          <Label className="text-[#100d1f]">ערכת נושא</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            {themes.map((theme) => (
              <button
                key={theme.value}
                type="button"
                onClick={() => setSelectedTheme(theme.value)}
                className={`p-4 rounded-xl border-2 text-right transition-all ${
                  selectedTheme === theme.value
                    ? 'border-[#6b2d43] bg-[#f7f2f4]'
                    : 'border-[#c9c5cd] hover:border-[#6b2d43]'
                }`}
              >
                <div className="font-medium text-[#100d1f]">{theme.label}</div>
                <div className="text-sm text-gray-600">{theme.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-2">
          <Label htmlFor="accent-color" className="text-[#100d1f]">צבע מודגש</Label>
          <div className="flex gap-3">
            <Input
              id="accent-color"
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-20 h-12 border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]"
            />
            <Input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#B8953F"
              dir="ltr"
              className="flex-1 border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
            />
          </div>
          <p className="text-xs text-gray-500">הצבע הראשי שיופיע בכפתורים, קישורים ואלמנטים מודגשים</p>
        </div>

        {/* Images */}
        <div className="space-y-4">
          <Label className="text-[#100d1f]">תמונות</Label>
          
          <div className="space-y-2">
            <Label htmlFor="hero-desktop" className="text-sm text-gray-600">תמונת גיבוי - דסקטופ</Label>
            <Input
              id="hero-desktop"
              value={heroDesktopUrl}
              onChange={(e) => setHeroDesktopUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
              className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-mobile" className="text-sm text-gray-600">תמונת גיבוי - מובייל</Label>
            <Input
              id="hero-mobile"
              value={heroMobileUrl}
              onChange={(e) => setHeroMobileUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
              className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="about-image" className="text-sm text-gray-600">תמונת אודות</Label>
            <Input
              id="about-image"
              value={aboutImageUrl}
              onChange={(e) => setAboutImageUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
              className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
            />
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-8 left-8 z-50">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-[#6b2d43] text-white px-12 py-3 rounded-xl font-bold text-lg shadow-sm hover:bg-[#5a2538] active:scale-[0.98] transition-all"
        >
          {isPending ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </div>
    </>
  )
}

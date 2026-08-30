'use client'

import { useState, useEffect } from 'react'
import { Images, Eye } from 'lucide-react'
import { fetchDashboardGalleries, fetchStudioPublicPath, fetchUserEntitlements } from '@/lib/actions/dashboard.actions'
import {
  fetchGalleryLayoutMode,
  fetchGalleriesSectionSettings,
  getPublicGalleryQuota,
  updateDisplayedGallery,
} from '@/lib/actions/gallery.actions'
import { RecentGalleriesTable } from '@/components/dashboard/RecentGalleriesTable'
import { FloatingNewGalleryButton } from '@/components/dashboard/FloatingNewGalleryButton'
import { GalleryLayoutModeSetting } from '@/components/dashboard/GalleryLayoutModeSetting'
import { GalleriesSectionTitleSetting } from '@/components/dashboard/GalleriesSectionTitleSetting'
import { RecentPhotosSectionTitleSetting } from '@/components/dashboard/RecentPhotosSectionTitleSetting'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { GalleryWithDetails } from '@/components/dashboard/RecentGalleriesTable'
import type { GalleryLayoutMode } from '@/lib/types/database.types'
import {
  MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER,
  MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER,
} from '@/lib/types/app.types'
import { galleryKind } from '@/lib/gallery-kind'

export default function GalleriesPage() {
  const [recentGalleries, setRecentGalleries] = useState<GalleryWithDetails[]>([])
  const [layoutMode, setLayoutMode] = useState<GalleryLayoutMode>('separated')
  const [galleriesTitle, setGalleriesTitle] = useState<string | null>(null)
  const [recentPhotosTitle, setRecentPhotosTitle] = useState<string | null>(null)
  const [selectedTheme, setSelectedTheme] = useState('elegant')
  const [maxGalleries, setMaxGalleries] = useState(MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER)
  const [photoCount, setPhotoCount] = useState(0)
  const [maxPhotos, setMaxPhotos] = useState(MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER)
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(true)
  const [displayedGalleryId, setDisplayedGalleryId] = useState<string | null>(null)
  const [updatingDisplayed, setUpdatingDisplayed] = useState(false)
  const [studioPath, setStudioPath] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [galleries, mode, quota, sectionSettings, entitlements, path] = await Promise.all([
          fetchDashboardGalleries(),
          fetchGalleryLayoutMode(),
          getPublicGalleryQuota(),
          fetchGalleriesSectionSettings(),
          fetchUserEntitlements(),
          fetchStudioPublicPath(),
        ])
        setRecentGalleries(galleries)
        setStudioPath(path)
        setLayoutMode(mode)
        setGalleriesTitle(sectionSettings.galleries_title)
        setRecentPhotosTitle(sectionSettings.recent_photos_title)
        setSelectedTheme(sectionSettings.selected_theme ?? 'elegant')
        setMaxGalleries(quota?.maxGalleries ?? MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER)
        setPhotoCount(quota?.photoCount ?? 0)
        setMaxPhotos(quota?.maxPhotos ?? MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER)
        setIsPro(entitlements.isPro)
        setDisplayedGalleryId(quota?.displayedGalleryId ?? null)
      } catch (error) {
        console.error('Failed to load galleries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-12">
          <div className="flex items-center justify-center rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] py-16">
            <div className="text-[--muted]">טוען...</div>
          </div>
        </div>
      </div>
    )
  }

  // This page owns public / showcase galleries only — private client galleries
  // live under /dashboard/private-galleries.
  const showcaseGalleries = recentGalleries.filter(
    (gallery) => galleryKind(gallery) === 'showcase'
  )

  const galleryCount = showcaseGalleries.length
  const hasGalleryLimit = Number.isFinite(maxGalleries)
  const canCreateGallery = !hasGalleryLimit || galleryCount < maxGalleries

  return (
    <div className="animate-fade-in">
      <FloatingNewGalleryButton
        href="/dashboard/galleries/new?kind=showcase"
        disabled={!canCreateGallery}
        disabledTitle={`מקסימום ${maxGalleries} גלריות`}
      />

      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <Images className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                גלריות ציבוריות
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                {hasGalleryLimit ? `${galleryCount}/${maxGalleries} גלריות` : `${galleryCount} גלריות`} · {photoCount}/{maxPhotos} תמונות
              </p>
            </div>
          </div>
        </div>

        <RecentGalleriesTable
          galleries={showcaseGalleries}
          title="גלריות ציבוריות"
          variant="section"
          sectionDescription="גלריות שמוצגות באתר התדמית שלך"
          emptyLabel="עדיין אין גלריות ציבוריות"
          studioPath={studioPath}
        />

        {!isPro && showcaseGalleries.length > 1 && (
          <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
            <div className="flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/10">
                <Eye className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight text-[--foreground]">
                  גלריה מוצגת לציבור (FREE)
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                  משתמשי FREE יכולים להציג גלריה ציבורית אחת בלבד. בחר/י את הגלריה שתוצג באתר.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Select
                value={displayedGalleryId ?? 'none'}
                onValueChange={async (galleryId) => {
                  setUpdatingDisplayed(true)
                  try {
                    const result = await updateDisplayedGallery({
                      galleryId: galleryId === 'none' ? null : galleryId,
                    })
                    setDisplayedGalleryId(result.displayed_gallery_id)
                  } catch (error) {
                    console.error('Failed to update displayed gallery:', error)
                  } finally {
                    setUpdatingDisplayed(false)
                  }
                }}
                disabled={updatingDisplayed}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="בחר/י גלריה להצגה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    (ללא — אף גלריה לא מוצגת)
                  </SelectItem>
                  {showcaseGalleries.map((gallery) => (
                    <SelectItem key={gallery.id} value={gallery.id}>
                      {gallery.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {updatingDisplayed && (
                <p className="mt-2 text-sm text-[--muted]">מעדכן...</p>
              )}
            </div>
          </div>
        )}

        <GalleryLayoutModeSetting
          key={layoutMode}
          initialMode={layoutMode}
          onModeChange={setLayoutMode}
        />

        <GalleriesSectionTitleSetting
          key={`galleries-${galleriesTitle ?? ''}-${selectedTheme}`}
          initialTitle={galleriesTitle}
          selectedTheme={selectedTheme}
        />

        <RecentPhotosSectionTitleSetting
          key={`recent-photos-${recentPhotosTitle ?? ''}-${selectedTheme}`}
          initialTitle={recentPhotosTitle}
          selectedTheme={selectedTheme}
        />
      </div>
    </div>
  )
}

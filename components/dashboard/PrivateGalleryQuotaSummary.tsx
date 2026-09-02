import { Lock } from 'lucide-react'
import {
  PRIVATE_GALLERY_TIER_LABELS,
  type PrivateGalleryTier,
} from '@/lib/private-galleries/types'

export type PrivateGalleryQuota = {
  tier: PrivateGalleryTier
  galleryCount: number
  maxGalleries: number
  maxPhotosPerGallery: number
  isLifetime: boolean
  canCreateGallery: boolean
}

type PrivateGalleryQuotaSummaryProps = {
  quota: PrivateGalleryQuota
}

/**
 * The "what your private-gallery plan gives you right now" strip — current
 * tier, galleries used vs. the cap, and the per-gallery photo ceiling. Shown
 * on the private-galleries list and the dashboard home; the same numbers the
 * quota panel on /dashboard/usage-packages shows, sourced from
 * getPrivateGalleryQuota(). Purely presentational.
 */
export function PrivateGalleryQuotaSummary({ quota }: PrivateGalleryQuotaSummaryProps) {
  const atLimit = !quota.canCreateGallery

  return (
    <div className="rounded-2xl border border-[--border] bg-[--dashboard-surface] px-5 py-4 md:px-7 md:py-5">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-[--muted]">המסלול שלך</p>
            <p className="font-semibold text-[--foreground]">
              {PRIVATE_GALLERY_TIER_LABELS[quota.tier]}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-[--muted]">
            {quota.isLifetime ? 'גלריות (לכל החיים)' : 'גלריות פעילות'}
          </p>
          <p className="font-semibold text-[--foreground]">
            <span className={atLimit ? 'text-[#7D3A52]' : undefined}>
              {quota.galleryCount}
            </span>{' '}
            / {quota.maxGalleries}
          </p>
        </div>

        <div>
          <p className="text-xs text-[--muted]">תמונות לגלריה</p>
          <p className="font-semibold text-[--foreground]">עד {quota.maxPhotosPerGallery}</p>
        </div>
      </div>

      {atLimit ? (
        <p className="mt-3 text-xs leading-relaxed text-[--muted]">
          {quota.isLifetime
            ? 'ניצלת את הגלריה הפרטית החינמית שלך — מחיקתה לא תפנה מקום. שדרגי מסלול כדי ליצור גלריה נוספת.'
            : 'הגעת למכסת הגלריות של המסלול. מחקי גלריה קיימת או שדרגי מסלול כדי ליצור חדשה.'}
        </p>
      ) : null}
    </div>
  )
}

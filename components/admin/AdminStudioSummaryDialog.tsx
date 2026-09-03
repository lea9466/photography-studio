'use client'

import { useState, useTransition } from 'react'
import {
  BarChart3,
  Construction,
  Gauge,
  Globe,
  HelpCircle,
  ImageIcon,
  Images,
  Layers,
  LayoutDashboard,
  MessageSquareQuote,
  Package,
  ShieldOff,
  SplitSquareHorizontal,
  Ticket,
  Users,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AdminStudioRow } from '@/lib/admin/queries'
import type { AdminStudioDetails, AdminStudioSummary } from '@/lib/admin/studio-summary'
import type { PrivateGalleryEntitlements } from '@/lib/private-galleries/types'
import { PRIVATE_GALLERY_TIER_LABELS } from '@/lib/private-galleries/types'
import { fetchAdminStudioSummary } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type AdminStudioSummaryDialogProps = {
  studio: AdminStudioRow
}

type SideStat = {
  label: string
  value: number
  hint?: string
  icon: typeof ImageIcon
}

const PRIVATE_SOURCE_LABELS: Record<PrivateGalleryEntitlements['source'], string> = {
  admin_override: 'הגדרת מנהל',
  subscription: 'מנוי בתשלום',
  free: 'חינם',
}

function buildSiteStats(summary: AdminStudioSummary): SideStat[] {
  return [
    {
      label: 'גלריות לאתר',
      value: summary.showcaseGalleries,
      hint:
        summary.showcaseGalleries > 0
          ? `${summary.publicGalleries} מוצגות כרגע`
          : undefined,
      icon: Layers,
    },
    {
      label: 'תמונות בגלריות האתר',
      value: summary.showcaseGalleryPhotos,
      icon: ImageIcon,
    },
    {
      label: 'פוסטים',
      value: summary.posts,
      hint: summary.postPhotos > 0 ? `${summary.postPhotos} תמונות בפוסטים` : undefined,
      icon: BarChart3,
    },
    {
      label: 'תמונות הרו',
      value: summary.heroImages,
      hint:
        summary.heroImages > 0
          ? `${summary.heroDesktopImages} דסקטופ · ${summary.heroMobileImages} מובייל`
          : undefined,
      icon: Images,
    },
    {
      label: 'לפני ואחרי',
      value: summary.photoEditComparisons,
      hint:
        summary.photoEditComparisons > 0
          ? `${summary.activePhotoEditComparisons} פעילים`
          : undefined,
      icon: SplitSquareHorizontal,
    },
    {
      label: 'חבילות צילום',
      value: summary.packages,
      icon: Package,
    },
    {
      label: 'שאלות נפוצות',
      value: summary.faqItems,
      icon: HelpCircle,
    },
    {
      label: 'תגובות',
      value: summary.testimonials,
      icon: MessageSquareQuote,
    },
  ]
}

function buildPrivateStats(summary: AdminStudioSummary): SideStat[] {
  return [
    {
      label: 'גלריות לקוח',
      value: summary.clientGalleries,
      icon: Layers,
    },
    {
      label: 'תמונות בגלריות לקוח',
      value: summary.clientGalleryPhotos,
      icon: ImageIcon,
    },
    {
      label: 'לקוחות',
      value: summary.clients,
      icon: Users,
    },
  ]
}

function studioLabel(studio: AdminStudioRow) {
  return studio.studio_name || studio.name || studio.email || 'סטודיו'
}

function StatCard({ stat }: { stat: SideStat }) {
  const Icon = stat.icon

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-600">{stat.label}</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">
            {stat.value}
          </p>
          {stat.hint ? (
            <p className="mt-0.5 text-[11px] text-slate-500">{stat.hint}</p>
          ) : null}
        </div>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  )
}

function SitePanel({
  summary,
  studio,
}: {
  summary: AdminStudioSummary
  studio: AdminStudioRow
}) {
  const stats = buildSiteStats(summary)

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-sky-200 bg-sky-50/40">
      <header className="flex items-center gap-2 border-b border-sky-200 bg-sky-100/70 px-4 py-3">
        <Globe className="h-4 w-4 text-sky-700" />
        <div>
          <h3 className="text-sm font-bold text-sky-900">ניהול האתר</h3>
          <p className="text-[11px] text-sky-700/80">התוכן הציבורי של הסטודיו</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 p-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="mt-auto space-y-1.5 border-t border-sky-200 bg-white/60 px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {studio.is_under_construction ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800">
              <Construction className="h-3 w-3" />
              בבניה
            </span>
          ) : null}
          {studio.is_site_unavailable ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
              <ShieldOff className="h-3 w-3" />
              לא זמין
            </span>
          ) : null}
          {!studio.is_under_construction && !studio.is_site_unavailable ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
              אתר פעיל
            </span>
          ) : null}
          {studio.has_hero_video ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-200 bg-fuchsia-100 px-1.5 py-0.5 text-[10px] font-semibold text-fuchsia-800">
              <Video className="h-3 w-3" />
              סרטון הרו
            </span>
          ) : null}
        </div>
        {studio.site_path ? (
          <p className="font-mono text-[11px] text-slate-500" dir="ltr">
            {studio.site_path}
          </p>
        ) : (
          <p className="text-[11px] text-slate-400">אין כתובת אתר</p>
        )}
      </div>
    </section>
  )
}

function PrivatePanel({
  summary,
  privateGallery,
}: {
  summary: AdminStudioSummary
  privateGallery: PrivateGalleryEntitlements | null
}) {
  const stats = buildPrivateStats(summary)
  const passTotal =
    summary.galleryPassCreditsAvailable +
    summary.galleryPassCreditsConsumed +
    summary.galleryPassCreditsPending

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-violet-200 bg-violet-50/40">
      <header className="flex items-center gap-2 border-b border-violet-200 bg-violet-100/70 px-4 py-3">
        <LayoutDashboard className="h-4 w-4 text-violet-700" />
        <div>
          <h3 className="text-sm font-bold text-violet-900">גלריות פרטיות ולקוחות</h3>
          <p className="text-[11px] text-violet-700/80">מרחב העבודה של גלריות הלקוח</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 p-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="space-y-3 border-t border-violet-200 bg-white/60 px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Gauge className="h-3.5 w-3.5 text-violet-600" />
            מסלול גלריות פרטיות
          </div>
          {privateGallery ? (
            <div className="mt-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-800">
                  {PRIVATE_GALLERY_TIER_LABELS[privateGallery.tier]}
                </span>
                <span className="text-[11px] text-slate-500">
                  {PRIVATE_SOURCE_LABELS[privateGallery.source]}
                </span>
              </div>
              <div className="mt-1.5">
                <InfoRow
                  label="מכסת גלריות"
                  value={
                    privateGallery.limits.isLifetimeCap
                      ? `${privateGallery.limits.maxGalleries} (מצטבר לכל החיים)`
                      : `${privateGallery.limits.maxGalleries} במקביל`
                  }
                />
                <InfoRow
                  label="מקס׳ תמונות לגלריה"
                  value={String(privateGallery.limits.maxPhotosPerGallery)}
                />
                {privateGallery.limits.isLifetimeCap ? (
                  <InfoRow
                    label="גלריה חינמית נוצלה"
                    value={privateGallery.lifetimeUsed ? 'כן' : 'לא'}
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-slate-400">לא ניתן לטעון את נתוני המסלול</p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Ticket className="h-3.5 w-3.5 text-violet-600" />
            פאס לגלריה בודדת
          </div>
          {passTotal === 0 ? (
            <p className="mt-1.5 text-[11px] text-slate-400">אין רכישות</p>
          ) : (
            <div className="mt-1.5">
              <InfoRow
                label="קרדיטים זמינים"
                value={String(summary.galleryPassCreditsAvailable)}
              />
              <InfoRow
                label="נוצלו"
                value={String(summary.galleryPassCreditsConsumed)}
              />
              <InfoRow
                label="ממתינים לתשלום"
                value={String(summary.galleryPassCreditsPending)}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function AdminStudioSummaryDialog({ studio }: AdminStudioSummaryDialogProps) {
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<AdminStudioDetails | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setOpen(true)
    setLoadError(null)

    if (details) return

    startTransition(async () => {
      try {
        const data = await fetchAdminStudioSummary(studio.id)
        setDetails(data)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'טעינת הסיכום נכשלה'
        setLoadError(message)
        toast.error(message)
      }
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        onClick={handleOpen}
      >
        <BarChart3 className="h-3.5 w-3.5" />
        סיכום
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>סיכום סטודיו</DialogTitle>
            <DialogDescription>
              {studioLabel(studio)}
              {studio.slug ? (
                <span className="mt-1 block font-mono text-xs text-slate-500" dir="ltr">
                  /{studio.slug}
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {isPending && !details ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              טוען נתונים...
            </div>
          ) : null}

          {loadError && !details ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}

          {details ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <PrivatePanel
                summary={details.summary}
                privateGallery={details.privateGallery}
              />
              <SitePanel summary={details.summary} studio={studio} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

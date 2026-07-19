'use client'

import { useState, useTransition } from 'react'
import {
  BarChart3,
  HelpCircle,
  ImageIcon,
  Images,
  Layers,
  MessageSquareQuote,
  Package,
  SplitSquareHorizontal,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AdminStudioRow } from '@/lib/admin/queries'
import type { AdminStudioSummary } from '@/lib/admin/studio-summary'
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

type SummaryStat = {
  label: string
  value: number
  hint?: string
  icon: typeof ImageIcon
}

function buildSummaryStats(summary: AdminStudioSummary): SummaryStat[] {
  return [
    {
      label: 'גלריות',
      value: summary.galleries,
      hint: `${summary.publicGalleries} ציבוריות`,
      icon: Layers,
    },
    {
      label: 'תמונות בגלריות',
      value: summary.photos,
      icon: ImageIcon,
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
      label: 'תמונות הרו',
      value: summary.heroImages,
      hint:
        summary.heroImages > 0
          ? `${summary.heroDesktopImages} דסקטופ · ${summary.heroMobileImages} מובייל`
          : undefined,
      icon: Images,
    },
    {
      label: 'לקוחות',
      value: summary.clients,
      icon: Users,
    },
    {
      label: 'חבילות צילום',
      value: summary.packages,
      icon: Package,
    },
    {
      label: 'פוסטים',
      value: summary.posts,
      hint: summary.postPhotos > 0 ? `${summary.postPhotos} תמונות בפוסטים` : undefined,
      icon: BarChart3,
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

function studioLabel(studio: AdminStudioRow) {
  return studio.studio_name || studio.name || studio.email || 'סטודיו'
}

export function AdminStudioSummaryDialog({ studio }: AdminStudioSummaryDialogProps) {
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState<AdminStudioSummary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setOpen(true)
    setLoadError(null)

    if (summary) return

    startTransition(async () => {
      try {
        const data = await fetchAdminStudioSummary(studio.id)
        setSummary(data)
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

  const stats = summary ? buildSummaryStats(summary) : []

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
        <DialogContent className="max-w-lg">
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

          {isPending && !summary ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              טוען נתונים...
            </div>
          ) : null}

          {loadError && !summary ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}

          {summary ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((stat) => {
                const Icon = stat.icon

                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                        <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                          {stat.value}
                        </p>
                        {stat.hint ? (
                          <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
                        ) : null}
                      </div>
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

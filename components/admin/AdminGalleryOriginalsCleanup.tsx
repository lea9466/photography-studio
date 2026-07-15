'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Search, Trash2, Wrench } from 'lucide-react'
import {
  deepCleanGalleryOriginals,
  scanGalleryOriginalsCleanup,
} from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type CleanupCandidate = {
  photoId: string
  source: 'gallery' | 'post' | 'cover'
  studioName: string | null
  contextTitle: string | null
  contextKind: 'גלריה' | 'פוסט' | 'שער גלריה'
  previewStorageKey: string
}

function formatConfirmSummary(candidates: CleanupCandidate[]) {
  const lines = candidates.slice(0, 8).map((item) => {
    const studio = item.studioName ?? 'סטודיו לא ידוע'
    const title = item.contextTitle ?? `${item.contextKind} ללא שם`
    return `• ${studio} — ${item.contextKind}: ${title}`
  })

  if (candidates.length > 8) {
    lines.push(`… ועוד ${candidates.length - 8}`)
  }

  return lines.join('\n')
}

export function AdminGalleryOriginalsCleanup() {
  const [isScanPending, startScan] = useTransition()
  const [isDeletePending, startDelete] = useTransition()
  const [batchOffset, setBatchOffset] = useState(0)
  const [candidates, setCandidates] = useState<CleanupCandidate[]>([])
  const [totalEligible, setTotalEligible] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [lastDeleteResult, setLastDeleteResult] = useState<{
    deleted: number
    skipped: number
    failed: number
    errors: string[]
  } | null>(null)

  function handleScan() {
    startScan(async () => {
      try {
        const result = await scanGalleryOriginalsCleanup(batchOffset)
        setCandidates(result.candidates)
        setTotalEligible(result.totalEligible)
        setHasMore(result.hasMore)
        setBatchOffset(result.nextOffset)
        setLastDeleteResult(null)

        if (result.candidates.length === 0) {
          toast.message('לא נמצאו קבצי מקור למחיקה')
        } else {
          toast.success(`נמצאו ${result.candidates.length} קבצי מקור בקבוצה זו`)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'סריקה נכשלה')
      }
    })
  }

  function handleDelete() {
    if (candidates.length === 0) {
      toast.error('יש לסרוק קודם את הקבצים למחיקה')
      return
    }

    const confirmed = window.confirm(
      `למחוק ${candidates.length} קבצי מקור מ-R2?\n\n` +
        `${formatConfirmSummary(candidates)}\n\n` +
        `תמונות התצוגה (preview/watermarked/_card) יישארו.\nפעולה זו בלתי הפיכה.`
    )
    if (!confirmed) return

    startDelete(async () => {
      try {
        const result = await deepCleanGalleryOriginals(
          candidates.map((item) => ({ id: item.photoId, source: item.source }))
        )
        setLastDeleteResult(result)
        setCandidates([])

        if (result.deleted > 0) {
          toast.success(`נמחקו ${result.deleted} קבצי מקור`)
        } else if (result.failed > 0) {
          toast.error(`המחיקה הסתיימה עם ${result.failed} שגיאות`)
        } else {
          toast.message('לא נמחקו קבצים')
        }

        if (hasMore) {
          toast.message('יש עוד קבוצות — סרקי שוב להמשך')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'מחיקה נכשלה')
      }
    })
  }

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-md">
      <CardHeader className="border-b border-[--border]/70 bg-gradient-to-l from-rose-50/80 via-[--card] to-[--card]">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
            <Wrench className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-xl">ניקוי קבצי מקור (Deep Clean)</CardTitle>
            <CardDescription className="mt-1">
              גלריות, פוסטים ותמונות שער מקוריות — עד 50 פריטים בכל קבוצה
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 bg-slate-50/60 p-5">
        <p className="text-sm text-slate-600">
          שלב 1: סריקה — מציג סטודיו, גלריה/פוסט/שער ונתיב תצוגה. שלב 2: מחיקה — דורש אישור.
          תמונות שער: נמחק רק המקור ב-branding כשקיים _card.
        </p>

        {batchOffset > 0 && hasMore ? (
          <p className="text-xs text-amber-800">ממשיכים מ-offset {batchOffset}…</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleScan}
            disabled={isScanPending || isDeletePending}
            variant="outline"
            className="border-slate-300"
          >
            <Search className="h-4 w-4" />
            {isScanPending ? 'סורק...' : 'סריקת קבצים למחיקה'}
          </Button>

          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeletePending || isScanPending || candidates.length === 0}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            <Trash2 className="h-4 w-4" />
            {isDeletePending ? 'מוחק...' : `מחק ${candidates.length || ''} קבצים`}
          </Button>
        </div>

        {totalEligible > 0 ? (
          <p className="text-xs text-slate-500">{totalEligible} תמונות עם קובץ מקור בסך הכל</p>
        ) : null}

        {candidates.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/50">
            <p className="border-b border-amber-200/80 px-4 py-3 text-sm font-medium text-amber-900">
              קבצים שיימחקו ({candidates.length}) — המקור ב-R2, קובץ התצוגה נשאר
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-amber-200/80 bg-amber-100/40 text-right">
                    <th className="px-4 py-2.5 font-semibold text-amber-950">סטודיו</th>
                    <th className="px-4 py-2.5 font-semibold text-amber-950">סוג</th>
                    <th className="px-4 py-2.5 font-semibold text-amber-950">גלריה / פוסט</th>
                    <th className="px-4 py-2.5 font-semibold text-amber-950">נתיב תצוגה</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((item) => (
                    <tr
                      key={`${item.source}-${item.photoId}`}
                      className="border-b border-amber-100/80 last:border-b-0 bg-white/60"
                    >
                      <td className="px-4 py-2.5 text-slate-800">
                        {item.studioName ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{item.contextKind}</td>
                      <td className="px-4 py-2.5 text-slate-800">
                        {item.contextTitle ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                        {item.previewStorageKey}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {lastDeleteResult ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-emerald-700">{lastDeleteResult.deleted}</span>{' '}
              נמחקו
              {' · '}
              <span className="font-semibold text-slate-600">{lastDeleteResult.skipped}</span>{' '}
              דולגו
              {' · '}
              <span className="font-semibold text-rose-700">{lastDeleteResult.failed}</span>{' '}
              נכשלו
            </p>
            {lastDeleteResult.errors.length > 0 ? (
              <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto text-xs text-rose-700">
                {lastDeleteResult.errors.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

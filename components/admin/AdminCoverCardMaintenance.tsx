'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ImageDown, Wrench } from 'lucide-react'
import { generateMissingGalleryCoverCards } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function AdminCoverCardMaintenance() {
  const [isPending, startTransition] = useTransition()
  const [batchOffset, setBatchOffset] = useState(0)
  const [lastResult, setLastResult] = useState<{
    regenerated: number
    skipped: number
    failed: number
    hasMore: boolean
    nextOffset: number
    totalEligible: number
    errors: string[]
  } | null>(null)

  function handleGenerate() {
    startTransition(async () => {
      try {
        const result = await generateMissingGalleryCoverCards(batchOffset)
        setLastResult(result)
        setBatchOffset(result.nextOffset)

        if (result.regenerated > 0) {
          toast.success(`עודכנו ${result.regenerated} תמונות כרטיס`)
        } else if (result.failed > 0) {
          toast.error(`הפעולה הסתיימה עם ${result.failed} שגיאות`)
        } else if (result.totalEligible === 0) {
          toast.message('לא נמצאו גלריות עם תמונות שער v2')
        } else {
          toast.message('לא עודכנו תמונות בקבוצה זו')
        }

        if (result.hasMore) {
          toast.message('יש עוד גלריות לעיבוד — לחצי שוב להמשך')
        } else if (result.regenerated > 0 || batchOffset > 0) {
          toast.success('כל תמונות הכרטיס עודכנו לסטנדרט החדש')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'עדכון תמונות כרטיס נכשל')
      }
    })
  }

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-md">
      <CardHeader className="border-b border-[--border]/70 bg-gradient-to-l from-amber-50/80 via-[--card] to-[--card]">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Wrench className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-xl">תחזוקת מערכת</CardTitle>
            <CardDescription className="mt-1">
              עדכון מחדש של כל תמונות _card לסטנדרט 1200px (עד 20 גלריות בכל הרצה)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 bg-slate-50/60 p-5">
        <p className="text-sm text-slate-600">
          כלי זה מוריד את תמונת השער המקורית מ-R2, יוצר תצוגה מוקטנת (1200px, איכות 0.78 — כמו
          תמונות גלריה), ו<strong>דורס</strong> את קובץ ה-_card הקיים. תמונות השער המקוריות נשארות
          ללא שינוי.
        </p>

        {batchOffset > 0 ? (
          <p className="text-xs text-amber-800">
            ממשיכים מגלריה {batchOffset + 1}
            {lastResult ? ` מתוך ${lastResult.totalEligible}` : ''}…
          </p>
        ) : null}

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="bg-amber-600 text-white hover:bg-amber-700"
        >
          <ImageDown className="h-4 w-4" />
          {isPending ? 'מעבד...' : 'עדכון תמונות כרטיס לסטנדרט החדש'}
        </Button>

        {lastResult ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-emerald-700">{lastResult.regenerated}</span> עודכנו
              {' · '}
              <span className="font-semibold text-slate-600">{lastResult.skipped}</span> דולגו
              {' · '}
              <span className="font-semibold text-rose-700">{lastResult.failed}</span> נכשלו
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {lastResult.totalEligible} גלריות עם תמונות שער v2 בסך הכל
            </p>
            {lastResult.hasMore ? (
              <p className="mt-2 text-amber-800">יש עוד גלריות לעיבוד — הריצי שוב.</p>
            ) : (
              <p className="mt-2 text-emerald-800">כל תמונות הכרטיס הרלוונטיות עודכנו.</p>
            )}
            {lastResult.errors.length > 0 ? (
              <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto text-xs text-rose-700">
                {lastResult.errors.map((entry) => (
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

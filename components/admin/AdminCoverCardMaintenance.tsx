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
          toast.success(`הומרו ${result.regenerated} תמונות שער למצב תצוגה בלבד`)
        } else if (result.failed > 0) {
          toast.error(`הפעולה הסתיימה עם ${result.failed} שגיאות`)
        } else if (result.totalEligible === 0) {
          toast.message('לא נמצאו גלריות עם תמונות שער מקוריות')
        } else {
          toast.message('לא עודכנו תמונות בקבוצה זו')
        }

        if (result.hasMore) {
          toast.message('יש עוד גלריות לעיבוד — לחצי שוב להמשך')
        } else if (result.regenerated > 0 || batchOffset > 0) {
          toast.success('כל תמונות השער הומרו למצב תצוגה בלבד')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'המרת תמונות שער נכשלה')
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
            <CardTitle className="text-xl">המרת תמונות שער (Display-Only)</CardTitle>
            <CardDescription className="mt-1">
              יוצר _card ב-1200px, מוחק את המקור מ-R2, ומעדכן את ה-DB — עד 20 גלריות בכל הרצה
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 bg-slate-50/60 p-5">
        <p className="text-sm text-slate-600">
          כלי זה מוריד זמנית את תמונת השער המקורית, יוצר תצוגת _card (1200px, איכות 0.78), מעלה אותה
          ל-R2, <strong>מוחק את המקור</strong>, ומעדכן את <code>cover_image</code> לנתיב ה-_card.
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
          {isPending ? 'מעבד...' : 'המרת תמונות שער למצב תצוגה בלבד'}
        </Button>

        {lastResult ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-emerald-700">{lastResult.regenerated}</span> הומרו
              {' · '}
              <span className="font-semibold text-slate-600">{lastResult.skipped}</span> דולגו
              {' · '}
              <span className="font-semibold text-rose-700">{lastResult.failed}</span> נכשלו
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {lastResult.totalEligible} גלריות עם תמונות שער מקוריות בסך הכל
            </p>
            {lastResult.hasMore ? (
              <p className="mt-2 text-amber-800">יש עוד גלריות לעיבוד — הריצי שוב.</p>
            ) : (
              <p className="mt-2 text-emerald-800">כל תמונות השער הרלוונטיות הומרו.</p>
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

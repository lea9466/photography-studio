'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { updateSiteUnderConstruction } from '@/lib/actions/site-settings.actions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type SiteVisibilitySettingProps = {
  initialUnderConstruction: boolean
}

export function SiteVisibilitySetting({
  initialUnderConstruction,
}: SiteVisibilitySettingProps) {
  const [underConstruction, setUnderConstruction] = useState(initialUnderConstruction)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !underConstruction
    startTransition(async () => {
      try {
        await updateSiteUnderConstruction(next)
        setUnderConstruction(next)
        toast.success(
          next
            ? 'האתר הוסתר מצפייה ציבורית — מבקרים יראו מסך "בבניה"'
            : 'האתר פתוח לצפייה ציבורית'
        )
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'עדכון נכשל')
      }
    })
  }

  return (
    <section className="relative space-y-5 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8">
      <div
        className="pointer-events-none absolute inset-y-5 right-0 w-0.5 rounded-full bg-gradient-to-b from-[#7D3A52]/30 via-[#7D3A52]/10 to-transparent"
        aria-hidden
      />
      <div className="space-y-3 border-b border-[#7D3A52]/10 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
            {underConstruction ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-lg font-semibold text-[--foreground]">
              זמינות האתר לצפייה
            </h2>
            <p className="text-xs leading-relaxed text-[--muted]">
              כשהאתר מוסתר — מבקרים רואים מסך &quot;האתר בבניה&quot;. אצלך, כל עוד את
              מחוברת בדפדפן הזה, האתר נשאר פתוח לצפייה. בדפדפן אחר או בלי
              התחברות — הוא יהיה חסום.
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
          underConstruction
            ? 'border-orange-200 bg-orange-50/70'
            : 'border-[--border]/80 bg-white/80'
        )}
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[--foreground]">
            {underConstruction
              ? 'האתר מוסתר מצפייה ציבורית'
              : 'האתר פתוח לצפייה ציבורית'}
          </p>
          <p className="text-xs leading-relaxed text-[--muted]">
            {underConstruction
              ? 'אצלך בדפדפן הזה (מחוברת) האתר פתוח. בדפדפן אחר או אצל אורחים — חסום עם מסך בבניה.'
              : 'כל מי שנכנס לקישור שלך רואה את האתר המלא.'}
          </p>
        </div>
        <Button
          type="button"
          disabled={isPending}
          onClick={handleToggle}
          variant="outline"
          className={cn(
            'shrink-0',
            underConstruction
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              : 'border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100'
          )}
        >
          {isPending
            ? 'מעדכן...'
            : underConstruction
              ? 'פתחי את האתר לצפייה'
              : 'הסתירי את האתר מצפייה'}
        </Button>
      </div>
    </section>
  )
}

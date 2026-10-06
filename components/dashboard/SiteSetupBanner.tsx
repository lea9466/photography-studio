'use client'

import { useState } from 'react'
import { ArrowLeft, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteOnboardingModal, type SiteOnboardingInitial } from './SiteOnboardingModal'

type SiteSetupBannerProps = {
  initial: SiteOnboardingInitial
}

/**
 * Shown at the top of the dashboard while the studio has no slug: without one
 * her public site doesn't exist at all (her showcase galleries have nowhere to
 * appear). The button reopens the site-setup modal on demand.
 */
export function SiteSetupBanner({ initial }: SiteSetupBannerProps) {
  // 0 = closed. Bumping the key remounts the modal fresh on every click, since
  // it hides itself internally when closed.
  const [openKey, setOpenKey] = useState(0)

  return (
    <>
      <div
        className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm sm:flex-row sm:items-center sm:p-5"
        role="status"
      >
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-black/5">
          <Globe className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">האתר שלך עדיין לא פעיל</h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            עד שתוגדר כתובת לאתר, הוא לא באוויר ואף אחד לא יכול לראות אותו, כולל הגלריות
            שמוצגות בו. ההגדרה לוקחת דקה.
          </p>
        </div>
        <Button type="button" onClick={() => setOpenKey((key) => key + 1)} className="shrink-0 gap-1.5">
          הגדרת האתר עכשיו
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
      {openKey > 0 ? <SiteOnboardingModal key={openKey} open initial={initial} /> : null}
    </>
  )
}

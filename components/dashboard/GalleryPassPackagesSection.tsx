'use client'

import { useState, useTransition } from 'react'
import { Ticket } from 'lucide-react'
import { toast } from 'sonner'
import { purchaseGalleryPassCredit } from '@/lib/actions/gallery-pass.actions'
import { Button } from '@/components/ui/button'

export type GalleryPassBundleView = {
  code: string
  name: string
  photoCap: number
  validityDays: number
  amountAgorot: number
}

type GalleryPassPackagesSectionProps = {
  bundles: GalleryPassBundleView[]
  creditsCount: number
  isImpersonating?: boolean
}

/**
 * "Buy a single gallery" section on /dashboard/usage-packages — the pay-per-
 * gallery pass alongside the recurring private-gallery subscription. Same
 * checkout as the one shown inside the create-gallery flow; after paying she's
 * routed to the new-gallery wizard with the fresh credit available.
 */
export function GalleryPassPackagesSection({
  bundles,
  creditsCount,
  isImpersonating = false,
}: GalleryPassPackagesSectionProps) {
  const [selectedCode, setSelectedCode] = useState(bundles[0]?.code ?? '')
  const [isPending, startTransition] = useTransition()

  if (bundles.length === 0) return null

  const selected = bundles.find((b) => b.code === selectedCode) ?? null

  function buy() {
    if (!selected || isImpersonating) return
    startTransition(async () => {
      const result = await purchaseGalleryPassCredit(selected.code)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      window.location.href = result.checkoutUrl
    })
  }

  return (
    <section className="rounded-2xl border border-[--border] bg-[--dashboard-surface] px-5 py-5 md:px-7 md:py-6">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
          <Ticket className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold text-[--foreground]">גלריה בודדת — תשלום חד-פעמי</h2>
          <p className="text-xs text-[--muted]">
            בלי מנוי. פאס לגלריית לקוח אחת, לפי מספר התמונות (רגילות + מעובדות יחד).
          </p>
        </div>
      </div>

      {creditsCount > 0 ? (
        <p className="mb-3 text-xs font-medium text-[#7D3A52]">
          יש לך {creditsCount === 1 ? 'פאס' : `${creditsCount} פאסים`} שרכשת וטרם ניצלת —
          ייבחר בעת יצירת גלריה חדשה.
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {bundles.map((bundle) => {
          const active = bundle.code === selectedCode
          return (
            <button
              key={bundle.code}
              type="button"
              onClick={() => setSelectedCode(bundle.code)}
              className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-right transition-all ${
                active
                  ? 'border-[#7D3A52] bg-[#7D3A52]/5'
                  : 'border-[--border] hover:border-[#7D3A52]/40'
              }`}
            >
              <span className="text-sm font-semibold text-[--foreground]">{bundle.name}</span>
              <span className="text-sm font-bold text-[#7D3A52]">
                ₪{(bundle.amountAgorot / 100).toLocaleString('he-IL')}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-2 text-xs text-[--muted]">
        {selected
          ? `תוקף ${selected.validityDays} ימים ללקוח, מרגע השליחה.`
          : ''}{' '}
        צריכה יותר מ-1500 תמונות?{' '}
        <a href="/dashboard/contact" className="font-semibold text-[#7D3A52] underline">
          דברי איתנו
        </a>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          onClick={buy}
          disabled={isPending || !selected || isImpersonating}
          className="bg-[#7D3A52] text-white hover:bg-[#6a2f44]"
        >
          <Ticket className="ml-2 h-4 w-4" />
          {isPending
            ? 'מעבירה לתשלום...'
            : selected
              ? `רכשי פאס · ₪${(selected.amountAgorot / 100).toLocaleString('he-IL')}`
              : 'בחרי חבילה'}
        </Button>
      </div>
    </section>
  )
}

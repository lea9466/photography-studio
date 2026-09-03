'use client'

import { useState, useTransition } from 'react'
import { CreditCard } from 'lucide-react'
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

type GalleryPassPurchasePanelProps = {
  bundles: GalleryPassBundleView[]
  /** Where "back" / "cancel" points — the private galleries list. */
  backHref: string
}

/**
 * Standalone "buy a gallery" step for a photographer with no private-gallery
 * subscription. She picks a bundle → SUMIT one-time checkout → the credit lands
 * on her account → she comes back here and the wizard renders normally.
 */
export function GalleryPassPurchasePanel({ bundles, backHref }: GalleryPassPurchasePanelProps) {
  const [selectedCode, setSelectedCode] = useState(bundles[0]?.code ?? '')
  const [isPending, startTransition] = useTransition()

  const selected = bundles.find((b) => b.code === selectedCode) ?? null

  function buy() {
    if (!selected) return
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
    <div className="rounded-xl border-2 border-[#7D3A52]/30 bg-white p-6 sm:p-8">
      <div className="mb-2 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-[#7D3A52]" />
        <h2 className="text-base font-semibold text-[#100d1f]">רכישת גלריה בודדת</h2>
      </div>
      <p className="mb-5 text-sm text-[#48464c]/80">
        אין לך מנוי פעיל. אפשר לרכוש גלריית לקוח אחת בתשלום חד-פעמי — בחרי חבילה לפי
        מספר התמונות (רגילות + מעובדות יחד). לאחר התשלום תחזרי לכאן ותגדירי את הגלריה
        רגיל. התוקף ללקוח מתחיל כששולחים לו, לא עכשיו.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {bundles.map((bundle) => {
          const active = bundle.code === selectedCode
          return (
            <button
              key={bundle.code}
              type="button"
              onClick={() => setSelectedCode(bundle.code)}
              className={`flex flex-col items-start rounded-xl border-2 p-4 text-right transition-all ${
                active
                  ? 'border-[#7D3A52] bg-[#7D3A52]/5'
                  : 'border-[#ebebe8] hover:border-[#7D3A52]/40'
              }`}
            >
              <span className="text-sm font-semibold text-[#100d1f]">{bundle.name}</span>
              <span className="mt-1 text-2xl font-bold text-[#7D3A52]">
                ₪{(bundle.amountAgorot / 100).toLocaleString('he-IL')}
              </span>
              <span className="mt-1 text-xs text-[#48464c]/70">
                תוקף {bundle.validityDays} ימים ללקוח
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-[#48464c]/70">
        צריך יותר מ-1500 תמונות?{' '}
        <a href="/dashboard/contact" className="font-semibold text-[#7D3A52] underline">
          דברי איתנו להתאמה אישית
        </a>
        .
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" asChild disabled={isPending}>
          <a href={backHref}>ביטול</a>
        </Button>
        <Button
          type="button"
          onClick={buy}
          disabled={isPending || !selected}
          className="bg-[#7D3A52] text-white hover:bg-[#6a2f44]"
        >
          <CreditCard className="ml-2 h-4 w-4" />
          {isPending
            ? 'מעביר לתשלום...'
            : selected
              ? `המשך לתשלום · ₪${(selected.amountAgorot / 100).toLocaleString('he-IL')}`
              : 'בחרי חבילה'}
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useTransition } from 'react'
import { CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { retryGalleryPassCheckout } from '@/lib/actions/gallery-pass.actions'
import { Button } from '@/components/ui/button'

type GalleryPassPendingBannerProps = {
  galleryId: string
}

/**
 * Shown on a pass gallery whose payment was never completed (pass_bundle_id set,
 * pass_purchased_at null). Uploads and send-to-client are blocked server-side
 * until this is paid; the button re-opens the SUMIT checkout.
 */
export function GalleryPassPendingBanner({ galleryId }: GalleryPassPendingBannerProps) {
  const [isPending, startTransition] = useTransition()

  function pay() {
    startTransition(async () => {
      const result = await retryGalleryPassCheckout(galleryId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      window.location.href = result.checkoutUrl
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <span className="font-semibold">התשלום על הגלריה טרם הושלם.</span> אי אפשר
          להעלות תמונות או לשלוח ללקוח עד השלמת התשלום.
        </p>
      </div>
      <Button
        type="button"
        onClick={pay}
        disabled={isPending}
        className="shrink-0 bg-[#6b2d43] text-white hover:bg-[#5a2538]"
      >
        {isPending ? 'מעביר לתשלום...' : 'השלמת תשלום'}
      </Button>
    </div>
  )
}

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ProFeatureLockedPageProps = {
  title: string
  description: string
  /** Extra CTA rendered below the primary "שדרוג ל-PRO" button — e.g. a
   *  standalone one-time addon purchase that unlocks just this one feature
   *  without a full Pro subscription (see /dashboard/custom-domain). Omit for
   *  the plain single-CTA locked page every other PRO feature uses. */
  secondaryAction?: React.ReactNode
}

/**
 * Full-page URL-level block for PRO-only dashboard routes. Renders instead of
 * the real manager for FREE users — no feature data is fetched or mounted, so
 * navigating directly to the URL never exposes the underlying content.
 */
export function ProFeatureLockedPage({ title, description, secondaryAction }: ProFeatureLockedPageProps) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-16 md:px-9">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7D3A52]/10 text-[#7D3A52]">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold text-[--foreground]">{title}</h2>
        <p className="text-sm leading-relaxed text-[--muted]">{description}</p>
        <Button
          asChild
          className="mt-2 bg-[#7D3A52] text-white shadow-md shadow-[#7D3A52]/25 hover:bg-[#6a2f44]"
        >
          <Link href="/dashboard/subscription">שדרוג ל-PRO</Link>
        </Button>
        {secondaryAction}
      </div>
    </div>
  )
}

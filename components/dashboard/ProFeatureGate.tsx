import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ProFeatureGateProps = {
  isPro: boolean
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * Visual upsell for PRO-only dashboard sections. FREE users see the real UI
 * dimmed and non-interactive behind a lock card instead of only discovering
 * the block after a save attempt throws ProFeatureBlockedError.
 */
export function ProFeatureGate({
  isPro,
  title,
  description,
  children,
  className,
}: ProFeatureGateProps) {
  if (isPro) return <>{children}</>

  return (
    <div className={cn('relative', className)}>
      <div aria-hidden className="pointer-events-none select-none opacity-40 blur-[1.5px] grayscale-[40%]">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px]">
        <div className="mx-4 flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-[#7D3A52]/15 bg-white px-6 py-8 text-center shadow-xl shadow-[#7D3A52]/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7D3A52]/10 text-[#7D3A52]">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-[--foreground]">{title}</h3>
          {description ? (
            <p className="text-sm leading-relaxed text-[--muted]">{description}</p>
          ) : null}
          <Button asChild className="mt-1 bg-[#7D3A52] text-white shadow-md shadow-[#7D3A52]/25 hover:bg-[#6a2f44]">
            <Link href="/dashboard/subscription">שדרוג ל-PRO</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

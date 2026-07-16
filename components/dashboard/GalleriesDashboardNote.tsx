import { cn } from '@/lib/utils'

export function GalleriesDashboardNote({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'space-y-2 rounded-xl border border-amber-200/80 border-r-4 border-r-amber-400/70 bg-gradient-to-l from-amber-50/90 to-[#fffbeb] px-5 py-4 text-sm leading-relaxed text-[#5c4a3d] ring-1 ring-amber-100/80 dark:border-amber-800/50 dark:border-r-amber-500/50 dark:from-amber-950/40 dark:to-amber-950/20 dark:text-amber-100 dark:ring-amber-900/40',
        className
      )}
    >
      {children}
    </div>
  )
}

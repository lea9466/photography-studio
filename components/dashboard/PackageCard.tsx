import { Check, Clock, Pencil, Trash2 } from 'lucide-react'
import { formatPackagePrice } from '@/lib/format-price'
import type { PhotographyPackage } from '@/lib/types/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type PackageCardProps = {
  pkg: PhotographyPackage
  className?: string
  onEdit?: () => void
  onDelete?: () => void
  actionsDisabled?: boolean
}

export function PackageCard({
  pkg,
  className,
  onEdit,
  onDelete,
  actionsDisabled,
}: PackageCardProps) {
  const isDashboard = Boolean(onEdit || onDelete)

  return (
    <Card
      className={cn(
        'relative flex h-full flex-col overflow-hidden border-[--border]/80 bg-white/90 shadow-sm transition-all hover:border-[#7D3A52]/20 hover:shadow-md',
        pkg.is_featured && 'border-2 border-[#7D3A52]/40 ring-1 ring-[#7D3A52]/10',
        !pkg.is_active && 'opacity-60',
        className
      )}
    >
      {pkg.is_featured ? (
        <div className="flex justify-center border-b border-[#7D3A52]/15 bg-[#7D3A52]/[0.05] px-4 py-2.5">
          <Badge className="rounded-full bg-[#7D3A52] px-3 py-0.5 text-[11px] shadow-sm">
            מומלצת
          </Badge>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3 border-b border-[#7D3A52]/10 px-5 py-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-lg font-semibold text-[#100d1f]">{pkg.name}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {!pkg.is_active ? (
              <Badge variant="muted" className="text-[11px]">
                מוסתרת
              </Badge>
            ) : null}
            {pkg.duration_text ? (
              <span className="inline-flex items-center gap-1 text-xs text-[#48464c]">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {pkg.duration_text}
              </span>
            ) : null}
          </div>
        </div>

        {isDashboard ? (
          <div className="flex shrink-0 gap-1.5">
            {onEdit ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 cursor-pointer rounded-lg border-[#7D3A52]/15 bg-[#7D3A52]/[0.04] text-[--muted] shadow-sm transition-colors hover:border-[#7D3A52]/30 hover:bg-[#7D3A52]/10 hover:text-[#7D3A52]"
                onClick={onEdit}
                disabled={actionsDisabled}
                aria-label="עריכת חבילה"
                title="עריכה"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 cursor-pointer rounded-lg border-[#c9c5cd] bg-[#f7f2f4] text-[#48464c] shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                onClick={onDelete}
                disabled={actionsDisabled}
                aria-label="מחיקת חבילה"
                title="מחיקה"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <p className="text-3xl font-semibold tracking-tight text-[#100d1f]">
          {formatPackagePrice(pkg.price_amount)}
        </p>

        {pkg.includes.length > 0 ? (
          <ul className="mt-5 flex-1 space-y-2.5 border-t border-[#7D3A52]/10 pt-4">
            {pkg.includes.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-[--muted]">
                <Check
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#7D3A52]"
                  strokeWidth={2.5}
                />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[--muted]">אין פריטים ברשימת &quot;מה כלול&quot;</p>
        )}
      </div>
    </Card>
  )
}

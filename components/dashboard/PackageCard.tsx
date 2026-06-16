import { formatPackagePrice } from '@/lib/format-price'
import type { PhotographyPackage } from '@/lib/types/database.types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type PackageCardProps = {
  pkg: PhotographyPackage
  className?: string
}

export function PackageCard({ pkg, className }: PackageCardProps) {
  return (
    <Card className={cn('h-full', pkg.is_featured && 'border-2 border-[--primary]', className)}>
      <CardHeader className="space-y-3">
        <CardTitle className="text-xl">{pkg.name}</CardTitle>
        <p className="text-3xl font-semibold tracking-tight">
          {formatPackagePrice(pkg.price_amount)}
        </p>
        {pkg.duration_text ? (
          <p className="text-sm text-[--muted]">{pkg.duration_text}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {pkg.includes.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-[--muted]">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

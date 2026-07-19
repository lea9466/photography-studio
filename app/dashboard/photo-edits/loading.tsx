import { Skeleton } from '@/components/ui/skeleton'

export default function PhotoEditsLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-10 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Shown while this page's own data (photo-edit comparison pairs) is still
 * loading — app/[slug]/layout.tsx's header/footer stay mounted around this
 * the whole time, so only the content area should look like it's loading.
 * Was a bare unstyled "Loading..." div before, which read as the whole page
 * (including the chrome around it) jarringly resetting for the ~1s it takes
 * to load — a themed skeleton here keeps that transition feeling smooth.
 */
export default function BeforeAfterLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-24">
      <div className="mx-auto max-w-md space-y-3 text-center">
        <Skeleton className="mx-auto h-8 w-64" />
        <Skeleton className="mx-auto h-4 w-full" />
      </div>
      <div className="space-y-10">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  )
}

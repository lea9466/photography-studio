import { redirect } from 'next/navigation'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { getStudioPhotoEditComparisons } from '@/lib/actions/photo-edit-comparisons.actions'
import { PhotoEditsManager } from '@/components/dashboard/photo-edits/photo-edits-manager'
import { signStoragePaths } from '@/lib/storage'

export default async function PhotoEditsPage() {
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context
  const [{ data: profile }, result] = await Promise.all([
    supabase
      .from('users')
      .select('studio_name')
      .eq('id', userId)
      .maybeSingle<{ studio_name: string | null }>(),
    getStudioPhotoEditComparisons(),
  ])

  const items = result.success ? result.data ?? [] : []

  const previewPaths: string[] = []
  const watermarkedPaths: string[] = []
  for (const item of items) {
    if (item.autoApplyWatermark) {
      if (item.originalWatermarkedUrl) watermarkedPaths.push(item.originalWatermarkedUrl)
      if (item.editedWatermarkedUrl) watermarkedPaths.push(item.editedWatermarkedUrl)
    } else {
      if (item.originalImageUrl) previewPaths.push(item.originalImageUrl)
      if (item.editedImageUrl) previewPaths.push(item.editedImageUrl)
    }
  }

  const [previewUrls, watermarkedUrls] = await Promise.all([
    previewPaths.length ? signStoragePaths('previews', previewPaths) : Promise.resolve({}),
    watermarkedPaths.length
      ? signStoragePaths('watermarked', watermarkedPaths)
      : Promise.resolve({}),
  ])

  const signedUrls = { ...previewUrls, ...watermarkedUrls }

  return (
    <div className="animate-fade-in mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <div>
        <h1 className="text-2xl font-semibold">לפני ואחרי עיבוד</h1>
        <p className="mt-1 text-sm text-[--muted]">
          הציגי ללקוחות את ההבדל בין התמונה המקורית לבין התוצאה המעובדת.
        </p>
      </div>
      {!result.success ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {result.error}
        </div>
      ) : null}
      <PhotoEditsManager
        initialItems={items}
        studioName={profile?.studio_name ?? null}
        signedUrls={signedUrls}
      />
    </div>
  )
}

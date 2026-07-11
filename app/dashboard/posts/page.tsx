import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { getPosts } from '@/lib/actions/post.actions'
import { PostsManager } from '@/components/dashboard/PostsManager'
import { signStoragePaths } from '@/lib/storage'

export default async function PostsPage() {
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context

  const [{ data: profile }, posts] = await Promise.all([
    supabase
      .from('users')
      .select('studio_name, selected_theme, posts_page_title')
      .eq('id', userId)
      .maybeSingle<{
        studio_name: string | null
        selected_theme: string | null
        posts_page_title: string | null
      }>(),
    getPosts(),
  ])

  const previewPaths = posts
    .flatMap((post) => post.post_photos.map((photo) => photo.preview_url))
    .filter((path): path is string => Boolean(path))

  const signedUrls = previewPaths.length > 0
    ? await signStoragePaths('previews', previewPaths)
    : {}

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                פוסטים
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                כתבי וערכי פוסטים עם תמונות — עד 10 תמונות לכל פוסט. הפוסטים מוצגים בבלוג ובדף הבית.
              </p>
            </div>
          </div>
        </div>
        <PostsManager
          initialPosts={posts}
          userId={userId}
          studioName={profile?.studio_name}
          selectedTheme={profile?.selected_theme ?? 'elegant'}
          initialPageTitle={profile?.posts_page_title ?? null}
          signedUrls={signedUrls}
        />
      </div>
    </div>
  )
}

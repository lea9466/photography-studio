import { redirect } from 'next/navigation'
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
    <div className="animate-fade-in mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <div>
        <h1 className="text-2xl font-semibold">פוסטים</h1>
        <p className="mt-1 text-sm text-[--muted]">
          כתבי וערכי פוסטים עם תמונות. עד 10 תמונות לכל פוסט.
        </p>
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
  )
}

import { ClassicBlogPostPage, type ClassicBlogPostPageProps } from '@/components/photographer/themes/classic/ClassicBlogPostPage'

export type ClassicBlogPostShellProps = {
  pageProps: ClassicBlogPostPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ClassicBlogPostShell({ pageProps }: ClassicBlogPostShellProps) {
  return <ClassicBlogPostPage {...pageProps} />
}

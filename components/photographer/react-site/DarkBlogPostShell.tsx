import { DarkBlogPostPage, type DarkBlogPostPageProps } from '@/components/photographer/themes/dark/DarkBlogPostPage'

export type DarkBlogPostShellProps = {
  pageProps: DarkBlogPostPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function DarkBlogPostShell({ pageProps }: DarkBlogPostShellProps) {
  return <DarkBlogPostPage {...pageProps} />
}

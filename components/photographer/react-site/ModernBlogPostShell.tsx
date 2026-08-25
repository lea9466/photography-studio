import { ModernBlogPostPage, type ModernBlogPostPageProps } from '@/components/photographer/themes/modern/ModernBlogPostPage'

export type ModernBlogPostShellProps = {
  pageProps: ModernBlogPostPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ModernBlogPostShell({ pageProps }: ModernBlogPostShellProps) {
  return <ModernBlogPostPage {...pageProps} />
}

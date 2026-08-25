import { ElegantBlogPostPage, type ElegantBlogPostPageProps } from '@/components/photographer/themes/elegant/ElegantBlogPostPage'

export type ElegantBlogPostShellProps = {
  pageProps: ElegantBlogPostPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ElegantBlogPostShell({ pageProps }: ElegantBlogPostShellProps) {
  return <ElegantBlogPostPage {...pageProps} />
}

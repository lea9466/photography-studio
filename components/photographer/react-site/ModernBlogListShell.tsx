import { ModernBlogListPage, type ModernBlogListPageProps } from '@/components/photographer/themes/modern/ModernBlogListPage'

export type ModernBlogListShellProps = {
  pageProps: Omit<ModernBlogListPageProps, 'hrefForPost'>
  /** Base path to build each post card's link from, e.g. "/studio/blog". */
  blogPath: string
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ModernBlogListShell({ pageProps, blogPath }: ModernBlogListShellProps) {
  return <ModernBlogListPage {...pageProps} hrefForPost={(postId) => `${blogPath}/${postId}`} />
}

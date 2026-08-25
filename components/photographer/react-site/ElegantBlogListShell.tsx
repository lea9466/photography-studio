import { ElegantBlogListPage, type ElegantBlogListPageProps } from '@/components/photographer/themes/elegant/ElegantBlogListPage'

export type ElegantBlogListShellProps = {
  pageProps: Omit<ElegantBlogListPageProps, 'hrefForPost'>
  /** Base path to build each post card's link from, e.g. "/studio/blog". */
  blogPath: string
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ElegantBlogListShell({ pageProps, blogPath }: ElegantBlogListShellProps) {
  return <ElegantBlogListPage {...pageProps} hrefForPost={(postId) => `${blogPath}/${postId}`} />
}

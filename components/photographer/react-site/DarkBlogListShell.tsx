import { DarkBlogListPage, type DarkBlogListPageProps } from '@/components/photographer/themes/dark/DarkBlogListPage'

export type DarkBlogListShellProps = {
  pageProps: Omit<DarkBlogListPageProps, 'hrefForPost'>
  blogPath: string
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function DarkBlogListShell({ pageProps, blogPath }: DarkBlogListShellProps) {
  return <DarkBlogListPage {...pageProps} hrefForPost={(postId) => `${blogPath}/${postId}`} />
}

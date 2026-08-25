import { ClassicBlogListPage, type ClassicBlogListPageProps } from '@/components/photographer/themes/classic/ClassicBlogListPage'

export type ClassicBlogListShellProps = {
  pageProps: Omit<ClassicBlogListPageProps, 'hrefForPost'>
  /** Base path to build each post card's link from, e.g. "/studio/blog". */
  blogPath: string
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ClassicBlogListShell({ pageProps, blogPath }: ClassicBlogListShellProps) {
  return <ClassicBlogListPage {...pageProps} hrefForPost={(postId) => `${blogPath}/${postId}`} />
}

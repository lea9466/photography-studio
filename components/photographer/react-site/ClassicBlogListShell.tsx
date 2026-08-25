import { ClassicPageChrome } from './ClassicPageChrome'
import type { ClassicSiteHeaderProps } from '@/components/photographer/site-chrome/ClassicSiteHeader'
import type { ClassicSiteFooterProps } from '@/components/photographer/site-chrome/ClassicSiteFooter'
import { ClassicBlogListPage, type ClassicBlogListPageProps } from '@/components/photographer/themes/classic/ClassicBlogListPage'

export type ClassicBlogListShellProps = {
  headerProps: ClassicSiteHeaderProps
  footerProps: ClassicSiteFooterProps
  pageProps: Omit<ClassicBlogListPageProps, 'hrefForPost'>
  /** Base path to build each post card's link from, e.g. "/studio/blog". */
  blogPath: string
}

export function ClassicBlogListShell({ headerProps, footerProps, pageProps, blogPath }: ClassicBlogListShellProps) {
  return (
    <ClassicPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ClassicBlogListPage {...pageProps} hrefForPost={(postId) => `${blogPath}/${postId}`} />
    </ClassicPageChrome>
  )
}

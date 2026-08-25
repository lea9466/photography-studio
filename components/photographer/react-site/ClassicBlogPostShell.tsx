import { ClassicPageChrome } from './ClassicPageChrome'
import type { ClassicSiteHeaderProps } from '@/components/photographer/site-chrome/ClassicSiteHeader'
import type { ClassicSiteFooterProps } from '@/components/photographer/site-chrome/ClassicSiteFooter'
import { ClassicBlogPostPage, type ClassicBlogPostPageProps } from '@/components/photographer/themes/classic/ClassicBlogPostPage'

export type ClassicBlogPostShellProps = {
  headerProps: ClassicSiteHeaderProps
  footerProps: ClassicSiteFooterProps
  pageProps: ClassicBlogPostPageProps
}

export function ClassicBlogPostShell({ headerProps, footerProps, pageProps }: ClassicBlogPostShellProps) {
  return (
    <ClassicPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ClassicBlogPostPage {...pageProps} />
    </ClassicPageChrome>
  )
}

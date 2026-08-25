import { ClassicPortfolioPage, type ClassicPortfolioPageProps } from '@/components/photographer/themes/classic/ClassicPortfolioPage'

export type ClassicPortfolioShellProps = {
  pageProps: ClassicPortfolioPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ClassicPortfolioShell({ pageProps }: ClassicPortfolioShellProps) {
  return <ClassicPortfolioPage {...pageProps} />
}

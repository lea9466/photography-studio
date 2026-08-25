import { DarkPortfolioPage, type DarkPortfolioPageProps } from '@/components/photographer/themes/dark/DarkPortfolioPage'

export type DarkPortfolioShellProps = {
  pageProps: DarkPortfolioPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function DarkPortfolioShell({ pageProps }: DarkPortfolioShellProps) {
  return <DarkPortfolioPage {...pageProps} />
}

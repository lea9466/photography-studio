import { ElegantPortfolioPage, type ElegantPortfolioPageProps } from '@/components/photographer/themes/elegant/ElegantPortfolioPage'

export type ElegantPortfolioShellProps = {
  pageProps: ElegantPortfolioPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ElegantPortfolioShell({ pageProps }: ElegantPortfolioShellProps) {
  return <ElegantPortfolioPage {...pageProps} />
}

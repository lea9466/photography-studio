import { ElegantBeforeAfterPage, type ElegantBeforeAfterPageProps } from '@/components/photographer/themes/elegant/ElegantBeforeAfterPage'

export type ElegantBeforeAfterShellProps = {
  pageProps: ElegantBeforeAfterPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ElegantBeforeAfterShell({ pageProps }: ElegantBeforeAfterShellProps) {
  return <ElegantBeforeAfterPage {...pageProps} />
}

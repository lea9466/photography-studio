import { NovaClosingCta } from './NovaClosingCta'
import { NovaFooter } from './NovaFooter'
import { NovaHeader } from './NovaHeader'
import { NovaHero } from './NovaHero'
import { NovaHowItWorks } from './NovaHowItWorks'
import { NovaPrivateGalleries } from './NovaPrivateGalleries'
import { NovaShowcase } from './NovaShowcase'
import styles from './nova.module.css'

/**
 * Lea's own redesign, ported in from a standalone Vite/React scaffold
 * ("Nova Home") she built and asked to use as-is in place of the previous
 * marketing homepage — see [[project_marketing-homepage-two-zones]] memory
 * for what this replaces. `.novaRoot` carries the page's own dark theme
 * (colours, base font, background) that the source project set on `:root`/
 * `body`; scoped here instead so it can't leak onto the rest of the app —
 * see the comment at the top of nova.module.css for why.
 */
export function NovaHome() {
  return (
    <div className={styles.novaRoot}>
      <NovaHeader />
      <main>
        <NovaHero />
        <NovaShowcase />
        <NovaHowItWorks />
        <NovaClosingCta />
        <NovaPrivateGalleries />
      </main>
      <NovaFooter />
    </div>
  )
}

import { cn } from '@/lib/utils'
import { heroRootProps } from './heroRoot'
import { HeroStill } from './HeroStill'
import { HeroCtas, HeroEyebrow, HeroLead, HeroTitle } from './HeroText'
import type { HeroLayoutProps } from './types'
import styles from './TrioHeroLayout.module.css'

/** The three hero photos side by side (first one in the taller middle), title above. */
export function TrioHeroLayout(props: HeroLayoutProps) {
  const { settings } = props
  const still = (index: number, className?: string) => (
    <HeroStill
      className={cn(styles.cell, className)}
      desktopImages={props.desktopImages}
      mobileImages={props.mobileImages}
      index={index}
      alt={index === 0 ? props.studioName : ''}
    />
  )

  return (
    <section {...heroRootProps(props, styles.trio)}>
      <div className={styles.head}>
        <HeroEyebrow text={props.photographerName} show={settings.showEyebrow} />
        <HeroTitle text={props.studioName} className={styles.title} />
        <HeroLead text={props.aboutText} className={styles.lead} />
        <HeroCtas
          className={styles.ctas}
          language={props.language}
          contactHref={props.contactAnchorHref ?? '#contact'}
          galleryHref={props.galleryAnchorHref}
          showSecondary={settings.showSecondaryCta}
        />
      </div>

      <div className={styles.row}>
        {still(1)}
        {still(0, styles.middle)}
        {still(2)}
      </div>
    </section>
  )
}

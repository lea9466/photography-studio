import { heroRootProps } from './heroRoot'
import { HeroPhoto } from './HeroPhoto'
import { HeroCtas, HeroEyebrow, HeroLead, HeroTitle } from './HeroText'
import type { HeroLayoutProps } from './types'
import styles from './FrameHeroLayout.module.css'

/** The photo shown like a framed print with a margin, the studio name cut into its corner. */
export function FrameHeroLayout(props: HeroLayoutProps) {
  const { settings } = props

  return (
    <section {...heroRootProps(props, styles.frame)}>
      <div className={styles.box}>
        <HeroPhoto
          className={styles.photo}
          desktopImages={props.desktopImages}
          mobileImages={props.mobileImages}
          videoUrl={props.heroVideoUrl}
          transition={settings.transition}
          speedSeconds={settings.speedSeconds}
          alt={props.studioName}
          pinned={settings.pinOnScroll}
        />
        <div className={styles.label}>
          <HeroTitle text={props.studioName} className={styles.title} />
        </div>
      </div>

      <div className={styles.meta}>
        <div className={styles.metaText}>
          <HeroEyebrow text={props.photographerName} show={settings.showEyebrow} />
          <HeroLead text={props.aboutText} />
        </div>
        <HeroCtas
          language={props.language}
          contactHref={props.contactAnchorHref ?? '#contact'}
          galleryHref={props.galleryAnchorHref}
          showSecondary={settings.showSecondaryCta}
        />
      </div>
    </section>
  )
}

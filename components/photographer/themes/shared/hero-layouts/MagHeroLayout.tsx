import { heroRootProps } from './heroRoot'
import { HeroPhoto } from './HeroPhoto'
import { HeroCtas, HeroEyebrow, HeroLead, HeroTitle } from './HeroText'
import type { HeroLayoutProps } from './types'
import styles from './MagHeroLayout.module.css'

/** Magazine cover: the studio name across the full width, a wide photo rising beneath it. */
export function MagHeroLayout(props: HeroLayoutProps) {
  const { settings } = props

  return (
    <section {...heroRootProps(props, styles.mag)}>
      <HeroTitle text={props.studioName} className={styles.title} />
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
      <div className={styles.bottom}>
        <HeroEyebrow text={props.photographerName} show={settings.showEyebrow} />
        <HeroLead text={props.aboutText} />
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

import { heroRootProps } from './heroRoot'
import { HeroPhoto } from './HeroPhoto'
import { HeroCtas, HeroEyebrow, HeroLead, HeroTitle } from './HeroText'
import type { HeroLayoutProps } from './types'
import styles from './PanoHeroLayout.module.css'

/** A wide, low photo band between the title and the text, like a cinema frame. */
export function PanoHeroLayout(props: HeroLayoutProps) {
  const { settings } = props

  return (
    <section {...heroRootProps(props, styles.pano)}>
      <div className={styles.head}>
        <HeroEyebrow text={props.photographerName} show={settings.showEyebrow} />
        <HeroTitle text={props.studioName} className={styles.title} />
      </div>
      <HeroPhoto
        className={styles.band}
        desktopImages={props.desktopImages}
        mobileImages={props.mobileImages}
        videoUrl={props.heroVideoUrl}
        transition={settings.transition}
        speedSeconds={settings.speedSeconds}
        alt={props.studioName}
        pinned={settings.pinOnScroll}
      />
      <div className={styles.foot}>
        <HeroLead text={props.aboutText} className={styles.lead} />
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

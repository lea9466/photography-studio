import { heroRootProps } from './heroRoot'
import { HeroPhoto } from './HeroPhoto'
import { HeroCtas, HeroEyebrow, HeroLead, HeroTitle } from './HeroText'
import type { HeroLayoutProps } from './types'
import styles from './SplitHeroLayout.module.css'

/** Text column on the theme background beside a large photo; photo on top on mobile. */
export function SplitHeroLayout(props: HeroLayoutProps) {
  const { settings } = props

  return (
    <section {...heroRootProps(props, styles.split)}>
      <div className={styles.text}>
        <HeroEyebrow text={props.photographerName} show={settings.showEyebrow} />
        <HeroTitle text={props.studioName} className={styles.title} />
        <HeroLead text={props.aboutText} />
        <HeroCtas
          language={props.language}
          contactHref={props.contactAnchorHref ?? '#contact'}
          galleryHref={props.galleryAnchorHref}
          showSecondary={settings.showSecondaryCta}
        />
      </div>
      <HeroPhoto
        className={styles.photo}
        desktopImages={props.desktopImages}
        mobileImages={props.mobileImages}
        videoUrl={props.heroVideoUrl}
        transition={settings.transition}
        speedSeconds={settings.speedSeconds}
        alt={props.studioName}
      />
    </section>
  )
}

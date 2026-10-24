import { heroRootProps } from './heroRoot'
import { HeroPhoto } from './HeroPhoto'
import { HeroStill } from './HeroStill'
import { HeroCtas, HeroEyebrow, HeroLead, HeroTitle } from './HeroText'
import type { HeroLayoutProps } from './types'
import styles from './ArchHeroLayout.module.css'

/** The hero photos in an arched window, the second photo in a small circle overlapping it. */
export function ArchHeroLayout(props: HeroLayoutProps) {
  const { settings } = props

  return (
    <section {...heroRootProps(props, styles.arch)}>
      <div className={styles.text}>
        <HeroEyebrow text={props.photographerName} show={settings.showEyebrow} />
        <HeroTitle text={props.studioName} className={styles.title} />
        <HeroLead text={props.aboutText} />
        <HeroCtas
          className={styles.ctas}
          language={props.language}
          contactHref={props.contactAnchorHref ?? '#contact'}
          galleryHref={props.galleryAnchorHref}
          showSecondary={settings.showSecondaryCta}
        />
      </div>

      <div className={styles.window}>
        <span className={styles.line} aria-hidden="true" />
        <HeroPhoto
          className={styles.windowPhoto}
          desktopImages={props.desktopImages}
          mobileImages={props.mobileImages}
          videoUrl={props.heroVideoUrl}
          transition={settings.transition}
          speedSeconds={settings.speedSeconds}
          alt={props.studioName}
        />
        <HeroStill
          className={styles.dot}
          desktopImages={props.desktopImages}
          mobileImages={props.mobileImages}
          index={1}
          alt=""
        />
      </div>
    </section>
  )
}

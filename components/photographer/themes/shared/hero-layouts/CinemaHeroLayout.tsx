import { heroRootProps } from './heroRoot'
import { HeroPhoto } from './HeroPhoto'
import { HeroCtas, HeroEyebrow, HeroLead, HeroTitle } from './HeroText'
import type { HeroLayoutProps } from './types'
import styles from './CinemaHeroLayout.module.css'

/** Full-screen photo, studio name large in the middle over a soft darkening. */
export function CinemaHeroLayout(props: HeroLayoutProps) {
  const { settings } = props

  return (
    <section {...heroRootProps(props, styles.cinema)}>
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
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.content}>
        <HeroEyebrow text={props.photographerName} show={settings.showEyebrow} className={styles.eyebrow} />
        <HeroTitle text={props.studioName} accentLastWord={false} className={styles.title} />
        <span className={styles.rule} aria-hidden="true" />
        <HeroLead text={props.aboutText} className={styles.lead} />
        <HeroCtas
          className={styles.ctas}
          language={props.language}
          contactHref={props.contactAnchorHref ?? '#contact'}
          galleryHref={props.galleryAnchorHref}
          showSecondary={settings.showSecondaryCta}
        />
      </div>

      {settings.showScrollCue ? <span className={styles.cue} aria-hidden="true" /> : null}
    </section>
  )
}

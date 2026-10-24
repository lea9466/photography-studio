import type { CSSProperties } from 'react'
import { allHeroImages, pickImage } from './heroImages'
import { heroRootProps } from './heroRoot'
import { HeroCtas, HeroEyebrow, HeroLead, HeroTitle } from './HeroText'
import type { HeroLayoutProps } from './types'
import photoStyles from './HeroPhoto.module.css'
import styles from './FilmHeroLayout.module.css'

const MIN_CARDS = 6

/** Title on top, a slow strip of all the hero photos (desktop + mobile uploads) drifting beneath it. */
export function FilmHeroLayout(props: HeroLayoutProps) {
  const { settings } = props
  const images = allHeroImages(props.desktopImages, props.mobileImages)
  // Repeat the uploads so the strip is always full, then once more for a seamless loop.
  const cards = images.length
    ? Array.from({ length: Math.max(MIN_CARDS, images.length) }, (_, k) => pickImage(images, k) as string)
    : []
  const loop = [...cards, ...cards]

  return (
    <section {...heroRootProps(props, styles.film)}>
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

      <div className={styles.strip} aria-hidden="true">
        <div
          className={styles.track}
          style={{ '--hl-film-duration': `${settings.speedSeconds * cards.length * 1.6}s` } as CSSProperties}
        >
          {loop.map((src, index) => (
            <div key={index} className={`${photoStyles.photo} ${styles.card}`}>
              <img src={src} alt="" loading={index < 4 ? 'eager' : 'lazy'} decoding="async" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

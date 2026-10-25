import { heroRootProps } from './heroRoot'
import { HeroPhoto } from './HeroPhoto'
import { HeroCtas, HeroEyebrow, HeroLead, HeroTitle } from './HeroText'
import type { HeroLayoutProps } from './types'
import styles from './StampHeroLayout.module.css'

/** Shortest text that still reads as a ring — shorter names repeat until they fill it. */
const MIN_RING_CHARS = 30

function ringText(studioName: string, photographerName: string): string {
  const parts = [studioName.trim(), photographerName.trim()].filter(Boolean)
  const unique = parts.filter((part, i) => parts.indexOf(part) === i)
  const unit = `${unique.join(' ✦ ')} ✦ `
  if (!unique.length) return ''
  return unit.repeat(Math.max(1, Math.ceil(MIN_RING_CHARS / unit.length)))
}

/** A slowly turning round seal with the studio name running around it. */
function StampSeal({ text }: { text: string }) {
  if (!text) return null
  return (
    <div className={styles.seal} aria-hidden="true">
      <svg viewBox="0 0 200 200" className={styles.sealSpin}>
        <defs>
          <path id="hero-stamp-ring" d="M 100,14 a 86,86 0 1,1 0,172 a 86,86 0 1,1 0,-172" />
        </defs>
        {/* A ring, not a disc — the photo shows through the middle */}
        <circle cx="100" cy="100" r="86" strokeWidth="28" className={styles.sealRing} />
        <text className={styles.sealText}>
          <textPath href="#hero-stamp-ring" textLength="534" lengthAdjust="spacingAndGlyphs">
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  )
}

/** Inset photo with two rounded corners, the title on it, and a turning seal on its bottom corner. */
export function StampHeroLayout(props: HeroLayoutProps) {
  const { settings } = props

  return (
    <section {...heroRootProps(props, styles.stamp)}>
      <div className={styles.card}>
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
          <HeroLead text={props.aboutText} className={styles.lead} />
          <HeroCtas
            className={styles.ctas}
            language={props.language}
            contactHref={props.contactAnchorHref ?? '#contact'}
            galleryHref={props.galleryAnchorHref}
            showSecondary={settings.showSecondaryCta}
          />
        </div>

        <StampSeal text={ringText(props.studioName, props.photographerName)} />
      </div>
    </section>
  )
}

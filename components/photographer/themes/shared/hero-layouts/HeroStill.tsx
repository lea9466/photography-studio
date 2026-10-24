import { cn } from '@/lib/utils'
import { heroImageSets, pickImage } from './heroImages'
import styles from './HeroPhoto.module.css'

type HeroStillProps = {
  desktopImages: string[]
  mobileImages: string[]
  /** Which upload to show (wraps around when fewer were uploaded). */
  index: number
  alt: string
  className?: string
}

/** One fixed hero photo — the desktop upload on desktop, the mobile one on mobile. */
export function HeroStill({ desktopImages, mobileImages, index, alt, className }: HeroStillProps) {
  const { desktop, mobile } = heroImageSets(desktopImages, mobileImages)
  const desktopSrc = pickImage(desktop, index)
  const mobileSrc = pickImage(mobile, index)

  return (
    <div className={cn(styles.photo, className)}>
      {desktopSrc && mobileSrc ? (
        <picture>
          <source media="(max-width: 767px)" srcSet={mobileSrc} />
          <img
            src={desktopSrc}
            alt={alt}
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
      ) : null}
    </div>
  )
}

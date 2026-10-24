'use client'

import { useEffect, useRef, useState } from 'react'
import { HERO_EMPTY_PLACEHOLDER_TEXT } from '@/lib/hero-slideshow'
import type { HeroTransition } from '@/lib/public-site/hero-settings'
import { cn } from '@/lib/utils'
import { heroImageSets } from './heroImages'
import { HeroSlideshow } from './HeroSlideshow'
import styles from './HeroPhoto.module.css'

type HeroPhotoProps = {
  desktopImages: string[]
  mobileImages: string[]
  videoUrl?: string | null
  transition: HeroTransition
  speedSeconds: number
  alt: string
  /** Photo stays still while the page scrolls over it. */
  pinned?: boolean
  className?: string
}

/**
 * The main photo area of a hero layout: the desktop or mobile hero photos
 * rotating, with the hero video on top once it can actually play — same
 * fallback behavior as the themes' own hero backgrounds.
 */
export function HeroPhoto({
  desktopImages,
  mobileImages,
  videoUrl,
  transition,
  speedSeconds,
  alt,
  pinned = false,
  className,
}: HeroPhotoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    setVideoReady(false)
  }, [videoUrl])

  const { desktop, mobile } = heroImageSets(desktopImages, mobileImages)
  const hasImages = desktop.length > 0

  return (
    <div className={cn(styles.photo, pinned && styles.pinned, className)}>
      <div className={styles.layer}>
        {hasImages ? (
          <>
            <div className={cn(styles.layer, styles.mobileOnly)}>
              <HeroSlideshow images={mobile} alt={alt} transition={transition} speedSeconds={speedSeconds} />
            </div>
            <div className={cn(styles.layer, styles.desktopOnly)}>
              <HeroSlideshow images={desktop} alt={alt} transition={transition} speedSeconds={speedSeconds} />
            </div>
          </>
        ) : (
          <div className={cn(styles.layer, styles.empty)}>
            <p>{HERO_EMPTY_PLACEHOLDER_TEXT}</p>
          </div>
        )}

        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
            className={styles.video}
            style={{ opacity: videoReady ? 1 : 0 }}
            onCanPlay={() => {
              videoRef.current
                ?.play()
                .then(() => setVideoReady(true))
                .catch(() => setVideoReady(false))
            }}
            onError={() => setVideoReady(false)}
          />
        ) : null}
      </div>
    </div>
  )
}
